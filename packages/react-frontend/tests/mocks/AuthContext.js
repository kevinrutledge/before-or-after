import React, { createContext, useContext } from "react";

export const AuthContext = createContext();

const defaultValue = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  login: () => {},
  logout: () => {}
};

export function MockAuthProvider({ children, value = defaultValue }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// NEW: A generic provider for compatibility with app code
export function AuthProvider({ children, value }) {
  return (
    <AuthContext.Provider value={value || defaultValue}>
      {children}
    </AuthContext.Provider>
  );
}
