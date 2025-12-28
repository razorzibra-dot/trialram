// NOTE: Product hooks moved to masters module
// Use @/modules/features/masters/hooks/useProducts instead
// This was done to consolidate product management and avoid duplication

export {
  useCategories,
  useCategory,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  categoriesKeys,
} from './useCategories';

export {
  useInventory,
  useLowStockProducts,
  useOutOfStockProducts,
  useUpdateStock,
  useBulkUpdateStock,
  useInventoryStats,
  inventoryKeys,
} from './useInventory';

export {
  useProductVariants,
  useProductChildren,
  useProductParent,
  useProductHierarchy,
  useRootProducts,
  productVariantKeys,
} from './useProductVariants';