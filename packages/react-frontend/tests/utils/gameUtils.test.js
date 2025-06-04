import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach } from "@jest/globals";
import { compareCards } from "../../src/utils/gameUtils";

describe("gameUtils utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("compareCards", () => {
    describe("Year-based comparisons", () => {
      test("returns true when new card year is before old card year and guess is before", () => {
        const oldCard = { year: 2000, month: 5 };
        const newCard = { year: 1999, month: 12 };

        const result = compareCards(oldCard, newCard, "before");

        expect(result).toBe(true);
      });

      test("returns false when new card year is before old card year and guess is after", () => {
        const oldCard = { year: 2000, month: 5 };
        const newCard = { year: 1999, month: 12 };

        const result = compareCards(oldCard, newCard, "after");

        expect(result).toBe(false);
      });

      test("returns true when new card year is after old card year and guess is after", () => {
        const oldCard = { year: 2000, month: 5 };
        const newCard = { year: 2001, month: 1 };

        const result = compareCards(oldCard, newCard, "after");

        expect(result).toBe(true);
      });

      test("returns false when new card year is after old card year and guess is before", () => {
        const oldCard = { year: 2000, month: 5 };
        const newCard = { year: 2001, month: 1 };

        const result = compareCards(oldCard, newCard, "before");

        expect(result).toBe(false);
      });

      test("handles large year differences correctly", () => {
        const oldCard = { year: 2000, month: 1 };
        const newCard = { year: 1950, month: 12 };

        const result = compareCards(oldCard, newCard, "before");

        expect(result).toBe(true);
      });
    });

    describe("Month-based comparisons with same year", () => {
      test("returns true when new card month is before old card month and guess is before", () => {
        const oldCard = { year: 2000, month: 5 };
        const newCard = { year: 2000, month: 4 };

        const result = compareCards(oldCard, newCard, "before");

        expect(result).toBe(true);
      });

      test("returns false when new card month is before old card month and guess is after", () => {
        const oldCard = { year: 2000, month: 5 };
        const newCard = { year: 2000, month: 4 };

        const result = compareCards(oldCard, newCard, "after");

        expect(result).toBe(false);
      });

      test("returns true when new card month is after old card month and guess is after", () => {
        const oldCard = { year: 2000, month: 5 };
        const newCard = { year: 2000, month: 6 };

        const result = compareCards(oldCard, newCard, "after");

        expect(result).toBe(true);
      });

      test("returns false when new card month is after old card month and guess is before", () => {
        const oldCard = { year: 2000, month: 5 };
        const newCard = { year: 2000, month: 6 };

        const result = compareCards(oldCard, newCard, "before");

        expect(result).toBe(false);
      });

      test("handles edge months correctly", () => {
        const oldCard = { year: 2000, month: 1 };
        const newCard = { year: 2000, month: 12 };

        const result = compareCards(oldCard, newCard, "after");

        expect(result).toBe(true);
      });

      test("handles January to December comparison", () => {
        const oldCard = { year: 2000, month: 12 };
        const newCard = { year: 2000, month: 1 };

        const result = compareCards(oldCard, newCard, "before");

        expect(result).toBe(true);
      });
    });

    describe("Exact match scenarios", () => {
      test("returns false when cards have same year and month with before guess", () => {
        const oldCard = { year: 2000, month: 5 };
        const newCard = { year: 2000, month: 5 };

        const result = compareCards(oldCard, newCard, "before");

        expect(result).toBe(false);
      });

      test("returns false when cards have same year and month with after guess", () => {
        const oldCard = { year: 2000, month: 5 };
        const newCard = { year: 2000, month: 5 };

        const result = compareCards(oldCard, newCard, "after");

        expect(result).toBe(false);
      });

      test("handles exact match with different month values", () => {
        const oldCard = { year: 1995, month: 3 };
        const newCard = { year: 1995, month: 3 };

        const beforeResult = compareCards(oldCard, newCard, "before");
        const afterResult = compareCards(oldCard, newCard, "after");

        expect(beforeResult).toBe(false);
        expect(afterResult).toBe(false);
      });
    });

    describe("Input validation", () => {
      test("returns false when oldCard is null", () => {
        const newCard = { year: 2000, month: 5 };

        const result = compareCards(null, newCard, "before");

        expect(result).toBe(false);
      });

      test("returns false when newCard is null", () => {
        const oldCard = { year: 2000, month: 5 };

        const result = compareCards(oldCard, null, "before");

        expect(result).toBe(false);
      });

      test("returns false when guess is null", () => {
        const oldCard = { year: 2000, month: 5 };
        const newCard = { year: 1999, month: 5 };

        const result = compareCards(oldCard, newCard, null);

        expect(result).toBe(false);
      });

      test("returns false when oldCard is undefined", () => {
        const newCard = { year: 2000, month: 5 };

        const result = compareCards(undefined, newCard, "before");

        expect(result).toBe(false);
      });

      test("returns false when newCard is undefined", () => {
        const oldCard = { year: 2000, month: 5 };

        const result = compareCards(oldCard, undefined, "after");

        expect(result).toBe(false);
      });

      test("returns false when guess is undefined", () => {
        const oldCard = { year: 2000, month: 5 };
        const newCard = { year: 1999, month: 5 };

        const result = compareCards(oldCard, newCard, undefined);

        expect(result).toBe(false);
      });

      test("returns false when guess is empty string", () => {
        const oldCard = { year: 2000, month: 5 };
        const newCard = { year: 1999, month: 5 };

        const result = compareCards(oldCard, newCard, "");

        expect(result).toBe(false);
      });

      test("returns false when all parameters are null", () => {
        const result = compareCards(null, null, null);

        expect(result).toBe(false);
      });
    });

    describe("Invalid guess values", () => {
      test("returns false with invalid guess string", () => {
        const oldCard = { year: 2000, month: 5 };
        const newCard = { year: 1999, month: 5 };

        const result = compareCards(oldCard, newCard, "invalid");

        expect(result).toBe(false);
      });

      test("returns false with numeric guess", () => {
        const oldCard = { year: 2000, month: 5 };
        const newCard = { year: 1999, month: 5 };

        const result = compareCards(oldCard, newCard, 1);

        expect(result).toBe(false);
      });

      test("returns false with boolean guess", () => {
        const oldCard = { year: 2000, month: 5 };
        const newCard = { year: 1999, month: 5 };

        const result = compareCards(oldCard, newCard, true);

        expect(result).toBe(false);
      });
    });

    describe("Card property validation", () => {
      test("handles cards with missing year property", () => {
        const oldCard = { month: 5 };
        const newCard = { year: 1999, month: 5 };

        const result = compareCards(oldCard, newCard, "before");

        // Function should handle gracefully - exact behavior depends on implementation
        expect(typeof result).toBe("boolean");
      });

      test("handles cards with missing month property", () => {
        const oldCard = { year: 2000 };
        const newCard = { year: 1999, month: 5 };

        const result = compareCards(oldCard, newCard, "before");

        expect(typeof result).toBe("boolean");
      });

      test("handles cards with string year values", () => {
        const oldCard = { year: "2000", month: 5 };
        const newCard = { year: "1999", month: 5 };

        const result = compareCards(oldCard, newCard, "before");

        expect(typeof result).toBe("boolean");
      });

      test("handles cards with string month values", () => {
        const oldCard = { year: 2000, month: "5" };
        const newCard = { year: 1999, month: "4" };

        const result = compareCards(oldCard, newCard, "before");

        expect(typeof result).toBe("boolean");
      });
    });

    describe("Edge cases and boundary conditions", () => {
      test("handles minimum year values", () => {
        const oldCard = { year: 1, month: 1 };
        const newCard = { year: 0, month: 1 };

        const result = compareCards(oldCard, newCard, "before");

        expect(result).toBe(true);
      });

      test("handles maximum reasonable year values", () => {
        const oldCard = { year: 2030, month: 12 };
        const newCard = { year: 2031, month: 1 };

        const result = compareCards(oldCard, newCard, "after");

        expect(result).toBe(true);
      });

      test("handles month boundary conditions", () => {
        const oldCard = { year: 2000, month: 1 };
        const newCard = { year: 2000, month: 2 };

        const result = compareCards(oldCard, newCard, "after");

        expect(result).toBe(true);
      });

      test("handles December to January year transition", () => {
        const oldCard = { year: 1999, month: 12 };
        const newCard = { year: 2000, month: 1 };

        const result = compareCards(oldCard, newCard, "after");

        expect(result).toBe(true);
      });
    });

    describe("Case sensitivity for guess parameter", () => {
      test("handles uppercase BEFORE guess", () => {
        const oldCard = { year: 2000, month: 5 };
        const newCard = { year: 1999, month: 5 };

        const result = compareCards(oldCard, newCard, "BEFORE");

        expect(result).toBe(false);
      });

      test("handles uppercase AFTER guess", () => {
        const oldCard = { year: 2000, month: 5 };
        const newCard = { year: 2001, month: 5 };

        const result = compareCards(oldCard, newCard, "AFTER");

        expect(result).toBe(false);
      });

      test("handles mixed case Before guess", () => {
        const oldCard = { year: 2000, month: 5 };
        const newCard = { year: 1999, month: 5 };

        const result = compareCards(oldCard, newCard, "Before");

        expect(result).toBe(false);
      });
    });
  });
});
