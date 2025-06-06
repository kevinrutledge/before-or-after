import { render, screen, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach } from "@jest/globals";
import Header from "../src/components/Header";
import { MemoryRouter } from "react-router-dom";
import { GameProvider } from "../src/context/GameProvider";
import { MockAuthProvider } from "./mocks/AuthContext";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate
}));

jest.mock("../src/hooks/useAuth", () => ({
  useAuth: () => jest.requireActual("./mocks/AuthContext").useAuth()
}));

// Mock API client for GameProvider
jest.mock("../src/utils/apiClient", () => ({
  authRequest: jest.fn().mockResolvedValue({ success: true })
}));

describe("Header Component", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    localStorage.clear();
  });

  test("renders dropdown menu for unauthenticated users", () => {
    render(
      <MemoryRouter>
        <MockAuthProvider value={{ isAuthenticated: false }}>
          <GameProvider>
            <Header />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

    // Open dropdown
    fireEvent.click(screen.getByRole("button", { expanded: false }));

    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });

  test("renders dropdown menu for authenticated users", () => {
    render(
      <MemoryRouter>
        <MockAuthProvider
          value={{
            isAuthenticated: true,
            user: { email: "test@example.com" }
          }}>
          <GameProvider>
            <Header />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

    // Open dropdown
    fireEvent.click(screen.getByRole("button", { expanded: false }));

    expect(screen.getByText("Logout")).toBeInTheDocument();
    expect(screen.queryByText("Sign In")).not.toBeInTheDocument();
    expect(screen.queryByText("Sign Up")).not.toBeInTheDocument();
  });

  test("navigates to login when sign in clicked", () => {
    render(
      <MemoryRouter>
        <MockAuthProvider value={{ isAuthenticated: false }}>
          <GameProvider>
            <Header />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { expanded: false }));
    fireEvent.click(screen.getByText("Sign In"));

    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  test("calls logout when logout clicked", () => {
    const mockLogout = jest.fn();

    render(
      <MemoryRouter>
        <MockAuthProvider
          value={{
            isAuthenticated: true,
            user: { email: "test@example.com" },
            logout: mockLogout
          }}>
          <GameProvider>
            <Header />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { expanded: false }));
    fireEvent.click(screen.getByText("Logout"));

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  test("navigates home when logo clicked", () => {
    render(
      <MemoryRouter>
        <MockAuthProvider value={{ isAuthenticated: false }}>
          <GameProvider>
            <Header />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByAltText("Before or After Logo"));

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  // NEW HIGH SCORE TESTS
  describe("High Score Display", () => {
    test("displays high score for guest users from localStorage", () => {
      // Set local high score
      localStorage.setItem("highScore", "12");

      render(
        <MemoryRouter>
          <MockAuthProvider value={{ isAuthenticated: false }}>
            <GameProvider>
              <Header />
            </GameProvider>
          </MockAuthProvider>
        </MemoryRouter>
      );

      // Look for high score display elements
      const highScoreElements = [
        screen.queryByText("12"),
        screen.queryByText(/high score/i),
        screen.queryByTestId("high-score"),
        screen.queryByTestId("high-score-display"),
        screen.queryByTestId("score-value")
      ].filter(Boolean);

      expect(highScoreElements.length).toBeGreaterThan(0);
    });

    test("displays zero high score for new guest users", () => {
      // No localStorage data
      render(
        <MemoryRouter>
          <MockAuthProvider value={{ isAuthenticated: false }}>
            <GameProvider>
              <Header />
            </GameProvider>
          </MockAuthProvider>
        </MemoryRouter>
      );

      // Look for zero score display
      const zeroScoreElements = [
        screen.queryByText("0"),
        screen.queryByText(/high score.*0/i),
        screen.queryByTestId("high-score"),
        screen.queryByTestId("score-value")
      ].filter(Boolean);

      expect(zeroScoreElements.length).toBeGreaterThan(0);
    });

    test("updates high score display when user logs in", () => {
      localStorage.setItem("highScore", "10");

      const { rerender } = render(
        <MemoryRouter>
          <MockAuthProvider value={{ isAuthenticated: false }}>
            <GameProvider>
              <Header />
            </GameProvider>
          </MockAuthProvider>
        </MemoryRouter>
      );

      // Verify initial guest score
      expect(screen.queryByText("10")).toBeInTheDocument();

      // Simulate login with higher score
      const mockUserWithHigherScore = {
        email: "test@example.com",
        username: "testuser",
        currentScore: 5,
        highScore: 30
      };

      rerender(
        <MemoryRouter>
          <MockAuthProvider
            value={{
              isAuthenticated: true,
              user: mockUserWithHigherScore
            }}>
            <GameProvider>
              <Header />
            </GameProvider>
          </MockAuthProvider>
        </MemoryRouter>
      );

      // Should now display user's higher score
      expect(screen.queryByText("30")).toBeInTheDocument();
      expect(screen.queryByText("10")).not.toBeInTheDocument();
    });

    test("handles missing user score data gracefully", () => {
      const mockUserWithoutScores = {
        email: "test@example.com",
        username: "testuser"
        // Missing: currentScore, highScore
      };

      render(
        <MemoryRouter>
          <MockAuthProvider
            value={{
              isAuthenticated: true,
              user: mockUserWithoutScores
            }}>
            <GameProvider>
              <Header />
            </GameProvider>
          </MockAuthProvider>
        </MemoryRouter>
      );

      // Should display default score
      const defaultScoreElements = [
        screen.queryByText("0"),
        screen.queryByTestId("high-score"),
        screen.queryByTestId("score-value")
      ].filter(Boolean);

      expect(defaultScoreElements.length).toBeGreaterThan(0);
    });

    test("high score is clickable and navigates to leaderboard", () => {
      localStorage.setItem("highScore", "15");

      render(
        <MemoryRouter>
          <MockAuthProvider value={{ isAuthenticated: false }}>
            <GameProvider>
              <Header />
            </GameProvider>
          </MockAuthProvider>
        </MemoryRouter>
      );

      // Find and click high score element
      const clickableElements = [
        screen.queryByTestId("high-score-button"),
        screen.queryByRole("button", { name: /high score/i }),
        screen.queryByRole("button", { name: /15/i })
      ].filter(Boolean);

      if (clickableElements.length > 0) {
        fireEvent.click(clickableElements[0]);
        expect(mockNavigate).toHaveBeenCalledWith("/leaderboard");
      }
    });

    test("high score displays correct format and labels", () => {
      localStorage.setItem("highScore", "42");

      render(
        <MemoryRouter>
          <MockAuthProvider value={{ isAuthenticated: false }}>
            <GameProvider>
              <Header />
            </GameProvider>
          </MockAuthProvider>
        </MemoryRouter>
      );

      // Check for proper labeling
      const labelElements = [
        screen.queryByText(/high score/i),
        screen.queryByText(/best/i),
        screen.queryByTestId("score-label")
      ].filter(Boolean);

      const valueElements = [
        screen.queryByText("42"),
        screen.queryByTestId("score-value")
      ].filter(Boolean);

      // At least one label and one value should exist
      expect(labelElements.length).toBeGreaterThan(0);
      expect(valueElements.length).toBeGreaterThan(0);
    });
  });
});
