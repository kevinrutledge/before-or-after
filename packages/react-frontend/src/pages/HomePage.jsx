import PageContainer from "../components/PageContainer";
import useIsMobile from "../hooks/useIsMobile";
import { useNavigate } from "react-router-dom";
import PlayButton from "../components/PlayButton";
import Background from "../components/Background";

function HomePage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  return (
    <div>
      <Background />
      <PageContainer>
        <div className="home-page">
          <img
            className="home-logo"
            alt="Before or After Logo"
            src={isMobile ? "/assets/logo.svg" : "/assets/logo.svg"}></img>
          <h1 className="home-tagline">
            A daily game where players compare the release dates of various
            cultural artifacts
          </h1>
          <div onClick={() => navigate("/game")}>
            <PlayButton />
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

export default HomePage;
