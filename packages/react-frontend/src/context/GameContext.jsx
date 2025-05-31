import { createContext, useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { authRequest } from "../utils/apiClient";

const GameContext = createContext();
export { GameContext };

export function GameProvider({ children }) {
  const { isAuthenticated, user } = useAuth();

  const [score, setScore] = useState(0);
  const [highscore, setHighscore] = useState(0);
  const [gameStatus, setGameStatus] = useState("not-started");

  // Load scores from user authentication data when auth state changes
  useEffect(() => {
    const loadScores = () => {
      if (isAuthenticated && user) {
        // Load scores from authenticated user data
        setScore(user.currentScore || 0);
        setHighscore(user.highScore || 0);
      } else {
        // Unauthenticated users start with zero scores
        setScore(0);
        setHighscore(0);
      }
    };

    loadScores();
  }, [isAuthenticated, user]);

  // Increment score and update highscore when needed
  const incrementScore = async () => {
    const newScore = score + 1;
    const newHighScore = Math.max(newScore, highscore);

    // Update local state immediately for responsive UI
    setScore(newScore);
    if (newScore > highscore) {
      setHighscore(newHighScore);
    }

    // Persist to database when authenticated
    if (isAuthenticated) {
      try {
        await authRequest("/api/scores/update", {
          method: "POST",
          body: JSON.stringify({
            currentScore: newScore,
            highScore: newHighScore
          })
        });
      } catch (error) {
        console.error("Failed to update scores:", error);
        // Note: UI remains responsive even when API fails
      }
    }
  };

  // Reset score to zero
  const resetScore = async () => {
    setScore(0);

    // Persist reset to database when authenticated
    if (isAuthenticated) {
      try {
        await authRequest("/api/scores/update", {
          method: "POST",
          body: JSON.stringify({
            currentScore: 0,
            highScore: highscore // Keep existing high score
          })
        });
      } catch (error) {
        console.error("Failed to reset score:", error);
      }
    }
  };

  return (
    <GameContext.Provider
      value={{
        score,
        setScore,
        highscore,
        setHighscore,
        gameStatus,
        setGameStatus,
        incrementScore,
        resetScore
      }}>
      {children}
    </GameContext.Provider>
  );
}
