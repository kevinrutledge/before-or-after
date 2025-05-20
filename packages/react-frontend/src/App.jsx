import { AuthProvider } from "./context/AuthContext";
import { GameProvider } from "./context/GameContext";
import AppRouter from "./routes/Router";

function App() {
  return (
    <div className="app">
      <AuthProvider>
        <GameProvider>
          <AppRouter />
        </GameProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
