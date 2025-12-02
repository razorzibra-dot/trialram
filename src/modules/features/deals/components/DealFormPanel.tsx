/**
 * Deal Form Panel - Enterprise Enhanced Edition
 * Professional create/edit form with card-based sections, validation, and rich UI
 * ✨ Enterprise Grade UI/UX Enhancements (Phase 7)
 * ✅ Phase 3.1: Link Deals to Customers
 * ✅ Phase 3.2: Link Deals to Products
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Drawer, Form, Input, Select, Button, Space, message, InputNumber, DatePicker, Card, Alert, Spin, Row, Col, Tag, Tooltip } from 'antd';
import { 
  LinkOutlined, DeleteOutlined as DeleteIcon, PlusOutlined, DollarOutlined, 
  CalendarOutlined, UserOutlined, ShoppingCartOutlined, FileTextOutlined,
  CheckCircleOutlined, RadarChartOutlined, TeamOutlined, BgColorsOutlined 
} from '@ant-design/icons';
import { Deal, Customer, SaleItem } from '@/types/crm';
import { Product } from '@/types/masters';
import dayjs from 'dayjs';
import { useCreateDeal, useUpdateDeal, useDealStages } from '../hooks/useDeals';
import { useService } from '@/modules/core/hooks/useService';
import { CustomerService } from '@/modules/features/customers/services/customerService';
import { PermissionField } from '@/components/forms/PermissionField';
import { PermissionSection } from '@/components/layout/PermissionSection';
import { usePermission } from '@/hooks/useElementPermissions';

// Product Service Interface
interface ProductServiceInterface {
  getProducts(filters?: any): Promise<{ data: Product[] }>;
  getProduct(id: string): Promise<Product>;
}

interface DealFormPanelProps {
  visible: boolean;
  deal: Deal | null;
  onClose: () => void;
  onSuccess: () => void;
}

// ✨ Configuration objects for professional styling
const stageConfig: Record<string, { emoji: string; label: string }> = {
  'lead': { emoji: '🎯', label: 'Lead' },
  'qualified': { emoji: '✅', label: 'Qualified' },
  'proposal': { emoji: '📄', label: 'Proposal' },
  'negotiation': { emoji: '🤝', label: 'Negotiation' },
  'closed_won': { emoji: '🎉', label: 'Closed Won' },
  'closed_lost': { emoji: '❌', label: 'Closed Lost' },
};

const statusConfig: Record<string, { emoji: string; label: string; bgColor: string; textColor: string }> = {
  'open': { emoji: '🔵', label: 'Open', bgColor: '#e6f4ff', textColor: '#0050b3' },
  'won': { emoji: '✅', label: 'Won', bgColor: '#f6ffed', textColor: '#274a0a' },
  'lost': { emoji: '❌', label: 'Lost', bgColor: '#fff1f0', textColor: '#58181c' },
  'cancelled': { emoji: '⏸️', label: 'Cancelled', bgColor: '#f5f5f5', textColor: '#262626' },
};

const sourceConfig: Record<string, { emoji: string; label: string }> = {
  'inbound': { emoji: '📩', label: 'Inbound' },
  'outbound': { emoji: '📤', label: 'Outbound' },
  'referral': { emoji: '🤝', label: 'Referral' },
  'website': { emoji: '🌐', label: 'Website' },
  'conference': { emoji: '🎤', label: 'Conference' },
};

export const DealFormPanel: React.FC<DealFormPanelProps> = ({
  visible,
  deal,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Product state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);

  // Get services
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const { data: stages = [], isLoading: loadingStages } = useDealStages();
  const customerService = useService<CustomerService>('customerService');
  const productService = useService<ProductServiceInterface>('productService');

  const isEditMode = !!deal;

  // Element-level permissions for sales deal form
  const canEditDealOverview = usePermission('crm:sales:deal:form:section.overview', 'accessible');
  const canEditCustomerInfo = usePermission('crm:sales:deal:form:section.customer', 'accessible');
  const canEditFinancialInfo = usePermission('crm:sales:deal:form:section.financial', 'accessible');
  const canEditProducts = usePermission('crm:sales:deal:form:section.products', 'accessible');
  const canEditPipeline = usePermission('crm:sales:deal:form:section.pipeline', 'accessible');
  const canEditCampaign = usePermission('crm:sales:deal:form:section.campaign', 'accessible');
  const canEditNotes = usePermission('crm:sales:deal:form:section.notes', 'accessible');
  const canSaveDeal = usePermission('crm:sales:deal:form:button.save', 'enabled');
  const canAddProducts = usePermission('crm:sales:deal:form:button.addproduct', 'enabled');

  // Load customers and products
  useEffect(() => {
    if (visible && customerService) {
      loadCustomers();
    }
  }, [visible, customerService]);

  useEffect(() => {
    if (visible && productService) {
      loadProducts();
    }
  }, [visible, productService]);

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      if (!customerService) {
        throw new Error('Customer service not initialized');
      }
      
      const result = await customerService.getCustomers({ pageSize: 1000 });
      if (result?.data && Array.isArray(result.data)) {
        setCustomers(result.data);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (!errorMsg.includes('Unauthorized') && !errorMsg.includes('Tenant context not initialized')) {
        message.error(`Failed to load customers: ${errorMsg}`);
      }
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      if (!productService) {
        setProducts([]);
        return;
      }
      
      const result = await productService.getProducts({ pageSize: 1000, status: 'active' });
      if (result?.data && Array.isArray(result.data)) {
        setProducts(result.data);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('[SalesDealFormPanel] Error loading products:', error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Update form values when deal changes
  useEffect(() => {
    if (visible && deal) {
      const selectedCust = customers.find(c => c.id === deal.customer_id);
      setSelectedCustomer(selectedCust || null);

      if (deal.items && deal.items.length > 0) {
        setSaleItems(deal.items);
      } else {
        setSaleItems([]);
      }

      const formValues = {
        title: deal.title || '',
        customer_id: deal.customer_id || undefined,
        value: deal.value || 0,
        stage: deal.stage ? String(deal.stage).toLowerCase() : 'lead',
        assigned_to: deal.assigned_to || undefined,
        expected_close_date: deal.expected_close_date ? dayjs(deal.expected_close_date) : undefined,
        actual_close_date: deal.actual_close_date ? dayjs(deal.actual_close_date) : undefined,
        probability: deal.probability || 50,
        description: deal.description || '',
        notes: deal.notes || '',
        status: deal.status || undefined,
        source: deal.source || undefined,
        campaign: deal.campaign || undefined,
        tags: Array.isArray(deal.tags) && deal.tags.length > 0 ? deal.tags.join(', ') : undefined,
      };
      
      form.setFieldsValue(formValues);
    } else if (visible) {
      form.resetFields();
      setSelectedCustomer(null);
      setSaleItems([]);
    }
  }, [visible, deal, form]);

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomer(customer || null);
  };

  const handleAddProduct = () => {
    if (!selectedProductId) {
      message.warning('Please select a product');
      return;
    }

    if (saleItems.find(item => item.product_id === selectedProductId)) {
      message.warning('This product is already in the deal. Update the quantity instead.');
      return;
    }

    const selectedProduct = products.find(p => p.id === selectedProductId);
    if (!selectedProduct) {
      message.error('Product not found');
      return;
    }

    const newItem: SaleItem = {
      id: `item-${Date.now()}`,
      sale_id: deal?.id || 'temp',
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      product_description: selectedProduct.description,
      quantity: 1,
      unit_price: selectedProduct.price || 0,
      discount: 0,
      tax: 0,
      line_total: selectedProduct.price || 0,
    };

    setSaleItems([...saleItems, newItem]);
    setSelectedProductId(undefined);
    message.success(`${selectedProduct.name} added to deal`);
  };

  const handleRemoveItem = (itemId: string) => {
    setSaleItems(saleItems.filter(item => item.id !== itemId));
  };

  const handleUpdateItemQuantity = (itemId: string, quantity: number) => {
    setSaleItems(saleItems.map(item => {
      if (item.id === itemId) {
        const lineTotal = (item.unit_price * quantity) - item.discount + item.tax;
        return { ...item, quantity, line_total: lineTotal };
      }
      return item;
    }));
  };

  const handleUpdateItemDiscount = (itemId: string, discount: number) => {
    setSaleItems(saleItems.map(item => {
      if (item.id === itemId) {
        const lineTotal = (item.unit_price * item.quantity) - discount + item.tax;
        return { ...item, discount, line_total: lineTotal };
      }
      return item;
    }));
  };

  const calculateTotalFromItems = useMemo(() => {
    return saleItems.reduce((sum, item) => sum + item.line_total, 0);
  }, [saleItems]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (!values.customer_id) {
        message.error('Please select a customer');
        return;
      }

      const customer = customers.find(c => c.id === values.customer_id);
      if (!customer) {
        message.error('Selected customer not found');
        return;
      }

      const dealValue = saleItems.length > 0 ? calculateTotalFromItems : values.value;

      const tagsArray = values.tags
        ? values.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag)
        : [];

      const stageValue = String(values.stage || 'lead').toLowerCase();
      
      const dealData = {
        title: values.title,
        description: values.description,
        value: dealValue,
        stage: stageValue,
        status: values.status || null,
        customer_id: values.customer_id,
        assigned_to: values.assigned_to || null,
        expected_close_date: values.expected_close_date 
          ? values.expected_close_date.toISOString() 
          : undefined,
        actual_close_date: values.actual_close_date
          ? values.actual_close_date.toISOString()
          : undefined,
        probability: values.probability,
        notes: values.notes || null,
        source: values.source || null,
        campaign: values.campaign || null,
        tags: tagsArray,
        items: saleItems,
      };

      if (isEditMode && deal?.id) {
        await updateDeal.mutateAsync({ id: deal.id, ...dealData });
        message.success('Deal updated successfully');
      } else {
        await createDeal.mutateAsync(dealData);
        message.success('Deal created successfully');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
      message.error('Failed to save deal');
    }
  };

  // ✨ Section card styling
  const sectionCardStyle = {
    marginBottom: 20,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    borderRadius: 8,
    border: '1px solid #f0f0f0',
  };

  const sectionHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '2px solid #0ea5e9',
    color: '#1f2937',
    fontWeight: 600,
    fontSize: 14,
  };

  const iconStyle = {
    marginRight: 8,
    color: '#0ea5e9',
    fontSize: 16,
  };

  return (
    <Drawer
      title={isEditMode ? `Edit Deal - ${deal?.title}` : 'Create New Deal'}
      placement="right"
      width={650}
      onClose={onClose}
      open={visible}
      footer={
        <Space style={{ float: 'right', width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          {canSaveDeal && (
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={createDeal.isPending || updateDeal.isPending}
            >
              {isEditMode ? 'Update Deal' : 'Create Deal'}
            </Button>
          )}
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        autoComplete="off"
      >
        {/* 🎯 Deal Title Section */}
        <PermissionSection
          elementPath="crm:sales:deal:form:section.overview"
          title="Deal Overview"
          icon={<FileTextOutlined style={{ fontSize: 16, color: '#0ea5e9' }} />}
        >
          <Card style={sectionCardStyle}>
            <div style={sectionHeaderStyle}>
              <FileTextOutlined style={iconStyle} />
              Deal Overview
            </div>
            <Row gutter={16}>
              <Col xs={24}>
                <PermissionField
                  elementPath="crm:sales:deal:form:field.title"
                  fieldName="title"
                >
                  <Form.Item
                    label="Deal Title"
                    name="title"
                    rules={[
                      { required: true, message: 'Deal title is required' },
                      { min: 3, message: 'Deal title must be at least 3 characters' },
                      { max: 255, message: 'Deal title cannot exceed 255 characters' }
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="e.g., Enterprise SaaS Implementation - Acme Corp"
                    />
                  </Form.Item>
                </PermissionField>
              </Col>
            </Row>
          </Card>
        </PermissionSection>

        {/* 👥 Customer Information */}
        <Card style={sectionCardStyle}>
          <div style={sectionHeaderStyle}>
            <UserOutlined style={iconStyle} />
            Customer Information
          </div>
          
          {selectedCustomer && (
            <Alert
              message="✅ Customer Linked"
              description={`${selectedCustomer.company_name} • ${selectedCustomer.contact_name}`}
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item
                label="Select Customer"
                name="customer_id"
                rules={[{ required: true, message: 'Customer is required' }]}
                tooltip="Select or search for a customer to link this deal"
              >
                <Select
                  size="large"
                  placeholder="Search by company name or contact..."
                  loading={loadingCustomers}
                  optionLabelProp="label"
                  onSelect={handleCustomerChange}
                  filterOption={(input, option) =>
                    (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                  allowClear
                >
                  {customers.map(customer => (
                    <Select.Option
                      key={customer.id}
                      value={customer.id}
                      label={`${customer.company_name}`}
                    >
                      <div>
                        <div style={{ fontWeight: 500 }}>{customer.company_name}</div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          {customer.contact_name} • {customer.email}
                        </div>
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {selectedCustomer && (
            <div style={{ backgroundColor: '#fafafa', padding: 12, borderRadius: 6 }}>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <div style={{ fontSize: 12, marginBottom: 8 }}>
                    <strong style={{ color: '#374151' }}>Contact Person</strong>
                    <div style={{ color: '#6b7280', marginTop: 2 }}>{selectedCustomer.contact_name}</div>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ fontSize: 12, marginBottom: 8 }}>
                    <strong style={{ color: '#374151' }}>Email</strong>
                    <div style={{ color: '#6b7280', marginTop: 2 }}>{selectedCustomer.email}</div>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ fontSize: 12, marginBottom: 8 }}>
                    <strong style={{ color: '#374151' }}>Phone</strong>
                    <div style={{ color: '#6b7280', marginTop: 2 }}>{selectedCustomer.phone}</div>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ fontSize: 12 }}>
                    <strong style={{ color: '#374151' }}>Industry</strong>
                    <div style={{ color: '#6b7280', marginTop: 2 }}>{selectedCustomer.industry}</div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Card>

        {/* 💰 Financial Information */}
        <Card style={sectionCardStyle}>
          <div style={sectionHeaderStyle}>
            <DollarOutlined style={iconStyle} />
            Financial Information
          </div>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Deal Value"
                name="value"
                rules={[
                  { required: saleItems.length === 0, message: 'Deal value is required' },
                  { type: 'number', message: 'Please enter a valid number' }
                ]}
                tooltip={saleItems.length > 0 ? `Auto-calculated: $${calculateTotalFromItems.toFixed(2)}` : 'Enter deal value'}
              >
                <InputNumber
                  size="large"
                  min={0}
                  disabled={saleItems.length > 0}
                  placeholder={saleItems.length > 0 ? `$${calculateTotalFromItems.toFixed(2)}` : 'Enter value'}
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => {
                    const num = parseInt(value?.replace(/\$\s?|(,*)/g, '') || '0');
                    return isNaN(num) ? 0 : num;
                  }}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Win Probability (%)"
                name="probability"
                initialValue={50}
                rules={[{ type: 'number', message: 'Please enter 0-100' }]}
                tooltip="Probability of closing this deal successfully"
              >
                <InputNumber 
                  size="large"
                  min={0} 
                  max={100} 
                  style={{ width: '100%' }}
                  placeholder="50"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 🛒 Products/Services */}
        <Card style={sectionCardStyle}>
          <div style={sectionHeaderStyle}>
            <ShoppingCartOutlined style={iconStyle} />
            Products & Services
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#374151' }}>
              Add Products to Deal
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <Select
                size="large"
                placeholder="Search product by name or SKU..."
                style={{ flex: 1 }}
                loading={loadingProducts}
                value={selectedProductId}
                onChange={setSelectedProductId}
                optionLabelProp="label"
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
                allowClear
              >
                {products.map(product => (
                  <Select.Option
                    key={product.id}
                    value={product.id}
                    label={`${product.name} (${product.sku})`}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{product.name}</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        SKU: {product.sku} • ${product.price?.toFixed(2)}
                      </div>
                    </div>
                  </Select.Option>
                ))}
              </Select>
              {canAddProducts && (
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={handleAddProduct}
                >
                  Add
                </Button>
              )}
            </div>
          </div>

          {saleItems.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ backgroundColor: '#fafafa', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Product</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', width: '60px', fontWeight: 600, color: '#374151' }}>Qty</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right', width: '80px', fontWeight: 600, color: '#374151' }}>Price</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right', width: '80px', fontWeight: 600, color: '#374151' }}>Discount</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right', width: '80px', fontWeight: 600, color: '#374151' }}>Total</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {saleItems.map((item, index) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ fontWeight: 500, color: '#1f2937' }}>{item.product_name}</div>
                        {item.product_description && (
                          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: 2 }}>
                            {item.product_description}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <InputNumber
                          min={1}
                          value={item.quantity}
                          onChange={(val) => handleUpdateItemQuantity(item.id, val || 1)}
                          size="small"
                          style={{ width: '50px' }}
                        />
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: '#6b7280' }}>
                        ${item.unit_price.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                        <InputNumber
                          min={0}
                          value={item.discount}
                          onChange={(val) => handleUpdateItemDiscount(item.id, val || 0)}
                          size="small"
                          style={{ width: '70px' }}
                        />
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600, color: '#1f2937' }}>
                        ${item.line_total.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteIcon />}
                          onClick={() => handleRemoveItem(item.id)}
                        />
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: '#fafafa', fontWeight: 600, borderTop: '2px solid #e5e7eb' }}>
                    <td colSpan={4} style={{ padding: '10px 8px', textAlign: 'right', color: '#1f2937' }}>
                      Total Deal Value:
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: '#0ea5e9' }}>
                      ${calculateTotalFromItems.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <Alert
              message="ℹ️ No products added yet"
              description="Add products to this deal or enter a manual deal value below"
              type="info"
              showIcon
            />
          )}
        </Card>

        {/* 📅 Pipeline & Timeline */}
        <Card style={sectionCardStyle}>
          <div style={sectionHeaderStyle}>
            <RadarChartOutlined style={iconStyle} />
            Sales Pipeline & Timeline
          </div>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Deal Stage"
                name="stage"
                initialValue="lead"
                rules={[{ required: true, message: 'Stage is required' }]}
                tooltip="Select the current stage in your sales pipeline"
              >
                <Select size="large" loading={loadingStages} placeholder="Select stage" allowClear>
                  {stages
                    .filter((stage: any) => stage && stage.id)
                    .map((stage: any) => {
                      const config = stageConfig[stage.id?.toLowerCase()] || { emoji: '📌', label: stage.name };
                      return (
                        <Select.Option key={stage.id} value={stage.id}>
                          <span>{config.emoji} {stage.name || stage.id}</span>
                        </Select.Option>
                      );
                    })}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Expected Close Date"
                name="expected_close_date"
                tooltip="When do you expect to close this deal?"
              >
                <DatePicker size="large" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Actual Close Date"
                name="actual_close_date"
                tooltip="When the deal was actually closed (if applicable)"
              >
                <DatePicker size="large" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Deal Status"
                name="status"
                tooltip="Current status of the deal"
              >
                <Select size="large" placeholder="Select status" allowClear>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <Select.Option key={key} value={key}>
                      <span>{config.emoji} {config.label}</span>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 🎯 Campaign & Source */}
        <Card style={sectionCardStyle}>
          <div style={sectionHeaderStyle}>
            <BgColorsOutlined style={iconStyle} />
            Campaign & Source Information
          </div>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Lead Source"
                name="source"
                tooltip="Where did this lead/opportunity come from?"
              >
                <Select size="large" placeholder="Select source" allowClear>
                  {Object.entries(sourceConfig).map(([key, config]) => (
                    <Select.Option key={key} value={key}>
                      <span>{config.emoji} {config.label}</span>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Campaign Name"
                name="campaign"
                rules={[{ max: 100, message: 'Campaign name cannot exceed 100 characters' }]}
                tooltip="Name of the marketing or sales campaign"
              >
                <Input 
                  size="large"
                  placeholder="e.g., Q1 Enterprise Outreach"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 📝 Tags & Notes */}
        <Card style={sectionCardStyle}>
          <div style={sectionHeaderStyle}>
            <CheckCircleOutlined style={iconStyle} />
            Tags & Additional Notes
          </div>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Tags"
                name="tags"
                tooltip="Add comma-separated tags for easy filtering"
              >
                <Input 
                  size="large"
                  placeholder="e.g., urgent, vip, enterprise"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Assigned To"
                name="assigned_to"
                tooltip="Sales representative responsible for this deal"
              >
                <Select size="large" placeholder="Select team member" allowClear>
                  {/* TODO: Load from user service */}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item
                label="Internal Notes"
                name="notes"
                rules={[{ max: 1000, message: 'Notes cannot exceed 1000 characters' }]}
              >
                <Input.TextArea
                  size="large"
                  placeholder="Add private notes visible only to your team..."
                  rows={3}
                  showCount
                  maxLength={1000}
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                label="Deal Description"
                name="description"
                rules={[{ max: 2000, message: 'Description cannot exceed 2000 characters' }]}
              >
                <Input.TextArea
                  size="large"
                  placeholder="Provide detailed information about this deal..."
                  rows={4}
                  showCount
                  maxLength={2000}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </Drawer>
  );
};