import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiRequest } from "../utils/apiClient";
import Layout from "../components/Layout";
import PageContainer from "../components/PageContainer";
import Background from "../components/Background";

function SignupPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate required fields
    if (!email || !username || !password) {
      setError("Email, username, and password are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // Validate username format on frontend
    if (username.length < 3 || username.length > 20) {
      setError("Username must be 3-20 characters");
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      setError(
        "Username can only contain letters, numbers, underscore, and dash"
      );
      return;
    }

    setIsLoading(true);

    try {
      await apiRequest("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, username, password })
      });

      navigate("/login", {
        state: { message: "Account created! Please sign in." }
      });
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <Background />
      <PageContainer>
        <div className="login-page">
          <h1 className="login-title">Create Account</h1>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
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

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username (3-20 characters)"
                minLength="3"
                maxLength="20"
                pattern="[a-zA-Z0-9_-]+"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}>
                  <div className={`eye-icon ${showPassword ? "hide" : ""}`}>
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}>
                  <div className={`eye-icon ${showPassword ? "hide" : ""}`}>
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="login-button"
                disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Sign Up"}
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => navigate("/")}>
                Cancel
              </button>
            </div>

            <div className="login-links">
              <span>Already have an account?</span>
              <Link to="/login" className="login-link">
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </PageContainer>
    </Layout>
  );
}

export default SignupPage;
