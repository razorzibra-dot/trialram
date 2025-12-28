/**
 * Product Sale Detail Panel
 * Side drawer for viewing product sale details in read-only mode
 * Aligned with Contracts module standards
 * RBAC Integration: Controls view and action permissions
 */

import React, { useState, useMemo } from 'react';
import {
  Drawer,
  Descriptions,
  Button,
  Space,
  Divider,
  Tag,
  Empty,
  Row,
  Col,
  Statistic,
  Modal,
  message,
  Tooltip,
  Card,
} from 'antd';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  EditOutlined,
  MailOutlined,
  CalendarOutlined,
  DollarOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  DeleteOutlined,
  SwapOutlined,
  FilePdfOutlined,
  BellOutlined,
  LockOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { ProductSale, ProductSaleItem } from '@/types/productSales';
import { StatusTransitionModal } from './StatusTransitionModal';
import { InvoiceGenerationModal } from './InvoiceGenerationModal';
import { InvoiceEmailModal } from './InvoiceEmailModal';
import { NotificationHistoryPanel } from './NotificationHistoryPanel';
import { useGenerateContractFromSale } from '../hooks/useGenerateContractFromSale';
import { useProductSalesPermissions } from '../hooks/useProductSalesPermissions';
import { useReferenceDataLookup } from '@/hooks/useReferenceDataLookup';

interface ProductSaleDetailPanelProps {
  open: boolean;
  productSale: ProductSale | null;
  saleItems?: ProductSaleItem[];
  onClose: () => void;
  onEdit: () => void;
  onGenerateContract?: () => void;
  onDelete?: () => void;
  onStatusChanged?: () => void;
  onInvoiceGenerated?: (invoiceNumber: string) => void;
}

