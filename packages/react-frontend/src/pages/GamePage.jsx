import Layout from "../components/Layout";
import PageContainer from "../components/PageContainer";
import useIsMobile from "../hooks/useIsMobile";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";

function GamePage() {
    const isMobile = useIsMobile();
    const { score } = useGame();
    const navigate = useNavigate();
    const handleCardClick = (selection) => {
        console.log(`User selected: ${selection}`);
        // Add logic for handling the selection
      };
  
    return (
      <Layout>
        <PageContainer>
          <div className="game-page">
            <h1 className="game-title">Before or After?</h1>
            <div className="score-display">
              <p>Current Score: {score}</p>
            </div>
            <div className={`cards-container ${isMobile ? "stacked" : "side-by-side"}`}>
              <div 
                className="card before-card"
                onClick={() => handleCardClick("before")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleCardClick("before")}
              >
                <h2>Before</h2>
                <p>Item: Example Item</p>
                <p>Year: Example Year</p>
                <div className="placeholder-image">Image Placeholder</div>
              </div>
              <div 
                className="card after-card"
                onClick={() => handleCardClick("after")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleCardClick("after")}
              >
                <h2>After</h2>
                <p>Item: Example Item</p>
                <div className="spacer"></div>
                <div className="placeholder-image">Image Placeholder</div>
              </div>
            </div>
            <div>
              <button className="back-home-button" onClick={() => navigate("/")}>
                Back to Home
              </button>
            </div>
          </div>
        </PageContainer>
      </Layout>
    );
  }
  
  export default GamePage;