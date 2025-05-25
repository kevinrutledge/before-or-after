import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../utils/apiClient";
import { useGame } from "../context/GameContext";
import Layout from "../components/Layout";
import PageContainer from "../components/PageContainer";
import useIsMobile from "../hooks/useIsMobile";
import ResultOverlay from "../components/ResultOverlay";
import { compareCards } from "../utils/gameUtils";
import Card from "../components/Card";

function GamePage() {
  const isMobile = useIsMobile();
  const { score, incrementScore, resetScore } = useGame();
  const navigate = useNavigate();

  const [referenceCard, setReferenceCard] = useState(null);
  const [currentCard, setCurrentCard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Overlay and animation state
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayData, setOverlayData] = useState({
    oldTitle: "",
    newTitle: "",
    relation: ""
  });
  const [, /*cardAnim*/ setCardAnim] = useState(""); // '', 'card-exit-active', etc.

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
  }, []);

  // Handle guess
  const handleGuess = async (guess) => {
    if (!referenceCard || !currentCard) return;

    try {
      setIsLoading(true);

      // Use compareCards utility for core logic
      const isCorrect = compareCards(referenceCard, currentCard, guess);

      console.log({
        previousYear: referenceCard?.year,
        previousMonth: referenceCard?.month,
        currentYear: currentCard?.year,
        currentMonth: currentCard?.month,
        guess
      });

      await apiRequest("/api/cards/guess", {
        method: "POST",
        body: JSON.stringify({
          previousYear: referenceCard.year,
          previousMonth: referenceCard.month,
          currentYear: currentCard.year,
          currentMonth: currentCard.month,
          guess
        })
      });

      // Show overlay with result
      setOverlayData({
        oldTitle: referenceCard.title,
        newTitle: currentCard.title,
        relation: guess === "before" ? "Before" : "After",
        isCorrect
      });
      setShowOverlay(true);
      setCardAnim("card-exit-active");

      setTimeout(() => {
        setCardAnim("card-enter-active");
      }, 500);

      if (isCorrect) {
        // Update score and continue after overlay
        setTimeout(async () => {
          incrementScore();
          setReferenceCard(currentCard);
          // Fetch a new card for the next round
          const nextCard = await apiRequest("/api/cards/next");
          setCurrentCard(nextCard);
          setCardAnim("");
        }, 1500);
      } else {
        // Game over after overlay
        setTimeout(() => {
          navigate("/loss");
        }, 1500);
      }

      setIsLoading(false);
    } catch {
      setError("Failed to process guess");
      setIsLoading(false);
    }
  };

  const handleOverlayComplete = () => {
    setShowOverlay(false);
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
            {/* Current Card (guess card) */}
            <Card
              className="current-card"
              title={currentCard?.title}
              imageUrl={currentCard?.imageUrl}
              year={currentCard?.year}
              month={currentCard?.month}
              isReference={false}>
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
            </Card>

            {/* Reference Card */}
            <Card
              className="reference-card"
              title={referenceCard?.title}
              imageUrl={referenceCard?.imageUrl}
              year={referenceCard?.year}
              month={referenceCard?.month}
              isReference={true}
            />
          </div>
        </div>
        <ResultOverlay
          visible={showOverlay}
          oldTitle={overlayData.oldTitle}
          newTitle={overlayData.newTitle}
          relation={overlayData.relation}
          isCorrect={overlayData.isCorrect}
          onAnimationComplete={handleOverlayComplete}
        />
      </PageContainer>
    </Layout>
  );
}

export default GamePage;
