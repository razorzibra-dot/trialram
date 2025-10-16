/**
 * Service Contract Detail Page
 * Comprehensive view of service contract with timeline, renewal tracking, and billing
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  Timeline,
  List,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Row,
  Col,
  Statistic,
  Progress,
  Dropdown,
  Menu,
  Typography,
  Alert,
  Divider,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CalendarOutlined,
  UserOutlined,
  DownloadOutlined,
  MailOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';
import { PageHeader } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface ServiceContract {
  id: string;
  contract_number: string;
  customer_id: string;
  customer_name: string;
  product_id: string;
  product_name: string;
  start_date: string;
  end_date: string;
  renewal_date: string;
  status: 'active' | 'expired' | 'pending' | 'cancelled';
  contract_type: 'annual' | 'monthly' | 'quarterly';
  contract_value: number;
  payment_terms: string;
  billing_cycle: string;
  auto_renewal: boolean;
  description: string;
  terms_conditions: string;
  created_at: string;
  created_by: string;
}

interface ContractActivity {
  id: string;
  type: 'created' | 'renewed' | 'modified' | 'payment' | 'note' | 'cancelled';
  title: string;
  description: string;
  timestamp: string;
  user: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: 'paid' | 'pending' | 'overdue';
}

export const ServiceContractDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [contract, setContract] = useState<ServiceContract | null>(null);
  const [activities, setActivities] = useState<ContractActivity[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [renewModalVisible, setRenewModalVisible] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [noteForm] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadContractDetails();
    }
  }, [id]);

  const loadContractDetails = async () => {
    try {
      setLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockContract: ServiceContract = {
        id: id || '1',
        contract_number: 'SC-2024-001',
        customer_id: 'cust-1',
        customer_name: 'Acme Corporation',
        product_id: 'prod-1',
        product_name: 'Enterprise CRM License',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        renewal_date: '2024-12-01',
        status: 'active',
        contract_type: 'annual',
        contract_value: 50000,
        payment_terms: 'Net 30',
        billing_cycle: 'Monthly',
        auto_renewal: true,
        description: 'Annual enterprise CRM license with premium support',
        terms_conditions: 'Standard terms and conditions apply. See attached document for details.',
        created_at: '2023-12-15T10:00:00Z',
        created_by: 'John Doe',
      };

      const mockActivities: ContractActivity[] = [
        {
          id: '1',
          type: 'created',
          title: 'Contract Created',
          description: 'Service contract SC-2024-001 was created',
          timestamp: '2023-12-15T10:00:00Z',
          user: 'John Doe',
        },
        {
          id: '2',
          type: 'payment',
          title: 'Payment Received',
          description: 'Payment of $4,166.67 received for January 2024',
          timestamp: '2024-01-05T14:30:00Z',
          user: 'System',
        },
        {
          id: '3',
          type: 'note',
          title: 'Note Added',
          description: 'Customer requested additional user licenses',
          timestamp: '2024-01-10T09:15:00Z',
          user: 'Jane Smith',
        },
        {
          id: '4',
          type: 'modified',
          title: 'Contract Modified',
          description: 'Updated billing contact information',
          timestamp: '2024-01-12T11:20:00Z',
          user: 'John Doe',
        },
      ];

      const mockInvoices: Invoice[] = [
        {
          id: '1',
          invoice_number: 'INV-2024-001',
          amount: 4166.67,
          due_date: '2024-01-31',
          paid_date: '2024-01-05',
          status: 'paid',
        },
        {
          id: '2',
          invoice_number: 'INV-2024-002',
          amount: 4166.67,
          due_date: '2024-02-28',
          paid_date: '2024-02-03',
          status: 'paid',
        },
        {
          id: '3',
          invoice_number: 'INV-2024-003',
          amount: 4166.67,
          due_date: '2024-03-31',
          status: 'pending',
        },
      ];

      setContract(mockContract);
      setActivities(mockActivities);
      setInvoices(mockInvoices);
      form.setFieldsValue(mockContract);
    } catch (error) {
      message.error('Failed to load contract details');
      console.error('Error loading contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (values: any) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setContract({ ...contract!, ...values });
      setEditModalVisible(false);
      message.success('Contract updated successfully');

      // Add activity
      const newActivity: ContractActivity = {
        id: Date.now().toString(),
        type: 'modified',
        title: 'Contract Modified',
        description: 'Contract details were updated',
        timestamp: new Date().toISOString(),
        user: 'Current User',
      };
      setActivities([newActivity, ...activities]);
    } catch (error) {
      message.error('Failed to update contract');
    }
  };

  const handleRenew = async (values: any) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      message.success('Contract renewed successfully');
      setRenewModalVisible(false);

      // Add activity
      const newActivity: ContractActivity = {
        id: Date.now().toString(),
        type: 'renewed',
        title: 'Contract Renewed',
        description: `Contract renewed for ${values.renewal_period}`,
        timestamp: new Date().toISOString(),
        user: 'Current User',
      };
      setActivities([newActivity, ...activities]);

      loadContractDetails();
    } catch (error) {
      message.error('Failed to renew contract');
    }
  };

  const handleAddNote = async (values: any) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      const newActivity: ContractActivity = {
        id: Date.now().toString(),
        type: 'note',
        title: 'Note Added',
        description: values.note,
        timestamp: new Date().toISOString(),
        user: 'Current User',
      };
      setActivities([newActivity, ...activities]);

      setNoteModalVisible(false);
      noteForm.resetFields();
      message.success('Note added successfully');
    } catch (error) {
      message.error('Failed to add note');
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Contract',
      content: 'Are you sure you want to delete this contract? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));
          message.success('Contract deleted successfully');
          navigate('/tenant/service-contracts');
        } catch (error) {
          message.error('Failed to delete contract');
        }
      },
    });
  };

  const handleSendReminder = () => {
    message.success('Renewal reminder sent to customer');
  };

  const handleDownloadContract = () => {
    message.success('Contract PDF downloaded');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'success',
      expired: 'error',
      pending: 'warning',
      cancelled: 'default',
    };
    return colors[status] || 'default';
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      created: <FileTextOutlined style={{ color: '#1890ff' }} />,
      renewed: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      modified: <EditOutlined style={{ color: '#faad14' }} />,
      payment: <DollarOutlined style={{ color: '#52c41a' }} />,
      note: <FileTextOutlined style={{ color: '#722ed1' }} />,
      cancelled: <WarningOutlined style={{ color: '#ff4d4f' }} />,
    };
    return icons[type] || <ClockCircleOutlined />;
  };

  const getDaysUntilRenewal = () => {
    if (!contract) return 0;
    return dayjs(contract.renewal_date).diff(dayjs(), 'day');
  };

  const getContractProgress = () => {
    if (!contract) return 0;
    const total = dayjs(contract.end_date).diff(dayjs(contract.start_date), 'day');
    const elapsed = dayjs().diff(dayjs(contract.start_date), 'day');
    return Math.min(Math.round((elapsed / total) * 100), 100);
  };

  const actionMenu = (
    <Menu>
      <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => setEditModalVisible(true)}>
        Edit Contract
      </Menu.Item>
      <Menu.Item key="renew" icon={<CheckCircleOutlined />} onClick={() => setRenewModalVisible(true)}>
        Renew Contract
      </Menu.Item>
      <Menu.Item key="download" icon={<DownloadOutlined />} onClick={handleDownloadContract}>
        Download PDF
      </Menu.Item>
      <Menu.Item key="reminder" icon={<MailOutlined />} onClick={handleSendReminder}>
        Send Reminder
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={handleDelete}>
        Delete Contract
      </Menu.Item>
    </Menu>
  );

  if (!contract) {
    return <div>Loading...</div>;
  }

  const daysUntilRenewal = getDaysUntilRenewal();
  const showRenewalAlert = daysUntilRenewal <= 30 && daysUntilRenewal > 0;

  return (
    <EnterpriseLayout>
      <PageHeader
        title={`Contract ${contract.contract_number}`}
        description={contract.customer_name}
        breadcrumb={{
          items: [
            { title: 'Service Contracts', path: '/tenant/service-contracts' },
            { title: contract.contract_number },
          ],
        }}
        extra={[
          <Button key="note" onClick={() => setNoteModalVisible(true)}>
            Add Note
          </Button>,
          <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => setEditModalVisible(true)}>
            Edit
          </Button>,
          <Dropdown key="more" overlay={actionMenu} trigger={['click']}>
            <Button icon={<MoreOutlined />} />
          </Dropdown>,
        ]}
      />

      <div style={{ padding: 24 }}>
        {showRenewalAlert && (
          <Alert
            message="Renewal Reminder"
            description={`This contract is due for renewal in ${daysUntilRenewal} days. Please contact the customer to discuss renewal options.`}
            type="warning"
            showIcon
            icon={<CalendarOutlined />}
            action={
              <Button size="small" type="primary" onClick={() => setRenewModalVisible(true)}>
                Renew Now
              </Button>
            }
            style={{ marginBottom: 24 }}
          />
        )}

        <Row gutter={16}>
          {/* Main Content */}
          <Col xs={24} lg={16}>
            {/* Contract Statistics */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="Contract Value"
                    value={contract.contract_value}
                    prefix={<DollarOutlined />}
                    precision={2}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="Days Until Renewal"
                    value={daysUntilRenewal}
                    prefix={<CalendarOutlined />}
                    valueStyle={{ color: daysUntilRenewal <= 30 ? '#cf1322' : '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="Contract Progress"
                    value={getContractProgress()}
                    suffix="%"
                    prefix={<ClockCircleOutlined />}
                  />
                  <Progress percent={getContractProgress()} showInfo={false} />
                </Card>
              </Col>
            </Row>

            {/* Contract Details */}
            <Card title="Contract Information" style={{ marginBottom: 16 }}>
              <Descriptions column={{ xs: 1, sm: 2 }} bordered>
                <Descriptions.Item label="Contract Number">
                  {contract.contract_number}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={getStatusColor(contract.status)}>
                    {contract.status.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Customer">
                  {contract.customer_name}
                </Descriptions.Item>
                <Descriptions.Item label="Product">
                  {contract.product_name}
                </Descriptions.Item>
                <Descriptions.Item label="Start Date">
                  {dayjs(contract.start_date).format('YYYY-MM-DD')}
                </Descriptions.Item>
                <Descriptions.Item label="End Date">
                  {dayjs(contract.end_date).format('YYYY-MM-DD')}
                </Descriptions.Item>
                <Descriptions.Item label="Renewal Date">
                  {dayjs(contract.renewal_date).format('YYYY-MM-DD')}
                </Descriptions.Item>
                <Descriptions.Item label="Contract Type">
                  <Tag>{contract.contract_type.toUpperCase()}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Payment Terms">
                  {contract.payment_terms}
                </Descriptions.Item>
                <Descriptions.Item label="Billing Cycle">
                  {contract.billing_cycle}
                </Descriptions.Item>
                <Descriptions.Item label="Auto Renewal">
                  <Tag color={contract.auto_renewal ? 'success' : 'default'}>
                    {contract.auto_renewal ? 'Enabled' : 'Disabled'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Created">
                  {dayjs(contract.created_at).format('YYYY-MM-DD')} by {contract.created_by}
                </Descriptions.Item>
                <Descriptions.Item label="Description" span={2}>
                  {contract.description}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Invoices */}
            <Card title="Invoices" style={{ marginBottom: 16 }}>
              <List
                dataSource={invoices}
                renderItem={(invoice) => (
                  <List.Item
                    actions={[
                      <Button type="link" icon={<DownloadOutlined />}>
                        Download
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          {invoice.invoice_number}
                          <Tag
                            color={
                              invoice.status === 'paid'
                                ? 'success'
                                : invoice.status === 'overdue'
                                ? 'error'
                                : 'warning'
                            }
                          >
                            {invoice.status.toUpperCase()}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <Text>Amount: ${invoice.amount.toFixed(2)}</Text>
                          <Text type="secondary">
                            Due: {dayjs(invoice.due_date).format('YYYY-MM-DD')}
                          </Text>
                          {invoice.paid_date && (
                            <Text type="success">
                              Paid: {dayjs(invoice.paid_date).format('YYYY-MM-DD')}
                            </Text>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          {/* Sidebar */}
          <Col xs={24} lg={8}>
            <Card title="Activity Timeline">
              <Timeline>
                {activities.map((activity) => (
                  <Timeline.Item key={activity.id} dot={getActivityIcon(activity.type)}>
                    <Space direction="vertical" size={0}>
                      <Text strong>{activity.title}</Text>
                      <Text>{activity.description}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(activity.timestamp).format('YYYY-MM-DD HH:mm')} by {activity.user}
                      </Text>
                    </Space>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </Col>
        </Row>

        {/* Edit Modal */}
        <Modal
          title="Edit Contract"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          onOk={() => form.submit()}
          width={800}
        >
          <Form form={form} layout="vertical" onFinish={handleEdit}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                  <Select>
                    <Select.Option value="active">Active</Select.Option>
                    <Select.Option value="pending">Pending</Select.Option>
                    <Select.Option value="expired">Expired</Select.Option>
                    <Select.Option value="cancelled">Cancelled</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Contract Value" name="contract_value" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} prefix="$" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Payment Terms" name="payment_terms">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Auto Renewal" name="auto_renewal" valuePropName="checked">
                  <Select>
                    <Select.Option value={true}>Enabled</Select.Option>
                    <Select.Option value={false}>Disabled</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Description" name="description">
                  <TextArea rows={4} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>

        {/* Renew Modal */}
        <Modal
          title="Renew Contract"
          open={renewModalVisible}
          onCancel={() => setRenewModalVisible(false)}
          onOk={() => form.submit()}
        >
          <Form layout="vertical" onFinish={handleRenew}>
            <Form.Item label="Renewal Period" name="renewal_period" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="1 year">1 Year</Select.Option>
                <Select.Option value="2 years">2 Years</Select.Option>
                <Select.Option value="3 years">3 Years</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="New Contract Value" name="new_value" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} prefix="$" />
            </Form.Item>
            <Form.Item label="Notes" name="notes">
              <TextArea rows={3} />
            </Form.Item>
          </Form>
        </Modal>

        {/* Add Note Modal */}
        <Modal
          title="Add Note"
          open={noteModalVisible}
          onCancel={() => setNoteModalVisible(false)}
          onOk={() => noteForm.submit()}
        >
          <Form form={noteForm} layout="vertical" onFinish={handleAddNote}>
            <Form.Item label="Note" name="note" rules={[{ required: true }]}>
              <TextArea rows={4} placeholder="Enter your note here..." />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </EnterpriseLayout>
  );
};

export default ServiceContractDetailPage;