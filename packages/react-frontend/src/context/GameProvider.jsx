import { useState, useEffect, useRef } from "react";
import { GameContext } from "./GameContext";
import { useAuth } from "../hooks/useAuth";
import { authRequest } from "../utils/apiClient";

export function GameProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [score, setScore] = useState(0);
  const [highscore, setHighscore] = useState(0);
  const [gameStatus, setGameStatus] = useState("idle");

  // Track previous auth state for sign-out detection
  const previousAuthRef = useRef(isAuthenticated);

  // Load scores based on authentication state
  useEffect(() => {
    const wasAuthenticated = previousAuthRef.current;
    const isNowAuthenticated = isAuthenticated;

    if (isNowAuthenticated && user && !wasAuthenticated) {
      // Sign-in flow: merge local and remote scores
      const localHighScore = parseInt(localStorage.getItem("highScore")) || 0;
      const remoteHighScore = user.highScore || 0;

      // Use maximum high score between local and remote
      const mergedHighScore = Math.max(localHighScore, remoteHighScore);

      // Load current score from user data
      setScore(user.currentScore || 0);
      setHighscore(mergedHighScore);

      // Update remote if local was higher
      if (localHighScore > remoteHighScore) {
        (async () => {
          try {
            await updateScoresAPI(user.currentScore || 0, mergedHighScore);
          } catch (error) {
            console.error("Failed to update scores:", error);
          }
        })();
      }

      // Clear localStorage since scores now managed remotely
      localStorage.removeItem("score");
      localStorage.removeItem("highScore");
    } else if (isNowAuthenticated && user && wasAuthenticated) {
      // Authenticated user already loaded, loading scores from user data
      setScore(user.currentScore || 0);
      setHighscore(user.highScore || 0);
    } else if (wasAuthenticated && !isNowAuthenticated) {
      // Sign-out flow: preserve high score in localStorage
      setScore(() => {
        setHighscore((currentHighScore) => {
          localStorage.setItem("score", "0");
          localStorage.setItem("highScore", currentHighScore.toString());
          return currentHighScore;
        });
        return 0;
      });
    } else if (!isNowAuthenticated && !wasAuthenticated) {
      // Guest user flow: load from localStorage
      const localScore = parseInt(localStorage.getItem("score")) || 0;
      const localHighScore = parseInt(localStorage.getItem("highScore")) || 0;

      setScore(localScore);
      setHighscore(localHighScore);
    }

    // Update previous auth state for next comparison
    previousAuthRef.current = isNowAuthenticated;
  }, [isAuthenticated, user]);

  // Persist scores to appropriate storage
  const persistScores = async (newScore, newHighscore) => {
    if (isAuthenticated) {
      try {
        await updateScoresAPI(newScore, newHighscore);
      } catch (error) {
        console.error("Failed to update scores:", error);
      }
    } else {
      // Store in localStorage for guest users
      localStorage.setItem("score", newScore.toString());
      localStorage.setItem("highScore", newHighscore.toString());
    }
  };

  // Update scores via API call
  const updateScoresAPI = async (currentScore, highScore) => {
    try {
      await authRequest("/api/scores/update", {
        method: "POST",
        body: JSON.stringify({
          currentScore: currentScore,
          highScore: highScore
        })
      });
    } catch (error) {
      console.error("Failed to update scores:", error);
      throw error;
    }
  };

  const incrementScore = () => {
    const newScore = score + 1;
    const newHighscore = Math.max(newScore, highscore);

    setScore(newScore);
    setHighscore(newHighscore);

    persistScores(newScore, newHighscore);
  };

  const resetScore = () => {
    const newScore = 0;

    setScore(newScore);

    // Only persist for authenticated users
    if (isAuthenticated) {
      persistScores(newScore, highscore);
    }
  };

  const value = {
    score,
    highscore,
    gameStatus,
    incrementScore,
    resetScore,
    setGameStatus
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
