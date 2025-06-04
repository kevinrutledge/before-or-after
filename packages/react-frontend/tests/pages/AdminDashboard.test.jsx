import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import AdminDashboard from "../../src/pages/AdminDashboard";
import { MockAuthProvider } from "../mocks/AuthContext";
import { GameProvider } from "../../src/context/GameProvider";

// Mock API client
jest.mock("../../src/utils/apiClient", () => ({
  authRequest: jest.fn()
}));

// Mock loss GIF hooks
jest.mock("../../src/hooks/useLossGifs", () => ({
  useLossGifs: jest.fn()
}));

// Mock auth hook
jest.mock("../../src/hooks/useAuth", () => ({
  useAuth: () => jest.requireActual("../mocks/AuthContext").useAuth()
}));

// Mock intersection observer
jest.mock("react-intersection-observer", () => ({
  useInView: jest.fn()
}));

// Mock components
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

jest.mock("../../src/components/Background", () => {
  return function MockBackground() {
    return <div data-testid="background" />;
  };
});

jest.mock("../../src/components/Modal", () => {
  return function MockModal({ isOpen, onClose, children }) {
    if (!isOpen) return null;
    return (
      <div data-testid="modal" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()}>{children}</div>
      </div>
    );
  };
});

jest.mock("../../src/components/AdminCardForm", () => {
  return function MockAdminCardForm({ onClose }) {
    return (
      <div data-testid="admin-card-form">
        <button onClick={onClose}>Close Form</button>
      </div>
    );
  };
});

jest.mock("../../src/components/EditCardForm", () => {
  return function MockEditCardForm({ card, onClose }) {
    return (
      <div data-testid="edit-card-form">
        <span>Editing {card.title}</span>
        <button onClick={onClose}>Close Edit</button>
      </div>
    );
  };
});

jest.mock("../../src/components/AdminCard", () => {
  return function MockAdminCard({ card, onEdit, onDelete }) {
    return (
      <div data-testid="admin-card">
        <span>{card.title}</span>
        <button onClick={() => onEdit(card)}>Edit</button>
        <button onClick={() => onDelete(card)}>Delete</button>
      </div>
    );
  };
});

jest.mock("../../src/components/LossGifCard", () => {
  return function MockLossGifCard({ lossGif, onEdit }) {
    return (
      <div data-testid="loss-gif-card">
        <span>{lossGif.category}</span>
        <button onClick={() => onEdit(lossGif)}>Edit GIF</button>
      </div>
    );
  };
});

jest.mock("../../src/components/LossGifForm", () => {
  return function MockLossGifForm({ lossGif, onClose }) {
    return (
      <div data-testid="loss-gif-form">
        <span>Editing {lossGif.category}</span>
        <button onClick={onClose}>Close GIF Form</button>
      </div>
    );
  };
});

import { authRequest } from "../../src/utils/apiClient";
import { useLossGifs } from "../../src/hooks/useLossGifs";
import { useInView } from "react-intersection-observer";

