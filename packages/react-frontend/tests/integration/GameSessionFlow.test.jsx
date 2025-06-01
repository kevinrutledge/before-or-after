import React from "react";

jest.mock("../../src/utils/apiClient", () => ({
  apiRequest: jest.fn()
}));
jest.mock("../../src/utils/deckUtils", () => ({
  shuffleDeck: jest.fn(),
  drawCard: jest.fn()
}));

import { apiRequest } from "../../src/utils/apiClient";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../../src/App";
import { MemoryRouter } from "react-router-dom";
import { shuffleDeck, drawCard } from "../../src/utils/deckUtils";

// Mock card data for the deck
const mockCardCollection = [
  {
    _id: "card1",
    title: "Movie A",
    year: 2000,
    month: 5,
    imageUrl: "https://example.com/a.jpg"
  },
  {
    _id: "card2",
    title: "Movie B",
    year: 2003,
    month: 8,
    imageUrl: "https://example.com/b.jpg"
  },
  {
    _id: "card3",
    title: "Movie C",
    year: 1998,
    month: 3,
    imageUrl: "https://example.com/c.jpg"
  }
];

beforeEach(() => {
  jest.clearAllMocks();
  apiRequest.mockImplementation((endpoint, options) => {
    if (endpoint === "/api/cards/all") {
      return Promise.resolve([...mockCardCollection]);
    }
    if (endpoint === "/api/auth/login") {
      return Promise.resolve({
        token: "fake-jwt-token",
        user: { email: "testuser@example.com", role: "user" }
      });
    }
    return Promise.resolve({});
  });
  shuffleDeck.mockImplementation((cards) => [...cards]);
  drawCard.mockImplementation((deck) => {
    if (deck.length === 0) return null;
    return deck.pop();
  });
});

test("user can log in and navigate to the game page", async () => {
  render(
    
      <App />
  );

  // Fill in login form
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "testuser@example.com" }
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "password123" }
  });

  // Click the sign in button
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

  // Wait for navigation to home (or check for authenticated UI)
  await waitFor(() =>
    expect(screen.getByText(/A daily game/i)).toBeInTheDocument()
  );

  // Navigate to game
  fireEvent.click(screen.getByText("Play"));

  // Wait for game page to load (just check for a card title)
  await waitFor(() => {
    expect(screen.getByText("Movie B")).toBeInTheDocument();
  });
});