const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate
}));

jest.mock("../../src/context/AuthContext", () => {
  const mock = jest.requireActual("../mocks/AuthContext");
  return {
    AuthProvider: mock.AuthProvider, // Use the new generic provider
    useAuth: mock.useAuth,
    AuthContext: mock.AuthContext
  };
});


import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, beforeEach } from "@jest/globals";
import Header from "../../src/components/Header";
import { MemoryRouter } from "react-router-dom";
import { GameProvider } from "../../src/context/GameContext";
import { MockAuthProvider } from "../mocks/AuthContext"; 

describe("Header Component", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test("renders auth buttons when not authenticated", () => {
    render(
      <MemoryRouter>
        <MockAuthProvider value={{ isAuthenticated: false, logout: jest.fn() }}>
          <GameProvider>
            <Header />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /account/i }));
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });

  test("renders profile icon when authenticated", () => {
    render(
      <MemoryRouter>
        <MockAuthProvider
          value={{
            isAuthenticated: true,
            user: { email: "test@example.com" },
            logout: jest.fn()
          }}>
          <GameProvider>
            <Header />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /account/i }));
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  test("navigates to login page when Sign In button is clicked", () => {
    render(
      <MemoryRouter>
        <MockAuthProvider value={{ isAuthenticated: false, logout: jest.fn() }}>
          <GameProvider>
            <Header />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /account/i }));
    fireEvent.click(screen.getByText("Sign In"));
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
    fireEvent.click(screen.getByRole("button", { name: /account/i }));
    const logoutButton = screen.getByText("Logout");
    expect(logoutButton).toBeInTheDocument();
    fireEvent.click(logoutButton);
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  test("navigates to signup page when Sign Up button is clicked", () => {
    render(
      <MemoryRouter>
        <MockAuthProvider value={{ isAuthenticated: false, logout: jest.fn() }}>
          <GameProvider>
            <Header />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /account/i }));
    fireEvent.click(screen.getByText("Sign Up"));
    expect(mockNavigate).toHaveBeenCalledWith("/signup");
  });

  test("navigates to dashboard if admin user", () => {
    render(
      <MemoryRouter>
        <MockAuthProvider
          value={{
            isAuthenticated: true,
            user: { email: "admin@example.com", role: "admin" },
            logout: jest.fn()
          }}>
          <GameProvider>
            <Header />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /account/i }));
    const dashboardButton = screen.getByText("Dashboard");
    expect(dashboardButton).toBeInTheDocument();
    fireEvent.click(dashboardButton);
    expect(mockNavigate).toHaveBeenCalledWith("/admin");
  });

  test("navigates to leaderboard when high score button is clicked", () => {
    render(
      <MemoryRouter>
        <MockAuthProvider value={{ isAuthenticated: false, logout: jest.fn() }}>
          <GameProvider>
            <Header />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /high score/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/leaderboard");
  });

  test("navigates home when logo is clicked", () => {
    render(
      <MemoryRouter>
        <MockAuthProvider value={{ isAuthenticated: false, logout: jest.fn() }}>
          <GameProvider>
            <Header />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /before or after logo/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
