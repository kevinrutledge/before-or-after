import React from "react";
import Layout from "./components/Layout";
import PageContainer from "./components/PageContainer";

// Minimal App component using shared layout components
function App() {
  // Example state: simple counter to demonstrate React functionality
  const [count, setCount] = React.useState(0);

  return (
    <Layout>
      <PageContainer>
        <section>
          <h2>Welcome</h2>
          <p>
            This is the starting point for your app. Replace this with your
            components.
          </p>
        </section>

        <section>
          <h2>Counter Example</h2>
          <p>Current count: {count}</p>
          <button onClick={() => setCount((c) => c + 1)}>Increment</button>
        </section>

        {/* TODO: Insert <Home />, <Game />, and <Loss /> components here */}
      </PageContainer>
    </Layout>
  );
}

export default App;
