import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import "./App.css";
import AppRouter from "./routes/Router.jsx"; // ✅ this points to your Router.jsx file
import { GameProvider } from "./context/GameContext.jsx";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <GameProvider>
      <AppRouter />
    </GameProvider>
  </StrictMode>
);
