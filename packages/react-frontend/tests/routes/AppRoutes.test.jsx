import { render, screen } from "@testing-library/react";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach } from "@jest/globals";
import { MemoryRouter } from "react-router-dom";
import AppRoutes from "../../src/routes/AppRoutes";

// Mock all page components
jest.mock("../../src/pages/HomePage", () => {
  return function MockHomePage() {
    return <div data-testid="home-page">Home Page</div>;
  };
});

jest.mock("../../src/pages/GamePage", () => {
  return function MockGamePage() {
    return <div data-testid="game-page">Game Page</div>;
  };
});

jest.mock("../../src/pages/LossPage", () => {
  return function MockLossPage() {
    return <div data-testid="loss-page">Loss Page</div>;
  };
});

jest.mock("../../src/pages/LoginPage", () => {
  return function MockLoginPage() {
    return <div data-testid="login-page">Login Page</div>;
  };
});

jest.mock("../../src/pages/SignupPage", () => {
  return function MockSignupPage() {
    return <div data-testid="signup-page">Signup Page</div>;
  };
});

jest.mock("../../src/pages/ForgotPasswordPage", () => {
  return function MockForgotPasswordPage() {
    return <div data-testid="forgot-password-page">Forgot Password Page</div>;
  };
});

jest.mock("../../src/pages/LeaderboardPage", () => {
  return function MockLeaderboardPage() {
    return <div data-testid="leaderboard-page">Leaderboard Page</div>;
  };
});

jest.mock("../../src/pages/AdminDashboard", () => {
  return function MockAdminDashboard() {
    return <div data-testid="admin-dashboard">Admin Dashboard</div>;
  };
});

// Mock ProtectedRoute component
const mockProtectedRoute = jest.fn();
jest.mock("../../src/components/ProtectedRoute", () => {
  return function MockProtectedRoute(props) {
    mockProtectedRoute(props);

    // Simulate ProtectedRoute behavior based on props
    if (props.requiredRole === "admin") {
      // Simulate redirect for non-admin users
      return (
        <div data-testid="protected-route-redirect">Redirecting to login</div>
      );
    }

    // Render component for valid access
    const Component = props.component;
    return <Component />;
  };
});

