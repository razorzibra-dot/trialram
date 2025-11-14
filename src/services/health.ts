/**
 * Service Health Check System
 * 
 * Verifies service factory and backend availability at startup and runtime.
 * Provides diagnostics for troubleshooting and status reporting.
 */

import { serviceFactory } from './serviceFactory';

/**
 * Health check result for a single service
 */
export interface ServiceHealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unavailable';
  latency?: number;
  error?: string;
}

/**
 * Overall system health report
 */
export interface HealthCheckReport {
  timestamp: string;
  overall: 'healthy' | 'degraded' | 'unavailable';
  apiMode: string;
  servicesChecked: number;
  healthyServices: number;
  degradedServices: number;
  unavailableServices: number;
  services: ServiceHealthCheck[];
  supabaseConnected: boolean;
  environmentOk: boolean;
  errors: string[];
}

/**
 * Service Health Checker
 * 
 * Performs comprehensive health checks on the service factory and all services.
 * Can be called at application startup or periodically during runtime.
 */
export class ServiceHealthChecker {
  /**
   * Run a quick health check on critical services
   * Useful for startup verification
   * @returns Health check report
   */
  static async quickCheck(): Promise<HealthCheckReport> {
    const report: HealthCheckReport = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      apiMode: serviceFactory.getApiMode(),
      servicesChecked: 0,
      healthyServices: 0,
      degradedServices: 0,
      unavailableServices: 0,
      services: [],
      supabaseConnected: false,
      environmentOk: true,
      errors: [],
    };

