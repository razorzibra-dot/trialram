/**
 * Reports Modal Component
 * Allows users to generate various types of reports
 */

import React, { useState } from 'react';
import {
  Modal,
  Form,
  Select,
  Button,
  Space,
  message,
  Tabs,
  Card,
  Row,
  Col,
  DatePicker,
  Input,
  Switch,
  Tag,
  Divider,
  Empty,
  Spin,
} from 'antd';
import {
  DownloadOutlined,
  FileTextOutlined,
  MailOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import type { TabsProps } from 'antd';
import dayjs from 'dayjs';
import { ProductSale, ProductSalesAnalytics } from '@/types/productSales';
import {
  reportGenerationService,
  MonthlySalesReport,
  CustomerSalesReport,
  ProductSalesReport,
  RevenueReport,
  ReportSchedule,
} from '../services/reportGenerationService';

interface ReportsModalProps {
  visible: boolean;
  data: ProductSale[];
  analytics: ProductSalesAnalytics | null;
  onClose: () => void;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({
  visible,
  data,
  analytics,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [reportType, setReportType] = useState<'monthly_sales' | 'customer_sales' | 'product_sales' | 'revenue_report'>('monthly_sales');
  const [loading, setLoading] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [scheduleFormData, setScheduleFormData] = useState({
    name: '',
    frequency: 'monthly' as const,
    recipients: [] as string[],
  });

  const reportTypeOptions = [
    { label: 'Monthly Sales Report', value: 'monthly_sales' },
    { label: 'Customer Sales Report', value: 'customer_sales' },
    { label: 'Product Sales Report', value: 'product_sales' },
    { label: 'Revenue Report', value: 'revenue_report' },
  ];

  const frequencyOptions = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
  ];

  /**
   * Generate the requested report
   */
  const handleGenerateReport = async () => {
    if (!analytics) {
      message.error('Analytics data not available');
      return;
    }

    setLoading(true);
    try {
      let report: any;
      let reportTitle = '';

      switch (reportType) {
        case 'monthly_sales': {
          const month = form.getFieldValue('month') || dayjs().format('MM-YYYY');
          report = reportGenerationService.generateMonthlySalesReport(data, analytics, month);
          reportTitle = `Monthly Sales Report - ${month}`;
          break;
        }

        case 'customer_sales': {
          const customerName = form.getFieldValue('customer_name');
          if (!customerName) {
            message.error('Please select a customer');
            setLoading(false);
            return;
          }
          report = reportGenerationService.generateCustomerSalesReport(data, customerName);
          reportTitle = `Customer Sales Report - ${customerName}`;
          break;
        }

        case 'product_sales': {
          const productName = form.getFieldValue('product_name');
          if (!productName) {
            message.error('Please select a product');
            setLoading(false);
            return;
          }
          report = reportGenerationService.generateProductSalesReport(data, productName);
          reportTitle = `Product Sales Report - ${productName}`;
          break;
        }

        case 'revenue_report': {
          const period = form.getFieldValue('period') || dayjs().format('YYYY-MM');
          report = reportGenerationService.generateRevenueReport(data, analytics, period);
          reportTitle = `Revenue Report - ${period}`;
          break;
        }

        default:
          message.error('Unknown report type');
          setLoading(false);
          return;
      }

      setGeneratedReport({ data: report, title: reportTitle, type: reportType });
      message.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Download report as HTML/PDF
   */
  const handleDownloadReport = () => {
    if (!generatedReport) {
      message.error('No report to download');
      return;
    }

    try {
      const html = reportGenerationService.exportToHTML(generatedReport.data, generatedReport.type, {
        title: generatedReport.title,
        includeSummary: true,
        includeCharts: true,
      });

      const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${generatedReport.title.replace(/\s+/g, '_')}.html`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      message.error('Failed to download report');
    }
  };

  /**
   * Schedule report for recurring delivery
   */
  const handleScheduleReport = () => {
    if (!scheduleFormData.name || scheduleFormData.recipients.length === 0) {
      message.error('Please fill in all schedule fields');
      return;
    }

    const newSchedule: ReportSchedule = {
      id: Date.now().toString(),
      name: scheduleFormData.name,
      reportType,
      frequency: scheduleFormData.frequency,
      recipients: scheduleFormData.recipients,
      isActive: true,
      createdAt: new Date(),
    };

    setSchedules([...schedules, newSchedule]);
    setScheduleFormData({ name: '', frequency: 'monthly', recipients: [] });
    message.success('Report scheduled successfully');
  };

  /**
   * Remove scheduled report
   */
  const handleRemoveSchedule = (id: string) => {
    setSchedules(schedules.filter(s => s.id !== id));
    message.success('Schedule removed');
  };

  /**
   * Toggle schedule active status
   */
  const handleToggleSchedule = (id: string) => {
    setSchedules(schedules.map(s =>
      s.id === id ? { ...s, isActive: !s.isActive } : s
    ));
  };

  /**
   * Get available customers
   */
  const getCustomerOptions = () => {
    const customers = Array.from(new Set(data.map(s => s.customer_name).filter(Boolean)));
    return customers.map(customer => ({ label: customer, value: customer }));
  };

  /**
   * Get available products
   */
  const getProductOptions = () => {
    const products = Array.from(new Set(data.map(s => s.product_name).filter(Boolean)));
    return products.map(product => ({ label: product, value: product }));
  };

  const tabItems: TabsProps['items'] = [
    {
      key: 'generate',
      label: 'Generate Report',
      icon: <FileTextOutlined />,
      children: (
        <div>
          <Form
            form={form}
            layout="vertical"
            style={{ marginBottom: 20 }}
          >
            {/* Report Type Selection */}
            <Form.Item label="Report Type" required>
              <Select
                value={reportType}
                onChange={(value) => {
                  setReportType(value);
                  form.resetFields();
                }}
                options={reportTypeOptions}
              />
            </Form.Item>

            {/* Conditional Fields Based on Report Type */}
            {reportType === 'monthly_sales' && (
              <Form.Item
                name="month"
                label="Month"
                initialValue={dayjs()}
              >
                <DatePicker picker="month" />
              </Form.Item>
            )}

            {reportType === 'customer_sales' && (
              <Form.Item
                name="customer_name"
                label="Customer"
                required
              >
                <Select
                  placeholder="Select a customer"
                  options={getCustomerOptions()}
                />
              </Form.Item>
            )}

            {reportType === 'product_sales' && (
              <Form.Item
                name="product_name"
                label="Product"
                required
              >
                <Select
                  placeholder="Select a product"
                  options={getProductOptions()}
                />
              </Form.Item>
            )}

            {reportType === 'revenue_report' && (
              <Form.Item
                name="period"
                label="Period"
                initialValue={dayjs().format('YYYY-MM')}
              >
                <Input type="month" />
              </Form.Item>
            )}

            <Form.Item>
              <Button
                type="primary"
                icon={<FileTextOutlined />}
                onClick={handleGenerateReport}
                loading={loading}
                block
              >
                Generate Report
              </Button>
            </Form.Item>
          </Form>

          {/* Generated Report Preview */}
          {generatedReport && (
            <Card
              title="Report Preview"
              extra={
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadReport}
                >
                  Download
                </Button>
              }
              style={{ marginTop: 20 }}
            >
              {renderReportPreview(generatedReport.data, generatedReport.type)}
            </Card>
          )}
        </div>
      ),
    },
    {
      key: 'schedule',
      label: 'Schedule Reports',
      icon: <CalendarOutlined />,
      children: (
        <div>
          {/* Schedule Form */}
          <Card title="Create Schedule" style={{ marginBottom: 20 }}>
            <Form layout="vertical">
              <Form.Item label="Schedule Name" required>
                <Input
                  placeholder="e.g., Weekly Revenue Report"
                  value={scheduleFormData.name}
                  onChange={(e) =>
                    setScheduleFormData({ ...scheduleFormData, name: e.target.value })
                  }
                />
              </Form.Item>

              <Form.Item label="Report Type" required>
                <Select
                  value={reportType}
                  onChange={(value) => setReportType(value)}
                  options={reportTypeOptions}
                />
              </Form.Item>

              <Form.Item label="Frequency" required>
                <Select
                  value={scheduleFormData.frequency}
                  onChange={(value) =>
                    setScheduleFormData({ ...scheduleFormData, frequency: value })
                  }
                  options={frequencyOptions}
                />
              </Form.Item>

              <Form.Item label="Recipients (Email)" required>
                <Select
                  mode="tags"
                  placeholder="Enter email addresses"
                  value={scheduleFormData.recipients}
                  onChange={(value) =>
                    setScheduleFormData({ ...scheduleFormData, recipients: value })
                  }
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  icon={<MailOutlined />}
                  onClick={handleScheduleReport}
                  block
                >
                  Schedule Report
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* Scheduled Reports List */}
          <div>
            <h3>Active Schedules</h3>
            {schedules.length === 0 ? (
              <Empty description="No scheduled reports" />
            ) : (
              <div>
                {schedules.map((schedule) => (
                  <Card
                    key={schedule.id}
                    size="small"
                    style={{ marginBottom: 12 }}
                    extra={
                      <Space>
                        <Switch
                          checked={schedule.isActive}
                          onChange={() => handleToggleSchedule(schedule.id)}
                        />
                        <Button
                          danger
                          size="small"
                          onClick={() => handleRemoveSchedule(schedule.id)}
                        >
                          Delete
                        </Button>
                      </Space>
                    }
                  >
                    <Row gutter={16}>
                      <Col span={12}>
                        <div>
                          <strong>{schedule.name}</strong>
                          <br />
                          <Tag>{reportTypeOptions.find(o => o.value === schedule.reportType)?.label}</Tag>
                          <Tag color="blue">{schedule.frequency}</Tag>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          Recipients: {schedule.recipients.join(', ')}
                        </div>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="Reports & Analytics"
      visible={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <Tabs items={tabItems} />
    </Modal>
  );
};

/**
 * Render report preview based on type
 */
function renderReportPreview(report: any, reportType: string): JSX.Element {
  switch (reportType) {
    case 'monthly_sales':
      return (
        <div>
          <Row gutter={16}>
            <Col span={8}>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Total Sales</div>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                  {report.totalSales}
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Total Revenue</div>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>
                  ${report.totalRevenue.toFixed(2)}
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Avg Sale Value</div>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#faad14' }}>
                  ${report.averageSaleValue.toFixed(2)}
                </div>
              </div>
            </Col>
          </Row>
        </div>
      );

    case 'customer_sales':
      return (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Customer</div>
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                  {report.customerName}
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Total Revenue</div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1890ff' }}>
                  ${report.totalRevenue.toFixed(2)}
                </div>
              </div>
            </Col>
          </Row>
          <Divider />
          <div style={{ fontSize: 12 }}>
            <strong>Products Purchased:</strong> {report.products.length}
          </div>
        </div>
      );

    case 'product_sales':
      return (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Product</div>
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                  {report.productName}
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Units Sold</div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1890ff' }}>
                  {report.totalUnitsSold}
                </div>
              </div>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Total Revenue</div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#52c41a' }}>
                  ${report.totalRevenue.toFixed(2)}
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Avg Unit Price</div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#faad14' }}>
                  ${report.averageUnitPrice.toFixed(2)}
                </div>
              </div>
            </Col>
          </Row>
        </div>
      );

    case 'revenue_report':
      return (
        <div>
          <Row gutter={16}>
            <Col span={8}>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Total Revenue</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
                  ${report.totalRevenue.toFixed(2)}
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Total Sales</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#52c41a' }}>
                  {report.totalSales}
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Avg Order Value</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#faad14' }}>
                  ${report.averageOrderValue.toFixed(2)}
                </div>
              </div>
            </Col>
          </Row>
        </div>
      );

    default:
      return <Empty />;
  }
}