import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { shuffleDeck, drawCard } from "../../src/utils/deckUtils";

describe("deckUtils utilities", () => {
  let originalMathRandom;

  beforeEach(() => {
    jest.clearAllMocks();
    originalMathRandom = Math.random;
  });

  afterEach(() => {
    Math.random = originalMathRandom;
  });

  describe("shuffleDeck", () => {
    test("returns array with same length as input", () => {
      const cards = ["card1", "card2", "card3", "card4"];

      const result = shuffleDeck(cards);

      expect(result).toHaveLength(4);
    });

    test("preserves all original elements", () => {
      const cards = ["ace", "king", "queen", "jack"];

      const result = shuffleDeck(cards);

      expect(result).toContain("ace");
      expect(result).toContain("king");
      expect(result).toContain("queen");
      expect(result).toContain("jack");
      expect(result).toHaveLength(cards.length);
    });

    test("does not modify original array", () => {
      const cards = ["card1", "card2", "card3"];
      const originalCards = [...cards];

      shuffleDeck(cards);

      expect(cards).toEqual(originalCards);
    });

    test("returns new array instance", () => {
      const cards = ["card1", "card2", "card3"];

      const result = shuffleDeck(cards);

      expect(result).not.toBe(cards);
    });

    test("handles empty array", () => {
      const cards = [];

      const result = shuffleDeck(cards);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    test("handles single card array", () => {
      const cards = ["onlyCard"];

      const result = shuffleDeck(cards);

      expect(result).toEqual(["onlyCard"]);
      expect(result).toHaveLength(1);
    });

    test("handles array with duplicate elements", () => {
      const cards = ["card1", "card1", "card2", "card2"];

      const result = shuffleDeck(cards);

      expect(result).toHaveLength(4);
      expect(result.filter((card) => card === "card1")).toHaveLength(2);
      expect(result.filter((card) => card === "card2")).toHaveLength(2);
    });

    test("produces different order with controlled randomness", () => {
      const cards = ["A", "B", "C", "D"];

      // Mock Math.random to return specific values for predictable shuffle
      Math.random = jest
        .fn()
        .mockReturnValueOnce(0.9) // Will select index 3
        .mockReturnValueOnce(0.5) // Will select index 1
        .mockReturnValueOnce(0.1); // Will select index 0

      const result = shuffleDeck(cards);

      expect(Math.random).toHaveBeenCalledTimes(3);
      expect(result).not.toEqual(cards);
    });

    test("uses Fisher-Yates algorithm correctly", () => {
      const cards = [1, 2, 3, 4];

      // Mock specific random values to trace algorithm execution
      Math.random = jest
        .fn()
        .mockReturnValueOnce(0.0) // j = 0, swap positions 3 and 0
        .mockReturnValueOnce(0.99) // j = 2, swap positions 2 and 2
        .mockReturnValueOnce(0.5); // j = 0, swap positions 1 and 0

      const result = shuffleDeck(cards);

      // Verify Math.random called for each iteration (n-1 times)
      expect(Math.random).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(4);
      expect(result).toContain(1);
      expect(result).toContain(2);
      expect(result).toContain(3);
      expect(result).toContain(4);
    });

    test("handles array with object elements", () => {
      const cards = [
        { id: 1, name: "Card 1" },
        { id: 2, name: "Card 2" },
        { id: 3, name: "Card 3" }
      ];

      const result = shuffleDeck(cards);

      expect(result).toHaveLength(3);
      expect(result).toContain(cards[0]);
      expect(result).toContain(cards[1]);
      expect(result).toContain(cards[2]);
    });

    test("handles array with mixed data types", () => {
      const cards = [1, "string", { obj: true }, null, undefined];

      const result = shuffleDeck(cards);

      expect(result).toHaveLength(5);
      expect(result).toContain(1);
      expect(result).toContain("string");
      expect(result).toContain(cards[2]);
      expect(result).toContain(null);
      expect(result).toContain(undefined);
    });

    test("maintains reference equality for object elements", () => {
      const card1 = { id: 1 };
      const card2 = { id: 2 };
      const cards = [card1, card2];

      const result = shuffleDeck(cards);

      expect(result).toContain(card1);
      expect(result).toContain(card2);
      // Verify exact same object references
      expect(result.find((card) => card.id === 1)).toBe(card1);
      expect(result.find((card) => card.id === 2)).toBe(card2);
    });

    test("works with large arrays", () => {
      const cards = Array.from({ length: 1000 }, (_, i) => i);

      const result = shuffleDeck(cards);

      expect(result).toHaveLength(1000);
      expect(result.sort((a, b) => a - b)).toEqual(cards);
    });
  });

  describe("drawCard", () => {
    test("removes and returns last card from deck", () => {
      const deck = ["card1", "card2", "card3"];

      const result = drawCard(deck);

      expect(result).toBe("card3");
      expect(deck).toEqual(["card1", "card2"]);
      expect(deck).toHaveLength(2);
    });

    test("modifies original deck array", () => {
      const deck = ["first", "second", "third"];
      const originalLength = deck.length;

      drawCard(deck);

      expect(deck).toHaveLength(originalLength - 1);
      expect(deck).not.toContain("third");
    });

    test("returns last element consistently", () => {
      const deck = [1, 2, 3, 4, 5];

      const firstDraw = drawCard(deck);
      const secondDraw = drawCard(deck);

      expect(firstDraw).toBe(5);
      expect(secondDraw).toBe(4);
      expect(deck).toEqual([1, 2, 3]);
    });

    test("handles single card deck", () => {
      const deck = ["onlyCard"];

      const result = drawCard(deck);

      expect(result).toBe("onlyCard");
      expect(deck).toEqual([]);
      expect(deck).toHaveLength(0);
    });

    test("returns null for empty deck", () => {
      const deck = [];

      const result = drawCard(deck);

      expect(result).toBeNull();
      expect(deck).toEqual([]);
    });

    test("handles object elements correctly", () => {
      const card1 = { id: 1, name: "First" };
      const card2 = { id: 2, name: "Second" };
      const deck = [card1, card2];

      const result = drawCard(deck);

      expect(result).toBe(card2);
      expect(result).toEqual({ id: 2, name: "Second" });
      expect(deck).toEqual([card1]);
    });

    test("maintains reference equality for drawn objects", () => {
      const cardObject = { id: 1, data: "test" };
      const deck = ["other", cardObject];

      const result = drawCard(deck);

      expect(result).toBe(cardObject);
      expect(result === cardObject).toBe(true);
    });

    test("handles deck with null and undefined elements", () => {
      const deck = [null, undefined, "valid"];

      const firstDraw = drawCard(deck);
      const secondDraw = drawCard(deck);
      const thirdDraw = drawCard(deck);

      expect(firstDraw).toBe("valid");
      expect(secondDraw).toBeUndefined();
      expect(thirdDraw).toBeNull();
      expect(deck).toEqual([]);
    });

    test("works correctly after multiple draws", () => {
      const deck = ["A", "B", "C", "D", "E"];

      const draws = [];
      while (deck.length > 0) {
        draws.push(drawCard(deck));
      }

      expect(draws).toEqual(["E", "D", "C", "B", "A"]);
      expect(deck).toEqual([]);
    });

    test("returns null when drawing from already empty deck", () => {
      const deck = [];

      const firstAttempt = drawCard(deck);
      const secondAttempt = drawCard(deck);

      expect(firstAttempt).toBeNull();
      expect(secondAttempt).toBeNull();
      expect(deck).toEqual([]);
    });

    test("handles deck with mixed data types", () => {
      const deck = [1, "string", { obj: true }, true, null];

      const result = drawCard(deck);

      expect(result).toBeNull();
      expect(deck).toHaveLength(4);
      expect(deck).toEqual([1, "string", { obj: true }, true]);
    });
  });

  describe("Integration scenarios", () => {
    test("draws cards from shuffled deck", () => {
      const originalCards = ["A", "B", "C", "D"];
      const shuffled = shuffleDeck(originalCards);

      const drawnCard = drawCard(shuffled);

      expect(originalCards).toContain(drawnCard);
      expect(shuffled).toHaveLength(3);
      expect(originalCards).toHaveLength(4); // Original unchanged
    });

    test("handles complete deck depletion", () => {
      const cards = ["card1", "card2", "card3"];
      const deck = shuffleDeck(cards);
      const drawnCards = [];

      while (deck.length > 0) {
        drawnCards.push(drawCard(deck));
      }

      expect(drawnCards).toHaveLength(3);
      expect(deck).toEqual([]);
      expect(drawnCards).toContain("card1");
      expect(drawnCards).toContain("card2");
      expect(drawnCards).toContain("card3");
    });

    test("maintains card uniqueness through shuffle and draw", () => {
      const cards = [1, 2, 3, 4, 5];
      const deck = shuffleDeck(cards);
      const drawnCards = [];

      // Draw all cards
      while (deck.length > 0) {
        drawnCards.push(drawCard(deck));
      }

      // Verify no duplicates and all original cards present
      const uniqueDrawn = [...new Set(drawnCards)];
      expect(uniqueDrawn).toHaveLength(5);
      expect(uniqueDrawn.sort()).toEqual([1, 2, 3, 4, 5]);
    });

    test("shuffled deck produces different draw orders", () => {
      const cards = [1, 2, 3, 4, 5];

      // Create two shuffled decks
      const deck1 = shuffleDeck(cards);
      const deck2 = shuffleDeck(cards);

      // Draw first card from each
      const firstCard1 = drawCard(deck1);
      const firstCard2 = drawCard(deck2);

      // While they might be the same due to randomness, verify functionality
      expect(cards).toContain(firstCard1);
      expect(cards).toContain(firstCard2);
      expect(deck1).toHaveLength(4);
      expect(deck2).toHaveLength(4);
    });
  });

  describe("Edge cases and error handling", () => {
    test("shuffleDeck handles non-array input gracefully", () => {
      // Test actual behavior - spread operator will throw for null/undefined
      expect(() => shuffleDeck(null)).toThrow();
      expect(() => shuffleDeck(undefined)).toThrow();

      // String spreads to array of characters, should not throw
      const result = shuffleDeck("abc");
      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain("a");
      expect(result).toContain("b");
      expect(result).toContain("c");
      expect(result).toHaveLength(3);
    });

    test("drawCard handles non-array input gracefully", () => {
      expect(() => drawCard(null)).toThrow();
      expect(() => drawCard(undefined)).toThrow();
      expect(() => drawCard("string")).toThrow();
    });

    test("handles very large deck operations", () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => i);

      const shuffled = shuffleDeck(largeArray);
      expect(shuffled).toHaveLength(10000);

      const drawn = drawCard(shuffled);
      expect(typeof drawn).toBe("number");
      expect(shuffled).toHaveLength(9999);
    });
  });
});
