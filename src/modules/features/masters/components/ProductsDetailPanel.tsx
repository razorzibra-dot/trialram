/**
 * Products Detail Panel
 * Read-only side drawer for viewing product details
 */

import React from 'react';
import { Drawer, Button, Row, Col, Tag, Empty, Spin, Divider, Space, Card, Statistic } from 'antd';
import { EditOutlined, ShoppingOutlined, InfoCircleOutlined, DollarOutlined, FileTextOutlined } from '@ant-design/icons';
import { Product } from '@/types/masters';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/formatters';
import { useReferenceDataLookup } from '@/hooks/useReferenceDataLookup';

interface ProductsDetailPanelProps {
  product: Product | null;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onEdit: () => void;
}

/**
 * Stock status helper
 */
const getStockStatus = (product: Product) => {
  const stock = product.stock_quantity || 0;
  const reorderLevel = product.reorder_level || 0;
  
  if (stock === 0) {
    return { label: 'Out of Stock', color: 'red' };
  } else if (stock <= reorderLevel) {
    return { label: 'Low Stock', color: 'orange' };
  } else {
    return { label: 'In Stock', color: 'green' };
  }
};

/**
 * Descriptions component for formatted display
 */
const Descriptions: React.FC<{
  items: Array<{ label: string; value: React.ReactNode }>;
}> = ({ items }) => (
  <div style={{ fontSize: 14 }}>
    {items.map((item, index) => (
      <Row key={index} style={{ marginBottom: 16, paddingBottom: 12, borderBottom: index < items.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
        <Col span={8} style={{ color: '#666', fontWeight: 500 }}>
          {item.label}
        </Col>
        <Col span={16} style={{ color: '#000' }}>
          {item.value || '-'}
        </Col>
      </Row>
    ))}
  </div>
);

export const ProductsDetailPanel: React.FC<ProductsDetailPanelProps> = ({
  product,
  isOpen,
  isLoading = false,
  onClose,
  onEdit,
}) => {
  const { hasPermission } = useAuth();
  
  // Database-driven lookups
  const { getColor: getStatusColor } = useReferenceDataLookup('product_status');

  // Section styles configuration
  const sectionStyles = {
    card: {
      marginBottom: 20,
      borderRadius: 8,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 12,
      borderBottom: '2px solid #e5e7eb',
    },
    headerIcon: {
      fontSize: 18,
      color: '#0ea5e9',
      marginRight: 10,
    },
    headerTitle: {
      fontSize: 15,
      fontWeight: 600,
      color: '#1f2937',
      margin: 0,
    },
  };

  if (!product) {
    return (
      <Drawer
        title="Product Details"
        placement="right"
        onClose={onClose}
        open={isOpen}
        width={500}
        styles={{ body: { padding: 0 } }}
      >
        <Empty description="No product selected" />
      </Drawer>
    );
  }

  const stockStatus = getStockStatus(product);

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShoppingOutlined style={{ fontSize: 20, color: '#0ea5e9' }} />
          <span>Product Details</span>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={isOpen}
      width={650}
      styles={{ body: { padding: 0, paddingTop: 24 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button size="large" onClick={onClose}>
            Close
          </Button>
          {hasPermission('crm:product:record:update') && (
            <Button
              type="primary"
              size="large"
              icon={<EditOutlined />}
              onClick={onEdit}
            >
              Edit Product
            </Button>
          )}
        </div>
      }
    >
      <div style={{ padding: '0 24px 24px 24px' }}>
        <Spin spinning={isLoading}>
          {/* Product Overview Card */}
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <ShoppingOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Product Overview</h3>
            </div>
            <h2 style={{ margin: '0 0 12px 0', color: '#111827', fontSize: 20, fontWeight: 600 }}>
              {product.name}
            </h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Tag color={getStatusColor(product.status || 'active')}>
                {(product.status || 'active').toUpperCase()}
              </Tag>
              <Tag color={stockStatus.color}>{stockStatus.label}</Tag>
            </div>
          </Card>

          {/* Basic Information Card */}
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <InfoCircleOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Basic Information</h3>
            </div>
            <Descriptions
              items={[
                { label: 'Product ID', value: product.id },
                { label: 'SKU', value: product.sku },
                { label: 'Category', value: product.categoryName || product.category_id || '-' },
                { label: 'Brand', value: product.brand },
              ]}
            />
          </Card>

          {/* Pricing & Stock Card */}
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <DollarOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Pricing & Stock</h3>
            </div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Statistic
                  title="Selling Price"
                  value={product.price || 0}
                  prefix="$"
                  precision={2}
                  valueStyle={{ color: '#0ea5e9' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Cost Price"
                  value={product.cost_price || 0}
                  prefix="$"
                  precision={2}
                  valueStyle={{ color: '#10b981' }}
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Current Stock"
                  value={product.stock_quantity || 0}
                  suffix="units"
                  valueStyle={{ color: stockStatus.color === 'red' ? '#ef4444' : stockStatus.color === 'orange' ? '#f59e0b' : '#10b981' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Reorder Level"
                  value={product.reorder_level || 0}
                  suffix="units"
                  valueStyle={{ color: '#8b5cf6' }}
                />
              </Col>
            </Row>
          </Card>

          {/* Additional Details Card */}
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <InfoCircleOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Additional Details</h3>
            </div>
            <Descriptions
              items={[
                { label: 'Manufacturer', value: product.manufacturer },
                { label: 'Unit', value: product.unit },
                { label: 'Description', value: product.description },
              ]}
            />
          </Card>

          {product.notes && (
            <Card style={sectionStyles.card} variant="borderless">
              <div style={sectionStyles.header}>
                <FileTextOutlined style={sectionStyles.headerIcon} />
                <h3 style={sectionStyles.headerTitle}>Notes</h3>
              </div>
              <p style={{ color: '#666', margin: 0, whiteSpace: 'pre-wrap' }}>
                {product.notes}
              </p>
            </Card>
          )}

          {/* Meta Information Card */}
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <InfoCircleOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Meta Information</h3>
            </div>
            <Descriptions
              items={[
                { label: 'Created', value: product.created_at ? new Date(product.created_at).toLocaleDateString() : '-' },
                { label: 'Last Updated', value: product.updated_at ? new Date(product.updated_at).toLocaleDateString() : '-' },
              ]}
            />
          </Card>
        </Spin>
      </div>
    </Drawer>
  );
};