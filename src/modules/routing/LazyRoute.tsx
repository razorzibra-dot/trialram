/**
 * Lazy Route Component
 * Handles lazy loading of route components with loading states
 */

import React, { Suspense } from 'react';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';
import { LoadingSpinner } from '@/modules/core/components/LoadingSpinner';

interface LazyRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

export const LazyRoute: React.FC<LazyRouteProps> = ({
  children,
  fallback,
  errorFallback,
}) => {
  const defaultFallback = (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" text="Loading page..." />
    </div>
  );

  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

// HOC for creating lazy routes
export function createLazyRoute<P extends object>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  options?: {
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
  }
) {
  const LazyComponent = React.lazy(importFn);
  
  const WrappedComponent = (props: P) => (
    <LazyRoute 
      fallback={options?.fallback}
      errorFallback={options?.errorFallback}
    >
      <LazyComponent {...props} />
    </LazyRoute>
  );

  WrappedComponent.displayName = `LazyRoute(${LazyComponent.displayName || 'Component'})`;
  
  return WrappedComponent;
}

// Preload function for route components
export function preloadRoute(importFn: () => Promise<any>): void {
  // Preload the component
  importFn().catch(error => {
    console.warn('Failed to preload route component:', error);
  });
}

// Route preloader hook
export function useRoutePreloader() {
  const preloadRoutes = React.useCallback((routes: Array<() => Promise<any>>) => {
    routes.forEach(route => {
      preloadRoute(route);
    });
  }, []);

  return { preloadRoutes };
}
