/**
 * Render desktop navigation header with scores and user icon.
 */
function Header() {
  return (
    <header className="desktop-only">
      <div className="container">
        <nav className="header-nav">
          <div className="high-score">High Score: 0</div>
          <div className="current-score">Score: 0</div>
          <div className="user-icon">
            <div className="circle-placeholder"></div>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;
