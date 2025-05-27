import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { authRequest } from "../src/utils/apiClient";
import EditCardForm from "../src/components/EditCardForm";

// Mock API client
jest.mock("../src/utils/apiClient", () => ({
  authRequest: jest.fn()
}));

// Mock ImageUpload component
jest.mock("../src/components/ImageUpload", () => {
  return function MockImageUpload({ onFileSelect, selectedFile }) {
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
        {selectedFile && (
          <div data-testid="selected-file">{selectedFile.name}</div>
        )}
      </div>
    );
  };
});

describe("EditCardForm", () => {
  let queryClient;
  let mockOnClose;
  let mockCard;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    mockOnClose = jest.fn();
    authRequest.mockClear();

    mockCard = {
      _id: "123",
      title: "Original Movie",
      year: 2022,
      month: 5,
      category: "movie",
      sourceUrl: "https://example.com/original",
      imageUrl: "https://test-bucket.s3.amazonaws.com/images/original.webp",
      thumbnailUrl:
        "https://test-bucket.s3.amazonaws.com/thumbnails/original.webp"
    };
  });

  const renderForm = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <EditCardForm card={mockCard} onClose={mockOnClose} />
      </QueryClientProvider>
    );
  };

  test("pre-populates form fields with existing card data", () => {
    renderForm();

    // Verify form fields populated with card data
    expect(screen.getByRole("combobox", { name: /category/i })).toHaveValue(
      "movie"
    );
    expect(screen.getByDisplayValue("2022")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /month/i })).toHaveValue("5");
    expect(screen.getByRole("combobox", { name: /category/i })).toHaveValue(
      "movie"
    );
    expect(
      screen.getByDisplayValue("https://example.com/original")
    ).toBeInTheDocument();

    // Verify current image shown
    const currentImage = screen.getByAltText("Original Movie");
    expect(currentImage).toBeInTheDocument();
    expect(currentImage).toHaveAttribute("src", mockCard.thumbnailUrl);

    // Verify default crop mode
    expect(screen.getByRole("combobox", { name: /image fit/i })).toHaveValue(
      "scale"
    );
  });

  test("submits form with updated data and new image", async () => {
    const user = userEvent.setup();

    // Mock successful API response
    authRequest.mockResolvedValueOnce({
      ...mockCard,
      title: "Updated Movie",
      year: 2023,
      month: 8,
      sourceUrl: "https://example.com/updated",
      imageUrl: "https://test-bucket.s3.amazonaws.com/images/updated.webp",
      thumbnailUrl:
        "https://test-bucket.s3.amazonaws.com/thumbnails/updated.webp"
    });

    renderForm();

    // Update form fields
    const titleInput = screen.getByDisplayValue("Original Movie");
    await user.clear(titleInput);
    await user.type(titleInput, "Updated Movie");

    const yearInput = screen.getByDisplayValue("2022");
    await user.clear(yearInput);
    await user.type(yearInput, "2023");

    await user.selectOptions(
      screen.getByRole("combobox", { name: /month/i }),
      "8"
    );
    const sourceUrlInput = screen.getByLabelText(/source url/i);
    await user.clear(sourceUrlInput);
    await user.type(sourceUrlInput, "https://example.com/updated");

    // Select different crop mode
    await user.selectOptions(
      screen.getByRole("combobox", { name: /image fit/i }),
      "crop"
    );

    // Upload new image
    const file = new File(["updated"], "updated.jpg", { type: "image/jpeg" });
    const fileInput = screen.getByTestId("file-input");
    await user.upload(fileInput, file);

    // Verify file selected
    expect(screen.getByTestId("selected-file")).toHaveTextContent(
      "updated.jpg"
    );

    // Submit form
    const submitButton = screen.getByRole("button", { name: /update card/i });
    await user.click(submitButton);

    // Wait for API call
    await waitFor(() => {
      expect(authRequest).toHaveBeenCalledTimes(1);
    });

    // Verify API called with correct endpoint and method
    expect(authRequest).toHaveBeenCalledWith("/api/admin/cards/123", {
      method: "PUT",
      body: expect.any(FormData),
      headers: {}
    });

    // Verify FormData contains updated fields
    const formDataCall = authRequest.mock.calls[0][1];
    const formData = formDataCall.body;

    const formEntries = Array.from(formData.entries());
    const formObject = Object.fromEntries(
      formEntries.filter(([key]) => key !== "image")
    );

    expect(formObject).toEqual({
      title: "Updated Movie",
      year: "2023",
      month: "8",
      category: "movie",
      sourceUrl: "https://example.com/updated",
      cropMode: "crop"
    });

    // Verify image file included
    const imageEntry = formEntries.find(([key]) => key === "image");
    expect(imageEntry).toBeDefined();
    expect(imageEntry[1]).toBeInstanceOf(File);
    expect(imageEntry[1].name).toBe("updated.jpg");

    // Verify onClose called after successful submission
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