    try {
      // Check factory initialization
      if (!serviceFactory.getApiMode()) {
        report.errors.push('Service factory not properly initialized');
        report.overall = 'unavailable';
        return report;
      }

      // Check environment
      report.supabaseConnected = serviceFactory.isUsingSupabase();
      
      if (serviceFactory.isUsingSupabase() && !import.meta.env.VITE_SUPABASE_URL) {
        report.environmentOk = false;
        report.errors.push('Supabase URL not configured');
      }

      // Check critical services
      const criticalServices = ['auth', 'tenant', 'rbac', 'user'];
      const checks = await this.checkServices(criticalServices);
      
      report.services = checks;
      report.servicesChecked = checks.length;
      report.healthyServices = checks.filter(s => s.status === 'healthy').length;
      report.degradedServices = checks.filter(s => s.status === 'degraded').length;
      report.unavailableServices = checks.filter(s => s.status === 'unavailable').length;

      // Determine overall status
      if (report.unavailableServices > 0) {
        report.overall = 'unavailable';
      } else if (report.degradedServices > 0) {
        report.overall = 'degraded';
      }

      return report;
    } catch (error) {
      report.overall = 'unavailable';
      report.errors.push(`Health check failed: ${String(error)}`);
      return report;
    }
  }

  /**
   * Run a comprehensive health check on all services
   * Useful for debugging and detailed diagnostics
   * @returns Detailed health check report
   */
  static async fullCheck(): Promise<HealthCheckReport> {
    const report: HealthCheckReport = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      apiMode: serviceFactory.getApiMode(),
      servicesChecked: 0,
      healthyServices: 0,
      degradedServices: 0,
      unavailableServices: 0,
      services: [],
      supabaseConnected: false,
      environmentOk: true,
      errors: [],
    };

    try {
      // Check factory
      const availableServices = serviceFactory.listAvailableServices();
      report.servicesChecked = availableServices.length;

      // Check all services
      const allServices = availableServices.map(s => s.name);
      const checks = await this.checkServices(allServices);
      
      report.services = checks;
      report.healthyServices = checks.filter(s => s.status === 'healthy').length;
      report.degradedServices = checks.filter(s => s.status === 'degraded').length;
      report.unavailableServices = checks.filter(s => s.status === 'unavailable').length;

      // Environment checks
      report.supabaseConnected = serviceFactory.isUsingSupabase();
      if (serviceFactory.isUsingSupabase() && !import.meta.env.VITE_SUPABASE_URL) {
        report.environmentOk = false;
        report.errors.push('Supabase URL not configured');
      }

      // Determine overall status
      if (report.unavailableServices > 0) {
        report.overall = 'unavailable';
      } else if (report.degradedServices > 0) {
        report.overall = 'degraded';
      }

      return report;
    } catch (error) {
      report.overall = 'unavailable';
      report.errors.push(`Health check failed: ${String(error)}`);
      return report;
    }
  }

  /**
   * Check health of specific services
   * @param serviceNames Array of service names to check
   * @returns Array of health check results
   */
  private static async checkServices(serviceNames: string[]): Promise<ServiceHealthCheck[]> {
    const checks: ServiceHealthCheck[] = [];

    for (const serviceName of serviceNames) {
      const check: ServiceHealthCheck = {
        name: serviceName,
        status: 'healthy',
      };

      try {
        const startTime = performance.now();
        
        // Try to access service
        const service = serviceFactory.getService(serviceName);
        if (!service) {
          check.status = 'unavailable';
          check.error = 'Service not found';
        } else {
          check.latency = Math.round((performance.now() - startTime) * 1000) / 1000;
          
          // Consider latency >100ms as degraded
          if (check.latency > 100) {
            check.status = 'degraded';
            check.error = 'High latency';
          }
        }
      } catch (error) {
        check.status = 'unavailable';
        check.error = String(error);
      }

      checks.push(check);
    }

    return checks;
  }

  /**
   * Format health check report for console output
   * @param report Health check report
   * @returns Formatted string
   */
  static formatReport(report: HealthCheckReport): string {
    const lines = [
      `\n${'='.repeat(60)}`,
      `Service Health Check Report`,
      `${'='.repeat(60)}`,
      `Timestamp: ${report.timestamp}`,
      `API Mode: ${report.apiMode}`,
      `Overall Status: ${report.overall.toUpperCase()}`,
      `Supabase Connected: ${report.supabaseConnected ? '✅ Yes' : '❌ No'}`,
      `Environment OK: ${report.environmentOk ? '✅ Yes' : '❌ No'}`,
      ``,
      `Services: ${report.healthyServices}/${report.servicesChecked} healthy`,
      `  Healthy: ${report.healthyServices}`,
      `  Degraded: ${report.degradedServices}`,
      `  Unavailable: ${report.unavailableServices}`,
      ``,
    ];

    if (report.services.length > 0) {
      lines.push(`Service Details:`);
      report.services.forEach(service => {
        const status = service.status === 'healthy' ? '✅' : service.status === 'degraded' ? '⚠️' : '❌';
        const latency = service.latency ? ` (${service.latency}ms)` : '';
        const error = service.error ? ` - ${service.error}` : '';
        lines.push(`  ${status} ${service.name}${latency}${error}`);
      });
      lines.push('');
    }

    if (report.errors.length > 0) {
      lines.push(`Errors:`);
      report.errors.forEach(error => {
        lines.push(`  • ${error}`);
      });
      lines.push('');
    }

    lines.push(`${'='.repeat(60)}\n`);

    return lines.join('\n');
  }

  /**
   * Get health status as a simple boolean (for quick checks)
   * @returns true if system is healthy, false otherwise
   */
  static async isHealthy(): Promise<boolean> {
    const report = await this.quickCheck();
    return report.overall === 'healthy' && report.errors.length === 0;
  }

  /**
   * Get backend information
   * @returns Backend configuration and status
   */
  static getBackendInfo() {
    return {
      ...serviceFactory.getBackendInfo(),
      isRealBackend: serviceFactory.isUsingRealBackend(),
      isSupabase: serviceFactory.isUsingSupabase(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Verify service availability
   * @param serviceName Name of service to verify
   * @returns true if service is available and healthy
   */
  static async verifyService(serviceName: string): Promise<boolean> {
    try {
      const service = serviceFactory.getService(serviceName);
      return service !== undefined && service !== null;
    } catch {
      return false;
    }
  }
}

/**
 * Initialize health checks at application startup
 * Call this in your main app initialization
 * @returns Promise that resolves when health checks complete
 */
export async function initializeHealthChecks(): Promise<void> {
  console.log('🏥 Initializing service health checks...');

  const report = await ServiceHealthChecker.quickCheck();
  console.log(ServiceHealthChecker.formatReport(report));

  if (report.overall !== 'healthy') {
    console.warn('⚠️ Service health issues detected. See report above.');
  } else {
    console.log('✅ All services healthy!');
  }
}

/**
 * Export health check utilities
 */
export const HealthCheck = {
  quickCheck: () => ServiceHealthChecker.quickCheck(),
  fullCheck: () => ServiceHealthChecker.fullCheck(),
  isHealthy: () => ServiceHealthChecker.isHealthy(),
  verify: (serviceName: string) => ServiceHealthChecker.verifyService(serviceName),
  getBackendInfo: () => ServiceHealthChecker.getBackendInfo(),
  format: (report: HealthCheckReport) => ServiceHealthChecker.formatReport(report),
};
