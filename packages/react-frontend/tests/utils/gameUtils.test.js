import { shuffleDeck, drawCard } from "../../src/utils/deckUtils";
import { describe, test, expect, beforeEach } from "@jest/globals";

describe("deckUtils", () => {
  let testCards;

  beforeEach(() => {
    // Create fresh test data for each test
    testCards = [
      { id: 1, title: "Card A", year: 2000 },
      { id: 2, title: "Card B", year: 2001 },
      { id: 3, title: "Card C", year: 2002 },
      { id: 4, title: "Card D", year: 2003 },
      { id: 5, title: "Card E", year: 2004 }
    ];
  });

  describe("shuffleDeck", () => {
    test("returns array with same length as input", () => {
      const shuffled = shuffleDeck(testCards);

      expect(shuffled).toHaveLength(testCards.length);
    });

    test("preserves original array without mutation", () => {
      const originalLength = testCards.length;
      const firstCard = testCards[0];

      shuffleDeck(testCards);

      expect(testCards).toHaveLength(originalLength);
      expect(testCards[0]).toBe(firstCard);
    });

    test("contains all original cards", () => {
      const shuffled = shuffleDeck(testCards);

      testCards.forEach((card) => {
        expect(shuffled).toContainEqual(card);
      });
    });

    test("produces different order on multiple calls", () => {
      // Run multiple shuffles to detect randomization
      const shuffleResults = [];
      for (let i = 0; i < 10; i++) {
        shuffleResults.push(shuffleDeck(testCards));
      }

      // Check that at least one shuffle differs from original order
      const hasRandomization = shuffleResults.some((shuffled) => {
        return shuffled.some((card, index) => card.id !== testCards[index].id);
      });

      expect(hasRandomization).toBe(true);
    });

    test("handles empty array", () => {
      const shuffled = shuffleDeck([]);

      expect(shuffled).toHaveLength(0);
      expect(Array.isArray(shuffled)).toBe(true);
    });

    test("handles single card array", () => {
      const singleCard = [testCards[0]];
      const shuffled = shuffleDeck(singleCard);

      expect(shuffled).toHaveLength(1);
      expect(shuffled[0]).toEqual(testCards[0]);
    });
  });

  describe("drawCard", () => {
    test("returns last card from deck", () => {
      const deck = [...testCards];
      const expectedCard = deck[deck.length - 1];

      const drawnCard = drawCard(deck);

      expect(drawnCard).toEqual(expectedCard);
    });

    test("removes card from deck", () => {
      const deck = [...testCards];
      const originalLength = deck.length;

      drawCard(deck);

      expect(deck).toHaveLength(originalLength - 1);
    });

    test("modifies original deck array", () => {
      const deck = [...testCards];
      const lastCard = deck[deck.length - 1];

      drawCard(deck);

      expect(deck).not.toContain(lastCard);
    });

    test("returns null when deck is empty", () => {
      const emptyDeck = [];

      const drawnCard = drawCard(emptyDeck);

      expect(drawnCard).toBeNull();
    });

    test("handles sequential draws correctly", () => {
      const deck = [...testCards];
      const originalCards = [...testCards];
      const drawnCards = [];

      // Draw all cards
      while (deck.length > 0) {
        drawnCards.push(drawCard(deck));
      }

      expect(drawnCards).toHaveLength(originalCards.length);
      expect(deck).toHaveLength(0);

      // Verify cards drawn in reverse order
      drawnCards.forEach((card, index) => {
        const expectedIndex = originalCards.length - 1 - index;
        expect(card).toEqual(originalCards[expectedIndex]);
      });
    });

    test("returns null after deck exhausted", () => {
      const deck = [testCards[0]];

      // Draw the only card
      const firstDraw = drawCard(deck);
      expect(firstDraw).toEqual(testCards[0]);

      // Attempt second draw on empty deck
      const secondDraw = drawCard(deck);
      expect(secondDraw).toBeNull();
    });
  });
});
