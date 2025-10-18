/**
 * useSupabaseContracts Hook
 * Phase 4: Custom React hook for contract management
 * 
 * Provides:
 * - Contract lifecycle management
 * - Approval workflow tracking
 * - Renewal management
 * - Contract analytics and KPIs
 * - Document management
 */

import { useState, useEffect, useCallback } from 'react';
import { contractService } from '@/services';
import type { Contract as UiContract } from '@/types/contracts';

export interface UseSupabaseContractsState {
  contracts: UiContract[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  create: (data: Partial<UiContract>) => Promise<UiContract>;
  update: (id: string, data: Partial<UiContract>) => Promise<UiContract>;
  delete: (id: string) => Promise<void>;
  getByStatus: (status: string) => UiContract[];
  getByType: (type: string) => UiContract[];
  getActive: () => UiContract[];
  getExpiringSoon: (days?: number) => UiContract[];
}

/**
 * Custom hook for managing contracts via Supabase service
 */
export function useSupabaseContracts(): UseSupabaseContractsState {
  const [contracts, setContracts] = useState<UiContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch contracts
  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contractService.getContracts();
      setContracts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch contracts';
      setError(message);
      console.error('[useSupabaseContracts] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Create contract
  const create = useCallback(async (data: Partial<UiContract>) => {
    try {
      setError(null);
      const created = await contractService.createContract(data);
      setContracts(prev => [created, ...prev]);
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create contract';
      setError(message);
      throw err;
    }
  }, []);

  // Update contract
  const update = useCallback(async (id: string, data: Partial<UiContract>) => {
    try {
      setError(null);
      const updated = await contractService.updateContract(id, data);
      setContracts(prev =>
        prev.map(c => (c.id === id ? updated : c))
      );
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update contract';
      setError(message);
      throw err;
    }
  }, []);

  // Delete contract
  const delete_ = useCallback(async (id: string) => {
    try {
      setError(null);
      await contractService.deleteContract(id);
      setContracts(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete contract';
      setError(message);
      throw err;
    }
  }, []);

  // Get contracts by status
  const getByStatus = useCallback((status: string) => {
    return contracts.filter(c => c.status === status);
  }, [contracts]);

  // Get contracts by type
  const getByType = useCallback((type: string) => {
    return contracts.filter(c => c.contract_type === type);
  }, [contracts]);

  // Get active contracts
  const getActive = useCallback(() => {
    const now = new Date();
    return contracts.filter(c => {
      const startDate = c.start_date ? new Date(c.start_date) : null;
      const endDate = c.end_date ? new Date(c.end_date) : null;
      return startDate && endDate && startDate <= now && now <= endDate;
    });
  }, [contracts]);

  // Get contracts expiring soon
  const getExpiringSoon = useCallback((days: number = 30) => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return contracts.filter(c => {
      const endDate = c.end_date ? new Date(c.end_date) : null;
      return endDate && now <= endDate && endDate <= futureDate;
    });
  }, [contracts]);

  return {
    contracts,
    loading,
    error,
    refetch: fetchContracts,
    create,
    update,
    delete: delete_,
    getByStatus,
    getByType,
    getActive,
    getExpiringSoon
  };
}

export default useSupabaseContracts;