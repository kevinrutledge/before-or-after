import { useState, useEffect } from "react";
import { authRequest } from "../utils/apiClient";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import PageContainer from "../components/PageContainer";

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
        setIsLoading(true);
        const data = await authRequest("/api/admin/cards");
        setCards(data);
        setIsLoading(false);
      } catch (err) {
        setError(err.message || "Failed to fetch cards");
        setIsLoading(false);
      }
    };

    fetchCards();
  }, []);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
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
          </div>

          <div className="tab-content">
            {activeTab === "cards" && (
              <div className="cards-container">
                {isLoading ? (
                  <div className="loading">Loading cards...</div>
                ) : error ? (
                  <div className="error-message">{error}</div>
                ) : (
                  <div className="cards-grid">
                    {cards.length === 0 ? (
                      <p>No cards found. Add some cards to get started.</p>
                    ) : (
                      cards.map((card) => (
                        <div key={card._id} className="admin-card">
                          <h3>{card.title}</h3>
                          <p>Year: {card.year}</p>
                          <p>Category: {card.category}</p>
                          <div className="card-actions">
                            <button className="edit-button">Edit</button>
                            <button className="delete-button">Delete</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "stats" && (
              <div className="stats-container">
                <h2>Game Statistics</h2>
                <p>Statistics functionality coming soon</p>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </Layout>
  );
}

export default AdminDashboard;
