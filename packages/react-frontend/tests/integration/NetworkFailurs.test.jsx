const mockUser = { email: "test@example.com", currentScore: 0, highScore: 0 };

jest.mock("../../src/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: mockUser,
    logout: jest.fn()
  })
}));
import { render, screen, act, waitFor } from "@testing-library/react";
import { GameProvider } from "../../src/context/GameContext";
import { useGame } from "../../src/hooks/useGame";

// Mock authRequest to simulate network error
jest.mock("../../src/utils/apiClient", () => ({
  authRequest: jest.fn()
}));

import { authRequest } from "../../src/utils/apiClient";

function TestComponent() {
  const { score, highscore, incrementScore } = useGame();
  return (
    <div>
      <span data-testid="score">{score}</span>
      <span data-testid="highscore">{highscore}</span>
      <button onClick={incrementScore}>Increment</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe("GameContext score persistence with network error", () => {
  test("score and highscore update in UI even if network fails", async () => {
    authRequest.mockRejectedValueOnce(new Error("Network error"));

    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );

    const incrementBtn = screen.getByText("Increment");

    await act(async () => {
      incrementBtn.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("score")).toHaveTextContent("1");
      expect(screen.getByTestId("highscore")).toHaveTextContent("1");
    });

    expect(authRequest).toHaveBeenCalled();
  });
});
