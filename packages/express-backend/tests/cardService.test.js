/**
 * Unit tests for card service layer functions.
 * Tests actual implementation with mocked database.
 */
const { describe, test, expect, beforeEach } = require("@jest/globals");

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
  console.error.mockRestore();
});

// Mock the Card module to avoid actual database calls
jest.mock("../models/Card", () => ({
  getCardsCollection: jest.fn().mockResolvedValue({
    client: { close: jest.fn() },
    collection: {
      aggregate: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          {
            title: "Test Card",
            year: 2000,
            imageUrl: "https://example.com/image.jpg",
            sourceUrl: "https://example.com/source",
            category: "test"
          }
        ])
      })
    }
  })
}));

// Import the service
const { getRandomCard, processGuess } = require("../src/services/cardService");
const { getCardsCollection } = require("../models/Card");

describe("Card Service Tests", () => {
  // Clear mock data before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test getRandomCard
  test("getRandomCard should retrieve a card from the database", async () => {
    const card = await getRandomCard();

    expect(card).toBeDefined();
    expect(card.title).toBe("Test Card");
    expect(card.year).toBe(2000);
    expect(getCardsCollection).toHaveBeenCalled();
  });

  test("getRandomCard should close the database connection", async () => {
    await getRandomCard();

    const mockClient = (await getCardsCollection()).client;
    expect(mockClient.close).toHaveBeenCalled();
  });

  test("getRandomCard should handle errors", async () => {
    // Setup the mock to throw an error
    getCardsCollection.mockRejectedValueOnce(new Error("Database error"));

    await expect(getRandomCard()).rejects.toThrow("Database error");
  });

  // Test processGuess
  test("processGuess returns correct=true for correct 'after' guess", async () => {
    const result = await processGuess(1990, 2000, "after");

    expect(result.correct).toBe(true);
    expect(result.nextCard).toBeDefined();
  });

  test("processGuess returns correct=false for incorrect 'after' guess", async () => {
    const result = await processGuess(2000, 1990, "after");

    expect(result.correct).toBe(false);
    expect(result.nextCard).toBeNull();
  });

  test("processGuess returns correct=true for correct 'before' guess", async () => {
    const result = await processGuess(2000, 1990, "before");

    expect(result.correct).toBe(true);
    expect(result.nextCard).toBeDefined();
  });

  test("processGuess returns correct=false for incorrect 'before' guess", async () => {
    const result = await processGuess(1990, 2000, "before");

    expect(result.correct).toBe(false);
    expect(result.nextCard).toBeNull();
  });
});
