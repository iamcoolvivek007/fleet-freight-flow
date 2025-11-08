import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

/**
 * @file main.tsx
 * @description The entry point of the application.
 */
createRoot(document.getElementById("root")!).render(<App />);
