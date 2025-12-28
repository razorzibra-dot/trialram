/**
 * Deal Form Panel - Enterprise Enhanced Edition
 * Professional create/edit form with card-based sections, validation, and rich UI
 * ✨ Enterprise Grade UI/UX Enhancements (Phase 7)
 * ✅ Phase 3.1: Link Deals to Customers
 * ✅ Phase 3.2: Link Deals to Products
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Drawer, Form, Input, Select, Button, Space, message, InputNumber, DatePicker, Card, Alert, Row, Col } from 'antd';
import { 
  DeleteOutlined as DeleteIcon, PlusOutlined, DollarOutlined, 
  CalendarOutlined, UserOutlined, ShoppingCartOutlined, FileTextOutlined,
  CheckCircleOutlined, BgColorsOutlined, SaveOutlined, CloseOutlined, TagsOutlined
} from '@ant-design/icons';
import { Deal, Customer, DealItem } from '@/types/crm';
import { Product } from '@/types/masters';
import dayjs from 'dayjs';
import { useCreateDeal, useUpdateDeal } from '../hooks/useDeals';
import { useService } from '@/modules/core/hooks/useService';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomersDropdown } from '@/hooks/useCustomersDropdown';
import { useProductsDropdown } from '@/hooks/useProductsDropdown';
import { useActiveUsers } from '@/hooks/useActiveUsers'; // Shared hook for all modules

// Product Service Interface
interface ProductServiceInterface {
  getProducts(filters?: any): Promise<{ data: Product[] }>;
  getProduct(id: string): Promise<Product>;
}

interface DealFormPanelProps {
  open: boolean;
  deal: Deal | null;
  onClose: () => void;
  onSuccess: () => void;
}

// ✨ Configuration objects for professional styling
// NOTE: stage belongs to opportunities table, not deals
const statusConfig: Record<string, { emoji: string; label: string; bgColor: string; textColor: string }> = {
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
  open,
  deal,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Load customers and products using shared dropdown hooks
  const { data: customerOptions = [], isLoading: loadingCustomers } = useCustomersDropdown();
  const { data: productOptions = [], isLoading: loadingProducts } = useProductsDropdown();
  const { data: users = [], isLoading: usersLoading } = useActiveUsers();

  // ✅ Memoize extracted objects to prevent infinite re-renders
  const customers = useMemo(() => customerOptions.map(opt => opt.customer), [customerOptions]);
  const products = useMemo(() => productOptions.map(opt => opt.product), [productOptions]);

  // Product state
  const [saleItems, setSaleItems] = useState<DealItem[]>([]);
  const [dealType, setDealType] = useState<'PRODUCT' | 'SERVICE'>(deal?.deal_type || 'PRODUCT');
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);

  // Get services
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const productService = useService<ProductServiceInterface>('productService');

  const isEditMode = !!deal;

  // ✅ Base deal permissions for create/update actions
  const { hasPermission } = useAuth();
  const canCreateDeal = hasPermission('crm:sales:deal:create');
  const canUpdateDeal = hasPermission('crm:sales:deal:update');

  // Determine if save button should be enabled based on mode
  const finalCanSaveDeal = isEditMode ? canUpdateDeal : canCreateDeal;

  // ✅ Permission check for adding products
  const canAddProducts = hasPermission('crm:sales:deal:create') || hasPermission('crm:sales:deal:update');

  // Customers and products loaded via shared hooks

  // Update form values when deal changes
  useEffect(() => {
    if (open && deal) {
      const selectedCust = customers.find(c => c.id === deal.customer_id);
      setSelectedCustomer(selectedCust || null);

      if (deal.items && deal.items.length > 0) {
        setSaleItems(deal.items);
      } else {
        setSaleItems([]);
      }

      const formValues = {
        title: deal.title || '',
        deal_type: (deal as any).deal_type || 'PRODUCT',
        customer_id: deal.customer_id || undefined,
        value: deal.value || 0,
        assigned_to: deal.assigned_to || undefined,
        expected_close_date: deal.expected_close_date ? dayjs(deal.expected_close_date) : undefined,
        description: deal.description || '',
        notes: deal.notes || '',
        status: deal.status || undefined,
        source: deal.source || undefined,
        campaign: deal.campaign || undefined,
        tags: Array.isArray(deal.tags) && deal.tags.length > 0 ? deal.tags.join(', ') : undefined,
      };
      
      form.setFieldsValue(formValues);
      setDealType((deal as any).deal_type || 'PRODUCT');
    } else if (open) {
      form.resetFields();
      setSelectedCustomer(null);
      setSaleItems([]);
    }
  }, [open, deal, form]);

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomer(customer || null);
  };

  const handleAddProduct = () => {
    // Support adding product or service items depending on dealType
    if (dealType === 'PRODUCT') {
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

      const newItem: DealItem = {
        id: `item-${Date.now()}`,
        deal_id: deal?.id || 'temp',
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
    } else {
      // SERVICE: prompt for service name and optional price
      const svcName = window.prompt('Enter service name');
      if (!svcName) return;
      const svcPriceRaw = window.prompt('Enter service price (optional)', '0');
      const svcPrice = Number(svcPriceRaw || 0);

      const newItem: DealItem = {
        id: `svc-${Date.now()}`,
        deal_id: deal?.id || 'temp',
        product_id: undefined,
        product_name: svcName,
        product_description: '',
        quantity: 1,
        unit_price: svcPrice,
        discount: 0,
        tax: 0,
        line_total: svcPrice,
        // @ts-expect-error - service_id is supported at DB level
        service_id: `svc-${Date.now()}`,
      } as unknown as DealItem;

      setSaleItems([...saleItems, newItem]);
      message.success(`${svcName} (service) added to deal`);
    }
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
      
      // ✅ Map expected_close_date to close_date for database (close_date is NOT NULL in schema)
      const closeDate = values.expected_close_date 
        ? values.expected_close_date.format('YYYY-MM-DD')
        : new Date().toISOString().split('T')[0]; // Default to today if not provided
      
      const dealData = {
        title: values.title,
        description: values.description || undefined,
        value: dealValue,
        status: values.status || 'won',
        deal_type: dealType,
        customer_id: values.customer_id,
        assigned_to: values.assigned_to || undefined,
        close_date: closeDate, // ✅ REQUIRED NOT NULL field
        expected_close_date: values.expected_close_date 
          ? values.expected_close_date.format('YYYY-MM-DD')
          : undefined,
        notes: values.notes || undefined,
        source: values.source || undefined,
        campaign: values.campaign || undefined,
        tags: tagsArray && tagsArray.length > 0 ? tagsArray : undefined,
        // Include items in payload; service will insert them separately in a transaction
        items: saleItems.map(item => ({
          product_id: (item as any).product_id || null,
          product_name: item.product_name,
          product_description: item.product_description || '',
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: (item as any).discount || 0,
          discount_type: (item as any).discount_type || 'fixed',
          tax: (item as any).tax || 0,
          tax_rate: (item as any).tax_rate || 0,
          service_id: (item as any).service_id || null,
          duration: (item as any).duration || null,
          notes: (item as any).notes || null,
          line_total: item.line_total
        })),
      };

      if (isEditMode && deal?.id) {
        await updateDeal.mutateAsync({ id: deal.id, data: dealData });
      } else {
        await createDeal.mutateAsync(dealData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
      // Notifications handled by useCreateDeal/useUpdateDeal hooks
    }
  };

  // ✨ Professional styling configuration (consistent with other modules)
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
      fontSize: 20,
      color: '#0ea5e9',
      marginRight: 10,
      fontWeight: 600,
    },
    headerTitle: {
      fontSize: 15,
      fontWeight: 600,
      color: '#1f2937',
      margin: 0,
    },
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarOutlined style={{ fontSize: 20, color: '#0ea5e9' }} />
          <span>{isEditMode ? 'Edit Deal' : 'Create New Deal'}</span>
        </div>
      }
      placement="right"
      width={600}
      onClose={onClose}
      open={open}
      styles={{ body: { padding: 0, paddingTop: 24 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button
            size="large"
            icon={<CloseOutlined />}
            onClick={onClose}
          >
            Cancel
          </Button>
          {finalCanSaveDeal && (
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              onClick={handleSubmit}
              loading={createDeal.isPending || updateDeal.isPending}
            >
              {isEditMode ? 'Update Deal' : 'Create Deal'}
            </Button>
          )}
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        autoComplete="off"
        style={{ padding: '0 24px 24px 24px' }}
      >
        {/* 📄 Deal Overview */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <FileTextOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Deal Overview</h3>
          </div>
          <Row gutter={16}>
            <Col xs={24}>
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
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                label="Deal Type"
                name="deal_type"
                rules={[{ required: true, message: 'Deal type is required' }]}
                tooltip="Select whether this deal is for products or services"
              >
                <Select
                  size="large"
                  value={dealType}
                  onChange={(val: 'PRODUCT' | 'SERVICE') => setDealType(val)}
                  disabled={isEditMode}
                >
                  <Select.Option value="PRODUCT">Product</Select.Option>
                  <Select.Option value="SERVICE">Service</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 👥 Customer Information */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <UserOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Customer Information</h3>
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
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <DollarOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Financial Information</h3>
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
          </Row>
        </Card>

        {/* 🛒 Products/Services */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <ShoppingCartOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Products & Services</h3>
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

        {/* 📅 Important Dates */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <CalendarOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Important Dates</h3>
          </div>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Expected Close Date"
                name="expected_close_date"
                rules={[
                  { required: true, message: 'Expected close date is required' }
                ]}
                tooltip="When do you expect to close this deal? (Required)"
              >
                <DatePicker size="large" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Deal Status"
                name="status"
                initialValue="won"
                rules={[
                  { required: true, message: 'Status is required' }
                ]}
                tooltip="Current status of the deal (won, lost, cancelled)"
              >
                <Select size="large" placeholder="Select status">
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
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <TagsOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Campaign & Source Information</h3>
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
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 📝 Tags & Notes */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <FileTextOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Tags & Additional Notes</h3>
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
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Assigned To"
                name="assigned_to"
                tooltip="Sales representative responsible for this deal"
              >
                <Select 
                  size="large" 
                  placeholder="Select team member" 
                  allowClear
                  loading={usersLoading}
                  disabled={usersLoading}
                >
                  {users.map((user) => (
                    <Select.Option key={user.id} value={user.id}>
                      👤 {user.firstName} {user.lastName}
                    </Select.Option>
                  ))}
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
                  style={{ fontFamily: 'inherit' }}
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
                  style={{ fontFamily: 'inherit' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </Drawer>
  );
};