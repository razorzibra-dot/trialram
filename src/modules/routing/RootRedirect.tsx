/**
 * Root Redirect Component
 * Intelligently redirects authenticated users based on their role
 * - Super admins: redirected to /super-admin/dashboard
 * - Regular users: redirected to /tenant/dashboard
 * - Unauthenticated users: stay at login
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export const RootRedirect: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait a tick to ensure auth state is fully settled
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  // Still loading - show skeleton
  if (isLoading || !isReady) {
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

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated - redirect based on role
  if (user) {
    // ⭐ CRITICAL: Check if user is a super admin
    // Super admins have isSuperAdmin=true and tenantId=null
    if (user.isSuperAdmin === true && user.tenantId === null) {
      console.log('[RootRedirect] Super admin detected, redirecting to super-admin dashboard');
      return <Navigate to="/super-admin/dashboard" replace />;
    }

    // Regular tenant users
    console.log('[RootRedirect] Regular user detected, redirecting to tenant dashboard');
    return <Navigate to="/tenant/dashboard" replace />;
  }

  // Fallback (shouldn't reach here)
  return <Navigate to="/login" replace />;
};

export default RootRedirect;