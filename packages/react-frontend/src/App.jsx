import { AuthProvider } from "./context/AuthContext";
import { GameProvider } from "./context/GameContext";
import AppRouter from "./routes/Router";
import { useEffect } from "react";
import { useGame } from "./context/GameContext";
import { isAuthenticated } from "./utils/authUtils";

function App() {

  const { setIsLoggedIn } = isAuthenticated();
  
  // Listen for storage events to sync auth state across tabs
  // useEffect(() => {
  //   function handleStorageChange() {
  //     setIsLoggedIn(isAuthenticated());
  //   }
  //   window.addEventListener("storage", handleStorageChange);
  //   return () => window.removeEventListener("storage", handleStorageChange);
  // }, [setIsLoggedIn]);

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
