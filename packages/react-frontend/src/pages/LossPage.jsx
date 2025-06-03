import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import PageContainer from "../components/PageContainer";
import { useNavigate } from "react-router-dom";
import { useGame } from "../hooks/useGame";
import Background from "../components/Background";
import { apiRequest } from "../utils/apiClient";

function LossPage() {
  const navigate = useNavigate();
  const { score } = useGame();

  const [gif, setGif] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(false);

    apiRequest(`/api/loss-gifs/current?score=${score}`)
      .then((data) => {
        if (isMounted) {
          setGif(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [score]);

  let gifContent;
  if (loading) {
    gifContent = <div className="loss-gif-large">Loading reaction...</div>;
  } else if (error || !gif?.imageUrl) {
    gifContent = (
      <img
        className="loss-gif-large"
        src="/assets/loss.webp"
        alt="Loss reaction"
        draggable={false}
      />
    );
  } else {
    gifContent = (
      <img
        className="loss-gif-large"
        src={gif.imageUrl}
        alt={
          gif.category ? `${gif.category} reaction GIF` : "Loss reaction GIF"
        }
        draggable={false}
      />
    );
  }

  return (
    <Layout>
      <Background />
      <PageContainer>
        <div className="loss-outer">
          <h1 className="loss-title">Game Over</h1>
          <div className="loss-card">
            {gifContent}
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
