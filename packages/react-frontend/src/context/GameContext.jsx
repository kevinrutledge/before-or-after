import React, { createContext, useState, useContext, useEffect } from "react";

const GameContext = createContext();

export function GameProvider({ children }) {
  const [score, setScore] = useState(0);
  //sets highscore to 0 if nothing is found locally
  const [highscore, setHighscore] = useState(() => {
    const storedHighScore = localStorage.getItem("highscore");
    //if saved high score is gound
    if (storedHighScore !== null){
      return parseInt(storedHighScore, 10);
    }
    //if no saved high score is found
    else{
      return 0
    }});

  
  const [gameStatus, setGameStatus] = useState("initial"); // 'initial', 'playing', 'correct' 'incorrect' 'reshuffling'

  
  //anytime highscore is changed, save new value locally
  useEffect(() => {
    localStorage.setItem("highscore", highscore.toString());
  }, [highscore])


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
        setGameStatus, 
        handleCorrectGuess,
        handleIncorrectGuess,
      }}>
      {children}
    </GameContext.Provider>
  );
}



export function useGame() {
  return useContext(GameContext);
}
