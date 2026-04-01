import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectAuthLoading } from '../../store/slices/authSlice';

console.log('[DEBUG] ProtectedRoute.tsx - Module loaded');

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute Component
 * Wraps protected routes and redirects to login if user is not authenticated
 * Preserves the intended destination for post-login redirect
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authLoading = useSelector(selectAuthLoading);
  const location = useLocation();

  console.log('[DEBUG] ProtectedRoute - Rendering', {
    isAuthenticated,
    authLoading,
    location: location.pathname
  });

  // Show loading state while checking authentication
  if (authLoading === 'pending') {
    console.log('[DEBUG] ProtectedRoute - Showing loading state');
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#65676b'
      }}>
        Verifying authentication...
      </div>
    );
  }

  // Redirect to login if not authenticated, preserving the intended destination
  if (!isAuthenticated) {
    console.log('[DEBUG] ProtectedRoute - Redirecting to /login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render protected content if authenticated
  console.log('[DEBUG] ProtectedRoute - Rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;