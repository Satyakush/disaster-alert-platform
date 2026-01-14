import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * @param {ReactNode} children
 * @param {string[]} allowedRoles
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, user, loading } = useAuth();

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  // Not logged in
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Role check (if provided)
  if (
    allowedRoles &&
    Array.isArray(allowedRoles) &&
    !allowedRoles.includes(user.role)
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
