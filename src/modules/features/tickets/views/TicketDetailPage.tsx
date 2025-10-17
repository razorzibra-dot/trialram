/**
 * Ticket Detail Page
 * Comprehensive ticket view with comments, attachments, and activity timeline
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Tag,
  Descriptions,
  Timeline,
  Input,
  Upload,
  List,
  Avatar,
  Dropdown,
  Modal,
  Form,
  Select,
  message,
  Spin,
  Empty,
  Divider,
  Typography,
  Badge,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  SendOutlined,
  PaperClipOutlined,
  DownloadOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components/common';
import { ticketService } from '@/services/ticketService';
import { useAuth } from '@/contexts/AuthContext';
import type { Ticket } from '@/types/crm';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
}

interface TicketAttachment {
  id: string;
  ticket_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  uploaded_by_name: string;
  uploaded_at: string;
  url: string;
}

interface TicketActivity {
  id: string;
  ticket_id: string;
  user_name: string;
  action: string;
  description: string;
  created_at: string;
  type: 'status' | 'assignment' | 'priority' | 'comment' | 'attachment' | 'created';
}

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [form] = Form.useForm();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [activities, setActivities] = useState<TicketActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    if (id) {
      loadTicketData();
    }
  }, [id]);

  const loadTicketData = async () => {
    try {
      setLoading(true);
      const ticketData = await ticketService.getTicket(id!);
      setTicket(ticketData);

      // Load mock comments
      setComments([
        {
          id: '1',
          ticket_id: id!,
          user_id: '1',
          user_name: 'John Admin',
          comment: 'I have reviewed this ticket and assigned it to our technical team for investigation.',
          is_internal: false,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          ticket_id: id!,
          user_id: '3',
          user_name: 'Mike Agent',
          comment: 'Internal note: This appears to be related to the recent server upgrade. Checking logs.',
          is_internal: true,
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          ticket_id: id!,
          user_id: '3',
          user_name: 'Mike Agent',
          comment: 'We have identified the root cause and are working on a fix. Expected resolution within 24 hours.',
          is_internal: false,
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
      ]);

      // Load mock attachments
      setAttachments([
        {
          id: '1',
          ticket_id: id!,
          file_name: 'error-screenshot.png',
          file_size: 245678,
          file_type: 'image/png',
          uploaded_by: '1',
          uploaded_by_name: 'John Admin',
          uploaded_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          url: '#',
        },
        {
          id: '2',
          ticket_id: id!,
          file_name: 'system-logs.txt',
          file_size: 12345,
          file_type: 'text/plain',
          uploaded_by: '3',
          uploaded_by_name: 'Mike Agent',
          uploaded_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          url: '#',
        },
      ]);

      // Load mock activities
      setActivities([
        {
          id: '1',
          ticket_id: id!,
          user_name: 'System',
          action: 'created',
          description: 'Ticket created',
          created_at: ticketData.created_at,
          type: 'created',
        },
        {
          id: '2',
          ticket_id: id!,
          user_name: 'John Admin',
          action: 'assigned',
          description: 'Assigned to Mike Agent',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          type: 'assignment',
        },
        {
          id: '3',
          ticket_id: id!,
          user_name: 'Mike Agent',
          action: 'status_changed',
          description: 'Status changed from Open to In Progress',
          created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
          type: 'status',
        },
        {
          id: '4',
          ticket_id: id!,
          user_name: 'Mike Agent',
          action: 'priority_changed',
          description: 'Priority changed from Medium to High',
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          type: 'priority',
        },
      ]);
    } catch (error) {
      message.error('Failed to load ticket details');
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      message.warning('Please enter a comment');
      return;
    }

    try {
      setSubmittingComment(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const newComment: TicketComment = {
        id: Date.now().toString(),
        ticket_id: id!,
        user_id: '1',
        user_name: 'Current User',
        comment: commentText,
        is_internal: isInternal,
        created_at: new Date().toISOString(),
      };

      setComments([...comments, newComment]);
      setCommentText('');
      setIsInternal(false);
      message.success('Comment added successfully');

      // Add activity
      const newActivity: TicketActivity = {
        id: Date.now().toString(),
        ticket_id: id!,
        user_name: 'Current User',
        action: 'commented',
        description: isInternal ? 'Added internal note' : 'Added comment',
        created_at: new Date().toISOString(),
        type: 'comment',
      };
      setActivities([...activities, newActivity]);
    } catch (error) {
      message.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await ticketService.updateTicket(id!, { status: newStatus as any });
      setTicket({ ...ticket!, status: newStatus as any });
      message.success('Status updated successfully');

      // Add activity
      const newActivity: TicketActivity = {
        id: Date.now().toString(),
        ticket_id: id!,
        user_name: 'Current User',
        action: 'status_changed',
        description: `Status changed to ${newStatus}`,
        created_at: new Date().toISOString(),
        type: 'status',
      };
      setActivities([...activities, newActivity]);
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    try {
      await ticketService.updateTicket(id!, { priority: newPriority as any });
      setTicket({ ...ticket!, priority: newPriority as any });
      message.success('Priority updated successfully');

      // Add activity
      const newActivity: TicketActivity = {
        id: Date.now().toString(),
        ticket_id: id!,
        user_name: 'Current User',
        action: 'priority_changed',
        description: `Priority changed to ${newPriority}`,
        created_at: new Date().toISOString(),
        type: 'priority',
      };
      setActivities([...activities, newActivity]);
    } catch (error) {
      message.error('Failed to update priority');
    }
  };

  const handleDeleteTicket = () => {
    Modal.confirm({
      title: 'Delete Ticket',
      content: 'Are you sure you want to delete this ticket? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await ticketService.deleteTicket(id!);
          message.success('Ticket deleted successfully');
          navigate('/tenant/tickets');
        } catch (error) {
          message.error('Failed to delete ticket');
        }
      },
    });
  };

  const handleFileUpload = async (file: File) => {
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newAttachment: TicketAttachment = {
        id: Date.now().toString(),
        ticket_id: id!,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: '1',
        uploaded_by_name: 'Current User',
        uploaded_at: new Date().toISOString(),
        url: URL.createObjectURL(file),
      };

      setAttachments([...attachments, newAttachment]);
      message.success('File uploaded successfully');

      // Add activity
      const newActivity: TicketActivity = {
        id: Date.now().toString(),
        ticket_id: id!,
        user_name: 'Current User',
        action: 'attachment_added',
        description: `Uploaded ${file.name}`,
        created_at: new Date().toISOString(),
        type: 'attachment',
      };
      setActivities([...activities, newActivity]);
    } catch (error) {
      message.error('Failed to upload file');
    }
    return false; // Prevent default upload behavior
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'blue',
      in_progress: 'orange',
      pending: 'purple',
      resolved: 'green',
      closed: 'default',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'red',
      high: 'orange',
      medium: 'blue',
      low: 'default',
    };
    return colors[priority] || 'default';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <ExclamationCircleOutlined style={{ color: '#1890ff' }} />;
      case 'status':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'assignment':
        return <UserOutlined style={{ color: '#722ed1' }} />;
      case 'priority':
        return <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />;
      case 'comment':
        return <ClockCircleOutlined style={{ color: '#13c2c2' }} />;
      case 'attachment':
        return <PaperClipOutlined style={{ color: '#eb2f96' }} />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const actionMenuItems = [
    {
      key: 'edit',
      label: 'Edit Ticket',
      icon: <EditOutlined />,
      onClick: () => setEditModalVisible(true),
      disabled: !hasPermission('write'),
    },
    {
      key: 'delete',
      label: 'Delete Ticket',
      icon: <DeleteOutlined />,
      onClick: handleDeleteTicket,
      disabled: !hasPermission('delete'),
      danger: true,
    },
  ];

  if (loading) {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spin size="large" />
        </div>
      </>
    );
  }

  if (!ticket) {
    return (
      <>
        <Empty description="Ticket not found" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Ticket #${ticket.id}`}
        description={ticket.title}
        breadcrumb={{
          items: [
            { title: 'Home', path: '/tenant/dashboard' },
            { title: 'Tickets', path: '/tenant/tickets' },
            { title: `#${ticket.id}` },
          ],
        }}
        extra={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tenant/tickets')}>
              Back
            </Button>
            <Dropdown menu={{ items: actionMenuItems }} trigger={['click']}>
              <Button icon={<MoreOutlined />}>Actions</Button>
            </Dropdown>
          </Space>
        }
      />

      <div style={{ padding: 24 }}>
        <Row gutter={[24, 24]}>
          {/* Main Content */}
          <Col xs={24} lg={16}>
            {/* Ticket Details */}
            <Card title="Ticket Details" style={{ marginBottom: 24 }}>
              <Descriptions column={{ xs: 1, sm: 2 }} bordered>
                <Descriptions.Item label="Status">
                  <Select
                    value={ticket.status}
                    onChange={handleStatusChange}
                    style={{ width: 150 }}
                    disabled={!hasPermission('write')}
                  >
                    <Select.Option value="open">Open</Select.Option>
                    <Select.Option value="in_progress">In Progress</Select.Option>
                    <Select.Option value="pending">Pending</Select.Option>
                    <Select.Option value="resolved">Resolved</Select.Option>
                    <Select.Option value="closed">Closed</Select.Option>
                  </Select>
                </Descriptions.Item>
                <Descriptions.Item label="Priority">
                  <Select
                    value={ticket.priority}
                    onChange={handlePriorityChange}
                    style={{ width: 150 }}
                    disabled={!hasPermission('write')}
                  >
                    <Select.Option value="urgent">Urgent</Select.Option>
                    <Select.Option value="high">High</Select.Option>
                    <Select.Option value="medium">Medium</Select.Option>
                    <Select.Option value="low">Low</Select.Option>
                  </Select>
                </Descriptions.Item>
                <Descriptions.Item label="Customer">{ticket.customer_name}</Descriptions.Item>
                <Descriptions.Item label="Category">
                  <Tag>{ticket.category}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Assigned To">{ticket.assigned_to_name}</Descriptions.Item>
                <Descriptions.Item label="Created">
                  {new Date(ticket.created_at).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Last Updated">
                  {new Date(ticket.updated_at).toLocaleString()}
                </Descriptions.Item>
                {ticket.resolved_at && (
                  <Descriptions.Item label="Resolved">
                    {new Date(ticket.resolved_at).toLocaleString()}
                  </Descriptions.Item>
                )}
              </Descriptions>

              <Divider />

              <div>
                <Title level={5}>Description</Title>
                <Text>{ticket.description}</Text>
              </div>
            </Card>

            {/* Comments Section */}
            <Card title="Comments" style={{ marginBottom: 24 }}>
              <List
                dataSource={comments}
                renderItem={(comment) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <Space>
                          <Text strong>{comment.user_name}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {formatTimeAgo(comment.created_at)}
                          </Text>
                          {comment.is_internal && (
                            <Tag color="orange" style={{ fontSize: 11 }}>
                              Internal
                            </Tag>
                          )}
                        </Space>
                      }
                      description={comment.comment}
                    />
                  </List.Item>
                )}
              />

              <Divider />

              <Space direction="vertical" style={{ width: '100%' }}>
                <TextArea
                  rows={4}
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <Space>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleAddComment}
                    loading={submittingComment}
                  >
                    Add Comment
                  </Button>
                  <Button
                    type={isInternal ? 'default' : 'text'}
                    onClick={() => setIsInternal(!isInternal)}
                  >
                    {isInternal ? '🔒 Internal Note' : '👁️ Public Comment'}
                  </Button>
                </Space>
              </Space>
            </Card>

            {/* Attachments Section */}
            <Card
              title="Attachments"
              extra={
                <Upload beforeUpload={handleFileUpload} showUploadList={false}>
                  <Button icon={<PaperClipOutlined />} size="small">
                    Upload
                  </Button>
                </Upload>
              }
            >
              {attachments.length === 0 ? (
                <Empty description="No attachments" />
              ) : (
                <List
                  dataSource={attachments}
                  renderItem={(attachment) => (
                    <List.Item
                      actions={[
                        <Button
                          type="link"
                          icon={<DownloadOutlined />}
                          onClick={() => window.open(attachment.url, '_blank')}
                        >
                          Download
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={<PaperClipOutlined />} />}
                        title={attachment.file_name}
                        description={
                          <Space>
                            <Text type="secondary">{formatFileSize(attachment.file_size)}</Text>
                            <Text type="secondary">•</Text>
                            <Text type="secondary">
                              Uploaded by {attachment.uploaded_by_name}
                            </Text>
                            <Text type="secondary">•</Text>
                            <Text type="secondary">
                              {formatTimeAgo(attachment.uploaded_at)}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>

          {/* Sidebar */}
          <Col xs={24} lg={8}>
            {/* Activity Timeline */}
            <Card title="Activity Timeline">
              <Timeline>
                {activities.map((activity) => (
                  <Timeline.Item key={activity.id} dot={getActivityIcon(activity.type)}>
                    <Text strong>{activity.user_name}</Text>
                    <br />
                    <Text type="secondary">{activity.description}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatTimeAgo(activity.created_at)}
                    </Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};