/**
 * Customer List Component
 * Displays customers in a data table with filtering and actions
 */

import React, { useMemo, useState, useCallback } from 'react';
import { DataTable, Column } from '@/modules/shared/components/DataTable';
import { useCustomers, useDeleteCustomer, useBulkCustomerOperations, useCustomerExport } from '../hooks/useCustomers';
import { useCustomerStore } from '../store/customerStore';
import { Customer } from '@/types/crm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate, formatCurrency } from '@/modules/core/utils';
import { Edit, Trash2, Eye, Mail, Phone } from 'lucide-react';
import { PermissionControlled } from '@/components/common/PermissionControlled';
import { usePermission } from '@/hooks/useElementPermissions';

interface CustomerListProps {
  onCreateCustomer?: () => void;
  onEditCustomer?: (customer: Customer) => void;
  onViewCustomer?: (customer: Customer) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  onCreateCustomer,
  onEditCustomer,
  onViewCustomer,
}) => {
  // Get individual filter properties to avoid object reference issues
  const filters = useCustomerStore((state) => state.filters);
  const selectedCustomerIds = useCustomerStore((state) => state.selectedCustomerIds);
  const setSelectedCustomerIds = useCustomerStore((state) => state.setSelectedCustomerIds);
  const setFilters = useCustomerStore((state) => state.setFilters);

  // Memoize filters to prevent unnecessary re-renders
  const stableFilters = useMemo(() => filters, [filters]);

  const { data, isLoading, refetch } = useCustomers(stableFilters);
  const customers = data?.data || [];
  const pagination = data ? {
    page: data.page,
    pageSize: data.pageSize,
    total: data.total,
    totalPages: data.totalPages,
  } : { page: 1, pageSize: 20, total: 0, totalPages: 0 };
  const deleteCustomer = useDeleteCustomer();
  const bulkDelete = useBulkCustomerOperations();
  const exportCustomers = useCustomerExport();

  // Element-level permissions
  const canViewCustomers = usePermission('crm:contacts:list:view', 'accessible');
  const canCreateCustomers = usePermission('crm:contacts:list:button.create', 'visible');
  const canExportCustomers = usePermission('crm:contacts:list:button.export', 'visible');
  const canBulkDelete = usePermission('crm:contacts:list:button.bulkdelete', 'visible');
  const canSelectCustomers = usePermission('crm:contacts:list:selection', 'enabled');

  // Define table columns
  const columns: Column<Customer>[] = useMemo(() => [
    {
      key: 'customer',
      title: 'Customer',
      render: (_, customer) => (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {customer.company_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-gray-900">
              {customer.company_name}
            </div>
            <div className="text-sm text-gray-500">
              {customer.contact_name}
            </div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'contact',
      title: 'Contact',
      render: (_, customer) => (
        <div className="space-y-1">
          {customer.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-3 h-3 mr-1" />
              {customer.email}
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-3 h-3 mr-1" />
              {customer.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'industry',
      title: 'Industry',
      render: (_: unknown, customer: Customer | undefined) => {
        if (!customer) return <span className="text-gray-400">-</span>;
        return (
          <Badge variant="outline">
            {customer.industry || 'Not specified'}
          </Badge>
        );
      },
      sortable: true,
      filterable: true,
    },
    {
      key: 'size',
      title: 'Size',
      render: (_: unknown, customer: Customer | undefined) => {
        if (!customer) return <span className="text-gray-400">-</span>;
        const sizeColors = {
          startup: 'bg-green-100 text-green-800',
          small: 'bg-blue-100 text-blue-800',
          medium: 'bg-yellow-100 text-yellow-800',
          enterprise: 'bg-purple-100 text-purple-800',
        };

        return (
          <Badge
            variant="secondary"
            className={sizeColors[customer.size as keyof typeof sizeColors] || ''}
          >
            {customer.size || 'Unknown'}
          </Badge>
        );
      },
      sortable: true,
      filterable: true,
    },
    {
      key: 'status',
      title: 'Status',
      render: (_: unknown, customer: Customer | undefined) => {
        if (!customer) return <span className="text-gray-400">-</span>;
        const statusColors = {
          active: 'bg-green-100 text-green-800',
          inactive: 'bg-gray-100 text-gray-800',
          prospect: 'bg-orange-100 text-orange-800',
        };

        return (
          <Badge className={statusColors[customer.status as keyof typeof statusColors] || ''}>
            {customer.status || 'Unknown'}
          </Badge>
        );
      },
      sortable: true,
      filterable: true,
    },
    {
      key: 'total_sales_amount',
      title: 'Total Sales',
      render: (_: unknown, customer: Customer | undefined) => {
        if (!customer) return <span className="text-gray-400">-</span>;
        return formatCurrency(customer.total_sales_amount || 0);
      },
      sortable: true,
      align: 'right',
    },
    {
      key: 'created_at',
      title: 'Created',
      render: (_: unknown, customer: Customer | undefined) => {
        if (!customer) return <span className="text-gray-400">-</span>;
        return formatDate(customer.created_at);
      },
      sortable: true,
    },
  ], []);

  // Handle pagination
  const handlePaginationChange = useCallback((page: number, pageSize: number) => {
    setFilters({
      page,
      pageSize
    });
  }, [setFilters]);

  // Handle search
  const handleSearch = useCallback((search: string) => {
    setFilters({
      search,
      page: 1 // Reset to first page
    });
  }, [setFilters]);

  // Handle selection
  const handleSelectionChange = useCallback((selectedRowKeys: string[], selectedRows: Customer[]) => {
    setSelectedCustomerIds(selectedRowKeys);
  }, [setSelectedCustomerIds]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedCustomerIds.length === 0) return;

    if (confirm(`Are you sure you want to delete ${selectedCustomerIds.length} customers?`)) {
      await bulkDelete.mutateAsync({
        operation: 'delete',
        ids: selectedCustomerIds
      });
      setSelectedCustomerIds([]); // Clear selection after bulk delete
      refetch(); // Refetch data after deletion
    }
  }, [selectedCustomerIds, bulkDelete, refetch, setSelectedCustomerIds]);

  // Handle export
  const handleExport = useCallback(async (format: 'csv' | 'json' = 'csv') => {
    try {
      const result = await exportCustomers.mutateAsync(format);
      if (result) {
        // Create and download file
        const blob = new Blob([result], {
          type: format === 'csv' ? 'text/csv' : 'application/json'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }, [exportCustomers]);

  // Row actions
  const getRowActions = useCallback((customer: Customer) => {
    const actions = [];

    // View action
    actions.push({
      label: 'View',
      icon: <Eye className="w-4 h-4" />,
      onClick: () => onViewCustomer?.(customer),
    });

    // Edit action
    actions.push({
      label: 'Edit',
      icon: <Edit className="w-4 h-4" />,
      onClick: () => onEditCustomer?.(customer),
    });

    // Delete action
    actions.push({
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => {
        if (confirm('Are you sure you want to delete this customer?')) {
          deleteCustomer.mutate(customer.id, {
            onSuccess: () => {
              refetch(); // Refetch data after deletion
            },
          });
        }
      },
    });

    return actions;
  }, [onViewCustomer, onEditCustomer, deleteCustomer, refetch]);

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedCustomerIds.length > 0 && canSelectCustomers && (
        <PermissionControlled
          elementPath="crm:contacts:list:bulkactions"
          action="visible"
        >
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm font-medium text-blue-900">
              {selectedCustomerIds.length} customer(s) selected
            </span>
            <div className="flex space-x-2">
              <PermissionControlled
                elementPath="crm:contacts:list:button.bulkdelete"
                action="visible"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDelete.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </PermissionControlled>
            </div>
          </div>
        </PermissionControlled>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns as any}
        data={customers as any}
        loading={isLoading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: handlePaginationChange,
        }}
        selection={canSelectCustomers ? {
          selectedRowKeys: selectedCustomerIds,
          onChange: handleSelectionChange as any,
        } : undefined}
        search={{
          value: (stableFilters.search as string) || '',
          placeholder: 'Search customers...',
          onChange: handleSearch,
        }}
        actions={{
          onCreate: canCreateCustomers ? onCreateCustomer : undefined,
          onExport: canExportCustomers ? () => handleExport('csv') : undefined,
          rowActions: getRowActions as any,
        }}
        rowKey="id"
        className="bg-white"
      />
    </div>
  );
};