import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "../components/Layout";
import PageContainer from "../components/PageContainer";

/**
 * Forgot password page component with verification code workflow.
 */
function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [stage, setStage] = useState("request"); // request, verification, reset
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const navigate = useNavigate();

  // Timer for verification code expiration
  useEffect(() => {
    if (stage === "verification" && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && stage === "verification") {
      setError("Verification code expired. Please try again.");
      setStage("request");
    }
  }, [timeLeft, stage]);

  // Handle request password reset
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset code");
      }

      // Move to verification stage
      setStage("verification");
      setTimeLeft(15 * 60); // Reset timer to 15 minutes
    } catch (err) {
      setError(err.message || "Failed to send reset code. Please try again.");
      console.error("Password reset error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verification code submission
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");

    if (!verificationCode) {
      setError("Please enter the verification code");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to verify code");
      }

      // Store reset token and move to reset password stage
      localStorage.setItem("resetToken", data.resetToken);
      setStage("reset");
    } catch (err) {
      setError(err.message || "Failed to verify code. Please try again.");
      console.error("Verification error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    // Validate password
    if (!newPassword) {
      setError("Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const resetToken = localStorage.getItem("resetToken");

      if (!resetToken) {
        throw new Error("Reset token missing, please try again");
      }

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          resetToken,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      // Clear reset token and redirect to login
      localStorage.removeItem("resetToken");
      navigate("/login", {
        state: {
          message:
            "Password reset successful! Please sign in with your new password."
        }
      });
    } catch (err) {
      setError(err.message || "Failed to reset password. Please try again.");
      console.error("Password reset error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Format time remaining as MM:SS
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Render different forms based on current stage
  const renderStageContent = () => {
    switch (stage) {
      case "request":
        return (
          <form onSubmit={handleRequestReset} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <p className="help-text">
              Enter your email address and we&apos;ll send you a verification
              code to reset your password.
            </p>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Reset Code"}
            </button>

            <div className="login-links">
              <Link to="/login" className="login-link">
                Back to Login
              </Link>
            </div>
          </form>
        );

      case "verification":
        return (
          <form onSubmit={handleVerifyCode} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={email}
                readOnly
              />
            </div>

            <div className="form-group">
              <label htmlFor="verificationCode">Verification Code</label>
              <input
                type="text"
                id="verificationCode"
                className="form-control"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
              />
            </div>

            <p className="help-text">
              Enter the 6-digit code sent to your email. Time remaining:{" "}
              {formatTimeLeft()}
            </p>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify Code"}
            </button>

            <div className="login-links">
              <button
                type="button"
                className="text-button"
                onClick={() => setStage("request")}>
                Try Again
              </button>
            </div>
          </form>
        );

      case "reset":
        return (
          <form onSubmit={handleResetPassword} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={email}
                readOnly
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <PageContainer>
        <div className="login-page">
          <h1 className="login-title">Reset Password</h1>

          {error && <div className="error-message">{error}</div>}

          {renderStageContent()}
        </div>
      </PageContainer>
    </Layout>
  );
}

export default ForgotPasswordPage;
