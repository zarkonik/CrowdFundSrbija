import { ThirdwebProvider } from "thirdweb/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { StateContextProvider } from "./context/index.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThirdwebProvider>
      <Router>
        <StateContextProvider>
          <App />
        </StateContextProvider>
      </Router>
    </ThirdwebProvider>
  </StrictMode>,
);
