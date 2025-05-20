import { createContext, useState, useEffect, useContext } from "react";
import { useAuth } from "./AuthContext";


const GameContext = createContext();

// Storage keys for scores
const GUEST_SCORE_KEY = "guestScore";
const GUEST_HIGHSCORE_KEY = "guestHighscore";

export function GameProvider({ children }) {
  const [score, setScore] = useState(0);
  const [highscore, setHighscore] = useState(0);
  const [gameStatus, setGameStatus] = useState("not-started"); // or "playing", "lost", etc.
  const { isAuthenticated, isGuest, user } = useAuth();

  // Load scores from storage or API based on auth state
  useEffect(() => {
    const loadScores = async () => {
      if (isAuthenticated) {
        // If authenticated, we would normally fetch from API
        // For this MVP, we'll use localStorage but with different keys
        const savedScore =
          localStorage.getItem(`userScore_${user?.email}`) || "0";
        const savedHighscore =
          localStorage.getItem(`userHighscore_${user?.email}`) || "0";

        setScore(parseInt(savedScore, 10));
        setHighscore(parseInt(savedHighscore, 10));
      } else if (isGuest) {
        // Load guest scores from localStorage
        const savedScore = localStorage.getItem(GUEST_SCORE_KEY) || "0";
        const savedHighscore = localStorage.getItem(GUEST_HIGHSCORE_KEY) || "0";

        setScore(parseInt(savedScore, 10));
        setHighscore(parseInt(savedHighscore, 10));
      } else {
        // Not authenticated or guest, reset scores
        setScore(0);
        setHighscore(0);
      }
    };

    loadScores();
  }, [isAuthenticated, isGuest, user]);

  // Save scores whenever they change
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      localStorage.setItem(`userScore_${user.email}`, score.toString());

      if (score > highscore) {
        setHighscore(score);
        localStorage.setItem(`userHighscore_${user.email}`, score.toString());
      }
    } else if (isGuest) {
      localStorage.setItem(GUEST_SCORE_KEY, score.toString());

      if (score > highscore) {
        setHighscore(score);
        localStorage.setItem(GUEST_HIGHSCORE_KEY, score.toString());
      }
    }
  }, [score, highscore, isAuthenticated, isGuest, user]);

  // Increment score and update highscore if needed
  const incrementScore = () => {
    setScore((prevScore) => {
      const newScore = prevScore + 1;
      return newScore;
    });
  };

  // Reset score
  const resetScore = () => {
    setScore(0);
  };

  // Migrate guest scores to user account
  const migrateGuestScores = () => {
    if (isAuthenticated && user?.email) {
      const guestHighscore = parseInt(
        localStorage.getItem(GUEST_HIGHSCORE_KEY) || "0",
        10
      );
      const userHighscore = parseInt(
        localStorage.getItem(`userHighscore_${user.email}`) || "0",
        10
      );

      // Only migrate if guest highscore is higher than user's current highscore
      if (guestHighscore > userHighscore) {
        setHighscore(guestHighscore);
        localStorage.setItem(
          `userHighscore_${user.email}`,
          guestHighscore.toString()
        );
      }

      // Clear guest scores
      localStorage.removeItem(GUEST_SCORE_KEY);
      localStorage.removeItem(GUEST_HIGHSCORE_KEY);
    }
  };

//increments score and changes game status
const handleCorrectGuess = () => {
  setScore(prev => prev + 1);
  setGameStatus("correct");
};

//updates highscore and changes game status
const handleIncorrectGuess = () =>{
  //update high score
  if(score > highscore){
    setHighscore(score)
  }

  setGameStatus('incorrect');
}

  

  return (
    <GameContext.Provider
      value={{
        score,
        setScore,
        highscore,
        setHighscore,
        gameStatus,
        handleCorrectGuess,
        handleIncorrectGuess,
        setGameStatus,
        incrementScore,
        resetScore,
        migrateGuestScores
      }}>
      {children}
    </GameContext.Provider>
  );
}



export function useGame() {
  return useContext(GameContext);
}
