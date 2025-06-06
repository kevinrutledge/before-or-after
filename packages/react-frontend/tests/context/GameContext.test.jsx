import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach } from "@jest/globals";
import { GameProvider } from "../../src/context/GameProvider";
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
  const { score, highscore, incrementScore, resetScore } = useGame();

  return (
    <div>
      <span data-testid="score">{score}</span>
      <span data-testid="highscore">{highscore}</span>
      <button onClick={incrementScore}>Increment</button>
      <button onClick={resetScore}>Reset</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("GameContext", () => {
  test("initializes with default scores for unauthenticated user", () => {
    render(
      <MockAuthProvider value={{ isAuthenticated: false, user: null }}>
        <GameProvider>
          <TestComponent />
        </GameProvider>
      </MockAuthProvider>
    );

    expect(screen.getByTestId("score")).toHaveTextContent("0");
    expect(screen.getByTestId("highscore")).toHaveTextContent("0");
  });

  test("increments score and updates highscore", () => {
    render(
      <MockAuthProvider value={{ isAuthenticated: false, user: null }}>
        <GameProvider>
          <TestComponent />
        </GameProvider>
      </MockAuthProvider>
    );

    const incrementBtn = screen.getByText("Increment");

    act(() => {
      incrementBtn.click();
    });

    expect(screen.getByTestId("score")).toHaveTextContent("1");
    expect(screen.getByTestId("highscore")).toHaveTextContent("1");
  });

  test("resets current score but keeps highscore", () => {
    render(
      <MockAuthProvider value={{ isAuthenticated: false, user: null }}>
        <GameProvider>
          <TestComponent />
        </GameProvider>
      </MockAuthProvider>
    );

    const incrementBtn = screen.getByText("Increment");
    const resetBtn = screen.getByText("Reset");

    act(() => {
      incrementBtn.click();
      resetBtn.click();
    });

    expect(screen.getByTestId("score")).toHaveTextContent("0");
    expect(screen.getByTestId("highscore")).toHaveTextContent("1");
  });
});
