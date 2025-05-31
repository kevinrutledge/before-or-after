/**
 * Mock auth context for testing.
 */
import { createContext, useContext } from "react";

// Create mock context
const AuthContext = createContext();

// Mock auth provider props
const defaultValue = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  login: () => {},
  logout: () => {}
};

/**
 * Mock auth provider component.
 */
export function MockAuthProvider({ children, value = defaultValue }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Mock useAuth hook that matches real implementation.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
