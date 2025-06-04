import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../utils/apiClient";
import { useGame } from "../hooks/useGame";
import Layout from "../components/Layout";
import PageContainer from "../components/PageContainer";
import useIsMobile from "../hooks/useIsMobile";
import ResultOverlay from "../components/ResultOverlay";
import { compareCards } from "../utils/gameUtils";
import { shuffleDeck, drawCard } from "../utils/deckUtils";
import Card from "../components/Card";
import Background from "../components/Background";

function GamePage() {
  const isMobile = useIsMobile();
  const { score, incrementScore, resetScore } = useGame();
  const navigate = useNavigate();

  const [referenceCard, setReferenceCard] = useState(null);
  const [currentCard, setCurrentCard] = useState(null);
  const [deck, setDeck] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Overlay and animation state
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayData, setOverlayData] = useState({
    oldTitle: "",
    newTitle: "",
    relation: ""
  });
  const [, setCardAnim] = useState("");

  // Initialize deck and first two cards
  useEffect(() => {
    const initializeDeck = async () => {
      try {
        setIsInitializing(true);

        // Fetch all cards and shuffle into deck
        const allCards = await apiRequest("/api/cards/all");
        const shuffledDeck = shuffleDeck(allCards);

        // Draw first two cards from shuffled deck
        const firstCard = drawCard(shuffledDeck);
        const secondCard = drawCard(shuffledDeck);

        if (!firstCard || !secondCard) {
          throw new Error("Insufficient cards in database");
        }

        setReferenceCard(firstCard);
        setCurrentCard(secondCard);
        setDeck(shuffledDeck);
        setIsInitializing(false);
      } catch {
        setError("Failed to load cards");
        setIsInitializing(false);
      }
    };

    initializeDeck();
    resetScore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Add body class for overflow control
  useEffect(() => {
    document.body.classList.add("game-page");
    return () => document.body.classList.remove("game-page");
  }, []);

  // Handle guess with deck-based card serving
  const handleGuess = async (guess) => {
    if (!referenceCard || !currentCard) return;

    try {
      setIsLoading(true);

      // Process guess using existing logic
      const isCorrect = compareCards(referenceCard, currentCard, guess);

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

      // Show result overlay
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
        // Continue game with next card from deck
        setTimeout(async () => {
          incrementScore();

          // Current card becomes new reference card
          setReferenceCard(currentCard);

          // Draw next card from deck for current position
          if (deck.length > 0) {
            const nextCard = deck[deck.length - 1];
            const newDeck = deck.slice(0, -1);
            setCurrentCard(nextCard);
            setDeck(newDeck);
          } else {
            // Reshuffle deck when exhausted
            const allCards = await apiRequest("/api/cards/all");
            const reshuffledDeck = shuffleDeck(allCards);
            const newCard = reshuffledDeck[reshuffledDeck.length - 1];
            const newDeck = reshuffledDeck.slice(0, -1);
            setCurrentCard(newCard);
            setDeck(newDeck);
          }

          setCardAnim("");
          setIsLoading(false);
        }, 1500);
      } else {
        // Game over
        setTimeout(() => {
          navigate("/loss");
        }, 1500);
      }
    } catch (error) {
      console.error("Error in handleGuess:", error);
      setError("Failed to process guess");
      setIsLoading(false);
    }
  };

  const handleOverlayComplete = () => {
    setShowOverlay(false);
  };

  // Show loading during deck initialization
  if (isInitializing) {
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
        <Background />
        <PageContainer>
          <div className="error-message">{error}</div>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <Background />
      <PageContainer>
        <div className="game-page">
          <div className="score-display">
            <p>Current Score: {score}</p>
          </div>

          <div
            className={`cards-container ${isMobile ? "stacked" : "side-by-side"}`}>
            {/* Current Card */}
            <Card
              className="current-card"
              title={currentCard?.title}
              imageUrl={currentCard?.imageUrl}
              sourceUrl={currentCard?.sourceUrl}
              year={currentCard?.year}
              month={currentCard?.month}
              isReference={false}>
              <div className="guess-sentence">
                <span className="card-sentence">
                  <strong>{currentCard?.title}</strong> is
                </span>
                <button
                  className="before-button"
                  onClick={() => handleGuess("before")}
                  disabled={isInitializing || isLoading}>
                  Before
                </button>
                <button
                  className="after-button"
                  onClick={() => handleGuess("after")}
                  disabled={isInitializing || isLoading}>
                  After
                </button>
                <span className="card-sentence">
                  <strong>{referenceCard?.title}</strong>
                </span>
              </div>
            </Card>

            {/* Reference Card */}
            <Card
              className="reference-card"
              title={referenceCard?.title}
              imageUrl={referenceCard?.imageUrl}
              sourceUrl={referenceCard?.sourceUrl}
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
