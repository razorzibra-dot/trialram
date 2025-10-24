/**
 * Product Sale Detail Panel
 * Side drawer for viewing product sale details in read-only mode
 * Aligned with Contracts module standards
 */

import React from 'react';
import {
  Drawer,
  Descriptions,
  Button,
  Space,
  Divider,
  Tag,
  Empty,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  EditOutlined,
  MailOutlined,
  CalendarOutlined,
  DollarOutlined,
  UserOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { ProductSale } from '@/types/productSales';

interface ProductSaleDetailPanelProps {
  visible: boolean;
  productSale: ProductSale | null;
  onClose: () => void;
  onEdit: () => void;
}

export const ProductSaleDetailPanel: React.FC<ProductSaleDetailPanelProps> = ({
  visible,
  productSale,
  onClose,
  onEdit,
}) => {
  if (!productSale) {
    return null;
  }

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      'draft': 'default',
      'pending': 'processing',
      'confirmed': 'success',
      'delivered': 'success',
      'cancelled': 'error',
      'refunded': 'warning',
    };
    return colorMap[status] || 'default';
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const displayStatus = productSale.status
    .replace('_', ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return (
    <Drawer
      title="Product Sale Details"
      placement="right"
      width={550}
      onClose={onClose}
      open={visible}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose}>Close</Button>
          <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
            Edit
          </Button>
        </Space>
      }
    >
      {productSale ? (
        <div>
          {/* Key Metrics */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12}>
              <Statistic
                title="Total Value"
                value={formatCurrency(productSale.total_value || 0)}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#1890ff', fontSize: 18 }}
              />
            </Col>
            <Col xs={12}>
              <Statistic
                title="Quantity"
                value={productSale.quantity}
                prefix={<ShoppingCartOutlined />}
                valueStyle={{ fontSize: 18 }}
              />
            </Col>
          </Row>

          <Divider />

          {/* Sale Information */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Sale Information</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Sale Number">
              {productSale.sale_number}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(productSale.status)}>
                {displayStatus}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Sale Date">
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <CalendarOutlined style={{ marginRight: 8 }} />
                {formatDate(productSale.sale_date)}
              </span>
            </Descriptions.Item>
            {productSale.delivery_date && (
              <Descriptions.Item label="Delivery Date">
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarOutlined style={{ marginRight: 8 }} />
                  {formatDate(productSale.delivery_date)}
                </span>
              </Descriptions.Item>
            )}
          </Descriptions>

          <Divider />

          {/* Customer Information */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Customer Information</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Customer Name">
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <UserOutlined style={{ marginRight: 8 }} />
                {productSale.customer_name}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Customer ID">
              {productSale.customer_id}
            </Descriptions.Item>
            {productSale.customer_email && (
              <Descriptions.Item label="Email">
                <a href={`mailto:${productSale.customer_email}`}>
                  <MailOutlined style={{ marginRight: 8 }} />
                  {productSale.customer_email}
                </a>
              </Descriptions.Item>
            )}
          </Descriptions>

          <Divider />

          {/* Product Information */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Product Information</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Product Name">
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <ShoppingCartOutlined style={{ marginRight: 8 }} />
                {productSale.product_name}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Product ID">
              {productSale.product_id}
            </Descriptions.Item>
            <Descriptions.Item label="Quantity">
              {productSale.quantity}
            </Descriptions.Item>
            <Descriptions.Item label="Unit Price">
              {formatCurrency(productSale.unit_price || 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Total Value">
              <span style={{ fontWeight: 600, color: '#1890ff' }}>
                {formatCurrency(productSale.total_value || 0)}
              </span>
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          {/* Warranty Information */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Warranty Information</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Warranty Period">
              {productSale.warranty_period ? `${productSale.warranty_period} months` : 'Not specified'}
            </Descriptions.Item>
            {productSale.warranty_expiry_date && (
              <Descriptions.Item label="Warranty Expiry Date">
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarOutlined style={{ marginRight: 8 }} />
                  {formatDate(productSale.warranty_expiry_date)}
                </span>
              </Descriptions.Item>
            )}
          </Descriptions>

          {/* Additional Information */}
          {productSale.notes && (
            <>
              <Divider />
              <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Notes</h3>
              <div
                style={{
                  padding: 12,
                  background: '#f5f5f5',
                  borderRadius: 4,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {productSale.notes}
              </div>
            </>
          )}

          {/* Service Contract Link */}
          {productSale.service_contract_id && (
            <>
              <Divider />
              <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Service Contract</h3>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Contract ID">
                  {productSale.service_contract_id}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color="blue">Linked</Tag>
                </Descriptions.Item>
              </Descriptions>
            </>
          )}

          {/* Metadata */}
          {productSale.created_at && (
            <>
              <Divider />
              <div style={{ fontSize: 12, color: '#999' }}>
                <div>Created: {formatDate(productSale.created_at)}</div>
                {productSale.updated_at && (
                  <div>Last Updated: {formatDate(productSale.updated_at)}</div>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <Empty description="No sale selected" />
      )}
    </Drawer>
  );
};