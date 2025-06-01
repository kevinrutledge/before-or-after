import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../hooks/useGame";
import { useAuth } from "../hooks/useAuth";

function BottomNav() {
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
    <nav className="mobile-only bottom-nav">
      <div className="container">
        <div className="nav-items">
          <button className="logo-button" onClick={goHome}>
            <div className="logo-square">
              <img
                src="/assets/logo.svg"
                alt="Before or After Logo"
                width="40"
                height="40"
              />
            </div>
          </button>

          <button className="high-score-button" onClick={goToLeaderboard}>
            <div className="high-score-pill mobile-score-pill">
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
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#4B5563">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            </button>

            {showAccountMenu && (
              <div className="account-menu mobile-menu">
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
    </nav>
  );
}

export default BottomNav;
