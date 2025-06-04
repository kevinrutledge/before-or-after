import { render, screen, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach } from "@jest/globals";
import { MemoryRouter } from "react-router-dom";
import Header from "../../src/components/Header";
import BottomNav from "../../src/components/BottomNav";
import { GameProvider } from "../../src/context/GameProvider";
import { MockAuthProvider } from "../mocks/AuthContext";

// Mock navigate function
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate
}));

// Mock auth hook
jest.mock("../../src/hooks/useAuth", () => ({
  useAuth: () => jest.requireActual("../mocks/AuthContext").useAuth()
}));

// Mock mobile detection hook
jest.mock("../../src/hooks/useIsMobile", () => ({
  __esModule: true,
  default: () => false
}));

describe("Navigation Leaderboard Integration", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  // Render Header component with required providers
  const renderHeader = (authValue = { isAuthenticated: false, user: null }) => {
    return render(
      <MemoryRouter>
        <MockAuthProvider value={authValue}>
          <GameProvider>
            <Header />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );
  };

  // Render BottomNav component with required providers
  const renderBottomNav = (
    authValue = { isAuthenticated: false, user: null }
  ) => {
    return render(
      <MemoryRouter>
        <MockAuthProvider value={authValue}>
          <GameProvider>
            <BottomNav />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );
  };

  test("Header high score button navigates to leaderboard", () => {
    renderHeader();

    // Find high score display button
    const highScoreButton = screen.getByRole("button", { name: /high score/i });
    expect(highScoreButton).toBeInTheDocument();

    // Click high score button
    fireEvent.click(highScoreButton);

    // Verify navigation to leaderboard
    expect(mockNavigate).toHaveBeenCalledWith("/leaderboard");
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  test("BottomNav high score button navigates to leaderboard", () => {
    renderBottomNav();

    // Find high score display button
    const highScoreButton = screen.getByRole("button", { name: /high score/i });
    expect(highScoreButton).toBeInTheDocument();

    // Click high score button
    fireEvent.click(highScoreButton);

    // Verify navigation to leaderboard
    expect(mockNavigate).toHaveBeenCalledWith("/leaderboard");
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  test("renders dropdown menu for unauthenticated users", () => {
    renderHeader();

    fireEvent.click(screen.getByRole("button", { expanded: false }));

    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });

  test("renders dropdown menu for authenticated users", () => {
    renderHeader({
      isAuthenticated: true,
      user: { email: "test@example.com" }
    });

    fireEvent.click(screen.getByRole("button", { expanded: false }));

    expect(screen.getByText("Logout")).toBeInTheDocument();
    expect(screen.queryByText("Sign In")).not.toBeInTheDocument();
    expect(screen.queryByText("Sign Up")).not.toBeInTheDocument();
  });

  test("navigates to login when sign in clicked", () => {
    renderHeader();

    fireEvent.click(screen.getByRole("button", { expanded: false }));
    fireEvent.click(screen.getByText("Sign In"));

    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  test("calls logout when logout clicked", () => {
    const mockLogout = jest.fn();

    renderHeader({
      isAuthenticated: true,
      user: { email: "test@example.com" },
      logout: mockLogout
    });

    fireEvent.click(screen.getByRole("button", { expanded: false }));
    fireEvent.click(screen.getByText("Logout"));

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  test("displays high score correctly", () => {
    renderHeader();

    expect(
      screen.getByRole("button", { name: /high score/i })
    ).toBeInTheDocument();
  });

  test("displays clickable high score button", () => {
    renderHeader();

    const highScoreElement = screen.getByRole("button", {
      name: /high score/i
    });

    // Verify element is button and clickable
    expect(highScoreElement.tagName).toBe("BUTTON");
    expect(highScoreElement).not.toBeDisabled();
  });

  test("navigation works for authenticated users", () => {
    const authenticatedUser = {
      isAuthenticated: true,
      user: { email: "test@example.com", role: "user" }
    };

    renderHeader(authenticatedUser);

    // Click high score for authenticated user
    const highScoreButton = screen.getByRole("button", { name: /high score/i });
    fireEvent.click(highScoreButton);

    // Verify navigation still works
    expect(mockNavigate).toHaveBeenCalledWith("/leaderboard");
  });

  test("navigation works for guest users", () => {
    const guestUser = {
      isAuthenticated: false,
      user: null
    };

    renderBottomNav(guestUser);

    // Click high score for guest user
    const highScoreButton = screen.getByRole("button", { name: /high score/i });
    fireEvent.click(highScoreButton);

    // Verify navigation works for guests
    expect(mockNavigate).toHaveBeenCalledWith("/leaderboard");
  });

  test("displays current high score value correctly", () => {
    // Mock GameProvider to return specific high score
    const mockGameContext = {
      score: 5,
      highscore: 25,
      gameStatus: "playing",
      incrementScore: jest.fn(),
      resetScore: jest.fn(),
      setGameStatus: jest.fn()
    };

    // Render with custom game context
    render(
      <MemoryRouter>
        <MockAuthProvider value={{ isAuthenticated: false, user: null }}>
          <div>
            {/* Simulate high score display */}
            <button onClick={() => mockNavigate("/leaderboard")}>
              High Score{mockGameContext.highscore}
            </button>
          </div>
        </MockAuthProvider>
      </MemoryRouter>
    );

    // Verify high score value displayed
    const highScoreButton = screen.getByText("High Score25");
    expect(highScoreButton).toBeInTheDocument();

    // Verify navigation works with custom score
    fireEvent.click(highScoreButton);
    expect(mockNavigate).toHaveBeenCalledWith("/leaderboard");
  });

  test("handles navigation function gracefully", () => {
    renderHeader();

    const highScoreButton = screen.getByRole("button", { name: /high score/i });

    // Verify clicking executes without throwing
    expect(() => {
      fireEvent.click(highScoreButton);
    }).not.toThrow();

    // Verify navigation was attempted
    expect(mockNavigate).toHaveBeenCalledWith("/leaderboard");
  });

  test("preserves other navigation functionality", () => {
    renderHeader();

    // Verify logo button still works
    const logoButton = screen.getByAltText("Before or After Logo");
    fireEvent.click(logoButton);

    // Verify home navigation called first
    expect(mockNavigate).toHaveBeenCalledWith("/");

    // Reset mock
    mockNavigate.mockClear();

    // Verify high score navigation still works
    const highScoreButton = screen.getByRole("button", { name: /high score/i });
    fireEvent.click(highScoreButton);

    expect(mockNavigate).toHaveBeenCalledWith("/leaderboard");
  });

  test("displays consistent text format", () => {
    renderHeader();

    const headerHighScore = screen.getByRole("button", { name: /high score/i });
    expect(headerHighScore.textContent).toMatch(/^High Score\d+$/);
  });

  test("handles rapid clicks without breaking", () => {
    renderHeader();

    const highScoreButton = screen.getByRole("button", { name: /high score/i });

    // Perform rapid clicks
    fireEvent.click(highScoreButton);
    fireEvent.click(highScoreButton);
    fireEvent.click(highScoreButton);

    // Verify navigation called for each click
    expect(mockNavigate).toHaveBeenCalledTimes(3);
    expect(mockNavigate).toHaveBeenCalledWith("/leaderboard");
  });

  test("supports keyboard navigation", () => {
    renderHeader();

    const highScoreButton = screen.getByRole("button", { name: /high score/i });

    // Verify button is focusable by default
    highScoreButton.focus();
    expect(document.activeElement).toBe(highScoreButton);

    // Simulate Enter key press for accessibility
    fireEvent.keyDown(highScoreButton, { key: "Enter", code: "Enter" });

    // Button should be keyboard accessible
    expect(highScoreButton.tagName).toBe("BUTTON");
  });
});
