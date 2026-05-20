import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';


// A component to protect routes that require authentication
export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}