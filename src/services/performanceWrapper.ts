/**
 * Performance Tracking Wrapper for Service Methods
 * Wraps async functions to automatically measure execution time
 */

import { performanceMonitor } from './performanceMonitoring';

/**
 * Wrap an async function with performance tracking
 * @param fn - The async function to wrap
 * @param operationName - Name of the operation for metrics
 * @returns Wrapped function with performance tracking
 */
export function withPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operationName: string
): T {
  return (async (...args: any[]) => {
    const endMeasure = performanceMonitor.startMeasure(operationName);

    try {
      const result = await fn(...args);
      return result;
    } finally {
      endMeasure();
    }
  }) as T;
}

/**
 * Wrap an object of async methods with performance tracking
 * @param obj - Object containing async methods
 * @param prefix - Prefix for operation names
 * @returns Object with all methods wrapped with performance tracking
 */
export function withPerformanceTrackingObject<T extends Record<string, (...args: any[]) => Promise<any>>>(
  obj: T,
  prefix: string
): T {
  const wrapped: any = {};

  Object.entries(obj).forEach(([key, method]) => {
    wrapped[key] = withPerformanceTracking(method as any, `${prefix}:${key}`);
  });

  return wrapped as T;
}

/**
 * Wrap synchronous function with performance tracking
 * @param fn - The sync function to wrap
 * @param operationName - Name of the operation for metrics
 * @returns Wrapped function with performance tracking
 */
export function withPerformanceTrackingSync<T extends (...args: any[]) => any>(
  fn: T,
  operationName: string
): T {
  return ((...args: any[]) => {
    const endMeasure = performanceMonitor.startMeasure(operationName);

    try {
      return fn(...args);
    } finally {
      endMeasure();
    }
  }) as T;
}