/**
 * Customer Detail Page - Redesigned with Ant Design
 * Displays comprehensive customer information with tabs for related data
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Descriptions,
  Tag,
  Button,
  Space,
  Tabs,
  Table,
  Empty,
  Spin,
  Alert,
  Tooltip,
  Popconfirm,
  Modal,
  message,
  Skeleton,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  CustomerServiceOutlined,
  DollarOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { DataTabErrorBoundary } from '@/components/errors/DataTabErrorBoundary';
import { useCustomer, useDeleteCustomer } from '../hooks/useCustomers';
import { useAuth } from '@/contexts/AuthContext';
import { useSalesByCustomer } from '@/modules/features/sales/hooks/useSales';
import { useContractsByCustomer } from '@/modules/features/contracts/hooks/useContracts';
import { useTicketsByCustomer } from '@/modules/features/tickets/hooks/useTickets';

// Mock data for related entities (will be replaced with real API calls)
interface RelatedSale {
  id: string;
  sale_number: string;
  product_name: string;
  amount: number;
  status: string;
  sale_date: string;
}

interface RelatedContract {
  id: string;
  contract_number: string;
  service_level: string;
  value: number;
  status: string;
  start_date: string;
  end_date: string;
}

interface RelatedTicket {
  id: string;
  ticket_number: string;
  subject: string;
  priority: string;
  status: string;
  created_at: string;
}

const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { data: customer, isLoading, error, refetch } = useCustomer(id!);
  const { mutateAsync: deleteCustomer, isPending: isDeleting } = useDeleteCustomer();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch related data from API
  const { data: salesData, isLoading: salesLoading, error: salesError, refetch: refetchSales } = useSalesByCustomer(id!);
  const { contracts: relatedContracts = [], isLoading: contractsLoading, error: contractsError, refetch: refetchContracts } = useContractsByCustomer(id!);
  const { data: ticketsData, isLoading: ticketsLoading, error: ticketsError, refetch: refetchTickets } = useTicketsByCustomer(id!);

  // Transform sales data to match the RelatedSale interface
  const relatedSales: RelatedSale[] = Array.isArray(salesData?.data) 
    ? salesData.data.map((deal: any) => ({
        id: deal.id,
        sale_number: deal.id?.substring(0, 8).toUpperCase() || 'SAL-UNKNOWN',
        product_name: deal.title || 'Untitled Deal',
        amount: deal.value || 0,
        status: deal.stage === 'closed_won' ? 'completed' : 'pending',
        sale_date: deal.created_at || new Date().toISOString(),
      }))
    : [];

  // Transform tickets data to match the RelatedTicket interface
  const relatedTickets: RelatedTicket[] = Array.isArray(ticketsData?.data)
    ? ticketsData.data.map((ticket: any) => ({
        id: ticket.id,
        ticket_number: ticket.id?.substring(0, 8).toUpperCase() || 'TKT-UNKNOWN',
        subject: ticket.title || ticket.subject || 'Untitled Ticket',
        priority: ticket.priority || 'medium',
        status: ticket.status || 'open',
        created_at: ticket.created_at || new Date().toISOString(),
      }))
    : [];

  const handleDelete = () => {
    if (!id) return;

    Modal.confirm({
      title: 'Delete Customer',
      content: `Are you sure you want to delete "${customer?.company_name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteCustomer(id);
          message.success('Customer deleted successfully');
          navigate('/tenant/customers');
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Failed to delete customer';
          message.error(errorMsg);
          console.error('Delete error:', error);
        }
      },
    });
  };

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      active: { color: 'success', text: 'Active' },
      inactive: { color: 'default', text: 'Inactive' },
      prospect: { color: 'processing', text: 'Prospect' },
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getSizeTag = (size: string) => {
    const sizeConfig: Record<string, { color: string }> = {
      startup: { color: 'blue' },
      small: { color: 'cyan' },
      medium: { color: 'geekblue' },
      enterprise: { color: 'purple' },
    };
    const config = sizeConfig[size] || { color: 'default' };
    return <Tag color={config.color}>{size?.toUpperCase()}</Tag>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Sales table columns
  const salesColumns: ColumnsType<RelatedSale> = [
    {
      title: 'Sale #',
      dataIndex: 'sale_number',
      key: 'sale_number',
      render: (text: string, record: RelatedSale) => (
        <a onClick={() => navigate(`/tenant/sales/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: 'Product',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (value: number) => (
        <span style={{ color: '#1890ff', fontWeight: 500 }}>
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'success' : 'processing'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'sale_date',
      key: 'sale_date',
      render: (date: string) => formatDate(date),
    },
  ];

  // Contracts table columns
  const contractsColumns: ColumnsType<RelatedContract> = [
    {
      title: 'Contract #',
      dataIndex: 'contract_number',
      key: 'contract_number',
      render: (text: string, record: RelatedContract) => (
        <a onClick={() => navigate(`/tenant/contracts/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: 'Service Level',
      dataIndex: 'service_level',
      key: 'service_level',
      render: (level: string) => {
        const colors: Record<string, string> = {
          basic: 'default',
          standard: 'blue',
          premium: 'gold',
          enterprise: 'purple',
        };
        return <Tag color={colors[level]}>{level.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => (
        <span style={{ color: '#1890ff', fontWeight: 500 }}>
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Period',
      key: 'period',
      render: (_: unknown, record: RelatedContract) => (
        <span>
          {formatDate(record.start_date)} - {formatDate(record.end_date)}
        </span>
      ),
    },
  ];

  // Tickets table columns
  const ticketsColumns: ColumnsType<RelatedTicket> = [
    {
      title: 'Ticket #',
      dataIndex: 'ticket_number',
      key: 'ticket_number',
      render: (text: string, record: RelatedTicket) => (
        <a onClick={() => navigate(`/tenant/tickets/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const colors: Record<string, string> = {
          low: 'default',
          medium: 'blue',
          high: 'orange',
          urgent: 'red',
        };
        return <Tag color={colors[priority]}>{priority.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          open: 'processing',
          'in-progress': 'blue',
          resolved: 'success',
          closed: 'default',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDate(date),
    },
  ];

  if (isLoading) {
    return (
      <>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" spinning tip="Loading customer details..." />
        </div>
      </>
    );
  }

  if (error || !customer) {
    return (
      <>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Empty
            description={
              <span>
                <h2 style={{ color: '#ff4d4f', marginBottom: 16 }}>Customer Not Found</h2>
                <p style={{ color: '#8c8c8c' }}>
                  The customer you're looking for doesn't exist or has been deleted.
                </p>
              </span>
            }
          >
            <Button
              type="primary"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/tenant/customers')}
            >
              Back to Customers
            </Button>
          </Empty>
        </div>
      </>
    );
  }

  const breadcrumbs = [
    { label: 'Home', path: '/tenant/dashboard' },
    { label: 'Customers', path: '/tenant/customers' },
    { label: customer.company_name },
  ];

  const headerActions = (
    <Space>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/tenant/customers')}
      >
        Back
      </Button>
      {hasPermission('customers.update') && (
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/tenant/customers/${customer.id}/edit`)}
        >
          Edit Customer
        </Button>
      )}
      {hasPermission('customers.delete') && (
        <Popconfirm
          title="Delete Customer"
          description="Are you sure you want to delete this customer? This action cannot be undone."
          onConfirm={handleDelete}
          okText="Yes, Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true, loading: isDeleting }}
        >
          <Button danger icon={<DeleteOutlined />}>
            Delete
          </Button>
        </Popconfirm>
      )}
    </Space>
  );

  // Calculate statistics
  const totalSales = relatedSales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalContracts = relatedContracts.length;
  const activeContracts = relatedContracts.filter(c => c.status === 'active').length;
  const openTickets = relatedTickets.filter(t => t.status === 'open').length;

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <UserOutlined /> Overview
        </span>
      ),
      children: (
        <div>
          {/* Statistics */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="Total Sales"
                value={formatCurrency(totalSales)}
                icon={<ShoppingCartOutlined />}
                color="primary"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="Active Contracts"
                value={activeContracts}
                icon={<FileTextOutlined />}
                color="success"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="Open Tickets"
                value={openTickets}
                icon={<CustomerServiceOutlined />}
                color="warning"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="Customer Since"
                value={formatDate(customer.created_at)}
                icon={<CalendarOutlined />}
                color="info"
              />
            </Col>
          </Row>

          {/* Customer Information */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Contact Information" variant="borderless">
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="Company Name">
                    {customer.company_name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Contact Name">
                    {customer.contact_name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    {customer.email ? (
                      <Space>
                        <MailOutlined />
                        <a href={`mailto:${customer.email}`}>{customer.email}</a>
                      </Space>
                    ) : (
                      <span style={{ color: '#8c8c8c' }}>Not provided</span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Phone">
                    {customer.phone ? (
                      <Space>
                        <PhoneOutlined />
                        <a href={`tel:${customer.phone}`}>{customer.phone}</a>
                      </Space>
                    ) : (
                      <span style={{ color: '#8c8c8c' }}>Not provided</span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Mobile">
                    {customer.mobile ? (
                      <Space>
                        <PhoneOutlined />
                        <a href={`tel:${customer.mobile}`}>{customer.mobile}</a>
                      </Space>
                    ) : (
                      <span style={{ color: '#8c8c8c' }}>Not provided</span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Website">
                    {customer.website ? (
                      <Space>
                        <GlobalOutlined />
                        <a href={customer.website} target="_blank" rel="noopener noreferrer">
                          {customer.website}
                        </a>
                      </Space>
                    ) : (
                      <span style={{ color: '#8c8c8c' }}>Not provided</span>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="Business Information" variant="borderless">
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="Status">
                    {getStatusTag(customer.status || 'unknown')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Customer Type">
                    <Tag color="blue">
                      {customer.customer_type?.toUpperCase() || 'BUSINESS'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Industry">
                    {customer.industry || (
                      <span style={{ color: '#8c8c8c' }}>Not specified</span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Company Size">
                    {customer.size ? (
                      getSizeTag(customer.size)
                    ) : (
                      <span style={{ color: '#8c8c8c' }}>Not specified</span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Credit Limit">
                    {customer.credit_limit ? (
                      formatCurrency(customer.credit_limit)
                    ) : (
                      <span style={{ color: '#8c8c8c' }}>Not set</span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Payment Terms">
                    {customer.payment_terms || (
                      <span style={{ color: '#8c8c8c' }}>Not specified</span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tax ID">
                    {customer.tax_id || (
                      <span style={{ color: '#8c8c8c' }}>Not provided</span>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            <Col xs={24}>
              <Card title="Address Information" variant="borderless">
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="Address">
                    {customer.address ? (
                      <Space>
                        <EnvironmentOutlined />
                        {customer.address}
                      </Space>
                    ) : (
                      <span style={{ color: '#8c8c8c' }}>Not provided</span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="City">
                    {customer.city || (
                      <span style={{ color: '#8c8c8c' }}>Not provided</span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Country">
                    {customer.country || (
                      <span style={{ color: '#8c8c8c' }}>Not provided</span>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            {customer.notes && (
              <Col xs={24}>
                <Card title="Notes" variant="borderless">
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{customer.notes}</p>
                </Card>
              </Col>
            )}
          </Row>
        </div>
      ),
    },
    {
      key: 'sales',
      label: (
        <span>
          <ShoppingCartOutlined /> Sales ({relatedSales.length})
        </span>
      ),
      children: (
        <DataTabErrorBoundary tabName="Sales" onRetry={() => refetchSales()}>
          <Card variant="borderless">
            {salesError && (
              <Alert
                message="Error Loading Sales"
                description={salesError instanceof Error ? salesError.message : 'Failed to load sales data'}
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            {salesLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <Table
                columns={salesColumns}
                dataSource={relatedSales}
                rowKey="id"
                pagination={false}
                locale={{
                  emptyText: (
                    <Empty
                      description="No sales found for this customer"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ),
                }}
              />
            )}
          </Card>
        </DataTabErrorBoundary>
      ),
    },
    {
      key: 'contracts',
      label: (
        <span>
          <FileTextOutlined /> Contracts ({relatedContracts.length})
        </span>
      ),
      children: (
        <DataTabErrorBoundary tabName="Contracts" onRetry={() => refetchContracts()}>
          <Card variant="borderless">
            {contractsError && (
              <Alert
                message="Error Loading Contracts"
                description={contractsError instanceof Error ? contractsError.message : 'Failed to load contracts data'}
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            {contractsLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <Table
                columns={contractsColumns}
                dataSource={relatedContracts}
                rowKey="id"
                pagination={false}
                locale={{
                  emptyText: (
                    <Empty
                      description="No contracts found for this customer"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ),
                }}
              />
            )}
          </Card>
        </DataTabErrorBoundary>
      ),
    },
    {
      key: 'tickets',
      label: (
        <span>
          <CustomerServiceOutlined /> Support Tickets ({relatedTickets.length})
        </span>
      ),
      children: (
        <DataTabErrorBoundary tabName="Support Tickets" onRetry={refetchTickets}>
          <Card variant="borderless">
            {ticketsError && (
              <Alert
                message="Error Loading Tickets"
                description={ticketsError instanceof Error ? ticketsError.message : 'Failed to load tickets data'}
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            {ticketsLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <Table
                columns={ticketsColumns}
                dataSource={relatedTickets}
                rowKey="id"
                pagination={false}
                locale={{
                  emptyText: (
                    <Empty
                      description="No support tickets found for this customer"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ),
                }}
              />
            )}
          </Card>
        </DataTabErrorBoundary>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={customer.company_name}
        description={`Customer ID: ${customer.id} • ${customer.contact_name}`}
        breadcrumbs={breadcrumbs}
        extra={headerActions}
      />
      <div style={{ padding: 24 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </div>
    </>
  );
};

export default CustomerDetailPage;
