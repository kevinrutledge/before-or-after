import { render, screen, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach } from "@jest/globals";
import BottomNav from "../src/components/BottomNav";
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

describe("BottomNav Component", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test("renders auth buttons when not authenticated", () => {
    render(
      <MemoryRouter>
        <MockAuthProvider value={{ isAuthenticated: false }}>
          <GameProvider>
            <BottomNav />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

    // Check for auth buttons
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();

    // Should not show logout button
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });

  test("renders logout button when authenticated", () => {
    render(
      <MemoryRouter>
        <MockAuthProvider
          value={{
            isAuthenticated: true,
            user: { email: "test@example.com" }
          }}>
          <GameProvider>
            <BottomNav />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

    // Check for logout button
    expect(screen.getByText("Logout")).toBeInTheDocument();

    // Should not show auth buttons
    expect(screen.queryByText("Sign In")).not.toBeInTheDocument();
    expect(screen.queryByText("Sign Up")).not.toBeInTheDocument();
  });

  test("navigates to login page when Sign In button is clicked", () => {
    render(
      <MemoryRouter>
        <MockAuthProvider value={{ isAuthenticated: false }}>
          <GameProvider>
            <BottomNav />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

    // Click Sign In button
    fireEvent.click(screen.getByText("Sign In"));

    // Check navigation
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  test("calls logout function when Logout button is clicked", () => {
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
            <BottomNav />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

    // Click logout button
    fireEvent.click(screen.getByText("Logout"));

    // Check logout function called
    expect(mockLogout).toHaveBeenCalled();
    // Check navigation to home
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});

test("calls logout function when Logout button is clicked", () => {
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
          <BottomNav />
        </GameProvider>
      </MockAuthProvider>
    </MemoryRouter>
  );

  // Click logout button
  fireEvent.click(screen.getByText("Logout"));

  // Check logout function called
  expect(mockLogout).toHaveBeenCalled();
  // Check navigation to home
  expect(mockNavigate).toHaveBeenCalledWith("/");
});
