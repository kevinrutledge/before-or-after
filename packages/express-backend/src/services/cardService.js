import { getCardsCollection } from "../../models/Card.js";

/**
 * Retrieve random card for gameplay.
 */
export async function getRandomCard() {
  let client;

  try {
    const { client: dbClient, collection } = await getCardsCollection();
    client = dbClient;

    // Get random card using MongoDB aggregation
    const [card] = await collection
      .aggregate([{ $sample: { size: 1 } }])
      .toArray();

    return card;
  } catch (error) {
    console.error("Error retrieving random card:", error);
    throw error;
  } finally {
    if (client) await client.close();
  }
}

/**
 * Process user's before/after guess.
 */
export async function processGuess(previousYear, currentYear, guess) {
  // Determine if guess is correct based on year comparison
  const isAfter = currentYear > previousYear;
  const correct =
    (guess === "after" && isAfter) || (guess === "before" && !isAfter);

  // Get next card if guess is correct
  let nextCard = null;
  if (correct) {
    nextCard = await getRandomCard();
  }

  return { correct, nextCard };
}
