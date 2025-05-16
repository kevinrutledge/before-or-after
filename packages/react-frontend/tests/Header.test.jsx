import { render, screen, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach } from "@jest/globals";
import Header from "../src/components/Header";
import { MemoryRouter } from "react-router-dom";
import { GameProvider } from "../src/context/GameContext";
import { MockAuthProvider } from "./mocks/AuthContext";

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate
}));

// Mock the AuthContext
jest.mock("../src/context/AuthContext", () => {
  const mockModule = jest.requireActual("./mocks/AuthContext");
  return {
    useAuth: mockModule.useAuth
  };
});

describe("Header Component", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test("renders auth buttons when not authenticated", () => {
    render(
      <MemoryRouter>
        <MockAuthProvider value={{ isAuthenticated: false }}>
          <GameProvider>
            <Header />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

    // Check for auth buttons
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();

    // Profile menu should not exist
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });

  test("renders profile icon when authenticated", () => {
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

    // Check for user initial in profile icon
    expect(screen.getByText("T")).toBeInTheDocument(); // First letter of email

    // Should not show auth buttons
    expect(screen.queryByText("Sign In")).not.toBeInTheDocument();
    expect(screen.queryByText("Sign Up")).not.toBeInTheDocument();
  });

  test("navigates to login page when Sign In button is clicked", () => {
    render(
      <MemoryRouter>
        <MockAuthProvider value={{ isAuthenticated: false }}>
          <GameProvider>
            <Header />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

    // Click Sign In button
    fireEvent.click(screen.getByText("Sign In"));

    // Check navigation
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  test("shows logout option when profile is clicked", () => {
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

    // Click profile icon (containing the user initial)
    fireEvent.click(screen.getByText("T"));

    // Check for logout option
    const logoutButton = screen.getByText("Logout");
    expect(logoutButton).toBeInTheDocument();

    // Click logout
    fireEvent.click(logoutButton);

    // Check logout function called
    expect(mockLogout).toHaveBeenCalled();
    // Check navigation to home
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
