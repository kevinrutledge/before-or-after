import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
