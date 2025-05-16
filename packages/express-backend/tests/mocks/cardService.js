// Mock implementation of cardService for testing
let callCount = 0;

async function getRandomCard() {
  // Return different cards on each call
  callCount++;
  return {
    _id: `mock-id-${callCount}`,
    title: `Test Card ${callCount}`,
    year: 2000 + callCount,
    imageUrl: "https://example.com/image.jpg",
    sourceUrl: "https://example.com",
    category: callCount % 2 === 0 ? "movie" : "album",
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

async function processGuess(previousYear, currentYear, guess) {
  // Determine if guess is correct
  const isAfter = currentYear > previousYear;
  const correct =
    (guess === "after" && isAfter) || (guess === "before" && !isAfter);

  // Return next card if correct
  return {
    correct,
    nextCard: correct ? await getRandomCard() : null
  };
}

module.exports = {
  getRandomCard,
  processGuess
};
