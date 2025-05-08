import { useState } from "react";

function App() {
  const [gameState, setGameState] = useState({
    isPlaying: false,
    currentRound: 0,
    score: 0
  });

  return (
    <div className="app-container">
      <header>
        <h1>Before or After</h1>
      </header>

      <main>
        {!gameState.isPlaying ? (
          <div className="start-screen">
            <h2>Ready to play?</h2>
            <p>Guess if the release year is before or after!</p>
            <button
              onClick={() =>
                setGameState({ ...gameState, isPlaying: true, currentRound: 1 })
              }
              className="start-button">
              Start Game
            </button>
          </div>
        ) : (
          <div className="game-board">
            <div className="game-info">
              <div>Round: {gameState.currentRound}</div>
              <div>Score: {gameState.score}</div>
            </div>

            {/* Game content will go here */}
            <div className="game-content">
              <div className="card">
                <h3>Item Name</h3>
                <div className="item-image">
                  {/* Item image will go here */}
                  <div className="placeholder-image">Image Placeholder</div>
                </div>
                <p>Is the release year before or after than XXXX?</p>
                <div className="guess-buttons">
                  <button className="lower-button">Lower</button>
                  <button className="higher-button">Higher</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer>
        <p>Before or After &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;
