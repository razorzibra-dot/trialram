/**
 * Service Contract Detail Page
 * Comprehensive view of service contract with timeline, renewal tracking, and billing
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  Tabs,
  Skeleton,
  Empty,
  Tooltip,
  Badge,
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
  ReloadOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { useService } from '@/modules/core/hooks/useService';
import { ServiceContract } from '@/types/productSales';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface ContractActivity {
  id: string;
  type: 'created' | 'renewed' | 'modified' | 'payment' | 'note' | 'cancelled';
  title: string;
  description: string;
  timestamp: string;
  user: string;
}

interface EditContractValues {
  service_level?: 'basic' | 'standard' | 'premium' | 'enterprise';
  auto_renewal?: boolean;
  renewal_notice_period?: number;
  terms?: string;
}

interface RenewContractValues {
  renewal_period: string;
  new_end_date?: string;
  service_level?: 'basic' | 'standard' | 'premium' | 'enterprise';
  auto_renewal?: boolean;
}

interface AddNoteValues {
  note: string;
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

  // ✅ Get service from module service container (standardized pattern)
  const serviceContractService = useService<any>('serviceContractService');

  const [contract, setContract] = useState<ServiceContract | null>(null);
  const [activities, setActivities] = useState<ContractActivity[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [renewModalVisible, setRenewModalVisible] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [renewForm] = Form.useForm();
  const [noteForm] = Form.useForm();

  // Reset forms when modals close to prevent stale instances
  const handleEditModalClose = () => {
    form.resetFields();
    setEditModalVisible(false);
  };

  const handleRenewModalClose = () => {
    renewForm.resetFields();
    setRenewModalVisible(false);
  };

  const handleNoteModalClose = () => {
    noteForm.resetFields();
    setNoteModalVisible(false);
  };

   
  const loadContractDetails = useCallback(async () => {
    try {
      setLoading(true);

      if (!id) {
        throw new Error('Contract ID is required');
      }

      // Fetch contract from service
      const contractData = await serviceContractService.getServiceContract(id);

      // Create activities timeline
      const mockActivities: ContractActivity[] = [
        {
          id: '1',
          type: 'created',
          title: 'Contract Created',
          description: `Service contract ${contractData.contract_number} was created`,
          timestamp: contractData.created_at,
          user: contractData.created_by,
        },
      ];

      // Generate mock invoices (monthly breakdown)
      const mockInvoices: Invoice[] = [];
      const monthlyValue = contractData.annual_value / 12;
      const startDate = dayjs(contractData.start_date);
      const endDate = dayjs(contractData.end_date);

      let currentDate = startDate;
      let invoiceCount = 1;
      while (currentDate.isBefore(endDate)) {
        const dueDate = currentDate.add(1, 'month').subtract(1, 'day');
        const invoiceId = invoiceCount;
        
        mockInvoices.push({
          id: `inv-${invoiceId}`,
          invoice_number: `INV-${dayjs().format('YYYY')}-${String(invoiceId).padStart(3, '0')}`,
          amount: monthlyValue,
          due_date: dueDate.format('YYYY-MM-DD'),
          status: dueDate.isBefore(dayjs()) ? 'paid' : 'pending',
          paid_date: dueDate.isBefore(dayjs()) ? dueDate.format('YYYY-MM-DD') : undefined,
        });

        currentDate = currentDate.add(1, 'month');
        invoiceCount++;
      }

      setContract(contractData as unknown as any);
      setActivities(mockActivities);
      setInvoices(mockInvoices);
      form.setFieldsValue({
        service_level: contractData.service_level,
        auto_renewal: contractData.auto_renewal,
        renewal_notice_period: contractData.renewal_notice_period,
        terms: contractData.terms,
      } as any);
      renewForm.setFieldsValue({
        service_level: contractData.service_level,
        auto_renewal: contractData.auto_renewal,
      } as any);
    } catch (error) {
      if (error instanceof Error) {
        message.error('Failed to load contract details');
        console.error('Error loading contract:', error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [id, form, renewForm, serviceContractService]);

  useEffect(() => {
    if (id) {
      loadContractDetails();
    }
  }, [id, loadContractDetails]);

  const handleEdit = async (values: EditContractValues) => {
    try {
      if (!contract?.id) {
        throw new Error('Contract ID is required');
      }

      const updatedContract = await serviceContractService.updateServiceContract(
        contract.id,
        values
      );

      setContract(updatedContract as any);
      form.resetFields();
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
      if (error instanceof Error) {
        message.error(`Failed to update contract: ${error.message}`);
      }
    }
  };

  const handleRenew = async (values: RenewContractValues) => {
    try {
      if (!contract?.id) {
        throw new Error('Contract ID is required');
      }

      const renewalData: Partial<any> = {
        auto_renewal: values.auto_renewal,
        service_level: values.service_level,
      };

      const renewedContract = await serviceContractService.renewServiceContract(
        contract.id,
        renewalData
      );

      message.success(`Contract renewed successfully! New contract: ${renewedContract.contract_number}`);
      renewForm.resetFields();
      setRenewModalVisible(false);

      // Add activity
      const newActivity: ContractActivity = {
        id: Date.now().toString(),
        type: 'renewed',
        title: 'Contract Renewed',
        description: `Contract renewed. New contract: ${renewedContract.contract_number}`,
        timestamp: new Date().toISOString(),
        user: 'Current User',
      };
      setActivities([newActivity, ...activities]);

      void loadContractDetails();
    } catch (error) {
      if (error instanceof Error) {
        message.error(`Failed to renew contract: ${error.message}`);
      }
    }
  };

  const handleAddNote = async (values: AddNoteValues) => {
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
      if (error instanceof Error) {
        message.error('Failed to add note');
      }
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Cancel Contract',
      content: (
        <>
          <p>Are you sure you want to cancel this contract?</p>
          <p style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
            This action will mark the contract as cancelled and cannot be undone. 
            Please provide a reason for cancellation.
          </p>
        </>
      ),
      okText: 'Cancel Contract',
      okType: 'danger',
      onOk: async () => {
        const reason = await new Promise<string>((resolve) => {
          Modal.confirm({
            title: 'Cancellation Reason',
            content: (
              <Input.TextArea
                placeholder="Enter reason for cancellation"
                onChange={(e) => {
                  (e.target as any).cancellationReason = e.target.value;
                }}
              />
            ),
            okText: 'Confirm',
            okType: 'danger',
            onOk: () => {
              const input = document.querySelector('textarea[placeholder="Enter reason for cancellation"]') as HTMLTextAreaElement;
              resolve(input?.value || 'No reason provided');
            },
            onCancel: () => {
              resolve('');
            },
          });
        });

        if (!reason) return;

        try {
          if (!contract?.id) {
            throw new Error('Contract ID is required');
          }

          await serviceContractService.cancelServiceContract(
            contract.id,
            reason
          );

          message.success('Contract cancelled successfully');

          // Add activity
          const newActivity: ContractActivity = {
            id: Date.now().toString(),
            type: 'cancelled',
            title: 'Contract Cancelled',
            description: `Contract cancelled. Reason: ${reason}`,
            timestamp: new Date().toISOString(),
            user: 'Current User',
          };
          setActivities([newActivity, ...activities]);

          setTimeout(() => {
            navigate('/tenant/service-contracts');
          }, 1000);
        } catch (error) {
          if (error instanceof Error) {
            message.error(`Failed to cancel contract: ${error.message}`);
          }
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

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 4 }} />
      </div>
    );
  }

  if (!contract) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description="Contract not found" />
      </div>
    );
  }

  const daysUntilEnd = dayjs(contract.end_date).diff(dayjs(), 'day');
  const contractProgress = getContractProgress();
  const showRenewalAlert = daysUntilEnd <= 30 && daysUntilEnd > 0;

  const actionMenuItems = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit Settings',
      onClick: () => setEditModalVisible(true),
    },
    {
      key: 'renew',
      icon: <CheckCircleOutlined />,
      label: 'Renew Contract',
      onClick: () => setRenewModalVisible(true),
    },
    {
      key: 'download',
      icon: <DownloadOutlined />,
      label: 'Download PDF',
      onClick: handleDownloadContract,
    },
    {
      key: 'reminder',
      icon: <MailOutlined />,
      label: 'Send Reminder',
      onClick: handleSendReminder,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'cancel',
      icon: <DeleteOutlined />,
      label: 'Cancel Contract',
      danger: true,
      onClick: handleDelete,
    },
  ];

  return (
    <>
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
          <Button key="renew" onClick={() => setRenewModalVisible(true)}>
            Renew
          </Button>,
          <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => setEditModalVisible(true)}>
            Edit
          </Button>,
          <Dropdown key="more" menu={{ items: actionMenuItems }} trigger={['click']}>
            <Button icon={<MoreOutlined />} />
          </Dropdown>,
        ]}
      />

      <div style={{ padding: 24 }}>
        {showRenewalAlert && (
          <Alert
            message="Renewal Alert"
            description={`This contract expires in ${daysUntilEnd} days (${dayjs(contract.end_date).format('YYYY-MM-DD')}). Consider renewing to ensure uninterrupted service.`}
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            action={
              <Button size="small" type="primary" onClick={() => setRenewModalVisible(true)}>
                Renew Now
              </Button>
            }
            style={{ marginBottom: 24 }}
            closable
          />
        )}

        {contract.status === 'cancelled' && (
          <Alert
            message="Contract Cancelled"
            description="This contract has been cancelled and is no longer active."
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
            closable
          />
        )}

        {/* Key Metrics */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Contract Value"
                value={contract.contract_value}
                prefix="$"
                precision={2}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Service Level"
                value={contract.service_level?.toUpperCase()}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Days Until End"
                value={daysUntilEnd}
                valueStyle={{ color: daysUntilEnd <= 30 ? '#cf1322' : '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Progress"
                value={contractProgress}
                suffix="%"
              />
              <Progress percent={contractProgress} showInfo={false} size="small" />
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Main Content */}
          <Col xs={24} lg={16}>
            {/* Contract Information Card */}
            <Card title="Contract Details" style={{ marginBottom: 16 }}>
              <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
                <Descriptions.Item label="Contract Number">
                  <Space>
                    <span>{contract.contract_number}</span>
                    <Tooltip title="Copy to clipboard">
                      <CopyOutlined 
                        style={{ cursor: 'pointer' }} 
                        onClick={() => {
                          navigator.clipboard.writeText(contract.contract_number);
                          message.success('Copied!');
                        }}
                      />
                    </Tooltip>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Badge 
                    status={contract.status === 'active' ? 'success' : contract.status === 'expired' ? 'error' : 'default'} 
                    text={<Tag color={getStatusColor(contract.status)}>{contract.status ? contract.status.toUpperCase() : 'N/A'}</Tag>} 
                  />
                </Descriptions.Item>
                <Descriptions.Item label="Customer">
                  {contract.customer_name}
                </Descriptions.Item>
                <Descriptions.Item label="Product">
                  {contract.product_name}
                </Descriptions.Item>
                <Descriptions.Item label="Start Date">
                  <CalendarOutlined /> {dayjs(contract.start_date).format('YYYY-MM-DD')}
                </Descriptions.Item>
                <Descriptions.Item label="End Date">
                  <CalendarOutlined /> {dayjs(contract.end_date).format('YYYY-MM-DD')}
                </Descriptions.Item>
                <Descriptions.Item label="Warranty Period">
                  {contract.warranty_period ?? 'N/A'} months
                </Descriptions.Item>
                <Descriptions.Item label="Annual Value">
                  <DollarOutlined /> ${contract.annual_value ? contract.annual_value.toFixed(2) : 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Service Level">
                  <Tag color="blue">{contract.service_level ?? 'N/A'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Auto-Renewal">
                  <Tag color={contract.auto_renewal ? 'success' : 'default'}>
                    {contract.auto_renewal ? 'Enabled' : 'Disabled'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Renewal Notice Period">
                  {contract.renewal_notice_period ?? 'N/A'} days
                </Descriptions.Item>
                <Descriptions.Item label="Created By">
                  {contract.created_by ?? 'N/A'} on {dayjs(contract.created_at).format('YYYY-MM-DD')}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Terms Card */}
            <Card title="Terms & Conditions" style={{ marginBottom: 16 }}>
              <div style={{ maxHeight: 300, overflowY: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                <Text>{contract.terms ?? 'No terms specified'}</Text>
              </div>
            </Card>

            {/* Invoices */}
            <Card title={`Invoices (${invoices.length})`} style={{ marginBottom: 16 }}>
              {invoices.length > 0 ? (
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
                            <strong>{invoice.invoice_number}</strong>
                            <Tag
                              color={
                                invoice.status === 'paid'
                                  ? 'success'
                                  : invoice.status === 'overdue'
                                  ? 'red'
                                  : 'orange'
                              }
                            >
                              {invoice.status ? invoice.status.toUpperCase() : 'N/A'}
                            </Tag>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={0}>
                            <Text>
                              <DollarOutlined /> ${invoice.amount ? invoice.amount.toFixed(2) : 'N/A'}
                            </Text>
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
              ) : (
                <Empty description="No invoices yet" />
              )}
            </Card>
          </Col>

          {/* Sidebar - Activity Timeline */}
          <Col xs={24} lg={8}>
            <Card title="Activity Timeline">
              {activities.length > 0 ? (
                <Timeline
                  items={activities.map((activity) => ({
                    key: activity.id,
                    dot: getActivityIcon(activity.type),
                    children: (
                      <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        <Text strong>{activity.title}</Text>
                        <Text style={{ fontSize: '13px' }}>{activity.description}</Text>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {dayjs(activity.timestamp).format('YYYY-MM-DD HH:mm')} 
                          {' by '} <strong>{activity.user}</strong>
                        </Text>
                      </Space>
                    ),
                  }))}
                />
              ) : (
                <Empty description="No activities yet" />
              )}
            </Card>
          </Col>
        </Row>

        {/* Edit Modal */}
        <Modal
          title="Edit Contract Settings"
          open={editModalVisible}
          onCancel={handleEditModalClose}
          onOk={() => form.submit()}
          width={700}
          destroyOnHidden
        >
          <Form form={form} layout="vertical" onFinish={handleEdit}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  label="Service Level" 
                  name="service_level" 
                  rules={[{ required: true, message: 'Please select a service level' }]}
                >
                  <Select placeholder="Select service level">
                    <Select.Option value="basic">Basic</Select.Option>
                    <Select.Option value="standard">Standard</Select.Option>
                    <Select.Option value="premium">Premium</Select.Option>
                    <Select.Option value="enterprise">Enterprise</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  label="Renewal Notice Period (days)" 
                  name="renewal_notice_period"
                  rules={[{ required: true, message: 'Please enter renewal notice period' }]}
                >
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item 
                  label="Auto-Renewal" 
                  name="auto_renewal" 
                  valuePropName="checked"
                >
                  <div>
                    <Select placeholder="Select auto-renewal status">
                      <Select.Option value={true}>Enabled</Select.Option>
                      <Select.Option value={false}>Disabled</Select.Option>
                    </Select>
                  </div>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item 
                  label="Terms & Conditions" 
                  name="terms"
                  rules={[{ required: true, message: 'Please enter terms and conditions' }]}
                >
                  <TextArea rows={6} placeholder="Enter contract terms and conditions" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>

        {/* Renew Modal */}
        <Modal
          title="Renew Service Contract"
          open={renewModalVisible}
          onCancel={handleRenewModalClose}
          onOk={() => renewForm.submit()}
          width={700}
          destroyOnHidden
        >
          <Form form={renewForm} layout="vertical" onFinish={handleRenew}>
            <Row gutter={16}>
              <Col span={24}>
                <Alert 
                  message="Renewal Information" 
                  description={`Current contract ends on ${dayjs(contract?.end_date).format('YYYY-MM-DD')}. A new contract will be created starting from ${dayjs(contract?.end_date).add(1, 'day').format('YYYY-MM-DD')}.`}
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              </Col>
              <Col span={12}>
                <Form.Item 
                  label="Renewal Period" 
                  name="renewal_period" 
                  rules={[{ required: true, message: 'Please select a renewal period' }]}
                  initialValue="1 year"
                >
                  <Select>
                    <Select.Option value="1 year">1 Year</Select.Option>
                    <Select.Option value="2 years">2 Years</Select.Option>
                    <Select.Option value="3 years">3 Years</Select.Option>
                    <Select.Option value="custom">Custom</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  label="Service Level" 
                  name="service_level"
                  initialValue={contract?.service_level}
                >
                  <Select>
                    <Select.Option value="basic">Basic</Select.Option>
                    <Select.Option value="standard">Standard</Select.Option>
                    <Select.Option value="premium">Premium</Select.Option>
                    <Select.Option value="enterprise">Enterprise</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  label="Auto-Renewal" 
                  name="auto_renewal"
                  initialValue={contract?.auto_renewal}
                >
                  <Select placeholder="Select auto-renewal status">
                    <Select.Option value={true}>Enabled</Select.Option>
                    <Select.Option value={false}>Disabled</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  label="New End Date" 
                  name="new_end_date"
                >
                  <DatePicker />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>

        {/* Add Note Modal */}
        <Modal
          title="Add Note"
          open={noteModalVisible}
          onCancel={handleNoteModalClose}
          onOk={() => noteForm.submit()}
          destroyOnHidden
        >
          <Form form={noteForm} layout="vertical" onFinish={handleAddNote}>
            <Form.Item label="Note" name="note" rules={[{ required: true }]}>
              <TextArea rows={4} placeholder="Enter your note here..." />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </>
  );
};

export default ServiceContractDetailPage;