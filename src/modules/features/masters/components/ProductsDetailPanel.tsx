/**
 * Products Detail Panel
 * Read-only side drawer for viewing product details
 */

import React from 'react';
import { Drawer, Button, Row, Col, Tag, Empty, Spin, Divider, Space } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { Product } from '@/types/masters';
import { useAuth } from '@/contexts/AuthContext';

interface ProductsDetailPanelProps {
  product: Product | null;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onEdit: () => void;
}

/**
 * Status color mapping
 */
const statusColors: Record<string, string> = {
  active: 'green',
  inactive: 'default',
  discontinued: 'red',
};

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

/**
 * Format currency
 */
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const ProductsDetailPanel: React.FC<ProductsDetailPanelProps> = ({
  product,
  isOpen,
  isLoading = false,
  onClose,
  onEdit,
}) => {
  const { hasPermission } = useAuth();

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span>Product Details</span>
          {hasPermission('crm:product:record:update') && (
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={onEdit}
              style={{ marginRight: 16 }}
            >
              Edit
            </Button>
          )}
        </div>
      }
      placement="right"
      onClose={onClose}
      open={isOpen}
      width={500}
      styles={{ body: { padding: '24px' } }}
    >
      <Spin spinning={isLoading}>
        {/* Product Name Section */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 12px 0', color: '#111827', fontSize: 20, fontWeight: 600 }}>
            {product.name}
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Tag color={statusColors[product.status || 'active']}>
              {(product.status || 'active').toUpperCase()}
            </Tag>
            <Tag color={stockStatus.color}>{stockStatus.label}</Tag>
          </div>
        </div>

        {/* Basic Information */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#111827' }}>
            Basic Information
          </h3>
          <Descriptions
            items={[
              { label: 'Product ID', value: product.id },
              { label: 'SKU', value: product.sku },
              { label: 'Category', value: product.category },
              { label: 'Brand', value: product.brand },
            ]}
          />
        </div>

        <Divider />

        {/* Pricing & Stock */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#111827' }}>
            Pricing & Stock
          </h3>
          <Descriptions
            items={[
              { label: 'Price', value: formatCurrency(product.price || 0) },
              { label: 'Cost Price', value: formatCurrency(product.cost_price || 0) },
              { label: 'Current Stock', value: `${product.stock_quantity || 0} units` },
              { label: 'Reorder Level', value: `${product.reorder_level || 0} units` },
            ]}
          />
        </div>

        <Divider />

        {/* Additional Details */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#111827' }}>
            Additional Details
          </h3>
          <Descriptions
            items={[
              { label: 'Manufacturer', value: product.manufacturer },
              { label: 'Unit', value: product.unit },
              { label: 'Description', value: product.description },
            ]}
          />
        </div>

        {product.notes && (
          <>
            <Divider />
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#111827' }}>
                Notes
              </h3>
              <p style={{ color: '#666', margin: 0, whiteSpace: 'pre-wrap' }}>
                {product.notes}
              </p>
            </div>
          </>
        )}

        {/* Meta Information */}
        <Divider />
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#111827' }}>
            Meta Information
          </h3>
          <Descriptions
            items={[
              { label: 'Created', value: product.created_at ? new Date(product.created_at).toLocaleDateString() : '-' },
              { label: 'Last Updated', value: product.updated_at ? new Date(product.updated_at).toLocaleDateString() : '-' },
            ]}
          />
        </div>
      </Spin>
    </Drawer>
  );
};