import Layout from "../components/Layout";
import PageContainer from "../components/PageContainer";
import useIsMobile from "../hooks/useIsMobile";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  return (
    <Layout>
      <PageContainer>
        <div className="home-page">
          <img
            className="home-logo"
            alt="Before or After Logo"
            src={
              isMobile
                ? "https://openclipart.org/image/2000px/232064"
                : "https://openclipart.org/image/2000px/232064"
            }></img>
          <h1 className="home-title">Welcome to Before or After!</h1>
          <h2 className="home-tagline">
            A daily game where players guess the release year of various
            cultural artifacts
          </h2>
          <button className="play-button" onClick={() => navigate("/game")}>
            Play
          </button>
          {/* DELETE THIS BUTTON AFTER DEMO */}
          <button
            className="play-button"
            onClick={() => navigate("/loss")}
            style={{ marginTop: "10px" }}>
            Demo Loss
          </button>
          {/* DELETE THIS BUTTON AFTER DEMO */}
        </div>
      </PageContainer>
    </Layout>
  );
}

export default HomePage;
