import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, access_token } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !access_token) {
    // Save the attempted URL for redirecting after login
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
