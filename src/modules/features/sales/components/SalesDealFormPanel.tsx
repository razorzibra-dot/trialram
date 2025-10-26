/**
 * Sales Deal Form Panel
 * Side drawer for creating/editing deal information with full customer and product integration
 * ✅ Phase 3.1: Link Sales to Customers
 * ✅ Phase 3.2: Link Sales to Products
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Drawer, Form, Input, Select, Button, Space, message, InputNumber, DatePicker, Divider, Card, Alert, Spin, Table, Empty } from 'antd';
import { LinkOutlined, DeleteOutlined as DeleteIcon, PlusOutlined } from '@ant-design/icons';
import { Deal, Customer, SaleItem } from '@/types/crm';
import { Product } from '@/types/masters';
import dayjs from 'dayjs';
import { useCreateDeal, useUpdateDeal, useDealStages } from '../hooks/useSales';
import { useService } from '@/modules/core/hooks/useService';
import { CustomerService } from '@/modules/features/customers/services/customerService';

// Product Service Interface
interface ProductServiceInterface {
  getProducts(filters?: any): Promise<{ data: Product[] }>;
  getProduct(id: string): Promise<Product>;
}

interface SalesDealFormPanelProps {
  visible: boolean;
  deal: Deal | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const SalesDealFormPanel: React.FC<SalesDealFormPanelProps> = ({
  visible,
  deal,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Product state - Phase 3.2
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

  // Load customers and products on mount or when drawer opens
  useEffect(() => {
    if (visible && customerService) {
      loadCustomers();
    }
  }, [visible, customerService]);

  // Load products separately - Phase 3.2
  useEffect(() => {
    if (visible && productService) {
      loadProducts();
    }
  }, [visible, productService]);

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      console.log('[SalesDealFormPanel] loadCustomers - Starting to load customers...');
      
      // Validate service exists
      if (!customerService) {
        console.error('[SalesDealFormPanel] customerService is undefined');
        throw new Error('Customer service not initialized');
      }
      
      console.log('[SalesDealFormPanel] customerService available:', !!customerService);
      console.log('[SalesDealFormPanel] customerService.getCustomers:', typeof customerService.getCustomers);
      
      const result = await customerService.getCustomers({ pageSize: 1000 });
      console.log('[SalesDealFormPanel] loadCustomers - Received result:', result);
      console.log('[SalesDealFormPanel] Result structure - data:', !!result.data, 'total:', result.total);
      
      if (result?.data && Array.isArray(result.data)) {
        console.log('[SalesDealFormPanel] Setting customers:', result.data.length, 'items');
        setCustomers(result.data);
        
        // If empty list during initialization, log as info (not an error state)
        if (result.data.length === 0 && result.total === 0) {
          console.log('[SalesDealFormPanel] ℹ️ Empty customer list (possibly auth context initializing)');
        }
      } else {
        console.warn('[SalesDealFormPanel] Invalid result structure:', result);
        setCustomers([]);
      }
    } catch (error) {
      // Only show error for unexpected errors, not for auth context initialization
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // Check if this is an initialization error that was NOT caught by the wrapper
      if (errorMsg.includes('Unauthorized') || errorMsg.includes('Tenant context not initialized')) {
        console.log('[SalesDealFormPanel] ℹ️ Auth context initializing - customer list will be empty temporarily');
        setCustomers([]);
      } else {
        console.error('[SalesDealFormPanel] loadCustomers - Unexpected error:', error);
        console.error('[SalesDealFormPanel] Error stack:', error instanceof Error ? error.stack : 'N/A');
        message.error(`Failed to load customers: ${errorMsg}`);
      }
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Load products - Phase 3.2
  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      console.log('[SalesDealFormPanel] loadProducts - Starting...');
      
      if (!productService) {
        console.error('[SalesDealFormPanel] productService is undefined');
        setProducts([]);
        return;
      }
      
      const result = await productService.getProducts({ pageSize: 1000, status: 'active' });
      console.log('[SalesDealFormPanel] loadProducts - Result:', result);
      
      if (result?.data && Array.isArray(result.data)) {
        console.log('[SalesDealFormPanel] Setting products:', result.data.length, 'items');
        setProducts(result.data);
      } else {
        console.warn('[SalesDealFormPanel] Invalid products result structure:', result);
        setProducts([]);
      }
    } catch (error) {
      console.error('[SalesDealFormPanel] Error loading products:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[SalesDealFormPanel] Product error details:', errorMsg);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Update form values when deal changes
  useEffect(() => {
    if (visible && deal) {
      console.log('[SalesDealFormPanel] 📝 Updating form for deal:', deal.id);
      console.log('[SalesDealFormPanel] Deal data:', {
        title: deal.title,
        customer_id: deal.customer_id,
        value: deal.value,
        stage: deal.stage,
        assigned_to: deal.assigned_to,
        expected_close_date: deal.expected_close_date,
        actual_close_date: deal.actual_close_date,
        probability: deal.probability,
        status: deal.status,
        source: deal.source,
        campaign: deal.campaign,
        notes: deal.notes,
      });
      
      const selectedCust = customers.find(c => c.id === deal.customer_id);
      setSelectedCustomer(selectedCust || null);

      // Load sale items if deal has products - Phase 3.2
      if (deal.items && deal.items.length > 0) {
        setSaleItems(deal.items);
      } else {
        setSaleItems([]);
      }

      const formValues = {
        title: deal.title || '',
        customer_id: deal.customer_id || undefined,
        value: deal.value || 0,
        stage: deal.stage || 'lead', // Default to 'lead' if not set
        assigned_to: deal.assigned_to || undefined, // Leave as undefined/null (no default string)
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
      
      console.log('[SalesDealFormPanel] Setting form values:', formValues);
      form.setFieldsValue(formValues);
    } else if (visible) {
      console.log('[SalesDealFormPanel] Resetting form (no deal)');
      form.resetFields();
      setSelectedCustomer(null);
      setSaleItems([]);
    }
  }, [visible, deal, customers, form]);

  // Handle customer selection - update form with customer details
  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomer(customer || null);
  };

  // Handle adding product to deal - Phase 3.2
  const handleAddProduct = () => {
    if (!selectedProductId) {
      message.warning('Please select a product');
      return;
    }

    // Check if product already in items
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

  // Handle removing product from deal - Phase 3.2
  const handleRemoveItem = (itemId: string) => {
    setSaleItems(saleItems.filter(item => item.id !== itemId));
  };

  // Update item quantity - Phase 3.2
  const handleUpdateItemQuantity = (itemId: string, quantity: number) => {
    setSaleItems(saleItems.map(item => {
      if (item.id === itemId) {
        const lineTotal = (item.unit_price * quantity) - item.discount + item.tax;
        return { ...item, quantity, line_total: lineTotal };
      }
      return item;
    }));
  };

  // Update item discount - Phase 3.2
  const handleUpdateItemDiscount = (itemId: string, discount: number) => {
    setSaleItems(saleItems.map(item => {
      if (item.id === itemId) {
        const lineTotal = (item.unit_price * item.quantity) - discount + item.tax;
        return { ...item, discount, line_total: lineTotal };
      }
      return item;
    }));
  };

  // Calculate total deal value from items - Phase 3.2
  const calculateTotalFromItems = useMemo(() => {
    return saleItems.reduce((sum, item) => sum + item.line_total, 0);
  }, [saleItems]);

  const handleSubmit = async () => {
    console.log('=== SUBMIT HANDLER CALLED ===');
    try {
      console.log('Step 1: Validating form fields...');
      const values = await form.validateFields();
      console.log('Step 2: Form values validated:', values);
      
      // Validate customer is selected
      if (!values.customer_id) {
        console.warn('Step 3a: No customer_id selected');
        message.error('Please select a customer');
        return;
      }

      // Validate customer relationship
      const customer = customers.find(c => c.id === values.customer_id);
      if (!customer) {
        console.warn('Step 3b: Customer not found:', values.customer_id);
        message.error('Selected customer not found');
        return;
      }

      // Determine deal value - use calculated from items if products added, otherwise use manual value
      const dealValue = saleItems.length > 0 ? calculateTotalFromItems : values.value;
      console.log('Step 4: Deal value calculated:', dealValue);

      // Parse tags from comma-separated string to array
      const tagsArray = values.tags
        ? values.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag)
        : [];

      const dealData = {
        title: values.title,
        description: values.description,
        value: dealValue,
        stage: values.stage,
        status: values.status || null,
        customer_id: values.customer_id,
        assigned_to: values.assigned_to || null, // Only include if valid UUID, else null
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
        items: saleItems.length > 0 ? saleItems : undefined, // Phase 3.2: Include items
      };
      console.log('Step 5: Deal data prepared:', dealData);

      if (isEditMode && deal) {
        console.log('Step 6a: Calling UPDATE mutation for deal:', deal.id);
        console.log('Step 6a: Data being sent:', dealData);
        await updateDeal.mutateAsync({
          id: deal.id,
          data: dealData,
        });
        console.log('Step 6b: UPDATE completed successfully');
      } else {
        console.log('Step 6a: Calling CREATE mutation');
        await createDeal.mutateAsync(dealData);
        console.log('Step 6b: CREATE completed successfully');
      }

      console.log('Step 7: Calling onSuccess callback');
      onSuccess();
      console.log('Step 7b: onSuccess callback completed');
      // Add small delay to let toast display
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Step 8: Calling onClose callback');
      onClose();
    } catch (error: any) {
      console.error('=== SUBMIT ERROR ===', error);
      if (error?.errorFields) {
        error.errorFields.forEach((fieldError: any) => {
          const fieldName = fieldError.name.join('.');
          const fieldErrors = fieldError.errors;
          console.error(`❌ VALIDATION FAILED on field "${fieldName}":`, fieldErrors);
        });
      }
      if (error instanceof Error) {
        message.error(error.message);
      }
    }
  };

  return (
    <Drawer
      title={isEditMode ? 'Edit Deal' : 'Create New Deal'}
      placement="right"
      width={550}
      onClose={onClose}
      open={visible}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        autoComplete="off"
      >
        {/* Deal Information Section */}
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Deal Information</h3>

        <Form.Item
          label="Deal Title"
          name="title"
          rules={[{ required: true, message: 'Please enter deal title' }]}
        >
          <Input placeholder="e.g., Enterprise Software Package" />
        </Form.Item>

        {/* Customer Section - Phase 3.1 */}
        <Divider style={{ margin: '20px 0' }} />
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Customer Information</h3>

        {selectedCustomer && (
          <Alert
            message="Customer Linked"
            description={`Company: ${selectedCustomer.company_name} | Contact: ${selectedCustomer.contact_name}`}
            type="success"
            icon={<LinkOutlined />}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item
          label="Customer *"
          name="customer_id"
          rules={[{ required: true, message: 'Please select a customer' }]}
          tooltip="Select a customer to link this deal. Required for deal creation."
        >
          <Select
            placeholder="Select customer"
            loading={loadingCustomers}
            optionLabelProp="label"
            onSelect={handleCustomerChange}
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
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

        {/* Customer Details Display */}
        {selectedCustomer && (
          <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fafafa' }}>
            <div style={{ fontSize: '12px', lineHeight: 1.8 }}>
              <div><strong>Contact:</strong> {selectedCustomer.contact_name}</div>
              <div><strong>Email:</strong> {selectedCustomer.email}</div>
              <div><strong>Phone:</strong> {selectedCustomer.phone}</div>
              <div><strong>Industry:</strong> {selectedCustomer.industry}</div>
              <div><strong>Company Size:</strong> {selectedCustomer.size}</div>
              <div><strong>Status:</strong> {selectedCustomer.status}</div>
            </div>
          </Card>
        )}

        {/* Products Section - Phase 3.2 */}
        <Divider style={{ margin: '20px 0' }} />
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Products/Services</h3>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Select
              placeholder="Select product to add"
              style={{ flex: 1 }}
              loading={loadingProducts}
              value={selectedProductId}
              onChange={setSelectedProductId}
              optionLabelProp="label"
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
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
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddProduct}
              loading={loadingProducts}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Sale Items Table - Phase 3.2 */}
        {saleItems.length > 0 ? (
          <Card size="small" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '12px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}>
                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Product</th>
                    <th style={{ padding: '8px', textAlign: 'center', width: '60px', fontWeight: 600 }}>Qty</th>
                    <th style={{ padding: '8px', textAlign: 'right', width: '70px', fontWeight: 600 }}>Price</th>
                    <th style={{ padding: '8px', textAlign: 'right', width: '70px', fontWeight: 600 }}>Discount</th>
                    <th style={{ padding: '8px', textAlign: 'right', width: '70px', fontWeight: 600 }}>Total</th>
                    <th style={{ padding: '8px', textAlign: 'center', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {saleItems.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '8px' }}>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>{item.product_name}</div>
                        {item.product_description && (
                          <div style={{ fontSize: '11px', color: '#999' }}>{item.product_description}</div>
                        )}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <InputNumber
                          min={1}
                          value={item.quantity}
                          onChange={(val) => handleUpdateItemQuantity(item.id, val || 1)}
                          size="small"
                          style={{ width: '50px' }}
                        />
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        ${item.unit_price.toFixed(2)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        <InputNumber
                          min={0}
                          value={item.discount}
                          onChange={(val) => handleUpdateItemDiscount(item.id, val || 0)}
                          size="small"
                          style={{ width: '60px' }}
                        />
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
                        ${item.line_total.toFixed(2)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
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
                  <tr style={{ backgroundColor: '#fafafa', fontWeight: 600, borderTop: '2px solid #f0f0f0' }}>
                    <td colSpan={4} style={{ padding: '8px', textAlign: 'right' }}>
                      Total:
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      ${calculateTotalFromItems.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Alert
            message="No products added"
            description="Add products/services to calculate deal value automatically"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Deal Financial Section */}
        <Divider style={{ margin: '20px 0' }} />
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Financial Information</h3>

        <Form.Item
          label="Deal Value ($)"
          name="value"
          rules={[
            { required: saleItems.length === 0, message: 'Please enter deal value or add products' },
            { type: 'number', message: 'Please enter a valid number' }
          ]}
          tooltip={saleItems.length > 0 ? `Auto-calculated from products: $${calculateTotalFromItems.toFixed(2)}` : 'Enter manually or add products to calculate'}
        >
          <InputNumber
            min={0}
            disabled={saleItems.length > 0}
            placeholder={saleItems.length > 0 ? `$${calculateTotalFromItems.toFixed(2)} (from products)` : 'Enter deal value'}
            formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => {
              const num = parseInt(value?.replace(/\$\s?|(,*)/g, '') || '0');
              return isNaN(num) ? 0 : num;
            }}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label="Probability (%)"
          name="probability"
          initialValue={50}
          rules={[
            { type: 'number', message: 'Please enter a valid percentage' }
          ]}
        >
          <InputNumber min={0} max={100} style={{ width: '100%' }} />
        </Form.Item>

        {/* Deal Stage Section */}
        <Divider style={{ margin: '20px 0' }} />
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Sales Pipeline</h3>

        <Form.Item
          label="Stage *"
          name="stage"
          initialValue="lead"
          rules={[{ required: true, message: 'Please select deal stage' }]}
        >
          <Select loading={loadingStages} placeholder="Select deal stage">
            {stages
              .filter((stage: any) => stage && stage.id) // Filter out null/undefined stages
              .map((stage: any) => (
                <Select.Option key={stage.id} value={stage.id}>
                  {stage.name || stage.id}
                </Select.Option>
              ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Expected Close Date"
          name="expected_close_date"
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="Assigned To"
          name="assigned_to"
        >
          <Select placeholder="Select sales representative" allowClear>
            {/* TODO: Load from user service and populate with valid UUIDs */}
          </Select>
        </Form.Item>

        {/* Additional Information */}
        <Divider style={{ margin: '20px 0' }} />
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Additional Information</h3>

        <Form.Item
          label="Source"
          name="source"
        >
          <Select placeholder="Select source" allowClear>
            <Select.Option value="inbound">Inbound</Select.Option>
            <Select.Option value="outbound">Outbound</Select.Option>
            <Select.Option value="referral">Referral</Select.Option>
            <Select.Option value="website">Website</Select.Option>
            <Select.Option value="conference">Conference</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Campaign"
          name="campaign"
        >
          <Input placeholder="Enter campaign name" allowClear />
        </Form.Item>

        <Form.Item
          label="Tags"
          name="tags"
        >
          <Input placeholder="Enter tags (comma separated)" allowClear />
        </Form.Item>

        <Form.Item
          label="Status"
          name="status"
        >
          <Select placeholder="Select status" allowClear>
            <Select.Option value="open">Open</Select.Option>
            <Select.Option value="won">Won</Select.Option>
            <Select.Option value="lost">Lost</Select.Option>
            <Select.Option value="cancelled">Cancelled</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Actual Close Date"
          name="actual_close_date"
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="Notes"
          name="notes"
        >
          <Input.TextArea
            placeholder="Add internal notes"
            rows={3}
          />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
        >
          <Input.TextArea
            placeholder="Add details about this deal"
            rows={4}
          />
        </Form.Item>

        {/* Form Footer with Action Buttons */}
        <Divider style={{ margin: '24px 0 16px 0' }} />
        <Space style={{ float: 'right', width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            loading={createDeal.isPending || updateDeal.isPending}
            onClick={handleSubmit}
          >
            {isEditMode ? 'Update Deal' : 'Create Deal'}
          </Button>
        </Space>
      </Form>
    </Drawer>
  );
};