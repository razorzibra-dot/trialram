/**
 * useRoleRequests Hook
 * Custom hook for managing role request data fetching and operations
 */

import { useState, useCallback, useEffect } from 'react';
import { roleRequestService } from '../services/roleRequestService';
import { RoleRequest, RoleRequestFilters, RoleRequestStats } from '../types/roleRequest';

interface UseRoleRequestsOptions {
  filters?: RoleRequestFilters;
  autoFetch?: boolean;
}

export const useRoleRequests = (options: UseRoleRequestsOptions = {}) => {
  const { filters, autoFetch = true } = options;

  const [data, setData] = useState<RoleRequest[]>([]);
  const [stats, setStats] = useState<RoleRequestStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await roleRequestService.getRoleRequests(filters);
      setData(response.data);
      setStats(response.stats);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch role requests');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, [fetch, autoFetch]);

  const approve = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      await roleRequestService.approveRoleRequest(id);
      await fetch();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to approve request');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetch]);

  const reject = useCallback(async (id: string, reason: string) => {
    try {
      setIsLoading(true);
      await roleRequestService.rejectRoleRequest(id, reason);
      await fetch();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to reject request');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetch]);

  return {
    data,
    stats,
    isLoading,
    error,
    fetch,
    approve,
    reject,
  };
};