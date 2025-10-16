/**
 * Sales List Component
 * Displays deals in a table format with filtering and actions
 */

import React, { useState } from 'react';
import { Deal } from '@/types/crm';
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
import { useSalesStore } from '../store/salesStore';
import { useDeals, useDeleteDeal, useBulkDeals, useExportDeals } from '../hooks/useSales';
import { useAuth } from '@/contexts/AuthContext';

interface SalesListProps {
  onCreateDeal?: () => void;
  onEditDeal?: (deal: Deal) => void;
  onViewDeal?: (deal: Deal) => void;
}

export const SalesList: React.FC<SalesListProps> = ({
  onCreateDeal,
  onEditDeal,
  onViewDeal,
}) => {
  const { hasPermission } = useAuth();
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

  const { refetch } = useDeals(filters);
  const deleteDeal = useDeleteDeal();
  const { bulkUpdate, bulkDelete } = useBulkDeals();
  const exportDeals = useExportDeals();

  const [showFilters, setShowFilters] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStageBadge = (stage: string) => {
    const variants = {
      lead: 'bg-gray-100 text-gray-800',
      qualified: 'bg-blue-100 text-blue-800',
      proposal: 'bg-yellow-100 text-yellow-800',
      negotiation: 'bg-orange-100 text-orange-800',
      closed_won: 'bg-green-100 text-green-800',
      closed_lost: 'bg-red-100 text-red-800'
    };
    
    const color = variants[stage as keyof typeof variants] || variants.lead;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {stage.replace('_', ' ')}
      </span>
    );
  };

  const getStageProgress = (stage: string) => {
    const progressMap = {
      lead: 10,
      qualified: 25,
      proposal: 50,
      negotiation: 75,
      closed_won: 100,
      closed_lost: 0
    };
    return progressMap[stage as keyof typeof progressMap] || 0;
  };

  const handleDeleteDeal = async (deal: Deal) => {
    if (!hasPermission('delete')) {
      alert('You do not have permission to delete deals');
      return;
    }

    if (confirm(`Are you sure you want to delete "${deal.title}"?`)) {
      deleteDeal.mutate(deal.id);
    }
  };

  const handleBulkDelete = async () => {
    if (!hasPermission('delete')) {
      alert('You do not have permission to delete deals');
      return;
    }

    if (confirm(`Are you sure you want to delete ${selectedDealIds.length} deals?`)) {
      bulkDelete.mutate(selectedDealIds);
    }
  };

  const handleExport = () => {
    exportDeals.mutate('csv');
  };

  const columns = [
    {
      key: 'title',
      header: 'Deal Title',
      sortable: true,
      render: (deal: Deal) => (
        <div className="font-medium">
          {deal.title}
          {deal.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {deal.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'customer_name',
      header: 'Customer',
      sortable: true,
      render: (deal: Deal) => deal.customer_name || 'N/A',
    },
    {
      key: 'value',
      header: 'Value',
      sortable: true,
      render: (deal: Deal) => formatCurrency(deal.value || 0),
    },
    {
      key: 'stage',
      header: 'Stage',
      sortable: true,
      render: (deal: Deal) => (
        <div className="space-y-2">
          {getStageBadge(deal.stage || 'lead')}
          <Progress 
            value={getStageProgress(deal.stage || 'lead')} 
            className="h-1"
          />
        </div>
      ),
    },
    {
      key: 'assigned_to_name',
      header: 'Assigned To',
      sortable: true,
      render: (deal: Deal) => deal.assigned_to_name || 'Unassigned',
    },
    {
      key: 'expected_close_date',
      header: 'Expected Close',
      sortable: true,
      render: (deal: Deal) => {
        if (!deal.expected_close_date) return 'N/A';
        return new Date(deal.expected_close_date).toLocaleDateString();
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (deal: Deal) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
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
            {hasPermission('write') && (
              <DropdownMenuItem onClick={() => onEditDeal?.(deal)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Deal
              </DropdownMenuItem>
            )}
            {hasPermission('delete') && (
              <DropdownMenuItem 
                onClick={() => handleDeleteDeal(deal)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Deal
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const bulkActions = [
    {
      label: 'Delete Selected',
      action: handleBulkDelete,
      variant: 'destructive' as const,
      icon: Trash2,
      permission: 'delete',
    },
  ];

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exportDeals.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {hasPermission('write') && (
            <Button onClick={onCreateDeal}>
              <Plus className="h-4 w-4 mr-2" />
              New Deal
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
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
              <label className="block text-sm font-medium mb-2">Stage</label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger>
                  <SelectValue placeholder="All stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="closed_won">Closed Won</SelectItem>
                  <SelectItem value="closed_lost">Closed Lost</SelectItem>
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
        selection={{
          selectedIds: selectedDealIds,
          onSelectionChange: setSelectedDealIds,
          onSelectAll: selectAllDeals,
          onClearSelection: clearSelection,
        }}
        bulkActions={bulkActions}
        emptyState={{
          title: 'No deals found',
          description: 'Get started by creating your first deal',
          action: hasPermission('write') ? (
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
