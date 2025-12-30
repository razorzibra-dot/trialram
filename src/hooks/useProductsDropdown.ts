/**
 * Shared hook for product selection dropdowns
 * Provides consistent product list with React Query caching across all modules
 * 
 * Usage pattern (similar to useActiveUsers):
 * - Fetches active products for dropdown selection
 * - 5-minute cache to reduce database load
 * - Tenant-filtered via RLS
 * - Returns formatted options ready for Select component
 * 
 * @example
 * ```tsx
 * import { useProductsDropdown } from '@/hooks/useProductsDropdown';
 * 
 * const { data: productOptions = [], isLoading } = useProductsDropdown();
 * 
 * <Select
 *   options={productOptions}
 *   loading={isLoading}
 *   placeholder="Select product"
 * />
 * ```
 */

import { useQuery } from '@tanstack/react-query';
import { serviceFactory } from '@/services/serviceFactory';
import { Product } from '@/types/masters';
import { useOptionalModuleData } from '@/contexts/ModuleDataContext';
import { useCurrentTenant } from '@/hooks/useCurrentTenant';

/**
 * Product dropdown option format
 * Matches Ant Design Select option structure
 */
export interface ProductDropdownOption {
  label: string;
  value: string;
  product: Product; // Full product object for additional rendering
}

/**
 * Fetch active products from the product service
 * Uses factory service pattern to route to correct backend (Supabase/Mock)
 * Filters for active status only
 * @returns Array of active products
 */
async function fetchActiveProducts(): Promise<Product[]> {
  try {
    console.log('[useProductsDropdown] ⚡ Fetching active products via factory service...');
    console.log('[useProductsDropdown] API Mode:', import.meta.env.VITE_API_MODE);
    const svc = serviceFactory.getService('product') as any;

    // Use findMany/getAll first; fallback to getProducts if present
    let response;
    if (typeof svc.findMany === 'function') {
      response = await svc.findMany({ status: 'active', isActive: true, pageSize: 1000 });
    } else if (typeof svc.getAll === 'function') {
      response = await svc.getAll({ status: 'active', isActive: true, pageSize: 1000 });
    } else if (typeof svc.getProducts === 'function') {
      response = await svc.getProducts({ status: 'active', isActive: true, page: 1, pageSize: 1000 });
    } else {
      response = [];
    }

    console.log('[useProductsDropdown] ✅ Response received:', {
      isArray: Array.isArray(response),
      hasData: response && typeof response === 'object' && 'data' in response,
      responseType: typeof response,
      dataLength: Array.isArray(response) ? response.length : response?.data?.length
    });

    // ✅ Support both array responses (Supabase) and paginated { data } wrappers (Mock)
    const productsArray = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : [];

    console.log('[useProductsDropdown] 📦 Products extracted:', {
      count: productsArray.length,
      sample: productsArray[0] ? {
        id: productsArray[0].id,
        name: productsArray[0].name,
        sku: productsArray[0].sku,
        status: productsArray[0].status,
        tenant_id: productsArray[0].tenant_id
      } : 'NO PRODUCTS FOUND'
    });

    if (productsArray.length === 0) {
      console.warn('[useProductsDropdown] ⚠️ NO PRODUCTS FOUND - Check:');
      console.warn('  1. Database has products for your tenant');
      console.warn('  2. RLS policies allow access');
      console.warn('  3. Tenant context is initialized');
    }

    return productsArray as Product[];
  } catch (error) {
    console.error('[useProductsDropdown] ❌ ERROR CAUGHT:', error);
    console.error('[useProductsDropdown] ❌ Error name:', error?.name);
    console.error('[useProductsDropdown] ❌ Error message:', error?.message);
    console.error('[useProductsDropdown] ❌ Error stack:', error?.stack);
    console.error('[useProductsDropdown] ❌ Full error object:', JSON.stringify(error, null, 2));
    
    // Check if it's a tenant context error
    if (error?.message?.includes('tenant') || error?.message?.includes('Unauthorized')) {
      console.error('[useProductsDropdown] ❌ TENANT CONTEXT ERROR - multiTenantService.getCurrentTenant() returned null!');
      console.error('[useProductsDropdown] ❌ This means your session is not initialized properly.');
    }
    
    return []; // Return empty array on error to prevent undefined
  }
}

/**
 * Fetch active products for dropdown selection
 * 
 * Features:
 * - React Query caching (5 minutes)
 * - Tenant isolation via RLS
 * - Active products only
 * - Formatted for Ant Design Select
 * - Uses factory service pattern (routes to Supabase/Mock)
 * 
 * @returns React Query result with productOptions array
 */
export const useProductsDropdown = () => {
  const moduleCtx = useOptionalModuleData();
  const currentTenant = useCurrentTenant();

  const preloadedProducts = Array.isArray(moduleCtx?.data?.moduleData?.products)
    ? (moduleCtx?.data?.moduleData?.products as Product[])
    : Array.isArray((moduleCtx?.data?.moduleData as any)?.products?.data)
    ? ((moduleCtx?.data?.moduleData as any).products.data as Product[])
    : undefined;

  const enabled = !!currentTenant?.id && !preloadedProducts;

  return useQuery({
    queryKey: ['products', 'dropdown', 'active', currentTenant?.id || 'none'],
    queryFn: fetchActiveProducts,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled,
    initialData: preloadedProducts,
    select: (products): ProductDropdownOption[] => {
      if (!Array.isArray(products)) {
        return [];
      }
      return products
        .filter(p => (p as any).status === 'active' || (p as any).isActive !== false)
        .map(product => ({
          label: `${product.name}${(product as any).sku ? ' • ' + (product as any).sku : ''}`,
          value: product.id,
          product,
        }));
    },
  });
};
