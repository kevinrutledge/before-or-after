import { render, screen } from "@testing-library/react";
import { jest } from "@jest/globals";
import { describe, test, expect } from "@jest/globals";
import LossPage from "../src/pages/LossPage";
import useIsMobile from "../src/hooks/useIsMobile";
import { MemoryRouter } from "react-router-dom";
import { GameProvider } from "../src/context/GameContext";
import { MockAuthProvider } from "./mocks/AuthContext";

jest.mock("../src/hooks/useIsMobile");

jest.mock("../src/hooks/useAuth", () => ({
  useAuth: () => jest.requireActual("./mocks/AuthContext").useAuth()
}));

describe("LossPage Component", () => {
  test("renders the LossPage with all elements", () => {
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

    // Check for title
    expect(screen.getByText("Game Over")).toBeInTheDocument();

    // Check for score label and value separately
    expect(screen.getByText("Your score")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();

    // Check for GIF placeholder on desktop
    expect(screen.getByText("GIF Placeholder (Desktop)")).toBeInTheDocument();

    // Check for buttons
    expect(screen.getByText("Play Again")).toBeInTheDocument();

    // Get all Back to Home buttons and verify at least one exists
    const backHomeButtons = screen.getAllByText("Back to Home");
    expect(backHomeButtons.length).toBeGreaterThan(0);

    // Verify the one in loss card specifically
    const lossCard = screen.getByText("Game Over").closest(".loss-outer");
    expect(lossCard).toContainElement(screen.getByText("Play Again"));
  });

  test("renders mobile-specific elements when useIsMobile is true", () => {
    // Mock useIsMobile to return true for mobile view
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

    // Check for mobile-specific GIF placeholder
    expect(screen.getByText("GIF Placeholder (Mobile)")).toBeInTheDocument();
  });
});
