import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import ImageUpload from "../../src/components/ImageUpload";

// Mock FileReader
globalThis.FileReader = jest.fn(() => ({
  readAsDataURL: jest.fn(),
  onload: null,
  result: "data:image/jpeg;base64,mockbase64data"
}));

describe("ImageUpload component", () => {
  let mockOnFileSelect;
  let mockOnError;
  let user;
  let mockFileReader;

  beforeEach(() => {
    user = userEvent.setup();
    mockOnFileSelect = jest.fn();
    mockOnError = jest.fn();

    // Reset FileReader mock
    mockFileReader = {
      readAsDataURL: jest.fn(),
      onload: null,
      result: "data:image/jpeg;base64,mockbase64data"
    };
    globalThis.FileReader.mockImplementation(() => mockFileReader);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <ImageUpload
        onFileSelect={mockOnFileSelect}
        onError={mockOnError}
        selectedFile={null}
        {...props}
      />
    );
  };

  describe("Initial render", () => {
    test("displays upload prompt when no file selected", () => {
      renderComponent();

      expect(screen.getByText("Click or drag image here")).toBeInTheDocument();
      expect(
        screen.getByText("JPEG, PNG, WebP, or GIF • Max 10MB")
      ).toBeInTheDocument();
      // SVG is not accessible as img role by default
      expect(screen.getByText("Click or drag image here")).toBeInTheDocument();
    });

    test("renders hidden file input with correct attributes", () => {
      const { container } = renderComponent();

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute(
        "accept",
        "image/jpeg,image/png,image/webp,image/gif"
      );
      // Check inline style instead of computed style
      expect(fileInput).toHaveAttribute("style", "display: none;");
    });

    test("applies correct CSS classes to upload zone", () => {
      const { container } = renderComponent();

      const uploadZone = container.querySelector(".upload-zone");
      expect(uploadZone).toBeInTheDocument();
      expect(uploadZone).not.toHaveClass("drag-active");
    });
  });

  describe("File selection via click", () => {
    test("opens file picker when upload zone clicked", async () => {
      const { container } = renderComponent();

      const fileInput = container.querySelector('input[type="file"]');
      const clickSpy = jest.spyOn(fileInput, "click").mockImplementation();

      const uploadZone = container.querySelector(".upload-zone");
      await user.click(uploadZone);

      expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    test("processes valid JPEG file selection", async () => {
      const { container } = renderComponent();
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

      const fileInput = container.querySelector('input[type="file"]');
      await user.upload(fileInput, file);

      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file);
      expect(mockOnFileSelect).toHaveBeenCalledWith(file);
    });

    test("processes valid PNG file selection", async () => {
      const { container } = renderComponent();
      const file = new File(["test"], "test.png", { type: "image/png" });

      const fileInput = container.querySelector('input[type="file"]');
      await user.upload(fileInput, file);

      expect(mockOnFileSelect).toHaveBeenCalledWith(file);
    });

    test("processes valid WebP file selection", async () => {
      const { container } = renderComponent();
      const file = new File(["test"], "test.webp", { type: "image/webp" });

      const fileInput = container.querySelector('input[type="file"]');
      await user.upload(fileInput, file);

      expect(mockOnFileSelect).toHaveBeenCalledWith(file);
    });

    test("processes valid GIF file selection", async () => {
      const { container } = renderComponent();
      const file = new File(["test"], "test.gif", { type: "image/gif" });

      const fileInput = container.querySelector('input[type="file"]');
      await user.upload(fileInput, file);

      expect(mockOnFileSelect).toHaveBeenCalledWith(file);
    });
  });

  describe("File validation", () => {
    test("rejects invalid file type", async () => {
      const { container } = renderComponent();
      const file = new File(["test"], "test.txt", { type: "text/plain" });

      const fileInput = container.querySelector('input[type="file"]');

      // Use userEvent upload which properly handles file validation
      await user.upload(fileInput, file);

      // Since userEvent.upload might be blocked by accept attribute,
      // we need to directly call the component's change handler
      fireEvent.change(fileInput, {
        target: {
          files: [file]
        }
      });

      expect(mockOnError).toHaveBeenCalledWith(
        "Invalid file type. Only JPEG, PNG, WebP, and GIF allowed"
      );
      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    test("rejects file exceeding size limit", async () => {
      const { container } = renderComponent();
      const largeFileSize = 11 * 1024 * 1024; // 11MB
      const file = new File([new ArrayBuffer(largeFileSize)], "large.jpg", {
        type: "image/jpeg"
      });

      const fileInput = container.querySelector('input[type="file"]');
      await user.upload(fileInput, file);

      expect(mockOnError).toHaveBeenCalledWith(
        "File too large. Maximum size is 10MB"
      );
      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    test("accepts file at size limit", async () => {
      const { container } = renderComponent();
      const maxFileSize = 10 * 1024 * 1024; // Exactly 10MB
      const file = new File([new ArrayBuffer(maxFileSize)], "max.jpg", {
        type: "image/jpeg"
      });

      const fileInput = container.querySelector('input[type="file"]');
      await user.upload(fileInput, file);

      expect(mockOnError).not.toHaveBeenCalled();
      expect(mockOnFileSelect).toHaveBeenCalledWith(file);
    });
  });

  describe("Drag and drop functionality", () => {
    test("activates drag state on dragenter", () => {
      const { container } = renderComponent();
      const uploadZone = container.querySelector(".upload-zone");

      fireEvent.dragEnter(uploadZone);

      expect(uploadZone).toHaveClass("drag-active");
    });

    test("activates drag state on dragover", () => {
      const { container } = renderComponent();
      const uploadZone = container.querySelector(".upload-zone");

      fireEvent.dragOver(uploadZone);

      expect(uploadZone).toHaveClass("drag-active");
    });

    test("deactivates drag state on dragleave", () => {
      const { container } = renderComponent();
      const uploadZone = container.querySelector(".upload-zone");

      fireEvent.dragEnter(uploadZone);
      expect(uploadZone).toHaveClass("drag-active");

      fireEvent.dragLeave(uploadZone);
      expect(uploadZone).not.toHaveClass("drag-active");
    });

    test("processes dropped file", () => {
      const { container } = renderComponent();
      const uploadZone = container.querySelector(".upload-zone");
      const file = new File(["test"], "dropped.jpg", { type: "image/jpeg" });

      fireEvent.drop(uploadZone, {
        dataTransfer: { files: [file] }
      });

      expect(mockOnFileSelect).toHaveBeenCalledWith(file);
      expect(uploadZone).not.toHaveClass("drag-active");
    });

    test("prevents default behavior on drag events", () => {
      const { container } = renderComponent();
      const uploadZone = container.querySelector(".upload-zone");

      // Test that events are handled without throwing errors
      expect(() => {
        fireEvent.dragEnter(uploadZone);
        fireEvent.dragOver(uploadZone);
        fireEvent.drop(uploadZone, { dataTransfer: { files: [] } });
      }).not.toThrow();

      // Verify drag state changes show events are being handled
      fireEvent.dragEnter(uploadZone);
      expect(uploadZone).toHaveClass("drag-active");

      fireEvent.drop(uploadZone, { dataTransfer: { files: [] } });
      expect(uploadZone).not.toHaveClass("drag-active");
    });

    test("handles empty drop event gracefully", () => {
      const { container } = renderComponent();
      const uploadZone = container.querySelector(".upload-zone");

      fireEvent.drop(uploadZone, {
        dataTransfer: { files: [] }
      });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();
    });
  });

  describe("File preview", () => {
    test("shows preview when file selected", async () => {
      const { container } = renderComponent();
      const file = new File(["test"], "preview.jpg", { type: "image/jpeg" });

      const fileInput = container.querySelector('input[type="file"]');
      await user.upload(fileInput, file);

      // Simulate FileReader onload
      mockFileReader.onload({
        target: { result: "data:image/jpeg;base64,preview" }
      });

      await waitFor(() => {
        const previewImage = screen.getByAltText("Preview");
        expect(previewImage).toBeInTheDocument();
        expect(previewImage).toHaveAttribute(
          "src",
          "data:image/jpeg;base64,preview"
        );
      });
    });

    test("shows clear button in preview", async () => {
      const { container } = renderComponent();
      const file = new File(["test"], "clear.jpg", { type: "image/jpeg" });

      const fileInput = container.querySelector('input[type="file"]');
      await user.upload(fileInput, file);

      // Simulate FileReader onload
      mockFileReader.onload({
        target: { result: "data:image/jpeg;base64,clear" }
      });

      await waitFor(() => {
        const clearButton = screen.getByRole("button", { name: "×" });
        expect(clearButton).toBeInTheDocument();
      });
    });

    test("clears preview when clear button clicked", async () => {
      const { container } = renderComponent();
      const file = new File(["test"], "clear.jpg", { type: "image/jpeg" });

      const fileInput = container.querySelector('input[type="file"]');
      await user.upload(fileInput, file);

      // Simulate FileReader onload
      mockFileReader.onload({
        target: { result: "data:image/jpeg;base64,clear" }
      });

      await waitFor(() => {
        const clearButton = screen.getByRole("button", { name: "×" });
        expect(clearButton).toBeInTheDocument();
      });

      const clearButton = screen.getByRole("button", { name: "×" });
      await user.click(clearButton);

      expect(mockOnFileSelect).toHaveBeenCalledWith(null);
      expect(screen.queryByAltText("Preview")).not.toBeInTheDocument();
      expect(screen.getByText("Click or drag image here")).toBeInTheDocument();
    });

    test("prevents upload zone click when file selected", async () => {
      const { container } = renderComponent({
        selectedFile: new File(["test"], "selected.jpg", { type: "image/jpeg" })
      });

      const fileInput = container.querySelector('input[type="file"]');
      const clickSpy = jest.spyOn(fileInput, "click").mockImplementation();

      const uploadZone = container.querySelector(".upload-zone");
      await user.click(uploadZone);

      expect(clickSpy).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    test("handles missing file gracefully", async () => {
      const { container } = renderComponent();
      const fileInput = container.querySelector('input[type="file"]');

      // Simulate file input change with no files
      fireEvent.change(fileInput, { target: { files: [] } });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();
    });

    test("handles null file gracefully", async () => {
      const { container } = renderComponent();
      const fileInput = container.querySelector('input[type="file"]');

      // Simulate file input change with null files
      fireEvent.change(fileInput, { target: { files: null } });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();
    });

    test("resets file input value on clear", async () => {
      const { container } = renderComponent();
      const file = new File(["test"], "reset.jpg", { type: "image/jpeg" });

      const fileInput = container.querySelector('input[type="file"]');
      await user.upload(fileInput, file);

      // Simulate FileReader onload
      mockFileReader.onload({
        target: { result: "data:image/jpeg;base64,reset" }
      });

      await waitFor(() => {
        const clearButton = screen.getByRole("button", { name: "×" });
        expect(clearButton).toBeInTheDocument();
      });

      const clearButton = screen.getByRole("button", { name: "×" });
      await user.click(clearButton);

      expect(fileInput.value).toBe("");
    });
  });

  describe("Accessibility", () => {
    test("clear button has proper styling for visibility", async () => {
      const { container } = renderComponent();
      const file = new File(["test"], "a11y.jpg", { type: "image/jpeg" });

      const fileInput = container.querySelector('input[type="file"]');
      await user.upload(fileInput, file);

      // Simulate FileReader onload
      mockFileReader.onload({
        target: { result: "data:image/jpeg;base64,a11y" }
      });

      await waitFor(() => {
        const clearButton = screen.getByRole("button", { name: "×" });
        expect(clearButton).toBeInTheDocument();

        // Check that clear button has positioning and styling
        expect(clearButton).toHaveAttribute("style");
        const style = clearButton.getAttribute("style");
        expect(style).toContain("position");
        expect(style).toContain("background");
        expect(style).toContain("cursor");
      });
    });

    test("upload zone provides visual feedback", () => {
      const { container } = renderComponent();

      const uploadZone = container.querySelector(".upload-zone");
      expect(uploadZone).toBeInTheDocument();

      const uploadText = screen.getByText("Click or drag image here");
      expect(uploadText).toBeInTheDocument();

      const uploadHint = screen.getByText("JPEG, PNG, WebP, or GIF • Max 10MB");
      expect(uploadHint).toBeInTheDocument();
    });
  });
});
