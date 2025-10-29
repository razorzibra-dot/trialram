import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Mock Service Worker server for Node.js test environment
 * Intercepts fetch/axios calls and returns mock responses based on handlers
 */
export const server = setupServer(...handlers);