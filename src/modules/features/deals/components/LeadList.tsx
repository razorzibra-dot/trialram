/**
 * Lead List Component - Enterprise Design
 * Comprehensive lead listing with filtering, sorting, and bulk operations
 */

import React, { useState, useMemo } from 'react';
import {
  Table,
  Input,
  Select,
  Space,
  Button,
  Tag,
  Popconfirm,
  Tooltip,
  Empty,
  Row,
  Col,
  Card,
  Typography,
  Dropdown,
} from 'antd';
import type { ColumnsType, MenuProps } from 'antd/es/table';
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  StarOutlined,
  StarFilled,
  FilterOutlined,
  CalculatorOutlined,
  UserAddOutlined,
  SwapOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { LeadDTO } from '@/types/dtos';
import { useLeads, useDeleteLead, useUpdateLeadScore, useAutoCalculateLeadScore, useAutoAssignLead, useConvertLeadToCustomer } from '../hooks/useLeads';
import { useSessionConfig } from '@/contexts/SessionConfigContext';
import backendConfig from '@/config/backendConfig';
import { useAuth } from '@/contexts/AuthContext';
import { useReferenceDataByCategory } from '@/hooks/useReferenceDataOptions';
import { useCurrentTenant } from '@/hooks/useCurrentTenant';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

interface LeadListProps {
  onViewLead?: (lead: LeadDTO) => void;
  onEditLead?: (lead: LeadDTO) => void;
  onCreateLead?: () => void;
}

