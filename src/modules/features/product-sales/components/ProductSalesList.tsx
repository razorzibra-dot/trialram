/**
 * ProductSalesList Component
 * Displays product sales in a table format with comprehensive features
 * - Sortable columns, filterable data, row selection
 * - Status color coding, currency formatting, date formatting
 * - Pagination controls, empty state message, loading skeleton
 * - Responsive design with mobile-friendly layout
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Table, Tag, Space, Button, Popconfirm, Spin, Empty, Tooltip, Checkbox } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { ProductSale } from '@/types/productSales';
import { useProductSalesStore } from '../store/productSalesStore';
import { useProductSales } from '../hooks/useProductSales';
import { useDeleteProductSale, useBulkDeleteProductSales } from '../hooks/useDeleteProductSale';
import { useProductSalesPermissions, useProductSalesActionPermission } from '../hooks/useProductSalesPermissions';
import { EditOutlined, DeleteOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';

/**
 * Props for ProductSalesList component
 */
export interface ProductSalesListProps {
  /** Callback when viewing a sale */
  onView?: (sale: ProductSale) => void;
  /** Callback when editing a sale */
  onEdit?: (sale: ProductSale) => void;
  /** Callback when deleting a sale */
  onDelete?: (sale: ProductSale) => void;
  /** Optional CSS class for styling */
  className?: string;
  /** Optional custom row click handler */
  onRowClick?: (sale: ProductSale) => void;
  /** Show/hide action column */
  showActions?: boolean;
  /** Disable row selection */
  disableSelection?: boolean;
}

/**
 * Status color mapping
 */
const STATUS_COLORS: Record<string, string> = {
  new: 'green',
  renewed: 'blue',
  expired: 'red',
};

/**
 * Product Sales List Component
 * Comprehensive table for managing product sales
 */
