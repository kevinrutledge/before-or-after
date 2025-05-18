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
                ? "/assets/logo.svg"
                : "/assets/logo.svg"
            }></img>
          <h1 className="home-tagline">
            A daily game where players compare the release dates of various cultural artifacts
          </h1>
          <button className="play-button" onClick={() => navigate("/game")}>
            Play
          </button>
        </div>
      </PageContainer>
    </Layout>
  );
}

export default HomePage;
