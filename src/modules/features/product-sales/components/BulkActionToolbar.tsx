/**
 * Bulk Action Toolbar Component
 * Displays selected count and bulk action buttons
 * Includes RBAC permission checks for bulk operations
 */
import React, { useEffect, useState } from 'react';
import {
  Button,
  Space,
  Tooltip,
  Popconfirm,
  Select,
  Input,
  Form,
  Modal,
  Row,
  Col,
  message,
  Alert
} from 'antd';
import {
  DeleteOutlined,
  SwapOutlined,
  DownloadOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { ProductSale, PRODUCT_SALE_STATUSES } from '@/types/productSales';
import { bulkOperationsService, BulkStatusUpdateRequest } from '../services/bulkOperationsService';
import { useProductSalesPermissions } from '../hooks/useProductSalesPermissions';

interface BulkActionToolbarProps {
  selectedCount: number;
  selectedSales: ProductSale[];
  onBulkStatusUpdate?: (request: BulkStatusUpdateRequest) => void;
  onBulkDelete?: (saleIds: string[], reason?: string) => void;
  onBulkExport?: (sales: ProductSale[], format: 'csv' | 'xlsx', columns: string[]) => void;
  onClearSelection: () => void;
  loading?: boolean;
}

interface BulkStatusModalState {
  visible: boolean;
  newStatus: string;
  reason: string;
}

interface BulkExportModalState {
  visible: boolean;
  format: 'csv' | 'xlsx';
  selectedColumns: string[];
}

/**
 * Component for bulk actions toolbar
 */
export const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selectedCount,
  selectedSales,
  onBulkStatusUpdate,
  onBulkDelete,
  onBulkExport,
  onClearSelection,
  loading = false
}) => {
  const [statusModalState, setStatusModalState] = React.useState<BulkStatusModalState>({
    visible: false,
    newStatus: '',
    reason: ''
  });

  const [exportModalState, setExportModalState] = React.useState<BulkExportModalState>({
    visible: false,
    format: 'csv',
    selectedColumns: [
      'sale_number',
      'customer_name',
      'product_name',
      'quantity',
      'unit_price',
      'total_value',
      'status',
      'sale_date'
    ]
  });

  const [form] = Form.useForm();
  
  // Load RBAC permissions for bulk action visibility
  const permissions = useProductSalesPermissions({ autoLoad: true });

  if (selectedCount === 0) {
    return null;
  }

  const saleIds = selectedSales.map(sale => sale.id);

  const handleBulkStatusChange = () => {
    form.validateFields(['status', 'reason']).then(() => {
      const formData = form.getFieldsValue(['status', 'reason']);
      const request: BulkStatusUpdateRequest = {
        saleIds,
        newStatus: formData.status,
        reason: formData.reason || undefined
      };

      if (onBulkStatusUpdate) {
        onBulkStatusUpdate(request);
      }

      setStatusModalState({
        visible: false,
        newStatus: '',
        reason: ''
      });
      form.resetFields();
    });
  };

  const handleBulkDelete = async (deleteReason?: string) => {
    try {
      if (onBulkDelete) {
        onBulkDelete(saleIds, deleteReason);
      }
    } catch (error) {
      message.error('Failed to delete selected items');
    }
  };

  const handleBulkExport = () => {
    if (exportModalState.selectedColumns.length === 0) {
      message.error('Please select at least one column to export');
      return;
    }

    if (onBulkExport) {
      onBulkExport(selectedSales, exportModalState.format, exportModalState.selectedColumns);
    }

    setExportModalState({
      visible: false,
      format: 'csv',
      selectedColumns: [
        'sale_number',
        'customer_name',
        'product_name',
        'quantity',
        'unit_price',
        'total_value',
        'status',
        'sale_date'
      ]
    });
  };

  const columnOptions = [
    { label: 'Sale #', value: 'sale_number' },
    { label: 'Customer', value: 'customer_name' },
    { label: 'Product', value: 'product_name' },
    { label: 'Quantity', value: 'quantity' },
    { label: 'Unit Price', value: 'unit_price' },
    { label: 'Total Value', value: 'total_value' },
    { label: 'Status', value: 'status' },
    { label: 'Sale Date', value: 'sale_date' },
    { label: 'Delivery Address', value: 'delivery_address' },
    { label: 'Warranty Period', value: 'warranty_period' }
  ];

  return (
    <>
      <Alert
        message={`${selectedCount} item${selectedCount !== 1 ? 's' : ''} selected`}
        type="info"
        style={{ marginBottom: 16 }}
        action={
          <Button type="text" size="small" onClick={onClearSelection}>
            Clear
          </Button>
        }
      />

      <div
        style={{
          background: '#fafafa',
          padding: '12px 16px',
          borderRadius: '4px',
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8
        }}
      >
        <span style={{ fontWeight: 500 }}>Bulk Actions:</span>
        <Space>
          {/* Bulk Status Update Button */}
          {permissions.canBulkUpdateStatus && (
            <Tooltip title={permissions.canBulkUpdateStatus ? "Change status for all selected items" : "You don't have permission to change status"}>
              <Button
                icon={<SwapOutlined />}
                onClick={() => setStatusModalState({ ...statusModalState, visible: true })}
                disabled={loading || selectedCount === 0 || !permissions.canBulkUpdateStatus}
              >
                Change Status
              </Button>
            </Tooltip>
          )}

          {/* Bulk Export Button */}
          {permissions.canExport && (
            <Tooltip title={permissions.canExport ? "Export selected items" : "You don't have permission to export"}>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => setExportModalState({ ...exportModalState, visible: true })}
                disabled={loading || selectedCount === 0 || !permissions.canExport}
              >
                Export
              </Button>
            </Tooltip>
          )}

          {/* Bulk Delete Button */}
          {permissions.canBulkDelete && (
            <Popconfirm
              title="Delete Selected Items"
              description={`Are you sure you want to delete ${selectedCount} item${selectedCount !== 1 ? 's' : ''}? This action cannot be undone.`}
              onConfirm={() => handleBulkDelete()}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title={permissions.canBulkDelete ? "Delete all selected items" : "You don't have permission to delete"}>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  disabled={loading || selectedCount === 0 || !permissions.canBulkDelete}
                >
                  Delete
                </Button>
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      </div>

      {/* Bulk Status Update Modal */}
      <Modal
        title="Change Status - Bulk Update"
        open={statusModalState.visible}
        onOk={handleBulkStatusChange}
        onCancel={() => {
          setStatusModalState({ visible: false, newStatus: '', reason: '' });
          form.resetFields();
        }}
        width={600}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="New Status"
            name="status"
            rules={[{ required: true, message: 'Please select a new status' }]}
          >
            <Select placeholder="Select new status" disabled={loading}>
              {PRODUCT_SALE_STATUSES.map((status) => (
                <Select.Option key={status.value} value={status.value}>
                  {status.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Reason for Change (Optional)"
            name="reason"
            rules={[{ max: 500, message: 'Reason must be less than 500 characters' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter reason for bulk status change"
              disabled={loading}
              maxLength={500}
            />
          </Form.Item>

          <Alert
            message={`This action will update the status for ${selectedCount} item${selectedCount !== 1 ? 's' : ''}`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        </Form>
      </Modal>

      {/* Bulk Export Modal */}
      <Modal
        title="Export Selected Items"
        open={exportModalState.visible}
        onOk={handleBulkExport}
        onCancel={() =>
          setExportModalState({
            visible: false,
            format: 'csv',
            selectedColumns: [
              'sale_number',
              'customer_name',
              'product_name',
              'quantity',
              'unit_price',
              'total_value',
              'status',
              'sale_date'
            ]
          })
        }
        width={600}
        confirmLoading={loading}
      >
        <Form layout="vertical">
          <Form.Item label="Export Format">
            <Select
              value={exportModalState.format}
              onChange={(value) =>
                setExportModalState({ ...exportModalState, format: value as 'csv' | 'xlsx' })
              }
            >
              <Select.Option value="csv">CSV (Comma-separated)</Select.Option>
              <Select.Option value="xlsx">Excel (.xlsx)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Columns to Export">
            <Select
              mode="multiple"
              placeholder="Select columns to include in export"
              value={exportModalState.selectedColumns}
              onChange={(values) =>
                setExportModalState({ ...exportModalState, selectedColumns: values })
              }
              disabled={loading}
            >
              {columnOptions.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Total Items">
                <span style={{ fontWeight: 500 }}>{selectedCount}</span>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Selected Columns">
                <span style={{ fontWeight: 500 }}>{exportModalState.selectedColumns.length}</span>
              </Form.Item>
            </Col>
          </Row>

          <Alert
            message={`Export will include ${selectedCount} item${selectedCount !== 1 ? 's' : ''} with ${exportModalState.selectedColumns.length} column${exportModalState.selectedColumns.length !== 1 ? 's' : ''}`}
            type="info"
            showIcon
          />
        </Form>
      </Modal>
    </>
  );
};

export default BulkActionToolbar;