export const ProductSalesList: React.FC<ProductSalesListProps> = ({
  onView,
  onEdit,
  onDelete,
  className = '',
  onRowClick,
  showActions = true,
  disableSelection = false,
}) => {
  const {
    sales,
    isLoading,
    selectedSaleIds,
    setSelectedSaleIds,
    pagination,
    setCurrentPage,
    setPageSize,
    setSorting,
    sortBy,
    sortOrder,
    filters,
  } = useProductSalesStore();

  const { refetch: refetchSales } = useProductSales(filters, pagination.currentPage, pagination.pageSize);
  const deleteMutation = useDeleteProductSale();
  const bulkDeleteMutation = useBulkDeleteProductSales();
  
  // Load RBAC permissions for UI button visibility
  const permissions = useProductSalesPermissions({ autoLoad: true });

  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  /**
   * Format currency value
   */
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, []);

  /**
   * Format date to readable string
   */
  const formatDate = useCallback((dateString: string): string => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  }, []);

  /**
   * Get status badge color
   */
  const getStatusColor = useCallback((status: string): string => {
    return STATUS_COLORS[status] || 'default';
  }, []);

  /**
   * Handle row selection
   */
  const handleSelectRow = useCallback(
    (sale: ProductSale) => {
      setSelectedSaleIds(
        selectedSaleIds.includes(sale.id)
          ? selectedSaleIds.filter((id) => id !== sale.id)
          : [...selectedSaleIds, sale.id]
      );
    },
    [selectedSaleIds, setSelectedSaleIds]
  );

  /**
   * Handle select all
   */
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedSaleIds(sales.map((s) => s.id));
      } else {
        setSelectedSaleIds([]);
      }
    },
    [sales, setSelectedSaleIds]
  );

  /**
   * Handle delete single sale
   */
  const handleDelete = useCallback(
    (sale: ProductSale) => {
      deleteMutation.mutate(sale.id);
      if (onDelete) {
        onDelete(sale);
      }
    },
    [deleteMutation, onDelete]
  );

  /**
   * Handle bulk delete
   */
  const handleBulkDelete = useCallback(() => {
    if (selectedSaleIds.length > 0) {
      bulkDeleteMutation.mutate(selectedSaleIds);
    }
  }, [selectedSaleIds, bulkDeleteMutation]);

  /**
   * Handle table sort change
   */
  const handleTableChange: TableProps<ProductSale>['onChange'] = useCallback(
    (pagination, filters, sorter) => {
      // Handle pagination
      if ('current' in pagination) {
        setCurrentPage(pagination.current);
      }
      if ('pageSize' in pagination) {
        setPageSize(pagination.pageSize);
      }

      // Handle sorting
      if (sorter && !Array.isArray(sorter)) {
        setSorting(
          sorter.field as string,
          (sorter.order === 'ascend' ? 'asc' : 'desc') as 'asc' | 'desc'
        );
      }
    },
    [setCurrentPage, setPageSize, setSorting]
  );

  /**
   * Define table columns
   */
  const columns: ColumnsType<ProductSale> = useMemo(
    () => [
      // Selection column
      !disableSelection && {
        key: 'selection',
        width: 50,
        fixed: 'left' as const,
        render: (_: unknown, sale: ProductSale) => (
          <Checkbox
            checked={selectedSaleIds.includes(sale.id)}
            onChange={() => handleSelectRow(sale)}
          />
        ),
      },
      // Sale ID
      {
        key: 'id',
        title: 'Sale ID',
        dataIndex: 'id',
        width: 120,
        sorter: true,
        render: (id: string) => (
          <Tooltip title={id}>
            <span className="font-mono text-xs">{id.substring(0, 8)}...</span>
          </Tooltip>
        ),
      },
      // Customer Name
      {
        key: 'customer_name',
        title: 'Customer',
        dataIndex: 'customer_name',
        width: 150,
        sorter: true,
        render: (name: string, sale: ProductSale) => (
          <Tooltip title={`ID: ${sale.customer_id}`}>
            <span className="font-medium">{name || 'N/A'}</span>
          </Tooltip>
        ),
      },
      // Product Name
      {
        key: 'product_name',
        title: 'Product',
        dataIndex: 'product_name',
        width: 150,
        sorter: true,
        render: (name: string, sale: ProductSale) => (
          <Tooltip title={`ID: ${sale.product_id}`}>
            <span>{name || 'N/A'}</span>
          </Tooltip>
        ),
      },
      // Quantity
      {
        key: 'units',
        title: 'Qty',
        dataIndex: 'units',
        width: 80,
        sorter: true,
        render: (units: number) => (
          <span className="text-right">{units.toFixed(2)}</span>
        ),
      },
      // Unit Price
      {
        key: 'cost_per_unit',
        title: 'Unit Price',
        dataIndex: 'cost_per_unit',
        width: 120,
        sorter: true,
        render: (price: number) => (
          <span className="font-medium">{formatCurrency(price)}</span>
        ),
      },
      // Total Price
      {
        key: 'total_cost',
        title: 'Total',
        dataIndex: 'total_cost',
        width: 120,
        sorter: true,
        render: (total: number) => (
          <span className="font-semibold text-blue-600">{formatCurrency(total)}</span>
        ),
      },
      // Status
      {
        key: 'status',
        title: 'Status',
        dataIndex: 'status',
        width: 100,
        sorter: true,
        render: (status: string) => (
          <Tag color={getStatusColor(status)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Tag>
        ),
      },
      // Delivery Date
      {
        key: 'delivery_date',
        title: 'Delivery Date',
        dataIndex: 'delivery_date',
        width: 130,
        sorter: true,
        render: (date: string) => <span>{formatDate(date)}</span>,
      },
      // Warranty Expiry
      {
        key: 'warranty_expiry',
        title: 'Warranty Expiry',
        dataIndex: 'warranty_expiry',
        width: 140,
        sorter: true,
        render: (date: string) => {
          const isExpiringSoon = new Date(date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          return (
            <span className={isExpiringSoon ? 'text-orange-600 font-medium' : ''}>
              {formatDate(date)}
            </span>
          );
        },
      },
      // Actions
      showActions && {
        key: 'actions',
        title: 'Actions',
        width: 120,
        fixed: 'right' as const,
        render: (_: unknown, sale: ProductSale) => (
          <Space size="small" className="flex flex-wrap">
            {onView && (
              <Tooltip title="View Details">
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => onView(sale)}
                  disabled={!permissions.canView}
                />
              </Tooltip>
            )}
            {onEdit && permissions.canEdit && (
              <Tooltip title={permissions.canEdit ? "Edit" : "You don't have permission to edit"}>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onEdit(sale)}
                  disabled={!permissions.canEdit}
                />
              </Tooltip>
            )}
            {permissions.canDelete && (
              <Popconfirm
                title="Delete"
                description="Are you sure you want to delete this product sale?"
                onConfirm={() => handleDelete(sale)}
                okText="Yes"
                cancelText="No"
              >
                <Tooltip title={permissions.canDelete ? "Delete" : "You don't have permission to delete"}>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    loading={deleteMutation.isPending}
                    disabled={!permissions.canDelete}
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        ),
      },
    ].filter(Boolean) as ColumnsType<ProductSale>,
    [
      disableSelection,
      selectedSaleIds,
      handleSelectRow,
      showActions,
      onView,
      onEdit,
      handleDelete,
      formatCurrency,
      formatDate,
      getStatusColor,
      deleteMutation.isPending,
      permissions,
    ]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Spin size="large" spinning />
      </div>
    );
  }

  // Empty state
  if (sales.length === 0) {
    return (
      <div className={`p-8 ${className}`}>
        <Empty
          description="No product sales found"
          style={{ marginTop: '48px', marginBottom: '48px' }}
        >
          <Button type="primary">Create New Sale</Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className={`product-sales-list ${className}`}>
      {/* Bulk actions toolbar */}
      {!disableSelection && selectedSaleIds.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-blue-50 p-4">
          <span className="font-medium">
            {selectedSaleIds.length} item(s) selected
          </span>
          <Space>
            <Button
              danger
              onClick={handleBulkDelete}
              loading={bulkDeleteMutation.isPending}
            >
              Delete Selected
            </Button>
            <Button onClick={() => setSelectedSaleIds([])}>
              Clear Selection
            </Button>
          </Space>
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={() => refetchSales()}
            loading={isLoading}
          >
            Refresh
          </Button>
        </div>
        {!disableSelection && (
          <div>
            <Checkbox
              checked={selectedSaleIds.length === sales.length && sales.length > 0}
              indeterminate={
                selectedSaleIds.length > 0 && selectedSaleIds.length < sales.length
              }
              onChange={(e) => handleSelectAll(e.target.checked)}
            >
              Select All on this page
            </Checkbox>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <Table<ProductSale>
          columns={columns}
          dataSource={sales}
          rowKey="id"
          pagination={{
            current: pagination.currentPage,
            pageSize: pagination.pageSize,
            total: pagination.totalCount,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `Total ${total} items`,
          }}
          onChange={handleTableChange}
          onRow={(sale) => ({
            onClick: () => {
              if (onRowClick) {
                onRowClick(sale);
              }
            },
            className: 'cursor-pointer hover:bg-gray-50',
          })}
          loading={isLoading}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <Empty description="No data" style={{ margin: '32px 0' }} />
            ),
          }}
        />
      </div>
    </div>
  );
};

export default ProductSalesList;