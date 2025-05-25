import { render, screen } from "@testing-library/react";
import { jest } from "@jest/globals";
import { describe, test, expect } from "@jest/globals";
import LossPage from "../src/pages/LossPage";
import useIsMobile from "../src/hooks/useIsMobile";
import { MemoryRouter } from "react-router-dom";
import { GameProvider } from "../src/context/GameContext";
import { MockAuthProvider } from "./mocks/AuthContext";

// Mock the `useIsMobile` hook
jest.mock("../src/hooks/useIsMobile");

// Mock the AuthContext
jest.mock("../src/context/AuthContext", () => {
  const mockModule = jest.requireActual("./mocks/AuthContext");
  return {
    useAuth: mockModule.useAuth
  };
});

describe("LossPage Component", () => {
  test("renders the LossPage with all elements", () => {
    // Mock `useIsMobile` to return false (desktop view)
    useIsMobile.mockReturnValue(false);

    render(
      <MemoryRouter>
        <MockAuthProvider>
          <GameProvider>
            <LossPage />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

    // Check for the title
    expect(screen.getByText("Game Over")).toBeInTheDocument();

    // Check for the score label and value separately
    expect(screen.getByText("Your score")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();

    // Check for the GIF placeholder (on desktop)
    expect(screen.getByText("GIF Placeholder (Desktop)")).toBeInTheDocument();

    // Check for buttons - use getAllByText since there are multiple "Back to Home" buttons
    expect(screen.getByText("Play Again")).toBeInTheDocument();

    // Get all "Back to Home" buttons and verify at least one exists in the loss page
    const backHomeButtons = screen.getAllByText("Back to Home");
    expect(backHomeButtons.length).toBeGreaterThan(0);

    // Verify the one in the loss card specifically
    const lossCard = screen.getByText("Game Over").closest(".loss-outer");
    expect(lossCard).toContainElement(screen.getByText("Play Again"));
  });

  test("renders mobile-specific elements when `useIsMobile` is true", () => {
    // Mock `useIsMobile` to return true (mobile view)
    useIsMobile.mockReturnValue(true);

    render(
      <MemoryRouter>
        <MockAuthProvider>
          <GameProvider>
            <LossPage />
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );

    // Check for the mobile-specific GIF placeholder
    expect(screen.getByText("GIF Placeholder (Mobile)")).toBeInTheDocument();
  });
});
