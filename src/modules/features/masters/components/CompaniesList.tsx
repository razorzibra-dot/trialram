/**
 * Companies List Component
 * Displays companies in a data table with filtering and actions
 */

import React, { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Edit, 
  Trash2, 
  Eye, 
  Globe, 
  Mail, 
  Phone, 
  MapPin,
  MoreHorizontal 
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
import { Company, CompanyFilters } from '@/types/masters';
import { 
  useCompanies, 
  useDeleteCompany, 
  useUpdateCompanyStatus,
  useBulkCompanyOperations,
  useExportCompanies 
} from '../hooks/useCompanies';

interface CompaniesListProps {
  filters: CompanyFilters;
  onFiltersChange: (filters: CompanyFilters) => void;
  onEdit?: (company: Company) => void;
  onView?: (company: Company) => void;
}

export const CompaniesList: React.FC<CompaniesListProps> = ({
  filters,
  onFiltersChange,
  onEdit,
  onView,
}) => {
  const { hasPermission } = useAuth();
  const [selectedRows, setSelectedRows] = useState<Company[]>([]);

  // Queries and mutations
  const { data: companiesData, isLoading } = useCompanies(filters);
  const deleteCompany = useDeleteCompany();
  const updateStatus = useUpdateCompanyStatus();
  const { bulkUpdate, bulkDelete } = useBulkCompanyOperations();
  const exportCompanies = useExportCompanies();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'prospect':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSizeColor = (size: string) => {
    switch (size) {
      case 'startup':
        return 'bg-purple-100 text-purple-800';
      case 'small':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'large':
        return 'bg-orange-100 text-orange-800';
      case 'enterprise':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = async (company: Company) => {
    if (window.confirm(`Are you sure you want to delete ${company.name}?`)) {
      await deleteCompany.mutateAsync(company.id);
    }
  };

  const handleStatusChange = async (company: Company, newStatus: string) => {
    await updateStatus.mutateAsync({ id: company.id, status: newStatus });
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedRows.length} companies?`)) {
      const ids = selectedRows.map(company => company.id);
      await bulkDelete.mutateAsync(ids);
      setSelectedRows([]);
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedRows.length === 0) return;
    
    const ids = selectedRows.map(company => company.id);
    await bulkUpdate.mutateAsync({ ids, updates: { status: status as any } });
    setSelectedRows([]);
  };

  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    await exportCompanies.mutateAsync(format);
  };

  const columns: ColumnDef<Company>[] = [
    {
      accessorKey: 'name',
      header: 'Company Name',
      cell: ({ row }) => {
        const company = row.original;
        return (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-900">{company.name}</div>
              <div className="text-sm text-gray-500">{company.industry}</div>
            </div>
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
      accessorKey: 'size',
      header: 'Size',
      cell: ({ row }) => {
        const size = row.getValue('size') as string;
        return (
          <Badge variant="outline" className={getSizeColor(size)}>
            {size?.charAt(0).toUpperCase() + size?.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Contact',
      cell: ({ row }) => {
        const company = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center text-sm">
              <Mail className="w-3 h-3 mr-1 text-gray-400" />
              <span className="truncate">{company.email}</span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Phone className="w-3 h-3 mr-1 text-gray-400" />
              <span>{company.phone}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'address',
      header: 'Location',
      cell: ({ row }) => {
        const address = row.getValue('address') as string;
        return (
          <div className="flex items-center text-sm">
            <MapPin className="w-3 h-3 mr-1 text-gray-400" />
            <span className="truncate max-w-xs" title={address}>
              {address}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'website',
      header: 'Website',
      cell: ({ row }) => {
        const website = row.getValue('website') as string;
        if (!website) return <span className="text-gray-400">-</span>;
        
        return (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <Globe className="w-3 h-3 mr-1" />
            <span className="truncate max-w-xs">
              {website.replace(/^https?:\/\//, '')}
            </span>
          </a>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const company = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onView?.(company)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {hasPermission('companies:update') && (
                <DropdownMenuItem onClick={() => onEdit?.(company)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {hasPermission('companies:update') && (
                <>
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange(company, 'active')}
                    disabled={company.status === 'active'}
                  >
                    Set Active
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange(company, 'inactive')}
                    disabled={company.status === 'inactive'}
                  >
                    Set Inactive
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange(company, 'prospect')}
                    disabled={company.status === 'prospect'}
                  >
                    Set Prospect
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {hasPermission('companies:delete') && (
                <DropdownMenuItem 
                  onClick={() => handleDelete(company)}
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
      permission: 'companies:update',
    },
    {
      label: 'Set Inactive',
      action: () => handleBulkStatusUpdate('inactive'),
      permission: 'companies:update',
    },
    {
      label: 'Set Prospect',
      action: () => handleBulkStatusUpdate('prospect'),
      permission: 'companies:update',
    },
    {
      label: 'Delete Selected',
      action: handleBulkDelete,
      permission: 'companies:delete',
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
      data={companiesData?.data || []}
      columns={columns}
      loading={isLoading}
      pagination={{
        page: companiesData?.page || 1,
        pageSize: companiesData?.pageSize || 20,
        total: companiesData?.total || 0,
        totalPages: companiesData?.totalPages || 1,
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
      searchPlaceholder="Search companies..."
      onSearch={(search) => {
        onFiltersChange({ ...filters, search, page: 1 });
      }}
    />
  );
};
