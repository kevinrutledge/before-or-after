import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { getRandomCard, processGuess } from "../src/services/cardService.js";

describe("Card Service Mock Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getRandomCard mock", () => {
    test("returns mock card with expected properties", async () => {
      const card = await getRandomCard();

      expect(card).toBeDefined();
      expect(card._id).toBe("mock-card-id");
      expect(card.title).toBe("Mock Card");
      expect(card.year).toBe(2020);
      expect(card.month).toBe(6);
      expect(card.imageUrl).toBe("https://example.com/mock.jpg");
      expect(card.thumbnailUrl).toBe("https://example.com/mock-thumb.jpg");
      expect(card.sourceUrl).toBe("https://example.com/mock");
      expect(card.category).toBe("movie");
      expect(card.createdAt).toBeInstanceOf(Date);
      expect(card.updatedAt).toBeInstanceOf(Date);
    });

    test("always returns same mock data", async () => {
      const card1 = await getRandomCard();
      const card2 = await getRandomCard();

      expect(card1.title).toBe("Mock Card");
      expect(card2.title).toBe("Mock Card");
      expect(card1._id).toBe(card2._id);
      expect(card1.year).toBe(card2.year);
    });

    test("never returns null", async () => {
      const card = await getRandomCard();
      expect(card).not.toBeNull();
    });
  });

  describe("processGuess mock", () => {
    test("returns correct=true for correct 'after' guess", async () => {
      const result = await processGuess(1990, 6, 2000, 5, "after");

      expect(result.correct).toBe(true);
      expect(result.nextCard).toBeDefined();
      expect(result.nextCard.title).toBe("Mock Card");
    });

    test("returns correct=false for incorrect 'after' guess", async () => {
      const result = await processGuess(2000, 5, 1990, 6, "after");

      expect(result.correct).toBe(false);
      expect(result.nextCard).toBeNull();
    });

    test("returns correct=true for correct 'before' guess", async () => {
      const result = await processGuess(2000, 5, 1990, 6, "before");

      expect(result.correct).toBe(true);
      expect(result.nextCard).toBeDefined();
      expect(result.nextCard.title).toBe("Mock Card");
    });

    test("returns correct=false for incorrect 'before' guess", async () => {
      const result = await processGuess(1990, 6, 2000, 5, "before");

      expect(result.correct).toBe(false);
      expect(result.nextCard).toBeNull();
    });

    test("handles same year different month correctly", async () => {
      // Current month after previous month
      const laterResult = await processGuess(2020, 3, 2020, 8, "after");
      expect(laterResult.correct).toBe(true);
      expect(laterResult.nextCard.title).toBe("Mock Card");

      // Current month before previous month
      const earlierResult = await processGuess(2020, 8, 2020, 3, "before");
      expect(earlierResult.correct).toBe(true);
      expect(earlierResult.nextCard.title).toBe("Mock Card");
    });

    test("handles same year and month as always correct", async () => {
      const afterResult = await processGuess(2020, 6, 2020, 6, "after");
      expect(afterResult.correct).toBe(true);
      expect(afterResult.nextCard.title).toBe("Mock Card");

      const beforeResult = await processGuess(2020, 6, 2020, 6, "before");
      expect(beforeResult.correct).toBe(true);
      expect(beforeResult.nextCard.title).toBe("Mock Card");
    });

    test("handles edge cases with zero and negative values", async () => {
      const zeroResult = await processGuess(0, 1, 1, 2, "after");
      expect(zeroResult.correct).toBe(true);
      expect(zeroResult.nextCard.title).toBe("Mock Card");

      const negativeResult = await processGuess(-100, 3, -50, 8, "after");
      expect(negativeResult.correct).toBe(true);
      expect(negativeResult.nextCard.title).toBe("Mock Card");
    });

    test("handles boundary month values", async () => {
      const boundaryResult = await processGuess(2020, 1, 2020, 12, "after");
      expect(boundaryResult.correct).toBe(true);
      expect(boundaryResult.nextCard.title).toBe("Mock Card");
    });

    test("returns null nextCard for incorrect guesses", async () => {
      const incorrectAfterResult = await processGuess(
        2020,
        8,
        2020,
        3,
        "after"
      );
      expect(incorrectAfterResult.correct).toBe(false);
      expect(incorrectAfterResult.nextCard).toBeNull();

      const incorrectBeforeResult = await processGuess(
        2020,
        3,
        2020,
        8,
        "before"
      );
      expect(incorrectBeforeResult.correct).toBe(false);
      expect(incorrectBeforeResult.nextCard).toBeNull();
    });

    test("returns consistent mock card for all correct guesses", async () => {
      const result1 = await processGuess(2000, 1, 2001, 1, "after");
      const result2 = await processGuess(2001, 1, 2000, 1, "before");
      const result3 = await processGuess(2020, 5, 2020, 5, "after");

      expect(result1.correct).toBe(true);
      expect(result2.correct).toBe(true);
      expect(result3.correct).toBe(true);

      expect(result1.nextCard.title).toBe("Mock Card");
      expect(result2.nextCard.title).toBe("Mock Card");
      expect(result3.nextCard.title).toBe("Mock Card");

      expect(result1.nextCard._id).toBe("mock-card-id");
      expect(result2.nextCard._id).toBe("mock-card-id");
      expect(result3.nextCard._id).toBe("mock-card-id");
    });

    test("implements 5-parameter signature correctly", async () => {
      // Verify function accepts all 5 parameters without error
      const result = await processGuess(2020, 6, 2021, 8, "after");

      expect(result).toHaveProperty("correct");
      expect(result).toHaveProperty("nextCard");
      expect(typeof result.correct).toBe("boolean");
    });

    test("validates comparison logic works with months", async () => {
      // Same year, earlier month should be "before"
      const beforeResult = await processGuess(2020, 8, 2020, 3, "before");
      expect(beforeResult.correct).toBe(true);

      // Same year, later month should be "after"
      const afterResult = await processGuess(2020, 3, 2020, 8, "after");
      expect(afterResult.correct).toBe(true);

      // Wrong direction should be incorrect
      const wrongResult = await processGuess(2020, 3, 2020, 8, "before");
      expect(wrongResult.correct).toBe(false);
    });
  });
});
