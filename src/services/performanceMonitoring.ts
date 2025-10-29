/**
 * Performance Monitoring Module for Sales Service
 * Tracks operation duration, identifies slow operations, and generates metrics
 */

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceStats {
  count: number;
  average: number;
  min: number;
  max: number;
  p95: number;
  p99: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000;
  private readonly slowOperationThreshold = 500; // milliseconds

  /**
   * Start measuring an operation
   * @param name - Name of the operation to measure
   * @returns Function to call when operation completes
   */
  startMeasure(name: string): () => void {
    const startTime = performance.now();
    const startMark = `${name}_start_${Date.now()}`;
    performance.mark(startMark);

    return () => {
      const endTime = performance.now();
      const endMark = `${name}_end_${Date.now()}`;
      performance.mark(endMark);

      const duration = endTime - startTime;

      try {
        performance.measure(name, startMark, endMark);
      } catch {
        // Ignore if measure fails (can happen if marks are not unique)
      }

      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
      });
    };
  }

  /**
   * Record a performance metric
   * @param metric - The metric to record
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep array size manageable
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations
    if (metric.duration > this.slowOperationThreshold) {
      console.warn(
        `[Performance Warning] Slow operation: ${metric.name} took ${metric.duration.toFixed(2)}ms`
      );
    }
  }

  /**
   * Get all metrics or filtered by name
   * @param filterName - Optional name filter (substring match)
   * @returns Array of metrics
   */
  getMetrics(filterName?: string): PerformanceMetric[] {
    if (!filterName) return this.metrics;
    return this.metrics.filter((m) => m.name.includes(filterName));
  }

  /**
   * Get statistics for metrics matching a name pattern
   * @param filterName - Optional name filter
   * @returns Performance statistics or null if no metrics found
   */
  getStats(filterName?: string): PerformanceStats | null {
    const metrics = this.getMetrics(filterName);
    if (metrics.length === 0) return null;

    const durations = metrics.map((m) => m.duration);
    const sum = durations.reduce((a, b) => a + b, 0);

    return {
      count: metrics.length,
      average: sum / metrics.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      p95: this.calculatePercentile(durations, 95),
      p99: this.calculatePercentile(durations, 99),
    };
  }

  /**
   * Calculate percentile value from array of numbers
   * @param arr - Array of numbers
   * @param percentile - Percentile to calculate (0-100)
   * @returns Percentile value
   */
  private calculatePercentile(arr: number[], percentile: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return Math.max(0, sorted[index] || 0);
  }

  /**
   * Clear all recorded metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get summary of all metrics grouped by operation name
   */
  getSummary(): Record<string, PerformanceStats | null> {
    const operationNames = new Set(this.metrics.map((m) => m.name));
    const summary: Record<string, PerformanceStats | null> = {};

    operationNames.forEach((name) => {
      summary[name] = this.getStats(name);
    });

    return summary;
  }

  /**
   * Log summary of all metrics to console
   */
  logSummary(): void {
    const summary = this.getSummary();
    console.group('[Performance Summary]');
    Object.entries(summary).forEach(([name, stats]) => {
      if (stats) {
        console.log(
          `${name}: avg=${stats.average.toFixed(2)}ms, min=${stats.min.toFixed(2)}ms, max=${stats.max.toFixed(2)}ms, p95=${stats.p95.toFixed(2)}ms, p99=${stats.p99.toFixed(2)}ms (n=${stats.count})`
        );
      }
    });
    console.groupEnd();
  }
}

export const performanceMonitor = new PerformanceMonitor();