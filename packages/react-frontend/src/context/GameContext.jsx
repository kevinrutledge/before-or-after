import { createContext, useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { authRequest } from "../utils/apiClient";

const GameContext = createContext();
export { GameContext };

export function GameProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [score, setScore] = useState(0);
  const [highscore, setHighscore] = useState(null);

  // Load scores from authenticated user
  useEffect(() => {
    const timer = setTimeout(() => {
    if (isAuthenticated && user) {
      const s = user.currentScore || 0;
      const h = user.highScore ?? 0;
      console.log("GameProvider useEffect triggered {score: ", s, ", highscore: ", h, "}");

      setScore(s);
      setHighscore(h);

    } else {
      console.log("GameProvider useEffect triggered for unauthenticated user");
      setScore(0);
      setHighscore(0);
    }
  }, 500);
  return () => clearTimeout(timer);


  }, [isAuthenticated, user]);

  // Increment score and update highscore
  const incrementScore = async () => {
    const newScore = score + 1;
    const newHighScore = Math.max(newScore, highscore);

    setScore(newScore);
    setHighscore(newHighScore);

    // Save to database if authenticated
    if (isAuthenticated) {
      console.log("SAVE: { currentScore: ", newScore, ", highScore: ", newHighScore, " }");
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

  useEffect(() => {
    // Save highscore to localStorage for non-authenticated users
    console.log("Highscore updated:", highscore);
  }, [highscore]);

  // Reset current score to zero
  const resetScore = async () => {

    if (highscore === null) {
      console.warn("Reset skipped: highscore not yet loaded.");
      return;
    }

    setScore(0);

    // Save reset to database if authenticated
    if (isAuthenticated && highscore !== null ) {
      try {
        await authRequest("/api/scores/update", {
          method: "POST",
          body: JSON.stringify({
            currentScore: 0,
            highScore: highscore
          })
        });
      } catch (error) {
        console.error("Failed to update scores:", error);
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
