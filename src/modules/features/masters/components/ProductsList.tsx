/**
 * Products List Component
 * Displays products in a data table with filtering and actions
 */

import React, { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Edit, 
  Trash2, 
  Eye, 
  DollarSign, 
  Tag,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable } from '@/modules/shared/components/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import { Product, ProductFilters } from '@/types/masters';
import { 
  useProducts, 
  useDeleteProduct, 
  useUpdateProductStatus,
  useUpdateProductStock,
  useBulkProductOperations,
  useExportProducts 
} from '../hooks/useProducts';

interface ProductsListProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  onEdit?: (product: Product) => void;
  onView?: (product: Product) => void;
}

export const ProductsList: React.FC<ProductsListProps> = ({
  filters,
  onFiltersChange,
  onEdit,
  onView,
}) => {
  const { hasPermission } = useAuth();
  const [selectedRows, setSelectedRows] = useState<Product[]>([]);

  // Queries and mutations
  const { data: productsData, isLoading } = useProducts(filters);
  const deleteProduct = useDeleteProduct();
  const updateStatus = useUpdateProductStatus();
  const updateStock = useUpdateProductStock();
  const { bulkUpdate, bulkDelete } = useBulkProductOperations();
  const exportProducts = useExportProducts();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'discontinued':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatus = (product: Product) => {
    const stock = product.stock_quantity || 0;
    const reorderLevel = product.reorder_level || 0;
    
    if (stock === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    } else if (stock <= reorderLevel) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    } else {
      return { label: 'In Stock', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleDelete = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      await deleteProduct.mutateAsync(product.id);
    }
  };

  const handleStatusChange = async (product: Product, newStatus: string) => {
    await updateStatus.mutateAsync({ id: product.id, status: newStatus });
  };

  const handleStockUpdate = async (product: Product, newStock: number) => {
    await updateStock.mutateAsync({ id: product.id, quantity: newStock });
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedRows.length} products?`)) {
      const ids = selectedRows.map(product => product.id);
      await bulkDelete.mutateAsync(ids);
      setSelectedRows([]);
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedRows.length === 0) return;
    
    const ids = selectedRows.map(product => product.id);
    await bulkUpdate.mutateAsync({ ids, updates: { status } });
    setSelectedRows([]);
  };

  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    await exportProducts.mutateAsync(format);
  };

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: 'Product',
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-900">{product.name}</div>
              <div className="text-sm text-gray-500">SKU: {product.sku}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => {
        const category = row.getValue('category') as string;
        const type = row.original.type;
        return (
          <div className="space-y-1">
            <Badge variant="outline">{category}</Badge>
            {type && (
              <div className="text-xs text-gray-500">{type}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => {
        const price = row.getValue('price') as number;
        return (
          <div className="flex items-center">
            <DollarSign className="w-3 h-3 mr-1 text-gray-400" />
            <span className="font-medium">{formatCurrency(price)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'stock_quantity',
      header: 'Stock',
      cell: ({ row }) => {
        const product = row.original;
        const stockStatus = getStockStatus(product);
        const Icon = stockStatus.icon;
        
        return (
          <div className="space-y-1">
            <div className="flex items-center">
              <span className="font-medium">{product.stock_quantity || 0}</span>
              <span className="text-sm text-gray-500 ml-1">{product.unit || 'units'}</span>
            </div>
            <Badge className={`${stockStatus.color} text-xs`}>
              <Icon className="w-3 h-3 mr-1" />
              {stockStatus.label}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge className={getStatusColor(status)}>
            {status?.charAt(0).toUpperCase() + status?.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'supplier_name',
      header: 'Supplier',
      cell: ({ row }) => {
        const supplier = row.getValue('supplier_name') as string;
        return supplier ? (
          <span className="text-sm">{supplier}</span>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const product = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onView?.(product)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {hasPermission('crm:product:record:update') && (
                <DropdownMenuItem onClick={() => onEdit?.(product)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {hasPermission('crm:product:record:update') && (
                <>
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange(product, 'active')}
                    disabled={product.status === 'active'}
                  >
                    Set Active
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange(product, 'inactive')}
                    disabled={product.status === 'inactive'}
                  >
                    Set Inactive
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange(product, 'discontinued')}
                    disabled={product.status === 'discontinued'}
                  >
                    Discontinue
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      const newStock = prompt('Enter new stock quantity:', product.stock_quantity?.toString() || '0');
                      if (newStock !== null) {
                        handleStockUpdate(product, parseInt(newStock) || 0);
                      }
                    }}
                  >
                    <Tag className="mr-2 h-4 w-4" />
                    Update Stock
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {hasPermission('crm:product:record:delete') && (
                <DropdownMenuItem 
                  onClick={() => handleDelete(product)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const bulkActions = [
    {
      label: 'Set Active',
      action: () => handleBulkStatusUpdate('active'),
      permission: 'crm:product:record:update',
    },
    {
      label: 'Set Inactive',
      action: () => handleBulkStatusUpdate('inactive'),
      permission: 'crm:product:record:update',
    },
    {
      label: 'Discontinue',
      action: () => handleBulkStatusUpdate('discontinued'),
      permission: 'crm:product:record:update',
    },
    {
      label: 'Delete Selected',
      action: handleBulkDelete,
      permission: 'crm:product:record:delete',
      variant: 'destructive' as const,
    },
  ];

  const exportActions = [
    {
      label: 'Export CSV',
      action: () => handleExport('csv'),
    },
    {
      label: 'Export JSON',
      action: () => handleExport('json'),
    },
  ];

  return (
    <DataTable
      data={productsData?.data || []}
      columns={columns}
      loading={isLoading}
      pagination={{
        page: productsData?.page || 1,
        pageSize: productsData?.pageSize || 20,
        total: productsData?.total || 0,
        totalPages: productsData?.totalPages || 1,
      }}
      onPaginationChange={(page, pageSize) => {
        onFiltersChange({ ...filters, page, pageSize });
      }}
      selection={{
        selectedRows,
        onSelectionChange: setSelectedRows,
      }}
      bulkActions={bulkActions}
      exportActions={exportActions}
      searchPlaceholder="Search products..."
      onSearch={(search) => {
        onFiltersChange({ ...filters, search, page: 1 });
      }}
    />
  );
};
