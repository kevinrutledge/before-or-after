import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import LossPage from "../src/pages/LossPage";
import { apiRequest } from "../src/utils/apiClient";

// Mock API client
jest.mock("../src/utils/apiClient");

// Mock auth hook
jest.mock("../src/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn()
  })
}));

// Mock game context
const mockGameContext = {
  score: 5,
  highscore: 10,
  incrementScore: jest.fn(),
  resetScore: jest.fn()
};

jest.mock("../src/hooks/useGame", () => ({
  useGame: () => mockGameContext
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate
}));

// Test wrapper with router
const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe("LossPage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state initially", () => {
    apiRequest.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <TestWrapper>
        <LossPage />
      </TestWrapper>
    );

    expect(screen.getByText("Game Over")).toBeInTheDocument();
    expect(screen.getByText("Loading reaction...")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders fetched GIF on successful API response", async () => {
    const mockGifData = {
      imageUrl: "https://example.com/test-gif.gif",
      category: "Frustrated"
    };

    apiRequest.mockResolvedValue(mockGifData);

    render(
      <TestWrapper>
        <LossPage />
      </TestWrapper>
    );

    await waitFor(() => {
      const gifImage = screen.getByAltText("Frustrated reaction GIF");
      expect(gifImage).toBeInTheDocument();
      expect(gifImage).toHaveAttribute(
        "src",
        "https://example.com/test-gif.gif"
      );
    });
  });

  it("renders fallback GIF on API error", async () => {
    apiRequest.mockRejectedValue(new Error("API failed"));

    render(
      <TestWrapper>
        <LossPage />
      </TestWrapper>
    );

    await waitFor(() => {
      const fallbackImage = screen.getByAltText("Loss reaction");
      expect(fallbackImage).toBeInTheDocument();
      expect(fallbackImage).toHaveAttribute("src", "/assets/loss.webp");
    });
  });

  it("displays correct score from game context", () => {
    apiRequest.mockResolvedValue({
      imageUrl: "https://example.com/gif.gif"
    });

    render(
      <TestWrapper>
        <LossPage />
      </TestWrapper>
    );

    expect(screen.getByText("Your score")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("navigates to game page when play again clicked", async () => {
    apiRequest.mockResolvedValue({
      imageUrl: "https://example.com/gif.gif"
    });

    render(
      <TestWrapper>
        <LossPage />
      </TestWrapper>
    );

    const playAgainButton = screen.getByText("Play Again");
    playAgainButton.click();

    expect(mockNavigate).toHaveBeenCalledWith("/game");
  });

  it("navigates to home page when back home clicked", async () => {
    apiRequest.mockResolvedValue({
      imageUrl: "https://example.com/gif.gif"
    });

    render(
      <TestWrapper>
        <LossPage />
      </TestWrapper>
    );

    const backHomeButton = screen.getByText("Back to Home");
    backHomeButton.click();

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("calls API with correct score parameter", () => {
    apiRequest.mockResolvedValue({
      imageUrl: "https://example.com/gif.gif"
    });

    render(
      <TestWrapper>
        <LossPage />
      </TestWrapper>
    );

    expect(apiRequest).toHaveBeenCalledWith("/api/loss-gifs/current?score=5");
  });
});
