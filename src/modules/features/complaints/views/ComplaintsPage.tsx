/**
 * Complaints Page - Modular Version
 * Enhanced complaint management with lifecycle tracking
 */
import React, { useEffect, useState } from 'react';
import { complaintService } from '@/services/complaintService';
import { Complaint, ComplaintFilters } from '@/types/complaints';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Input, 
  Select, 
  Table, 
  Tag, 
  Space, 
  Spin,
  Alert
} from 'antd';
import { 
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined
} from '@ant-design/icons';
import { 
  AlertTriangle,
  Clock,
  CheckCircle,
  Building2,
  User,
  Wrench
} from 'lucide-react';
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';
import { PageHeader, StatCard } from '@/components/common';
import ComplaintFormModal from '@/components/complaints/ComplaintFormModal';
import ComplaintDetailModal from '@/components/complaints/ComplaintDetailModal';
import { toast } from 'sonner';

export const ComplaintsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    fetchComplaints();
  }, [searchTerm, statusFilter]);

  const fetchComplaints = async () => {
    try {
      setIsLoading(true);
      const filters: ComplaintFilters = {};
      
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter !== 'all') filters.status = statusFilter;

      const data = await complaintService.getComplaints(filters);
      setComplaints(data);
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
      toast.error('Failed to fetch complaints');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const colorMap: Record<string, string> = {
      new: 'blue',
      in_progress: 'orange',
      closed: 'green'
    };
    
    return (
      <Tag color={colorMap[status] || 'default'}>
        {status.replace('_', ' ').toUpperCase()}
      </Tag>
    );
  };

  const getPriorityTag = (priority: string) => {
    const colorMap: Record<string, string> = {
      low: 'green',
      medium: 'orange',
      high: 'red',
      urgent: 'red'
    };
    
    return (
      <Tag color={colorMap[priority] || 'default'}>
        {priority.toUpperCase()}
      </Tag>
    );
  };

  const handleViewDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailModal(true);
  };

  if (!hasPermission('manage_complaints')) {
    return (
      <EnterpriseLayout>
        <div style={{ padding: 24 }}>
          <Alert
            message="Access Denied"
            description="You don't have permission to access complaint management."
            type="error"
            showIcon
          />
        </div>
      </EnterpriseLayout>
    );
  }

  const stats = {
    total: complaints.length,
    new: complaints.filter(c => c.status === 'new').length,
    inProgress: complaints.filter(c => c.status === 'in_progress').length,
    closed: complaints.filter(c => c.status === 'closed').length
  };

  const columns = [
    {
      title: 'Complaint',
      dataIndex: 'title',
      key: 'title',
      render: (_: any, record: Complaint) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            padding: 8, 
            background: '#FEE2E2', 
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle size={16} color="#DC2626" />
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{record.title}</div>
            <div style={{ fontSize: 12, color: '#6B7280', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {record.description}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (text: string) => (
        <Space>
          <Building2 size={14} color="#6B7280" />
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => getPriorityTag(priority),
    },
    {
      title: 'Assigned Engineer',
      dataIndex: 'assigned_engineer_name',
      key: 'assigned_engineer_name',
      render: (text: string) => (
        <Space>
          <User size={14} color="#6B7280" />
          <span>{text || 'Unassigned'}</span>
        </Space>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: Complaint) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          />
          {hasPermission('write') && (
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <EnterpriseLayout>
      <PageHeader
        title="Complaint Management"
        description="Manage customer complaints with enhanced lifecycle tracking"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Complaints' }
        ]}
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined spin={isLoading} />}
              onClick={fetchComplaints}
              loading={isLoading}
            >
              Refresh
            </Button>
            {hasPermission('write') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowCreateModal(true)}
              >
                Create Complaint
              </Button>
            )}
          </Space>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Complaints"
              value={stats.total}
              icon={Wrench}
              color="primary"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="New"
              value={stats.new}
              icon={AlertTriangle}
              color="info"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="In Progress"
              value={stats.inProgress}
              icon={Clock}
              color="warning"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Closed"
              value={stats.closed}
              icon={CheckCircle}
              color="success"
              loading={isLoading}
            />
          </Col>
        </Row>

        {/* Filters */}
        <Card style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ fontSize: 16, fontWeight: 500 }}>Search & Filters</div>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onPressEnter={fetchComplaints}
                prefix={<SearchOutlined />}
                style={{ flex: 1 }}
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 200 }}
              >
                <Select.Option value="all">All Statuses</Select.Option>
                <Select.Option value="new">New</Select.Option>
                <Select.Option value="in_progress">In Progress</Select.Option>
                <Select.Option value="closed">Closed</Select.Option>
              </Select>
              <Button type="primary" icon={<SearchOutlined />} onClick={fetchComplaints}>
                Search
              </Button>
            </Space.Compact>
          </Space>
        </Card>

        {/* Complaints Table */}
        <Card 
          title={`Complaints (${complaints.length})`}
          extra={<span style={{ color: '#6B7280', fontWeight: 'normal' }}>Showing {complaints.length} complaint{complaints.length !== 1 ? 's' : ''}</span>}
        >
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin tip="Loading complaints..." />
            </div>
          ) : complaints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Wrench size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No complaints found</h3>
              <p style={{ color: '#6B7280', marginBottom: 16 }}>
                Get started by creating your first complaint
              </p>
              {hasPermission('write') && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Complaint
                </Button>
              )}
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={complaints}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} complaints`,
              }}
            />
          )}
        </Card>
      </div>

      {/* Modals */}
      <ComplaintFormModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={fetchComplaints}
      />

      {selectedComplaint && (
        <ComplaintDetailModal
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
          complaint={selectedComplaint}
          onSuccess={fetchComplaints}
        />
      )}
    </EnterpriseLayout>
  );
};

export default ComplaintsPage;
