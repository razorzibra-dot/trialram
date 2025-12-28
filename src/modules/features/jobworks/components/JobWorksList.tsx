/**
 * JobWorks List Component
 * Displays job works in a table format with filtering and actions
 */

import React from 'react';
import { DataTable } from '@/modules/shared/components/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatters';
import { 
  Plus, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useJobWorks, useDeleteJobWork } from '../hooks/useJobWorks';
import { JobWork } from '../services/jobWorksService';
import { useAuth } from '@/contexts/AuthContext';

interface JobWorksListProps {
  onCreateJobWork?: () => void;
  onEditJobWork?: (jobWork: JobWork) => void;
  onViewJobWork?: (jobWork: JobWork) => void;
}

export const JobWorksList: React.FC<JobWorksListProps> = ({
  onCreateJobWork,
  onEditJobWork,
  onViewJobWork,
}) => {
  const { hasPermission } = useAuth();
  const { data: response, isLoading } = useJobWorks();
  const deleteJobWork = useDeleteJobWork();

  const jobWorks = response?.data || [];

  const getStatusBadge = (status: string) => {
    if (!status) {
      status = 'pending'; // Default status if undefined
    }
    
    const variants = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;
    
    return (
      <div className="flex items-center gap-2">
        <Icon className="h-3 w-3" />
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
          {status.replace('_', ' ')}
        </span>
      </div>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    
    const color = variants[priority as keyof typeof variants] || variants.medium;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {priority}
      </span>
    );
  };

  const handleDeleteJobWork = async (jobWork: JobWork) => {
    if (!hasPermission('delete')) {
      alert('You do not have permission to delete job works');
      return;
    }

    if (confirm(`Are you sure you want to delete "${jobWork.title}"?`)) {
      deleteJobWork.mutate(jobWork.id);
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Job Work',
      sortable: true,
      render: (jobWork: JobWork) => (
        <div className="font-medium">
          {jobWork.title}
          {jobWork.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {jobWork.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'customer_name',
      header: 'Customer',
      sortable: true,
      render: (jobWork: JobWork) => jobWork.customer_name || 'N/A',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (jobWork: JobWork) => getStatusBadge(jobWork.status),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (jobWork: JobWork) => getPriorityBadge(jobWork.priority),
    },
    {
      key: 'assigned_to_name',
      header: 'Assigned To',
      sortable: true,
      render: (jobWork: JobWork) => jobWork.assigned_to_name || 'Unassigned',
    },
    {
      key: 'due_date',
      header: 'Due Date',
      sortable: true,
      render: (jobWork: JobWork) => {
        if (!jobWork.due_date) return 'N/A';
        const dueDate = new Date(jobWork.due_date);
        const isOverdue = dueDate < new Date() && 
          jobWork.status !== 'completed' && jobWork.status !== 'cancelled';
        
        return (
          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
            {dueDate.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      key: 'cost',
      header: 'Cost',
      sortable: true,
      render: (jobWork: JobWork) => formatCurrency(jobWork.cost || 0),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (jobWork: JobWork) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onViewJobWork?.(jobWork)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            {hasPermission('write') && (
              <DropdownMenuItem onClick={() => onEditJobWork?.(jobWork)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Job Work
              </DropdownMenuItem>
            )}
            {hasPermission('delete') && (
              <DropdownMenuItem 
                onClick={() => handleDeleteJobWork(jobWork)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Job Work
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Job Works</h2>
          <p className="text-gray-600">
            Manage and track job work assignments and progress
          </p>
        </div>
        <div className="flex gap-2">
          {hasPermission('write') && (
            <Button onClick={onCreateJobWork}>
              <Plus className="h-4 w-4 mr-2" />
              New Job Work
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={jobWorks}
        columns={columns}
        loading={isLoading}
        pagination={{
          page: response?.page || 1,
          pageSize: response?.pageSize || 20,
          total: response?.total || 0,
          totalPages: response?.totalPages || 0,
        }}
        emptyState={{
          title: 'No job works found',
          description: 'Get started by creating your first job work',
          action: hasPermission('write') ? (
            <Button onClick={onCreateJobWork}>
              <Plus className="h-4 w-4 mr-2" />
              Create Job Work
            </Button>
          ) : undefined,
        }}
      />
    </div>
  );
};
