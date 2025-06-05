import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { MemoryRouter } from "react-router-dom";
import ForgotPasswordPage from "../../src/pages/ForgotPasswordPage";

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

describe("ForgotPasswordPage", () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    mockNavigate.mockClear();

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const renderPage = () => {
    return render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    );
  };

  describe("Request stage", () => {
    test("renders email request form initially", () => {
      renderPage();

      expect(
        screen.getByRole("heading", { name: "Reset Password" })
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Send Reset Code" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Back to Login" })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Enter your email address and we'll send you/)
      ).toBeInTheDocument();
    });

    test("requires email field for form submission", async () => {
      renderPage();

      const submitButton = screen.getByRole("button", {
        name: "Send Reset Code"
      });
      const emailInput = screen.getByLabelText("Email");

      // Verify required attribute exists
      expect(emailInput).toBeRequired();

      // Verify form won't submit without email
      expect(emailInput).toHaveValue("");
      await user.click(submitButton);

      // API should not be called with empty email
      expect(apiRequest).not.toHaveBeenCalled();
    });

    test("submits email request successfully", async () => {
      apiRequest.mockResolvedValueOnce({});

      renderPage();

      const emailInput = screen.getByLabelText("Email");
      const submitButton = screen.getByRole("button", {
        name: "Send Reset Code"
      });

      await user.type(emailInput, "user@test.com");
      await user.click(submitButton);

      expect(apiRequest).toHaveBeenCalledWith("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: "user@test.com" })
      });

      await waitFor(() => {
        expect(screen.getByLabelText("Verification Code")).toBeInTheDocument();
      });
    });

    test("handles API error during email request", async () => {
      apiRequest.mockRejectedValueOnce(new Error("Email not found"));

      renderPage();

      const emailInput = screen.getByLabelText("Email");
      const submitButton = screen.getByRole("button", {
        name: "Send Reset Code"
      });

      await user.type(emailInput, "invalid@test.com");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Email not found")).toBeInTheDocument();
      });
    });

    test("shows loading state during email request", async () => {
      let resolvePromise;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      apiRequest.mockReturnValueOnce(pendingPromise);

      renderPage();

      const emailInput = screen.getByLabelText("Email");
      const submitButton = screen.getByRole("button", {
        name: "Send Reset Code"
      });

      await user.type(emailInput, "user@test.com");
      await user.click(submitButton);

      expect(screen.getByText("Sending...")).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      resolvePromise({});
    });

    test("navigates back to login when link clicked", async () => {
      renderPage();

      const loginLink = screen.getByRole("link", { name: "Back to Login" });
      expect(loginLink).toHaveAttribute("href", "/login");
    });
  });

  describe("Verification stage", () => {
    beforeEach(async () => {
      apiRequest.mockResolvedValueOnce({});

      renderPage();

      const emailInput = screen.getByLabelText("Email");
      const submitButton = screen.getByRole("button", {
        name: "Send Reset Code"
      });

      await user.type(emailInput, "user@test.com");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByLabelText("Verification Code")).toBeInTheDocument();
      });
    });

    test("renders verification code form", () => {
      expect(screen.getByLabelText("Verification Code")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Verify Code" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Try Again" })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Enter the code sent to your email/)
      ).toBeInTheDocument();
    });

    test("shows email as readonly in verification stage", () => {
      const emailInput = screen.getByLabelText("Email");
      expect(emailInput).toHaveAttribute("readonly");
      expect(emailInput).toHaveValue("user@test.com");
    });

    test("requires verification code for form submission", async () => {
      const submitButton = screen.getByRole("button", { name: "Verify Code" });
      const codeInput = screen.getByLabelText("Verification Code");

      // Verify required attribute exists
      expect(codeInput).toBeRequired();

      // Verify form won't submit without code
      expect(codeInput).toHaveValue("");
      await user.click(submitButton);

      // API should not be called with empty code
      expect(apiRequest).toHaveBeenCalledTimes(1); // Only the initial request
    });

    test("submits verification code successfully", async () => {
      apiRequest.mockResolvedValueOnce({ resetToken: "test-token" });

      const codeInput = screen.getByLabelText("Verification Code");
      const submitButton = screen.getByRole("button", { name: "Verify Code" });

      await user.type(codeInput, "123456");
      await user.click(submitButton);

      expect(apiRequest).toHaveBeenCalledWith("/api/auth/verify-code", {
        method: "POST",
        body: JSON.stringify({ email: "user@test.com", code: "123456" })
      });

      await waitFor(() => {
        expect(screen.getByLabelText("New Password")).toBeInTheDocument();
      });

      expect(localStorage.getItem("resetToken")).toBe("test-token");
    });

    test("handles invalid verification code", async () => {
      apiRequest.mockRejectedValueOnce(new Error("Invalid verification code"));

      const codeInput = screen.getByLabelText("Verification Code");
      const submitButton = screen.getByRole("button", { name: "Verify Code" });

      await user.type(codeInput, "000000");
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Invalid verification code")
        ).toBeInTheDocument();
      });
    });

    test("returns to request stage when try again clicked", async () => {
      const tryAgainButton = screen.getByRole("button", { name: "Try Again" });
      await user.click(tryAgainButton);

      expect(
        screen.getByRole("button", { name: "Send Reset Code" })
      ).toBeInTheDocument();
      expect(
        screen.queryByLabelText("Verification Code")
      ).not.toBeInTheDocument();
    });

    test("limits verification code input to 6 characters", () => {
      const codeInput = screen.getByLabelText("Verification Code");
      expect(codeInput).toHaveAttribute("maxLength", "6");
    });

    test("shows loading state during verification", async () => {
      let resolvePromise;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      apiRequest.mockReturnValueOnce(pendingPromise);

      const codeInput = screen.getByLabelText("Verification Code");
      const submitButton = screen.getByRole("button", { name: "Verify Code" });

      await user.type(codeInput, "123456");
      await user.click(submitButton);

      expect(screen.getByText("Verifying...")).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      resolvePromise({ resetToken: "test-token" });
    });
  });

  describe("Reset stage", () => {
    beforeEach(async () => {
      // Mock successful email request
      apiRequest.mockResolvedValueOnce({});

      renderPage();

      const emailInput = screen.getByLabelText("Email");
      const submitButton = screen.getByRole("button", {
        name: "Send Reset Code"
      });

      await user.type(emailInput, "user@test.com");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByLabelText("Verification Code")).toBeInTheDocument();
      });

      // Mock successful verification
      apiRequest.mockResolvedValueOnce({ resetToken: "test-token" });

      const codeInput = screen.getByLabelText("Verification Code");
      const verifyButton = screen.getByRole("button", { name: "Verify Code" });

      await user.type(codeInput, "123456");
      await user.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByLabelText("New Password")).toBeInTheDocument();
      });
    });

    test("renders password reset form", () => {
      expect(screen.getByLabelText("New Password")).toBeInTheDocument();
      expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Reset Password" })
      ).toBeInTheDocument();
    });

    test("requires password fields for form submission", async () => {
      const submitButton = screen.getByRole("button", {
        name: "Reset Password"
      });
      const passwordInput = screen.getByLabelText("New Password");
      const confirmInput = screen.getByLabelText("Confirm Password");

      // Verify required attributes exist
      expect(passwordInput).toBeRequired();
      expect(confirmInput).toBeRequired();

      // Verify form won't submit without passwords
      expect(passwordInput).toHaveValue("");
      await user.click(submitButton);

      // Should not make API call with empty fields
      expect(apiRequest).toHaveBeenCalledTimes(2); // Previous requests only
    });

    test("validates password length through custom validation", async () => {
      const passwordInput = screen.getByLabelText("New Password");
      const confirmInput = screen.getByLabelText("Confirm Password");
      const submitButton = screen.getByRole("button", {
        name: "Reset Password"
      });

      // Enter short password to trigger custom validation
      await user.type(passwordInput, "12345");
      await user.type(confirmInput, "12345");
      await user.click(submitButton);

      // Should see custom validation error
      await waitFor(() => {
        expect(
          screen.getByText("Password must be at least 6 characters")
        ).toBeInTheDocument();
      });
    });

    test("validates password confirmation match", async () => {
      const passwordInput = screen.getByLabelText("New Password");
      const confirmInput = screen.getByLabelText("Confirm Password");
      const submitButton = screen.getByRole("button", {
        name: "Reset Password"
      });

      await user.type(passwordInput, "password123");
      await user.type(confirmInput, "password456");
      await user.click(submitButton);

      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });

    test("submits password reset successfully", async () => {
      apiRequest.mockResolvedValueOnce({});

      const passwordInput = screen.getByLabelText("New Password");
      const confirmInput = screen.getByLabelText("Confirm Password");
      const submitButton = screen.getByRole("button", {
        name: "Reset Password"
      });

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmInput, "newpassword123");
      await user.click(submitButton);

      expect(apiRequest).toHaveBeenCalledWith("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email: "user@test.com",
          resetToken: "test-token",
          newPassword: "newpassword123"
        })
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login", {
          state: {
            message:
              "Password reset successful! Please sign in with your new password."
          }
        });
      });

      expect(localStorage.getItem("resetToken")).toBeNull();
    });

    test("handles missing reset token", async () => {
      localStorage.removeItem("resetToken");

      const passwordInput = screen.getByLabelText("New Password");
      const confirmInput = screen.getByLabelText("Confirm Password");
      const submitButton = screen.getByRole("button", {
        name: "Reset Password"
      });

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmInput, "newpassword123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Reset token missing")).toBeInTheDocument();
      });
    });

    test("handles password reset API error", async () => {
      apiRequest.mockRejectedValueOnce(new Error("Token expired"));

      const passwordInput = screen.getByLabelText("New Password");
      const confirmInput = screen.getByLabelText("Confirm Password");
      const submitButton = screen.getByRole("button", {
        name: "Reset Password"
      });

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmInput, "newpassword123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Token expired")).toBeInTheDocument();
      });
    });

    test("shows loading state during password reset", async () => {
      let resolvePromise;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      apiRequest.mockReturnValueOnce(pendingPromise);

      const passwordInput = screen.getByLabelText("New Password");
      const confirmInput = screen.getByLabelText("Confirm Password");
      const submitButton = screen.getByRole("button", {
        name: "Reset Password"
      });

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmInput, "newpassword123");
      await user.click(submitButton);

      expect(screen.getByText("Resetting...")).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      resolvePromise({});
    });
  });

  describe("Error handling", () => {
    test("clears error when stage changes", async () => {
      apiRequest.mockRejectedValueOnce(new Error("Test error"));

      renderPage();

      const emailInput = screen.getByLabelText("Email");
      const submitButton = screen.getByRole("button", {
        name: "Send Reset Code"
      });

      await user.type(emailInput, "user@test.com");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Test error")).toBeInTheDocument();
      });

      // Mock successful request for stage change
      apiRequest.mockResolvedValueOnce({});
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText("Test error")).not.toBeInTheDocument();
      });
    });

    test("handles API error without message", async () => {
      apiRequest.mockRejectedValueOnce(new Error());

      renderPage();

      const emailInput = screen.getByLabelText("Email");
      const submitButton = screen.getByRole("button", {
        name: "Send Reset Code"
      });

      await user.type(emailInput, "user@test.com");
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to send reset code")
        ).toBeInTheDocument();
      });
    });
  });
});
