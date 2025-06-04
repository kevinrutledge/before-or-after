async function getRandomCard() {
  return {
    _id: "mock-card-id",
    title: "Mock Card",
    year: 2020,
    month: 6,
    imageUrl: "https://example.com/mock.jpg",
    thumbnailUrl: "https://example.com/mock-thumb.jpg",
    sourceUrl: "https://example.com/mock",
    category: "movie",
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

async function processGuess(
  previousYear,
  previousMonth,
  currentYear,
  currentMonth,
  guess
) {
  // Same year and month always correct regardless of guess
  if (currentYear === previousYear && currentMonth === previousMonth) {
    return {
      correct: true,
      nextCard: await getRandomCard()
    };
  }

  // Determine if current is after previous based on year and month
  const isAfter =
    currentYear > previousYear ||
    (currentYear === previousYear && currentMonth > previousMonth);

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
