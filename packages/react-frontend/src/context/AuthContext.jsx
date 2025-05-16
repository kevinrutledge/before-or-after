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

// Create auth context
const AuthContext = createContext();

/**
 * Provide authentication state and methods to the app.
 */
export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(checkAuth());
  const [isGuest, setIsGuest] = useState(checkGuestMode());
  const [user, setUser] = useState(getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);

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

    // Listen for storage events (when localStorage changes in another tab)
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Login function
  const login = (token) => {
    setAuthToken(token);
    setIsAuthenticated(true);
    setIsGuest(false);
    clearGuestMode(); // Clear guest mode when logging in
    setUser(getCurrentUser());
  };

  // Logout function
  const logout = () => {
    removeAuthToken();
    setIsAuthenticated(false);
    setUser(null);
    // Note: We don't automatically switch to guest mode on logout
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

  // Auth context value
  const value = {
    isAuthenticated,
    isGuest,
    user,
    isLoading,
    login,
    logout,
    enableGuestMode,
    disableGuestMode
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
