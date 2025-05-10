import Layout from "../components/Layout";
import PageContainer from "../components/PageContainer";
import useIsMobile from "../hooks/useIsMobile";

function HomePage() {
    const isMobile = useIsMobile();

    return (
        <Layout>
            <PageContainer>
                <div className="home-page">
                    <h1 className = "home-title">Welcome to Before or After!</h1>
                </div>
            </PageContainer>
        </Layout>
    )
}

export default HomePage;