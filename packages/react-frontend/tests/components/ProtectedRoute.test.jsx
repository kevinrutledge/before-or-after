import { render, screen } from "@testing-library/react";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach } from "@jest/globals";
import { MemoryRouter } from "react-router-dom";
import ProtectedRoute from "../../src/components/ProtectedRoute";

// Mock Navigate component to capture redirect behavior
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  Navigate: (props) => {
    mockNavigate(props);
    return <div data-testid="navigate-redirect" />;
  }
}));

// Mock useAuth hook with controlled return values
jest.mock("../../src/hooks/useAuth", () => ({
  useAuth: jest.fn()
}));

import { useAuth } from "../../src/hooks/useAuth";

// Test component for protected route rendering
function TestComponent({ testProp }) {
  return (
    <div data-testid="protected-component">
      Protected Content
      {testProp && <span data-testid="test-prop">{testProp}</span>}
    </div>
  );
}

describe("ProtectedRoute component", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    useAuth.mockClear();

    // Mock window.location.pathname for redirect state
    delete window.location;
    window.location = { pathname: "/protected-page" };
  });

  test("shows loading indicator when auth state loads", () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: true
    });

    render(
      <MemoryRouter>
        <ProtectedRoute component={TestComponent} />
      </MemoryRouter>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toHaveClass("loading");
    expect(screen.queryByTestId("protected-component")).not.toBeInTheDocument();
  });

  test("redirects unauthenticated users to default login path", () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false
    });

    render(
      <MemoryRouter>
        <ProtectedRoute component={TestComponent} />
      </MemoryRouter>
    );

    expect(screen.getByTestId("navigate-redirect")).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/login",
      replace: true,
      state: { from: "/protected-page" }
    });
  });

  test("redirects unauthenticated users to custom path", () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false
    });

    render(
      <MemoryRouter>
        <ProtectedRoute component={TestComponent} redirectTo="/custom-login" />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/custom-login",
      replace: true,
      state: { from: "/protected-page" }
    });
  });

  test("renders component for authenticated user without role requirement", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { email: "user@test.com", role: "user" },
      isLoading: false
    });

    render(
      <MemoryRouter>
        <ProtectedRoute component={TestComponent} />
      </MemoryRouter>
    );

    expect(screen.getByTestId("protected-component")).toBeInTheDocument();
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("renders component for user with matching role requirement", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { email: "admin@test.com", role: "admin" },
      isLoading: false
    });

    render(
      <MemoryRouter>
        <ProtectedRoute component={TestComponent} requiredRole="admin" />
      </MemoryRouter>
    );

    expect(screen.getByTestId("protected-component")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("redirects user with insufficient role to home page", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { email: "user@test.com", role: "user" },
      isLoading: false
    });

    render(
      <MemoryRouter>
        <ProtectedRoute component={TestComponent} requiredRole="admin" />
      </MemoryRouter>
    );

    expect(screen.getByTestId("navigate-redirect")).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/",
      replace: true
    });
  });

  test("forwards props to protected component", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { email: "user@test.com", role: "user" },
      isLoading: false
    });

    render(
      <MemoryRouter>
        <ProtectedRoute component={TestComponent} testProp="forwarded-value" />
      </MemoryRouter>
    );

    expect(screen.getByTestId("protected-component")).toBeInTheDocument();
    expect(screen.getByTestId("test-prop")).toHaveTextContent(
      "forwarded-value"
    );
  });

  test("handles user with null role when role required", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { email: "user@test.com", role: null },
      isLoading: false
    });

    render(
      <MemoryRouter>
        <ProtectedRoute component={TestComponent} requiredRole="admin" />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/",
      replace: true
    });
  });

  test("handles user with undefined role when role required", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { email: "user@test.com" },
      isLoading: false
    });

    render(
      <MemoryRouter>
        <ProtectedRoute component={TestComponent} requiredRole="admin" />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/",
      replace: true
    });
  });

  test("handles null user object when authenticated", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: null,
      isLoading: false
    });

    render(
      <MemoryRouter>
        <ProtectedRoute component={TestComponent} />
      </MemoryRouter>
    );

    // Should render component when no role required
    expect(screen.getByTestId("protected-component")).toBeInTheDocument();
  });

  test("redirects null user when role required", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: null,
      isLoading: false
    });

    render(
      <MemoryRouter>
        <ProtectedRoute component={TestComponent} requiredRole="admin" />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/",
      replace: true
    });
  });

  test("validates case-sensitive role matching", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { email: "user@test.com", role: "Admin" },
      isLoading: false
    });

    render(
      <MemoryRouter>
        <ProtectedRoute component={TestComponent} requiredRole="admin" />
      </MemoryRouter>
    );

    // Case mismatch should redirect
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/",
      replace: true
    });
  });

  test("preserves current pathname in redirect state", () => {
    window.location.pathname = "/admin/dashboard";

    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false
    });

    render(
      <MemoryRouter>
        <ProtectedRoute component={TestComponent} />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/login",
      replace: true,
      state: { from: "/admin/dashboard" }
    });
  });
});
