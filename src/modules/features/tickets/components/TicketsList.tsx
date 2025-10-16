/**
 * Tickets List Component
 * Displays tickets in a table format with filtering and actions
 */

import React, { useState } from 'react';
import { Ticket } from '@/types/crm';
import { DataTable } from '@/modules/shared/components/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useTicketStore } from '../store/ticketStore';
import { useTickets, useDeleteTicket, useBulkTickets, useExportTickets } from '../hooks/useTickets';
import { useAuth } from '@/contexts/AuthContext';

interface TicketsListProps {
  onCreateTicket?: () => void;
  onEditTicket?: (ticket: Ticket) => void;
  onViewTicket?: (ticket: Ticket) => void;
}

export const TicketsList: React.FC<TicketsListProps> = ({
  onCreateTicket,
  onEditTicket,
  onViewTicket,
}) => {
  const { hasPermission } = useAuth();
  const {
    tickets,
    isLoading,
    filters,
    searchQuery,
    selectedStatus,
    selectedPriority,
    selectedTickets,
    pagination,
    setSearchQuery,
    setSelectedStatus,
    setSelectedPriority,
    setSelectedTickets,
    toggleTicketSelection,
    selectAllTickets,
    clearSelection,
  } = useTicketStore();

  const { refetch } = useTickets(filters);
  const deleteTicket = useDeleteTicket();
  const { bulkUpdate, bulkDelete } = useBulkTickets();
  const exportTickets = useExportTickets();

  const [showFilters, setShowFilters] = useState(false);

  const getStatusBadge = (status: string) => {
    const variants = {
      open: { color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      closed: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    };
    
    const config = variants[status as keyof typeof variants] || variants.open;
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

  const handleDeleteTicket = async (ticket: Ticket) => {
    if (!hasPermission('delete')) {
      alert('You do not have permission to delete tickets');
      return;
    }

    if (confirm(`Are you sure you want to delete "${ticket.title}"?`)) {
      deleteTicket.mutate(ticket.id);
    }
  };

  const handleBulkDelete = async () => {
    if (!hasPermission('delete')) {
      alert('You do not have permission to delete tickets');
      return;
    }

    if (confirm(`Are you sure you want to delete ${selectedTickets.length} tickets?`)) {
      bulkDelete.mutate(selectedTickets);
    }
  };

  const handleExport = () => {
    exportTickets.mutate('csv');
  };

  const columns = [
    {
      key: 'title',
      header: 'Ticket',
      sortable: true,
      render: (ticket: Ticket) => (
        <div className="font-medium">
          {ticket.title}
          {ticket.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {ticket.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'customer_name',
      header: 'Customer',
      sortable: true,
      render: (ticket: Ticket) => ticket.customer_name || 'N/A',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (ticket: Ticket) => getStatusBadge(ticket.status || 'open'),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (ticket: Ticket) => getPriorityBadge(ticket.priority || 'medium'),
    },
    {
      key: 'assigned_to_name',
      header: 'Assigned To',
      sortable: true,
      render: (ticket: Ticket) => ticket.assigned_to_name || 'Unassigned',
    },
    {
      key: 'due_date',
      header: 'Due Date',
      sortable: true,
      render: (ticket: Ticket) => {
        if (!ticket.due_date) return 'N/A';
        const dueDate = new Date(ticket.due_date);
        const isOverdue = dueDate < new Date() && 
          ticket.status !== 'resolved' && ticket.status !== 'closed';
        
        return (
          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
            {dueDate.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (ticket: Ticket) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onViewTicket?.(ticket)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            {hasPermission('write') && (
              <DropdownMenuItem onClick={() => onEditTicket?.(ticket)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Ticket
              </DropdownMenuItem>
            )}
            {hasPermission('delete') && (
              <DropdownMenuItem 
                onClick={() => handleDeleteTicket(ticket)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Ticket
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
          <h2 className="text-2xl font-bold">Support Tickets</h2>
          <p className="text-gray-600">
            Manage customer support requests and track resolution progress
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
            disabled={exportTickets.isPending}
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
            <Button onClick={onCreateTicket}>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        data={tickets}
        columns={columns}
        loading={isLoading}
        pagination={{
          page: pagination?.currentPage || 1,
          pageSize: pagination?.pageSize || 20,
          total: pagination?.totalCount || 0,
          totalPages: pagination?.totalPages || 0,
        }}
        selection={{
          selectedIds: selectedTickets,
          onSelectionChange: setSelectedTickets,
          onSelectAll: selectAllTickets,
          onClearSelection: clearSelection,
        }}
        bulkActions={bulkActions}
        emptyState={{
          title: 'No tickets found',
          description: 'Get started by creating your first support ticket',
          action: hasPermission('write') ? (
            <Button onClick={onCreateTicket}>
              <Plus className="h-4 w-4 mr-2" />
              Create Ticket
            </Button>
          ) : undefined,
        }}
      />
    </div>
  );
};
