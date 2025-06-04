import { render, screen, waitFor, act } from "@testing-library/react";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach } from "@jest/globals";
import { MemoryRouter } from "react-router-dom";
import LeaderboardPage from "../../src/pages/LeaderboardPage";
import { MockAuthProvider } from "../mocks/AuthContext";
import { GameProvider } from "../../src/context/GameProvider";

// Mock API client
jest.mock("../../src/utils/apiClient", () => ({
  apiRequest: jest.fn()
}));

// Mock auth hook
jest.mock("../../src/hooks/useAuth", () => ({
  useAuth: () => jest.requireActual("../mocks/AuthContext").useAuth()
}));

import { apiRequest } from "../../src/utils/apiClient";

describe("LeaderboardPage", () => {
  beforeEach(() => {
    apiRequest.mockClear();
    // Suppress console.error for expected test errors
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  // Render leaderboard page with required providers
  const renderLeaderboardPage = async () => {
    let component;
    await act(async () => {
      component = render(
        <MemoryRouter>
          <MockAuthProvider value={{ isAuthenticated: false, user: null }}>
            <GameProvider>
              <LeaderboardPage />
            </GameProvider>
          </MockAuthProvider>
        </MemoryRouter>
      );
    });
    return component;
  };

  test("renders leaderboard with scores from API", async () => {
    const mockScores = [
      { _id: "1", username: "player1", highScore: 25 },
      { _id: "2", username: "player2", highScore: 20 },
      { _id: "3", username: "player3", highScore: 15 }
    ];

    // Create delayed promise to ensure loading state is visible
    let resolvePromise;
    const delayedPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    apiRequest.mockReturnValueOnce(delayedPromise);

    await renderLeaderboardPage();

    // Verify loading state displays initially
    expect(screen.getByText("Loading leaderboard...")).toBeInTheDocument();

    // Resolve promise with mock data
    await act(async () => {
      resolvePromise(mockScores);
    });

    // Wait for data to load and loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText("Loading leaderboard...")
      ).not.toBeInTheDocument();
    });

    // Verify API called with correct endpoint
    expect(apiRequest).toHaveBeenCalledWith("/api/leaderboard?limit=10");

    // Wait for scores to be displayed
    await waitFor(() => {
      expect(screen.getByText("player1")).toBeInTheDocument();
    });

    // Verify all scores displayed correctly
    expect(screen.getByText("player1")).toBeInTheDocument();
    expect(screen.getByText("player2")).toBeInTheDocument();
    expect(screen.getByText("player3")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();

    // Verify rank numbers displayed
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("#3")).toBeInTheDocument();
  });

  test("displays empty state when no scores exist", async () => {
    apiRequest.mockResolvedValueOnce([]);

    await renderLeaderboardPage();

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText("Loading leaderboard...")
      ).not.toBeInTheDocument();
    });

    // Verify empty state message
    expect(screen.getByText(/No scores recorded yet/)).toBeInTheDocument();
    expect(
      screen.getByText(/Sign up and be first to compete!/)
    ).toBeInTheDocument();

    // Verify no leaderboard entries displayed
    expect(screen.queryByText("#1")).not.toBeInTheDocument();
  });

  test("handles API errors with error message", async () => {
    const mockError = new Error("Network error");
    apiRequest.mockRejectedValueOnce(mockError);

    await renderLeaderboardPage();

    // Wait for error state to display
    await waitFor(() => {
      expect(
        screen.getByText(/Unable to load leaderboard/)
      ).toBeInTheDocument();
    });

    // Verify error message displayed
    expect(screen.getByText(/Please try again later/)).toBeInTheDocument();

    // Verify no loading or empty states
    expect(
      screen.queryByText("Loading leaderboard...")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("No scores recorded yet")
    ).not.toBeInTheDocument();
  });

  test("displays loading state during fetch", async () => {
    // Mock API to return pending promise
    let resolvePromise;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    apiRequest.mockReturnValueOnce(pendingPromise);

    await renderLeaderboardPage();

    // Verify loading state visible
    expect(screen.getByText("Loading leaderboard...")).toBeInTheDocument();
    expect(screen.getByText("Leaderboard")).toBeInTheDocument();

    // Verify content not yet displayed
    expect(screen.queryByText("#1")).not.toBeInTheDocument();
    expect(
      screen.queryByText("No scores recorded yet")
    ).not.toBeInTheDocument();

    // Cleanup - resolve promise to prevent hanging
    await act(async () => {
      resolvePromise([]);
    });
  });

  test("renders correct leaderboard structure for multiple entries", async () => {
    const mockScores = [
      { _id: "1", username: "topPlayer", highScore: 100 },
      { _id: "2", username: "secondPlace", highScore: 95 },
      { _id: "3", username: "thirdPlace", highScore: 90 },
      { _id: "4", username: "fourthPlace", highScore: 85 },
      { _id: "5", username: "fifthPlace", highScore: 80 }
    ];

    apiRequest.mockResolvedValueOnce(mockScores);

    await renderLeaderboardPage();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("topPlayer")).toBeInTheDocument();
    });

    // Verify all entries rendered with correct structure
    const leaderboardEntries = screen.getAllByText(/^#[1-5]$/);
    expect(leaderboardEntries).toHaveLength(5);

    // Verify usernames displayed
    expect(screen.getByText("topPlayer")).toBeInTheDocument();
    expect(screen.getByText("secondPlace")).toBeInTheDocument();
    expect(screen.getByText("thirdPlace")).toBeInTheDocument();
    expect(screen.getByText("fourthPlace")).toBeInTheDocument();
    expect(screen.getByText("fifthPlace")).toBeInTheDocument();

    // Verify scores displayed
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("95")).toBeInTheDocument();
    expect(screen.getByText("90")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument();
  });

  test("handles single score entry correctly", async () => {
    const singleScore = [{ _id: "1", username: "onlyPlayer", highScore: 42 }];

    apiRequest.mockResolvedValueOnce(singleScore);

    await renderLeaderboardPage();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("onlyPlayer")).toBeInTheDocument();
    });

    // Verify single entry displayed correctly
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("onlyPlayer")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();

    // Verify no additional ranks displayed
    expect(screen.queryByText("#2")).not.toBeInTheDocument();
  });

  test("calls API with correct limit parameter", async () => {
    apiRequest.mockResolvedValueOnce([]);

    await renderLeaderboardPage();

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledTimes(1);
    });

    // Verify API called with expected limit
    expect(apiRequest).toHaveBeenCalledWith("/api/leaderboard?limit=10");
  });

  test("displays page title consistently", async () => {
    apiRequest.mockResolvedValueOnce([]);

    await renderLeaderboardPage();

    // Verify title visible immediately
    expect(screen.getByText("Leaderboard")).toBeInTheDocument();

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalled();
    });

    // Verify title remains visible after loading
    expect(screen.getByText("Leaderboard")).toBeInTheDocument();
  });

  test("handles API timeout gracefully", async () => {
    const timeoutError = new Error("Request timeout");
    timeoutError.name = "TimeoutError";
    apiRequest.mockRejectedValueOnce(timeoutError);

    await renderLeaderboardPage();

    await waitFor(() => {
      expect(
        screen.getByText(/Unable to load leaderboard/)
      ).toBeInTheDocument();
    });

    // Verify error state displayed for timeout
    expect(screen.getByText(/Please try again later/)).toBeInTheDocument();
    expect(
      screen.queryByText("Loading leaderboard...")
    ).not.toBeInTheDocument();
  });

  test("maintains page layout during state changes", async () => {
    // Start with pending request
    let resolvePromise;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    apiRequest.mockReturnValueOnce(pendingPromise);

    const { container } = await renderLeaderboardPage();

    // Verify loading layout
    expect(container.querySelector(".leaderboard-page")).toBeInTheDocument();
    expect(screen.getByText("Loading leaderboard...")).toBeInTheDocument();

    // Resolve with data
    const mockScores = [{ _id: "1", username: "player1", highScore: 10 }];
    await act(async () => {
      resolvePromise(mockScores);
    });

    await waitFor(() => {
      expect(screen.getByText("player1")).toBeInTheDocument();
    });

    // Verify layout container maintained
    expect(container.querySelector(".leaderboard-page")).toBeInTheDocument();
    expect(
      screen.queryByText("Loading leaderboard...")
    ).not.toBeInTheDocument();
  });
});
