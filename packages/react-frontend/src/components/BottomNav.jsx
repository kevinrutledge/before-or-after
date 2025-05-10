/**
 * Display fixed navigation bar at bottom of mobile screens.
 */
import { useGame } from "../context/GameContext";

function BottomNav() {
  const { score, highscore } = useGame();
  return (
    <nav className="mobile-only bottom-nav">
      <div className="container">
        <div className="nav-items">
          <div className="high-score">High Score: {highscore}</div>
          <div className="current-score">Score: {score}</div>
          <div className="user-icon">
            <div className="circle-placeholder"></div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default BottomNav;
