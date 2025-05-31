import { render, screen, act, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { GameProvider } from "../../src/context/GameContext";
import { useGame } from "../../src/hooks/useGame";
import { MockAuthProvider } from "../mocks/AuthContext";

// Mock API client
jest.mock("../../src/utils/apiClient", () => ({
  authRequest: jest.fn()
}));

// Mock auth hook
jest.mock("../../src/hooks/useAuth", () => ({
  useAuth: () => jest.requireActual("../mocks/AuthContext").useAuth()
}));

import { authRequest } from "../../src/utils/apiClient";

// Test component to trigger game context methods
function TestGameComponent() {
  const { score, highscore, incrementScore, resetScore } = useGame();

  return (
    <div>
      <span data-testid="current-score">{score}</span>
      <span data-testid="high-score">{highscore}</span>
      <button data-testid="increment-btn" onClick={incrementScore}>
        Increment Score
      </button>
      <button data-testid="reset-btn" onClick={resetScore}>
        Reset Score
      </button>
    </div>
  );
}

describe("GameContext Score Persistence", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    authRequest.mockClear();
    authRequest.mockResolvedValue({ success: true });

    // Suppress console.error output during tests
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error after each test
    consoleErrorSpy.mockRestore();
  });

  // Render game component with auth provider
  const renderWithAuth = (authValue) => {
    return render(
      <MockAuthProvider value={authValue}>
        <GameProvider>
          <TestGameComponent />
        </GameProvider>
      </MockAuthProvider>
    );
  };

  test("triggers API calls for authenticated users on score changes", async () => {
    const authenticatedUser = {
      isAuthenticated: true,
      user: { email: "test@example.com", currentScore: 0, highScore: 0 }
    };

    renderWithAuth(authenticatedUser);

    // Verify initial state
    expect(screen.getByTestId("current-score")).toHaveTextContent("0");
    expect(screen.getByTestId("high-score")).toHaveTextContent("0");

    // Increment score
    await act(async () => {
      screen.getByTestId("increment-btn").click();
    });

    // Verify API called for authenticated user
    await waitFor(() => {
      expect(authRequest).toHaveBeenCalledWith("/api/scores/update", {
        method: "POST",
        body: JSON.stringify({
          currentScore: 1,
          highScore: 1
        })
      });
    });

    // Verify score updated locally
    expect(screen.getByTestId("current-score")).toHaveTextContent("1");
    expect(screen.getByTestId("high-score")).toHaveTextContent("1");
  });

  test("stores scores locally only for guest users", async () => {
    const guestUser = {
      isAuthenticated: false,
      user: null
    };

    renderWithAuth(guestUser);

    // Increment score for guest
    await act(async () => {
      screen.getByTestId("increment-btn").click();
    });

    // Verify no API call for guest user
    expect(authRequest).not.toHaveBeenCalled();

    // Verify score still updates locally
    expect(screen.getByTestId("current-score")).toHaveTextContent("1");
    expect(screen.getByTestId("high-score")).toHaveTextContent("1");
  });

  test("handles API failures without breaking game functionality", async () => {
    const authenticatedUser = {
      isAuthenticated: true,
      user: { email: "test@example.com", currentScore: 0, highScore: 0 }
    };

    // Mock API failure
    authRequest.mockRejectedValueOnce(new Error("Network error"));

    renderWithAuth(authenticatedUser);

    // Increment score despite API failure
    await act(async () => {
      screen.getByTestId("increment-btn").click();
    });

    // Verify score updates locally even when API fails
    expect(screen.getByTestId("current-score")).toHaveTextContent("1");
    expect(screen.getByTestId("high-score")).toHaveTextContent("1");

    // Verify API was attempted
    await waitFor(() => {
      expect(authRequest).toHaveBeenCalledTimes(1);
    });

    // Verify error was logged (even though suppressed in output)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to update scores:",
      expect.any(Error)
    );
  });

  test("continues working after network errors", async () => {
    const authenticatedUser = {
      isAuthenticated: true,
      user: { email: "test@example.com", currentScore: 0, highScore: 0 }
    };

    renderWithAuth(authenticatedUser);

    // First increment fails
    authRequest.mockRejectedValueOnce(new Error("Network timeout"));

    await act(async () => {
      screen.getByTestId("increment-btn").click();
    });

    // Verify first increment still works locally
    expect(screen.getByTestId("current-score")).toHaveTextContent("1");

    // Second increment succeeds
    authRequest.mockResolvedValueOnce({ success: true });

    await act(async () => {
      screen.getByTestId("increment-btn").click();
    });

    // Verify second increment works
    expect(screen.getByTestId("current-score")).toHaveTextContent("2");
    expect(screen.getByTestId("high-score")).toHaveTextContent("2");

    // Verify both API calls attempted
    await waitFor(() => {
      expect(authRequest).toHaveBeenCalledTimes(2);
    });

    // Verify error was logged for first failure
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to update scores:",
      expect.any(Error)
    );
  });

  test("updates high score correctly for authenticated users", async () => {
    const authenticatedUser = {
      isAuthenticated: true,
      user: { email: "test@example.com", currentScore: 5, highScore: 10 }
    };

    renderWithAuth(authenticatedUser);

    // Verify initial scores from user data
    expect(screen.getByTestId("current-score")).toHaveTextContent("5");
    expect(screen.getByTestId("high-score")).toHaveTextContent("10");

    // Increment score multiple times to exceed high score
    for (let i = 0; i < 7; i++) {
      await act(async () => {
        screen.getByTestId("increment-btn").click();
      });
    }

    // Verify high score updated when exceeded
    expect(screen.getByTestId("current-score")).toHaveTextContent("12");
    expect(screen.getByTestId("high-score")).toHaveTextContent("12");

    // Verify API called with updated high score
    await waitFor(() => {
      expect(authRequest).toHaveBeenCalledWith("/api/scores/update", {
        method: "POST",
        body: JSON.stringify({
          currentScore: 12,
          highScore: 12
        })
      });
    });
  });

  test("resets current score while preserving high score", async () => {
    const authenticatedUser = {
      isAuthenticated: true,
      user: { email: "test@example.com", currentScore: 8, highScore: 15 }
    };

    renderWithAuth(authenticatedUser);

    // Verify initial state
    expect(screen.getByTestId("current-score")).toHaveTextContent("8");
    expect(screen.getByTestId("high-score")).toHaveTextContent("15");

    // Reset score
    await act(async () => {
      screen.getByTestId("reset-btn").click();
    });

    // Verify current score reset, high score preserved
    expect(screen.getByTestId("current-score")).toHaveTextContent("0");
    expect(screen.getByTestId("high-score")).toHaveTextContent("15");

    // Verify API called for reset
    await waitFor(() => {
      expect(authRequest).toHaveBeenCalledWith("/api/scores/update", {
        method: "POST",
        body: JSON.stringify({
          currentScore: 0,
          highScore: 15
        })
      });
    });
  });

  test("loads scores from authenticated user data on mount", async () => {
    const authenticatedUser = {
      isAuthenticated: true,
      user: {
        email: "test@example.com",
        currentScore: 25,
        highScore: 30
      }
    };

    renderWithAuth(authenticatedUser);

    // Verify scores loaded from user data
    expect(screen.getByTestId("current-score")).toHaveTextContent("25");
    expect(screen.getByTestId("high-score")).toHaveTextContent("30");

    // Verify no immediate API call on mount
    expect(authRequest).not.toHaveBeenCalled();
  });

  test("handles missing score data in user object", async () => {
    const authenticatedUserMissingScores = {
      isAuthenticated: true,
      user: { email: "test@example.com" } // Missing score fields
    };

    renderWithAuth(authenticatedUserMissingScores);

    // Verify defaults to zero when scores missing
    expect(screen.getByTestId("current-score")).toHaveTextContent("0");
    expect(screen.getByTestId("high-score")).toHaveTextContent("0");
  });

  test("maintains responsive UI during API operations", async () => {
    const authenticatedUser = {
      isAuthenticated: true,
      user: { email: "test@example.com", currentScore: 0, highScore: 0 }
    };

    // Mock slow API response
    let resolveApiCall;
    const slowApiPromise = new Promise((resolve) => {
      resolveApiCall = resolve;
    });
    authRequest.mockReturnValueOnce(slowApiPromise);

    renderWithAuth(authenticatedUser);

    // Increment score with slow API
    await act(async () => {
      screen.getByTestId("increment-btn").click();
    });

    // Verify UI updates immediately despite pending API
    expect(screen.getByTestId("current-score")).toHaveTextContent("1");
    expect(screen.getByTestId("high-score")).toHaveTextContent("1");

    // Verify button still functional during API call
    const incrementBtn = screen.getByTestId("increment-btn");
    expect(incrementBtn).not.toBeDisabled();

    // Resolve API call
    resolveApiCall({ success: true });

    await waitFor(() => {
      expect(authRequest).toHaveBeenCalledTimes(1);
    });
  });

  test("persists multiple score increments correctly", async () => {
    const authenticatedUser = {
      isAuthenticated: true,
      user: { email: "test@example.com", currentScore: 0, highScore: 0 }
    };

    renderWithAuth(authenticatedUser);

    // Perform multiple rapid increments
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        screen.getByTestId("increment-btn").click();
      });
    }

    // Verify final state
    expect(screen.getByTestId("current-score")).toHaveTextContent("5");
    expect(screen.getByTestId("high-score")).toHaveTextContent("5");

    // Verify API called for each increment
    await waitFor(() => {
      expect(authRequest).toHaveBeenCalledTimes(5);
    });

    // Verify final API call has correct values
    expect(authRequest).toHaveBeenLastCalledWith("/api/scores/update", {
      method: "POST",
      body: JSON.stringify({
        currentScore: 5,
        highScore: 5
      })
    });
  });
});
