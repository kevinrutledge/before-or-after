import { render, screen, act, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { GameProvider } from "../../src/context/GameProvider";
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
});
