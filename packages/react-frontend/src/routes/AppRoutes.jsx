import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "../pages/HomePage";
import GamePage from "../pages/GamePage";
import LossPage from "../pages/LossPage";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import LeaderboardPage from "../pages/LeaderboardPage";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminDashboard from "../pages/AdminDashboard";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/game" element={<GamePage />} />
      <Route path="/loss" element={<LossPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />

      {/* Protected Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute
            component={AdminDashboard}
            requiredRole="admin"
            redirectTo="/login"
          />
        }
      />
      <Route
        path="/admin/cards"
        element={
          <ProtectedRoute
            component={AdminDashboard}
            requiredRole="admin"
            redirectTo="/login"
          />
        }
      />

      {/* Catch-all route redirects to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
