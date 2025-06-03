import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import PageContainer from "../components/PageContainer";
import useIsMobile from "../hooks/useIsMobile";
import { useNavigate } from "react-router-dom";
import { useGame } from "../hooks/useGame";
import Background from "../components/Background";
import {apiRequest} from "../utils/apiClient";

function LossPage() {
  const isMobile = useIsMobile();
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

  // Should add fallbacks for when the GIF is not found or loading fails
  const fallbackGifs = [
    {
      min: 0,
      max: 2,
      url: "/assets/loss-bad.gif",
      alt: "Bad loss reaction GIF"
    },
    {
      min: 3,
      max: 4,
      url: "/assets/loss-frustrated.gif",
      alt: "Frustrated reaction GIF"
    },
    {
      min: 5,
      max: 7,
      url: "/assets/loss-decent.gif",
      alt: "Decent reaction GIF"
    },
    {
      min: 8,
      max: 11,
      url: "/assets/loss-satisfied.gif",
      alt: "Satisfied reaction GIF"
    },
    {
      min: 12,
      max: 1000,
      url: "/assets/loss-ecstatic.gif",
      alt: "Ecstatic reaction GIF"
    }
  ];

  function getFallbackGif(score) {
    return (
      fallbackGifs.find((g) => score >= g.min && score <= g.max) ||
      fallbackGifs[0]
    );
  }

  let gifContent;
  if (loading) {
    gifContent = <div className="loss-gif-large">Loading reaction...</div>;
  } else if (error || !gif?.imageUrl) {
    const fallback = getFallbackGif(score);
    gifContent = (
      <img
        className="loss-gif-large"
        src={fallback.url}
        alt={fallback.alt}
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
