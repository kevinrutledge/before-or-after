import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import "./App.css";
import AppRouter from "./routes/Router.jsx";
import { GameProvider } from "./context/GameContext.jsx";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <GameProvider>
      <AppRouter />
    </GameProvider>
  </StrictMode>
);
