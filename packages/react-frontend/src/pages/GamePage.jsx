import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../utils/apiClient";
import { useGame } from "../context/GameContext";
import Layout from "../components/Layout";
import PageContainer from "../components/PageContainer";
import useIsMobile from "../hooks/useIsMobile";

function GamePage() {
  const isMobile = useIsMobile();
  const { score, incrementScore, resetScore } = useGame();
  const navigate = useNavigate();

  const [referenceCard, setReferenceCard] = useState(null);
  const [currentCard, setCurrentCard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial card on component mount
  useEffect(() => {
    const fetchInitialCard = async () => {
      try {
        setIsLoading(true);
        const card = await apiRequest("/api/cards/next");
        setReferenceCard(card);

        // Get a second card
        const nextCard = await apiRequest("/api/cards/next");
        setCurrentCard(nextCard);

        setIsLoading(false);
      } catch {
        setError("Failed to load cards");
        setIsLoading(false);
      }
    };

    fetchInitialCard();
    resetScore();
  }, [resetScore]);

  // Handle guess
  const handleGuess = async (guess) => {
    if (!referenceCard || !currentCard) return;

    try {
      setIsLoading(true);

      const result = await apiRequest("/api/cards/guess", {
        method: "POST",
        body: JSON.stringify({
          previousYear: referenceCard.year,
          currentYear: currentCard.year,
          guess
        })
      });

      if (result.correct) {
        // Update score and continue
        incrementScore();
        setReferenceCard(currentCard);
        setCurrentCard(result.nextCard);
      } else {
        // Game over
        navigate("/loss");
      }

      setIsLoading(false);
    } catch {
      setError("Failed to process guess");
      setIsLoading(false);
    }
  };

  if (isLoading && !referenceCard) {
    return (
      <Layout>
        <PageContainer>
          <div className="loading">Loading game...</div>
        </PageContainer>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <PageContainer>
          <div className="error-message">{error}</div>
          <button className="back-home-button" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>
        <div className="game-page">
          <h1 className="game-title">Before or After?</h1>
          <div className="score-display">
            <p>Current Score: {score}</p>
          </div>

          <div
            className={`cards-container ${isMobile ? "stacked" : "side-by-side"}`}>
            {/* Reference Card */}
            <div className="card reference-card">
              <h2>{referenceCard?.title}</h2>
              <p>Year: {referenceCard?.year}</p>
              <div className="placeholder-image">
                {referenceCard?.imageUrl ? (
                  <img
                    src={referenceCard.imageUrl}
                    alt={referenceCard.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "fallback-image.jpg"; // Optional fallback image
                      e.target.alt = "Image not available";
                    }}
                  />
                ) : (
                  "No Image"
                )}
              </div>
            </div>

            {/* Current Card */}
            <div className="card current-card">
              <h2>{currentCard?.title}</h2>
              <div className="spacer"></div>
              <div className="placeholder-image">
                {currentCard?.imageUrl ? (
                  <img
                    src={currentCard.imageUrl}
                    alt={currentCard.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "fallback-image.jpg"; // Optional fallback image
                      e.target.alt = "Image not available";
                    }}
                  />
                ) : (
                  "No Image"
                )}
              </div>
            </div>
          </div>

          <div className="guess-buttons">
            <button
              className="before-button"
              onClick={() => handleGuess("before")}
              disabled={isLoading}>
              Before
            </button>
            <button
              className="after-button"
              onClick={() => handleGuess("after")}
              disabled={isLoading}>
              After
            </button>
          </div>

          <button
            className="back-home-button"
            onClick={() => navigate("/")}
            style={{ marginTop: "20px" }}>
            Back to Home
          </button>
        </div>
      </PageContainer>
    </Layout>
  );
}

export default GamePage;
