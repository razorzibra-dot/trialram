/**
 * Tickets Page - Modern Architecture
 * Enterprise-grade ticket management with Ant Design table and side drawers
 */

import React, { useState, useMemo } from 'react';
import { Table, Button, Space, Input, Select, Row, Col, Tag, Empty, Spin, Popconfirm, Card } from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { Ticket } from '@/types/crm';
import { PageHeader, StatCard } from '@/components/common';
import { TicketsDetailPanel } from '../components/TicketsDetailPanel';
import { TicketsFormPanel } from '../components/TicketsFormPanel';
import { useTickets, useTicketStats, useDeleteTicket } from '../hooks/useTickets';
import { useAuth } from '@/contexts/AuthContext';
import dayjs from 'dayjs';
import {
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

type DrawerMode = 'create' | 'edit' | 'view' | null;

/**
 * Status color mapping for tags
 */
const statusColors: Record<string, string> = {
  open: 'warning',
  in_progress: 'processing',
  resolved: 'success',
  closed: 'default',
  pending: 'warning',
};

/**
 * Priority color mapping for tags
 */
const priorityColors: Record<string, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
};

/**
 * Status icon mapping
 */
const statusIcons: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  open: AlertCircle,
  in_progress: Clock,
  resolved: CheckCircle,
  closed: XCircle,
};

