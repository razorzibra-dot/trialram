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
} from 'antd';
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
} from '@ant-design/icons';
import { ProductSale, ProductSaleItem } from '@/types/productSales';
import { StatusTransitionModal } from './StatusTransitionModal';
import { InvoiceGenerationModal } from './InvoiceGenerationModal';
import { InvoiceEmailModal } from './InvoiceEmailModal';
import { NotificationHistoryPanel } from './NotificationHistoryPanel';
import { useGenerateContractFromSale } from '../hooks/useGenerateContractFromSale';
import { useProductSalesPermissions } from '../hooks/useProductSalesPermissions';

interface ProductSaleDetailPanelProps {
  visible: boolean;
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
  visible,
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
    autoLoad: visible, // Load permissions when drawer opens
  });

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

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      'draft': 'default',
      'pending': 'processing',
      'confirmed': 'success',
      'delivered': 'success',
      'cancelled': 'error',
      'refunded': 'warning',
    };
    return colorMap[status] || 'default';
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const displayStatus = productSale.status
    .replace('_', ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return (
    <>
      <Drawer
        title="Product Sale Details"
        placement="right"
        width={550}
        onClose={onClose}
        open={visible}
        footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose}>Close</Button>
          
          {/* View Notification History - Always available if viewing details */}
          <Tooltip title="View notification history">
            <Button 
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
                icon={<SwapOutlined />} 
                onClick={() => setShowStatusTransition(true)}
              >
                Change Status
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title="Permission denied: Cannot change status">
              <Button 
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
                icon={<FileTextOutlined />} 
                onClick={handleGenerateContract}
                title="Generate a service contract from this sale"
              >
                Generate Contract
              </Button>
            ) : (
              <Tooltip title="Permission denied: Cannot generate contracts">
                <Button 
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
            <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
              Edit
            </Button>
          ) : (
            <Tooltip title="Permission denied: Cannot edit sales">
              <Button type="primary" icon={<LockOutlined />} disabled>
                Edit
              </Button>
            </Tooltip>
          )}
        </Space>
      }
    >
      {productSale ? (
        <div>
          {/* Key Metrics */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12}>
              <Statistic
                title="Total Value"
                value={formatCurrency(productSale.total_value || 0)}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#1890ff', fontSize: 18 }}
              />
            </Col>
            <Col xs={12}>
              <Statistic
                title="Quantity"
                value={productSale.quantity}
                prefix={<ShoppingCartOutlined />}
                valueStyle={{ fontSize: 18 }}
              />
            </Col>
          </Row>

          <Divider />

          {/* Sale Information */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Sale Information</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Sale Number">
              {productSale.sale_number}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(productSale.status)}>
                {displayStatus}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Sale Date">
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <CalendarOutlined style={{ marginRight: 8 }} />
                {formatDate(productSale.sale_date)}
              </span>
            </Descriptions.Item>
            {productSale.delivery_date && (
              <Descriptions.Item label="Delivery Date">
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarOutlined style={{ marginRight: 8 }} />
                  {formatDate(productSale.delivery_date)}
                </span>
              </Descriptions.Item>
            )}
          </Descriptions>

          <Divider />

          {/* Customer Information */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Customer Information</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Customer Name">
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <UserOutlined style={{ marginRight: 8 }} />
                {productSale.customer_name}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Customer ID">
              {productSale.customer_id}
            </Descriptions.Item>
            {productSale.customer_email && (
              <Descriptions.Item label="Email">
                <a href={`mailto:${productSale.customer_email}`}>
                  <MailOutlined style={{ marginRight: 8 }} />
                  {productSale.customer_email}
                </a>
              </Descriptions.Item>
            )}
          </Descriptions>

          <Divider />

          {/* Product Information */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Product Information</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Product Name">
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <ShoppingCartOutlined style={{ marginRight: 8 }} />
                {productSale.product_name}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Product ID">
              {productSale.product_id}
            </Descriptions.Item>
            <Descriptions.Item label="Quantity">
              {productSale.quantity}
            </Descriptions.Item>
            <Descriptions.Item label="Unit Price">
              {formatCurrency(productSale.unit_price || 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Total Value">
              <span style={{ fontWeight: 600, color: '#1890ff' }}>
                {formatCurrency(productSale.total_value || 0)}
              </span>
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          {/* Warranty Information */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Warranty Information</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Warranty Period">
              {productSale.warranty_period ? `${productSale.warranty_period} months` : 'Not specified'}
            </Descriptions.Item>
            {productSale.warranty_expiry_date && (
              <Descriptions.Item label="Warranty Expiry Date">
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarOutlined style={{ marginRight: 8 }} />
                  {formatDate(productSale.warranty_expiry_date)}
                </span>
              </Descriptions.Item>
            )}
          </Descriptions>

          {/* Additional Information */}
          {productSale.notes && (
            <>
              <Divider />
              <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Notes</h3>
              <div
                style={{
                  padding: 12,
                  background: '#f5f5f5',
                  borderRadius: 4,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {productSale.notes}
              </div>
            </>
          )}

          {/* Service Contract Link */}
          {productSale.service_contract_id && (
            <>
              <Divider />
              <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Service Contract</h3>
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
            </>
          )}

          {/* Metadata */}
          {productSale.created_at && (
            <>
              <Divider />
              <div style={{ fontSize: 12, color: '#999' }}>
                <div>Created: {formatDate(productSale.created_at)}</div>
                {productSale.updated_at && (
                  <div>Last Updated: {formatDate(productSale.updated_at)}</div>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <Empty description="No sale selected" />
      )}
      </Drawer>

      {/* Status Transition Modal */}
      <StatusTransitionModal
        visible={showStatusTransition}
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
          visible={showInvoiceGeneration}
          sale={productSale}
          saleItems={saleItems}
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
          visible={showInvoiceEmail}
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
          visible={showNotificationHistory}
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