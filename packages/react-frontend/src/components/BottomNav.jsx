/**
 * Display fixed navigation bar at bottom of mobile screens.
 */
function BottomNav() {
  return (
    <nav className="mobile-only bottom-nav">
      <div className="container">
        <div className="nav-items">
          <div className="high-score">High Score: 0</div>
          <div className="current-score">Score: 0</div>
          <div className="user-icon">
            <div className="circle-placeholder"></div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default BottomNav;
