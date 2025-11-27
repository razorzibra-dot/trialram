/**
 * Product Comparison Modal
 * Allows users to compare selected products side by side
 */

import React from 'react';
import { Modal, Row, Col, Card, Tag, Divider, Button, Space } from 'antd';
import { Product } from '@/types/masters';
import { CloseOutlined } from '@ant-design/icons';

interface ProductComparisonModalProps {
  visible: boolean;
  products: Product[];
  onClose: () => void;
  onRemoveProduct?: (productId: string) => void;
}

const ProductComparisonModal: React.FC<ProductComparisonModalProps> = ({
  visible,
  products,
  onClose,
  onRemoveProduct,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'default';
      case 'discontinued': return 'red';
      default: return 'default';
    }
  };

  const renderProductCard = (product: Product, index: number) => (
    <Col key={product.id} xs={24} sm={12} lg={Math.max(24 / products.length, 6)}>
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{product.name}</span>
            {onRemoveProduct && (
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => onRemoveProduct(product.id)}
                style={{ color: '#ff4d4f' }}
              />
            )}
          </div>
        }
        size="small"
        style={{ height: '100%' }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <strong>SKU:</strong> {product.sku}
          </div>
          <div>
            <strong>Price:</strong> ${product.price} {product.currency}
          </div>
          <div>
            <strong>Stock:</strong>
            <span style={{
              color: product.stock_quantity <= (product.min_stock_level || 0) ? 'red' : 'green',
              marginLeft: 8
            }}>
              {product.stock_quantity}
            </span>
          </div>
          <div>
            <strong>Status:</strong>
            <Tag color={getStatusColor(product.status)} style={{ marginLeft: 8 }}>
              {product.status?.toUpperCase()}
            </Tag>
          </div>
          <div>
            <strong>Category:</strong> {product.categoryName || (product as any).category?.name || 'Not specified'}
          </div>
          <div>
            <strong>Type:</strong> {product.type || 'Not specified'}
          </div>
          {product.description && (
            <div>
              <strong>Description:</strong>
              <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                {product.description}
              </div>
            </div>
          )}
        </Space>
      </Card>
    </Col>
  );

  return (
    <Modal
      title={`Compare Products (${products.length})`}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>
      ]}
      width={Math.min(1200, products.length * 400)}
      style={{ top: 20 }}
    >
      <Row gutter={[16, 16]}>
        {products.map((product, index) => renderProductCard(product, index))}
      </Row>

      {products.length > 1 && (
        <>
          <Divider>Comparison Summary</Divider>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card size="small" title="Price Range">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Lowest: ${Math.min(...products.map(p => p.price))}</span>
                  <span>Highest: ${Math.max(...products.map(p => p.price))}</span>
                  <span>Average: ${(products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2)}</span>
                </div>
              </Card>
            </Col>
            <Col span={24}>
              <Card size="small" title="Stock Levels">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Stock: {products.reduce((sum, p) => sum + p.stock_quantity, 0)}</span>
                  <span>Low Stock Items: {products.filter(p => p.stock_quantity <= (p.min_stock_level || 0)).length}</span>
                  <span>Average Stock: {Math.round(products.reduce((sum, p) => sum + p.stock_quantity, 0) / products.length)}</span>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Modal>
  );
};

export default ProductComparisonModal;