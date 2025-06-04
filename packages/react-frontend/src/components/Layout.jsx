import Header from "./Header";
import BottomNav from "./BottomNav";
import PageContainer from "./PageContainer";
import useIsMobile from "../hooks/useIsMobile";

/**
 * Wrap application with responsive navigation and content container.
 */
function Layout({ children }) {
  const isMobile = useIsMobile();

  return (
    <div className="layout" data-testid="layout">
      {isMobile ? <BottomNav /> : <Header />}

      <main className="main-content">
        <PageContainer>{children}</PageContainer>
      </main>
    </div>
  );
}

export default Layout;
