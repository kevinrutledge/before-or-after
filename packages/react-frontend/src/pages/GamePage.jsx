import Layout from "../components/Layout";
import PageContainer from "../components/PageContainer";
import useIsMobile from "../hooks/useIsMobile";

function GamePage({ children }) {
    const isMobile = useIsMobile();
  
    return (
      <Layout>
        <PageContainer>
          <div className="game-page">
            {isMobile ? <BottomNav /> : <Header />}
    
            <main className="main-content">
            <PageContainer>{children}</PageContainer>
            </main>
          </div>
        </PageContainer>
      </Layout>
    );
  }
  
  export default GamePage;