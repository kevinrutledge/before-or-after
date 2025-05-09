import Layout from "../components/Layout";
import PageContainer from "../components/PageContainer";
import useIsMobile from "../hooks/useIsMobile";

function LossPage() {
  const isMobile = useIsMobile();

  return (
    <Layout>
      <PageContainer>
        <div className="loss-page">
          <h1 className="loss-title">Game Over</h1>
          <p className="final-score">Your score: 7</p>
          <div className="loss-gif-placeholder">
            {isMobile
              ? "GIF Placeholder (Mobile)"
              : "GIF Placeholder (Desktop)"}
          </div>
          <div className="loss-buttons">
            <button className="play-again-button">Play Again</button>
            <button className="back-home-button">Back to Home</button>
          </div>
        </div>
      </PageContainer>
    </Layout>
  );
}

export default LossPage;
