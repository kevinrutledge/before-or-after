import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { authRequest } from "../src/utils/apiClient";
import AdminCardForm from "../src/components/AdminCardForm";

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

describe("AdminCardForm", () => {
  let queryClient;
  let mockOnClose;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    mockOnClose = jest.fn();
    authRequest.mockClear();
  });

  const renderForm = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AdminCardForm onClose={mockOnClose} />
      </QueryClientProvider>
    );
  };

  test("submits form with all required fields and image", async () => {
    const user = userEvent.setup();

    // Mock successful API response
    authRequest.mockResolvedValueOnce({
      _id: "123",
      title: "Test Movie",
      year: 2023,
      month: 6,
      category: "movie",
      sourceUrl: "https://example.com/test",
      imageUrl: "https://test-bucket.s3.amazonaws.com/images/test.webp",
      thumbnailUrl: "https://test-bucket.s3.amazonaws.com/thumbnails/test.webp"
    });

    renderForm();

    // Fill out form fields
    await user.type(screen.getByLabelText(/title/i), "Test Movie");
    await user.type(screen.getByLabelText(/year/i), "2023");
    await user.selectOptions(screen.getByLabelText(/month/i), "6");
    await user.selectOptions(screen.getByLabelText(/category/i), "movie");
    await user.type(
      screen.getByLabelText(/source url/i),
      "https://example.com/test"
    );

    // Select crop mode
    await user.selectOptions(screen.getByLabelText(/image fit/i), "scale");

    // Upload file
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const fileInput = screen.getByTestId("file-input");
    await user.upload(fileInput, file);

    // Verify file selected
    expect(screen.getByTestId("selected-file")).toHaveTextContent("test.jpg");

    // Submit form
    const submitButton = screen.getByRole("button", { name: /create card/i });
    await user.click(submitButton);

    // Wait for API call
    await waitFor(() => {
      expect(authRequest).toHaveBeenCalledTimes(1);
    });

    // Verify API called with correct endpoint and method
    expect(authRequest).toHaveBeenCalledWith("/api/admin/cards-with-image", {
      method: "POST",
      body: expect.any(FormData),
      headers: {}
    });

    // Verify FormData contains expected fields
    const formDataCall = authRequest.mock.calls[0][1];
    const formData = formDataCall.body;

    // Check form data entries
    const formEntries = Array.from(formData.entries());
    const formObject = Object.fromEntries(
      formEntries.filter(([key]) => key !== "image")
    );

    expect(formObject).toEqual({
      title: "Test Movie",
      year: "2023",
      month: "6",
      category: "movie",
      sourceUrl: "https://example.com/test",
      cropMode: "scale"
    });

    // Verify image file included
    const imageEntry = formEntries.find(([key]) => key === "image");
    expect(imageEntry).toBeDefined();
    expect(imageEntry[1]).toBeInstanceOf(File);
    expect(imageEntry[1].name).toBe("test.jpg");

    // Verify onClose called after successful submission
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
