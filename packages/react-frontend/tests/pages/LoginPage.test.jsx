import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach } from "@jest/globals";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "../../src/pages/LoginPage";

// Mock navigation and location
const mockNavigate = jest.fn();
const mockUseLocation = jest.fn(() => ({ state: null }));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation()
}));

// Mock auth hook
const mockLogin = jest.fn();
jest.mock("../../src/hooks/useAuth", () => ({
  useAuth: () => ({
    login: mockLogin
  })
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

describe("LoginPage", () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockLogin.mockClear();
    mockUseLocation.mockReturnValue({ state: null });
  });

  const renderPage = (locationState = null) => {
    // Update mock to return custom state
    mockUseLocation.mockReturnValue({ state: locationState });

    return render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
  };

  test("renders login form with all required elements", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Sign In" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email or Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign Up" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Forgot Password?" })
    ).toBeInTheDocument();
  });

  test("requires form fields for submission", () => {
    renderPage();

    const emailInput = screen.getByLabelText("Email or Username");
    const passwordInput = screen.getByLabelText("Password");

    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  test("prevents form submission with empty fields", async () => {
    renderPage();

    const submitButton = screen.getByRole("button", { name: "Sign In" });
    const emailInput = screen.getByLabelText("Email or Username");
    const passwordInput = screen.getByLabelText("Password");

    // Verify required attributes exist
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();

    // Verify empty form doesn't trigger API call
    await user.click(submitButton);
    expect(apiRequest).not.toHaveBeenCalled();
  });

  test("validates email field requirement through HTML5", async () => {
    renderPage();

    const emailInput = screen.getByLabelText("Email or Username");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    // Fill password but leave email empty
    await user.type(passwordInput, "password123");

    // Verify email field is required
    expect(emailInput).toBeRequired();
    expect(emailInput).toHaveValue("");

    await user.click(submitButton);

    // Browser validation should prevent API call
    expect(apiRequest).not.toHaveBeenCalled();
  });

  test("validates password field requirement through HTML5", async () => {
    renderPage();

    const emailInput = screen.getByLabelText("Email or Username");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    // Fill email but leave password empty
    await user.type(emailInput, "user@test.com");

    // Verify password field is required
    expect(passwordInput).toBeRequired();
    expect(passwordInput).toHaveValue("");

    await user.click(submitButton);

    // Browser validation should prevent API call
    expect(apiRequest).not.toHaveBeenCalled();
  });

  test("submits login form with valid credentials", async () => {
    const mockResponse = {
      token: "test-token",
      user: {
        email: "user@test.com",
        username: "testuser",
        role: "user",
        currentScore: 0,
        highScore: 5
      }
    };

    apiRequest.mockResolvedValueOnce(mockResponse);

    renderPage();

    const emailInput = screen.getByLabelText("Email or Username");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    await user.type(emailInput, "user@test.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    expect(apiRequest).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        emailOrUsername: "user@test.com",
        password: "password123"
      })
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test-token", mockResponse.user);
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  test("handles login failure with error message", async () => {
    apiRequest.mockRejectedValueOnce(new Error("Invalid credentials"));

    renderPage();

    const emailInput = screen.getByLabelText("Email or Username");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    await user.type(emailInput, "user@test.com");
    await user.type(passwordInput, "wrongpassword");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Invalid email/username or password")
      ).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("shows loading state during login", async () => {
    let resolvePromise;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    apiRequest.mockReturnValueOnce(pendingPromise);

    renderPage();

    const emailInput = screen.getByLabelText("Email or Username");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    await user.type(emailInput, "user@test.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    expect(screen.getByText("Signing in...")).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    resolvePromise({ token: "test-token" });
  });

  test("toggles password visibility", async () => {
    renderPage();

    const passwordInput = screen.getByLabelText("Password");
    const toggleButton = screen.getByRole("button", { name: "Show password" });

    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute("type", "password");

    // Click to show password
    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "Hide password" })
    ).toBeInTheDocument();

    // Click to hide password again
    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(
      screen.getByRole("button", { name: "Show password" })
    ).toBeInTheDocument();
  });

  test("clears error when form resubmitted", async () => {
    apiRequest.mockRejectedValueOnce(new Error("Network error"));

    renderPage();

    const emailInput = screen.getByLabelText("Email or Username");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    await user.type(emailInput, "user@test.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Invalid email/username or password")
      ).toBeInTheDocument();
    });

    // Mock successful request for retry
    apiRequest.mockResolvedValueOnce({ token: "test-token" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.queryByText("Invalid email/username or password")
      ).not.toBeInTheDocument();
    });
  });

  test("navigates to home when cancel clicked", async () => {
    renderPage();

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  test("renders navigation links correctly", () => {
    renderPage();

    const signupLink = screen.getByRole("link", { name: "Sign Up" });
    const forgotPasswordLink = screen.getByRole("link", {
      name: "Forgot Password?"
    });

    expect(signupLink).toHaveAttribute("href", "/signup");
    expect(forgotPasswordLink).toHaveAttribute("href", "/forgot-password");
  });

  test("displays success message from location state", () => {
    const successMessage = "Password reset successful! Please sign in.";
    renderPage({ message: successMessage });

    expect(screen.getByText(successMessage)).toBeInTheDocument();
    expect(screen.getByText(successMessage)).toHaveClass("success-message");
  });

  test("does not display success message when location state empty", () => {
    renderPage();

    expect(
      screen.queryByText(/Password reset successful/)
    ).not.toBeInTheDocument();
    expect(document.querySelector(".success-message")).not.toBeInTheDocument();
  });

  test("handles empty location state gracefully", () => {
    renderPage({});

    expect(
      screen.getByRole("heading", { name: "Sign In" })
    ).toBeInTheDocument();
    expect(screen.queryByText(/success/i)).not.toBeInTheDocument();
  });

  test("supports username login", async () => {
    const mockResponse = {
      token: "username-token",
      user: {
        email: "testuser@example.com",
        username: "testuser",
        role: "user",
        currentScore: 2,
        highScore: 8
      }
    };

    apiRequest.mockResolvedValueOnce(mockResponse);

    renderPage();

    const emailInput = screen.getByLabelText("Email or Username");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    await user.type(emailInput, "testuser");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    expect(apiRequest).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        emailOrUsername: "testuser",
        password: "password123"
      })
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        "username-token",
        mockResponse.user
      );
    });
  });

  test("maintains form state during loading", async () => {
    let resolvePromise;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    apiRequest.mockReturnValueOnce(pendingPromise);

    renderPage();

    const emailInput = screen.getByLabelText("Email or Username");
    const passwordInput = screen.getByLabelText("Password");

    await user.type(emailInput, "user@test.com");
    await user.type(passwordInput, "password123");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    // Values should be maintained during loading
    expect(emailInput).toHaveValue("user@test.com");
    expect(passwordInput).toHaveValue("password123");

    resolvePromise({ token: "test-token" });
  });

  test("applies correct CSS classes", () => {
    const { container } = renderPage();

    expect(container.querySelector(".login-page")).toBeInTheDocument();
    expect(container.querySelector(".login-title")).toBeInTheDocument();
    expect(container.querySelector(".login-form")).toBeInTheDocument();
    expect(
      container.querySelector(".password-input-container")
    ).toBeInTheDocument();
  });

  test("password toggle has correct accessibility attributes", () => {
    renderPage();

    const toggleButton = screen.getByRole("button", { name: "Show password" });

    expect(toggleButton).toHaveAttribute("type", "button");
    expect(toggleButton).toHaveAttribute("aria-label", "Show password");
  });

  test("form has proper structure and input attributes", () => {
    const { container } = renderPage();

    const form = container.querySelector("form");
    const emailInput = screen.getByLabelText("Email or Username");
    const passwordInput = screen.getByLabelText("Password");

    expect(form).toBeInTheDocument();
    expect(emailInput).toHaveAttribute("type", "text");
    expect(emailInput).toHaveAttribute(
      "placeholder",
      "Enter your email or username"
    );
    expect(passwordInput).toHaveAttribute("placeholder", "Enter your password");
  });
});
