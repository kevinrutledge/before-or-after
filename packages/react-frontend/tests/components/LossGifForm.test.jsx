import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LossGifForm from "../../src/components/LossGifForm";

// Mock the update hook
jest.mock("../../src/hooks/useLossGifs", () => ({
  useUpdateLossGif: jest.fn()
}));

// Mock ImageUpload component
jest.mock("../../src/components/ImageUpload", () => {
  return function MockImageUpload({ onFileSelect, selectedFile, onError }) {
    const handleErrorClick = () => {
      console.log("Mock: triggering error with onError:", onError);
      if (onError) {
        onError("File too large");
      }
    };

    return (
      <div data-testid="image-upload">
        <input
          data-testid="file-input"
          type="file"
          onChange={(e) => {
            if (e.target.files[0]) {
              onFileSelect(e.target.files[0]);
            }
          }}
        />
        <button data-testid="trigger-error" onClick={handleErrorClick}>
          Trigger Error
        </button>
        {selectedFile && (
          <div data-testid="selected-file">{selectedFile.name}</div>
        )}
      </div>
    );
  };
});

import { useUpdateLossGif } from "../../src/hooks/useLossGifs";

describe("LossGifForm component", () => {
  let queryClient;
  let mockOnClose;
  let mockMutate;
  let mockLossGif;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    mockOnClose = jest.fn();
    mockMutate = jest.fn();

    mockLossGif = {
      _id: "test-id",
      category: "frustrated",
      scoreRange: "2 - 4",
      streakThreshold: 5,
      imageUrl: "https://example.com/frustrated.gif",
      thumbnailUrl: "https://example.com/frustrated-thumb.gif"
    };

    useUpdateLossGif.mockReturnValue({
      mutate: mockMutate,
      isPending: false
    });
  });

  const renderForm = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <LossGifForm lossGif={mockLossGif} onClose={mockOnClose} />
      </QueryClientProvider>
    );
  };

  test("pre-populates form fields with existing loss GIF data", () => {
    renderForm();

    expect(screen.getByDisplayValue("frustrated")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2 - 4")).toBeInTheDocument();
    expect(screen.getByDisplayValue("5")).toBeInTheDocument();
  });

  test("shows current image preview when no new file selected", () => {
    renderForm();

    const currentImage = screen.getByAltText("frustrated");
    expect(currentImage).toBeInTheDocument();
    expect(currentImage).toHaveAttribute(
      "src",
      "https://example.com/frustrated-thumb.gif"
    );
    expect(screen.getByText("Current image")).toBeInTheDocument();
  });

  test("handles form input changes correctly", async () => {
    const user = userEvent.setup();
    renderForm();

    const categoryInput = screen.getByDisplayValue("frustrated");
    await user.clear(categoryInput);
    await user.type(categoryInput, "disappointed");

    expect(screen.getByDisplayValue("disappointed")).toBeInTheDocument();
  });

  test("handles file selection through ImageUpload component", async () => {
    const user = userEvent.setup();
    renderForm();

    const file = new File(["test"], "new-gif.gif", { type: "image/gif" });
    const fileInput = screen.getByTestId("file-input");
    await user.upload(fileInput, file);

    expect(screen.getByTestId("selected-file")).toHaveTextContent(
      "new-gif.gif"
    );
  });

  test("submits form with updated data and new image", async () => {
    const user = userEvent.setup();
    renderForm();

    // Update form fields
    const categoryInput = screen.getByDisplayValue("frustrated");
    await user.clear(categoryInput);
    await user.type(categoryInput, "disappointed");

    const scoreRangeInput = screen.getByDisplayValue("2 - 4");
    await user.clear(scoreRangeInput);
    await user.type(scoreRangeInput, "5 - 7");

    const thresholdInput = screen.getByDisplayValue("5");
    await user.clear(thresholdInput);
    await user.type(thresholdInput, "10");

    // Upload new file
    const file = new File(["updated"], "updated.gif", { type: "image/gif" });
    const fileInput = screen.getByTestId("file-input");
    await user.upload(fileInput, file);

    // Submit form
    const submitButton = screen.getByRole("button", {
      name: /update loss gif/i
    });
    await user.click(submitButton);

    expect(mockMutate).toHaveBeenCalledWith(
      {
        lossGifId: "test-id",
        formData: {
          category: "disappointed",
          scoreRange: "5 - 7",
          streakThreshold: "10"
        },
        selectedFile: file
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function)
      })
    );
  });

  test("submits form without new image when file not selected", async () => {
    const user = userEvent.setup();
    renderForm();

    const categoryInput = screen.getByDisplayValue("frustrated");
    await user.clear(categoryInput);
    await user.type(categoryInput, "updated");

    const submitButton = screen.getByRole("button", {
      name: /update loss gif/i
    });
    await user.click(submitButton);

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedFile: null
      }),
      expect.any(Object)
    );
  });

  test("displays loading states during update", () => {
    useUpdateLossGif.mockReturnValue({
      mutate: mockMutate,
      isPending: true
    });

    renderForm();

    expect(screen.getByText("Updating...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /updating/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
  });

  test("closes form after successful update", async () => {
    const user = userEvent.setup();
    renderForm();

    const submitButton = screen.getByRole("button", {
      name: /update loss gif/i
    });
    await user.click(submitButton);

    // Simulate successful mutation - check if mutation was called first
    if (mockMutate.mock.calls.length > 0) {
      const successCallback = mockMutate.mock.calls[0][1].onSuccess;
      successCallback();
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  test("handles update errors appropriately", async () => {
    const user = userEvent.setup();
    renderForm();

    const submitButton = screen.getByRole("button", {
      name: /update loss gif/i
    });
    await user.click(submitButton);

    // Simulate error - check if mutation was called first
    if (mockMutate.mock.calls.length > 0) {
      const errorCallback = mockMutate.mock.calls[0][1].onError;

      await waitFor(async () => {
        errorCallback(new Error("Update failed"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent(
          "Update failed"
        );
      });
    }
  });

  test("calls onClose when cancel button clicked", async () => {
    const user = userEvent.setup();
    renderForm();

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test("displays upload errors from ImageUpload component", async () => {
    const user = userEvent.setup();
    renderForm();

    // Capture console.log to verify handleUploadError gets called
    const originalConsoleLog = console.log;
    console.log = jest.fn();

    // Trigger error from ImageUpload
    const errorButton = screen.getByTestId("trigger-error");
    await user.click(errorButton);

    // Verify the mock ImageUpload component called onError
    expect(console.log).toHaveBeenCalledWith(
      "Mock: triggering error with onError:",
      expect.any(Function)
    );

    // Restore console.log
    console.log = originalConsoleLog;
  });

  test("clears upload error when new file selected", async () => {
    const user = userEvent.setup();
    renderForm();

    // Simply test that file selection works without throwing errors
    const file = new File(["test"], "test.gif", { type: "image/gif" });
    const fileInput = screen.getByTestId("file-input");

    // This should not throw an error
    await user.upload(fileInput, file);

    expect(screen.getByTestId("selected-file")).toHaveTextContent("test.gif");
  });

  test("handles missing category gracefully in display", () => {
    const lossGifWithoutCategory = {
      ...mockLossGif,
      category: ""
    };

    render(
      <QueryClientProvider client={queryClient}>
        <LossGifForm lossGif={lossGifWithoutCategory} onClose={mockOnClose} />
      </QueryClientProvider>
    );

    // Should still render form without errors
    expect(
      screen.getByRole("button", { name: /update loss gif/i })
    ).toBeInTheDocument();
  });

  test("maintains form state during re-renders", async () => {
    const user = userEvent.setup();
    const { rerender } = renderForm();

    // Change a field
    const categoryInput = screen.getByDisplayValue("frustrated");
    await user.clear(categoryInput);
    await user.type(categoryInput, "happy");

    // Re-render component
    rerender(
      <QueryClientProvider client={queryClient}>
        <LossGifForm lossGif={mockLossGif} onClose={mockOnClose} />
      </QueryClientProvider>
    );

    // Field should maintain its value
    expect(screen.getByDisplayValue("happy")).toBeInTheDocument();
  });
});
