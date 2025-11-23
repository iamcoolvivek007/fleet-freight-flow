import React, { useRef, useEffect } from 'react';
import { useVoiceAssistant } from '@/hooks/use-voice-assistant';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, X, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export const VoiceAssistant: React.FC = () => {
    const { isListening, isSpeaking, messages, startListening, stopListening } = useVoiceAssistant();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = React.useState(false);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages, isOpen]);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        size="icon"
                        className={cn(
                            "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
                            isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-primary hover:bg-primary/90",
                            isSpeaking ? "ring-4 ring-green-400" : ""
                        )}
                        onClick={() => {
                            if (!isOpen) {
                                // If opening, we can optionally start listening immediately or wait for user to press mic inside
                            }
                        }}
                    >
                        {isListening ? <Mic className="h-6 w-6 text-white" /> : <MessageSquare className="h-6 w-6 text-white" />}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 h-96 p-0 mr-4 mb-2 flex flex-col bg-background border-border shadow-xl rounded-xl overflow-hidden" side="top" align="end">
                    <div className="p-3 bg-muted/50 border-b flex justify-between items-center">
                        <h3 className="font-semibold text-sm">Tamil Voice Assistant</h3>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                        <div className="space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center text-muted-foreground text-sm mt-10">
                                    <p>Vanakkam! How can I help you today?</p>
                                    <p className="text-xs mt-2">(Press the mic button to speak)</p>
                                </div>
                            )}
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "flex w-full",
                                        msg.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                                            msg.role === 'user'
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-foreground"
                                        )}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isSpeaking && (
                                <div className="flex justify-start">
                                    <div className="bg-muted text-foreground max-w-[80%] rounded-lg px-3 py-2 text-sm flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <div className="p-4 bg-background border-t flex justify-center items-center gap-2">
                        <Button
                            variant={isListening ? "destructive" : "default"}
                            size="icon"
                            className={cn("h-12 w-12 rounded-full", isListening && "animate-pulse")}
                            onClick={isListening ? stopListening : startListening}
                        >
                            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </Button>
                        <div className="text-xs text-muted-foreground absolute bottom-2 right-4">
                            {isListening ? "Listening..." : isSpeaking ? "Speaking..." : "Idle"}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};
