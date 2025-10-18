/**
 * useSupabaseSales Hook
 * Phase 4: Custom React hook for sales data management
 * 
 * Provides:
 * - Real-time sales pipeline data
 * - Deal management with stages and probabilities
 * - Sales analytics and forecasting
 * - Loading/error state management
 */

import { useState, useEffect, useCallback } from 'react';
import { salesService } from '@/services';
import type { Sale } from '@/types/crm';

export interface UseSupabaseSalesState {
  sales: Sale[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  create: (data: Partial<Sale>) => Promise<Sale>;
  update: (id: string, data: Partial<Sale>) => Promise<Sale>;
  delete: (id: string) => Promise<void>;
  getByStage: (stage: string) => Sale[];
  getByCustomer: (customerId: string) => Sale[];
}

/**
 * Custom hook for managing sales via Supabase service
 */
export function useSupabaseSales(): UseSupabaseSalesState {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sales
  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await salesService.getSales();
      setSales(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sales';
      setError(message);
      console.error('[useSupabaseSales] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Create sale
  const create = useCallback(async (data: Partial<Sale>) => {
    try {
      setError(null);
      const created = await salesService.createSale(data);
      setSales(prev => [created, ...prev]);
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create sale';
      setError(message);
      throw err;
    }
  }, []);

  // Update sale
  const update = useCallback(async (id: string, data: Partial<Sale>) => {
    try {
      setError(null);
      const updated = await salesService.updateSale(id, data);
      setSales(prev =>
        prev.map(s => (s.id === id ? updated : s))
      );
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update sale';
      setError(message);
      throw err;
    }
  }, []);

  // Delete sale
  const delete_ = useCallback(async (id: string) => {
    try {
      setError(null);
      await salesService.deleteSale(id);
      setSales(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete sale';
      setError(message);
      throw err;
    }
  }, []);

  // Get sales by stage
  const getByStage = useCallback((stage: string) => {
    return sales.filter(s => s.stage === stage);
  }, [sales]);

  // Get sales by customer
  const getByCustomer = useCallback((customerId: string) => {
    return sales.filter(s => s.customer_id === customerId);
  }, [sales]);

  return {
    sales,
    loading,
    error,
    refetch: fetchSales,
    create,
    update,
    delete: delete_,
    getByStage,
    getByCustomer
  };
}

export default useSupabaseSales;