import { render, screen } from "@testing-library/react";
import ResultOverlay from "../../src/components/ResultOverlay";
import { describe, test, expect } from "@jest/globals";
import { jest } from "@jest/globals";

describe("ResultOverlay", () => {
  test("shows correct message when visible", () => {
    render(
      <ResultOverlay
        visible={true}
        oldTitle="Card A"
        newTitle="Card B"
        relation="Before"
        onAnimationComplete={() => {}}
      />
    );
    expect(screen.getByTestId("result-overlay")).toHaveClass("visible");
    expect(screen.getByTestId("result-message").textContent).toContain(
      "Card B is Before Card A"
    );
  });

  test("calls onAnimationComplete after timeout", () => {
    jest.useFakeTimers();
    const mockCallback = jest.fn();
    render(
      <ResultOverlay
        visible={true}
        oldTitle="Card A"
        newTitle="Card B"
        relation="After"
        onAnimationComplete={mockCallback}
      />
    );
    jest.advanceTimersByTime(1500);
    expect(mockCallback).toHaveBeenCalled();
    jest.useRealTimers();
  });

  test("does not show overlay when not visible", () => {
    render(
      <ResultOverlay
        visible={false}
        oldTitle="Card A"
        newTitle="Card B"
        relation="After"
        onAnimationComplete={() => {}}
      />
    );
    expect(screen.getByTestId("result-overlay")).not.toHaveClass("visible");
  });
});
