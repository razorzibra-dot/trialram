/**
 * Advanced Filters Modal for Product Sales
 * Provides comprehensive filtering and preset management
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  DatePicker,
  Slider,
  Button,
  Space,
  message,
  Input,
  Tag,
  Row,
  Col,
  Divider,
} from 'antd';
import { DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { ProductSaleFilters, PRODUCT_SALE_STATUSES } from '@/types/productSales';
import { useService } from '@/hooks/useService';

const { RangePicker } = DatePicker;

interface AdvancedFiltersModalProps {
  visible: boolean;
  filters: ProductSaleFilters;
  onApply: (filters: ProductSaleFilters) => void;
  onClose: () => void;
}

interface FilterPreset {
  name: string;
  filters: ProductSaleFilters;
  createdAt: string;
}

export const AdvancedFiltersModal: React.FC<AdvancedFiltersModalProps> = ({
  visible,
  filters,
  onApply,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([]);

  const customerService = useService('customerService');
  const productService = useService('productService');

  // Load customers and products
  useEffect(() => {
    const loadData = async () => {
      try {
        const [customersList, productsList] = await Promise.all([
          customerService.getCustomers?.(),
          productService.getProducts?.(),
        ]);

        if (customersList) {
          setCustomers(
            Array.isArray(customersList)
              ? customersList.map((c: any) => ({
                  id: c.id,
                  name: c.company_name || c.name,
                }))
              : []
          );
        }

        if (productsList) {
          setProducts(
            Array.isArray(productsList)
              ? productsList.map((p: any) => ({
                  id: p.id,
                  name: p.name,
                }))
              : []
          );
        }
      } catch (error) {
        console.error('Error loading filter data:', error);
      }
    };

    if (visible) {
      loadData();
    }
  }, [visible, customerService, productService]);

  // Load presets from localStorage
  useEffect(() => {
    const savedPresets = localStorage.getItem('productSalesFilterPresets');
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets));
      } catch (error) {
        console.error('Error loading presets:', error);
      }
    }
  }, []);

  // Initialize form with current filters
  useEffect(() => {
    if (visible && filters) {
      form.setFieldsValue({
        status: filters.status,
        customer_id: filters.customer_id,
        product_id: filters.product_id,
        dateRange: filters.start_date && filters.end_date 
          ? [dayjs(filters.start_date), dayjs(filters.end_date)]
          : undefined,
        warranty_status: filters.warranty_status,
      });

      if (filters.min_price && filters.max_price) {
        setPriceRange([filters.min_price, filters.max_price]);
      }
    }
  }, [visible, filters, form]);

  const handleApplyFilters = async () => {
    try {
      const values = await form.validateFields();
      
      const newFilters: ProductSaleFilters = {
        status: values.status,
        customer_id: values.customer_id,
        product_id: values.product_id,
        warranty_status: values.warranty_status,
        min_price: priceRange[0],
        max_price: priceRange[1],
      };

      if (values.dateRange) {
        newFilters.start_date = values.dateRange[0].format('YYYY-MM-DD');
        newFilters.end_date = values.dateRange[1].format('YYYY-MM-DD');
      }

      onApply(newFilters);
      message.success('Filters applied successfully');
      onClose();
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  };

  const handleResetFilters = () => {
    form.resetFields();
    setPriceRange([0, 1000000]);
    onApply({});
    onClose();
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      message.error('Please enter a preset name');
      return;
    }

    try {
      const values = form.getFieldsValue();
      const newPreset: FilterPreset = {
        name: presetName,
        filters: {
          status: values.status,
          customer_id: values.customer_id,
          product_id: values.product_id,
          warranty_status: values.warranty_status,
          min_price: priceRange[0],
          max_price: priceRange[1],
          start_date: values.dateRange?.[0]?.format('YYYY-MM-DD'),
          end_date: values.dateRange?.[1]?.format('YYYY-MM-DD'),
        },
        createdAt: new Date().toISOString(),
      };

      const updatedPresets = [...presets, newPreset];
      setPresets(updatedPresets);
      localStorage.setItem('productSalesFilterPresets', JSON.stringify(updatedPresets));
      setPresetName('');
      message.success('Preset saved successfully');
    } catch (error) {
      message.error('Failed to save preset');
      console.error('Error saving preset:', error);
    }
  };

  const handleLoadPreset = (preset: FilterPreset) => {
    form.setFieldsValue({
      status: preset.filters.status,
      customer_id: preset.filters.customer_id,
      product_id: preset.filters.product_id,
      warranty_status: preset.filters.warranty_status,
      dateRange: preset.filters.start_date && preset.filters.end_date
        ? [dayjs(preset.filters.start_date), dayjs(preset.filters.end_date)]
        : undefined,
    });

    if (preset.filters.min_price && preset.filters.max_price) {
      setPriceRange([preset.filters.min_price, preset.filters.max_price]);
    }
  };

  const handleDeletePreset = (index: number) => {
    const updatedPresets = presets.filter((_, i) => i !== index);
    setPresets(updatedPresets);
    localStorage.setItem('productSalesFilterPresets', JSON.stringify(updatedPresets));
    message.success('Preset deleted');
  };

  return (
    <Modal
      title="Advanced Filters"
      open={visible}
      onCancel={onClose}
      width={700}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={handleResetFilters}>Reset</Button>
          <Button type="primary" onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        {/* Status Filter */}
        <Form.Item label="Status" name="status">
          <Select
            placeholder="Select status"
            allowClear
            mode="multiple"
          >
            {PRODUCT_SALE_STATUSES.map((status) => (
              <Select.Option key={status.value} value={status.value}>
                {status.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Date Range Filter */}
        <Form.Item label="Sale Date Range" name="dateRange">
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>

        {/* Price Range Filter */}
        <Form.Item label="Price Range">
          <div style={{ marginBottom: 10 }}>
            <span>${priceRange[0].toLocaleString()}</span>
            {' - '}
            <span>${priceRange[1].toLocaleString()}</span>
          </div>
          <Slider
            range
            min={0}
            max={1000000}
            step={1000}
            value={priceRange}
            onChange={(value) => setPriceRange(value as [number, number])}
          />
        </Form.Item>

        {/* Customer Filter */}
        <Form.Item label="Customer" name="customer_id">
          <Select
            placeholder="Select customers"
            allowClear
            mode="multiple"
            optionLabelProp="label"
          >
            {customers.map((customer) => (
              <Select.Option key={customer.id} value={customer.id} label={customer.name}>
                {customer.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Product Filter */}
        <Form.Item label="Product" name="product_id">
          <Select
            placeholder="Select products"
            allowClear
            mode="multiple"
            optionLabelProp="label"
          >
            {products.map((product) => (
              <Select.Option key={product.id} value={product.id} label={product.name}>
                {product.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Warranty Status Filter */}
        <Form.Item label="Warranty Status" name="warranty_status">
          <Select placeholder="Select warranty status" allowClear>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="expiring_soon">Expiring Soon (30 days)</Select.Option>
            <Select.Option value="expired">Expired</Select.Option>
          </Select>
        </Form.Item>
      </Form>

      {/* Preset Management */}
      <Divider>Manage Presets</Divider>

      <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <Input
            placeholder="Enter preset name"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onPressEnter={handleSavePreset}
          />
        </Col>
        <Col span={8}>
          <Button
            block
            icon={<SaveOutlined />}
            onClick={handleSavePreset}
          >
            Save Preset
          </Button>
        </Col>
      </Row>

      {presets.length > 0 && (
        <div>
          <div style={{ marginBottom: 8, fontSize: 12, color: '#999' }}>
            Saved Presets:
          </div>
          <Space wrap>
            {presets.map((preset, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  background: '#f5f5f5',
                  borderRadius: 4,
                }}
              >
                <span
                  onClick={() => handleLoadPreset(preset)}
                  style={{
                    cursor: 'pointer',
                    color: '#1890ff',
                    textDecoration: 'underline',
                  }}
                >
                  {preset.name}
                </span>
                <DeleteOutlined
                  onClick={() => handleDeletePreset(index)}
                  style={{ cursor: 'pointer', color: '#ff4d4f' }}
                />
              </div>
            ))}
          </Space>
        </div>
      )}
    </Modal>
  );
};