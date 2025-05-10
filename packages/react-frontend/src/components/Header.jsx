/**
 * Render desktop navigation header with scores and user icon.
 */

import { useGame } from "../context/GameContext"


function Header() {
  const {score, highscore} = useGame()
  return (
    <header className="desktop-only">
      <div className="container">
        <nav className="header-nav">
          <div className="high-score">High Score: {highscore}</div>
          <div className="current-score">Score: {score}</div>
          <div className="user-icon">
            <div className="circle-placeholder"></div>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;