describe("AdminDashboard", () => {
  let queryClient;
  let user;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    user = userEvent.setup();

    authRequest.mockClear();
    useLossGifs.mockClear();
    useInView.mockClear();

    // Default mock implementations
    authRequest.mockResolvedValue([]);
    useLossGifs.mockReturnValue({
      data: [],
      isLoading: false,
      error: null
    });
    useInView.mockReturnValue({
      ref: jest.fn(),
      inView: false
    });
  });

  // Render dashboard with required providers
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

  test("renders dashboard header and sections", () => {
    renderDashboard();

    expect(
      screen.getByRole("heading", { name: "Admin Dashboard" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Loss GIF Management" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Card Management" })
    ).toBeInTheDocument();
  });

  test("displays loss GIF loading skeleton", () => {
    useLossGifs.mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    });

    const { container } = renderDashboard();

    const skeletons = container.querySelectorAll(".admin-card-skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test("displays loss GIF cards when loaded", () => {
    const mockLossGifs = [
      { _id: "1", category: "frustrated", streakThreshold: 5 },
      { _id: "2", category: "bad", streakThreshold: 2 }
    ];

    useLossGifs.mockReturnValue({
      data: mockLossGifs,
      isLoading: false,
      error: null
    });

    renderDashboard();

    expect(screen.getByText("frustrated")).toBeInTheDocument();
    expect(screen.getByText("bad")).toBeInTheDocument();
  });

  test("sorts loss GIFs by streak threshold", () => {
    const mockLossGifs = [
      { _id: "1", category: "frustrated", streakThreshold: 5 },
      { _id: "2", category: "bad", streakThreshold: 2 },
      { _id: "3", category: "decent", streakThreshold: 8 }
    ];

    useLossGifs.mockReturnValue({
      data: mockLossGifs,
      isLoading: false,
      error: null
    });

    renderDashboard();

    const gifCards = screen.getAllByTestId("loss-gif-card");
    expect(gifCards[0]).toHaveTextContent("bad");
    expect(gifCards[1]).toHaveTextContent("frustrated");
    expect(gifCards[2]).toHaveTextContent("decent");
  });

  test("displays warning when not exactly 5 loss GIF categories", () => {
    useLossGifs.mockReturnValue({
      data: [{ _id: "1", category: "test", streakThreshold: 1 }],
      isLoading: false,
      error: null
    });

    renderDashboard();

    expect(
      screen.getByText(/Expected 5 loss GIF categories, found 1/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Run initialization script/)).toBeInTheDocument();
  });

  test("handles loss GIF error state", () => {
    useLossGifs.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("Network failure")
    });

    renderDashboard();

    expect(
      screen.getByText(/Failed to load loss GIFs: Network failure/)
    ).toBeInTheDocument();
  });

  test("displays card loading skeleton during initial load", async () => {
    // Mock API to return pending promise
    authRequest.mockImplementation(() => new Promise(() => {}));

    const { container } = renderDashboard();

    await waitFor(() => {
      const skeletons = container.querySelectorAll(".admin-card-skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  test("displays add new card button", async () => {
    authRequest.mockResolvedValue([]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Add New Card")).toBeInTheDocument();
    });
  });

  test("displays admin cards when loaded", async () => {
    const mockCards = [
      { _id: "1", title: "Test Card 1", year: 2020 },
      { _id: "2", title: "Test Card 2", year: 2021 }
    ];

    authRequest.mockResolvedValue(mockCards);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Test Card 1")).toBeInTheDocument();
      expect(screen.getByText("Test Card 2")).toBeInTheDocument();
    });
  });

  test("opens add card modal when button clicked", async () => {
    authRequest.mockResolvedValue([]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Add New Card")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Add New Card"));

    expect(screen.getByTestId("admin-card-form")).toBeInTheDocument();
  });

  test("closes add card modal", async () => {
    authRequest.mockResolvedValue([]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Add New Card")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Add New Card"));
    await user.click(screen.getByText("Close Form"));

    expect(screen.queryByTestId("admin-card-form")).not.toBeInTheDocument();
  });

  test("opens edit card modal when edit clicked", async () => {
    const mockCard = { _id: "1", title: "Test Card", year: 2020 };
    authRequest.mockResolvedValue([mockCard]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Test Card")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Edit"));

    expect(screen.getByTestId("edit-card-form")).toBeInTheDocument();
    expect(screen.getByText("Editing Test Card")).toBeInTheDocument();
  });

  test("closes edit card modal", async () => {
    const mockCard = { _id: "1", title: "Test Card", year: 2020 };
    authRequest.mockResolvedValue([mockCard]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Test Card")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Edit"));
    await user.click(screen.getByText("Close Edit"));

    expect(screen.queryByTestId("edit-card-form")).not.toBeInTheDocument();
  });

  test("opens edit loss GIF modal when edit clicked", () => {
    const mockLossGif = {
      _id: "1",
      category: "frustrated",
      streakThreshold: 5
    };
    useLossGifs.mockReturnValue({
      data: [mockLossGif],
      isLoading: false,
      error: null
    });

    renderDashboard();

    fireEvent.click(screen.getByText("Edit GIF"));

    expect(screen.getByTestId("loss-gif-form")).toBeInTheDocument();
    expect(screen.getByText("Editing frustrated")).toBeInTheDocument();
  });

  test("closes edit loss GIF modal", () => {
    const mockLossGif = {
      _id: "1",
      category: "frustrated",
      streakThreshold: 5
    };
    useLossGifs.mockReturnValue({
      data: [mockLossGif],
      isLoading: false,
      error: null
    });

    renderDashboard();

    fireEvent.click(screen.getByText("Edit GIF"));
    fireEvent.click(screen.getByText("Close GIF Form"));

    expect(screen.queryByTestId("loss-gif-form")).not.toBeInTheDocument();
  });

  test("shows delete confirmation dialog", async () => {
    const mockCard = { _id: "1", title: "Test Card", year: 2020 };
    authRequest.mockResolvedValue([mockCard]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Test Card")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Delete"));

    expect(
      screen.getByRole("heading", { name: "Delete Card" })
    ).toBeInTheDocument();
    expect(screen.getByText(/Delete "Test Card"/)).toBeInTheDocument();
  });

  test("cancels delete operation", async () => {
    const mockCard = { _id: "1", title: "Test Card", year: 2020 };
    authRequest.mockResolvedValue([mockCard]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Test Card")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Delete"));
    await user.click(screen.getByText("Cancel"));

    expect(
      screen.queryByRole("heading", { name: "Delete Card" })
    ).not.toBeInTheDocument();
  });

  test("executes delete operation", async () => {
    const mockCard = { _id: "1", title: "Test Card", year: 2020 };
    authRequest
      .mockResolvedValueOnce([mockCard])
      .mockResolvedValueOnce({ success: true });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Test Card")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Delete"));

    // Target delete confirmation button by class
    const confirmButton = screen.getByText("Delete", {
      selector: ".admin-delete-confirm-button"
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(authRequest).toHaveBeenCalledWith("/api/admin/cards/1", {
        method: "DELETE"
      });
    });
  });

  test("handles search input changes", async () => {
    authRequest.mockResolvedValue([]);

    renderDashboard();

    const searchInput = screen.getByPlaceholderText(
      "Search by title, category, or year"
    );
    await user.type(searchInput, "movie");

    expect(searchInput).toHaveValue("movie");
  });

  test("debounces search query", async () => {
    authRequest.mockResolvedValue([]);

    renderDashboard();

    const searchInput = screen.getByPlaceholderText(
      "Search by title, category, or year"
    );
    await user.type(searchInput, "test");

    // Wait for debounce without fake timers
    await waitFor(
      () => {
        expect(authRequest).toHaveBeenCalledWith(
          expect.stringContaining("search=test")
        );
      },
      { timeout: 1000 }
    );
  });

  test("clears search when clear button clicked", async () => {
    authRequest.mockResolvedValue([]);

    renderDashboard();

    const searchInput = screen.getByPlaceholderText(
      "Search by title, category, or year"
    );
    await user.type(searchInput, "test");

    await user.click(screen.getByLabelText("Clear search"));

    expect(searchInput).toHaveValue("");
  });

  test("displays search results count", async () => {
    const mockCards = [
      { _id: "1", title: "Movie A", year: 2020 },
      { _id: "2", title: "Movie B", year: 2021 }
    ];
    authRequest.mockResolvedValue(mockCards);

    renderDashboard();

    const searchInput = screen.getByPlaceholderText(
      "Search by title, category, or year"
    );
    await user.type(searchInput, "movie");

    await waitFor(
      () => {
        expect(screen.getByText("Found 2 cards")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  test("displays no search results message", async () => {
    authRequest.mockResolvedValue([]);

    renderDashboard();

    const searchInput = screen.getByPlaceholderText(
      "Search by title, category, or year"
    );
    await user.type(searchInput, "nonexistent");

    await waitFor(
      () => {
        expect(
          screen.getByText("No cards found matching your search")
        ).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  test("triggers infinite scroll when in view", async () => {
    const mockCards = [{ _id: "1", title: "Card 1", year: 2020 }];
    authRequest.mockResolvedValue(mockCards);

    useInView.mockReturnValue({
      ref: jest.fn(),
      inView: true
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Card 1")).toBeInTheDocument();
    });
  });

  test("displays error state for failed card fetch", async () => {
    authRequest.mockRejectedValue(new Error("Network error"));

    renderDashboard();

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load cards: Network error/)
      ).toBeInTheDocument();
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
  });

  test("displays loading more indicator during fetch", async () => {
    authRequest.mockResolvedValue([]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Add New Card")).toBeInTheDocument();
    });
  });

  test("displays no more cards message", async () => {
    authRequest.mockResolvedValue([]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Add New Card")).toBeInTheDocument();
    });
  });
});
