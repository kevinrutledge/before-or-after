import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes";
import Layout from "../components/Layout";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Layout>
        <AppRoutes />
      </Layout>
    </BrowserRouter>
  );
}
