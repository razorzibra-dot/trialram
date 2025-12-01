/**
 * Contracts List Component
 * Displays contracts in a data table with filtering and actions
 */

import React, { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Edit, 
  Trash2, 
  Eye, 
  DollarSign, 
  Calendar,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users
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
import { Contract, ContractFilters } from '@/types/contracts';
import {
  useContracts,
  useDeleteContract,
  useUpdateContractStatus,
  useApproveContract,
  useExportContracts,
  useExpiringContracts,
  useContractsDueForRenewal
} from '../hooks/useContracts';

interface ContractsListProps {
  filters: ContractFilters;
  onFiltersChange: (filters: ContractFilters) => void;
  onEdit?: (contract: Contract) => void;
  onView?: (contract: Contract) => void;
}

export const ContractsList: React.FC<ContractsListProps> = ({
  filters,
  onFiltersChange,
  onEdit,
  onView,
}) => {
  const { hasPermission } = useAuth();
  const [selectedRows, setSelectedRows] = useState<Contract[]>([]);

  // Queries and mutations
  const { contracts, pagination, isLoading } = useContracts(filters);
  const { contracts: expiringContracts } = useExpiringContracts(30);
  const { contracts: renewalContracts } = useContractsDueForRenewal(30);
  const deleteContract = useDeleteContract();
  const updateStatus = useUpdateContractStatus();
  const approveContract = useApproveContract();
  const exportContracts = useExportContracts();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      case 'renewed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'service_agreement':
        return 'bg-blue-100 text-blue-800';
      case 'nda':
        return 'bg-purple-100 text-purple-800';
      case 'purchase_order':
        return 'bg-green-100 text-green-800';
      case 'employment':
        return 'bg-orange-100 text-orange-800';
      case 'custom':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isExpiringSoon = (contract: Contract) => {
    if (!contract.end_date) return false;
    const endDate = new Date(contract.end_date);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return endDate <= thirtyDaysFromNow && endDate >= now;
  };

  const isDueForRenewal = (contract: Contract) => {
    if (!contract.next_renewal_date) return false;
    const renewalDate = new Date(contract.next_renewal_date);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return renewalDate <= thirtyDaysFromNow && renewalDate >= now;
  };

  const getDaysUntilExpiry = (contract: Contract) => {
    if (!contract.end_date) return null;
    const endDate = new Date(contract.end_date);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysUntilRenewal = (contract: Contract) => {
    if (!contract.next_renewal_date) return null;
    const renewalDate = new Date(contract.next_renewal_date);
    const now = new Date();
    const diffTime = renewalDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleDelete = async (contract: Contract) => {
    if (window.confirm(`Are you sure you want to delete contract "${contract.title}"?`)) {
      await deleteContract.mutateAsync(contract.id);
    }
  };

  const handleStatusChange = async (contract: Contract, newStatus: string) => {
    await updateStatus.mutateAsync({ id: contract.id, status: newStatus });
  };

  const handleApprove = async (contract: Contract) => {
    await approveContract.mutateAsync({ 
      id: contract.id, 
      approvalData: { stage: 'final_approval', comments: 'Approved via bulk action' }
    });
  };

  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    await exportContracts.mutateAsync(format);
  };

  const columns: ColumnDef<Contract>[] = [
    {
      accessorKey: 'title',
      header: 'Contract',
      cell: ({ row }) => {
        const contract = row.original;
        const expiringSoon = isExpiringSoon(contract);
        const dueForRenewal = isDueForRenewal(contract);
        const daysUntilExpiry = getDaysUntilExpiry(contract);
        const daysUntilRenewal = getDaysUntilRenewal(contract);

        return (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                expiringSoon ? 'bg-red-100' :
                dueForRenewal ? 'bg-orange-100' :
                'bg-blue-100'
              }`}>
                {expiringSoon ? (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                ) : dueForRenewal ? (
                  <Clock className="w-4 h-4 text-orange-600" />
                ) : (
                  <FileText className="w-4 h-4 text-blue-600" />
                )}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-900 flex items-center space-x-2">
                <span>{contract.title}</span>
                {expiringSoon && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                    Expires in {daysUntilExpiry} days
                  </Badge>
                )}
                {dueForRenewal && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                    Renewal due in {daysUntilRenewal} days
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-500">{contract.contract_number}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'customer_name',
      header: 'Customer',
      cell: ({ row }) => {
        const customerName = row.getValue('customer_name') as string;
        const contract = row.original;
        return (
          <div className="space-y-1">
            <div className="font-medium">{customerName}</div>
            {contract.customer_contact && (
              <div className="text-sm text-gray-500">{contract.customer_contact}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        const displayType = type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        return (
          <Badge className={getTypeColor(type)}>
            {displayType}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const displayStatus = status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        return (
          <Badge className={getStatusColor(status)}>
            {displayStatus}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: ({ row }) => {
        const value = row.getValue('value') as number;
        return (
          <div className="flex items-center">
            <DollarSign className="w-3 h-3 mr-1 text-gray-400" />
            <span className="font-medium">{formatCurrency(value)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'start_date',
      header: 'Duration',
      cell: ({ row }) => {
        const contract = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center text-sm">
              <Calendar className="w-3 h-3 mr-1 text-gray-400" />
              <span>{formatDate(contract.start_date)}</span>
            </div>
            <div className="text-sm text-gray-500">
              to {formatDate(contract.end_date)}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const priority = row.getValue('priority') as string;
        return (
          <Badge variant="outline" className={getPriorityColor(priority)}>
            {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'assigned_to_name',
      header: 'Assigned To',
      cell: ({ row }) => {
        const assignedTo = row.getValue('assigned_to_name') as string;
        return assignedTo ? (
          <div className="flex items-center">
            <Users className="w-3 h-3 mr-1 text-gray-400" />
            <span className="text-sm">{assignedTo}</span>
          </div>
        ) : (
          <span className="text-gray-400">Unassigned</span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const contract = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onView?.(contract)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {hasPermission('crm:contract:record:update') && (
                <DropdownMenuItem onClick={() => onEdit?.(contract)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {hasPermission('crm:contract:record:update') && (
                <>
                  {contract.status === 'pending_approval' && (
                    <DropdownMenuItem onClick={() => handleApprove(contract)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange(contract, 'active')}
                    disabled={contract.status === 'active'}
                  >
                    Activate
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange(contract, 'terminated')}
                    disabled={contract.status === 'terminated'}
                  >
                    Terminate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {hasPermission('crm:contract:record:delete') && (
                <DropdownMenuItem 
                  onClick={() => handleDelete(contract)}
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
      label: 'Activate',
      action: () => {
        // Bulk activate implementation
        console.log('Bulk activate contracts');
      },
      permission: 'crm:contract:record:update',
    },
    {
      label: 'Terminate',
      action: () => {
        // Bulk terminate implementation
        console.log('Bulk terminate contracts');
      },
      permission: 'crm:contract:record:update',
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
      data={contracts}
      columns={columns}
      loading={isLoading}
      pagination={{
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: pagination.total,
        totalPages: pagination.totalPages,
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
      searchPlaceholder="Search contracts..."
      onSearch={(search) => {
        onFiltersChange({ ...filters, search, page: 1 });
      }}
    />
  );
};
