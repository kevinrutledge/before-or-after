import { render, screen } from "@testing-library/react";
import { jest } from "@jest/globals";
import { describe, test, expect } from "@jest/globals";
import LossPage from "../src/pages/LossPage";
import useIsMobile from "../src/hooks/useIsMobile";

// Mock the `useIsMobile` hook
jest.mock("../src/hooks/useIsMobile");

describe("LossPage Component", () => {
  test("renders the LossPage with all elements", () => {
    // Mock `useIsMobile` to return false (desktop view)
    useIsMobile.mockReturnValue(false);

    render(<LossPage />);

    // Check for the title
    expect(screen.getByText("Game Over")).toBeInTheDocument();

    // Check for the final score
    expect(screen.getByText("Your score: 7")).toBeInTheDocument();

    // Check for the GIF placeholder (on desktop btw)
    expect(screen.getByText("GIF Placeholder (Desktop)")).toBeInTheDocument();

    // Check for da buttons
    expect(screen.getByText("Play Again")).toBeInTheDocument();
    expect(screen.getByText("Back to Home")).toBeInTheDocument();
  });

  test("renders mobile-specific elements when `useIsMobile` is true", () => {
    // Mock `useIsMobile` to return true (mobile view)
    useIsMobile.mockReturnValue(true);

    render(<LossPage />);

    // Check for the mobile-specific GIF placeholder
    expect(screen.getByText("GIF Placeholder (Mobile)")).toBeInTheDocument();
  });
});
