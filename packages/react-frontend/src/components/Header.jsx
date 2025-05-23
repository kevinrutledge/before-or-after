import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { useAuth } from "../context/AuthContext";

function Header() {
  const { score, highscore } = useGame();
  const { isAuthenticated, user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  // Handle navigation to login page
  const handleSignIn = () => {
    navigate("/login");
  };

  // Handle navigation to signup page
  const handleSignUp = () => {
    navigate("/signup");
  };

  // Toggle profile dropdown menu
  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    navigate("/");
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.email) return "?";
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header className="desktop-only">
      <div className="container">
        <nav className="header-nav">
          <button
            className="back-home-button"
            onClick={() => navigate("/")}>
            Back to Home
          </button>
          {/* Left: High Score */}
          <div className="high-score">High Score: {highscore}</div>

          {/* Center: Current Score */}
          <div className="current-score">Score: {score}</div>

          {/* Right: Auth Controls */}
          {isAuthenticated ? (
            <div className="profile-dropdown">
              <button
                className="profile-button"
                onClick={toggleProfileMenu}
                aria-expanded={showProfileMenu}
                aria-haspopup="true">
                <div className="profile-icon">{getUserInitials()}</div>
              </button>

              {showProfileMenu && (
                <div className="profile-menu">
                  <button
                    className="profile-menu-item logout-item"
                    onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
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
        </nav>
      </div>
    </header>
  );
}

export default Header;
