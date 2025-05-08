import { getRandomCard } from "../src/services/cardService.js";
import { seedDatabase } from "../scripts/seed.js";

describe("Random Card Selection", () => {
  beforeAll(async () => {
    // Ensure we have data to test with
    await seedDatabase();
  });

  test("getRandomCard returns different cards on multiple calls", async () => {
    // Get multiple random cards
    const results = new Set();

    for (let i = 0; i < 10; i++) {
      const card = await getRandomCard();
      if (card) {
        // Use both title and year to identify unique cards
        results.add(`${card.title}_${card.year}`);
      }
    }

    // With 10 cards in seed data, we should get at least 3 different cards
    // in 10 attempts if randomization works correctly
    expect(results.size).toBeGreaterThan(2);
  });
});
