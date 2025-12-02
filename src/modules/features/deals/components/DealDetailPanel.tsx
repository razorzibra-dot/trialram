/**
 * Sales Deal Detail Panel - Enterprise Enhanced Edition
 * Professional read-only view with key metrics and rich information display
 * ✨ Enterprise Grade UI/UX Enhancements (Phase 7)
 * ✅ Phase 3.1: Link Sales to Customers
 * ✅ Phase 3.2: Link Sales to Products
 */

import React, { useState, useEffect } from 'react';
import { Drawer, Button, Space, Tag, Empty, Progress, Card, Alert, Spin, Tooltip, Table, message, Row, Col, Statistic, Divider, Descriptions, Modal } from 'antd';
import { EditOutlined, LinkOutlined, UserOutlined, ShoppingCartOutlined, FileTextOutlined, ShoppingOutlined, CalendarOutlined, DollarOutlined, RadarChartOutlined, CheckCircleOutlined, CreditCardOutlined, BarChartOutlined, PlusOutlined } from '@ant-design/icons';
import { Deal, Customer } from '@/types/crm';
import { useNavigate } from 'react-router-dom';
import { useService } from '@/modules/core/hooks/useService';
import { CustomerService } from '@/modules/features/customers/services/customerService';
import { ISalesService } from '../services/salesService';
import { ConvertToContractModal } from './ConvertToContractModal';
import { CreateProductSalesModal } from './CreateProductSalesModal';
import { useProcessPayment, useUpdatePaymentStatus, useRecognizeRevenue, useCreateRevenueSchedule, useRevenueSchedule } from '../hooks';

interface DealDetailPanelProps {
  visible: boolean;
  deal: Deal | null;
  onClose: () => void;
  onEdit: () => void;
}

// ✨ Configuration objects for professional styling
const stageConfig: Record<string, { emoji: string; label: string; color: string }> = {
  'lead': { emoji: '🎯', label: 'Lead', color: 'default' },
  'qualified': { emoji: '✅', label: 'Qualified', color: 'processing' },
  'proposal': { emoji: '📄', label: 'Proposal', color: 'warning' },
  'negotiation': { emoji: '🤝', label: 'Negotiation', color: 'warning' },
  'closed_won': { emoji: '🎉', label: 'Closed Won', color: 'green' },
  'closed_lost': { emoji: '❌', label: 'Closed Lost', color: 'red' },
};

const statusConfig: Record<string, { emoji: string; label: string; color: string; bgColor: string }> = {
  'open': { emoji: '🔵', label: 'Open', color: 'blue', bgColor: '#e6f4ff' },
  'won': { emoji: '✅', label: 'Won', color: 'green', bgColor: '#f6ffed' },
  'lost': { emoji: '❌', label: 'Lost', color: 'red', bgColor: '#fff1f0' },
  'cancelled': { emoji: '⏸️', label: 'Cancelled', color: 'default', bgColor: '#f5f5f5' },
};

// Helper functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });
};

const getDaysUntilClose = (dateString: string | undefined) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const getStageProgress = (stage: string) => {
  const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won'];
  const index = stages.indexOf(stage);
  return index >= 0 ? ((index + 1) / stages.length) * 100 : 0;
};

