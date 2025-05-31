import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach } from "@jest/globals";
import { GameProvider } from "../../src/context/GameContext";
import { useGame } from "../../src/hooks/useGame";
import { MockAuthProvider } from "../mocks/AuthContext";

// Mock authRequest for API calls
jest.mock("../../src/utils/apiClient", () => ({
  authRequest: jest.fn().mockResolvedValue({ success: true })
}));

// Mock auth hook
jest.mock("../../src/hooks/useAuth", () => ({
  useAuth: () => jest.requireActual("../mocks/AuthContext").useAuth()
}));

function TestComponent() {
  const {
    score,
    highscore,
    gameStatus,
    incrementScore,
    resetScore,
    setGameStatus
  } = useGame();

  return (
    <div>
      <span data-testid="score">{score}</span>
      <span data-testid="highscore">{highscore}</span>
      <span data-testid="gameStatus">{gameStatus}</span>
      <button onClick={incrementScore}>Increment</button>
      <button onClick={resetScore}>Reset</button>
      <button onClick={() => setGameStatus("playing")}>Play</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("GameContext", () => {
  test("initializes with default score and gameStatus", () => {
    render(
      <MockAuthProvider value={{ isAuthenticated: false, user: null }}>
        <GameProvider>
          <TestComponent />
        </GameProvider>
      </MockAuthProvider>
    );

    expect(screen.getByTestId("score")).toHaveTextContent("0");
    expect(screen.getByTestId("highscore")).toHaveTextContent("0");
    expect(screen.getByTestId("gameStatus")).toHaveTextContent("not-started");
  });

  test("increments score correctly", () => {
    render(
      <MockAuthProvider value={{ isAuthenticated: false, user: null }}>
        <GameProvider>
          <TestComponent />
        </GameProvider>
      </MockAuthProvider>
    );

    const score = screen.getByTestId("score");
    const highscore = screen.getByTestId("highscore");
    const incrementBtn = screen.getByText("Increment");

    act(() => {
      incrementBtn.click();
    });

    expect(score).toHaveTextContent("1");
    expect(highscore).toHaveTextContent("1");
  });

  test("resets score correctly", () => {
    render(
      <MockAuthProvider value={{ isAuthenticated: false, user: null }}>
        <GameProvider>
          <TestComponent />
        </GameProvider>
      </MockAuthProvider>
    );

    const score = screen.getByTestId("score");
    const incrementBtn = screen.getByText("Increment");
    const resetBtn = screen.getByText("Reset");

    act(() => {
      incrementBtn.click();
      resetBtn.click();
    });

    expect(score).toHaveTextContent("0");
  });

  test("sets gameStatus correctly", () => {
    render(
      <MockAuthProvider value={{ isAuthenticated: false, user: null }}>
        <GameProvider>
          <TestComponent />
        </GameProvider>
      </MockAuthProvider>
    );

    const status = screen.getByTestId("gameStatus");
    const playBtn = screen.getByText("Play");

    act(() => {
      playBtn.click();
    });

    expect(status).toHaveTextContent("playing");
  });

  test("loads scores from authenticated user data", () => {
    const mockUser = {
      email: "test@example.com",
      currentScore: 3,
      highScore: 8
    };

    render(
      <MockAuthProvider value={{ isAuthenticated: true, user: mockUser }}>
        <GameProvider>
          <TestComponent />
        </GameProvider>
      </MockAuthProvider>
    );

    expect(screen.getByTestId("score")).toHaveTextContent("3");
    expect(screen.getByTestId("highscore")).toHaveTextContent("8");
  });
});