export const TicketsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { data: ticketsData, isLoading: ticketsLoading } = useTickets();
  const { data: statsData, isLoading: statsLoading } = useTicketStats();
  const deleteTicket = useDeleteTicket();

  // State management
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>(undefined);
  const [sortedInfo, setSortedInfo] = useState<any>(null);

  // Filtered data based on search and filters
  const filteredTickets = useMemo(() => {
    let result = ticketsData?.data || [];

    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(search) ||
          ticket.description?.toLowerCase().includes(search) ||
          ticket.customer_name?.toLowerCase().includes(search) ||
          ticket.id.includes(search)
      );
    }

    if (statusFilter && statusFilter !== 'all') {
      result = result.filter((ticket) => ticket.status === statusFilter);
    }

    if (priorityFilter && priorityFilter !== 'all') {
      result = result.filter((ticket) => ticket.priority === priorityFilter);
    }

    return result;
  }, [ticketsData?.data, searchText, statusFilter, priorityFilter]);

  // Handler functions
  const handleCreateClick = () => {
    setSelectedTicket(null);
    setDrawerMode('create');
  };

  const handleViewClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setDrawerMode('view');
  };

  const handleEditClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setDrawerMode('edit');
  };

  const handleDeleteClick = async (ticket: Ticket) => {
    try {
      await deleteTicket.mutateAsync(ticket.id);
    } catch (error) {
      console.error('Error deleting ticket:', error);
    }
  };

  const handleDrawerClose = () => {
    setDrawerMode(null);
    setSelectedTicket(null);
  };

  const handleEditFromDetail = () => {
    setDrawerMode('edit');
  };

  // Table columns configuration
  const columns = [
    {
      title: 'Ticket ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{id.substring(0, 8)}</span>,
      sorter: (a: Ticket, b: Ticket) => a.id.localeCompare(b.id),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (text: string, record: Ticket) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          {record.description && (
            <div style={{ fontSize: 12, color: '#666', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {record.description}
            </div>
          )}
        </div>
      ),
      sorter: (a: Ticket, b: Ticket) => a.title.localeCompare(b.title),
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 150,
      render: (text: string) => text || <span style={{ color: '#999' }}>Unassigned</span>,
      sorter: (a: Ticket, b: Ticket) => (a.customer_name || '').localeCompare(b.customer_name || ''),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <Tag color={statusColors[status || 'open']} style={{ fontSize: 12, padding: '4px 12px' }}>
          {(status || 'open').replace('_', ' ').toUpperCase()}
        </Tag>
      ),
      sorter: (a: Ticket, b: Ticket) => (a.status || '').localeCompare(b.status || ''),
      filters: [
        { text: 'Open', value: 'open' },
        { text: 'In Progress', value: 'in_progress' },
        { text: 'Resolved', value: 'resolved' },
        { text: 'Closed', value: 'closed' },
      ],
      onFilter: (value: any, record: Ticket) => record.status === value,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 110,
      render: (priority: string) => (
        <Tag color={priorityColors[priority || 'medium']} style={{ fontSize: 12, padding: '4px 12px' }}>
          {(priority || 'medium').toUpperCase()}
        </Tag>
      ),
      sorter: (a: Ticket, b: Ticket) => (a.priority || '').localeCompare(b.priority || ''),
      filters: [
        { text: 'Low', value: 'low' },
        { text: 'Medium', value: 'medium' },
        { text: 'High', value: 'high' },
        { text: 'Urgent', value: 'urgent' },
      ],
      onFilter: (value: any, record: Ticket) => record.priority === value,
    },
    {
      title: 'Assigned To',
      dataIndex: 'assigned_to_name',
      key: 'assigned_to_name',
      width: 130,
      render: (text: string) => text || <span style={{ color: '#999' }}>Unassigned</span>,
      sorter: (a: Ticket, b: Ticket) => (a.assigned_to_name || '').localeCompare(b.assigned_to_name || ''),
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 130,
      render: (due_date: string | undefined, record: Ticket) => {
        if (!due_date) return <span style={{ color: '#999' }}>—</span>;
        const isOverdue =
          new Date(due_date) < new Date() && record.status !== 'resolved' && record.status !== 'closed';
        return (
          <span style={{ color: isOverdue ? '#dc2626' : '#000', fontWeight: isOverdue ? 500 : 'normal' }}>
            {dayjs(due_date).format('MMM DD, YYYY')}
          </span>
        );
      },
      sorter: (a: Ticket, b: Ticket) => {
        const dateA = a.due_date ? new Date(a.due_date).getTime() : 0;
        const dateB = b.due_date ? new Date(b.due_date).getTime() : 0;
        return dateA - dateB;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: Ticket) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewClick(record)}
            title="View"
          />
          {hasPermission('tickets:update') && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditClick(record)}
              title="Edit"
            />
          )}
          {hasPermission('tickets:delete') && (
            <Popconfirm
              title="Delete ticket?"
              description={`Are you sure you want to delete "${record.title}"?`}
              onConfirm={() => handleDeleteClick(record)}
              okText="Delete"
              okType="danger"
              cancelText="Cancel"
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} title="Delete" />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Support Tickets"
        description="Manage customer support requests and track resolution progress"
        breadcrumb={{
          items: [
            { title: 'Home', path: '/tenant/dashboard' },
            { title: 'Support Tickets' },
          ],
        }}
        extra={
          hasPermission('tickets:create') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateClick}>
              New Ticket
            </Button>
          )
        }
      />

      <div style={{ padding: 24 }}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Tickets"
              value={statsData?.total || 0}
              description="All support tickets"
              icon={AlertCircle}
              color="primary"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Open Tickets"
              value={statsData?.openTickets || 0}
              description="Awaiting resolution"
              icon={Clock}
              color="warning"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Resolved This Month"
              value={statsData?.resolvedToday || 0}
              description="Closed this month"
              icon={CheckCircle}
              color="success"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Overdue Tickets"
              value={statsData?.overdueTickets || 0}
              description="Past due date"
              icon={XCircle}
              color="error"
              loading={statsLoading}
            />
          </Col>
        </Row>

        {/* Search and Filters */}
        <Space style={{ marginBottom: 16, width: '100%' }} direction="vertical">
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="Search by title, customer, or ID..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Filter by status"
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              options={[
                { label: 'All Statuses', value: 'all' },
                { label: 'Open', value: 'open' },
                { label: 'In Progress', value: 'in_progress' },
                { label: 'Resolved', value: 'resolved' },
                { label: 'Closed', value: 'closed' },
              ]}
            />
            <Select
              placeholder="Filter by priority"
              allowClear
              value={priorityFilter}
              onChange={setPriorityFilter}
              style={{ width: 150 }}
              options={[
                { label: 'All Priorities', value: 'all' },
                { label: 'Low', value: 'low' },
                { label: 'Medium', value: 'medium' },
                { label: 'High', value: 'high' },
                { label: 'Urgent', value: 'urgent' },
              ]}
            />
          </Space.Compact>
        </Space>

        {/* Tickets Table */}
        <Card
          style={{
            borderRadius: 8,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Spin spinning={ticketsLoading}>
            <Table
              columns={columns}
              dataSource={filteredTickets}
              rowKey="id"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total ${total} tickets`,
                pageSizeOptions: ['10', '20', '50', '100'],
              }}
              scroll={{ x: 1200 }}
              locale={{
                emptyText: (
                  <Empty
                    description="No tickets found"
                    style={{ marginTop: 48, marginBottom: 48 }}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ),
              }}
              onChange={(_, __, sorter) => setSortedInfo(sorter)}
            />
          </Spin>
        </Card>
      </div>

      {/* Detail Drawer */}
      <TicketsDetailPanel
        ticket={selectedTicket}
        isOpen={drawerMode === 'view'}
        isLoading={ticketsLoading}
        onClose={handleDrawerClose}
        onEdit={handleEditFromDetail}
      />

      {/* Form Drawer */}
      <TicketsFormPanel
        ticket={drawerMode === 'edit' ? selectedTicket : null}
        mode={drawerMode === 'create' ? 'create' : 'edit'}
        isOpen={drawerMode === 'create' || drawerMode === 'edit'}
        onClose={handleDrawerClose}
      />
    </>
  );
};

export default TicketsPage;