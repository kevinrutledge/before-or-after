import { useState, useEffect } from "react";
import { apiRequest } from "../utils/apiClient";
import Layout from "../components/Layout";
import PageContainer from "../components/PageContainer";
import Background from "../components/Background";

function LeaderboardPage() {
  const [scores, setScores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load leaderboard data from API on component mount
  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const leaderboardData = await apiRequest("/api/leaderboard?limit=10");
        setScores(leaderboardData);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
        setError("Failed to load leaderboard data");
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <Layout>
        <Background />
        <PageContainer>
          <div className="leaderboard-page">
            <h1 className="leaderboard-title">Leaderboard</h1>
            <div className="loading">Loading leaderboard...</div>
          </div>
        </PageContainer>
      </Layout>
    );
  }

  // Show error state when API request fails
  if (error) {
    return (
      <Layout>
        <Background />
        <PageContainer>
          <div className="leaderboard-page">
            <h1 className="leaderboard-title">Leaderboard</h1>
            <div className="empty-leaderboard">
              <p>Unable to load leaderboard. Please try again later.</p>
            </div>
          </div>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <Background />
      <PageContainer>
        <div className="leaderboard-page">
          <h1 className="leaderboard-title">Leaderboard</h1>

          {scores.length === 0 ? (
            <div className="empty-leaderboard">
              <p>No scores recorded yet. Sign up and be first to compete!</p>
            </div>
          ) : (
            <div className="leaderboard-list">
              {scores.map((entry, index) => (
                <div
                  key={`${entry.username}-${entry._id}`}
                  className="leaderboard-entry">
                  <span className="rank">#{index + 1}</span>
                  <span className="username">{entry.username}</span>
                  <span className="score">{entry.highScore}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </Layout>
  );
}

export default LeaderboardPage;
