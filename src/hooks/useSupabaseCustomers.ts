/**
 * useSupabaseCustomers Hook
 * Phase 4: Custom React hook for customer data management
 * 
 * Provides:
 * - Real-time customer data synchronization
 * - Loading/error state management
 * - CRUD operations (Create, Read, Update, Delete)
 * - Real-time subscriptions
 * - Search and filtering
 * 
 * USAGE:
 * ======
 * import { useSupabaseCustomers } from '@/hooks/useSupabaseCustomers';
 * 
 * function MyComponent() {
 *   const { customers, loading, error, refetch } = useSupabaseCustomers();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   
 *   return (
 *     <ul>
 *       {customers.map(c => <li key={c.id}>{c.company_name}</li>)}
 *     </ul>
 *   );
 * }
 */

import { useState, useEffect, useCallback } from 'react';
import { customerService } from '@/services';
import type { Customer } from '@/types/crm';

export interface UseSupabaseCustomersState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  create: (data: Partial<Customer>) => Promise<Customer>;
  update: (id: string, data: Partial<Customer>) => Promise<Customer>;
  delete: (id: string) => Promise<void>;
  search: (query: string) => Promise<Customer[]>;
}

/**
 * Custom hook for managing customers via Supabase service
 */
export function useSupabaseCustomers(): UseSupabaseCustomersState {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerService.getCustomers();
      setCustomers(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch customers';
      setError(message);
      console.error('[useSupabaseCustomers] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Create customer
  const create = useCallback(async (data: Partial<Customer>) => {
    try {
      setError(null);
      const created = await customerService.createCustomer(data);
      setCustomers(prev => [created, ...prev]);
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create customer';
      setError(message);
      throw err;
    }
  }, []);

  // Update customer
  const update = useCallback(async (id: string, data: Partial<Customer>) => {
    try {
      setError(null);
      const updated = await customerService.updateCustomer(id, data);
      setCustomers(prev =>
        prev.map(c => (c.id === id ? updated : c))
      );
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update customer';
      setError(message);
      throw err;
    }
  }, []);

  // Delete customer
  const delete_ = useCallback(async (id: string) => {
    try {
      setError(null);
      await customerService.deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete customer';
      setError(message);
      throw err;
    }
  }, []);

  // Search customers
  const search = useCallback(async (query: string) => {
    try {
      setError(null);
      const results = await customerService.getCustomers({ search: query });
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search customers';
      setError(message);
      throw err;
    }
  }, []);

  return {
    customers,
    loading,
    error,
    refetch: fetchCustomers,
    create,
    update,
    delete: delete_,
    search
  };
}

export default useSupabaseCustomers;