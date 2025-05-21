import React from "react";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, test, expect, beforeEach } from "@jest/globals";
import { GameProvider, useGame } from "../../src/context/GameContext";

// Mock the AuthContext to simulate guest/auth user
jest.mock("../../src/context/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isGuest: true,
    user: null,
  }),
}));

function TestComponent() {
  const {
    score,
    highscore,
    gameStatus,
    incrementScore,
    resetScore,
    setGameStatus,
    setScore,
    setHighscore,
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
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );
    expect(screen.getByTestId("score")).toHaveTextContent("0");
    expect(screen.getByTestId("highscore")).toHaveTextContent("0");
    expect(screen.getByTestId("gameStatus")).toHaveTextContent("not-started");
  });

  test("increments score correctly", () => {
    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );

    const score = screen.getByTestId("score");
    const highscore = screen.getByTestId("highscore");
    const incrementBtn = screen.getByText("Increment");

    act(() => {
      incrementBtn.click();
      incrementBtn.click();
    });

    expect(score).toHaveTextContent("2");
    expect(highscore).toHaveTextContent("2"); // because highscore updates if score is higher
  });

  test("resets score correctly", () => {
    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
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
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );

    const status = screen.getByTestId("gameStatus");
    const playBtn = screen.getByText("Play");

    act(() => {
      playBtn.click();
    });

    expect(status).toHaveTextContent("playing");
  });

  test("saves and loads guest scores from localStorage", async () => {
    localStorage.setItem("guestScore", "5");
    localStorage.setItem("guestHighscore", "10");

    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );

    expect(await screen.findByTestId("score")).toHaveTextContent("5");
    expect(await screen.findByTestId("highscore")).toHaveTextContent("10");
  });
});
