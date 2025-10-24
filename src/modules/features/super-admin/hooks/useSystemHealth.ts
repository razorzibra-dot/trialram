/**
 * useSystemHealth Hook
 * Custom hook for managing system health monitoring
 */

import { useState, useCallback, useEffect } from 'react';
import { healthService } from '../services/healthService';
import { ServiceHealth, SystemMetrics, IncidentLog } from '../types/health';

interface UseSystemHealthOptions {
  autoFetch?: boolean;
  refreshInterval?: number;
}

export const useSystemHealth = (options: UseSystemHealthOptions = {}) => {
  const { autoFetch = true, refreshInterval = 30000 } = options;

  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    systemLoad: 0,
    memoryUsage: 0,
    databaseStatus: 'unknown',
    operationalServices: 0,
    totalServices: 0,
  });
  const [incidents, setIncidents] = useState<IncidentLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await healthService.getSystemHealth();
      setServices(data.services);
      setMetrics(data.metrics);
      setIncidents(data.incidents);
      setLastCheck(data.lastCheck);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch system health');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, [fetch, autoFetch]);

  useEffect(() => {
    const interval = setInterval(fetch, refreshInterval);
    return () => clearInterval(interval);
  }, [fetch, refreshInterval]);

  const getServiceHealth = useCallback(async (serviceId: string) => {
    try {
      return await healthService.getServiceHealth(serviceId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch service health');
      setError(error);
      throw error;
    }
  }, []);

  const runHealthCheck = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await healthService.runHealthCheck();
      setServices(data.services);
      setMetrics(data.metrics);
      setIncidents(data.incidents);
      setLastCheck(data.lastCheck);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Health check failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    services,
    metrics,
    incidents,
    isLoading,
    error,
    lastCheck,
    fetch,
    getServiceHealth,
    runHealthCheck,
  };
};