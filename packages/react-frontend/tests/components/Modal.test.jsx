import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "../../src/components/Modal";

// Mock external dependencies to prevent test interference
jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: "/" })
}));

describe("Modal Component", () => {
  test("renders modal content when open", () => {
    render(
      <Modal isOpen={true}>
        <div data-testid="modal-content">Test Content</div>
      </Modal>
    );

    // Verify Modal displays children content that is passed as props
    expect(screen.getByTestId("modal-content")).toBeInTheDocument();
  });

  test("does not render modal content when closed", () => {
    render(
      <Modal isOpen={false}>
        <div data-testid="modal-content">Test Content</div>
      </Modal>
    );

    // Verify Modal hides children content that should not display
    expect(screen.queryByTestId("modal-content")).not.toBeInTheDocument();
  });

  test("renders modal overlay when open", () => {
    render(
      <Modal isOpen={true}>
        <div>Content</div>
      </Modal>
    );

    // Verify Modal creates overlay element that provides backdrop functionality
    const overlay = document.querySelector(".modal-overlay");
    expect(overlay).toBeInTheDocument();
  });

  test("calls onClose when overlay is clicked", () => {
    const mockOnClose = jest.fn();

    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div data-testid="modal-content">Content</div>
      </Modal>
    );

    // Find and click overlay element that triggers close functionality
    const overlay = document.querySelector(".modal-overlay");

    if (overlay) {
      fireEvent.click(overlay);
      // Verify Modal calls onClose function that parent component provides
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  test("handles escape key press", () => {
    const mockOnClose = jest.fn();

    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Content</div>
      </Modal>
    );

    // Trigger escape key event that should close modal
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

    // Verify Modal responds to escape key that provides keyboard accessibility
    expect(mockOnClose).toHaveBeenCalled();
  });
});