describe("AppRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProtectedRoute.mockClear();
  });

  // Render routes at specific path
  const renderRoutesAtPath = (path) => {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    );
  };

  describe("Public routes", () => {
    test("renders HomePage at root path", () => {
      renderRoutesAtPath("/");

      expect(screen.getByTestId("home-page")).toBeInTheDocument();
      expect(screen.getByText("Home Page")).toBeInTheDocument();
    });

    test("renders GamePage at /game path", () => {
      renderRoutesAtPath("/game");

      expect(screen.getByTestId("game-page")).toBeInTheDocument();
      expect(screen.getByText("Game Page")).toBeInTheDocument();
    });

    test("renders LossPage at /loss path", () => {
      renderRoutesAtPath("/loss");

      expect(screen.getByTestId("loss-page")).toBeInTheDocument();
      expect(screen.getByText("Loss Page")).toBeInTheDocument();
    });

    test("renders LoginPage at /login path", () => {
      renderRoutesAtPath("/login");

      expect(screen.getByTestId("login-page")).toBeInTheDocument();
      expect(screen.getByText("Login Page")).toBeInTheDocument();
    });

    test("renders SignupPage at /signup path", () => {
      renderRoutesAtPath("/signup");

      expect(screen.getByTestId("signup-page")).toBeInTheDocument();
      expect(screen.getByText("Signup Page")).toBeInTheDocument();
    });

    test("renders ForgotPasswordPage at /forgot-password path", () => {
      renderRoutesAtPath("/forgot-password");

      expect(screen.getByTestId("forgot-password-page")).toBeInTheDocument();
      expect(screen.getByText("Forgot Password Page")).toBeInTheDocument();
    });

    test("renders LeaderboardPage at /leaderboard path", () => {
      renderRoutesAtPath("/leaderboard");

      expect(screen.getByTestId("leaderboard-page")).toBeInTheDocument();
      expect(screen.getByText("Leaderboard Page")).toBeInTheDocument();
    });
  });

  describe("Protected admin routes", () => {
    test("renders ProtectedRoute for /admin path", () => {
      renderRoutesAtPath("/admin");

      expect(mockProtectedRoute).toHaveBeenCalledWith({
        component: expect.any(Function),
        requiredRole: "admin",
        redirectTo: "/login"
      });

      expect(
        screen.getByTestId("protected-route-redirect")
      ).toBeInTheDocument();
    });

    test("renders ProtectedRoute for /admin/cards path", () => {
      renderRoutesAtPath("/admin/cards");

      expect(mockProtectedRoute).toHaveBeenCalledWith({
        component: expect.any(Function),
        requiredRole: "admin",
        redirectTo: "/login"
      });

      expect(
        screen.getByTestId("protected-route-redirect")
      ).toBeInTheDocument();
    });

    test("passes AdminDashboard component to ProtectedRoute", () => {
      renderRoutesAtPath("/admin");

      // Verify correct component passed
      const passedProps = mockProtectedRoute.mock.calls[0][0];
      expect(passedProps.component).toBeDefined();
      expect(passedProps.requiredRole).toBe("admin");
      expect(passedProps.redirectTo).toBe("/login");
    });

    test("both admin routes use same component and configuration", () => {
      // Test /admin route
      renderRoutesAtPath("/admin");
      const adminProps = mockProtectedRoute.mock.calls[0][0];

      mockProtectedRoute.mockClear();

      // Test /admin/cards route
      renderRoutesAtPath("/admin/cards");
      const cardsProps = mockProtectedRoute.mock.calls[0][0];

      // Both should have same configuration
      expect(adminProps.requiredRole).toBe(cardsProps.requiredRole);
      expect(adminProps.redirectTo).toBe(cardsProps.redirectTo);
    });
  });

  describe("Catch-all route", () => {
    test("redirects unknown paths to home page", () => {
      renderRoutesAtPath("/unknown-path");

      // Should redirect to home page
      expect(screen.getByTestId("home-page")).toBeInTheDocument();
    });

    test("redirects deeply nested unknown paths to home page", () => {
      renderRoutesAtPath("/deeply/nested/unknown/path");

      expect(screen.getByTestId("home-page")).toBeInTheDocument();
    });

    test("redirects paths with query parameters to home page", () => {
      renderRoutesAtPath("/unknown?param=value");

      expect(screen.getByTestId("home-page")).toBeInTheDocument();
    });

    test("redirects paths with fragments to home page", () => {
      renderRoutesAtPath("/unknown#fragment");

      expect(screen.getByTestId("home-page")).toBeInTheDocument();
    });
  });

  describe("Route configuration", () => {
    test("all public routes are accessible without authentication", () => {
      const publicPaths = [
        "/",
        "/game",
        "/loss",
        "/login",
        "/signup",
        "/forgot-password",
        "/leaderboard"
      ];

      publicPaths.forEach((path) => {
        renderRoutesAtPath(path);

        // Should not call ProtectedRoute for public paths
        expect(mockProtectedRoute).not.toHaveBeenCalled();

        mockProtectedRoute.mockClear();
      });
    });

    test("admin routes require authentication and admin role", () => {
      const adminPaths = ["/admin", "/admin/cards"];

      adminPaths.forEach((path) => {
        renderRoutesAtPath(path);

        expect(mockProtectedRoute).toHaveBeenCalledWith(
          expect.objectContaining({
            requiredRole: "admin",
            redirectTo: "/login"
          })
        );

        mockProtectedRoute.mockClear();
      });
    });

    test("uses Routes component for routing", () => {
      const { container } = renderRoutesAtPath("/");

      // Should render without errors
      expect(container).toBeInTheDocument();
      expect(screen.getByTestId("home-page")).toBeInTheDocument();
    });
  });

  describe("Route priority and matching", () => {
    test("exact path matching works correctly", () => {
      // Test that /game doesn't match /games
      renderRoutesAtPath("/games");

      // Should redirect to home (404 behavior)
      expect(screen.getByTestId("home-page")).toBeInTheDocument();
    });

    test("case-sensitive path matching", () => {
      renderRoutesAtPath("/Game");

      // React Router matches case-insensitive by default
      expect(screen.getByTestId("game-page")).toBeInTheDocument();
    });

    test("trailing slash handling", () => {
      renderRoutesAtPath("/game/");

      // React Router ignores trailing slashes by default
      expect(screen.getByTestId("game-page")).toBeInTheDocument();
    });
  });

  describe("Navigation integration", () => {
    test("renders without navigation errors", () => {
      // Test multiple route transitions
      const paths = ["/", "/game", "/login", "/admin"];

      paths.forEach((path) => {
        expect(() => {
          renderRoutesAtPath(path);
        }).not.toThrow();
      });
    });

    test("handles rapid route changes", () => {
      // Simulate rapid navigation
      renderRoutesAtPath("/");
      expect(screen.getByTestId("home-page")).toBeInTheDocument();

      renderRoutesAtPath("/game");
      expect(screen.getByTestId("game-page")).toBeInTheDocument();

      renderRoutesAtPath("/login");
      expect(screen.getByTestId("login-page")).toBeInTheDocument();
    });
  });

  describe("Router structure validation", () => {
    test("exports default routes function", () => {
      expect(typeof AppRoutes).toBe("function");
    });

    test("routes render Routes component structure", () => {
      const { container } = renderRoutesAtPath("/");

      // Should contain routes elements without throwing
      expect(container.firstChild).toBeInTheDocument();
    });

    test("handles empty or malformed paths gracefully", () => {
      const malformedPaths = ["", "//", "///", "/./", "/../"];

      malformedPaths.forEach((path) => {
        expect(() => {
          renderRoutesAtPath(path);
        }).not.toThrow();
      });
    });
  });
});
