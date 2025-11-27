/**
 * Product Variants Modal
 * Display and manage product variants and hierarchy
 */

import React, { useState } from 'react';
import {
  Modal,
  Card,
  Tree,
  Table,
  Button,
  Space,
  Tag,
  Descriptions,
  Divider,
  Empty,
  Spin,
  message,
  Tooltip,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
  AppstoreOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  BranchesOutlined,
} from '@ant-design/icons';
import type { Product } from '@/types/masters';
import {
  useProductHierarchy,
  useProductVariants,
  useProductChildren,
} from '../hooks/useProductVariants';

interface ProductVariantsModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onCreateVariant?: (parentProduct: Product) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
}

const ProductVariantsModal: React.FC<ProductVariantsModalProps> = ({
  visible,
  product,
  onClose,
  onCreateVariant,
  onEditProduct,
  onDeleteProduct,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Fetch hierarchy data
  const { data: hierarchyData, isLoading: hierarchyLoading } = useProductHierarchy(
    product?.id || ''
  );
  const { data: variants, isLoading: variantsLoading } = useProductVariants(
    product?.id || ''
  );

  if (!product) return null;

  const buildTreeData = (): DataNode[] => {
    if (!hierarchyData) return [];

    const { product: currentProduct, parent, children } = hierarchyData;

    // If product has a parent, show parent as root
    if (parent) {
      return [
        {
          title: (
            <span>
              <AppstoreOutlined style={{ marginRight: 8 }} />
              {parent.name}
              <Tag color="blue" style={{ marginLeft: 8 }}>Parent</Tag>
            </span>
          ),
          key: parent.id,
          children: [
            {
              title: (
                <span>
                  <AppstoreOutlined style={{ marginRight: 8 }} />
                  {currentProduct.name}
                  <Tag color="green" style={{ marginLeft: 8 }}>Current</Tag>
                </span>
              ),
              key: currentProduct.id,
              children: children.map(child => ({
                title: (
                  <span>
                    <AppstoreOutlined style={{ marginRight: 8 }} />
                    {child.name}
                    {child.is_variant && <Tag color="orange" style={{ marginLeft: 8 }}>Variant</Tag>}
                  </span>
                ),
                key: child.id,
              })),
            },
            // Add siblings
            ...hierarchyData.siblings.map(sibling => ({
              title: (
                <span>
                  <AppstoreOutlined style={{ marginRight: 8 }} />
                  {sibling.name}
                  {sibling.is_variant && <Tag color="orange" style={{ marginLeft: 8 }}>Variant</Tag>}
                </span>
              ),
              key: sibling.id,
            })),
          ],
        },
      ];
    }

    // If no parent, show current product as root
    return [
      {
        title: (
          <span>
            <AppstoreOutlined style={{ marginRight: 8 }} />
            {currentProduct.name}
            <Tag color="green" style={{ marginLeft: 8 }}>Current</Tag>
          </span>
        ),
        key: currentProduct.id,
        children: children.map(child => ({
          title: (
            <span>
              <AppstoreOutlined style={{ marginRight: 8 }} />
              {child.name}
              {child.is_variant && <Tag color="orange" style={{ marginLeft: 8 }}>Variant</Tag>}
            </span>
          ),
          key: child.id,
        })),
      },
    ];
  };

  const variantColumns = [
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Product) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>SKU: {record.sku}</div>
        </div>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price: number, record: Product) => (
        <span>${price} {record.currency}</span>
      ),
    },
    {
      title: 'Stock',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      width: 100,
      render: (stock: number) => (
        <Tag color={stock > 0 ? 'green' : 'red'}>{stock}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: Product) => (
        <Space size="small">
          <Tooltip title="View">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setSelectedProductId(record.id)}
            />
          </Tooltip>
          {onEditProduct && (
            <Tooltip title="Edit">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEditProduct(record)}
              />
            </Tooltip>
          )}
          {onDeleteProduct && (
            <Tooltip title="Delete">
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDeleteProduct(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const selectedProduct = selectedProductId
    ? [...(variants || []), ...(hierarchyData?.children || [])].find(p => p.id === selectedProductId)
    : null;

  return (
    <Modal
      title={
        <span>
          <BranchesOutlined style={{ marginRight: 8 }} />
          Product Variants & Hierarchy
        </span>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        onCreateVariant && (
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => onCreateVariant(product)}
          >
            Create Variant
          </Button>
        ),
      ]}
    >
      <Spin spinning={hierarchyLoading || variantsLoading}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Product Hierarchy Tree */}
          <Card
            title="Product Hierarchy"
            size="small"
            extra={
              <Tag color="blue">
                {hierarchyData?.children.length || 0} Children
              </Tag>
            }
          >
            {hierarchyData && buildTreeData().length > 0 ? (
              <Tree
                showLine
                showIcon
                defaultExpandAll
                treeData={buildTreeData()}
                onSelect={(keys) => {
                  if (keys.length > 0) {
                    setSelectedProductId(keys[0] as string);
                  }
                }}
              />
            ) : (
              <Empty
                description="No product hierarchy"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>

          {/* Variants List */}
          {variants && variants.length > 0 && (
            <Card
              title="Product Variants"
              size="small"
              extra={<Tag color="orange">{variants.length} Variants</Tag>}
            >
              <Table
                dataSource={variants}
                columns={variantColumns}
                pagination={false}
                size="small"
                rowKey="id"
              />
            </Card>
          )}

          {/* Selected Product Details */}
          {selectedProduct && (
            <Card title="Product Details" size="small">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Name">
                  {selectedProduct.name}
                </Descriptions.Item>
                <Descriptions.Item label="SKU">
                  {selectedProduct.sku}
                </Descriptions.Item>
                <Descriptions.Item label="Type">
                  <Tag color="blue">{selectedProduct.type}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={selectedProduct.status === 'active' ? 'green' : 'default'}>
                    {selectedProduct.status?.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Price">
                  ${selectedProduct.price} {selectedProduct.currency}
                </Descriptions.Item>
                <Descriptions.Item label="Stock">
                  {selectedProduct.stock_quantity}
                </Descriptions.Item>
                <Descriptions.Item label="Is Variant">
                  {selectedProduct.is_variant ? (
                    <Tag color="orange">Yes</Tag>
                  ) : (
                    <Tag>No</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Variant Group">
                  {selectedProduct.variant_group_id || '-'}
                </Descriptions.Item>
                {selectedProduct.description && (
                  <Descriptions.Item label="Description" span={2}>
                    {selectedProduct.description}
                  </Descriptions.Item>
                )}
              </Descriptions>

              {/* Pricing Tiers */}
              {selectedProduct.pricing_tiers && selectedProduct.pricing_tiers.length > 0 && (
                <>
                  <Divider />
                  <h4>Pricing Tiers</h4>
                  <Table
                    dataSource={selectedProduct.pricing_tiers}
                    size="small"
                    pagination={false}
                    columns={[
                      {
                        title: 'Quantity Range',
                        key: 'range',
                        render: (_, record: any) =>
                          `${record.min_quantity} - ${record.max_quantity || '∞'}`,
                      },
                      {
                        title: 'Price',
                        dataIndex: 'price',
                        key: 'price',
                        render: (price: number) => `$${price}`,
                      },
                      {
                        title: 'Discount',
                        dataIndex: 'discount_percentage',
                        key: 'discount',
                        render: (discount: number) => `${discount}%`,
                      },
                    ]}
                  />
                </>
              )}

              {/* Discount Rules */}
              {selectedProduct.discount_rules && selectedProduct.discount_rules.length > 0 && (
                <>
                  <Divider />
                  <h4>Discount Rules</h4>
                  <Table
                    dataSource={selectedProduct.discount_rules}
                    size="small"
                    pagination={false}
                    columns={[
                      {
                        title: 'Type',
                        dataIndex: 'type',
                        key: 'type',
                        render: (type: string) => (
                          <Tag>{type.replace('_', ' ').toUpperCase()}</Tag>
                        ),
                      },
                      {
                        title: 'Value',
                        dataIndex: 'value',
                        key: 'value',
                        render: (value: number, record: any) =>
                          record.type === 'percentage' ? `${value}%` : `$${value}`,
                      },
                      {
                        title: 'Description',
                        dataIndex: 'description',
                        key: 'description',
                      },
                      {
                        title: 'Status',
                        dataIndex: 'is_active',
                        key: 'is_active',
                        render: (active: boolean) => (
                          <Tag color={active ? 'green' : 'default'}>
                            {active ? 'Active' : 'Inactive'}
                          </Tag>
                        ),
                      },
                    ]}
                  />
                </>
              )}
            </Card>
          )}

          {/* Hierarchy Information */}
          {hierarchyData && (
            <Card title="Hierarchy Information" size="small">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Parent Product">
                  {hierarchyData.parent ? (
                    <span>
                      {hierarchyData.parent.name}
                      <Button
                        type="link"
                        size="small"
                        onClick={() => setSelectedProductId(hierarchyData.parent!.id)}
                      >
                        View
                      </Button>
                    </span>
                  ) : (
                    <Tag>Root Product</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Child Products">
                  <Tag color="blue">{hierarchyData.children.length}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Sibling Products">
                  <Tag color="purple">{hierarchyData.siblings.length}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Variant Group">
                  {product.variant_group_id || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}
        </Space>
      </Spin>
    </Modal>
  );
};

export default ProductVariantsModal;