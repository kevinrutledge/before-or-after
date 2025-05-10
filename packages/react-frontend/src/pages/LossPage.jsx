import Layout from "../components/Layout";
import PageContainer from "../components/PageContainer";
import useIsMobile from "../hooks/useIsMobile";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";

function LossPage() {
  const isMobile = useIsMobile();

  const navigate = useNavigate()
  const { score, highscore } = useGame()

  return (
    <Layout>
      <PageContainer>
        <div className="loss-page">
          <h1 className="loss-title">Game Over</h1>
          <p className="final-score">Your score: {score}</p>
          <div className="loss-gif-placeholder">
            {isMobile
              ? "GIF Placeholder (Mobile)"
              : "GIF Placeholder (Desktop)"}
          </div>
          <div className="loss-buttons">
            <button className="play-again-button" onClick = {() => navigate("/game")}>Play Again</button>
            <button className="back-home-button" onClick ={() => navigate("/")} >Back to Home</button>
          </div>
        </div>
      </PageContainer>
    </Layout>
  );
}

export default LossPage;
