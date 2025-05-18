import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";
import { beforeEach, describe, test, expect } from "@jest/globals";
import { MemoryRouter } from "react-router-dom";
import GamePage from "../../src/pages/GamePage";
import { GameProvider } from "../../src/context/GameContext";
import * as gameUtils from "../../src/utils/gameUtils";

// Mock the game context
jest.mock("../../src/context/GameContext", () => ({
  ...jest.requireActual("../../src/context/GameContext"),
  useGame: () => ({
    score: 3,
    setScore: jest.fn(),
    highscore: 10,
    gameStatus: "playing",
    setGameStatus: jest.fn(),
    handleCorrectGuess: jest.fn(),
    handleIncorrectGuess: jest.fn()
  })
}));

// Mock the compareCards function
jest.mock("../../src/utils/gameUtils", () => ({
  compareCards: jest.fn()
}));

describe("GamePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders game page with cards and buttons", () => {
    render(
      <MemoryRouter>
        <GameProvider>
          <GamePage />
        </GameProvider>
      </MemoryRouter>
    );

    // Check page title
    expect(screen.getByText("Before or After?")).toBeInTheDocument();

    // Check score display
    expect(screen.getByText(/Score: 3/)).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText("Before")).toBeInTheDocument();
    expect(screen.getByText("After")).toBeInTheDocument();

    // Check cards are rendered
    const cards = screen.getAllByRole("button");
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });
});

test("handles 'Before' button click correctly", () => {
  // Set up the mock to return true (correct guess)
  gameUtils.compareCards.mockReturnValue(true);

  render(
    <MemoryRouter>
      <GameProvider>
        <GamePage />
      </GameProvider>
    </MemoryRouter>
  );

  // Click the Before button
  fireEvent.click(screen.getByText("Before"));

  // Check that compareCards was called with "before"
  expect(gameUtils.compareCards).toHaveBeenCalledWith(
    expect.any(Object),
    expect.any(Object),
    "before"
  );
});

test("handles 'After' button click correctly", () => {
  // Set up the mock to return false (incorrect guess)
  gameUtils.compareCards.mockReturnValue(false);

  const { getByText } = render(
    <MemoryRouter>
      <GameProvider>
        <GamePage />
      </GameProvider>
    </MemoryRouter>
  );

  // Click the After button
  fireEvent.click(getByText("After"));

  // Check that compareCards was called with "after"
  expect(gameUtils.compareCards).toHaveBeenCalledWith(
    expect.any(Object),
    expect.any(Object),
    "after"
  );
});

test("handles correct guess with animation and new card", async () => {
  // Mock implementation
  const mockHandleCorrectGuess = jest.fn();
  jest.mock("../../src/context/GameContext", () => ({
    ...jest.requireActual("../../src/context/GameContext"),
    useGame: () => ({
      score: 3,
      handleCorrectGuess: mockHandleCorrectGuess,
      gameStatus: "correct"
    })
  }));

  gameUtils.compareCards.mockReturnValue(true);

  render(
    <MemoryRouter>
      <GameProvider>
        <GamePage />
      </GameProvider>
    </MemoryRouter>
  );

  // Click the Before button
  fireEvent.click(screen.getByText("Before"));

  // Check that handleCorrectGuess was called
  await waitFor(() => {
    expect(mockHandleCorrectGuess).toHaveBeenCalled();
  });

  // Check for animation class
  const cardElement = screen.getAllByRole("button")[0];
  expect(cardElement).toHaveClass("card-exit-active");
});

test("handles incorrect guess by navigating to loss page", () => {
  // Mock implementation
  const mockHandleIncorrectGuess = jest.fn();
  const mockNavigate = jest.fn();

  jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate
  }));

  jest.mock("../../src/context/GameContext", () => ({
    ...jest.requireActual("../../src/context/GameContext"),
    useGame: () => ({
      score: 3,
      handleIncorrectGuess: mockHandleIncorrectGuess,
      gameStatus: "incorrect"
    })
  }));

  gameUtils.compareCards.mockReturnValue(false);

  render(
    <MemoryRouter>
      <GameProvider>
        <GamePage />
      </GameProvider>
    </MemoryRouter>
  );

  // Click the After button
  fireEvent.click(screen.getByText("After"));

  // Check that handleIncorrectGuess was called
  expect(mockHandleIncorrectGuess).toHaveBeenCalled();

  // Check navigation to loss page
  expect(mockNavigate).toHaveBeenCalledWith("/loss");
});

test("handles empty deck by triggering reshuffle", () => {
  // Mock implementation
  const mockReshuffleCards = jest.fn();

  jest.mock("../../src/context/GameContext", () => ({
    ...jest.requireActual("../../src/context/GameContext"),
    useGame: () => ({
      score: 3,
      reshuffleCards: mockReshuffleCards,
      gameStatus: "reshuffling"
    })
  }));

  render(
    <MemoryRouter>
      <GameProvider>
        <GamePage />
      </GameProvider>
    </MemoryRouter>
  );

  // Check that reshuffleCards is called when component mounts
  // with empty deck (simulated by our mock)
  expect(mockReshuffleCards).toHaveBeenCalled();
});
