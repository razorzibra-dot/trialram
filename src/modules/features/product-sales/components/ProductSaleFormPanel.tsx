/**
 * Product Sale Form Panel
 * Side drawer for creating/editing product sales
 * Aligned with Contracts module standards
 */

import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
  Space,
  message,
  InputNumber,
  DatePicker,
  Divider,
  Spin,
  Empty,
  Alert,
} from 'antd';
import dayjs from 'dayjs';
import { ProductSale, ProductSaleFormData } from '@/types/productSales';
import { productSaleService, customerService } from '@/services';
import { Customer } from '@/types/crm';
import { Product } from '@/types/masters';
import { productService } from '@/services';

interface ProductSaleFormPanelProps {
  visible: boolean;
  productSale: ProductSale | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProductSaleFormPanel: React.FC<ProductSaleFormPanelProps> = ({
  visible,
  productSale,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!productSale;

  // Load customers and products
  useEffect(() => {
    const loadData = async () => {
      if (!visible) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        const [customersData, productsData] = await Promise.all([
          customerService.getCustomers(),
          productService.getProducts(),
        ]);
        
        setCustomers(customersData);
        setProducts(productsData);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load form data';
        setError(errorMsg);
        console.error('Error loading form data:', err);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [visible]);

  // Populate form when editing
  useEffect(() => {
    if (visible && productSale) {
      form.setFieldsValue({
        sale_number: productSale.sale_number,
        customer_id: productSale.customer_id,
        customer_name: productSale.customer_name,
        product_id: productSale.product_id,
        product_name: productSale.product_name,
        quantity: productSale.quantity,
        unit_price: productSale.unit_price,
        total_value: productSale.total_value,
        status: productSale.status,
        sale_date: productSale.sale_date ? dayjs(productSale.sale_date) : null,
        delivery_date: productSale.delivery_date ? dayjs(productSale.delivery_date) : null,
        warranty_period: productSale.warranty_period,
        notes: productSale.notes,
      });
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, productSale, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setError(null);

      // Find customer and product details
      const selectedCustomer = customers.find(c => c.id === values.customer_id);
      const selectedProduct = products.find(p => p.id === values.product_id);

      if (!selectedCustomer) {
        message.error('Selected customer not found');
        setLoading(false);
        return;
      }

      if (!selectedProduct) {
        message.error('Selected product not found');
        setLoading(false);
        return;
      }

      // Prepare form data
      const formData: ProductSaleFormData = {
        customer_id: values.customer_id,
        customer_name: selectedCustomer.company_name || values.customer_name,
        product_id: values.product_id,
        product_name: selectedProduct.name || values.product_name,
        quantity: values.quantity,
        unit_price: values.unit_price,
        total_value: values.quantity * values.unit_price,
        status: values.status || 'pending',
        sale_date: values.sale_date ? values.sale_date.format('YYYY-MM-DD') : new Date().toISOString().split('T')[0],
        delivery_date: values.delivery_date ? values.delivery_date.format('YYYY-MM-DD') : '',
        warranty_period: values.warranty_period || 12,
        notes: values.notes,
      };

      if (isEditMode && productSale) {
        await productSaleService.updateProductSale(productSale.id, formData);
        message.success('Product sale updated successfully');
      } else {
        await productSaleService.createProductSale(formData);
        message.success('Product sale created successfully');
      }

      form.resetFields();
      onSuccess();
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save product sale';
      setError(errorMsg);
      message.error(errorMsg);
      console.error('Error saving product sale:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setError(null);
    onClose();
  };

  // Calculate total value
  const quantity = form.getFieldValue('quantity');
  const unitPrice = form.getFieldValue('unit_price');
  const totalValue = (quantity && unitPrice) ? quantity * unitPrice : 0;

  return (
    <Drawer
      title={isEditMode ? 'Edit Product Sale' : 'Create New Product Sale'}
      placement="right"
      width={550}
      onClose={handleClose}
      open={visible}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
            disabled={dataLoading}
          >
            {isEditMode ? 'Update' : 'Create'}
          </Button>
        </Space>
      }
    >
      {dataLoading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" tip="Loading form data..." />
        </div>
      ) : error ? (
        <Alert
          message="Error Loading Data"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      ) : customers.length === 0 || products.length === 0 ? (
        <Empty
          description={customers.length === 0 ? "No customers available" : "No products available"}
          style={{ marginTop: 50 }}
        />
      ) : (
        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
          autoComplete="off"
        >
          {/* Basic Information */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Basic Information</h3>

          <Form.Item
            label="Sale Number"
            name="sale_number"
            rules={[{ required: true, message: 'Please enter sale number' }]}
          >
            <Input placeholder="Enter or auto-generate sale number" />
          </Form.Item>

          <Form.Item
            label="Customer"
            name="customer_id"
            rules={[{ required: true, message: 'Please select a customer' }]}
          >
            <Select 
              placeholder="Select customer"
              optionLabelProp="label"
            >
              {customers.map(customer => (
                <Select.Option 
                  key={customer.id} 
                  value={customer.id}
                  label={customer.company_name}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{customer.company_name}</div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      {customer.contact_name} • {customer.email}
                    </div>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Divider />

          {/* Product Details */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Product Details</h3>

          <Form.Item
            label="Product"
            name="product_id"
            rules={[{ required: true, message: 'Please select a product' }]}
          >
            <Select placeholder="Select product">
              {products.map(product => (
                <Select.Option key={product.id} value={product.id}>
                  {product.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Quantity"
            name="quantity"
            rules={[
              { required: true, message: 'Please enter quantity' },
              { pattern: /^[0-9]+$/, message: 'Quantity must be a number' }
            ]}
          >
            <InputNumber min={1} placeholder="Enter quantity" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Unit Price"
            name="unit_price"
            rules={[{ required: true, message: 'Please enter unit price' }]}
          >
            <InputNumber
              min={0}
              placeholder="Enter unit price"
              formatter={(value) => `$${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => parseFloat(value?.replace(/\$\s?|(,*)/g, '') as string)}
              precision={2}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="Total Value"
            name="total_value"
          >
            <Input
              value={`$${totalValue.toFixed(2)}`}
              disabled
              style={{ backgroundColor: '#f5f5f5' }}
            />
          </Form.Item>

          <Form.Item
            label="Warranty Period (months)"
            name="warranty_period"
            initialValue={12}
          >
            <InputNumber min={0} placeholder="Enter warranty period in months" style={{ width: '100%' }} />
          </Form.Item>

          <Divider />

          {/* Sale Information */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Sale Information</h3>

          <Form.Item
            label="Sale Date"
            name="sale_date"
            rules={[{ required: true, message: 'Please select sale date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Delivery Date"
            name="delivery_date"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            initialValue="pending"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select placeholder="Select status">
              <Select.Option value="draft">Draft</Select.Option>
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="confirmed">Confirmed</Select.Option>
              <Select.Option value="delivered">Delivered</Select.Option>
              <Select.Option value="cancelled">Cancelled</Select.Option>
              <Select.Option value="refunded">Refunded</Select.Option>
            </Select>
          </Form.Item>

          <Divider />

          {/* Additional Information */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Additional Information</h3>

          <Form.Item
            label="Notes"
            name="notes"
          >
            <Input.TextArea rows={3} placeholder="Enter any additional notes" />
          </Form.Item>
        </Form>
      )}
    </Drawer>
  );
};