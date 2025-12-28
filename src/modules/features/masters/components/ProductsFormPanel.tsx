/**
 * Products Form Panel
 * Side drawer for creating and editing products
 */

import React, { useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, Spin, message, Row, Col, InputNumber, Card } from 'antd';
import { LockOutlined, SaveOutlined, CloseOutlined, ShoppingOutlined, TagOutlined, DollarOutlined, FileTextOutlined } from '@ant-design/icons';

const sectionStyles = {
  card: { marginBottom: 20, borderRadius: 8, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' },
  header: { display: 'flex', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid #e5e7eb' },
  headerIcon: { fontSize: 20, color: '#0ea5e9', marginRight: 10, fontWeight: 600 },
  headerTitle: { fontSize: 15, fontWeight: 600, color: '#1f2937', margin: 0 },
};
import { Product } from '@/types/masters';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/modules/core/components/LoadingSpinner';
import { DynamicSelect } from '@/components/forms';
import { useCurrentTenant } from '@/hooks/useCurrentTenant';
import { useReferenceDataByCategory } from '@/hooks/useReferenceDataOptions';

interface ProductsFormPanelProps {
  product: Product | null;
  isOpen: boolean;
  mode: 'create' | 'edit';
  isLoading?: boolean;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (values: Partial<Product>) => Promise<void>;
}

export const ProductsFormPanel: React.FC<ProductsFormPanelProps> = ({
  product,
  isOpen,
  mode,
  isLoading = false,
  isSaving = false,
  onClose,
  onSave,
}) => {
  const [form] = Form.useForm();
  const currentTenant = useCurrentTenant();
  const tenantId = currentTenant?.id || '';
  
  const title = mode === 'create' ? 'Add New Product' : 'Edit Product';

  // ✅ Base permissions for create/update actions (synchronous - consistent pattern)
  const { hasPermission } = useAuth();
  const canCreateProduct = hasPermission('crm:product:record:create');
  const canUpdateProduct = hasPermission('crm:product:record:update');
  const finalCanSaveProduct = mode === 'edit' ? canUpdateProduct : canCreateProduct;

  // ✅ Database-driven dropdowns
  const { options: statusOptions } = useReferenceDataByCategory(tenantId, 'product_status');
  const { options: unitOptions } = useReferenceDataByCategory(tenantId, 'product_unit');

  useEffect(() => {
    if (isOpen && product && mode === 'edit') {
      form.setFieldsValue({
        name: product.name,
        sku: product.sku,
        category_id: product.category_id,
        brand: product.brand,
        manufacturer: product.manufacturer,
        price: product.price,
        cost_price: product.cost_price,
        stock_quantity: product.stock_quantity,
        reorder_level: product.reorder_level,
        unit: product.unit,
        status: product.status,
        description: product.description,
        notes: product.notes,
        supplier_id: product.supplier_id,
      });
    } else if (mode === 'create') {
      form.resetFields();
      form.setFieldsValue({ status: 'active' });
    }
  }, [isOpen, product, mode, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await onSave(values);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Drawer
      title={title}
      placement="right"
      onClose={onClose}
      open={isOpen}
      width={600}
      styles={{ body: { padding: 0, paddingTop: 24 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button size="large" onClick={onClose} icon={<CloseOutlined />}>Cancel</Button>
          <Button
            type="primary"
            size="large"
            loading={isSaving}
            onClick={handleSave}
            disabled={!finalCanSaveProduct}
            icon={!finalCanSaveProduct ? <LockOutlined /> : <SaveOutlined />}
          >
            {mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </div>
      }
    >
      <Spin spinning={isLoading} indicator={<LoadingSpinner text={isLoading ? 'Loading product data...' : undefined} />}>
        <div style={{ padding: '0 24px 24px 24px' }}>
          <Form
            form={form}
            layout="vertical"
            autoComplete="off"
          >
            <Card style={sectionStyles.card} variant="borderless">
              <div style={sectionStyles.header}>
                <ShoppingOutlined style={sectionStyles.headerIcon} />
                <h3 style={sectionStyles.headerTitle}>Product Details</h3>
              </div>

              {/* Product Name and SKU Row */}
              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item
                    label="Product Name"
                    name="name"
                    rules={[
                      { required: true, message: 'Please enter product name' },
                      { min: 2, message: 'Product name must be at least 2 characters' },
                    ]}
                  >
                    <Input size="large" placeholder="Enter product name" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="SKU"
                    name="sku"
                    rules={[{ required: true, message: 'Please enter SKU' }]}
                  >
                    <Input size="large" placeholder="e.g., SKU001" />
                  </Form.Item>
                </Col>
              </Row>

              {/* Category and Brand Row */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Category"
                    name="category_id"
                    rules={[{ required: true, message: 'Please select category' }]}
                  >
                    <DynamicSelect 
                      size="large"
                      type="categories" 
                      tenantId={tenantId}
                      placeholder="Select category"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Brand"
                    name="brand"
                  >
                    <Input size="large" placeholder="Enter brand name" />
                  </Form.Item>
                </Col>
              </Row>

              {/* Manufacturer and Status Row */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Manufacturer"
                    name="manufacturer"
                  >
                    <Input size="large" placeholder="Enter manufacturer" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Status"
                    name="status"
                    initialValue="active"
                    rules={[{ required: true, message: 'Please select status' }]}
                  >
                    <Select
                      size="large"
                      options={statusOptions}
                      placeholder="Select status"
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Unit */}
              <Form.Item
                label="Unit of Measurement"
                name="unit"
                rules={[{ required: true, message: 'Please select unit' }]}
              >
                <Select
                  size="large"
                  options={unitOptions}
                  placeholder="Select unit"
                />
              </Form.Item>

              {/* Supplier */}
              <Form.Item
                label="Supplier"
                name="supplier_id"
              >
                <DynamicSelect
                  size="large"
                  type="suppliers" 
                  tenantId={tenantId}
                  placeholder="Select supplier (optional)"
                  allowClear
                />
              </Form.Item>
            </Card>

            <Card style={sectionStyles.card} variant="borderless">
              <div style={sectionStyles.header}>
                <DollarOutlined style={sectionStyles.headerIcon} />
                <h3 style={sectionStyles.headerTitle}>Pricing & Inventory</h3>
              </div>

              {/* Pricing Row */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Selling Price"
                    name="price"
                    rules={[{ required: true, message: 'Please enter price' }]}
                  >
                    <InputNumber
                      size="large"
                      prefix="$"
                      placeholder="0.00"
                      precision={2}
                      step={0.01}
                      min={0}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Cost Price"
                    name="cost_price"
                  >
                    <InputNumber
                      size="large"
                      prefix="$"
                      placeholder="0.00"
                      precision={2}
                      step={0.01}
                      min={0}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Stock Row */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Current Stock"
                    name="stock_quantity"
                    rules={[{ required: true, message: 'Please enter stock quantity' }]}
                  >
                    <InputNumber
                      size="large"
                      placeholder="0"
                      min={0}
                      step={1}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Reorder Level"
                    name="reorder_level"
                  >
                    <InputNumber
                      size="large"
                      placeholder="0"
                      min={0}
                      step={1}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card style={sectionStyles.card} variant="borderless">
              <div style={sectionStyles.header}>
                <FileTextOutlined style={sectionStyles.headerIcon} />
                <h3 style={sectionStyles.headerTitle}>Additional Information</h3>
              </div>

              {/* Description */}
              <Form.Item
                label="Description"
                name="description"
              >
                <Input.TextArea 
                  placeholder="Enter product description"
                  rows={2}
                  style={{ fontFamily: 'inherit' }}
                />
              </Form.Item>

              {/* Notes */}
              <Form.Item
                label="Notes"
                name="notes"
              >
                <Input.TextArea 
                  placeholder="Add any additional notes"
                  rows={2}
                  style={{ fontFamily: 'inherit' }}
                />
              </Form.Item>
            </Card>
          </Form>
        </div>
      </Spin>
    </Drawer>
  );
};