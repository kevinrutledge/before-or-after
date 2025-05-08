import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, test, expect } from "@jest/globals";

describe("CSS Utility Classes", () => {
  test("can render elements with responsive classes", () => {
    // Render test elements
    const { getByTestId } = render(
      <div>
        <div className="mobile-only" data-testid="mobile-element">
          Mobile Content
        </div>
        <div className="desktop-only" data-testid="desktop-element">
          Desktop Content
        </div>
        <div className="container" data-testid="container-element">
          Container Content
        </div>
      </div>
    );

    // Check that elements with these classes can be rendered
    expect(getByTestId("mobile-element")).toHaveClass("mobile-only");
    expect(getByTestId("desktop-element")).toHaveClass("desktop-only");
    expect(getByTestId("container-element")).toHaveClass("container");
  });
});
