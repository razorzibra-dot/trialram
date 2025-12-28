/**
 * Sales List Component
 * Displays deals in a table format with filtering and actions
 */

import React, { useState } from 'react';
import { Deal } from '@/types/crm';
import { formatCurrency } from '@/utils/formatters';
import { DataTable } from '@/modules/shared/components/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
import { useSalesStore } from '../store/dealStore';
import { useDeals, useDeleteDeal, useBulkDeals, useExportDeals } from '../hooks/useDeals';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionControlled } from '@/components/common/PermissionControlled';
import { usePermission } from '@/hooks/useElementPermissions';

interface SalesListProps {
  onCreateDeal?: () => void;
  onEditDeal?: (deal: Deal) => void;
  onViewDeal?: (deal: Deal) => void;
}

export const DealsList: React.FC<SalesListProps> = ({
  onCreateDeal,
  onEditDeal,
  onViewDeal,
}) => {
  const { hasPermission } = useAuth();

  // Element-level permissions for sales module
  const canViewDeals = usePermission('crm:sales:list:view', 'accessible');
  const canCreateDeals = usePermission('crm:sales:list:button.create', 'visible');
  const canExportDeals = usePermission('crm:sales:list:button.export', 'visible');
  const canBulkDelete = usePermission('crm:sales:list:button.bulkdelete', 'visible');
  const canSelectDeals = usePermission('crm:sales:list:selection', 'enabled');
  const canFilterDeals = usePermission('crm:sales:list:filters', 'visible');
  const {
    deals,
    isLoading,
    filters,
    searchQuery,
    selectedStage,
    selectedDealIds,
    pagination,
    setSearchQuery,
    setSelectedStage,
    setSelectedDealIds,
    toggleDealSelection,
    selectAllDeals,
    clearSelection,
  } = useSalesStore();

  // Debug: log store data at render
  try {
    console.log('[DealsList] render - deals count:', deals?.length, 'sample ids:', deals?.slice(0,5).map(d => d.id));
  } catch (e) {
    // Ignore errors during debug logging
  }

  const { refetch } = useDeals(filters);
  const deleteDeal = useDeleteDeal();
  const { bulkUpdate, bulkDelete } = useBulkDeals();
  const exportDeals = useExportDeals();

  const [showFilters, setShowFilters] = useState(false);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      won: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    
    const color = variants[status] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getStatusProgress = (status: string) => {
    const progressMap: Record<string, number> = {
      won: 100,
      lost: 0,
      cancelled: 0
    };
    return progressMap[status] || 0;
  };

  const handleDeleteDeal = async (deal: Deal) => {
    if (confirm(`Are you sure you want to delete "${deal.title}"?`)) {
      deleteDeal.mutate(deal.id);
    }
  };

  const handleBulkDelete = async () => {
    if (!canBulkDelete) {
      alert('You do not have permission to bulk delete deals');
      return;
    }

    if (confirm(`Are you sure you want to delete ${selectedDealIds.length} deals?`)) {
      bulkDelete.mutate(selectedDealIds);
    }
  };

  const handleExport = () => {
    if (!canExportDeals) {
      alert('You do not have permission to export deals');
      return;
    }
    exportDeals.mutate('csv');
  };

  const columns = [
    {
      key: 'title',
      header: 'Deal Title',
      sortable: true,
      render: (_: unknown, deal: Deal | undefined) => {
        if (!deal) return <span className="text-gray-400">-</span>;
        return (
          <div className="font-medium">
            {deal.title || 'Untitled Deal'}
            {deal.description && (
              <div className="text-sm text-gray-500 truncate max-w-xs">
                {deal.description}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'customer_name',
      header: 'Customer',
      sortable: true,
      render: (_: unknown, deal: Deal | undefined) => {
        if (!deal) return <span className="text-gray-400">-</span>;
        return (
          <span className="font-medium">
            {deal.customer_name || <span className="text-gray-400">Unknown Customer</span>}
          </span>
        );
      },
    },
    {
      key: 'value',
      header: 'Value',
      sortable: true,
      render: (_: unknown, deal: Deal | undefined) => {
        if (!deal) return <span className="text-gray-400">-</span>;
        return formatCurrency(deal.value || 0);
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (_: unknown, deal: Deal | undefined) => {
        if (!deal) return <span className="text-gray-400">-</span>;
        return (
          <div className="space-y-2">
            {getStatusBadge(deal.status || 'won')}
            <Progress 
              value={getStatusProgress(deal.status || 'won')} 
              className="h-1"
            />
          </div>
        );
      },
    },
    {
      key: 'assigned_to_name',
      header: 'Owner',
      sortable: true,
      render: (_: unknown, deal: Deal | undefined) => {
        if (!deal) return <span className="text-gray-400">-</span>;
        return (
          <span className="text-sm">
            {deal.assigned_to_name || <span className="text-gray-400">Unassigned</span>}
          </span>
        );
      },
    },
    {
      key: 'expected_close_date',
      header: 'Expected Close',
      sortable: true,
      render: (_: unknown, deal: Deal | undefined) => {
        if (!deal) return <span className="text-gray-400">-</span>;
        if (!deal.expected_close_date) return <span className="text-gray-400">N/A</span>;
        try {
          return new Date(deal.expected_close_date).toLocaleDateString();
        } catch {
          return <span className="text-gray-400">Invalid Date</span>;
        }
      },
    },
    {
      key: 'items',
      header: 'Product',
      render: (_: unknown, deal: Deal | undefined) => {
        if (!deal || !deal.items || deal.items.length === 0) {
          return <span className="text-gray-400">-</span>;
        }
        if (deal.items.length === 1) {
          return <span className="text-sm">{deal.items[0].product_name}</span>;
        }
        return (
          <div className="flex flex-col gap-1">
            <span className="text-sm">{deal.items[0].product_name}</span>
            <Badge variant="outline" className="text-xs w-fit">
              +{deal.items.length - 1} more
            </Badge>
          </div>
        );
      },
    },
    {
      key: 'source',
      header: 'Source',
      sortable: true,
      render: (_: unknown, deal: Deal | undefined) => {
        if (!deal) return <span className="text-gray-400">-</span>;
        return deal.source || <span className="text-gray-400">-</span>;
      },
    },
    {
      key: 'campaign',
      header: 'Campaign',
      sortable: true,
      render: (_: unknown, deal: Deal | undefined) => {
        if (!deal) return <span className="text-gray-400">-</span>;
        return deal.campaign || <span className="text-gray-400">-</span>;
      },
    },
    {
      key: 'tags',
      header: 'Tags',
      render: (_: unknown, deal: Deal | undefined) => {
        if (!deal) return <span className="text-gray-400">-</span>;
        if (!deal.tags || deal.tags.length === 0) return <span className="text-gray-400">-</span>;
        return (
          <div className="flex gap-1 flex-wrap">
            {deal.tags.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: unknown, deal: Deal | undefined) => {
        if (!deal) return <span className="text-gray-400">-</span>;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onViewDeal?.(deal)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <PermissionControlled
                elementPath={`crm:sales:deal.${deal.id}:button.edit`}
                action="visible"
              >
                <DropdownMenuItem onClick={() => onEditDeal?.(deal)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Deal
                </DropdownMenuItem>
              </PermissionControlled>
              <PermissionControlled
                elementPath={`crm:sales:deal.${deal.id}:button.delete`}
                action="visible"
              >
                <DropdownMenuItem
                  onClick={() => handleDeleteDeal(deal)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Deal
                </DropdownMenuItem>
              </PermissionControlled>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const bulkActions = canBulkDelete ? [
    {
      label: 'Delete Selected',
      action: handleBulkDelete,
      variant: 'destructive' as const,
      icon: Trash2,
    },
  ] : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Sales Deals</h2>
          <p className="text-gray-600">
            Manage your sales pipeline and track deal progress
          </p>
        </div>
        <div className="flex gap-2">
          {canFilterDeals && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          )}
          {canExportDeals && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exportDeals.isPending}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canCreateDeals && (
            <Button onClick={onCreateDeal}>
              <Plus className="h-4 w-4 mr-2" />
              New Deal
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && canFilterDeals && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search deals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        data={deals}
        columns={columns}
        loading={isLoading}
        pagination={{
          page: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          totalPages: pagination.totalPages,
        }}
        selection={canSelectDeals ? {
          selectedRowKeys: selectedDealIds,
          onChange: (keys: string[]) => setSelectedDealIds(keys),
        } : undefined}
        bulkActions={bulkActions}
        emptyState={{
          title: 'No deals found',
          description: 'Get started by creating your first deal',
          action: canCreateDeals ? (
            <Button onClick={onCreateDeal}>
              <Plus className="h-4 w-4 mr-2" />
              Create Deal
            </Button>
          ) : undefined,
        }}
      />
    </div>
  );
};
