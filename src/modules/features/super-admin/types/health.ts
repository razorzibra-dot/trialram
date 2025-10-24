/**
 * System Health Types
 * Type definitions for system health monitoring
 */

export type ServiceStatus = 'operational' | 'degraded' | 'down';
export type IncidentSeverity = 'critical' | 'warning' | 'info';

export interface ServiceHealth {
  id: string;
  name: string;
  status: ServiceStatus;
  uptime: number; // percentage
  responseTime: number; // milliseconds
  lastChecked: string;
  details?: string;
}

export interface SystemMetrics {
  systemLoad: number; // percentage
  memoryUsage: number; // percentage
  databaseStatus: 'connected' | 'disconnected' | 'unknown';
  operationalServices: number;
  totalServices: number;
}

export interface IncidentLog {
  id: string;
  severity: IncidentSeverity;
  title: string;
  description: string;
  timestamp: string;
  resolved?: boolean;
  resolvedAt?: string;
  resolution?: string;
}

export interface HealthCheckResult {
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface SystemHealthResponse {
  services: ServiceHealth[];
  metrics: SystemMetrics;
  incidents: IncidentLog[];
  lastCheck: string;
  nextCheck: string;
}