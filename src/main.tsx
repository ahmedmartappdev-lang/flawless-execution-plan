import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./lib/pushNotifications";

createRoot(document.getElementById("root")!).render(<App />);

// Silently register the service worker so Web Push is available once the
// customer opts in. No permission is requested here — that only happens
// when the user explicitly clicks "Enable notifications" in ProfilePage.
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    void registerServiceWorker();
  });
}
