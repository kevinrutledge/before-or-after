import { render, screen, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach } from "@jest/globals";
import BottomNav from "../src/components/BottomNav";
import { MemoryRouter } from "react-router-dom";
import { GameProvider } from "../src/context/GameContext";
import { MockAuthProvider } from "./mocks/AuthContext";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate
}));

jest.mock("../src/hooks/useAuth", () => ({
  useAuth: () => jest.requireActual("./mocks/AuthContext").useAuth()
}));

describe("BottomNav Component", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test("renders dropdown menu for unauthenticated users", () => {
    render(
      <MemoryRouter>
        <MockAuthProvider value={{ isAuthenticated: false }}>
          <GameProvider>
            <BottomNav />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

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
            <BottomNav />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

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
            <BottomNav />
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
            <BottomNav />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { expanded: false }));
    fireEvent.click(screen.getByText("Logout"));

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  test("displays high score correctly", () => {
    render(
      <MemoryRouter>
        <MockAuthProvider value={{ isAuthenticated: false }}>
          <GameProvider>
            <BottomNav />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

    expect(
      screen.getByRole("button", { name: /high score/i })
    ).toBeInTheDocument();
  });
});
