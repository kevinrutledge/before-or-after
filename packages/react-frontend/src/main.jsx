import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import "./App.css";
import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

if (window.Cypress) {
  import("./utils/gameUtils").then((mod) => {
    window.compareCards = mod.compareCards;
  });
}
