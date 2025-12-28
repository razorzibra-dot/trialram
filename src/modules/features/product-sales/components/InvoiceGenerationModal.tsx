/**
 * Invoice Generation Modal Component
 * Allows users to generate invoices for product sales
 */

import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Spin,
  Alert,
  Row,
  Col,
  Space,
  Divider,
  Tag,
} from 'antd';
import { ProductSale, ProductSaleItem } from '@/types/productSales';
import { Customer } from '@/types/crm';
import { Product } from '@/types/masters';
import { useGenerateInvoice } from '../hooks/useGenerateInvoice';
import { invoiceService } from '../services/invoiceService';
import { getCustomerName, getProductName } from '../utils/dataEnrichment';

interface InvoiceGenerationModalProps {
  open: boolean;
  sale: ProductSale | null;
  saleItems: ProductSaleItem[];
  customers?: Customer[];
  products?: Product[];
  onClose: () => void;
  onSuccess?: (invoiceNumber: string) => void;
}

/**
 * Invoice Generation Modal
 */
export const InvoiceGenerationModal: React.FC<InvoiceGenerationModalProps> = ({
  open,
  sale,
  saleItems,
  customers = [],
  products = [],
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [taxRate, setTaxRate] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [calculatedTotals, setCalculatedTotals] = useState({
    subtotal: 0,
    tax: 0,
    total: 0,
  });

  const generateInvoiceMutation = useGenerateInvoice();
  const isLoading = generateInvoiceMutation.isPending;

  // Calculate totals when tax rate or currency changes
  React.useEffect(() => {
    if (saleItems.length > 0) {
      const items = saleItems.map(item => ({
        product_id: item.product_id,
        product_name: getProductName(item.product_id, products) || 'Product',
        description: item.description || '',
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: taxRate,
        line_total: item.quantity * item.unit_price,
      }));

      const totals = invoiceService.calculateTotals(items, taxRate);
      setCalculatedTotals(totals);
    }
  }, [taxRate, saleItems, products]);

  const handleGenerate = async (values: any) => {
    if (!sale) {
      return;
    }

    try {
      const result = await generateInvoiceMutation.mutateAsync({
        sale,
        saleItems,
        customers,
        products,
        taxRate,
        currency,
        paymentTerms: values.paymentTerms || 'Net 30',
        notes: values.notes || '',
      });

      onSuccess?.(result.invoice_number);
      onClose();
      form.resetFields();
    } catch (error) {
      // Error is handled by the mutation hook
      console.error('Invoice generation error:', error);
    }
  };

  return (
    <Modal
      title="Generate Invoice"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      width={720}
      okText="Generate Invoice"
      cancelText="Cancel"
      okButtonProps={{ loading: isLoading }}
      maskClosable={false}
    >
      <Spin spinning={isLoading}>
        {!sale ? (
          <Alert message="No sale selected" type="error" />
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleGenerate}
            initialValues={{
              paymentTerms: 'Net 30',
              notes: '',
            }}
          >
            {/* Sale Information */}
            <div className="mb-4 p-4 bg-blue-50 rounded">
              <h4 className="font-semibold mb-2">Sale Information</h4>
              <Row gutter={16}>
                <Col span={12}>
                  <p>
                    <strong>Sale ID:</strong> {sale.id}
                  </p>
                </Col>
                <Col span={12}>
                  <p>
                    <strong>Customer:</strong> {getCustomerName(sale.customer_id, customers) || 'N/A'}
                  </p>
                </Col>
                <Col span={12}>
                  <p>
                    <strong>Email:</strong> {customers?.find(c => c.id === sale.customer_id)?.email || 'N/A'}
                  </p>
                </Col>
                <Col span={12}>
                  <p>
                    <strong>Sale Date:</strong> {new Date(sale.created_at).toLocaleDateString()}
                  </p>
                </Col>
              </Row>
            </div>

            <Divider />

            {/* Invoice Settings */}
            <h4 className="font-semibold mb-4">Invoice Settings</h4>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Currency"
                  name="currency"
                  initialValue={currency}
                >
                  <Select
                    value={currency}
                    onChange={setCurrency}
                    options={[
                      { label: 'USD - US Dollar', value: 'USD' },
                      { label: 'EUR - Euro', value: 'EUR' },
                      { label: 'GBP - British Pound', value: 'GBP' },
                      { label: 'INR - Indian Rupee', value: 'INR' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Tax Rate (%)" name="taxRate">
                  <InputNumber
                    min={0}
                    max={100}
                    step={0.01}
                    value={taxRate}
                    onChange={(value) => setTaxRate(value || 0)}
                    placeholder="Enter tax rate"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Payment Terms"
                  name="paymentTerms"
                  rules={[{ required: true, message: 'Payment terms are required' }]}
                >
                  <Select
                    options={[
                      { label: 'Net 15', value: 'Net 15' },
                      { label: 'Net 30', value: 'Net 30' },
                      { label: 'Net 45', value: 'Net 45' },
                      { label: 'Net 60', value: 'Net 60' },
                      { label: 'Due on Receipt', value: 'Due on Receipt' },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Notes" name="notes">
              <Input.TextArea
                placeholder="Add any additional notes to the invoice"
                rows={3}
              />
            </Form.Item>

            <Divider />

            {/* Invoice Items Summary */}
            <h4 className="font-semibold mb-4">Invoice Items</h4>
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <table style={{ width: '100%', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Product</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Price</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {saleItems.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>{getProductName(item.product_id, products) || 'N/A'}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        {invoiceService.formatCurrency(item.unit_price, currency)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        {invoiceService.formatCurrency(
                          item.quantity * item.unit_price,
                          currency
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoice Totals */}
            <div className="p-4 bg-blue-50 rounded" style={{ marginBottom: '16px' }}>
              <Row justify="end" gutter={16} style={{ marginBottom: '8px' }}>
                <Col span={12}>
                  <strong>Subtotal:</strong>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                  <Tag color="blue">{invoiceService.formatCurrency(calculatedTotals.subtotal, currency)}</Tag>
                </Col>
              </Row>
              {taxRate > 0 && (
                <Row justify="end" gutter={16} style={{ marginBottom: '8px' }}>
                  <Col span={12}>
                    <strong>Tax ({taxRate}%):</strong>
                  </Col>
                  <Col span={12} style={{ textAlign: 'right' }}>
                    <Tag color="orange">{invoiceService.formatCurrency(calculatedTotals.tax, currency)}</Tag>
                  </Col>
                </Row>
              )}
              <Row justify="end" gutter={16}>
                <Col span={12}>
                  <strong style={{ fontSize: '16px' }}>Total:</strong>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                  <Tag color="green" style={{ fontSize: '14px', padding: '4px 12px' }}>
                    {invoiceService.formatCurrency(calculatedTotals.total, currency)}
                  </Tag>
                </Col>
              </Row>
            </div>

            <Alert
              message="Note: Invoice will be generated and stored. Make sure all details are correct before proceeding."
              type="info"
              showIcon
              style={{ marginTop: '16px' }}
            />
          </Form>
        )}
      </Spin>
    </Modal>
  );
};

export default InvoiceGenerationModal;