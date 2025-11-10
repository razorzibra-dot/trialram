/**
 * Products Form Panel
 * Side drawer for creating and editing products
 */

import React, { useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, Spin, message, Row, Col, InputNumber } from 'antd';
import { Product } from '@/types/masters';
import { LoadingSpinner } from '@/modules/core/components/LoadingSpinner';
import { DynamicSelect, DynamicMultiSelect } from '@/components/forms';
import { useReferenceData } from '@/contexts/ReferenceDataContext';

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
  const { getRefDataByCategory } = useReferenceData();
  const title = mode === 'create' ? 'Add New Product' : 'Edit Product';

  const statusOptions = getRefDataByCategory('product_status').map(s => ({ 
    label: s.label, 
    value: s.key 
  }));
  
  const unitOptions = getRefDataByCategory('product_unit').map(u => ({ 
    label: u.label, 
    value: u.key 
  }));

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
      width={550}
      styles={{ body: { padding: '24px' } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={isSaving} onClick={handleSave}>
            {mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </div>
      }
    >
      <Spin spinning={isLoading} indicator={<LoadingSpinner text={isLoading ? 'Loading product data...' : undefined} />}>
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
        >
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
                <Input placeholder="Enter product name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="SKU"
                name="sku"
                rules={[{ required: true, message: 'Please enter SKU' }]}
              >
                <Input placeholder="e.g., SKU001" />
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
                  type="categories" 
                  placeholder="Select category"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Brand"
                name="brand"
              >
                <Input placeholder="Enter brand name" />
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
                <Input placeholder="Enter manufacturer" />
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
              type="suppliers" 
              placeholder="Select supplier (optional)"
              allowClear
            />
          </Form.Item>

          {/* Pricing Row */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Selling Price"
                name="price"
                rules={[{ required: true, message: 'Please enter price' }]}
              >
                <InputNumber
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
                  placeholder="0"
                  min={0}
                  step={1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Description */}
          <Form.Item
            label="Description"
            name="description"
          >
            <Input.TextArea 
              placeholder="Enter product description"
              rows={2}
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
            />
          </Form.Item>
        </Form>
      </Spin>
    </Drawer>
  );
};