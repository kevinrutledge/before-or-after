import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiRequest } from "../utils/apiClient";
import Layout from "../components/Layout";
import PageContainer from "../components/PageContainer";
import Background from "../components/Background";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [stage, setStage] = useState("request"); // request, verification, reset
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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
      await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      setStage("verification");
    } catch (err) {
      setError(err.message || "Failed to send reset code");
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
      const data = await apiRequest("/api/auth/verify-code", {
        method: "POST",
        body: JSON.stringify({ email, code: verificationCode })
      });

      // Store reset token and move to reset password stage
      localStorage.setItem("resetToken", data.resetToken);
      setStage("reset");
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

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
        throw new Error("Reset token missing");
      }

      await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email,
          resetToken,
          newPassword
        })
      });

      // Clear reset token and redirect to login
      localStorage.removeItem("resetToken");
      navigate("/login", {
        state: {
          message:
            "Password reset successful! Please sign in with your new password."
        }
      });
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

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
                placeholder="Enter verification code"
                maxLength={6}
                required
              />
            </div>

            <p className="help-text">
              Enter the code sent to your email. It will expire in 15 minutes.
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
      <Background />
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
