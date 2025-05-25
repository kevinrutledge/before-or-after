import { jest } from "@jest/globals";
import { beforeEach, describe, test, expect } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import GamePage from "../../src/pages/GamePage";
import { GameProvider } from "../../src/context/GameContext";

// Mock the game context at module level
const mockIncrementScore = jest.fn();
const mockResetScore = jest.fn();

jest.mock("../../src/context/GameContext", () => ({
  ...jest.requireActual("../../src/context/GameContext"),
  useGame: () => ({
    score: 3,
    incrementScore: mockIncrementScore,
    resetScore: mockResetScore,
    highscore: 10
  })
}));

// Mock the API client
jest.mock("../../src/utils/apiClient", () => ({
  apiRequest: jest.fn()
}));

// Mock the navigate hook
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate
}));

// Mock the auth context
jest.mock("../../src/context/AuthContext", () => {
  const mockModule = jest.requireActual("../mocks/AuthContext");
  return {
    useAuth: mockModule.useAuth
  };
});

import { apiRequest } from "../../src/utils/apiClient";
import { MockAuthProvider } from "../mocks/AuthContext";

describe("GamePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default API responses
    apiRequest.mockImplementation((endpoint) => {
      if (endpoint === "/api/cards/next") {
        return Promise.resolve({
          _id: "test-id",
          title: "Test Card",
          year: 2000,
          month: 5,
          imageUrl: "test.jpg"
        });
      }
      if (endpoint === "/api/cards/guess") {
        return Promise.resolve({
          correct: true,
          nextCard: {
            _id: "next-id",
            title: "Next Card",
            year: 2001,
            month: 6,
            imageUrl: "next.jpg"
          }
        });
      }
      return Promise.resolve({});
    });
  });

  test("renders game page with cards and buttons", async () => {
    render(
      <MemoryRouter>
        <MockAuthProvider>
          <GameProvider>
            <GamePage />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText("Loading game...")).not.toBeInTheDocument();
    });

    // Check page title
    expect(screen.getByText("Before or After?")).toBeInTheDocument();

    // Check score display - use more specific selector to avoid Header/GamePage conflict
    expect(screen.getByText("Current Score: 3")).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText("Before")).toBeInTheDocument();
    expect(screen.getByText("After")).toBeInTheDocument();
  });

  test("handles 'Before' button click correctly", async () => {
    render(
      <MemoryRouter>
        <MockAuthProvider>
          <GameProvider>
            <GamePage />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

    // Wait for loading
    await waitFor(() => {
      expect(screen.queryByText("Loading game...")).not.toBeInTheDocument();
    });

    // Click the Before button
    fireEvent.click(screen.getByText("Before"));

    // Check that API was called for guess
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        "/api/cards/guess",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"guess":"before"')
        })
      );
    });
  });

  test("handles 'After' button click correctly", async () => {
    render(
      <MemoryRouter>
        <MockAuthProvider>
          <GameProvider>
            <GamePage />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

    // Wait for loading
    await waitFor(() => {
      expect(screen.queryByText("Loading game...")).not.toBeInTheDocument();
    });

    // Click the After button
    fireEvent.click(screen.getByText("After"));

    // Check that API was called for guess
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        "/api/cards/guess",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"guess":"after"')
        })
      );
    });
  });

  test("handles incorrect guess by navigating to loss page", async () => {
    // Mock incorrect guess response
    apiRequest.mockImplementation((endpoint) => {
      if (endpoint === "/api/cards/next") {
        return Promise.resolve({
          _id: "test-id",
          title: "Test Card",
          year: 2000,
          month: 5,
          imageUrl: "test.jpg"
        });
      }
      if (endpoint === "/api/cards/guess") {
        return Promise.resolve({
          correct: false,
          nextCard: null
        });
      }
      return Promise.resolve({});
    });

    render(
      <MemoryRouter>
        <MockAuthProvider>
          <GameProvider>
            <GamePage />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

    // Wait for loading
    await waitFor(() => {
      expect(screen.queryByText("Loading game...")).not.toBeInTheDocument();
    });

    // Click the After button
    fireEvent.click(screen.getByText("After"));

    // Check navigation to loss page after timeout
    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith("/loss");
      },
      { timeout: 2000 }
    );
  });
});
