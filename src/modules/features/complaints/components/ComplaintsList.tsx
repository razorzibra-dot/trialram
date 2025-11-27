/**
 * Complaints List Component
 * Displays complaints in a data table with filtering and actions
 */

import React, { useMemo, useState, useCallback } from 'react';
import { DataTable, Column } from '@/modules/shared/components/DataTable';
import { useComplaints, useDeleteComplaint, useBulkComplaints, useComplaintExport } from '../hooks/useComplaints';
import { Complaint, ComplaintFilters } from '@/types/complaints';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDate } from '@/modules/core/utils';
import { Edit, Trash2, Eye, MessageSquare, User } from 'lucide-react';

interface ComplaintsListProps {
  onCreateComplaint?: () => void;
  onEditComplaint?: (complaint: Complaint) => void;
  onViewComplaint?: (complaint: Complaint) => void;
}

export const ComplaintsList: React.FC<ComplaintsListProps> = ({
  onCreateComplaint,
  onEditComplaint,
  onViewComplaint,
}) => {
  const [filters, setFilters] = useState<ComplaintFilters>({});
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 });

  const { data, isLoading, refetch } = useComplaints(filters);
  const complaints = data || [];
  const deleteComplaint = useDeleteComplaint();
  const { bulkDelete } = useBulkComplaints();
  const exportComplaints = useComplaintExport();

  const [selectedComplaintIds, setSelectedComplaintIds] = useState<string[]>([]);

  // Define table columns
  const columns: Column<Complaint>[] = useMemo(() => [
    {
      key: 'complaint',
      title: 'Complaint',
      render: (_, complaint) => (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {complaint.title.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-gray-900 max-w-xs truncate">
              {complaint.title}
            </div>
            <div className="text-sm text-gray-500 max-w-xs truncate">
              {complaint.description}
            </div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'type',
      title: 'Type',
      dataIndex: 'type',
      render: (type) => (
        <Badge variant="outline">
          {typeof type === 'string' ? type.replace('_', ' ').toUpperCase() : 'Unknown'}
        </Badge>
      ),
      sortable: true,
      filterable: true,
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'status',
      render: (status) => {
        const statusColors = {
          new: 'bg-blue-100 text-blue-800',
          in_progress: 'bg-yellow-100 text-yellow-800',
          resolved: 'bg-green-100 text-green-800',
          closed: 'bg-gray-100 text-gray-800',
        };

        return (
          <Badge className={statusColors[status as keyof typeof statusColors] || ''}>
            {typeof status === 'string' ? status.replace('_', ' ').toUpperCase() : 'Unknown'}
          </Badge>
        );
      },
      sortable: true,
      filterable: true,
    },
    {
      key: 'priority',
      title: 'Priority',
      dataIndex: 'priority',
      render: (priority) => {
        const priorityColors = {
          low: 'bg-gray-100 text-gray-800',
          medium: 'bg-blue-100 text-blue-800',
          high: 'bg-orange-100 text-orange-800',
          urgent: 'bg-red-100 text-red-800',
        };

        return (
          <Badge className={priorityColors[priority as keyof typeof priorityColors] || ''}>
            {typeof priority === 'string' ? priority.toUpperCase() : 'Unknown'}
          </Badge>
        );
      },
      sortable: true,
      filterable: true,
    },
    {
      key: 'assigned_engineer',
      title: 'Assigned To',
      dataIndex: 'assigned_engineer_id',
      render: (assignedEngineerId) => (
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-gray-400" />
          <span>{assignedEngineerId ? 'Assigned' : 'Unassigned'}</span>
        </div>
      ),
    },
    {
      key: 'comments_count',
      title: 'Comments',
      render: (_, complaint) => (
        <div className="flex items-center space-x-1">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <span>{complaint.comments?.length || 0}</span>
        </div>
      ),
    },
    {
      key: 'created_at',
      title: 'Created',
      dataIndex: 'created_at',
      render: (date) => typeof date === 'string' ? formatDate(date) : '—',
      sortable: true,
    },
  ], []);

  // Handle pagination
  const handlePaginationChange = useCallback((page: number, pageSize: number) => {
    setFilters(prev => ({
      ...prev,
      page,
      pageSize
    }));
  }, []);

  // Handle search
  const handleSearch = useCallback((search: string) => {
    setFilters(prev => ({
      ...prev,
      search,
      page: 1 // Reset to first page
    }));
  }, []);

  // Handle selection
  const handleSelectionChange = useCallback((selectedRowKeys: string[]) => {
    setSelectedComplaintIds(selectedRowKeys);
  }, []);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedComplaintIds.length === 0) return;

    if (confirm(`Are you sure you want to delete ${selectedComplaintIds.length} complaints?`)) {
      await bulkDelete.mutateAsync(selectedComplaintIds);
      setSelectedComplaintIds([]); // Clear selection after bulk delete
      refetch(); // Refetch data after deletion
    }
  }, [selectedComplaintIds, bulkDelete, refetch]);

  // Handle export
  const handleExport = useCallback(async (format: 'csv' | 'json' = 'csv') => {
    try {
      const result = await exportComplaints.mutateAsync(format);
      if (result) {
        // Create and download file
        const blob = new Blob([result], {
          type: format === 'csv' ? 'text/csv' : 'application/json'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `complaints.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }, [exportComplaints]);

  // Row actions
  const getRowActions = useCallback((complaint: Complaint) => [
    {
      label: 'View',
      icon: <Eye className="w-4 h-4" />,
      onClick: () => onViewComplaint?.(complaint),
    },
    {
      label: 'Edit',
      icon: <Edit className="w-4 h-4" />,
      onClick: () => onEditComplaint?.(complaint),
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => {
        if (confirm('Are you sure you want to delete this complaint?')) {
          deleteComplaint.mutate(complaint.id, {
            onSuccess: () => {
              refetch(); // Refetch data after deletion
            },
          });
        }
      },
    },
  ], [onViewComplaint, onEditComplaint, deleteComplaint, refetch]);

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedComplaintIds.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-900">
            {selectedComplaintIds.length} complaint(s) selected
          </span>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDelete.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns as any}
        data={complaints as any}
        loading={isLoading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: 100, // Mock total - in real implementation this would come from API
          onChange: handlePaginationChange,
        }}
        selection={{
          selectedRowKeys: selectedComplaintIds,
          onChange: handleSelectionChange as any,
        }}
        search={{
          value: filters.search || '',
          placeholder: 'Search complaints...',
          onChange: handleSearch,
        }}
        actions={{
          onCreate: onCreateComplaint,
          onExport: () => handleExport('csv'),
          rowActions: getRowActions as any,
        }}
        rowKey="id"
        className="bg-white"
      />
    </div>
  );
};