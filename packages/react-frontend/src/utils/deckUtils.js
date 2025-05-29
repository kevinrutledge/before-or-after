/**
 * Deck management utilities for card gameplay.
 * Provide shuffle and draw operations for eliminating duplicate cards.
 */

/**
 * Shuffle array using Fisher-Yates algorithm.
 * Create randomized order while preserving all original elements.
 */
export function shuffleDeck(cards) {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Draw next card from deck.
 * Remove and return card from end of deck array.
 */
export function drawCard(deck) {
  return deck.length > 0 ? deck.pop() : null;
}
