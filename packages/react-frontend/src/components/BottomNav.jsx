import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { useAuth } from "../context/AuthContext";

function BottomNav() {
  const { score, highscore } = useGame();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Handle navigation to login page
  const handleSignIn = () => {
    navigate("/login");
  };

  // Handle navigation to signup page
  const handleSignUp = () => {
    navigate("/signup");
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="mobile-only bottom-nav">
      <div className="container">
        <div className="nav-items">
          <button
            className="back-home-button"
            onClick={() => navigate("/")}
            style={{ marginTop: "20px" }}>
            Back to Home
          </button>

          {/* Left: High Score */}
          <div className="high-score">High: {highscore}</div>

          {/* Center: Current Score */}
          <div className="current-score">Score: {score}</div>

          {/* Right: Auth Controls */}
          {isAuthenticated ? (
            <button
              className="auth-button logout-button"
              onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <div className="auth-buttons">
              <button
                className="auth-button signin-button"
                onClick={handleSignIn}>
                Sign In
              </button>
              <button
                className="auth-button signup-button"
                onClick={handleSignUp}
                style={{ color: "black" }}>
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default BottomNav;
