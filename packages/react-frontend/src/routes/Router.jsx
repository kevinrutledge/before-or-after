import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "../App"; 
//import Game from "../pages/GamePage";
import Loss from "../pages/LossPage";
import { GameProvider } from "../context/GameContext";

export default function AppRouter() {
  return (
    <BrowserRouter>
        <GameProvider>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/game" element={<Loss />} /> 
                <Route path="/loss" element={<Loss />} />
            </Routes>
        </GameProvider>
    </BrowserRouter>
  );
}