export const LeadList: React.FC<LeadListProps> = ({
  onViewLead,
  onEditLead,
  onCreateLead
}) => {
  const { hasPermission } = useAuth();
  const { config } = useSessionConfig();
  const conversionMinScore = config.leadConversionMinScore ?? backendConfig.businessRules?.leadConversionMinScore ?? 55;
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [qualificationFilter, setQualificationFilter] = useState<string>('all');

  // Build filters object
  const filters = useMemo(() => ({
    search: searchText || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter as any,
    stage: stageFilter === 'all' ? undefined : stageFilter as any,
    qualificationStatus: qualificationFilter === 'all' ? undefined : qualificationFilter as any,
    page: 1,
    pageSize: 20,
    sortBy: 'createdAt' as const,
    sortDirection: 'desc' as const
  }), [searchText, statusFilter, stageFilter, qualificationFilter]);

  // Queries and mutations
  const { data: leadsData, isLoading, refetch } = useLeads(filters);
  const deleteLead = useDeleteLead();
  const updateLeadScore = useUpdateLeadScore();
  const autoCalculateScore = useAutoCalculateLeadScore();
  const autoAssignLead = useAutoAssignLead();
  const convertLead = useConvertLeadToCustomer();

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleStageFilterChange = (value: string) => {
    setStageFilter(value);
  };

  const handleQualificationFilterChange = (value: string) => {
    setQualificationFilter(value);
  };

  const handleDelete = async (lead: LeadDTO) => {
    // Notifications handled by useDeleteLead hook
    await deleteLead.mutateAsync(lead.id);
  };

  const handleScoreUpdate = async (lead: LeadDTO, newScore: number) => {
    // Notifications handled by useUpdateLeadScore hook
    await updateLeadScore.mutateAsync({ id: lead.id, score: newScore });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'blue';
      case 'contacted': return 'orange';
      case 'qualified': return 'green';
      case 'unqualified': return 'red';
      case 'converted': return 'purple';
      case 'lost': return 'gray';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'awareness': return 'blue';
      case 'interest': return 'cyan';
      case 'consideration': return 'orange';
      case 'intent': return 'gold';
      case 'evaluation': return 'purple';
      case 'purchase': return 'green';
      default: return 'default';
    }
  };

  const getQualificationColor = (status: string) => {
    switch (status) {
      case 'new': return 'default';
      case 'contacted': return 'blue';
      case 'qualified': return 'green';
      case 'unqualified': return 'red';
      default: return 'default';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'green';
    if (score >= 50) return 'orange';
    return 'red';
  };

  // ✅ Database-driven filter dropdowns for consistency
  const currentTenant = useCurrentTenant();
  const tenantId = currentTenant?.id;
  const { options: statusOptionsRef, isLoading: loadingStatuses } = useReferenceDataByCategory(tenantId, 'lead_status');
  const { options: stageOptionsRef, isLoading: loadingStages } = useReferenceDataByCategory(tenantId, 'lead_stage');
  const { options: qualificationOptionsRef, isLoading: loadingQualifications } = useReferenceDataByCategory(tenantId, 'lead_qualification');

  const formatPhone = (phone?: string) => {
    if (!phone) return '-';
    // Basic phone formatting
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  // Table columns
  const columns: ColumnsType<LeadDTO> = [
    {
      title: 'Name',
      key: 'name',
      width: 180,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserOutlined style={{ color: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.firstName} {record.lastName}
            </div>
            {record.companyName && (
              <div style={{ fontSize: 12, color: '#666' }}>
                {record.companyName}
              </div>
            )}
          </div>
        </div>
      ),
      sorter: true,
    },
    {
      title: 'Contact',
      key: 'contact',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <MailOutlined style={{ color: '#1890ff' }} />
            <span style={{ fontSize: 12 }}>{record.email || '-'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <PhoneOutlined style={{ color: '#52c41a' }} />
            <span style={{ fontSize: 12 }}>{formatPhone(record.phone)}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Score',
      key: 'leadScore',
      dataIndex: 'leadScore',
      width: 100,
      render: (score, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Tooltip title={`Click to update score`}>
            <Button
              type="text"
              size="small"
              icon={score >= 75 ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
              onClick={() => {
                const newScore = score >= 75 ? 50 : 85;
                handleScoreUpdate(record, newScore);
              }}
              style={{ padding: 0, width: 20, height: 20 }}
            />
          </Tooltip>
          <Tag color={getScoreColor(score)}>{score}</Tag>
        </div>
      ),
      sorter: true,
    },
    {
      title: 'Status',
      key: 'status',
      dataIndex: 'status',
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status?.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'New', value: 'new' },
        { text: 'Contacted', value: 'contacted' },
        { text: 'Qualified', value: 'qualified' },
        { text: 'Unqualified', value: 'unqualified' },
        { text: 'Converted', value: 'converted' },
        { text: 'Lost', value: 'lost' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Stage',
      key: 'stage',
      dataIndex: 'stage',
      width: 120,
      render: (stage) => (
        <Tag color={getStageColor(stage)}>
          {stage?.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Awareness', value: 'awareness' },
        { text: 'Interest', value: 'interest' },
        { text: 'Consideration', value: 'consideration' },
        { text: 'Intent', value: 'intent' },
        { text: 'Evaluation', value: 'evaluation' },
        { text: 'Purchase', value: 'purchase' },
      ],
      onFilter: (value, record) => record.stage === value,
    },
    {
      title: 'Qualification',
      key: 'qualificationStatus',
      dataIndex: 'qualificationStatus',
      width: 130,
      render: (status) => (
        <Tag color={getQualificationColor(status)}>
          {status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Source',
      key: 'source',
      dataIndex: 'source',
      width: 120,
      render: (source) => source || '-',
    },
    {
      title: 'Next Follow-up',
      key: 'nextFollowUp',
      dataIndex: 'nextFollowUp',
      width: 140,
      render: (date) => {
        if (!date) return '-';
        const followUpDate = new Date(date);
        const now = new Date();
        const isOverdue = followUpDate < now;

        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : 'inherit' }}>
            {followUpDate.toLocaleDateString()}
            {isOverdue && ' (Overdue)'}
          </span>
        );
      },
      sorter: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 80,
      align: 'center',
      render: (_, record) => {
        const menuItems: MenuProps['items'] = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: 'View Details',
            onClick: () => onViewLead?.(record),
          },
          hasPermission('crm:lead:record:update') && !record.convertedToCustomer && {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit Lead',
            onClick: () => onEditLead?.(record),
          },
          hasPermission('crm:lead:record:update') && !record.convertedToCustomer && {
            type: 'divider',
          },
          hasPermission('crm:lead:record:update') && !record.convertedToCustomer && {
            key: 'calculate',
            icon: <CalculatorOutlined />,
            label: 'Auto Calculate Score',
            onClick: () => autoCalculateScore.mutate(record.id),
            disabled: autoCalculateScore.isPending,
          },
          hasPermission('crm:lead:record:update') && !record.convertedToCustomer && {
            key: 'assign',
            icon: <UserAddOutlined />,
            label: 'Auto Assign',
            onClick: () => autoAssignLead.mutate(record.id),
            disabled: autoAssignLead.isPending,
          },
          hasPermission('crm:lead:record:update') && !record.convertedToCustomer && {
            type: 'divider',
          },
          hasPermission('crm:lead:record:update') && !record.convertedToCustomer && {
            key: 'convert',
            icon: <SwapOutlined />,
            label: (
              <Tooltip title={record.leadScore < conversionMinScore && !hasPermission('crm:lead:convert:override')
                ? `Requires score ≥ ${conversionMinScore} or override permission`
                : undefined
              }>
                {`Convert to Customer${record.leadScore < conversionMinScore && hasPermission('crm:lead:convert:override') ? ' (Override)' : ''}`}
              </Tooltip>
            ),
            onClick: () => convertLead.mutate({ leadId: record.id }),
            disabled: convertLead.isPending || (record.leadScore < conversionMinScore && !hasPermission('crm:lead:convert:override')),
          },
          hasPermission('crm:lead:record:delete') && {
            type: 'divider',
          },
          hasPermission('crm:lead:record:delete') && {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete Lead',
            danger: true,
            onClick: () => {
              // Show confirmation
              const confirmed = window.confirm(
                `Are you sure you want to delete "${record.firstName} ${record.lastName}"?`
              );
              if (confirmed) {
                handleDelete(record);
              }
            },
          },
        ].filter(Boolean);

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined style={{ fontSize: 16 }} />}
            />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div>
      {/* Filters and Search */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} lg={8}>
            <Search
              placeholder="Search leads by name, company, or email..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              style={{ width: '100%' }}
              size="large"
              loading={loadingStatuses}
            >
              <Option value="all">All Statuses</Option>
              {statusOptionsRef.map((opt) => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Select
              value={stageFilter}
              onChange={handleStageFilterChange}
              style={{ width: '100%' }}
              size="large"
              loading={loadingStages}
            >
              <Option value="all">All Stages</Option>
              {stageOptionsRef.map((opt) => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Select
              value={qualificationFilter}
              onChange={handleQualificationFilterChange}
              style={{ width: '100%' }}
              size="large"
              loading={loadingQualifications}
            >
              <Option value="all">All Qualifications</Option>
              {qualificationOptionsRef.map((opt) => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Button
              type="primary"
              size="large"
              onClick={onCreateLead}
              block
            >
              Create Lead
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Leads Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={leadsData?.data || []}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: leadsData?.page || 1,
            pageSize: leadsData?.pageSize || 20,
            total: leadsData?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} leads`,
          }}
          locale={{
            emptyText: (
              <Empty
                description="No leads found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};