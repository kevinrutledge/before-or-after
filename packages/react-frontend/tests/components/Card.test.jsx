import { render, screen } from "@testing-library/react";
import Card from "../../src/components/Card";
import { describe, it, expect } from "@jest/globals";

describe("Card component", () => {
  it("shows formatted date as 'Month Year' for reference card", () => {
    render(
      <Card
        title="Mona Lisa"
        imageUrl="test.jpg"
        year={1503}
        month={10}
        isReference={true}
      />
    );
    expect(screen.getByText("October 1503")).toBeInTheDocument();
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
    // Should not find any month name
    expect(
      screen.queryByText(
        /January|February|March|April|May|June|July|August|September|October|November|December/
      )
    ).not.toBeInTheDocument();
  });

  it("shows correct month name for single-digit month", () => {
    render(
      <Card
        title="Star Wars"
        imageUrl="test.jpg"
        year={1977}
        month={5}
        isReference={true}
      />
    );
    expect(screen.getByText("May 1977")).toBeInTheDocument();
  });
});
