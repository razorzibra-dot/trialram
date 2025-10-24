import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  requiredPermission 
}) => {
  const { isAuthenticated, isLoading, hasRole, hasPermission } = useAuth();
  const location = useLocation();
  const [shouldRender, setShouldRender] = useState(false);
  const [authStateSettled, setAuthStateSettled] = useState(false);

  // Critical: Track when auth state has settled after changes
  // This prevents redirect loops during logout transitions
  useEffect(() => {
    // Only mark as settled when:
    // 1. We're not loading OR
    // 2. We've waited enough time for state updates to process
    if (!isLoading) {
      setAuthStateSettled(true);
      console.log('[ProtectedRoute] Auth state settled');
    } else {
      // If loading, reset the settled flag and wait for loading to complete
      setAuthStateSettled(false);
    }
  }, [isLoading]);

  // Ensure we properly re-evaluate auth state after changes
  useEffect(() => {
    // Add a small delay to ensure auth state updates are processed by React
    // This is critical for logout to work properly and prevent redirect loops
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, 10);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, authStateSettled]);

  // Loading state - show skeleton while auth is being verified
  // During logout, isLoading will be true temporarily to prevent redirect loops
  if (isLoading) {
    console.log('[ProtectedRoute] Auth loading, showing skeleton');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  // Wait for component to be ready to render
  if (!shouldRender) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login (only after auth state has settled)
  if (!isAuthenticated && authStateSettled) {
    console.log('[ProtectedRoute] User not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (requiredRole && !hasRole(requiredRole)) {
    console.log('[ProtectedRoute] User does not have required role:', requiredRole);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Permission check
  if (requiredPermission && !hasPermission(requiredPermission)) {
    console.log('[ProtectedRoute] User does not have required permission:', requiredPermission);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;