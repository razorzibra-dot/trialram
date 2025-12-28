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
import { productService } from '@/services/serviceFactory';
import { Product } from '@/types/masters';

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
    console.log('[useProductsDropdown] productService object:', productService);
    console.log('[useProductsDropdown] productService.getProducts:', typeof productService.getProducts);
    
    console.log('[useProductsDropdown] 🔍 CALLING productService.getProducts NOW...');
    
    // ✅ Use factory service - routes to Supabase or Mock based on VITE_API_MODE
    // ✅ Pass BOTH filters for maximum compatibility
    let response;
    try {
      response = await productService.getProducts({
        isActive: true,  // For Supabase is_active column
        status: 'active',  // For Supabase status enum column  
        page: 1,
        pageSize: 1000
      });
      console.log('[useProductsDropdown] ✅ getProducts RETURNED:', response);
    } catch (serviceError) {
      console.error('[useProductsDropdown] ❌ getProducts THREW ERROR:', serviceError);
      throw serviceError;
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
  return useQuery({
    queryKey: ['products', 'dropdown', 'active'],
    queryFn: fetchActiveProducts,
    staleTime: 0, // ⚠️ TEMP: Force fresh fetch every time for debugging
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    // ❌ REMOVED initialData - it was preventing queryFn from being called!
    refetchOnMount: true, // Force refetch when component mounts
    refetchOnWindowFocus: false,
    select: (products): ProductDropdownOption[] => {
      if (!Array.isArray(products)) {
        console.warn('[useProductsDropdown] Select received non-array:', typeof products);
        return [];
      }
      console.log('[useProductsDropdown] Transforming products to options, count:', products.length);
      return products.map(product => ({
        label: `${product.name}${product.sku ? ' • ' + product.sku : ''}`,
        value: product.id,
        product,
      }));
    },
  });
};
