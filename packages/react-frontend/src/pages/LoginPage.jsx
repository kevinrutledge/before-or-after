import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiRequest } from "../utils/apiClient";
import PageContainer from "../components/PageContainer";
import Background from "../components/Background";

function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const message = location.state?.message;

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate form
    if (!emailOrUsername || !password) {
      setError("Email/username and password are required");
      return;
    }

    setIsLoading(true);

    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ emailOrUsername, password })
      });

      console.log("Login API response:", data);

      login(data.token, data.user);
      navigate("/");
    } catch {
      setError("Invalid email/username or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Background />
      <PageContainer>
        <div className="login-page">
          <h1 className="login-title">Sign In</h1>

          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="emailOrUsername">Email or Username</label>
              <input
                type="text"
                id="emailOrUsername"
                className="form-control"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="Enter your email or username"
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
                  placeholder="Enter your password"
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
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => navigate("/")}>
                Cancel
              </button>
            </div>

            <div className="login-links">
              <Link to="/signup" className="signup-link">
                Sign Up
              </Link>
              <span className="separator">|</span>
              <Link to="/forgot-password" className="forgot-password-link">
                Forgot Password?
              </Link>
            </div>
          </form>
        </div>
      </PageContainer>
    </div>
  );
}

export default LoginPage;
