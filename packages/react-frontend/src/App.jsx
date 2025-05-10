import React from "react";
import Layout from "./components/Layout";
import PageContainer from "./components/PageContainer";
import { useNavigate } from "react-router-dom";
import { useGame } from "./context/GameContext"; 

function HomePage() {
  const [count, setCount] = React.useState(0);
  const navigate = useNavigate();

  const { score, setScore } = useGame(); 

  const incrementScore = () => {
    setScore((prev) => prev + 1);
  };

  return (
    <Layout>
      <PageContainer>
        <section>
          <h2>Welcome</h2>
          <p>This is the starting point for your app. Replace this with your components.</p>
        </section>

        <section>
          <h2>Counter Example</h2>
          <p>Local count: {count}</p>
          <p>Score from context: {score}</p>
          <button onClick={() => setCount((c) => c + 1)}>Increment local</button>
          <button onClick={incrementScore}>Increment score</button>
        </section>

        <section>
          <h2>Navigate to Other Pages</h2>
          <button onClick={() => navigate("/game")}>Start Game</button>
          <br />
          <button onClick={() => navigate("/loss")}>Loss</button>
        </section>
      </PageContainer>
    </Layout>
  );
}

export default HomePage;
