import { render, screen, act, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { useContext } from "react";
import { AuthProvider, AuthContext } from "../../src/context/AuthContext";
import { GameProvider } from "../../src/context/GameProvider";
import { GameContext } from "../../src/context/GameContext";

// Mock authUtils functions
jest.mock("../../src/utils/authUtils", () => ({
  setAuthToken: jest.fn(),
  removeAuthToken: jest.fn(),
  isAuthenticated: jest.fn(),
  getCurrentUser: jest.fn()
}));

// Mock API client for score updates
jest.mock("../../src/utils/apiClient", () => ({
  authRequest: jest.fn()
}));

import {
  setAuthToken,
  isAuthenticated,
  getCurrentUser
} from "../../src/utils/authUtils";

import { authRequest } from "../../src/utils/apiClient";

// Test component to access both auth and game context values
function TestConsumerWithScores() {
  const authContext = useContext(AuthContext);
  const gameContext = useContext(GameContext);

  if (!authContext) {
    return <div data-testid="no-auth-context">No auth context provided</div>;
  }

  if (!gameContext) {
    return <div data-testid="no-game-context">No game context provided</div>;
  }

  const { isAuthenticated: auth, user, isLoading, login, logout } = authContext;
  const { score, highscore } = gameContext;

  return (
    <div data-testid="auth-game-consumer">
      <div data-testid="auth-status">
        {auth ? "authenticated" : "unauthenticated"}
      </div>
      <div data-testid="loading-status">{isLoading ? "loading" : "loaded"}</div>
      <div data-testid="user-email">{user?.email || "no-user"}</div>
      <div data-testid="user-current-score">
        {user?.currentScore || "no-current-score"}
      </div>
      <div data-testid="user-high-score">
        {user?.highScore || "no-user-high-score"}
      </div>
      <div data-testid="game-current-score">{score}</div>
      <div data-testid="game-high-score">{highscore}</div>
      <button data-testid="login-btn" onClick={() => login("test-token")}>
        Login
      </button>
      <button data-testid="logout-btn" onClick={() => logout()}>
        Logout
      </button>
    </div>
  );
}

// Navbar-like component that should display high score
function MockNavbarHighScore() {
  const { user, isAuthenticated: auth } = useContext(AuthContext);
  const { highscore } = useContext(GameContext);

  if (!auth) {
    return <div data-testid="navbar-guest">Guest Mode</div>;
  }

  return (
    <div data-testid="navbar-authenticated">
      <div data-testid="navbar-username">{user?.username || "unknown"}</div>
      <div data-testid="navbar-high-score">{highscore}</div>
    </div>
  );
}

describe("AuthContext Score Data Integration", () => {
  // Store original addEventListener/removeEventListener
  let originalAddEventListener;
  let originalRemoveEventListener;
  let eventListeners;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Clear localStorage
    localStorage.clear();

    // Mock window event listeners to track calls
    eventListeners = {};
    originalAddEventListener = window.addEventListener;
    originalRemoveEventListener = window.removeEventListener;

    window.addEventListener = jest.fn((event, handler) => {
      eventListeners[event] = handler;
    });

    window.removeEventListener = jest.fn();

    // Default mock returns
    isAuthenticated.mockReturnValue(false);
    getCurrentUser.mockReturnValue(null);
    authRequest.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    // Restore original event listeners
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
    localStorage.clear();
  });

  test("user object contains score data after login", async () => {
    const mockUserWithScores = {
      email: "user@test.com",
      username: "testuser",
      role: "user",
      currentScore: 5,
      highScore: 15
    };

    // Initial state - unauthenticated
    isAuthenticated.mockReturnValue(false);
    getCurrentUser.mockReturnValue(null);

    render(
      <AuthProvider>
        <GameProvider>
          <TestConsumerWithScores />
        </GameProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading-status")).toHaveTextContent("loaded");
    });

    // Verify initial state
    expect(screen.getByTestId("auth-status")).toHaveTextContent(
      "unauthenticated"
    );
    expect(screen.getByTestId("user-current-score")).toHaveTextContent(
      "no-current-score"
    );
    expect(screen.getByTestId("user-high-score")).toHaveTextContent(
      "no-user-high-score"
    );

    // Mock post-login state with score data
    getCurrentUser.mockReturnValue(mockUserWithScores);

    // Trigger login
    act(() => {
      screen.getByTestId("login-btn").click();
    });

    expect(setAuthToken).toHaveBeenCalledWith("test-token");

    // Verify user object contains score data
    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent(
        "authenticated"
      );
      expect(screen.getByTestId("user-email")).toHaveTextContent(
        "user@test.com"
      );
      expect(screen.getByTestId("user-current-score")).toHaveTextContent("5");
      expect(screen.getByTestId("user-high-score")).toHaveTextContent("15");
    });
  });

  test("game context receives user scores during login flow", async () => {
    // Set local scores before login
    localStorage.setItem("highScore", "10");
    localStorage.setItem("score", "3");

    const mockUserWithScores = {
      email: "user@test.com",
      username: "testuser",
      role: "user",
      currentScore: 7,
      highScore: 20 // Higher than local score
    };

    isAuthenticated.mockReturnValue(false);
    getCurrentUser.mockReturnValue(null);

    render(
      <AuthProvider>
        <GameProvider>
          <TestConsumerWithScores />
        </GameProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading-status")).toHaveTextContent("loaded");
    });

    // Verify initial game scores from localStorage
    expect(screen.getByTestId("game-current-score")).toHaveTextContent("3");
    expect(screen.getByTestId("game-high-score")).toHaveTextContent("10");

    // Mock login with higher MongoDB scores
    getCurrentUser.mockReturnValue(mockUserWithScores);

    act(() => {
      screen.getByTestId("login-btn").click();
    });

    // Verify game context updates with MongoDB scores
    await waitFor(() => {
      expect(screen.getByTestId("game-current-score")).toHaveTextContent("7");
      expect(screen.getByTestId("game-high-score")).toHaveTextContent("20");
    });

    // Verify localStorage cleared after login
    expect(localStorage.getItem("score")).toBeNull();
    expect(localStorage.getItem("highScore")).toBeNull();
  });

  test("game context uses local score when higher than MongoDB", async () => {
    // Set higher local scores
    localStorage.setItem("highScore", "25");
    localStorage.setItem("score", "12");

    const mockUserWithLowerScores = {
      email: "user@test.com",
      username: "testuser",
      role: "user",
      currentScore: 5,
      highScore: 15 // Lower than local score
    };

    isAuthenticated.mockReturnValue(false);
    getCurrentUser.mockReturnValue(null);

    render(
      <AuthProvider>
        <GameProvider>
          <TestConsumerWithScores />
        </GameProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading-status")).toHaveTextContent("loaded");
    });

    // Mock login with lower MongoDB scores
    getCurrentUser.mockReturnValue(mockUserWithLowerScores);

    act(() => {
      screen.getByTestId("login-btn").click();
    });

    // Verify game context uses higher local score
    await waitFor(() => {
      expect(screen.getByTestId("game-current-score")).toHaveTextContent("5");
      expect(screen.getByTestId("game-high-score")).toHaveTextContent("25");
    });

    // Verify score update API called to sync local score
    await waitFor(() => {
      expect(authRequest).toHaveBeenCalledWith("/api/scores/update", {
        method: "POST",
        body: JSON.stringify({
          currentScore: 5,
          highScore: 25
        })
      });
    });
  });

  test("navbar component displays updated high score after login", async () => {
    const mockUserWithScores = {
      email: "user@test.com",
      username: "testuser",
      role: "user",
      currentScore: 8,
      highScore: 22
    };

    isAuthenticated.mockReturnValue(false);
    getCurrentUser.mockReturnValue(null);

    render(
      <AuthProvider>
        <GameProvider>
          <MockNavbarHighScore />
          <TestConsumerWithScores />
        </GameProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading-status")).toHaveTextContent("loaded");
    });

    // Verify initial guest state
    expect(screen.getByTestId("navbar-guest")).toBeInTheDocument();

    // Mock login
    getCurrentUser.mockReturnValue(mockUserWithScores);

    act(() => {
      screen.getByTestId("login-btn").click();
    });

    // Verify navbar shows authenticated user with correct score
    await waitFor(() => {
      expect(screen.getByTestId("navbar-authenticated")).toBeInTheDocument();
      expect(screen.getByTestId("navbar-username")).toHaveTextContent(
        "testuser"
      );
      expect(screen.getByTestId("navbar-high-score")).toHaveTextContent("22");
    });
  });

  test("handles missing score data in user object gracefully", async () => {
    const mockUserWithoutScores = {
      email: "user@test.com",
      username: "testuser",
      role: "user"
      // Missing: currentScore, highScore
    };

    localStorage.setItem("highScore", "18");

    isAuthenticated.mockReturnValue(false);
    getCurrentUser.mockReturnValue(null);

    render(
      <AuthProvider>
        <GameProvider>
          <TestConsumerWithScores />
        </GameProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading-status")).toHaveTextContent("loaded");
    });

    // Mock login with user missing score data
    getCurrentUser.mockReturnValue(mockUserWithoutScores);

    act(() => {
      screen.getByTestId("login-btn").click();
    });

    // Verify game context handles missing scores gracefully
    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent(
        "authenticated"
      );
      expect(screen.getByTestId("user-current-score")).toHaveTextContent(
        "no-current-score"
      );
      expect(screen.getByTestId("user-high-score")).toHaveTextContent(
        "no-user-high-score"
      );

      // Should use local score since MongoDB scores default to 0
      expect(screen.getByTestId("game-high-score")).toHaveTextContent("18");
    });
  });

  test("user object persists after auth state changes", async () => {
    const mockUserWithScores = {
      email: "user@test.com",
      username: "testuser",
      role: "user",
      currentScore: 4,
      highScore: 19
    };

    // Start authenticated
    isAuthenticated.mockReturnValue(true);
    getCurrentUser.mockReturnValue(mockUserWithScores);

    render(
      <AuthProvider>
        <GameProvider>
          <TestConsumerWithScores />
        </GameProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent(
        "authenticated"
      );
      expect(screen.getByTestId("user-current-score")).toHaveTextContent("4");
      expect(screen.getByTestId("user-high-score")).toHaveTextContent("19");
    });

    // Simulate storage event (cross-tab state change)
    act(() => {
      if (eventListeners.storage) {
        eventListeners.storage();
      }
    });

    // Verify user data persists
    expect(screen.getByTestId("user-current-score")).toHaveTextContent("4");
    expect(screen.getByTestId("user-high-score")).toHaveTextContent("19");
  });
});
