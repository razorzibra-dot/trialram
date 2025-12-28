/**
 * Product Form Modal
 * Comprehensive form for creating/editing products with variants and pricing
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Space,
  Tabs,
  Card,
  Row,
  Col,
  Divider,
  Table,
  Tag,
  message,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  DollarOutlined,
  TagsOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import type { Product, ProductFormData, PricingTier, DiscountRule } from '@/types/masters';
import { useReferenceDataByCategory } from '@/hooks/useReferenceDataOptions';
import { useCurrentTenantId } from '@/hooks/usePermission';
import { PRODUCT_TYPES, CURRENCIES } from '@/types/masters';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface ProductFormModalProps {
  visible: boolean;
  product?: Product | null;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  loading?: boolean;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  visible,
  product,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('basic');
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [isVariant, setIsVariant] = useState(false);
  
  const tenantId = useCurrentTenantId();
  const { options: categoryOptions, loading: categoriesLoading } = useReferenceDataByCategory(tenantId, 'product_category');

  useEffect(() => {
    if (visible && product) {
      // Populate form with existing product data
      form.setFieldsValue({
        name: product.name,
        sku: product.sku,
        type: product.type,
        category_id: product.category_id,
        description: product.description,
        price: product.price,
        cost_price: product.cost_price,
        currency: product.currency || 'USD',
        stock_quantity: product.stock_quantity,
        min_stock_level: product.min_stock_level,
        max_stock_level: product.max_stock_level,
        unit: product.unit,
        status: product.status,
        warranty_period: product.warranty_period,
        service_contract_available: product.service_contract_available,
        parent_id: product.parent_id,
        is_variant: product.is_variant,
        variant_group_id: product.variant_group_id,
      });
      
      setPricingTiers(product.pricing_tiers || []);
      setDiscountRules(product.discount_rules || []);
      setIsVariant(product.is_variant || false);
    } else if (visible) {
      // Reset form for new product
      form.resetFields();
      setPricingTiers([]);
      setDiscountRules([]);
      setIsVariant(false);
    }
  }, [visible, product, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData: ProductFormData = {
        ...values,
        pricing_tiers: pricingTiers,
        discount_rules: discountRules,
      };
      
      await onSubmit(formData);
      form.resetFields();
      setPricingTiers([]);
      setDiscountRules([]);
      onClose();
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleAddPricingTier = () => {
    const newTier: PricingTier = {
      id: `tier_${Date.now()}`,
      min_quantity: 1,
      max_quantity: undefined,
      price: 0,
      discount_percentage: 0,
      description: '',
    };
    setPricingTiers([...pricingTiers, newTier]);
  };

  const handleRemovePricingTier = (id: string) => {
    setPricingTiers(pricingTiers.filter(tier => tier.id !== id));
  };

  const handleUpdatePricingTier = (id: string, field: keyof PricingTier, value: any) => {
    setPricingTiers(pricingTiers.map(tier =>
      tier.id === id ? { ...tier, [field]: value } : tier
    ));
  };

  const handleAddDiscountRule = () => {
    const newRule: DiscountRule = {
      id: `rule_${Date.now()}`,
      type: 'percentage',
      value: 0,
      description: '',
      is_active: true,
      conditions: {},
    };
    setDiscountRules([...discountRules, newRule]);
  };

  const handleRemoveDiscountRule = (id: string) => {
    setDiscountRules(discountRules.filter(rule => rule.id !== id));
  };

  const handleUpdateDiscountRule = (id: string, field: keyof DiscountRule, value: any) => {
    setDiscountRules(discountRules.map(rule =>
      rule.id === id ? { ...rule, [field]: value } : rule
    ));
  };

  const pricingTierColumns = [
    {
      title: 'Min Quantity',
      dataIndex: 'min_quantity',
      key: 'min_quantity',
      width: 120,
      render: (value: number, record: PricingTier) => (
        <InputNumber
          min={1}
          value={value}
          onChange={(val) => handleUpdatePricingTier(record.id, 'min_quantity', val)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Max Quantity',
      dataIndex: 'max_quantity',
      key: 'max_quantity',
      width: 120,
      render: (value: number | undefined, record: PricingTier) => (
        <InputNumber
          min={record.min_quantity + 1}
          value={value}
          onChange={(val) => handleUpdatePricingTier(record.id, 'max_quantity', val)}
          placeholder="Unlimited"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (value: number, record: PricingTier) => (
        <InputNumber
          min={0}
          precision={2}
          prefix="$"
          value={value}
          onChange={(val) => handleUpdatePricingTier(record.id, 'price', val)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Discount %',
      dataIndex: 'discount_percentage',
      key: 'discount_percentage',
      width: 100,
      render: (value: number, record: PricingTier) => (
        <InputNumber
          min={0}
          max={100}
          precision={2}
          suffix="%"
          value={value}
          onChange={(val) => handleUpdatePricingTier(record.id, 'discount_percentage', val)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (value: string, record: PricingTier) => (
        <Input
          value={value}
          onChange={(e) => handleUpdatePricingTier(record.id, 'description', e.target.value)}
          placeholder="Optional description"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: any, record: PricingTier) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemovePricingTier(record.id)}
        />
      ),
    },
  ];

  const discountRuleColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (value: string, record: DiscountRule) => (
        <Select
          value={value}
          onChange={(val) => handleUpdateDiscountRule(record.id, 'type', val)}
          style={{ width: '100%' }}
        >
          <Option value="percentage">Percentage</Option>
          <Option value="fixed">Fixed Amount</Option>
          <Option value="buy_x_get_y">Buy X Get Y</Option>
        </Select>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      width: 120,
      render: (value: number, record: DiscountRule) => (
        <InputNumber
          min={0}
          precision={2}
          value={value}
          onChange={(val) => handleUpdateDiscountRule(record.id, 'value', val)}
          suffix={record.type === 'percentage' ? '%' : '$'}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (value: string, record: DiscountRule) => (
        <Input
          value={value}
          onChange={(e) => handleUpdateDiscountRule(record.id, 'description', e.target.value)}
          placeholder="Rule description"
        />
      ),
    },
    {
      title: 'Active',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (value: boolean, record: DiscountRule) => (
        <Switch
          checked={value}
          onChange={(checked) => handleUpdateDiscountRule(record.id, 'is_active', checked)}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: any, record: DiscountRule) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveDiscountRule(record.id)}
        />
      ),
    },
  ];

  return (
    <Modal
      title={product ? 'Edit Product' : 'Create Product'}
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          {product ? 'Update' : 'Create'}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* Basic Information Tab */}
          <TabPane
            tab={
              <span>
                <AppstoreOutlined />
                Basic Info
              </span>
            }
            key="basic"
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Product Name"
                  rules={[{ required: true, message: 'Please enter product name' }]}
                >
                  <Input placeholder="Enter product name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="sku"
                  label="SKU"
                  rules={[{ required: true, message: 'Please enter SKU' }]}
                >
                  <Input placeholder="Enter SKU" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="type"
                  label="Product Type"
                  rules={[{ required: true, message: 'Please select product type' }]}
                >
                  <Select placeholder="Select product type">
                    {PRODUCT_TYPES.map(type => (
                      <Option key={type} value={type}>{type}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="category_id"
                  label="Category"
                  rules={[{ required: true, message: 'Please select category' }]}
                >
                  <Select
                    placeholder="Select category"
                    loading={categoriesLoading}
                    showSearch
                    optionFilterProp="children"
                  >
                    {categoryOptions.map((opt: any) => (
                      <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="Description">
              <TextArea rows={4} placeholder="Enter product description" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="status"
                  label="Status"
                  initialValue="active"
                >
                  <Select>
                    <Option value="active">Active</Option>
                    <Option value="inactive">Inactive</Option>
                    <Option value="discontinued">Discontinued</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="unit"
                  label="Unit"
                  initialValue="piece"
                >
                  <Input placeholder="e.g., piece, kg, liter" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="currency"
                  label="Currency"
                  initialValue="USD"
                >
                  <Select>
                    {CURRENCIES.map(curr => (
                      <Option key={curr} value={curr}>{curr}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </TabPane>

          {/* Pricing Tab */}
          <TabPane
            tab={
              <span>
                <DollarOutlined />
                Pricing
              </span>
            }
            key="pricing"
          >
            <Card size="small" title="Base Pricing" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="price"
                    label="Selling Price"
                    rules={[{ required: true, message: 'Please enter price' }]}
                  >
                    <InputNumber
                      min={0}
                      precision={2}
                      prefix="$"
                      style={{ width: '100%' }}
                      placeholder="0.00"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="cost_price"
                    label={
                      <span>
                        Cost Price{' '}
                        <Tooltip title="Your cost for this product">
                          <InfoCircleOutlined />
                        </Tooltip>
                      </span>
                    }
                  >
                    <InputNumber
                      min={0}
                      precision={2}
                      prefix="$"
                      style={{ width: '100%' }}
                      placeholder="0.00"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card
              size="small"
              title="Volume Pricing Tiers"
              extra={
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={handleAddPricingTier}
                >
                  Add Tier
                </Button>
              }
              style={{ marginBottom: 16 }}
            >
              <Table
                dataSource={pricingTiers}
                columns={pricingTierColumns}
                pagination={false}
                size="small"
                rowKey="id"
                locale={{ emptyText: 'No pricing tiers defined' }}
              />
            </Card>

            <Card
              size="small"
              title="Discount Rules"
              extra={
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={handleAddDiscountRule}
                >
                  Add Rule
                </Button>
              }
            >
              <Table
                dataSource={discountRules}
                columns={discountRuleColumns}
                pagination={false}
                size="small"
                rowKey="id"
                locale={{ emptyText: 'No discount rules defined' }}
              />
            </Card>
          </TabPane>

          {/* Inventory Tab */}
          <TabPane
            tab={
              <span>
                <TagsOutlined />
                Inventory
              </span>
            }
            key="inventory"
          >
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="stock_quantity"
                  label="Current Stock"
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="min_stock_level"
                  label="Minimum Stock Level"
                  initialValue={5}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="max_stock_level"
                  label="Maximum Stock Level"
                  initialValue={100}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="warranty_period"
                  label="Warranty Period (months)"
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="service_contract_available"
                  label="Service Contract Available"
                  valuePropName="checked"
                  initialValue={false}
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
          </TabPane>

          {/* Variants Tab */}
          <TabPane
            tab={
              <span>
                <AppstoreOutlined />
                Variants
              </span>
            }
            key="variants"
          >
            <Card size="small" style={{ marginBottom: 16 }}>
              <Form.Item
                name="is_variant"
                label="This is a product variant"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch onChange={setIsVariant} />
              </Form.Item>

              {isVariant && (
                <>
                  <Form.Item
                    name="parent_id"
                    label="Parent Product"
                    rules={[{ required: isVariant, message: 'Please select parent product' }]}
                  >
                    <Select placeholder="Select parent product" showSearch>
                      {/* TODO: Load parent products */}
                      <Option value="">Select parent product</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="variant_group_id"
                    label="Variant Group ID"
                    tooltip="Products with the same variant group ID are considered variants of each other"
                  >
                    <Input placeholder="e.g., motor-assembly-group" />
                  </Form.Item>
                </>
              )}
            </Card>

            {!isVariant && (
              <Card size="small" title="Variant Information">
                <p>
                  To create product variants, first save this product as a base product.
                  Then you can create variants by selecting this product as the parent.
                </p>
                <p>
                  <strong>Example:</strong> If this is "Industrial Motor Assembly", you can create
                  variants like "Industrial Motor Assembly - 5HP" and "Industrial Motor Assembly - 10HP".
                </p>
              </Card>
            )}
          </TabPane>
        </Tabs>
      </Form>
    </Modal>
  );
};

export default ProductFormModal;