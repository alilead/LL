import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const location = useLocation();
  const { user, isAuthenticated, fetchUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (isAuthenticated && !user) {
        try {
          await fetchUser();
        } catch (error) {
          console.error('Failed to fetch user:', error);
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, [isAuthenticated, user, fetchUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (!user.is_superuser) {
    return <Navigate to="/leads" replace />;
  }

  return <>{children}</>;
}
