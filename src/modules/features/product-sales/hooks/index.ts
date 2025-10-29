/**
 * Product Sales Hooks Exports
 * Central export point for all custom hooks
 */

// Query hooks (fetching data)
export { useProductSales, useProductSalesByCustomer, productSalesKeys } from './useProductSales';
export { useProductSale, useProductSaleWithContract } from './useProductSale';

// Mutation hooks (creating, updating, deleting)
export { useCreateProductSale, useCreateProductSaleWithContract } from './useCreateProductSale';
export { useUpdateProductSale, useBulkUpdateProductSales } from './useUpdateProductSale';
export { useDeleteProductSale, useBulkDeleteProductSales } from './useDeleteProductSale';

// Filter management hooks
export { useProductSalesFilters, DEFAULT_PRESETS } from './useProductSalesFilters';
export type { FilterPreset } from './useProductSalesFilters';

// Form management hooks
export { useProductSalesForm, useProductSalesFormValidation } from './useProductSalesForm';
export type { FormMode } from './useProductSalesForm';

// Analytics hooks
export {
  useProductSalesAnalytics,
  useTopProductSales,
  useTopCustomerSales,
  useSalesRevenueTrend,
  useExpiringWarranties,
  useSalesSummaryStats,
  useRenewalOpportunities,
} from './useProductSalesAnalytics';

// Workflow hooks
export { useGenerateContractFromSale } from './useGenerateContractFromSale';
export { useGenerateInvoice } from './useGenerateInvoice';
export { useInvoiceEmail } from './useInvoiceEmail';

// Bulk operations hooks
export { useBulkOperations } from './useBulkOperations';