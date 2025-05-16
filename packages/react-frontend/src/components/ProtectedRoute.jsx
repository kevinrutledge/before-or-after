import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Protected route component with role-based access and guest mode fallback.
 *
 * @param {Object} props Component props
 * @param {React.Component} props.component Component to render if authorized
 * @param {string} [props.requiredRole] Optional role requirement ("user" or "admin")
 * @param {string} [props.redirectTo="/login"] Redirect path for unauthorized users
 * @param {boolean} [props.allowGuest=false] Whether to allow guest access
 */
function ProtectedRoute({
  component: Component,
  requiredRole,
  redirectTo = "/login",
  allowGuest = false,
  ...rest
}) {
  const { isAuthenticated, isGuest, user, isLoading } = useAuth();

  // If still loading auth state, show loading indicator
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    // If guest mode is allowed and user is in guest mode, render the component
    if (allowGuest && isGuest) {
      return <Component {...rest} />;
    }

    // Otherwise redirect to login with return path
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{ from: window.location.pathname }}
      />
    );
  }

  // If role is required, check if user has that role
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect users without required role
    return <Navigate to="/" replace />;
  }

  // User is authenticated and has required role (if specified)
  return <Component {...rest} />;
}

export default ProtectedRoute;
