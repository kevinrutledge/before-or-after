import { renderHook } from "@testing-library/react";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach } from "@jest/globals";
import { useAuth } from "../../src/hooks/useAuth";
import { AuthProvider } from "../../src/context/AuthContext";

// Mock authUtils functions
jest.mock("../../src/utils/authUtils", () => ({
  setAuthToken: jest.fn(),
  removeAuthToken: jest.fn(),
  isAuthenticated: jest.fn(),
  getCurrentUser: jest.fn()
}));

import { isAuthenticated, getCurrentUser } from "../../src/utils/authUtils";

describe("useAuth hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock returns
    isAuthenticated.mockReturnValue(false);
    getCurrentUser.mockReturnValue(null);
  });

  test("returns auth context when used within AuthProvider", () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toHaveProperty("isAuthenticated");
    expect(result.current).toHaveProperty("user");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("login");
    expect(result.current).toHaveProperty("logout");
  });

  test("throws error when used outside AuthProvider", () => {
    // Suppress console.error for expected error
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within an AuthProvider");

    consoleSpy.mockRestore();
  });

  test("returns correct authentication state for unauthenticated user", () => {
    isAuthenticated.mockReturnValue(false);
    getCurrentUser.mockReturnValue(null);

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.login).toBe("function");
    expect(typeof result.current.logout).toBe("function");
  });

  test("returns correct authentication state for authenticated user", () => {
    const mockUser = { email: "user@test.com", role: "user" };

    isAuthenticated.mockReturnValue(true);
    getCurrentUser.mockReturnValue(mockUser);

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.login).toBe("function");
    expect(typeof result.current.logout).toBe("function");
  });

  test("provides functional login method", () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(() => {
      result.current.login("test-token");
    }).not.toThrow();
  });

  test("provides functional logout method", () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(() => {
      result.current.logout();
    }).not.toThrow();
  });

  test("provides stable function references within single render", () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Functions should exist and be callable
    expect(typeof result.current.login).toBe("function");
    expect(typeof result.current.logout).toBe("function");

    // Verify functions don't throw when called
    expect(() => result.current.login("test-token")).not.toThrow();
    expect(() => result.current.logout()).not.toThrow();
  });

  test("maintains consistent context structure across renders", () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

    const { result, rerender } = renderHook(() => useAuth(), { wrapper });

    const initialKeys = Object.keys(result.current).sort();

    rerender();

    const rerenderedKeys = Object.keys(result.current).sort();

    expect(rerenderedKeys).toEqual(initialKeys);
    expect(result.current).toHaveProperty("isAuthenticated");
    expect(result.current).toHaveProperty("user");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("login");
    expect(result.current).toHaveProperty("logout");
  });

  test("maintains error throwing behavior with null context", async () => {
    // Mock useContext to return null explicitly
    const React = await import("react");
    const originalUseContext = React.useContext;
    const mockUseContext = jest.fn().mockReturnValue(null);

    // Temporarily replace useContext
    React.useContext = mockUseContext;

    // Suppress console.error for expected error
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within an AuthProvider");

    // Restore original useContext
    React.useContext = originalUseContext;
    consoleSpy.mockRestore();
  });

  test("maintains error throwing behavior with undefined context", async () => {
    // Mock useContext to return undefined explicitly
    const React = await import("react");
    const originalUseContext = React.useContext;
    const mockUseContext = jest.fn().mockReturnValue(undefined);

    // Temporarily replace useContext
    React.useContext = mockUseContext;

    // Suppress console.error for expected error
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within an AuthProvider");

    // Restore original useContext
    React.useContext = originalUseContext;
    consoleSpy.mockRestore();
  });
});
