import { createContext, useState, useEffect, useContext } from "react";
import { useAuth } from "./AuthContext";

const GameContext = createContext();

// Storage keys for scores
const GUEST_SCORE_KEY = "guestScore";
const GUEST_HIGHSCORE_KEY = "guestHighscore";

export function GameProvider({ children }) {
  const { isAuthenticated, isGuest, user } = useAuth();

  const [score, setScore] = useState(0);
  //const [highscore, setHighscore] = useState(0);
  const [highscore, setHighscore] = useState(() => {
    if (isAuthenticated && user?.email) {
      return parseInt(
        localStorage.getItem(`userHighscore_${user.email}`) || "0",
        10
      );
    }
    if (isGuest) {
      return parseInt(localStorage.getItem(GUEST_HIGHSCORE_KEY) || "0", 10);
    }

    return parseInt(localStorage.getItem(GUEST_HIGHSCORE_KEY) || "0", 10);
  });
  const [gameStatus, setGameStatus] = useState("not-started"); // or "playing", "lost", etc.

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
        console.log("Not authenticated or guest, resetting scores");
        //setHighscore(0);
      }
    };
    loadScores();
  }, [isAuthenticated, isGuest, user]);

  useEffect(() => {
    console.log("score was updated", score);
    if (isAuthenticated && user?.email) {
      localStorage.setItem(`userScore_${user.email}`, score.toString());
    } else if (isGuest) {
      localStorage.setItem(GUEST_SCORE_KEY, score.toString());
    }
  }, [score]);

  useEffect(() => {
    //console.log("Setting highscoreNEW ONE", highscore);
    if (isAuthenticated && user?.email) {
      localStorage.setItem(`userHighscore_${user.email}`, highscore.toString());
    } else if (isGuest) {
      localStorage.setItem(GUEST_HIGHSCORE_KEY, highscore.toString());
    }
    //console.log("Setting guest highscore", highscore, savedHighscore);
  }, [highscore]);

  // Save scores whenever they change

  //This block can auto update highscore anytime score is updated, but has delay issues resulting in incorrect data storage
  // useEffect(() => {
  //   console.log("highscore", highscore);
  //   if (score > highscore) {
  //     setHighscore(score);
  //     if (isAuthenticated && user?.email) {
  //       localStorage.setItem(
  //         `userHighscore_${user.email}`,
  //         highscore.toString()
  //       );
  //       //fix the check for guest vs non guest and non authenticated
  //     } else {
  //       localStorage.setItem(GUEST_HIGHSCORE_KEY, highscore.toString());
  //     }
  //   }
  // }, [score]);

  // Increment score and update highscore if needed
  const incrementScore = () => {
    setScore((prevScore) => {
      const newScore = prevScore + 1;
      if (newScore > highscore) {
        setHighscore(newScore);
        // Save highscore immediately
        if (isAuthenticated && user?.email) {
          localStorage.setItem(
            `userHighscore_${user.email}`,
            newScore.toString()
          );
        } else if (isGuest) {
          localStorage.setItem(GUEST_HIGHSCORE_KEY, newScore.toString());
        } else {
          localStorage.setItem(GUEST_HIGHSCORE_KEY, newScore.toString());
        }
      }
      return newScore;
    });
  };
  // Update score (called when game ends)
  const updateScore = () => {
    console.log("updateScore", score);
    if (isAuthenticated && user?.email) {
      console.log("is authenticated", user.email);
      localStorage.setItem(`userScore_${user.email}`, score.toString());

      if (score > highscore) {
        console.log("new highscore", score);
        setHighscore(score);
        localStorage.setItem(`userHighscore_${user.email}`, score.toString());
      }
    } else if (isGuest) {
      console.log("update guest score", score);
      localStorage.setItem(GUEST_SCORE_KEY, score.toString());

      if (score > highscore) {
        setHighscore(score);
        localStorage.setItem(GUEST_HIGHSCORE_KEY, score.toString());
      }
    } else {
      localStorage.setItem(GUEST_SCORE_KEY, score.toString());

      if (score > highscore) {
        setHighscore(score);
        localStorage.setItem(GUEST_HIGHSCORE_KEY, score.toString());
      }
    }
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
        resetScore,
        migrateGuestScores,
        updateScore
      }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
