/**
 * Sales Page - Enterprise Design
 * Main sales dashboard with statistics and deal management
 * Unified grid control with side drawer panels for CRUD operations
 */

import React, { useState, useMemo } from 'react';
import { Row, Col, Card, Button, Table, Input, Select, Space, Tag, Popconfirm, message, Empty, Typography, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { TrendingUp, DollarSign, Target, BarChart3 } from 'lucide-react';
import { Deal } from '@/types/crm';
import { PageHeader, StatCard } from '@/components/common';
import { ViewModeSelector, KanbanBoard } from '@/components/ui/view-modes';
import { SalesDealDetailPanel } from '../components/SalesDealDetailPanel';
import { SalesDealFormPanel } from '../components/SalesDealFormPanel';
import { useSalesStats, useDeals, useDeleteDeal, useUpdateDealStage } from '../hooks/useSales';
import { useSalesStore } from '../store/salesStore';
import { useAuth } from '@/contexts/AuthContext';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

export const SalesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { filters, setFilters } = useSalesStore();
  const [searchText, setSearchText] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [currentView, setCurrentView] = useState<'table' | 'kanban'>('table');

  // Drawer states
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view' | null>(null);

  // Queries
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useSalesStats();
  const { data: dealsData, isLoading: dealsLoading, refetch: refetchDeals } = useDeals(filters);
  const deleteDeal = useDeleteDeal();
  const updateDealStage = useUpdateDealStage();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleRefresh = () => {
    refetchStats();
    refetchDeals();
    message.success('Data refreshed successfully');
  };

  const handleCreate = () => {
    setSelectedDeal(null);
    setDrawerMode('create');
  };

  const handleEdit = (deal: Deal) => {
    setSelectedDeal(deal);
    setDrawerMode('edit');
  };

  const handleView = (deal: Deal) => {
    setSelectedDeal(deal);
    setDrawerMode('view');
  };

  const handleDelete = async (deal: Deal) => {
    try {
      await deleteDeal.mutateAsync(deal.id);
      message.success(`Deal "${deal.title}" deleted successfully`);
      refetchDeals();
      refetchStats();
    } catch (error) {
      message.error('Failed to delete deal');
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setFilters({ ...filters, search: value, page: 1 });
  };

  const handleStageFilterChange = (value: string) => {
    setStageFilter(value);
    const stageValue: string | undefined = value === 'all' ? undefined : value;
    setFilters({ ...filters, stage: stageValue, page: 1 });
  };

  const handleViewChange = (view: 'table' | 'kanban') => {
    setCurrentView(view);
  };

  // Kanban board data
  const kanbanColumns = useMemo(() => {
    const deals = dealsData?.data || [];
    const columns = [
      {
        id: 'lead',
        title: 'Lead',
        color: '#fbbf24', // yellow
        items: deals.filter(deal => deal.stage === 'lead').map(deal => ({
          id: deal.id,
          title: deal.title,
          status: deal.status,
          priority: 'medium', // Default priority
          assignee: deal.assigned_to_name || 'Unassigned',
          dueDate: deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : undefined,
        })),
      },
      {
        id: 'qualified',
        title: 'Qualified',
        color: '#3b82f6', // blue
        items: deals.filter(deal => deal.stage === 'qualified').map(deal => ({
          id: deal.id,
          title: deal.title,
          status: deal.status,
          priority: 'medium',
          assignee: deal.assigned_to_name || 'Unassigned',
          dueDate: deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : undefined,
        })),
      },
      {
        id: 'proposal',
        title: 'Proposal',
        color: '#8b5cf6', // purple
        items: deals.filter(deal => deal.stage === 'proposal').map(deal => ({
          id: deal.id,
          title: deal.title,
          status: deal.status,
          priority: 'high',
          assignee: deal.assigned_to_name || 'Unassigned',
          dueDate: deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : undefined,
        })),
      },
      {
        id: 'negotiation',
        title: 'Negotiation',
        color: '#f59e0b', // amber
        items: deals.filter(deal => deal.stage === 'negotiation').map(deal => ({
          id: deal.id,
          title: deal.title,
          status: deal.status,
          priority: 'high',
          assignee: deal.assigned_to_name || 'Unassigned',
          dueDate: deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : undefined,
        })),
      },
      {
        id: 'closed_won',
        title: 'Closed Won',
        color: '#10b981', // green
        items: deals.filter(deal => deal.stage === 'closed_won').map(deal => ({
          id: deal.id,
          title: deal.title,
          status: deal.status,
          priority: 'low',
          assignee: deal.assigned_to_name || 'Unassigned',
          dueDate: deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : undefined,
        })),
      },
      {
        id: 'closed_lost',
        title: 'Closed Lost',
        color: '#ef4444', // red
        items: deals.filter(deal => deal.stage === 'closed_lost').map(deal => ({
          id: deal.id,
          title: deal.title,
          status: deal.status,
          priority: 'low',
          assignee: deal.assigned_to_name || 'Unassigned',
          dueDate: deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : undefined,
        })),
      },
    ];

    return columns;
  }, [dealsData]);

  const handleKanbanItemMove = async (itemId: string, fromColumn: string, toColumn: string) => {
    try {
      // Update the deal stage
      await updateDealStage.mutateAsync({
        id: itemId,
        stage: toColumn
      });
      message.success('Deal stage updated successfully');
      refetchDeals();
      refetchStats();
    } catch (error) {
      message.error('Failed to update deal stage');
      console.error('Kanban move error:', error);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'lead': return 'default';
      case 'qualified': return 'processing';
      case 'proposal': return 'warning';
      case 'negotiation': return 'warning';
      case 'closed_won': return 'green';
      case 'closed_lost': return 'red';
      default: return 'default';
    }
  };

  // Table columns
  const columns: ColumnsType<Deal> = [
    {
      title: 'Deal Name',
      key: 'title',
      dataIndex: 'title',
      width: 200,
      render: (text) => <div style={{ fontWeight: 500 }}>{text}</div>,
    },
    {
      title: 'Customer',
      key: 'customer',
      dataIndex: 'customer_name',
      width: 150,
    },
    {
      title: 'Value',
      key: 'value',
      dataIndex: 'value',
      width: 120,
      render: (value) => <div style={{ fontWeight: 500 }}>{formatCurrency(value)}</div>,
    },
    {
      title: 'Stage',
      key: 'stage',
      dataIndex: 'stage',
      width: 120,
      render: (stage) => (
        <Tag color={getStageColor(stage)}>
          {stage?.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Owner',
      key: 'owner',
      dataIndex: 'assigned_to_name',
      width: 130,
    },
    {
      title: 'Expected Close',
      key: 'expected_close',
      dataIndex: 'expected_close_date',
      width: 130,
      render: (date, record) => {
        console.log('[SalesPage Grid] Expected Close Date Debug:', {
          field: 'expected_close_date',
          value: date,
          dealId: record.id,
          dealTitle: record.title,
          allRecordFields: Object.keys(record),
        });
        return date ? new Date(date).toLocaleDateString() : '-';
      },
    },
    {
      title: 'Status',
      key: 'status',
      dataIndex: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'won' ? 'green' : status === 'lost' ? 'red' : status === 'open' ? 'blue' : 'default'}>
          {status?.toUpperCase() || 'OPEN'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            View
          </Button>
          {hasPermission('crm:sales:deal:update') && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              Edit
            </Button>
          )}
          {hasPermission('crm:sales:deal:delete') && (
            <Popconfirm
              title="Delete Deal"
              description={`Are you sure you want to delete "${record.title}"?`}
              onConfirm={() => handleDelete(record)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Sales Dashboard"
        description="Track your sales performance and manage your pipeline"
        breadcrumb={{
          items: [
            { title: 'Dashboard', path: '/tenant/dashboard' },
            { title: 'Sales' }
          ]
        }}
        extra={
          <>
            <ViewModeSelector
              currentView={currentView}
              onViewChange={handleViewChange}
            />
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              Refresh
            </Button>
            {hasPermission('crm:sales:deal:create') && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                New Deal
              </Button>
            )}
          </>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Deals"
              value={stats?.total || 0}
              description="Active deals in pipeline"
              icon={Target}
              color="primary"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Value"
              value={formatCurrency(stats?.totalValue || 0)}
              description="Combined deal value"
              icon={DollarSign}
              color="success"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Conversion Rate"
              value={`${(stats?.conversionRate || 0).toFixed(1)}%`}
              description="Deals closed won"
              icon={TrendingUp}
              color={stats?.conversionRate && stats.conversionRate > 20 ? 'success' : 'warning'}
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Avg Deal Size"
              value={formatCurrency(stats?.averageDealSize || 0)}
              description="Average deal value"
              icon={BarChart3}
              color="info"
              loading={statsLoading}
            />
          </Col>
        </Row>

        {/* Stage Breakdown */}
        {stats?.byStage && (
          <div style={{ marginBottom: 24 }}>
            <Title level={4} style={{ marginBottom: 16 }}>Pipeline by Stage</Title>
            <Row gutter={[16, 16]}>
              {Object.entries(stats.byStage).map(([stage, count]) => (
                <Col xs={24} sm={12} md={8} lg={4} key={stage}>
                  <Card
                    style={{
                      borderRadius: 8,
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Tag color={getStageColor(stage)}>{stage.replace('_', ' ').toUpperCase()}</Tag>
                      <span style={{ fontWeight: 600, fontSize: 16 }}>{count}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1890ff' }}>
                      {formatCurrency(stats.byStageValue?.[stage] || 0)}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* Conditional View Rendering */}
        {currentView === 'table' ? (
          /* Deals Table */
          <Card
            style={{
              borderRadius: 8,
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Search and Filters */}
            <Space style={{ marginBottom: 16, width: '100%' }} direction="vertical">
              <Space.Compact style={{ width: '100%' }}>
                <Search
                  placeholder="Search deals by name, customer, or owner..."
                  allowClear
                  enterButton={<SearchOutlined />}
                  size="large"
                  onSearch={handleSearch}
                  style={{ flex: 1 }}
                />
                <Select
                  value={stageFilter}
                  onChange={handleStageFilterChange}
                  style={{ width: 150 }}
                  size="large"
                >
                  <Option value="all">All Stages</Option>
                  <Option value="lead">Lead</Option>
                  <Option value="qualified">Qualified</Option>
                  <Option value="proposal">Proposal</Option>
                  <Option value="negotiation">Negotiation</Option>
                  <Option value="closed_won">Closed Won</Option>
                  <Option value="closed_lost">Closed Lost</Option>
                </Select>
              </Space.Compact>
            </Space>

            {/* Table */}
            <Table
              columns={columns}
              dataSource={dealsData?.data || []}
              loading={dealsLoading}
              pagination={{
                current: filters.page || 1,
                pageSize: filters.pageSize || 20,
                total: dealsData?.total || 0,
                showSizeChanger: true,
                showQuickJumper: true,
                onChange: (page, pageSize) => {
                  setFilters({ ...filters, page, pageSize });
                },
              }}
              rowKey="id"
              locale={{
                emptyText: <Empty description="No deals found" style={{ marginTop: 48, marginBottom: 48 }} />,
              }}
            />
          </Card>
        ) : (
          /* Kanban Board */
          <div style={{ marginTop: 24 }}>
            {dealsLoading ? (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" tip="Loading pipeline..." />
              </div>
            ) : (
              <KanbanBoard
                columns={kanbanColumns}
                onItemMove={handleKanbanItemMove}
              />
            )}
          </div>
        )}
      </div>

      {/* Detail Panel (View) */}
      <SalesDealDetailPanel
        visible={drawerMode === 'view'}
        deal={selectedDeal}
        onClose={() => setDrawerMode(null)}
        onEdit={() => setDrawerMode('edit')}
      />

      {/* Form Panel (Create/Edit) */}
      <SalesDealFormPanel
        visible={drawerMode === 'create' || drawerMode === 'edit'}
        deal={drawerMode === 'edit' ? selectedDeal : null}
        onClose={() => setDrawerMode(null)}
        onSuccess={() => {
          setDrawerMode(null);
          refetchDeals();
          refetchStats();
        }}
      />
    </>
  );
};