export const DealDetailPanel: React.FC<DealDetailPanelProps> = ({
  visible,
  deal,
  onClose,
  onEdit,
}) => {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [convertModalVisible, setConvertModalVisible] = useState(false);
  const [productSalesModalVisible, setProductSalesModalVisible] = useState(false);
  const [linkedContracts, setLinkedContracts] = useState<Array<{
    id: string;
    title: string;
    status: string;
    value: number;
    created_at: string;
  }>>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);

  const customerService = useService<CustomerService>('customerService');
  const salesService = useService<ISalesService>('salesService');

  // Load customer details
  useEffect(() => {
    if (!deal?.customer_id || !customerService || !visible) {
      return;
    }

    const loadCustomerDetails = async () => {
      try {
        setLoadingCustomer(true);
        const result = await customerService.getCustomer(deal.customer_id);
        if (result) {
          setCustomer(result);
        } else {
          setCustomer(null);
        }
      } catch (error) {
        console.error('[SalesDealDetailPanel] Error loading customer details:', error);
        setCustomer(null);
      } finally {
        setLoadingCustomer(false);
      }
    };

    loadCustomerDetails();
  }, [deal?.customer_id, visible, customerService]);

  // Load linked contracts
  useEffect(() => {
    if (!deal?.id || !salesService || !visible) {
      return;
    }

    const loadLinkedContracts = async () => {
      try {
        setLoadingContracts(true);
        const contracts = await salesService.getContractsForDeal(deal.id);
        setLinkedContracts(contracts);
      } catch (error) {
        console.error('Error loading linked contracts:', error);
        setLinkedContracts([]);
      } finally {
        setLoadingContracts(false);
      }
    };

    loadLinkedContracts();
  }, [deal?.id, visible, salesService]);

  if (!deal) {
    return null;
  }

  const stageInfo = stageConfig[deal.status] || { emoji: '📌', label: deal.status, color: 'default' };
  const statusInfo = statusConfig[deal.status] || { emoji: '❓', label: deal.status, color: 'default', bgColor: '#f5f5f5' };
  const daysUntilClose = getDaysUntilClose(deal.expected_close_date);

  const handleNavigateToCustomer = () => {
    if (deal?.customer_id) {
      navigate(`/tenant/customers/${deal.customer_id}`);
      onClose();
    }
  };

  const handleNavigateToContract = (contractId: string) => {
    navigate(`/tenant/contracts/${contractId}`);
    onClose();
  };

  const handleConversionSuccess = (contractId: string) => {
    if (deal?.id && salesService) {
      salesService.getContractsForDeal(deal.id).then(setLinkedContracts).catch(() => {
        setLinkedContracts([]);
      });
    }
    handleNavigateToContract(contractId);
  };

  // ✨ Card styling
  const infoCardStyle = {
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    borderRadius: 8,
    border: '1px solid #f0f0f0',
    marginBottom: 16,
  };

  const cardHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
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
    <>
      <Drawer
        title={`Deal Details - ${deal.title}`}
        placement="right"
        width={650}
        onClose={onClose}
        open={visible}
        footer={
          <Space style={{ float: 'right', width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onClose}>Close</Button>
            {deal?.status === 'won' && deal?.items && deal?.items.length > 0 && (
              <Button
                type="default"
                icon={<ShoppingOutlined />}
                onClick={() => setProductSalesModalVisible(true)}
              >
                Create Product Sales
              </Button>
            )}
            {deal?.status === 'won' && (
              <Button
                type="default"
                icon={<FileTextOutlined />}
                onClick={() => setConvertModalVisible(true)}
              >
                Convert to Contract
              </Button>
            )}
            <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
              Edit Deal
            </Button>
          </Space>
        }
      >
        {/* 🎯 Key Metrics Card */}
        <Card style={infoCardStyle}>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                  Deal Value
                </div>
                <Statistic
                  value={deal.value || 0}
                  prefix="$"
                  suffix=""
                  valueStyle={{ color: '#0ea5e9', fontSize: 18, fontWeight: 600 }}
                  formatter={(value) => {
                    const num = value as number;
                    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
                    return num.toString();
                  }}
                />
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                  Win Probability
                </div>
                <Statistic
                  value={50}
                  suffix="%"
                  valueStyle={{ color: '#0ea5e9', fontSize: 18, fontWeight: 600 }}
                />
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                  Status
                </div>
                <Tag color={statusInfo.color} style={{ fontSize: 12, padding: '4px 12px' }}>
                  {statusInfo.emoji} {statusInfo.label}
                </Tag>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 📊 Pipeline Progress */}
        <Card style={infoCardStyle}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>
              Pipeline Progress
            </div>
            <Progress
              percent={getStageProgress(deal.status)}
              status="active"
              format={() => `${stageInfo.emoji} ${stageInfo.label}`}
              strokeColor="#0ea5e9"
            />
          </div>
          {daysUntilClose !== null && (
            <Alert
              message={daysUntilClose > 0 ? `${daysUntilClose} days until expected close` : 'Expected close date has passed'}
              type={daysUntilClose > 10 ? 'info' : daysUntilClose > 0 ? 'warning' : 'error'}
              showIcon
            />
          )}
        </Card>

        {/* 🎯 Deal Information */}
        <Card style={infoCardStyle}>
          <div style={cardHeaderStyle}>
            <FileTextOutlined style={iconStyle} />
            Deal Information
          </div>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>
                  Stage
                </div>
                <Tag color={stageInfo.color} style={{ fontSize: 12 }}>
                  {stageInfo.emoji} {stageInfo.label}
                </Tag>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>
                  Status
                </div>
                <Tag color={statusInfo.color}>
                  {statusInfo.emoji} {statusInfo.label}
                </Tag>
              </div>
            </Col>
            <Col xs={24}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>
                  Description
                </div>
                <div style={{ color: '#1f2937', fontSize: 13, lineHeight: 1.6 }}>
                  {deal.description || '—'}
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 📅 Timeline Information */}
        <Card style={infoCardStyle}>
          <div style={cardHeaderStyle}>
            <CalendarOutlined style={iconStyle} />
            Timeline
          </div>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>
                Expected Close Date
              </div>
              <div style={{ color: '#1f2937', fontSize: 13 }}>
                {formatDate(deal.expected_close_date)}
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>
                Actual Close Date
              </div>
              <div style={{ color: '#1f2937', fontSize: 13 }}>
                {formatDate(deal.close_date)}
              </div>
            </Col>
          </Row>
        </Card>

        {/* 👥 Customer Information */}
        <Card style={infoCardStyle}>
          <div style={cardHeaderStyle}>
            <UserOutlined style={iconStyle} />
            Customer Information
          </div>

          {loadingCustomer ? (
            <Spin size="small" />
          ) : customer ? (
            <>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>
                      Company Name
                    </div>
                    <div style={{ color: '#1f2937', fontSize: 13, fontWeight: 500 }}>
                      {customer.company_name}
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>
                      Contact Person
                    </div>
                    <div style={{ color: '#1f2937', fontSize: 13 }}>
                      {customer.contact_name}
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>
                      Email
                    </div>
                    <div style={{ color: '#0ea5e9', fontSize: 13 }}>
                      <a href={`mailto:${customer.email}`}>{customer.email}</a>
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>
                      Phone
                    </div>
                    <div style={{ color: '#0ea5e9', fontSize: 13 }}>
                      <a href={`tel:${customer.phone}`}>{customer.phone}</a>
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>
                      Industry
                    </div>
                    <div style={{ color: '#1f2937', fontSize: 13 }}>
                      {customer.industry}
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>
                      Company Size
                    </div>
                    <div style={{ color: '#1f2937', fontSize: 13 }}>
                      {customer.size}
                    </div>
                  </div>
                </Col>
              </Row>

              <Button
                block
                type="dashed"
                onClick={handleNavigateToCustomer}
                icon={<LinkOutlined />}
                style={{ marginTop: 12 }}
              >
                View Full Customer Profile
              </Button>
            </>
          ) : (
            <Alert
              message="No Customer Linked"
              description="This deal is not linked to a customer. Edit the deal to add a customer relationship."
              type="warning"
              showIcon
            />
          )}
        </Card>

        {/* 🛒 Products/Services */}
        {deal.items && deal.items.length > 0 && (
          <Card style={infoCardStyle}>
            <div style={cardHeaderStyle}>
              <ShoppingCartOutlined style={iconStyle} />
              Products & Services
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ backgroundColor: '#fafafa', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                      Product
                    </th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', width: '50px', fontWeight: 600, color: '#374151' }}>
                      Qty
                    </th>
                    <th style={{ padding: '10px 8px', textAlign: 'right', width: '70px', fontWeight: 600, color: '#374151' }}>
                      Price
                    </th>
                    <th style={{ padding: '10px 8px', textAlign: 'right', width: '70px', fontWeight: 600, color: '#374151' }}>
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deal.items.map((item, index) => (
                    <tr key={item.id || index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ fontWeight: 500, marginBottom: 4, color: '#1f2937' }}>
                          {item.product_name}
                        </div>
                        {item.product_description && (
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                            {item.product_description}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#6b7280' }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: '#6b7280' }}>
                        ${item.unit_price.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600, color: '#1f2937' }}>
                        ${item.line_total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* 📝 Campaign & Source */}
        {(deal.source || deal.campaign) && (
          <Card style={infoCardStyle}>
            <div style={cardHeaderStyle}>
              <CheckCircleOutlined style={iconStyle} />
              Campaign & Source
            </div>
            <Row gutter={16}>
              {deal.source && (
                <Col xs={24} sm={12}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>
                    Source
                  </div>
                  <div style={{ color: '#1f2937', fontSize: 13 }}>
                    {deal.source}
                  </div>
                </Col>
              )}
              {deal.campaign && (
                <Col xs={24} sm={12}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>
                    Campaign
                  </div>
                  <div style={{ color: '#1f2937', fontSize: 13 }}>
                    {deal.campaign}
                  </div>
                </Col>
              )}
            </Row>
          </Card>
        )}

        {/* 📌 Tags */}
        {deal.tags && deal.tags.length > 0 && (
          <Card style={infoCardStyle}>
            <div style={cardHeaderStyle}>
              <BgColorsOutlined style={iconStyle} />
              Tags
            </div>
            <div>
              {Array.isArray(deal.tags) ? (
                deal.tags.map((tag: string, index: number) => (
                  <Tag key={index} color="blue" style={{ marginRight: 8, marginBottom: 8 }}>
                    {tag}
                  </Tag>
                ))
              ) : (
                <span style={{ color: '#6b7280' }}>—</span>
              )}
            </div>
          </Card>
        )}

        {/* 📄 Notes */}
        {deal.notes && (
          <Card style={{ ...infoCardStyle, backgroundColor: '#fffaed' }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>
              Internal Notes
            </div>
            <div style={{ color: '#1f2937', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {deal.notes}
            </div>
          </Card>
        )}

        {/* 💳 Payment Information */}
        <Card style={infoCardStyle}>
          <div style={cardHeaderStyle}>
            <CreditCardOutlined style={iconStyle} />
            Payment Information
          </div>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>
                  Payment Status
                </div>
                <Tag color={
                  deal.payment_status === 'paid' ? 'green' :
                  deal.payment_status === 'partial' ? 'orange' :
                  deal.payment_status === 'overdue' ? 'red' : 'default'
                }>
                  {deal.payment_status || 'pending'}
                </Tag>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>
                  Paid Amount
                </div>
                <div style={{ color: '#1f2937', fontSize: 13, fontWeight: 500 }}>
                  {formatCurrency(deal.paid_amount || 0)}
                </div>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>
                  Outstanding Amount
                </div>
                <div style={{ color: '#1f2937', fontSize: 13, fontWeight: 500 }}>
                  {formatCurrency(deal.outstanding_amount || 0)}
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>
                  Payment Terms
                </div>
                <div style={{ color: '#1f2937', fontSize: 13 }}>
                  {deal.payment_terms || '—'}
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>
                  Payment Due Date
                </div>
                <div style={{ color: '#1f2937', fontSize: 13 }}>
                  {formatDate(deal.payment_due_date)}
                </div>
              </div>
            </Col>
          </Row>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            style={{ marginTop: 12 }}
            block
          >
            Process Payment
          </Button>
        </Card>

        {/* 📊 Revenue Recognition */}
        <Card style={infoCardStyle}>
          <div style={cardHeaderStyle}>
            <BarChartOutlined style={iconStyle} />
            Revenue Recognition
          </div>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>
                  Recognition Status
                </div>
                <Tag color={
                  deal.revenue_recognition_status === 'completed' ? 'green' :
                  deal.revenue_recognition_status === 'in_progress' ? 'blue' : 'default'
                }>
                  {deal.revenue_recognition_status || 'not_started'}
                </Tag>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>
                  Recognized Amount
                </div>
                <div style={{ color: '#1f2937', fontSize: 13, fontWeight: 500 }}>
                  {formatCurrency(deal.revenue_recognized || 0)}
                </div>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>
                  Recognition Method
                </div>
                <div style={{ color: '#1f2937', fontSize: 13 }}>
                  {deal.revenue_recognition_method || 'immediate'}
                </div>
              </div>
            </Col>
          </Row>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            style={{ marginTop: 12 }}
            block
          >
            Recognize Revenue
          </Button>
        </Card>

        {/* 🔗 Linked Contracts */}
        {linkedContracts.length > 0 && (
          <Card style={infoCardStyle}>
            <div style={cardHeaderStyle}>
              <FileTextOutlined style={iconStyle} />
              Linked Contracts ({linkedContracts.length})
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ backgroundColor: '#fafafa', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                      Contract Title
                    </th>
                    <th style={{ padding: '10px 8px', textAlign: 'right', width: '80px', fontWeight: 600, color: '#374151' }}>
                      Value
                    </th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', width: '60px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {linkedContracts.map((contract, index) => (
                    <tr key={contract.id || index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px 8px', color: '#1f2937' }}>
                        {contract.title}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: '#0ea5e9', fontWeight: 600 }}>
                        ${contract.value.toFixed(0)}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <Button
                          type="link"
                          size="small"
                          onClick={() => handleNavigateToContract(contract.id)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </Drawer>

      {/* Modals */}
      <ConvertToContractModal
        visible={convertModalVisible}
        deal={deal}
        onClose={() => setConvertModalVisible(false)}
        onSuccess={handleConversionSuccess}
      />
      <CreateProductSalesModal
        visible={productSalesModalVisible}
        deal={deal}
        onClose={() => setProductSalesModalVisible(false)}
        onSuccess={() => setProductSalesModalVisible(false)}
      />
    </>
  );
};

// Add missing import icon
const BgColorsOutlined = ({ style }: { style?: React.CSSProperties }) => (
  <span style={style}>🏷️</span>
);