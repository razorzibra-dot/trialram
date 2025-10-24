/**
 * PDF Template Detail Panel - Read-only Drawer
 * Displays PDF template information
 */
import React from 'react';
import { Drawer, Descriptions, Button, Space, Divider, Tag, Badge, Row, Col } from 'antd';
import { EditOutlined, FileTextOutlined, CalendarOutlined } from '@ant-design/icons';
import { PDFTemplate } from '@/services/pdfTemplateService';
import { useAuth } from '@/contexts/AuthContext';

interface PDFTemplateDetailPanelProps {
  template: PDFTemplate | null;
  open: boolean;
  onClose: () => void;
  onEdit: (template: PDFTemplate) => void;
}

export const PDFTemplateDetailPanel: React.FC<PDFTemplateDetailPanelProps> = ({
  template,
  open,
  onClose,
  onEdit
}) => {
  const { hasPermission } = useAuth();

  if (!template) return null;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'invoice':
        return 'blue';
      case 'contract':
        return 'green';
      case 'report':
        return 'orange';
      case 'letter':
        return 'purple';
      default:
        return 'default';
    }
  };

  return (
    <Drawer
      title="Template Details"
      placement="right"
      onClose={onClose}
      open={open}
      width={550}
      extra={
        hasPermission('manage_templates') && (
          <Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                onEdit(template);
                onClose();
              }}
            >
              Edit
            </Button>
          </Space>
        )
      }
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#2C3E50' }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          {template.name}
        </h3>
        <Space wrap>
          <Tag color={getCategoryColor(template.category)}>
            {template.category.toUpperCase()}
          </Tag>
          <Tag color={template.is_active ? 'success' : 'default'}>
            {template.is_active ? 'Active' : 'Inactive'}
          </Tag>
          {template.is_default && (
            <Tag color="gold">Default</Tag>
          )}
        </Space>
      </div>

      <Divider />

      {/* Basic Information */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ marginBottom: 16, color: '#2C3E50' }}>Basic Information</h4>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Category">
            <Tag color={getCategoryColor(template.category)}>
              {template.category}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={template.is_active ? 'success' : 'default'}>
              {template.is_active ? 'Active' : 'Inactive'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Default Template">
            {template.is_default ? 'Yes' : 'No'}
          </Descriptions.Item>
        </Descriptions>
      </div>

      <Divider />

      {/* Description */}
      {template.description && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 12, color: '#2C3E50' }}>Description</h4>
          <p style={{ color: '#7A8691', margin: 0 }}>
            {template.description}
          </p>
        </div>
      )}

      {template.description && <Divider />}

      {/* Variables */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ marginBottom: 12, color: '#2C3E50' }}>Template Variables</h4>
        <Badge count={template.variables.length} showZero color="#1890ff" />
        {template.variables.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Row gutter={[8, 8]}>
              {template.variables.map((variable: string, index: number) => (
                <Col key={index}>
                  <Tag color="blue">{variable}</Tag>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </div>

      <Divider />

      {/* Metadata */}
      <div>
        <h4 style={{ marginBottom: 16, color: '#2C3E50' }}>Metadata</h4>
        <Descriptions column={1} size="small">
          <Descriptions.Item label={<><CalendarOutlined /> Updated</>}>
            {new Date(template.updated_at).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </Drawer>
  );
};

export default PDFTemplateDetailPanel;