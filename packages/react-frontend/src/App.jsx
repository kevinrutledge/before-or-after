import { GameProvider } from "./context/GameContext";
import AppRouter from "./routes/Router";

function App() {
  return (
    <div className="app">
      <GameProvider>
        <AppRouter />
      </GameProvider>
    </div>
  );
}

export default App;
