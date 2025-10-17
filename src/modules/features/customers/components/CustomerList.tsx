/**
 * Customer List Component
 * Displays customers in a data table with filtering and actions
 */

import React, { useMemo, useState, useCallback } from 'react';
import { DataTable, Column } from '@/modules/shared/components/DataTable';
import { useCustomers, useDeleteCustomer, useBulkCustomerOperations } from '../hooks/useCustomers';
import { useCustomerStore } from '../store/customerStore';
import { Customer } from '@/types/crm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate, formatCurrency } from '@/modules/core/utils';
import { Edit, Trash2, Eye, Mail, Phone } from 'lucide-react';

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

  const { customers, pagination, isLoading, refetch } = useCustomers(stableFilters);
  const deleteCustomer = useDeleteCustomer();
  const { bulkDelete } = useBulkCustomerOperations();

  // Define table columns
  const columns: Column<Customer>[] = useMemo(() => [
    {
      key: 'customer',
      title: 'Customer',
      render: (_, customer) => (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={customer.avatar} />
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
      dataIndex: 'industry',
      render: (industry) => (
        <Badge variant="outline">
          {industry || 'Not specified'}
        </Badge>
      ),
      sortable: true,
      filterable: true,
    },
    {
      key: 'size',
      title: 'Size',
      dataIndex: 'size',
      render: (size) => {
        const sizeColors = {
          startup: 'bg-green-100 text-green-800',
          small: 'bg-blue-100 text-blue-800',
          medium: 'bg-yellow-100 text-yellow-800',
          enterprise: 'bg-purple-100 text-purple-800',
        };

        return (
          <Badge
            variant="secondary"
            className={sizeColors[size as keyof typeof sizeColors] || ''}
          >
            {size || 'Unknown'}
          </Badge>
        );
      },
      sortable: true,
      filterable: true,
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'status',
      render: (status) => {
        const statusColors = {
          active: 'bg-green-100 text-green-800',
          inactive: 'bg-gray-100 text-gray-800',
          prospect: 'bg-orange-100 text-orange-800',
        };

        return (
          <Badge className={statusColors[status as keyof typeof statusColors] || ''}>
            {status || 'Unknown'}
          </Badge>
        );
      },
      sortable: true,
      filterable: true,
    },
    {
      key: 'total_sales_amount',
      title: 'Total Sales',
      dataIndex: 'total_sales_amount',
      render: (amount) => formatCurrency(amount || 0),
      sortable: true,
      align: 'right',
    },
    {
      key: 'created_at',
      title: 'Created',
      dataIndex: 'created_at',
      render: (date) => formatDate(date),
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
      await bulkDelete.mutateAsync(selectedCustomerIds);
      setSelectedCustomerIds([]); // Clear selection after bulk delete
      refetch(); // Refetch data after deletion
    }
  }, [selectedCustomerIds, bulkDelete, refetch, setSelectedCustomerIds]);

  // Row actions
  const getRowActions = useCallback((customer: Customer) => [
    {
      label: 'View',
      icon: <Eye className="w-4 h-4" />,
      onClick: () => onViewCustomer?.(customer),
    },
    {
      label: 'Edit',
      icon: <Edit className="w-4 h-4" />,
      onClick: () => onEditCustomer?.(customer),
    },
    {
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
    },
  ], [onViewCustomer, onEditCustomer, deleteCustomer, refetch]);

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedCustomerIds.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-900">
            {selectedCustomerIds.length} customer(s) selected
          </span>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDelete.isLoading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={customers}
        loading={isLoading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: handlePaginationChange,
        }}
        selection={{
          selectedRowKeys: selectedCustomerIds,
          onChange: handleSelectionChange,
        }}
        search={{
          value: stableFilters.search || '',
          placeholder: 'Search customers...',
          onChange: handleSearch,
        }}
        actions={{
          onCreate: onCreateCustomer,
          onExport: () => {
            // Handle export
            console.log('Export customers');
          },
          rowActions: getRowActions,
        }}
        rowKey="id"
        className="bg-white"
      />
    </div>
  );
};