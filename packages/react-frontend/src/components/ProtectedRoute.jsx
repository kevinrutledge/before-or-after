import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Protected route component with role-based access control.
 *
 * @param {Object} props Component props
 * @param {React.Component} props.component Component to render when authorized
 * @param {string} [props.requiredRole] Optional role requirement ("user" or "admin")
 * @param {string} [props.redirectTo="/login"] Redirect path for unauthorized users
 */
function ProtectedRoute({
  component: Component,
  requiredRole,
  redirectTo = "/login",
  ...rest
}) {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Show loading indicator while auth state loads
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{ from: window.location.pathname }}
      />
    );
  }

  // Check role requirement when specified
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Render component when authenticated and authorized
  return <Component {...rest} />;
}

export default ProtectedRoute;
