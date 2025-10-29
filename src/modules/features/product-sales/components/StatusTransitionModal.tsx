/**
 * Status Transition Modal Component
 * Allows users to transition product sale status with validation and confirmation
 */

import React, { useState } from 'react';
import {
  Modal,
  Button,
  Space,
  Form,
  Input,
  Select,
  message,
  Alert,
  Spin,
  Empty,
  Descriptions,
  Tag,
} from 'antd';
import { ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { ProductSale } from '@/types/productSales';
import { ProductSaleStatus, getStatusLabel, getStatusDescription, getStatusColor } from '../utils/statusTransitions';
import { useStatusTransition } from '../hooks/useStatusTransition';

interface StatusTransitionModalProps {
  visible: boolean;
  sale: ProductSale | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const StatusTransitionModal: React.FC<StatusTransitionModalProps> = ({
  visible,
  sale,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const { transitionStatus, isLoading, validNextStatuses } = useStatusTransition(sale);
  const [selectedStatus, setSelectedStatus] = useState<ProductSaleStatus | null>(null);

  if (!sale) {
    return null;
  }

  const handleStatusChange = (status: ProductSaleStatus) => {
    setSelectedStatus(status);
    form.setFieldValue('newStatus', status);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await transitionStatus(sale, values.newStatus, values.reason);
      message.success('Status updated successfully');
      form.resetFields();
      setSelectedStatus(null);
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title="Change Sale Status"
      open={visible}
      onCancel={onClose}
      width={600}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={isLoading} onClick={handleSubmit}>
            Update Status
          </Button>
        </Space>
      }
    >
      <Spin spinning={isLoading}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            newStatus: null,
            reason: '',
          }}
        >
          {/* Current Status */}
          <div style={{ marginBottom: 24 }}>
            <h4>Current Status</h4>
            <Tag color={getStatusColor(sale.status as ProductSaleStatus)}>
              {getStatusLabel(sale.status as ProductSaleStatus)}
            </Tag>
            <p style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              {getStatusDescription(sale.status as ProductSaleStatus)}
            </p>
          </div>

          {/* New Status Selection */}
          <Form.Item
            label="New Status"
            name="newStatus"
            rules={[{ required: true, message: 'Please select a new status' }]}
          >
            <Select
              placeholder="Select new status"
              onChange={(value) => handleStatusChange(value as ProductSaleStatus)}
            >
              {validNextStatuses.length > 0 ? (
                validNextStatuses.map((status) => (
                  <Select.Option key={status} value={status}>
                    <Space>
                      <Tag color={getStatusColor(status)}>
                        {getStatusLabel(status)}
                      </Tag>
                      <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                        {getStatusDescription(status)}
                      </span>
                    </Space>
                  </Select.Option>
                ))
              ) : (
                <Select.Option disabled>
                  <Empty description="No transitions available" />
                </Select.Option>
              )}
            </Select>
          </Form.Item>

          {/* Reason */}
          <Form.Item
            label="Reason (Optional)"
            name="reason"
            tooltip="Provide a reason for this status change for audit tracking"
          >
            <Input.TextArea
              placeholder="Enter reason for status change..."
              rows={3}
              maxLength={500}
              showCount
            />
          </Form.Item>

          {/* Preview */}
          {selectedStatus && (
            <div style={{ marginBottom: 16 }}>
              <Alert
                icon={<CheckCircleOutlined />}
                message="Status Change Preview"
                description={`Changing status from "${getStatusLabel(sale.status as ProductSaleStatus)}" to "${getStatusLabel(selectedStatus)}"`}
                type="info"
                showIcon
              />
            </div>
          )}

          {/* Validation Info */}
          {validNextStatuses.length === 0 && (
            <Alert
              icon={<ExclamationCircleOutlined />}
              message="No Valid Transitions"
              description={`The current status "${getStatusLabel(sale.status as ProductSaleStatus)}" has no valid transitions. This is likely a terminal state.`}
              type="warning"
              showIcon
            />
          )}
        </Form>
      </Spin>
    </Modal>
  );
};

export default StatusTransitionModal;