export const ProductSaleDetailPanel: React.FC<ProductSaleDetailPanelProps> = ({
  open,
  productSale,
  saleItems = [],
  onClose,
  onEdit,
  onGenerateContract,
  onDelete,
  onStatusChanged,
  onInvoiceGenerated,
}) => {
  const [showStatusTransition, setShowStatusTransition] = useState(false);
  const [showInvoiceGeneration, setShowInvoiceGeneration] = useState(false);
  const [showInvoiceEmail, setShowInvoiceEmail] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);
  const [showNotificationHistory, setShowNotificationHistory] = useState(false);
  
  // Hook for generating contracts from sales
  const { generateContract } = useGenerateContractFromSale();
  
  // RBAC permission checking
  const permissions = useProductSalesPermissions({
    sale: productSale || undefined,
    autoLoad: open, // Load permissions when drawer opens
  });

  // Database-driven status colors
  const { getColor: getStatusColor } = useReferenceDataLookup('product_sale_status');

  // Professional styling configuration
  const sectionStyles = {
    card: {
      marginBottom: 20,
      borderRadius: 8,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
      border: '1px solid #f0f0f0',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 12,
      borderBottom: '2px solid #0ea5e9',
    },
    headerIcon: {
      fontSize: 18,
      color: '#0ea5e9',
      marginRight: 10,
    },
    headerTitle: {
      fontSize: 15,
      fontWeight: 600,
      color: '#1f2937',
      margin: 0,
    },
  };

  if (!productSale) {
    return null;
  }

  const handleGenerateContract = () => {
    Modal.confirm({
      title: 'Generate Service Contract',
      content: `Create a new service contract for sale ${productSale.sale_number}? You'll be redirected to the contract creation form with pre-filled data from this sale.`,
      okText: 'Yes, Generate',
      cancelText: 'Cancel',
      onOk() {
        try {
          // Navigate to contract creation with pre-filled data
          generateContract(productSale);
          
          // Call callback if provided
          if (onGenerateContract) {
            onGenerateContract();
          }
        } catch (error) {
          console.error('Error generating contract:', error);
          message.error('Failed to generate contract. Please try again.');
        }
      },
    });
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Product Sale',
      content: `Are you sure you want to delete sale ${productSale.sale_number}? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        if (onDelete) {
          onDelete();
        }
      },
    });
  };

  const displayStatus = productSale.status
    .replace('_', ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return (
    <>
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCartOutlined style={{ fontSize: 20, color: '#0ea5e9' }} />
            <span>Product Sale Details</span>
          </div>
        }
        placement="right"
        width={650}
        onClose={onClose}
        open={open}
        styles={{ body: { padding: 0, paddingTop: 24 } }}
        footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button size="large" onClick={onClose}>Close</Button>
          
          {/* View Notification History - Always available if viewing details */}
          <Tooltip title="View notification history">
            <Button
              size="large"
              icon={<BellOutlined />} 
              onClick={() => setShowNotificationHistory(true)}
            >
              Notifications
            </Button>
          </Tooltip>
          
          {/* Change Status - Only if permission granted */}
          {permissions.canChangeStatus ? (
            <Tooltip title="Change sale status">
              <Button
                size="large"
                icon={<SwapOutlined />} 
                onClick={() => setShowStatusTransition(true)}
              >
                Change Status
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title="Permission denied: Cannot change status">
              <Button
                size="large"
                icon={<SwapOutlined />}
                disabled
              >
                Change Status
              </Button>
            </Tooltip>
          )}
          
          {/* Generate Invoice - Only if delivered and permitted */}
          {productSale.status === 'delivered' && saleItems.length > 0 && (
            <>
              {permissions.canExport ? (
                <Tooltip title="Generate invoice for this sale">
                  <Button
                    size="large"
                    icon={<FilePdfOutlined />} 
                    onClick={() => setShowInvoiceGeneration(true)}
                    title="Generate invoice from this sale"
                  >
                    Generate Invoice
                  </Button>
                </Tooltip>
              ) : (
                <Tooltip title="Permission denied: Cannot generate invoices">
                  <Button
                    size="large"
                    icon={<FilePdfOutlined />}
                    disabled
                    title="Permission denied"
                  >
                    Generate Invoice
                  </Button>
                </Tooltip>
              )}
              
              {generatedInvoice && (
                permissions.canExport ? (
                  <Tooltip title="Send generated invoice to customer email">
                    <Button
                      size="large"
                      icon={<MailOutlined />} 
                      onClick={() => setShowInvoiceEmail(true)}
                      title="Send invoice via email"
                      type="default"
                    >
                      Send Invoice Email
                    </Button>
                  </Tooltip>
                ) : (
                  <Tooltip title="Permission denied: Cannot send invoices">
                    <Button
                      size="large"
                      icon={<MailOutlined />}
                      disabled
                      type="default"
                    >
                      Send Invoice Email
                    </Button>
                  </Tooltip>
                )
              )}
            </>
          )}
          
          {/* Generate Contract - Only if permitted */}
          {!productSale.service_contract_id && (
            permissions.canCreate ? (
              <Button
                size="large"
                icon={<FileTextOutlined />} 
                onClick={handleGenerateContract}
                title="Generate a service contract from this sale"
              >
                Generate Contract
              </Button>
            ) : (
              <Tooltip title="Permission denied: Cannot generate contracts">
                <Button
                  size="large"
                  icon={<FileTextOutlined />}
                  disabled
                  title="Permission denied"
                >
                  Generate Contract
                </Button>
              </Tooltip>
            )
          )}
          
          {/* Delete - Only if permitted */}
          {onDelete && (
            permissions.canDelete ? (
              <Button
                size="large"
                danger 
                icon={<DeleteOutlined />} 
                onClick={handleDelete}
                title="Delete this product sale"
              >
                Delete
              </Button>
            ) : (
              <Tooltip title="Permission denied: Cannot delete sales">
                <Button
                  size="large"
                  danger
                  icon={<DeleteOutlined />}
                  disabled
                  title="Permission denied"
                >
                  Delete
                </Button>
              </Tooltip>
            )
          )}
          
          {/* Edit - Only if permitted */}
          {permissions.canEdit ? (
            <Button size="large" type="primary" icon={<EditOutlined />} onClick={onEdit}>
              Edit
            </Button>
          ) : (
            <Tooltip title="Permission denied: Cannot edit sales">
              <Button size="large" type="primary" icon={<LockOutlined />} disabled>
                Edit
              </Button>
            </Tooltip>
          )}
        </div>
      }
    >
      <div style={{ padding: '0 24px 24px 24px' }}>
        {productSale ? (
          <>
            {/* 📊 Key Metrics Card */}
            <Card style={sectionStyles.card} variant="borderless">
              <div style={sectionStyles.header}>
                <CheckCircleOutlined style={sectionStyles.headerIcon} />
                <h3 style={sectionStyles.headerTitle}>Key Metrics</h3>
              </div>

              <Row gutter={24}>
                <Col xs={12} sm={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                      Total Value
                    </div>
                    <Statistic
                      value={productSale.total_cost || 0}
                      prefix="$"
                      valueStyle={{ color: '#0ea5e9', fontSize: 18, fontWeight: 600 }}
                      formatter={(value) => {
                        const num = value as number;
                        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                        if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
                        return num.toLocaleString();
                      }}
                    />
                  </div>
                </Col>
                <Col xs={12} sm={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                      Units Sold
                    </div>
                    <Statistic
                      value={productSale.units || 0}
                      valueStyle={{ color: '#10b981', fontSize: 18, fontWeight: 600 }}
                    />
                  </div>
                </Col>
                <Col xs={12} sm={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                      Cost Per Unit
                    </div>
                    <Statistic
                      value={productSale.cost_per_unit || 0}
                      prefix="$"
                      valueStyle={{ color: '#8b5cf6', fontSize: 18, fontWeight: 600 }}
                      formatter={(value) => (value as number).toLocaleString()}
                    />
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Sale Information Card */}
            <Card style={sectionStyles.card} variant="borderless">
              <div style={sectionStyles.header}>
                <InfoCircleOutlined style={sectionStyles.headerIcon} />
                <h3 style={sectionStyles.headerTitle}>Sale Information</h3>
              </div>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Sale Number">
                  <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>
                    {productSale.sale_number || 'N/A'}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={getStatusColor(productSale.status)} style={{ fontSize: 13 }}>
                    {productSale.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Tag>
                </Descriptions.Item>
                {productSale.delivery_date && (
                  <Descriptions.Item label="Delivery Date">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CalendarOutlined style={{ color: '#0ea5e9' }} />
                      {formatDate(productSale.delivery_date)}
                    </span>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* Customer & Product Reference Card */}
            <Card style={sectionStyles.card} variant="borderless">
              <div style={sectionStyles.header}>
                <UserOutlined style={sectionStyles.headerIcon} />
                <h3 style={sectionStyles.headerTitle}>Customer & Product Reference</h3>
              </div>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Customer ID">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserOutlined style={{ color: '#0ea5e9' }} />
                    <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{productSale.customer_id}</span>
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Product ID">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShoppingCartOutlined style={{ color: '#0ea5e9' }} />
                    <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{productSale.product_id}</span>
                  </span>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Warranty Information Card */}
            {productSale.warranty_expiry && (
              <Card style={sectionStyles.card} variant="borderless">
                <div style={sectionStyles.header}>
                  <SafetyOutlined style={sectionStyles.headerIcon} />
                  <h3 style={sectionStyles.headerTitle}>Warranty Information</h3>
                </div>
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Warranty Expiry">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CalendarOutlined style={{ color: '#0ea5e9' }} />
                      {formatDate(productSale.warranty_expiry)}
                    </span>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* Service Contract Link Card */}
            {productSale.service_contract_id && (
              <Card style={sectionStyles.card} variant="borderless">
                <div style={sectionStyles.header}>
                  <FileTextOutlined style={sectionStyles.headerIcon} />
                  <h3 style={sectionStyles.headerTitle}>Service Contract</h3>
                </div>
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Contract ID">
                    <a href={`/app/service-contracts/${productSale.service_contract_id}`} target="_blank" rel="noopener noreferrer">
                      {productSale.service_contract_id}
                    </a>
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color="blue">Linked</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Action">
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => window.open(`/app/service-contracts/${productSale.service_contract_id}`, '_blank')}
                    >
                      View Contract Details
                    </Button>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* Notes Card */}
            {productSale.notes && (
              <Card style={sectionStyles.card} variant="borderless">
                <div style={sectionStyles.header}>
                  <FileTextOutlined style={sectionStyles.headerIcon} />
                  <h3 style={sectionStyles.headerTitle}>Notes</h3>
                </div>
                <div
                  style={{
                    padding: 16,
                    background: '#f9fafb',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: '#374151',
                  }}
                >
                  {productSale.notes}
                </div>
              </Card>
            )}

            {/* Metadata */}
            {productSale.created_at && (
              <div style={{ fontSize: 12, color: '#9ca3af', paddingTop: 8 }}>
                <div>Created: {formatDate(productSale.created_at)}</div>
                {productSale.updated_at && (
                  <div>Last Updated: {formatDate(productSale.updated_at)}</div>
                )}
              </div>
            )}
          </>
        ) : (
          <Empty description="No sale selected" />
        )}
      </div>
      </Drawer>

      {/* Status Transition Modal */}
      <StatusTransitionModal
        open={showStatusTransition}
        sale={productSale}
        onClose={() => setShowStatusTransition(false)}
        onSuccess={() => {
          setShowStatusTransition(false);
          if (onStatusChanged) {
            onStatusChanged();
          }
        }}
      />

      {/* Invoice Generation Modal */}
      {productSale && (
        <InvoiceGenerationModal
          open={showInvoiceGeneration}
          sale={productSale}
          saleItems={saleItems}
          customers={[]}
          products={[]}
          onClose={() => setShowInvoiceGeneration(false)}
          onSuccess={(invoice) => {
            setShowInvoiceGeneration(false);
            setGeneratedInvoice(invoice);
            message.success(`Invoice ${invoice.invoice_number} generated successfully`);
            if (onInvoiceGenerated) {
              onInvoiceGenerated(invoice.invoice_number);
            }
          }}
        />
      )}

      {/* Invoice Email Modal */}
      {productSale && generatedInvoice && (
        <InvoiceEmailModal
          open={showInvoiceEmail}
          invoice={generatedInvoice}
          sale={productSale}
          saleItems={saleItems}
          onClose={() => setShowInvoiceEmail(false)}
          onSuccess={() => {
            message.success('Invoice email sent successfully');
          }}
        />
      )}

      {/* Notification History Modal */}
      {showNotificationHistory && (
        <Modal
          title="Notification History"
          open={showNotificationHistory}
          onCancel={() => setShowNotificationHistory(false)}
          footer={null}
          width={800}
          style={{ top: 20 }}
        >
          <NotificationHistoryPanel sale={productSale} />
        </Modal>
      )}
    </>
  );
};