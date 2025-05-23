import { render, screen } from "@testing-library/react";
import Card from "../../src/components/Card";
import { describe, it, expect } from "@jest/globals";

describe("Card component", () => {
  it("shows numeric date format for reference card", () => {
    render(
      <Card
        title="Mona Lisa"
        imageUrl="test.jpg"
        year={1503}
        month={10}
        isReference={true}
      />
    );
    expect(screen.getByText("10/1503")).toBeInTheDocument();
  });

  it("hides date for non-reference card", () => {
    render(
      <Card
        title="Abbey Road"
        imageUrl="test.jpg"
        year={1969}
        month={9}
        isReference={false}
      />
    );
    // Should show question mark instead of date
    expect(screen.getByText("?")).toBeInTheDocument();
    // Should not show the actual date
    expect(screen.queryByText("9/1969")).not.toBeInTheDocument();
  });

  it("shows correct numeric format for single-digit month", () => {
    render(
      <Card
        title="Star Wars"
        imageUrl="test.jpg"
        year={1977}
        month={5}
        isReference={true}
      />
    );
    expect(screen.getByText("5/1977")).toBeInTheDocument();
  });
});
