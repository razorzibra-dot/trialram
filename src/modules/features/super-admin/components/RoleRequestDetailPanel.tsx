/**
 * Role Request Detail Panel
 * Side drawer panel for viewing and managing role request details
 */

import React, { useState } from 'react';
import {
  Drawer,
  Button,
  Descriptions,
  Divider,
  Form,
  Input,
  Space,
  Tag,
  message,
  Empty,
  Row,
  Col,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { RoleRequest } from '../types/roleRequest';

interface RoleRequestDetailPanelProps {
  visible: boolean;
  data: RoleRequest | null;
  loading?: boolean;
  onClose: () => void;
  onApprove?: (request: RoleRequest) => void;
  onReject?: (request: RoleRequest, reason: string) => void;
  isSubmitting?: boolean;
}

export const RoleRequestDetailPanel: React.FC<RoleRequestDetailPanelProps> = ({
  visible,
  data,
  loading = false,
  onClose,
  onApprove,
  onReject,
  isSubmitting = false,
}) => {
  const [form] = Form.useForm();
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  const handleApprove = async () => {
    if (data && onApprove) {
      try {
        onApprove(data);
        message.success('Role request approved');
        handleClose();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to approve request';
        message.error(errorMessage);
      }
    }
  };

  const handleReject = async () => {
    try {
      const values = await form.validateFields();
      if (data && onReject) {
        onReject(data, values.rejectionReason);
        message.success('Role request rejected');
        handleClose();
      }
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setAction(null);
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'processing';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (!data) {
    return (
      <Drawer
        title="Role Request Details"
        placement="right"
        onClose={handleClose}
        open={visible}
        width={500}
      >
        <Empty description="No request selected" />
      </Drawer>
    );
  }

  return (
    <Drawer
      title="Role Request Details"
      placement="right"
      onClose={handleClose}
      open={visible}
      width={500}
      loading={loading}
      footer={
        <Row gutter={8} justify="end">
          <Col>
            <Button onClick={handleClose}>Close</Button>
          </Col>
          {data.status === 'pending' && (
            <>
              <Col>
                <Button
                  type="primary"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => setAction('reject')}
                >
                  Reject
                </Button>
              </Col>
              <Col>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleApprove}
                  loading={isSubmitting}
                >
                  Approve
                </Button>
              </Col>
            </>
          )}
        </Row>
      }
    >
      <div style={{ marginBottom: 24 }}>
        {/* Status Badge */}
        <div style={{ marginBottom: 24 }}>
          <Tag color={getStatusColor(data.status)}>
            {getStatusLabel(data.status)}
          </Tag>
        </div>

        {/* Request Details */}
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="User" span={1}>
            <Space direction="vertical" size={0}>
              <span style={{ fontWeight: 500 }}>{data.userName}</span>
              <span style={{ fontSize: 12, color: '#999' }}>{data.userEmail}</span>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Tenant" span={1}>
            {data.tenantName}
          </Descriptions.Item>

          <Descriptions.Item label="Current Role" span={1}>
            <Tag color="blue">
              {data.currentRole.replace('_', ' ').toUpperCase()}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Requested Role" span={1}>
            <Tag color="orange">
              {data.requestedRole.replace('_', ' ').toUpperCase()}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Reason" span={1}>
            <span style={{ whiteSpace: 'pre-wrap' }}>{data.reason}</span>
          </Descriptions.Item>

          <Descriptions.Item label="Requested On" span={1}>
            {new Date(data.createdAt).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>

        {/* Review Information */}
        {data.reviewedAt && (
          <>
            <Divider />
            <Descriptions column={1} size="small" bordered title="Review Information">
              <Descriptions.Item label="Status" span={1}>
                <Tag color={getStatusColor(data.status)}>
                  {getStatusLabel(data.status)}
                </Tag>
              </Descriptions.Item>

              {data.rejectionReason && (
                <Descriptions.Item label="Rejection Reason" span={1}>
                  <span style={{ whiteSpace: 'pre-wrap', color: '#ff4d4f' }}>
                    {data.rejectionReason}
                  </span>
                </Descriptions.Item>
              )}

              <Descriptions.Item label="Reviewed On" span={1}>
                {new Date(data.reviewedAt).toLocaleString()}
              </Descriptions.Item>

              <Descriptions.Item label="Reviewed By" span={1}>
                {data.reviewerEmail || data.reviewedBy}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}

        {/* Rejection Form */}
        {action === 'reject' && (
          <>
            <Divider />
            <Form
              form={form}
              layout="vertical"
              style={{ marginTop: 24 }}
            >
              <Form.Item
                label="Rejection Reason"
                name="rejectionReason"
                rules={[
                  { required: true, message: 'Please provide a rejection reason' },
                  { min: 10, message: 'Reason must be at least 10 characters' },
                ]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="Explain why this role request is being rejected..."
                />
              </Form.Item>

              <Space>
                <Button onClick={() => setAction(null)}>Cancel</Button>
                <Button
                  type="primary"
                  danger
                  loading={isSubmitting}
                  onClick={handleReject}
                >
                  Confirm Rejection
                </Button>
              </Space>
            </Form>
          </>
        )}
      </div>
    </Drawer>
  );
};