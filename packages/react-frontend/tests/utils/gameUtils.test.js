import { compareCards } from "../../src/utils/gameUtils";
import { describe, test, expect } from "@jest/globals";

describe("compareCards", () => {
  test("returns true for 'before' when newCard is before oldCard (year)", () => {
    expect(
      compareCards(
        { year: 2000, month: 5 },
        { year: 1999, month: 12 },
        "before"
      )
    ).toBe(true);
  });

  test("returns true for 'after' when newCard is after oldCard (year)", () => {
    expect(
      compareCards({ year: 2000, month: 5 }, { year: 2001, month: 1 }, "after")
    ).toBe(true);
  });

  test("returns true for 'before' when same year, newCard month is before", () => {
    expect(
      compareCards({ year: 2000, month: 5 }, { year: 2000, month: 4 }, "before")
    ).toBe(true);
  });

  test("returns true for 'after' when same year, newCard month is after", () => {
    expect(
      compareCards({ year: 2000, month: 5 }, { year: 2000, month: 6 }, "after")
    ).toBe(true);
  });

  test("returns false for same year and month", () => {
    expect(
      compareCards({ year: 2000, month: 5 }, { year: 2000, month: 5 }, "before")
    ).toBe(false);
    expect(
      compareCards({ year: 2000, month: 5 }, { year: 2000, month: 5 }, "after")
    ).toBe(false);
  });

  test("returns false for incorrect guess", () => {
    expect(
      compareCards({ year: 2000, month: 5 }, { year: 2001, month: 1 }, "before")
    ).toBe(false);
    expect(
      compareCards({ year: 2000, month: 5 }, { year: 1999, month: 12 }, "after")
    ).toBe(false);
    expect(
      compareCards({ year: 2000, month: 5 }, { year: 2000, month: 4 }, "after")
    ).toBe(false);
    expect(
      compareCards({ year: 2000, month: 5 }, { year: 2000, month: 6 }, "before")
    ).toBe(false);
  });

  test("returns false if any argument is missing", () => {
    expect(compareCards(null, { year: 2000, month: 5 }, "before")).toBe(false);
    expect(compareCards({ year: 2000, month: 5 }, null, "before")).toBe(false);
    expect(
      compareCards({ year: 2000, month: 5 }, { year: 2000, month: 6 }, null)
    ).toBe(false);
  });
});
