import Layout from "../components/Layout";
import PageContainer from "../components/PageContainer";
import useIsMobile from "../hooks/useIsMobile";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import Background from "../components/Background";

function LossPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { score } = useGame();

  return (
    <Layout>
      <Background />
      <PageContainer>
        <div className="loss-outer">
          <h1 className="loss-title">Game Over</h1>
          <div className="loss-card">
            <div className="loss-gif-large">
              {isMobile
                ? "GIF Placeholder (Mobile)"
                : "GIF Placeholder (Desktop)"}
            </div>
            <div className="loss-score">
              <span className="score-label">Your score</span>
              <span className="score-value">{score}</span>
            </div>
            <div className="loss-buttons-row">
              <button
                className="play-again-button"
                onClick={() => navigate("/game")}>
                Play Again
              </button>
              <button
                className="back-home-button"
                onClick={() => navigate("/")}>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </PageContainer>
    </Layout>
  );
}

export default LossPage;
