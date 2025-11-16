/**
 * Service Layer Exports
 * Unified service interface following the service factory architecture
 */

// Export all services from the service factory
export * from './serviceFactory';

// Export service factory instance for advanced usage
export { serviceFactory } from './serviceFactory';

// Export API mode type
export type { ApiMode } from './serviceFactory';