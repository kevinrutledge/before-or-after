import { render, screen } from "@testing-library/react";
import { jest } from "@jest/globals";
import { describe, test, expect } from "@jest/globals";
import HomePage from "../src/pages/HomePage";
import useIsMobile from "../src/hooks/useIsMobile";

// Mock the useIsMobile hook
jest.mock("../src/hooks/useIsMobile");

describe("HomePage Component", () => {
  test("renders all expected elements in desktop view", () => {
    // Simulate desktop
    useIsMobile.mockReturnValue(false);

    render(<HomePage />);

    // Title
    expect(screen.getByText("Welcome to Before or After!")).toBeInTheDocument();

    // Tagline
    expect(
      screen.getByText(
        "A daily game where players guess the release year of various cultural artifacts"
      )
    ).toBeInTheDocument();

    // Image logo
    const logo = screen.getByRole("img");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute(
      "src",
      "https://openclipart.org/image/2000px/232064"
    );

    // Play button
    expect(screen.getByText("Play")).toBeInTheDocument();
  });

  test("renders image in mobile view", () => {
    useIsMobile.mockReturnValue(true);

    render(<HomePage />);

    const logo = screen.getByRole("img");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute(
      "src",
      "https://openclipart.org/image/2000px/232064"
    );
  });
});
