import { render, screen } from "@testing-library/react";
import { jest } from "@jest/globals";
import { describe, test, expect } from "@jest/globals";
import HomePage from "../src/pages/HomePage";
import useIsMobile from "../src/hooks/useIsMobile";
import { MemoryRouter } from "react-router-dom";
import { GameProvider } from "../src/context/GameContext";
import { MockAuthProvider } from "./mocks/AuthContext";

// Mock the useIsMobile hook
jest.mock("../src/hooks/useIsMobile");

// Mock the AuthContext
jest.mock("../src/context/AuthContext", () => {
  const mockModule = jest.requireActual("./mocks/AuthContext");
  return {
    useAuth: mockModule.useAuth
  };
});

describe("HomePage Component", () => {
  test("renders all expected elements in desktop view", () => {
    // Simulate desktop
    useIsMobile.mockReturnValue(false);

    render(
      <MemoryRouter>
        <MockAuthProvider>
          <GameProvider>
            <HomePage />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

    // Tagline
    expect(
      screen.getByText(
        "A daily game where players compare the release dates of various cultural artifacts"
      )
    ).toBeInTheDocument();

    // Image logo
    const logo = screen.getByRole("img");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", "/assets/logo.svg");

    // Play button
    expect(screen.getByText("Play")).toBeInTheDocument();
  });

  test("renders image in mobile view", () => {
    useIsMobile.mockReturnValue(true);

    render(
      <MemoryRouter>
        <MockAuthProvider>
          <GameProvider>
            <HomePage />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

    const logo = screen.getByRole("img");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", "/assets/logo.svg");
  });
});
