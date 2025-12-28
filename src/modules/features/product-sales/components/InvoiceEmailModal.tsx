/**
 * Invoice Email Modal
 * Allows users to configure and send invoices via email with professional templates
 */

import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Spin,
  Space,
  Row,
  Col,
  Divider,
  Alert,
  Empty,
  Select,
  DatePicker,
  Switch,
  Tooltip,
  Card,
  Tabs,
  Checkbox
} from 'antd';
import {
  SendOutlined,
  ClockCircleOutlined,
  FilePdfOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  MailOutlined,
  UserOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { ProductSale, ProductSaleItem } from '@/types/productSales';
import { Customer } from '@/types/crm';
import { Invoice } from '../services/invoiceService';
import { useInvoiceEmail } from '../hooks/useInvoiceEmail';
import { InvoiceEmailConfig } from '../services/invoiceEmailService';
import { getCustomerName } from '../utils/dataEnrichment';
import dayjs from 'dayjs';

interface InvoiceEmailModalProps {
  open: boolean;
  invoice: Invoice;
  sale: ProductSale;
  saleItems: ProductSaleItem[];
  customers: Customer[];
  onClose: () => void;
  onSuccess?: (result: any) => void;
  pdfBlob?: Blob;
}

const DEFAULT_PAYMENT_TERMS = [
  { label: 'Due on Receipt', value: 'Due on Receipt' },
  { label: 'Net 15', value: 'Net 15' },
  { label: 'Net 30', value: 'Net 30' },
  { label: 'Net 45', value: 'Net 45' },
  { label: 'Net 60', value: 'Net 60' }
];

export const InvoiceEmailModal: React.FC<InvoiceEmailModalProps> = ({
  open,
  invoice,
  sale,
  saleItems,
  customers,
  onClose,
  onSuccess,
  pdfBlob
}) => {
  const [form] = Form.useForm<Record<string, string>>();
  const { sendEmail, isSendingEmail, sendEmailError, scheduleEmail, isSchedulingEmail, scheduleEmailError } = useInvoiceEmail();
  const customerEmail = customers.find(c => c.id === sale.customer_id)?.email || '';

  const [activeTab, setActiveTab] = useState<'send' | 'schedule' | 'preview'>('send');
  const [includeAttachment, setIncludeAttachment] = useState(true);
  const [scheduleDate, setScheduleDate] = useState<dayjs.Dayjs | null>(null);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [newCcEmail, setNewCcEmail] = useState('');

  const handleAddCc = () => {
    const email = newCcEmail.trim();
    if (email && !ccEmails.includes(email)) {
      setCcEmails([...ccEmails, email]);
      setNewCcEmail('');
    }
  };

  const handleRemoveCc = (email: string) => {
    setCcEmails(ccEmails.filter(e => e !== email));
  };

  const handleSendEmail = async (values: Record<string, string>) => {
    try {
      const config: InvoiceEmailConfig = {
        to: values.recipientEmail,
        cc: ccEmails.length > 0 ? ccEmails : undefined,
        subject: values.subject || `Invoice ${invoice.invoice_number}`,
        customMessage: values.customMessage || undefined
      };

      await sendEmail({
        invoice,
        sale,
        items: saleItems,
        config,
        includeAttachment: includeAttachment && pdfBlob ? true : false,
        pdfBlob: includeAttachment && pdfBlob ? pdfBlob : undefined
      });

      onSuccess?.(true);
      form.resetFields();
      setCcEmails([]);
      onClose();
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  const handleScheduleEmail = async (values: Record<string, string>) => {
    try {
      if (!scheduleDate) {
        throw new Error('Please select a date and time to schedule the email');
      }

      const config: InvoiceEmailConfig = {
        to: values.recipientEmail,
        cc: ccEmails.length > 0 ? ccEmails : undefined,
        subject: values.subject || `Invoice ${invoice.invoice_number}`,
        customMessage: values.customMessage || undefined,
        scheduledFor: scheduleDate.toDate()
      };

      await scheduleEmail({
        invoice,
        sale,
        items: saleItems,
        config,
        scheduledFor: scheduleDate.toDate()
      });

      onSuccess?.(true);
      form.resetFields();
      setCcEmails([]);
      setScheduleDate(null);
      onClose();
    } catch (error) {
      console.error('Failed to schedule email:', error);
    }
  };

  const onFinish = (values: any) => {
    if (activeTab === 'schedule') {
      handleScheduleEmail(values);
    } else {
      handleSendEmail(values);
    }
  };

  const isLoading = isSendingEmail || isSchedulingEmail;

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MailOutlined style={{ color: '#667eea' }} />
          Send Invoice Email
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      <Spin spinning={isLoading}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as any)}
          items={[
            {
              key: 'send',
              label: <span><SendOutlined /> Send Now</span>,
              children: (
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                  initialValues={{
                    recipientEmail: customerEmail,
                    subject: `Invoice ${invoice.invoice_number}`,
                    attachPdf: true
                  }}
                >
                  {sendEmailError && (
                    <Alert
                      type="error"
                      message="Error"
                      description={sendEmailError instanceof Error ? sendEmailError.message : 'Failed to send email'}
                      showIcon
                      style={{ marginBottom: '16px' }}
                      closable
                    />
                  )}

                  {/* Recipient Email */}
                  <Form.Item
                    label="Recipient Email"
                    name="recipientEmail"
                    rules={[
                      { required: true, message: 'Please enter recipient email' },
                      {
                        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Please enter a valid email address'
                      }
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      placeholder="customer@example.com"
                      disabled={isLoading}
                    />
                  </Form.Item>

                  {/* CC Emails */}
                  <Form.Item label="CC Recipients (Optional)">
                    <Input.Group compact>
                      <Input
                        style={{ width: 'calc(100% - 80px)' }}
                        placeholder="manager@example.com"
                        value={newCcEmail}
                        onChange={(e) => setNewCcEmail(e.target.value)}
                        onPressEnter={handleAddCc}
                        disabled={isLoading}
                      />
                      <Button
                        onClick={handleAddCc}
                        disabled={!newCcEmail.trim() || isLoading}
                      >
                        Add
                      </Button>
                    </Input.Group>

                    {ccEmails.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        {ccEmails.map((email) => (
                          <div
                            key={email}
                            style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              margin: '4px 4px 4px 0',
                              backgroundColor: '#f0f0f0',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          >
                            {email}
                            <Button
                              type="text"
                              size="small"
                              style={{ marginLeft: '8px', padding: 0 }}
                              onClick={() => handleRemoveCc(email)}
                              disabled={isLoading}
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Form.Item>

                  {/* Subject */}
                  <Form.Item
                    label="Email Subject"
                    name="subject"
                    rules={[{ required: true, message: 'Please enter email subject' }]}
                  >
                    <Input placeholder="Invoice #INV-2025-01-00001" disabled={isLoading} />
                  </Form.Item>

                  {/* Custom Message */}
                  <Form.Item
                    label="Custom Message (Optional)"
                    name="customMessage"
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="Add a personal message to include in the email..."
                      disabled={isLoading}
                    />
                  </Form.Item>

                  {/* PDF Attachment */}
                  <Form.Item>
                    <Checkbox
                      checked={includeAttachment}
                      onChange={(e) => setIncludeAttachment(e.target.checked)}
                      disabled={!pdfBlob || isLoading}
                    >
                      <span>
                        <FilePdfOutlined style={{ marginRight: '8px' }} />
                        Include Invoice PDF as Attachment
                      </span>
                      {!pdfBlob && (
                        <Tooltip title="PDF not available - generate invoice first">
                          <InfoCircleOutlined style={{ marginLeft: '8px', color: '#f57800' }} />
                        </Tooltip>
                      )}
                    </Checkbox>
                  </Form.Item>

                  {/* Invoice Summary */}
                  <Divider />
                  <div style={{ marginBottom: '16px' }}>
                    <h4>Invoice Summary</h4>
                    <Row gutter={16}>
                      <Col span={12}>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          <div><strong>Invoice #:</strong> {invoice.invoice_number}</div>
                          <div><strong>Amount:</strong> ${invoice.total.toFixed(2)}</div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          <div><strong>Customer:</strong> {getCustomerName(sale.customer_id, customers) || 'N/A'}</div>
                          <div><strong>Date:</strong> {new Date(invoice.generated_at).toLocaleDateString()}</div>
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* Actions */}
                  <Form.Item>
                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                      <Button onClick={onClose} disabled={isLoading}>
                        Cancel
                      </Button>
                      <Button type="primary" htmlType="submit" loading={isLoading} icon={<SendOutlined />}>
                        Send Email Now
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              )
            },
            {
              key: 'schedule',
              label: <span><ClockCircleOutlined /> Schedule</span>,
              children: (
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                  initialValues={{
                    recipientEmail: customerEmail,
                    subject: `Invoice ${invoice.invoice_number}`
                  }}
                >
                  {scheduleEmailError && (
                    <Alert
                      type="error"
                      message="Error"
                      description={scheduleEmailError instanceof Error ? scheduleEmailError.message : 'Failed to schedule email'}
                      showIcon
                      style={{ marginBottom: '16px' }}
                      closable
                    />
                  )}

                  <Alert
                    type="info"
                    message="Schedule Email"
                    description="Schedule this invoice to be sent at a specific date and time"
                    showIcon
                    style={{ marginBottom: '16px' }}
                  />

                  {/* Recipient Email */}
                  <Form.Item
                    label="Recipient Email"
                    name="recipientEmail"
                    rules={[
                      { required: true, message: 'Please enter recipient email' },
                      {
                        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Please enter a valid email address'
                      }
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      placeholder="customer@example.com"
                      disabled={isLoading}
                    />
                  </Form.Item>

                  {/* CC Emails */}
                  <Form.Item label="CC Recipients (Optional)">
                    <Input.Group compact>
                      <Input
                        style={{ width: 'calc(100% - 80px)' }}
                        placeholder="manager@example.com"
                        value={newCcEmail}
                        onChange={(e) => setNewCcEmail(e.target.value)}
                        onPressEnter={handleAddCc}
                        disabled={isLoading}
                      />
                      <Button
                        onClick={handleAddCc}
                        disabled={!newCcEmail.trim() || isLoading}
                      >
                        Add
                      </Button>
                    </Input.Group>

                    {ccEmails.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        {ccEmails.map((email) => (
                          <div
                            key={email}
                            style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              margin: '4px 4px 4px 0',
                              backgroundColor: '#f0f0f0',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          >
                            {email}
                            <Button
                              type="text"
                              size="small"
                              style={{ marginLeft: '8px', padding: 0 }}
                              onClick={() => handleRemoveCc(email)}
                              disabled={isLoading}
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Form.Item>

                  {/* Subject */}
                  <Form.Item
                    label="Email Subject"
                    name="subject"
                    rules={[{ required: true, message: 'Please enter email subject' }]}
                  >
                    <Input placeholder="Invoice #INV-2025-01-00001" disabled={isLoading} />
                  </Form.Item>

                  {/* Custom Message */}
                  <Form.Item
                    label="Custom Message (Optional)"
                    name="customMessage"
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="Add a personal message to include in the email..."
                      disabled={isLoading}
                    />
                  </Form.Item>

                  {/* Schedule Date and Time */}
                  <Form.Item
                    label="Schedule Date & Time"
                    required
                  >
                    <DatePicker
                      showTime
                      format="YYYY-MM-DD HH:mm"
                      value={scheduleDate}
                      onChange={setScheduleDate}
                      disabled={isLoading}
                      style={{ width: '100%' }}
                      disabledDate={(current) => {
                        // Disable past dates
                        return current && current < dayjs().startOf('day');
                      }}
                    />
                  </Form.Item>

                  {/* Invoice Summary */}
                  <Divider />
                  <div style={{ marginBottom: '16px' }}>
                    <h4>Invoice Summary</h4>
                    <Row gutter={16}>
                      <Col span={12}>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          <div><strong>Invoice #:</strong> {invoice.invoice_number}</div>
                          <div><strong>Amount:</strong> ${invoice.total.toFixed(2)}</div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          <div><strong>Customer:</strong> {getCustomerName(sale.customer_id, customers) || 'N/A'}</div>
                          <div><strong>Date:</strong> {new Date(invoice.generated_at).toLocaleDateString()}</div>
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* Actions */}
                  <Form.Item>
                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                      <Button onClick={onClose} disabled={isLoading}>
                        Cancel
                      </Button>
                      <Button type="primary" htmlType="submit" loading={isLoading} icon={<ClockCircleOutlined />}>
                        Schedule Email
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              )
            },
            {
              key: 'preview',
              label: <span><EyeOutlined /> Preview</span>,
              children: (
                <div>
                  <Alert
                    type="info"
                    message="Email Preview"
                    description="This is how the invoice will look in the customer's email"
                    showIcon
                    style={{ marginBottom: '16px' }}
                  />

                  <div
                    style={{
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      padding: '16px',
                      backgroundColor: '#fafafa',
                      maxHeight: '500px',
                      overflowY: 'auto'
                    }}
                  >
                    <iframe
                      srcDoc={`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <meta charset="UTF-8">
                          <style>
                            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                          </style>
                        </head>
                        <body>
                          <div style="max-width: 600px; margin: 0 auto;">
                            <p><strong>To:</strong> ${customerEmail || 'customer@example.com'}</p>
                            <p><strong>Subject:</strong> Invoice ${invoice.invoice_number}</p>
                            <hr />
                            <p><em>Email content will be displayed here...</em></p>
                          </div>
                        </body>
                        </html>
                      `}
                      style={{
                        width: '100%',
                        height: '400px',
                        border: 'none',
                        borderRadius: '4px'
                      }}
                    />
                  </div>

                  <p style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
                    Note: The full email preview will include all invoice details, items, and totals formatted professionally.
                  </p>
                </div>
              )
            }
          ]}
        />
      </Spin>
    </Modal>
  );
};