/**
 * Core Module Exports
 * Central export point for all core functionality
 */

// Store exports
export * from './store';
export { default as useStore } from './store';

// Service exports
export * from './services/ServiceContainer';
export * from './services/BaseService';

// Component exports
export * from './components/ErrorBoundary';
export * from './components/LoadingSpinner';

// Hook exports
export * from './hooks/useQuery';

// Type exports
export * from './types';

// Utility exports
export * from './utils';

// Constants
export const APP_NAME = 'CRM Portal';
export const APP_VERSION = '2.0.0';
export const API_VERSION = 'v1';

// Configuration
export const config = {
  app: {
    name: APP_NAME,
    version: APP_VERSION,
  },
  api: {
    version: API_VERSION,
    timeout: 30000,
    retries: 3,
  },
  cache: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
  },
  ui: {
    pageSize: 20,
    debounceDelay: 300,
    animationDuration: 200,
  },
} as const;
