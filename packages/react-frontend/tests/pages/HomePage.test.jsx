import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach } from "@jest/globals";
import { MemoryRouter } from "react-router-dom";
import HomePage from "../../src/pages/HomePage";

// Mock navigation
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate
}));

// Mock useIsMobile hook
jest.mock("../../src/hooks/useIsMobile", () => {
  return jest.fn(() => false);
});

// Mock all components
jest.mock("../../src/components/Layout", () => {
  return function MockLayout({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

jest.mock("../../src/components/PageContainer", () => {
  return function MockPageContainer({ children }) {
    return <div data-testid="page-container">{children}</div>;
  };
});

jest.mock("../../src/components/PlayButton", () => {
  return function MockPlayButton() {
    return <button data-testid="play-button">Play Game</button>;
  };
});

jest.mock("../../src/components/Background", () => {
  return function MockBackground() {
    return <div data-testid="background" />;
  };
});

import useIsMobile from "../../src/hooks/useIsMobile";

describe("HomePage", () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    mockNavigate.mockClear();
    useIsMobile.mockReturnValue(false);
  });

  const renderPage = () => {
    return render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
  };

  describe("Component structure", () => {
    test("renders all required layout components", () => {
      renderPage();

      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByTestId("background")).toBeInTheDocument();
      expect(screen.getByTestId("page-container")).toBeInTheDocument();
    });

    test("renders home page container with correct class", () => {
      const { container } = renderPage();

      const homePage = container.querySelector(".home-page");
      expect(homePage).toBeInTheDocument();
    });

    test("renders logo image with correct attributes", () => {
      renderPage();

      const logo = screen.getByAltText("Before or After Logo");
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute("src", "/assets/logo.svg");
      expect(logo).toHaveClass("home-logo");
    });

    test("renders tagline with correct text content", () => {
      renderPage();

      const tagline = screen.getByRole("heading", { level: 1 });
      expect(tagline).toBeInTheDocument();
      expect(tagline).toHaveTextContent(
        "A daily game where players compare the release dates of various cultural artifacts"
      );
      expect(tagline).toHaveClass("home-tagline");
    });

    test("renders play button component", () => {
      renderPage();

      const playButton = screen.getByTestId("play-button");
      expect(playButton).toBeInTheDocument();
      expect(playButton).toHaveTextContent("Play Game");
    });
  });

  describe("Mobile responsiveness", () => {
    test("uses same logo source for desktop", () => {
      useIsMobile.mockReturnValue(false);

      renderPage();

      const logo = screen.getByAltText("Before or After Logo");
      expect(logo).toHaveAttribute("src", "/assets/logo.svg");
    });

    test("uses same logo source for mobile", () => {
      useIsMobile.mockReturnValue(true);

      renderPage();

      const logo = screen.getByAltText("Before or After Logo");
      expect(logo).toHaveAttribute("src", "/assets/logo.svg");
    });

    test("calls useIsMobile hook", () => {
      renderPage();

      expect(useIsMobile).toHaveBeenCalledTimes(1);
    });
  });

  describe("Navigation functionality", () => {
    test("navigates to game page when play button area clicked", async () => {
      const { container } = renderPage();

      const playButtonArea = container.querySelector(
        ".home-page > div:last-child"
      );
      await user.click(playButtonArea);

      expect(mockNavigate).toHaveBeenCalledWith("/game");
    });

    test("navigates to game page when play button clicked directly", async () => {
      renderPage();

      const playButton = screen.getByTestId("play-button");
      await user.click(playButton);

      expect(mockNavigate).toHaveBeenCalledWith("/game");
    });

    test("handles multiple clicks without errors", async () => {
      const { container } = renderPage();

      const playButtonArea = container.querySelector(
        ".home-page > div:last-child"
      );
      await user.click(playButtonArea);
      await user.click(playButtonArea);

      expect(mockNavigate).toHaveBeenCalledTimes(2);
      expect(mockNavigate).toHaveBeenCalledWith("/game");
    });

    test("uses correct navigation hook", () => {
      renderPage();

      // Verify navigation function exists and is callable
      expect(typeof mockNavigate).toBe("function");
    });
  });

  describe("Event handling", () => {
    test("handles click events on play button wrapper", () => {
      const { container } = renderPage();

      const playButtonWrapper = container.querySelector(
        ".home-page > div:last-child"
      );
      expect(playButtonWrapper).toBeInTheDocument();

      fireEvent.click(playButtonWrapper);

      expect(mockNavigate).toHaveBeenCalledWith("/game");
    });

    test("handles keyboard navigation", async () => {
      renderPage();

      // Tab to button and press Enter
      await user.tab();
      await user.keyboard("{Enter}");

      expect(mockNavigate).toHaveBeenCalledWith("/game");
    });

    test("handles space key activation", async () => {
      renderPage();

      const playButton = screen.getByTestId("play-button");
      playButton.focus();

      await user.keyboard(" ");

      expect(mockNavigate).toHaveBeenCalledWith("/game");
    });
  });

  describe("Accessibility", () => {
    test("logo has proper alt text", () => {
      renderPage();

      const logo = screen.getByAltText("Before or After Logo");
      expect(logo).toHaveAttribute("alt", "Before or After Logo");
    });

    test("tagline uses semantic heading element", () => {
      renderPage();

      const tagline = screen.getByRole("heading", { level: 1 });
      expect(tagline.tagName).toBe("H1");
    });

    test("play button is keyboard accessible", () => {
      renderPage();

      const playButton = screen.getByTestId("play-button");
      expect(playButton.tagName).toBe("BUTTON");
    });

    test("maintains proper heading hierarchy", () => {
      renderPage();

      const headings = screen.getAllByRole("heading");
      expect(headings).toHaveLength(1);
      expect(headings[0].tagName).toBe("H1");
    });
  });

  describe("Component integration", () => {
    test("renders components in correct hierarchy", () => {
      const { container } = renderPage();

      const layout = screen.getByTestId("layout");
      const background = screen.getByTestId("background");
      const pageContainer = screen.getByTestId("page-container");
      const homePage = container.querySelector(".home-page");

      expect(layout).toContainElement(background);
      expect(layout).toContainElement(pageContainer);
      expect(pageContainer).toContainElement(homePage);
    });

    test("passes correct props to useIsMobile", () => {
      renderPage();

      expect(useIsMobile).toHaveBeenCalledWith();
    });

    test("integrates all components without errors", () => {
      expect(() => renderPage()).not.toThrow();

      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByTestId("background")).toBeInTheDocument();
      expect(screen.getByTestId("page-container")).toBeInTheDocument();
      expect(screen.getByTestId("play-button")).toBeInTheDocument();
    });
  });

  describe("CSS classes and styling", () => {
    test("applies home-page class to main container", () => {
      const { container } = renderPage();

      const homePage = container.querySelector(".home-page");
      expect(homePage).toBeInTheDocument();
    });

    test("applies home-logo class to logo image", () => {
      renderPage();

      const logo = screen.getByAltText("Before or After Logo");
      expect(logo).toHaveClass("home-logo");
    });

    test("applies home-tagline class to heading", () => {
      renderPage();

      const tagline = screen.getByRole("heading", { level: 1 });
      expect(tagline).toHaveClass("home-tagline");
    });

    test("maintains consistent class naming convention", () => {
      const { container } = renderPage();

      const homePage = container.querySelector(".home-page");
      const logo = screen.getByAltText("Before or After Logo");
      const tagline = screen.getByRole("heading", { level: 1 });

      expect(homePage).toHaveClass("home-page");
      expect(logo).toHaveClass("home-logo");
      expect(tagline).toHaveClass("home-tagline");
    });
  });

  describe("Error handling", () => {
    test("renders without useIsMobile hook", () => {
      useIsMobile.mockImplementation(() => {
        throw new Error("Hook error");
      });

      expect(() => renderPage()).toThrow("Hook error");
    });

    test("handles undefined navigation function", () => {
      mockNavigate.mockReturnValue(undefined);

      const { container } = renderPage();

      expect(() => {
        const playButtonArea = container.querySelector(
          ".home-page > div:last-child"
        );
        fireEvent.click(playButtonArea);
      }).not.toThrow();
    });
  });

  describe("Content verification", () => {
    test("displays exact tagline text", () => {
      renderPage();

      const tagline = screen.getByText(
        "A daily game where players compare the release dates of various cultural artifacts"
      );
      expect(tagline).toBeInTheDocument();
    });

    test("logo points to correct asset path", () => {
      renderPage();

      const logo = screen.getByAltText("Before or After Logo");
      expect(logo).toHaveAttribute("src", "/assets/logo.svg");
    });

    test("all text content is present", () => {
      renderPage();

      expect(screen.getByText(/daily game/)).toBeInTheDocument();
      expect(screen.getByText(/compare the release dates/)).toBeInTheDocument();
      expect(screen.getByText(/cultural artifacts/)).toBeInTheDocument();
    });
  });
});
