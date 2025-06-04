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

describe("GameContext Authentication Flow Score Persistence", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    authRequest.mockClear();
    authRequest.mockResolvedValue({ success: true });
    localStorage.clear();

    // Suppress console.error output during tests
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
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

  describe("Scenario 1: High score increases during gameplay", () => {
    test("guest user high score increases with good performance", async () => {
      const guestUser = {
        isAuthenticated: false,
        user: null
      };

      renderWithAuth(guestUser);

      // Initial state
      expect(screen.getByTestId("current-score")).toHaveTextContent("0");
      expect(screen.getByTestId("high-score")).toHaveTextContent("0");

      // Increment score multiple times
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          screen.getByTestId("increment-btn").click();
        });
      }

      // Verify high score increased
      expect(screen.getByTestId("current-score")).toHaveTextContent("5");
      expect(screen.getByTestId("high-score")).toHaveTextContent("5");

      // Verify localStorage updated
      expect(localStorage.getItem("score")).toBe("5");
      expect(localStorage.getItem("highScore")).toBe("5");
    });

    test("authenticated user high score increases with API persistence", async () => {
      const authenticatedUser = {
        isAuthenticated: true,
        user: { email: "test@example.com", currentScore: 0, highScore: 0 }
      };

      renderWithAuth(authenticatedUser);

      // Increment score multiple times
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          screen.getByTestId("increment-btn").click();
        });
      }

      // Verify high score increased
      expect(screen.getByTestId("current-score")).toHaveTextContent("3");
      expect(screen.getByTestId("high-score")).toHaveTextContent("3");

      // Verify API calls made
      await waitFor(() => {
        expect(authRequest).toHaveBeenCalledWith("/api/scores/update", {
          method: "POST",
          body: JSON.stringify({
            currentScore: 3,
            highScore: 3
          })
        });
      });
    });
  });

  describe("Scenario 2: Sign-in with local score higher than remote", () => {
    test("uses local high score when higher than remote", async () => {
      // Set localStorage with higher scores
      localStorage.setItem("score", "8");
      localStorage.setItem("highScore", "12");

      const { rerender } = renderWithAuth({
        isAuthenticated: false,
        user: null
      });

      // Verify localStorage scores loaded
      expect(screen.getByTestId("current-score")).toHaveTextContent("8");
      expect(screen.getByTestId("high-score")).toHaveTextContent("12");

      // Sign in with lower remote scores
      rerender(
        <MockAuthProvider
          value={{
            isAuthenticated: true,
            user: {
              email: "test@example.com",
              currentScore: 2,
              highScore: 7
            }
          }}>
          <GameProvider>
            <TestGameComponent />
          </GameProvider>
        </MockAuthProvider>
      );

      // Verify merged scores - remote current, max high score
      await waitFor(() => {
        expect(screen.getByTestId("current-score")).toHaveTextContent("2");
        expect(screen.getByTestId("high-score")).toHaveTextContent("12");
      });

      // Verify API called to update remote with higher local high score
      await waitFor(() => {
        expect(authRequest).toHaveBeenCalledWith("/api/scores/update", {
          method: "POST",
          body: JSON.stringify({
            currentScore: 2,
            highScore: 12
          })
        });
      });

      // Verify localStorage cleared after merge
      expect(localStorage.getItem("score")).toBeNull();
      expect(localStorage.getItem("highScore")).toBeNull();
    });

    test("uses remote high score when higher than local", async () => {
      // Set localStorage with lower scores
      localStorage.setItem("score", "3");
      localStorage.setItem("highScore", "5");

      const { rerender } = renderWithAuth({
        isAuthenticated: false,
        user: null
      });

      // Sign in with higher remote scores
      rerender(
        <MockAuthProvider
          value={{
            isAuthenticated: true,
            user: {
              email: "test@example.com",
              currentScore: 4,
              highScore: 10
            }
          }}>
          <GameProvider>
            <TestGameComponent />
          </GameProvider>
        </MockAuthProvider>
      );

      // Verify remote scores used
      await waitFor(() => {
        expect(screen.getByTestId("current-score")).toHaveTextContent("4");
        expect(screen.getByTestId("high-score")).toHaveTextContent("10");
      });

      // Verify no API call since remote was already higher
      expect(authRequest).not.toHaveBeenCalled();

      // Verify localStorage cleared
      expect(localStorage.getItem("score")).toBeNull();
      expect(localStorage.getItem("highScore")).toBeNull();
    });
  });

  describe("Scenario 3: Score persistence after sign-out", () => {
    test("high score persists in localStorage after sign-out", async () => {
      const { rerender } = renderWithAuth({
        isAuthenticated: true,
        user: {
          email: "test@example.com",
          currentScore: 6,
          highScore: 15
        }
      });

      // Verify authenticated scores loaded
      expect(screen.getByTestId("current-score")).toHaveTextContent("6");
      expect(screen.getByTestId("high-score")).toHaveTextContent("15");

      // Sign out
      rerender(
        <MockAuthProvider
          value={{
            isAuthenticated: false,
            user: null
          }}>
          <GameProvider>
            <TestGameComponent />
          </GameProvider>
        </MockAuthProvider>
      );

      // Verify scores loaded from localStorage
      await waitFor(() => {
        expect(screen.getByTestId("current-score")).toHaveTextContent("0");
        expect(screen.getByTestId("high-score")).toHaveTextContent("15");
      });

      // Verify localStorage contains high score
      expect(localStorage.getItem("score")).toBe("0");
      expect(localStorage.getItem("highScore")).toBe("15");
    });
  });

  describe("Scenario 4: No reset to 0 on sign-out", () => {
    test("high score does not reset to 0 when signing out", async () => {
      const { rerender } = renderWithAuth({
        isAuthenticated: true,
        user: {
          email: "test@example.com",
          currentScore: 12,
          highScore: 25
        }
      });

      // Verify initial authenticated state
      expect(screen.getByTestId("high-score")).toHaveTextContent("25");

      // Sign out
      rerender(
        <MockAuthProvider
          value={{
            isAuthenticated: false,
            user: null
          }}>
          <GameProvider>
            <TestGameComponent />
          </GameProvider>
        </MockAuthProvider>
      );

      // Verify high score preserved
      await waitFor(() => {
        expect(screen.getByTestId("high-score")).toHaveTextContent("25");
      });

      // Verify high score not reset to 0
      expect(screen.getByTestId("high-score")).not.toHaveTextContent("0");
    });
  });

  describe("Scenario 5: No reset to 0 on sign-in", () => {
    test("scores do not reset to 0 during sign-in process", async () => {
      // Start with guest scores
      localStorage.setItem("score", "7");
      localStorage.setItem("highScore", "14");

      const { rerender } = renderWithAuth({
        isAuthenticated: false,
        user: null
      });

      // Verify guest scores loaded
      expect(screen.getByTestId("current-score")).toHaveTextContent("7");
      expect(screen.getByTestId("high-score")).toHaveTextContent("14");

      // Sign in
      rerender(
        <MockAuthProvider
          value={{
            isAuthenticated: true,
            user: {
              email: "test@example.com",
              currentScore: 5,
              highScore: 18
            }
          }}>
          <GameProvider>
            <TestGameComponent />
          </GameProvider>
        </MockAuthProvider>
      );

      // Verify no intermediate reset to 0
      await waitFor(() => {
        expect(screen.getByTestId("current-score")).toHaveTextContent("5");
        expect(screen.getByTestId("high-score")).toHaveTextContent("18");
      });

      // Verify never shows 0 during transition
      expect(screen.getByTestId("high-score")).not.toHaveTextContent("0");
    });

    test("preserves high score even when user data missing scores", async () => {
      // Set localStorage scores
      localStorage.setItem("score", "4");
      localStorage.setItem("highScore", "9");

      const { rerender } = renderWithAuth({
        isAuthenticated: false,
        user: null
      });

      // Sign in with user missing score fields
      rerender(
        <MockAuthProvider
          value={{
            isAuthenticated: true,
            user: { email: "test@example.com" } // No score fields
          }}>
          <GameProvider>
            <TestGameComponent />
          </GameProvider>
        </MockAuthProvider>
      );

      // Verify localStorage high score preserved
      await waitFor(() => {
        expect(screen.getByTestId("current-score")).toHaveTextContent("0");
        expect(screen.getByTestId("high-score")).toHaveTextContent("9");
      });
    });
  });

  describe("Edge cases and error handling", () => {
    test("handles API failure during sign-in score merge gracefully", async () => {
      localStorage.setItem("score", "6");
      localStorage.setItem("highScore", "11");

      // Mock API failure
      authRequest.mockRejectedValueOnce(new Error("Network error"));

      const { rerender } = renderWithAuth({
        isAuthenticated: false,
        user: null
      });

      // Sign in with lower remote scores
      rerender(
        <MockAuthProvider
          value={{
            isAuthenticated: true,
            user: {
              email: "test@example.com",
              currentScore: 3,
              highScore: 8
            }
          }}>
          <GameProvider>
            <TestGameComponent />
          </GameProvider>
        </MockAuthProvider>
      );

      // Verify scores still merged locally despite API failure
      await waitFor(() => {
        expect(screen.getByTestId("current-score")).toHaveTextContent("3");
        expect(screen.getByTestId("high-score")).toHaveTextContent("11");
      });

      // Verify error logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to update scores:",
        expect.any(Error)
      );
    });

    test("handles invalid localStorage values gracefully", async () => {
      // Set invalid localStorage values
      localStorage.setItem("score", "invalid");
      localStorage.setItem("highScore", "not-a-number");

      renderWithAuth({
        isAuthenticated: false,
        user: null
      });

      // Verify defaults to 0 for invalid values
      expect(screen.getByTestId("current-score")).toHaveTextContent("0");
      expect(screen.getByTestId("high-score")).toHaveTextContent("0");
    });
  });
});
