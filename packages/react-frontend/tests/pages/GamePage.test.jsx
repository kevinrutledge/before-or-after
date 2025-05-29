import { jest } from "@jest/globals";
import { beforeEach, describe, test, expect } from "@jest/globals";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import GamePage from "../../src/pages/GamePage";
import { GameProvider } from "../../src/context/GameContext";

// Mock deck utils to control card order
jest.mock("../../src/utils/deckUtils", () => ({
  shuffleDeck: jest.fn((cards) => [...cards]), // Return copy in original order
  drawCard: jest.fn((deck) => {
    // Properly simulate drawCard behavior
    if (deck.length === 0) return null;
    return deck.pop();
  })
}));

// Mock game context
const mockIncrementScore = jest.fn();
const mockResetScore = jest.fn();

jest.mock("../../src/context/GameContext", () => ({
  ...jest.requireActual("../../src/context/GameContext"),
  useGame: () => ({
    score: 2,
    incrementScore: mockIncrementScore,
    resetScore: mockResetScore,
    highscore: 8
  })
}));

// Mock API client
jest.mock("../../src/utils/apiClient", () => ({
  apiRequest: jest.fn()
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate
}));

// Mock auth context
jest.mock("../../src/context/AuthContext", () => {
  const mockModule = jest.requireActual("../mocks/AuthContext");
  return {
    useAuth: mockModule.useAuth
  };
});

import { apiRequest } from "../../src/utils/apiClient";
import { MockAuthProvider } from "../mocks/AuthContext";
import { shuffleDeck, drawCard } from "../../src/utils/deckUtils";

describe("GamePage Deck Integration", () => {
  const mockCardCollection = [
    {
      _id: "card1",
      title: "Movie A",
      year: 2000,
      month: 5,
      imageUrl: "https://example.com/a.jpg"
    },
    {
      _id: "card2",
      title: "Movie B",
      year: 2003,
      month: 8,
      imageUrl: "https://example.com/b.jpg"
    },
    {
      _id: "card3",
      title: "Movie C",
      year: 1998,
      month: 3,
      imageUrl: "https://example.com/c.jpg"
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset deck utils mocks to predictable behavior
    shuffleDeck.mockImplementation((cards) => [...cards]);
    drawCard.mockImplementation((deck) => {
      if (deck.length === 0) return null;
      return deck.pop();
    });
  });

  test("initializes deck from all cards API", async () => {
    apiRequest.mockImplementation((endpoint) => {
      if (endpoint === "/api/cards/all") {
        return Promise.resolve(mockCardCollection);
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

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith("/api/cards/all");
    });

    await waitFor(() => {
      expect(screen.queryByText("Loading game...")).not.toBeInTheDocument();
    });

    const cardTitles = screen.getAllByText(/Movie [ABC]/);
    expect(cardTitles.length).toBeGreaterThan(0);
  });

  test("advances to next deck card on correct guess", async () => {
    apiRequest.mockImplementation((endpoint) => {
      if (endpoint === "/api/cards/all") {
        return Promise.resolve(mockCardCollection);
      }
      if (endpoint === "/api/cards/guess") {
        return Promise.resolve({ correct: true });
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

    await waitFor(() => {
      expect(screen.queryByText("Loading game...")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      const afterButton = screen.getByText("After");
      expect(afterButton).not.toBeDisabled();
    });

    await act(async () => {
      const afterButton = screen.getByText("After");
      fireEvent.click(afterButton);
    });

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        "/api/cards/guess",
        expect.objectContaining({
          method: "POST"
        })
      );
    });

    await waitFor(
      () => {
        expect(mockIncrementScore).toHaveBeenCalledTimes(1);
      },
      { timeout: 2000 }
    );
  });

  test("navigates to loss page on incorrect guess", async () => {
    apiRequest.mockImplementation((endpoint) => {
      if (endpoint === "/api/cards/all") {
        return Promise.resolve(mockCardCollection);
      }
      if (endpoint === "/api/cards/guess") {
        return Promise.resolve({ correct: false });
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

    await waitFor(() => {
      expect(screen.queryByText("Loading game...")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      const beforeButton = screen.getByText("Before");
      expect(beforeButton).not.toBeDisabled();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Before"));
    });

    await waitFor(() => {
      const message = screen.getByTestId("result-message");
      expect(message).toHaveClass("incorrect");
    });

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith("/loss");
      },
      { timeout: 2000 }
    );
  });

  test("handles deck initialization failure", async () => {
    apiRequest.mockImplementation((endpoint) => {
      if (endpoint === "/api/cards/all") {
        return Promise.reject(new Error("Database connection failed"));
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

    await waitFor(() => {
      expect(screen.getByText("Failed to load cards")).toBeInTheDocument();
    });

    expect(screen.queryByText("Before")).not.toBeInTheDocument();
    expect(screen.queryByText("After")).not.toBeInTheDocument();
  });

  test("resets score on game initialization", async () => {
    apiRequest.mockImplementation((endpoint) => {
      if (endpoint === "/api/cards/all") {
        return Promise.resolve(mockCardCollection);
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

    await waitFor(() => {
      expect(mockResetScore).toHaveBeenCalledTimes(1);
    });
  });
});
