import { render, screen, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach } from "@jest/globals";
import LossGifCard from "../../src/components/LossGifCard";

describe("LossGifCard component", () => {
  let mockOnEdit;
  let mockLossGif;

  beforeEach(() => {
    mockOnEdit = jest.fn();
    mockLossGif = {
      _id: "test-id",
      category: "frustrated",
      streakThreshold: 5,
      scoreRange: "2 - 4",
      imageUrl: "https://example.com/frustrated.gif",
      thumbnailUrl: "https://example.com/frustrated-thumb.gif"
    };
  });

  test("renders loss GIF title correctly", () => {
    render(<LossGifCard lossGif={mockLossGif} onEdit={mockOnEdit} />);

    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "frustrated"
    );
  });

  test("displays streak threshold in card info", () => {
    render(<LossGifCard lossGif={mockLossGif} onEdit={mockOnEdit} />);

    expect(screen.getByText("Threshold: 5")).toBeInTheDocument();
  });

  test("shows score range in card info section", () => {
    render(<LossGifCard lossGif={mockLossGif} onEdit={mockOnEdit} />);
    expect(screen.getByText("Score: 2 - 4")).toBeInTheDocument();
  });

  test("displays thumbnail image with correct attributes", () => {
    render(<LossGifCard lossGif={mockLossGif} onEdit={mockOnEdit} />);

    const image = screen.getByAltText("frustrated");
    expect(image).toHaveAttribute(
      "src",
      "https://example.com/frustrated-thumb.gif"
    );
    expect(image).toHaveAttribute("loading", "lazy");
  });

  test("falls back to imageUrl when thumbnailUrl missing", () => {
    const lossGifWithoutThumbnail = {
      ...mockLossGif,
      thumbnailUrl: null
    };

    render(
      <LossGifCard lossGif={lossGifWithoutThumbnail} onEdit={mockOnEdit} />
    );

    const image = screen.getByAltText("frustrated");
    expect(image).toHaveAttribute("src", "https://example.com/frustrated.gif");
  });

  test("triggers edit callback when edit button clicked", () => {
    render(<LossGifCard lossGif={mockLossGif} onEdit={mockOnEdit} />);

    const editButton = screen.getByTitle("Edit loss GIF");
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(mockLossGif);
  });

  test("applies correct CSS classes for consistency", () => {
    const { container } = render(
      <LossGifCard lossGif={mockLossGif} onEdit={mockOnEdit} />
    );

    // Verify admin card structure classes
    expect(container.querySelector(".admin-card-item")).toBeInTheDocument();
    expect(container.querySelector(".admin-card-title")).toBeInTheDocument();
    expect(
      container.querySelector(".admin-card-container")
    ).toBeInTheDocument();
    expect(container.querySelector(".admin-card-image")).toBeInTheDocument();
    expect(container.querySelector(".admin-card-overlay")).toBeInTheDocument();
    expect(container.querySelector(".admin-edit-button")).toBeInTheDocument();
    expect(container.querySelector(".admin-card-info")).toBeInTheDocument();
    expect(container.querySelector(".admin-card-category")).toBeInTheDocument();
  });

  test("renders edit button with correct SVG icon", () => {
    render(<LossGifCard lossGif={mockLossGif} onEdit={mockOnEdit} />);

    const editButton = screen.getByTitle("Edit loss GIF");
    const svg = editButton.querySelector("svg");

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "16");
    expect(svg).toHaveAttribute("height", "16");
    expect(svg).toHaveAttribute("fill", "none");
    expect(svg).toHaveAttribute("stroke", "currentColor");
  });

  test("handles missing category gracefully", () => {
    const lossGifWithoutCategory = {
      ...mockLossGif,
      category: ""
    };

    render(
      <LossGifCard lossGif={lossGifWithoutCategory} onEdit={mockOnEdit} />
    );

    // Should still render structure without errors
    expect(screen.getByTitle("Edit loss GIF")).toBeInTheDocument();
  });

  test("displays different streak thresholds correctly", () => {
    const highThresholdGif = {
      ...mockLossGif,
      streakThreshold: 25
    };

    render(<LossGifCard lossGif={highThresholdGif} onEdit={mockOnEdit} />);

    expect(screen.getByText("Threshold: 25")).toBeInTheDocument();
  });

  test("forwards ref correctly", () => {
    const mockRef = jest.fn();

    render(
      <LossGifCard ref={mockRef} lossGif={mockLossGif} onEdit={mockOnEdit} />
    );

    expect(mockRef).toHaveBeenCalled();
  });
});
