/**
 * Super Admin Role Requests Page - Complete Refactor
 * Handles role change requests from users across all tenants
 * Features: Drawer-based side panels, consistent UI, proper service integration
 */
import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Table,
  Tag,
  Space,
  Input,
  Select,
  message,
  Alert,
  Dropdown,
  type MenuProps,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SearchOutlined,
  ReloadOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { PageHeader, StatCard } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { useService } from '@/modules/core/hooks/useService';
import { RoleRequestDetailPanel } from '../components/RoleRequestDetailPanel';
import type { RoleRequest, RoleRequestStats } from '../types/roleRequest';
import { Clock, CheckCircle, XCircle, Users } from 'lucide-react';

const SuperAdminRoleRequestsPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const roleRequestService = useService<any>('roleRequestService');

  // State
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [stats, setStats] = useState<RoleRequestStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<RoleRequest | null>(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check super admin permission
  const isSuperAdmin = currentUser?.role === 'super_admin';

  // Load role requests
   
  useEffect(() => {
    if (isSuperAdmin) {
      fetchRoleRequests();
    }
  }, [isSuperAdmin, statusFilter]);

  const fetchRoleRequests = async () => {
    try {
      setIsLoading(true);
      const response = await roleRequestService.getRoleRequests({
        status: statusFilter as any,
        search: searchText,
      });
      setRequests(response.data);
      setStats(response.stats);
    } catch (error) {
      console.error('Failed to fetch role requests:', error);
      message.error('Failed to load role requests');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle approve
  const handleApprove = async (request: RoleRequest) => {
    try {
      setIsSubmitting(true);
      await roleRequestService.approveRoleRequest(request.id);
      message.success(`Role request approved for ${request.userName}`);
      await fetchRoleRequests();
      setIsPanelVisible(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve request';
      message.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reject
  const handleReject = async (request: RoleRequest, reason: string) => {
    try {
      setIsSubmitting(true);
      await roleRequestService.rejectRoleRequest(request.id, reason);
      message.success('Role request rejected');
      await fetchRoleRequests();
      setIsPanelVisible(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject request';
      message.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle view details
  const handleViewDetails = (request: RoleRequest) => {
    setSelectedRequest(request);
    setIsPanelVisible(true);
  };

  // Filtered requests
  const filteredRequests = requests.filter(request => {
    const matchesSearch = !searchText ||
      request.userName.toLowerCase().includes(searchText.toLowerCase()) ||
      request.userEmail.toLowerCase().includes(searchText.toLowerCase()) ||
      request.tenantName.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  // Table columns
  const columns: ColumnsType<RoleRequest> = [
    {
      title: 'User',
      key: 'user',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <div style={{ fontWeight: 500 }}>{record.userName}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.userEmail}</div>
        </Space>
      ),
    },
    {
      title: 'Tenant',
      dataIndex: 'tenantName',
      key: 'tenantName',
      width: 160,
    },
    {
      title: 'Current Role',
      dataIndex: 'currentRole',
      key: 'currentRole',
      width: 120,
      render: (role: string) => (
        <Tag color="blue">{role.replace('_', ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Requested Role',
      dataIndex: 'requestedRole',
      key: 'requestedRole',
      width: 120,
      render: (role: string) => (
        <Tag color="orange">{role.replace('_', ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => {
        const colors: Record<string, string> = {
          pending: 'processing',
          approved: 'success',
          rejected: 'error',
        };
        const icons: Record<string, React.ReactNode> = {
          pending: <ClockCircleOutlined />,
          approved: <CheckCircleOutlined />,
          rejected: <CloseCircleOutlined />,
        };
        return (
          <Tag icon={icons[status]} color={colors[status]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Tag>
        );
      },
    },
    {
      title: 'Requested',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      width: 100,
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          onClick={() => handleViewDetails(record)}
        >
          View Details
        </Button>
      ),
    },
  ];

  if (!isSuperAdmin) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Access Denied"
          description="You don't have permission to access role requests. Only super administrators can manage role requests."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Role Change Requests"
        description="Manage user role change requests across all tenants"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Super Admin', path: '/super-admin' },
          { label: 'Role Requests' },
        ]}
        extra={
          <Button
            icon={<ReloadOutlined spin={isLoading} />}
            onClick={fetchRoleRequests}
            loading={isLoading}
          >
            Refresh
          </Button>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Requests"
              value={stats.total}
              icon={Users}
              color="primary"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Pending"
              value={stats.pending}
              icon={Clock}
              color="warning"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Approved"
              value={stats.approved}
              icon={CheckCircle}
              color="success"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Rejected"
              value={stats.rejected}
              icon={XCircle}
              color="error"
              loading={isLoading}
            />
          </Col>
        </Row>

        {/* Filters */}
        <Card style={{ marginBottom: 24 }}>
          <Space style={{ width: '100%' }}>
            <Input
              placeholder="Search by user, email, or tenant..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <Select
              placeholder="Filter by status"
              style={{ width: 150 }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              options={[
                { label: 'All Status', value: '' },
                { label: 'Pending', value: 'pending' },
                { label: 'Approved', value: 'approved' },
                { label: 'Rejected', value: 'rejected' },
              ]}
            />
            <Button
              type="primary"
              onClick={() => {
                setSearchText('');
                setStatusFilter('');
              }}
            >
              Clear Filters
            </Button>
          </Space>
        </Card>

        {/* Table */}
        <Card>
          <Table<RoleRequest>
            columns={columns}
            dataSource={filteredRequests}
            loading={isLoading}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} requests`,
            }}
            size="middle"
          />
        </Card>
      </div>

      {/* Detail Panel */}
      <RoleRequestDetailPanel
        visible={isPanelVisible}
        data={selectedRequest}
        loading={isLoading}
        onClose={() => setIsPanelVisible(false)}
        onApprove={handleApprove}
        onReject={handleReject}
        isSubmitting={isSubmitting}
      />
    </>
  );
};

export default SuperAdminRoleRequestsPage;