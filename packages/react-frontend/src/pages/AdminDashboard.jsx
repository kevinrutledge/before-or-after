import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import PageContainer from "../components/PageContainer";
import { useAuth } from "../context/AuthContext";

function AdminDashboard() {
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("cards");
  const { user } = useAuth();

  // Fetch cards when component mounts
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("Authentication required");
        }

        const response = await fetch("/api/admin/cards", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch cards");
        }

        const data = await response.json();
        setCards(data);
      } catch (err) {
        console.error("Error fetching cards:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCards();
  }, []);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Render different content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "cards":
        return renderCardsTab();
      case "stats":
        return renderStatsTab();
      case "lossGifs":
        return renderLossGifsTab();
      default:
        return renderCardsTab();
    }
  };

  // Cards tab content
  const renderCardsTab = () => {
    if (isLoading) {
      return <div className="loading">Loading cards...</div>;
    }

    if (error) {
      return <div className="error-message">{error}</div>;
    }

    return (
      <div className="cards-container">
        <div className="admin-controls">
          <button className="add-card-button">Add New Card</button>
          <input
            type="text"
            className="search-input"
            placeholder="Search cards..."
          />
        </div>

        <div className="cards-grid">
          {cards.length === 0 ? (
            <p>No cards found. Add some cards to get started.</p>
          ) : (
            cards.map((card) => (
              <div key={card._id} className="admin-card">
                <h3>{card.title}</h3>
                <p>Year: {card.year}</p>
                <p>Category: {card.category}</p>
                <div className="card-image-placeholder">
                  {card.imageUrl ? "Image" : "No Image"}
                </div>
                <div className="card-actions">
                  <button className="edit-button">Edit</button>
                  <button className="delete-button">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Stats tab content
  const renderStatsTab = () => {
    return (
      <div className="stats-container">
        <h2>Game Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Games</h3>
            <p className="stat-value">123</p>
          </div>
          <div className="stat-card">
            <h3>Total Players</h3>
            <p className="stat-value">45</p>
          </div>
          <div className="stat-card">
            <h3>Avg. Score</h3>
            <p className="stat-value">8.7</p>
          </div>
          <div className="stat-card">
            <h3>Highest Score</h3>
            <p className="stat-value">32</p>
          </div>
        </div>

        <div className="stats-charts">
          <div className="chart-placeholder">
            <p>Daily Active Users Chart</p>
          </div>
          <div className="chart-placeholder">
            <p>Score Distribution Chart</p>
          </div>
        </div>
      </div>
    );
  };

  // Loss GIFs tab content
  const renderLossGifsTab = () => {
    return (
      <div className="loss-gifs-container">
        <h2>Loss GIF Categories</h2>
        <div className="admin-controls">
          <button className="add-gif-button">Add New GIF</button>
          <select className="category-filter">
            <option value="">All Categories</option>
            <option value="funny">Funny</option>
            <option value="movies">Movies</option>
            <option value="sports">Sports</option>
          </select>
        </div>

        <div className="gifs-grid">
          <div className="gif-card">
            <h3>Funny Fail</h3>
            <div className="gif-placeholder">GIF Preview</div>
            <p>Category: Funny</p>
            <div className="gif-actions">
              <button className="edit-button">Edit</button>
              <button className="delete-button">Delete</button>
            </div>
          </div>

          <div className="gif-card">
            <h3>Movie Quote</h3>
            <div className="gif-placeholder">GIF Preview</div>
            <p>Category: Movies</p>
            <div className="gif-actions">
              <button className="edit-button">Edit</button>
              <button className="delete-button">Delete</button>
            </div>
          </div>

          {/* More placeholder GIFs would go here */}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <PageContainer>
        <div className="admin-dashboard">
          <div className="admin-header">
            <h1>Admin Dashboard</h1>
            <p>Welcome, {user?.email || "Admin"}</p>
          </div>

          <div className="admin-tabs">
            <button
              className={`tab-button ${activeTab === "cards" ? "active" : ""}`}
              onClick={() => handleTabChange("cards")}>
              Cards
            </button>
            <button
              className={`tab-button ${activeTab === "stats" ? "active" : ""}`}
              onClick={() => handleTabChange("stats")}>
              Statistics
            </button>
            <button
              className={`tab-button ${activeTab === "lossGifs" ? "active" : ""}`}
              onClick={() => handleTabChange("lossGifs")}>
              Loss GIFs
            </button>
          </div>

          <div className="tab-content">{renderTabContent()}</div>
        </div>
      </PageContainer>
    </Layout>
  );
}

export default AdminDashboard;
