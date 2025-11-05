/**
 * Performance Monitoring Types
 * Centralized types for performance metrics and monitoring
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string; // ms, bytes, count, etc.
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number; // ms
  minResponseTime: number;
  maxResponseTime: number;
  errorCount: number;
  errorRate: number; // percentage
  p95ResponseTime: number;
  p99ResponseTime: number;
  timestamp: Date;
}