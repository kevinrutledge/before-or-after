import { createContext, useState, useEffect } from "react";
import {
  setAuthToken,
  removeAuthToken,
  isAuthenticated as checkAuth,
  getCurrentUser
} from "../utils/authUtils";

// Create auth context
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(checkAuth());
  const [user, setUser] = useState(getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);

  // Check auth status on mount and when localStorage changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const authenticated = checkAuth();

      setIsAuthenticated(authenticated);
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
    setUser(getCurrentUser());
  };

  // Logout function
  const logout = () => {
    removeAuthToken();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        login,
        logout
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
