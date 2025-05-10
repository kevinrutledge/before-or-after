// src/context/GameContext.jsx
import React, { createContext, useState, useContext } from "react";

const GameContext = createContext();

export function GameProvider({ children }) {
  const [score, setScore] = useState(0);
  const [highscore, setHighscore] = useState(0);
  const [gameStatus, setGameStatus] = useState("not-started"); // or "playing", "lost", etc.

  return (
    <GameContext.Provider
      value={{
        score,
        setScore,
        highscore,
        setHighscore,
        gameStatus,
        setGameStatus
      }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
