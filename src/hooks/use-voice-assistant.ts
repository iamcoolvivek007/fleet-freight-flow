import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiDbService } from '@/lib/ai-db-service';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const useVoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const navigate = useNavigate();
  const { toast } = useToast();

  const addMessage = useCallback((role: 'user' | 'model', text: string) => {
    setMessages((prev) => [...prev, { role, text }]);
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && !isSpeaking) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Failed to start recognition", e);
      }
    }
  }, [isListening, isSpeaking]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ta-IN';

    // Attempt to find a Tamil voice
    const voices = synthRef.current.getVoices();
    const tamilVoice = voices.find(voice => voice.lang.includes('ta'));
    if (tamilVoice) {
      utterance.voice = tamilVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      // Continuous conversation: start listening again after speaking
      startListening();
    };
    utterance.onerror = (e) => {
        console.error("Speech synthesis error", e);
        setIsSpeaking(false);
    }

    synthRef.current.speak(utterance);
  }, [startListening]);

  const processUserRequest = useCallback(async (userText: string) => {
    try {
        const systemPrompt = `
          You are a helpful voice assistant for a logistics management application called 'FreightFlow'.
          You speak Tamil. The user speaks Tamil.
          You have access to the following data and capabilities:
          - Trucks (List, Add)
          - Loads (List, Add)
          - Transactions (List, Add)
          - Load Providers (List, Add)
          - Navigation (Go to specific pages)

          Available Routes for Navigation:
          - /dashboard
          - /trucks
          - /loads
          - /transactions
          - /load-providers
          - /reports

          Your goal is to understand the user's intent from their Tamil input and respond in Tamil.

          IF the user wants to PERFORM AN ACTION (like navigating or fetching data), you must return a strictly formatted JSON object.

          JSON Formats:
          1. Navigation: { "action": "navigate", "route": "/route-path", "response": "Tamil text confirming navigation" }
          2. Fetch Data: { "action": "fetch", "entity": "trucks" | "loads" | "transactions" | "providers", "response": "Tamil text introducing the data" }
          3. General Chat: { "action": "chat", "response": "Tamil response to the user" }

          Examples:
          User: "Dashboard poga vendum" (I want to go to dashboard)
          You: { "action": "navigate", "route": "/dashboard", "response": "Sheri, dashboard sellukiren." }

          User: "Yellam trucks kattu" (Show all trucks)
          You: { "action": "fetch", "entity": "trucks", "response": "Ivai thaan ungalin trucks." }

          User: "Vanakkam" (Hello)
          You: { "action": "chat", "response": "Vanakkam! Ungaluku eppadi udhavalam?" }

          Please respond ONLY with the JSON object. Do not include markdown formatting like \`\`\`json.
        `;

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: "model",
                    parts: [{ text: `{"action": "chat", "response": "Vanakkam, nan ungal udhaviyaalan. Enna seiya vendum?"}` }]
                }
            ],
        });

        const result = await chat.sendMessage(userText);
        const responseText = result.response.text();

        console.log("Gemini Raw Response:", responseText);

        let parsedResponse;
        try {
            // Clean up potentially markdown formatted JSON
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            parsedResponse = JSON.parse(cleanJson);
        } catch (e) {
            console.error("Failed to parse Gemini JSON response", e);
            // Fallback if Gemini doesn't return valid JSON
            speak("Mannikavum, ennal purinthu kolla mudiyavillai.");
            addMessage('model', "Mannikavum, ennal purinthu kolla mudiyavillai.");
            return;
        }

        addMessage('model', parsedResponse.response);
        speak(parsedResponse.response);

        // Execute Actions
        if (parsedResponse.action === 'navigate') {
            navigate(parsedResponse.route);
        } else if (parsedResponse.action === 'fetch') {
             let data;
             switch(parsedResponse.entity) {
                 case 'trucks':
                     navigate('/trucks');
                     data = await aiDbService.getTrucks();
                     break;
                 case 'loads':
                     navigate('/loads');
                     data = await aiDbService.getLoads();
                     break;
                 case 'transactions':
                     navigate('/transactions');
                     data = await aiDbService.getTransactions();
                     break;
                 case 'providers':
                     navigate('/load-providers');
                     data = await aiDbService.getLoadProviders();
                     break;
             }
             console.log(`Fetched ${parsedResponse.entity}:`, data);
        }

    } catch (error) {
        console.error("Error processing user request:", error);
        speak("Thavaru yerpattullathu. Meendum muyarchi seiyyavum."); // An error occurred. Please try again.
        addMessage('model', "Thavaru yerpattullathu. Meendum muyarchi seiyyavum.");
    }
  }, [addMessage, navigate, speak]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // We handle restarting manually
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'ta-IN'; // Tamil India

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
           toast({
            title: "Microphone Access Denied",
            description: "Please allow microphone access to use the voice assistant.",
            variant: "destructive",
          });
        }
      };

      recognitionRef.current.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('User said:', transcript);
        addMessage('user', transcript);
        await processUserRequest(transcript);
      };
    } else {
      console.error('Speech Recognition API not supported in this browser.');
      toast({
            title: "Not Supported",
            description: "Speech Recognition API not supported in this browser.",
            variant: "destructive",
          });
    }

    const synth = synthRef.current;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      synth.cancel();
    };
  }, [addMessage, processUserRequest, toast]); // Now deps are stable

  return {
    isListening,
    isSpeaking,
    messages,
    startListening,
    stopListening
  };
};
