import { render, screen, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";
import { describe, test, expect } from "@jest/globals";
import HomePage from "../src/pages/HomePage";
import { MemoryRouter } from "react-router-dom";
import { GameProvider } from "../src/context/GameContext";
import { MockAuthProvider } from "./mocks/AuthContext";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate
}));

jest.mock("../src/context/AuthContext", () => {
  const mockModule = jest.requireActual("./mocks/AuthContext");
  return {
    useAuth: mockModule.useAuth
  };
});

jest.mock("../src/hooks/useIsMobile", () => ({
  __esModule: true,
  default: () => false
}));

describe("HomePage Component", () => {
  test("renders page logo and content", () => {
    const { container } = render(
      <MemoryRouter>
        <MockAuthProvider value={{ isAuthenticated: false }}>
          <GameProvider>
            <HomePage />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

    const homePageLogo = container.querySelector(".home-logo");
    expect(homePageLogo).toBeInTheDocument();

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Play")).toBeInTheDocument();
  });

  test("navigates to game when play button clicked", () => {
    render(
      <MemoryRouter>
        <MockAuthProvider value={{ isAuthenticated: false }}>
          <GameProvider>
            <HomePage />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Play"));

    expect(mockNavigate).toHaveBeenCalledWith("/game");
  });

  test("displays correct tagline text", () => {
    render(
      <MemoryRouter>
        <MockAuthProvider value={{ isAuthenticated: false }}>
          <GameProvider>
            <HomePage />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

    expect(
      screen.getByText(/daily game where players compare/i)
    ).toBeInTheDocument();
  });
});
