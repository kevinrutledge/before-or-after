import { createContext, useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { authRequest } from "../utils/apiClient";

const GameContext = createContext();
export { GameContext };

export function GameProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [score, setScore] = useState(0);
  const [highscore, setHighscore] = useState(0);

  // Load scores from authenticated user
  useEffect(() => {
    if (isAuthenticated && user) {
      setScore(user.currentScore || 0);
      setHighscore(user.highScore || 0);
    } else {
      setScore(0);
      setHighscore(0);
    }
  }, [isAuthenticated, user]);

  // Increment score and update highscore
  const incrementScore = async () => {
    const newScore = score + 1;
    const newHighScore = Math.max(newScore, highscore);

    setScore(newScore);
    setHighscore(newHighScore);

    // Save to database if authenticated
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
      }
    }
  };

  // Reset current score to zero
  const resetScore = async () => {
    setScore(0);

    // Save reset to database if authenticated
    if (isAuthenticated) {
      try {
        await authRequest("/api/scores/update", {
          method: "POST",
          body: JSON.stringify({
            currentScore: 0,
            highScore: highscore
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
        highscore,
        incrementScore,
        resetScore
      }}>
      {children}
    </GameContext.Provider>
  );
}
