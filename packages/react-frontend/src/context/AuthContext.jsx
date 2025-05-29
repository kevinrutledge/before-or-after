import { createContext, useState, useEffect, useContext } from "react";
import {
  setAuthToken,
  removeAuthToken,
  isAuthenticated as checkAuth,
  getCurrentUser,
  setGuestMode,
  isGuestMode as checkGuestMode,
  clearGuestMode
} from "../utils/authUtils";
import { useGame } from "./GameContext";

// Create auth context
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(checkAuth());
  const [isGuest, setIsGuest] = useState(checkGuestMode());
  const [user, setUser] = useState(getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);

  const { migrateGuestScores } = useGame();

  // Check auth status on mount and when localStorage changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const authenticated = checkAuth();
      const guestMode = checkGuestMode();

      setIsAuthenticated(authenticated);
      setIsGuest(guestMode && !authenticated);
      setUser(authenticated ? getCurrentUser() : null);
      setIsLoading(false);
    };

    // Check on mount
    checkAuthStatus();

    // Listen for storage events
    window.addEventListener("storage", checkAuthStatus);
    return () => window.removeEventListener("storage", checkAuthStatus);
  }, []);

  // Login function
  const login = (token) => {
    setAuthToken(token);
    setIsAuthenticated(true);
    setIsGuest(false);
    clearGuestMode(); // Clear guest mode when logging in
    setUser(getCurrentUser());
    migrateGuestScores();
  };

  // Logout function
  const logout = () => {
    removeAuthToken();
    setIsAuthenticated(false);
    setUser(null);
  };

  // Enable guest mode
  const enableGuestMode = () => {
    if (!isAuthenticated) {
      setGuestMode(true);
      setIsGuest(true);
    }
  };

  // Disable guest mode
  const disableGuestMode = () => {
    clearGuestMode();
    setIsGuest(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isGuest,
        user,
        isLoading,
        login,
        logout,
        enableGuestMode,
        disableGuestMode
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
