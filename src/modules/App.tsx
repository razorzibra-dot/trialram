/**
 * New Modular App Component
 * Main application component using the new modular architecture
 */

import React, { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';
import { LoadingSpinner } from '@/modules/core/components/LoadingSpinner';
import { AuthProvider } from '@/contexts/AuthContext';
import { moduleRegistry, initializeModules } from './ModuleRegistry';
import { createModularRouter } from './routing/ModularRouter';
import { bootstrapApplication } from './bootstrap';
import type { Router } from '@remix-run/router';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const ModularApp: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [router, setRouter] = useState<Router | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Bootstrap application (registers all modules)
        await bootstrapApplication();
        
        // Initialize all modules
        await initializeModules();
        
        // Create router with module routes
        const modularRouter = createModularRouter();
        setRouter(modularRouter);
        
        setIsInitialized(true);
        console.log('Application initialized successfully');
      } catch (error) {
        console.error('Failed to initialize application:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      moduleRegistry.cleanupAll().catch(console.error);
    };
  }, []);

  // Show loading while initializing
  if (!isInitialized) {
    if (initError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Failed to Initialize Application
            </h1>
            <p className="text-gray-600 mb-4">{initError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner 
          size="lg" 
          text="Initializing application..." 
        />
      </div>
    );
  }

  if (!router) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner 
          size="lg" 
          text="Setting up routing..." 
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50">
          <RouterProvider router={router} />
        </div>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default ModularApp;
