import { render } from "@testing-library/react";
import Router from "../../src/routes/Router";

// Mock AppRoutes to isolate Router component testing
jest.mock("../../src/routes/AppRoutes", () => {
  return function MockAppRoutes() {
    return <div data-testid="app-routes">App Routes Component</div>;
  };
});

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

// Mock react-router-dom to prevent router conflicts in tests
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  BrowserRouter: ({ children }) => (
    <div data-testid="browser-router">{children}</div>
  ),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: "/" })
}));

describe("Router Component", () => {
  test("renders AppRoutes component", () => {
    const { getByTestId } = render(<Router />);

    // Verify Router renders AppRoutes that handles application routing
    expect(getByTestId("app-routes")).toBeInTheDocument();
  });

  test("creates browser router wrapper", () => {
    const { getByTestId } = render(<Router />);

    // Verify Router creates BrowserRouter that enables navigation functionality
    expect(getByTestId("browser-router")).toBeInTheDocument();
  });

  test("establishes routing context for child components", () => {
    const { getByTestId } = render(<Router />);

    // Verify Router provides routing context that child components require
    const browserRouter = getByTestId("browser-router");
    const appRoutes = getByTestId("app-routes");

    expect(browserRouter).toContainElement(appRoutes);
  });

  test("renders without crashing", () => {
    const { getByTestId } = render(<Router />);

    // Verify Router component initializes successfully
    expect(getByTestId("app-routes")).toBeInTheDocument();
  });

  test("maintains component hierarchy structure", () => {
    const { getByTestId } = render(<Router />);

    // Verify Router establishes proper structure that enables routing functionality
    const browserRouter = getByTestId("browser-router");
    const appRoutes = getByTestId("app-routes");

    expect(browserRouter).toBeInTheDocument();
    expect(appRoutes).toBeInTheDocument();
    expect(browserRouter).toContainElement(appRoutes);
  });
});
