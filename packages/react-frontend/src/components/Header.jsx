import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../hooks/useGame";
import { useAuth } from "../hooks/useAuth";

function Header() {
  const { highscore } = useGame();
  const { isAuthenticated, user, logout } = useAuth();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const navigate = useNavigate();

  const toggleAccountMenu = () => {
    setShowAccountMenu(!showAccountMenu);
  };

  const signOut = () => {
    logout();
    setShowAccountMenu(false);
    navigate("/");
  };

  const signIn = () => {
    setShowAccountMenu(false);
    navigate("/login");
  };

  const signUp = () => {
    setShowAccountMenu(false);
    navigate("/signup");
  };

  const openDashboard = () => {
    setShowAccountMenu(false);
    navigate("/admin");
  };

  const goHome = () => navigate("/");

  const goToLeaderboard = () => navigate("/leaderboard");

  return (
    <header className="desktop-only">
      <div className="header-nav">
        <div className="container header-container">
          <button className="logo-button" onClick={goHome}>
            <div className="logo-square">
              <img
                src="/assets/logo.svg"
                alt="Before or After Logo"
                width="48"
                height="48"
              />
            </div>
          </button>

          <button
            className="high-score-button header-center"
            onClick={goToLeaderboard}>
            <div className="high-score-pill">
              <span className="score-label">High Score</span>
              <span className="score-value">{highscore}</span>
            </div>
          </button>

          <div className="account-dropdown">
            <button
              className="account-button"
              onClick={toggleAccountMenu}
              aria-expanded={showAccountMenu}
              aria-haspopup="true">
              <div className="account-button-pill">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="#4B5563">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            </button>

            {showAccountMenu && (
              <div className="account-menu">
                {isAuthenticated ? (
                  <>
                    {user?.role === "admin" && (
                      <button
                        className="account-menu-item"
                        onClick={openDashboard}>
                        Dashboard
                      </button>
                    )}
                    <button
                      className="account-menu-item logout-item"
                      onClick={signOut}>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button className="account-menu-item" onClick={signIn}>
                      Sign In
                    </button>
                    <button className="account-menu-item" onClick={signUp}>
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
