import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import AdminDashboard from "../../src/pages/AdminDashboard";
import { MockAuthProvider } from "../mocks/AuthContext";
import { GameProvider } from "../../src/context/GameContext";

// Mock API client
jest.mock("../../src/utils/apiClient", () => ({
  authRequest: jest.fn()
}));

// Mock loss GIF hooks
jest.mock("../../src/hooks/useLossGifs", () => ({
  useLossGifs: jest.fn(),
  useUpdateLossGif: jest.fn()
}));

// Mock intersection observer
jest.mock("react-intersection-observer", () => ({
  useInView: () => ({ ref: jest.fn(), inView: false })
}));

// Mock auth context
jest.mock("../../src/context/AuthContext", () => {
  const mockModule = jest.requireActual("../mocks/AuthContext");
  return {
    useAuth: mockModule.useAuth
  };
});

import { authRequest } from "../../src/utils/apiClient";
import { useLossGifs, useUpdateLossGif } from "../../src/hooks/useLossGifs";

describe("AdminDashboard integration", () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    authRequest.mockClear();
    useLossGifs.mockClear();
    useUpdateLossGif.mockClear();

    // Mock useUpdateLossGif return value
    useUpdateLossGif.mockReturnValue({
      mutate: jest.fn(),
      isPending: false
    });
  });

  /**
   * Render dashboard with required providers.
   */
  const renderDashboard = () => {
    return render(
      <MemoryRouter>
        <MockAuthProvider
          value={{
            isAuthenticated: true,
            user: { email: "admin@test.com", role: "admin" }
          }}>
          <GameProvider>
            <QueryClientProvider client={queryClient}>
              <AdminDashboard />
            </QueryClientProvider>
          </GameProvider>
        </MockAuthProvider>
      </MemoryRouter>
    );
  };

  test("renders loss GIF section before card section", async () => {
    // Mock successful responses
    authRequest.mockResolvedValue({ cards: [], nextCursor: null });
    useLossGifs.mockReturnValue({
      data: [
        {
          _id: "1",
          category: "frustrated",
          streakThreshold: 5,
          imageUrl: "https://example.com/frustrated.gif"
        }
      ],
      isLoading: false,
      error: null
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Loss GIF Management")).toBeInTheDocument();
      expect(screen.getByText("Card Management")).toBeInTheDocument();
    });

    // Verify section order - loss GIFs appear first
    const sections = screen.getAllByRole("heading", { level: 2 });
    expect(sections[0]).toHaveTextContent("Loss GIF Management");
    expect(sections[1]).toHaveTextContent("Card Management");
  });

  test("displays loss GIF cards correctly", async () => {
    const mockLossGifs = [
      {
        _id: "1",
        category: "frustrated",
        streakThreshold: 5,
        imageUrl: "https://example.com/frustrated.gif"
      },
      {
        _id: "2",
        category: "disappointed",
        streakThreshold: 10,
        imageUrl: "https://example.com/disappointed.gif"
      }
    ];

    authRequest.mockResolvedValue({ cards: [], nextCursor: null });
    useLossGifs.mockReturnValue({
      data: mockLossGifs,
      isLoading: false,
      error: null
    });

    renderDashboard();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "frustrated" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "disappointed" })
      ).toBeInTheDocument();
      expect(screen.getByText("Threshold: 5")).toBeInTheDocument();
      expect(screen.getByText("Threshold: 10")).toBeInTheDocument();
    });
  });

  test("opens loss GIF edit modal when edit clicked", async () => {
    const mockLossGif = {
      _id: "1",
      category: "frustrated",
      streakThreshold: 5,
      imageUrl: "https://example.com/frustrated.gif"
    };

    authRequest.mockResolvedValue({ cards: [], nextCursor: null });
    useLossGifs.mockReturnValue({
      data: [mockLossGif],
      isLoading: false,
      error: null
    });

    renderDashboard();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "frustrated" })
      ).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByTitle("Edit loss GIF");
    fireEvent.click(editButton);

    // Verify modal opens
    await waitFor(() => {
      expect(screen.getByText("Edit Loss GIF")).toBeInTheDocument();
    });
  });

  test("manages modal state correctly", async () => {
    const mockLossGif = {
      _id: "1",
      category: "frustrated",
      streakThreshold: 5,
      imageUrl: "https://example.com/frustrated.gif"
    };

    authRequest.mockResolvedValue({ cards: [], nextCursor: null });
    useLossGifs.mockReturnValue({
      data: [mockLossGif],
      isLoading: false,
      error: null
    });

    renderDashboard();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "frustrated" })
      ).toBeInTheDocument();
    });

    // Open modal
    const editButton = screen.getByTitle("Edit loss GIF");
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText("Edit Loss GIF")).toBeInTheDocument();
    });

    // Close modal
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText("Edit Loss GIF")).not.toBeInTheDocument();
    });
  });

  test("displays loading skeleton for loss GIFs", () => {
    authRequest.mockResolvedValue({ cards: [], nextCursor: null });
    useLossGifs.mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    });

    const { container } = renderDashboard();

    // Verify loading skeletons
    const skeletons = container.querySelectorAll(".admin-card-skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test("handles loss GIF loading errors", () => {
    authRequest.mockResolvedValue({ cards: [], nextCursor: null });
    useLossGifs.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("Failed to load loss GIFs")
    });

    renderDashboard();

    expect(screen.getByText(/Failed to load loss GIFs/)).toBeInTheDocument();
  });

  test("maintains existing card management functionality", async () => {
    const mockCards = [
      {
        _id: "card1",
        title: "Test Card",
        year: 2023,
        month: 6,
        category: "movie",
        imageUrl: "https://example.com/card.jpg"
      }
    ];

    authRequest.mockResolvedValue({ cards: mockCards, nextCursor: null });
    useLossGifs.mockReturnValue({
      data: [],
      isLoading: false,
      error: null
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Test Card")).toBeInTheDocument();
      expect(screen.getByText("Add New Card")).toBeInTheDocument();
    });
  });

  test("renders both sections when data loaded", async () => {
    const mockLossGif = {
      _id: "gif1",
      category: "frustrated",
      streakThreshold: 5,
      imageUrl: "https://example.com/gif.gif"
    };

    const mockCard = {
      _id: "card1",
      title: "Test Card",
      year: 2023,
      month: 6,
      category: "movie",
      imageUrl: "https://example.com/card.jpg"
    };

    authRequest.mockResolvedValue({ cards: [mockCard], nextCursor: null });
    useLossGifs.mockReturnValue({
      data: [mockLossGif],
      isLoading: false,
      error: null
    });

    renderDashboard();

    await waitFor(() => {
      // Verify both sections display content
      expect(
        screen.getByRole("heading", { name: "frustrated" })
      ).toBeInTheDocument();
      expect(screen.getByText("Test Card")).toBeInTheDocument();
    });
  });

  test("applies consistent grid layout for both sections", async () => {
    authRequest.mockResolvedValue({ cards: [], nextCursor: null });
    useLossGifs.mockReturnValue({
      data: [
        {
          _id: "1",
          category: "test",
          streakThreshold: 5,
          imageUrl: "https://example.com/test.gif"
        }
      ],
      isLoading: false,
      error: null
    });

    const { container } = renderDashboard();

    await waitFor(() => {
      const grids = container.querySelectorAll(".admin-cards-grid");
      expect(grids.length).toBe(2); // One for loss GIFs, one for cards
    });
  });
});
