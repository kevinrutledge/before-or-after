/**
 * Compare two cards based on release date.
 * @param {Object} oldCard - Reference card with year and month
 * @param {Object} newCard - Card to compare with year and month
 * @param {String} guess - Player's guess ("before" or "after")
 * @returns {Boolean} True if guess is correct, false otherwise
 *
 * Example:
 *   compareCards({year: 2000, month: 5}, {year: 1999, month: 12}, "before") // true
 *   compareCards({year: 2000, month: 5}, {year: 2001, month: 1}, "after")   // true
 *   compareCards({year: 2000, month: 5}, {year: 2000, month: 4}, "before")  // true
 *   compareCards({year: 2000, month: 5}, {year: 2000, month: 5}, "before")  // false
 */
export function compareCards(oldCard, newCard, guess) {
  if (!oldCard || !newCard || !guess) return false;

  // Compare years first
  if (newCard.year < oldCard.year) {
    return guess === "before";
  }
  if (newCard.year > oldCard.year) {
    return guess === "after";
  }
  // Years are equal, compare months
  if (newCard.month < oldCard.month) {
    return guess === "before";
  }
  if (newCard.month > oldCard.month) {
    return guess === "after";
  }
  // Same year and month: neither before nor after
  return false;
}
