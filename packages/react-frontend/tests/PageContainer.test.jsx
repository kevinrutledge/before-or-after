import { render, screen } from "@testing-library/react";
import PageContainer from "../src/components/PageContainer";
import { describe, test, expect } from "@jest/globals";

describe("PageContainer component", () => {
  test("renders children inside container", () => {
    render(
      <PageContainer>
        <div data-testid="test-child">Test Content</div>
      </PageContainer>
    );

    // Check child content is rendered
    const childElement = screen.getByTestId("test-child");
    expect(childElement).toBeInTheDocument();
    expect(childElement).toHaveTextContent("Test Content");
  });

  test("applies correct container classes", () => {
    render(
      <PageContainer>
        <div>Test Content</div>
      </PageContainer>
    );

    // Get the container element
    const container = screen
      .getByText("Test Content")
      .closest(".page-container");
    expect(container).toBeInTheDocument();

    // Check that it contains a div with the container class
    const innerContainer = container.querySelector(".container");
    expect(innerContainer).toBeInTheDocument();
  });
});
