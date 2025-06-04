import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach } from "@jest/globals";
import { MemoryRouter } from "react-router-dom";
import SignupPage from "../../src/pages/SignupPage";

// Mock navigation
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate
}));

// Mock API client
jest.mock("../../src/utils/apiClient", () => ({
  apiRequest: jest.fn()
}));

// Mock components
jest.mock("../../src/components/Layout", () => {
  return function MockLayout({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

jest.mock("../../src/components/PageContainer", () => {
  return function MockPageContainer({ children }) {
    return <div data-testid="page-container">{children}</div>;
  };
});

jest.mock("../../src/components/Background", () => {
  return function MockBackground() {
    return <div data-testid="background" />;
  };
});

import { apiRequest } from "../../src/utils/apiClient";

describe("SignupPage", () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  const renderPage = () => {
    return render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    );
  };

  // Fill form with valid data
  const fillValidForm = async () => {
    await user.type(screen.getByLabelText("Email"), "user@test.com");
    await user.type(screen.getByLabelText("Username"), "testuser");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "password123");
  };

  test("renders signup form with all required elements", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Create Account" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign In" })).toBeInTheDocument();
  });

  test("requires all form fields for HTML5 validation", () => {
    renderPage();

    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Username")).toBeRequired();
    expect(screen.getByLabelText("Password")).toBeRequired();
    expect(screen.getByLabelText("Confirm Password")).toBeRequired();
  });

  test("requires form fields through HTML5 validation", async () => {
    renderPage();

    const emailInput = screen.getByLabelText("Email");
    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign Up" });

    // Verify required attributes exist
    expect(emailInput).toBeRequired();
    expect(usernameInput).toBeRequired();
    expect(passwordInput).toBeRequired();

    // Verify empty form doesn't trigger API call
    await user.click(submitButton);
    expect(apiRequest).not.toHaveBeenCalled();
  });

  test("validates password confirmation match", async () => {
    renderPage();

    await user.type(screen.getByLabelText("Email"), "user@test.com");
    await user.type(screen.getByLabelText("Username"), "testuser");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "password456");

    const submitButton = screen.getByRole("button", { name: "Sign Up" });
    await user.click(submitButton);

    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    expect(apiRequest).not.toHaveBeenCalled();
  });

  test("validates password length requirement", async () => {
    renderPage();

    await user.type(screen.getByLabelText("Email"), "user@test.com");
    await user.type(screen.getByLabelText("Username"), "testuser");
    await user.type(screen.getByLabelText("Password"), "12345");
    await user.type(screen.getByLabelText("Confirm Password"), "12345");

    const submitButton = screen.getByRole("button", { name: "Sign Up" });
    await user.click(submitButton);

    expect(
      screen.getByText("Password must be at least 6 characters")
    ).toBeInTheDocument();
    expect(apiRequest).not.toHaveBeenCalled();
  });

  test("validates username length requirement", async () => {
    renderPage();

    await user.type(screen.getByLabelText("Email"), "user@test.com");
    await user.type(screen.getByLabelText("Username"), "ab");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "password123");

    const submitButton = screen.getByRole("button", { name: "Sign Up" });
    await user.click(submitButton);

    expect(
      screen.getByText("Username must be 3-20 characters")
    ).toBeInTheDocument();
    expect(apiRequest).not.toHaveBeenCalled();
  });

  test("validates username format through HTML5 pattern", async () => {
    renderPage();

    const usernameInput = screen.getByLabelText("Username");

    // Verify pattern attribute for validation
    expect(usernameInput).toHaveAttribute("pattern", "[a-zA-Z0-9_-]+");

    await user.type(screen.getByLabelText("Email"), "user@test.com");
    await user.type(usernameInput, "test@user");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "password123");

    const submitButton = screen.getByRole("button", { name: "Sign Up" });
    await user.click(submitButton);

    // Browser validation should prevent API call
    expect(apiRequest).not.toHaveBeenCalled();
  });

  test("submits signup form with valid data", async () => {
    apiRequest.mockResolvedValueOnce({});

    renderPage();

    await fillValidForm();

    const submitButton = screen.getByRole("button", { name: "Sign Up" });
    await user.click(submitButton);

    expect(apiRequest).toHaveBeenCalledWith("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email: "user@test.com",
        username: "testuser",
        password: "password123"
      })
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login", {
        state: { message: "Account created! Please sign in." }
      });
    });
  });

  test("handles signup API error", async () => {
    apiRequest.mockRejectedValueOnce(new Error("Email already exists"));

    renderPage();

    await fillValidForm();

    const submitButton = screen.getByRole("button", { name: "Sign Up" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Email already exists")).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("handles API error without message", async () => {
    apiRequest.mockRejectedValueOnce(new Error());

    renderPage();

    await fillValidForm();

    const submitButton = screen.getByRole("button", { name: "Sign Up" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Registration failed")).toBeInTheDocument();
    });
  });

  test("shows loading state during signup", async () => {
    let resolvePromise;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    apiRequest.mockReturnValueOnce(pendingPromise);

    renderPage();

    await fillValidForm();

    const submitButton = screen.getByRole("button", { name: "Sign Up" });
    await user.click(submitButton);

    expect(screen.getByText("Creating Account...")).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    resolvePromise({});
  });

  test("toggles password visibility for both password fields", async () => {
    renderPage();

    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const toggleButtons = screen.getAllByRole("button", {
      name: "Show password"
    });

    // Initially passwords should be hidden
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(confirmPasswordInput).toHaveAttribute("type", "password");

    // Click first toggle button to show passwords
    await user.click(toggleButtons[0]);

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(confirmPasswordInput).toHaveAttribute("type", "text");
    expect(
      screen.getAllByRole("button", { name: "Hide password" })
    ).toHaveLength(2);

    // Click second toggle button to hide passwords again
    await user.click(toggleButtons[1]);

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(confirmPasswordInput).toHaveAttribute("type", "password");
    expect(
      screen.getAllByRole("button", { name: "Show password" })
    ).toHaveLength(2);
  });

  test("handles form state changes correctly", async () => {
    renderPage();

    // Submit empty form first
    const submitButton = screen.getByRole("button", { name: "Sign Up" });
    await user.click(submitButton);

    // Verify no API call with empty form
    expect(apiRequest).not.toHaveBeenCalled();

    // Fill form with valid data
    await fillValidForm();

    // Mock successful API call
    apiRequest.mockResolvedValueOnce({});
    await user.click(submitButton);

    // Verify API call made with valid data
    expect(apiRequest).toHaveBeenCalledWith("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email: "user@test.com",
        username: "testuser",
        password: "password123"
      })
    });
  });

  test("navigates to home when cancel clicked", async () => {
    renderPage();

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  test("renders navigation link to login correctly", () => {
    renderPage();

    const loginLink = screen.getByRole("link", { name: "Sign In" });
    expect(loginLink).toHaveAttribute("href", "/login");
    expect(screen.getByText("Already have an account?")).toBeInTheDocument();
  });

  test("maintains form state during loading", async () => {
    let resolvePromise;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    apiRequest.mockReturnValueOnce(pendingPromise);

    renderPage();

    await fillValidForm();

    const submitButton = screen.getByRole("button", { name: "Sign Up" });
    await user.click(submitButton);

    // Form values should be maintained during loading
    expect(screen.getByLabelText("Email")).toHaveValue("user@test.com");
    expect(screen.getByLabelText("Username")).toHaveValue("testuser");
    expect(screen.getByLabelText("Password")).toHaveValue("password123");
    expect(screen.getByLabelText("Confirm Password")).toHaveValue(
      "password123"
    );

    resolvePromise({});
  });

  test("validates username HTML5 attributes", () => {
    renderPage();

    const usernameInput = screen.getByLabelText("Username");

    expect(usernameInput).toHaveAttribute("minLength", "3");
    expect(usernameInput).toHaveAttribute("maxLength", "20");
    expect(usernameInput).toHaveAttribute("pattern", "[a-zA-Z0-9_-]+");
    expect(usernameInput).toHaveAttribute(
      "placeholder",
      "Choose a username (3-20 characters)"
    );
  });

  test("email field has correct type and placeholder", () => {
    renderPage();

    const emailInput = screen.getByLabelText("Email");

    expect(emailInput).toHaveAttribute("type", "email");
    expect(emailInput).toHaveAttribute("placeholder", "Enter your email");
  });

  test("submits form with maximum length username", async () => {
    apiRequest.mockResolvedValueOnce({});

    renderPage();

    const usernameInput = screen.getByLabelText("Username");

    // Verify length validation attributes exist
    expect(usernameInput).toHaveAttribute("minLength", "3");
    expect(usernameInput).toHaveAttribute("maxLength", "20");

    await user.type(screen.getByLabelText("Email"), "user@test.com");
    await user.type(usernameInput, "a".repeat(20)); // Use exactly 20 characters
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "password123");

    const submitButton = screen.getByRole("button", { name: "Sign Up" });
    await user.click(submitButton);

    // Component submits with maximum allowed length
    expect(apiRequest).toHaveBeenCalledWith("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email: "user@test.com",
        username: "a".repeat(20),
        password: "password123"
      })
    });
  });

  test("validates valid username with allowed special characters", async () => {
    apiRequest.mockResolvedValueOnce({});

    renderPage();

    await user.type(screen.getByLabelText("Email"), "user@test.com");
    await user.type(screen.getByLabelText("Username"), "test_user-123");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "password123");

    const submitButton = screen.getByRole("button", { name: "Sign Up" });
    await user.click(submitButton);

    expect(apiRequest).toHaveBeenCalledWith("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email: "user@test.com",
        username: "test_user-123",
        password: "password123"
      })
    });
  });

  test("password toggle buttons have correct accessibility attributes", () => {
    renderPage();

    const toggleButtons = screen.getAllByRole("button", {
      name: "Show password"
    });

    toggleButtons.forEach((button) => {
      expect(button).toHaveAttribute("type", "button");
      expect(button).toHaveAttribute("aria-label", "Show password");
    });
  });
});
