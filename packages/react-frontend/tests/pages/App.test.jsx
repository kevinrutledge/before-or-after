import { render, screen } from "@testing-library/react";
import App from "../../src/App";

// Mock only external dependencies that cause test issues
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  BrowserRouter: ({ children }) => (
    <div data-testid="browser-router">{children}</div>
  ),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: "/" })
}));

// Mock hooks that components use
jest.mock("../../src/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    logout: jest.fn()
  })
}));

jest.mock("../../src/hooks/useGame", () => ({
  useGame: () => ({
    highscore: 0,
    currentScore: 0,
    gameState: "initial"
  })
}));

// Mock context providers to isolate App component behavior
jest.mock("../../src/context/AuthContext", () => ({
  AuthProvider: ({ children }) => (
    <div data-testid="auth-provider">{children}</div>
  )
}));

jest.mock("../../src/context/GameProvider", () => ({
  GameProvider: ({ children }) => (
    <div data-testid="game-provider">{children}</div>
  )
}));

jest.mock("../../src/routes/AppRoutes", () => {
  return function AppRoutes() {
    return <div data-testid="app-routes">App Routes</div>;
  };
});

describe("App Component", () => {
  test("renders BrowserRouter wrapper", () => {
    render(<App />);

    // Verify App creates BrowserRouter that enables routing functionality
    expect(screen.getByTestId("browser-router")).toBeInTheDocument();
  });

  test("includes AuthProvider in component hierarchy", () => {
    render(<App />);

    // Verify App includes AuthProvider that manages authentication state
    expect(screen.getByTestId("auth-provider")).toBeInTheDocument();
  });

  test("includes GameProvider in component hierarchy", () => {
    render(<App />);

    // Verify App includes GameProvider that manages game state
    expect(screen.getByTestId("game-provider")).toBeInTheDocument();
  });

  test("renders AppRoutes component", () => {
    render(<App />);

    // Verify App renders AppRoutes that handles application routing
    expect(screen.getByTestId("app-routes")).toBeInTheDocument();
  });

  test("establishes proper provider nesting order", () => {
    render(<App />);

    // Verify provider hierarchy enables context access that child components require
    const authProvider = screen.getByTestId("auth-provider");
    const gameProvider = screen.getByTestId("game-provider");
    const appRoutes = screen.getByTestId("app-routes");

    expect(authProvider).toContainElement(gameProvider);
    expect(gameProvider).toContainElement(appRoutes);
  });
});
