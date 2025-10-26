/**
 * Sales Deal Detail Panel
 * Side drawer for viewing deal details in read-only mode with customer and product integration
 * ✅ Phase 3.1: Link Sales to Customers - Show customer details and navigation
 * ✅ Phase 3.2: Link Sales to Products - Show product details and breakdown
 */

import React, { useState, useEffect } from 'react';
import { Drawer, Descriptions, Button, Space, Divider, Tag, Empty, Progress, Card, Alert, Spin, Tooltip, Table } from 'antd';
import { EditOutlined, LinkOutlined, UserOutlined, ShoppingCartOutlined, FileTextOutlined } from '@ant-design/icons';
import { Deal, Customer } from '@/types/crm';
import { useNavigate } from 'react-router-dom';
import { useService } from '@/modules/core/hooks/useService';
import { CustomerService } from '@/modules/features/customers/services/customerService';
import { SalesService } from '../services/salesService';
import { ConvertToContractModal } from './ConvertToContractModal';

interface SalesDealDetailPanelProps {
  visible: boolean;
  deal: Deal | null;
  onClose: () => void;
  onEdit: () => void;
}

export const SalesDealDetailPanel: React.FC<SalesDealDetailPanelProps> = ({
  visible,
  deal,
  onClose,
  onEdit,
}) => {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [convertModalVisible, setConvertModalVisible] = useState(false);
  const [linkedContracts, setLinkedContracts] = useState<Array<{
    id: string;
    title: string;
    status: string;
    value: number;
    created_at: string;
  }>>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);

  const customerService = useService<CustomerService>('customerService');
  const salesService = useService<SalesService>('salesService');

  // Load customer details when deal changes
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
          console.log('[SalesDealDetailPanel] Customer not available during initialization');
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

  // Phase 3.3: Load linked contracts when deal changes
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

  // Log deal details for debugging
  console.log('[SalesDealDetailPanel] 👀 Displaying deal:', {
    id: deal.id,
    title: deal.title,
    expected_close_date: deal.expected_close_date,
    actual_close_date: deal.actual_close_date,
    status: deal.status,
    source: deal.source,
    campaign: deal.campaign,
    notes: deal.notes,
    description: deal.description,
    allFields: Object.keys(deal),
    allValues: deal,
  });

  const handleNavigateToCustomer = () => {
    if (deal?.customer_id) {
      navigate(`/tenant/customers/${deal.customer_id}`);
      onClose();
    }
  };

  // Phase 3.3: Handle navigate to contract
  const handleNavigateToContract = (contractId: string) => {
    navigate(`/tenant/contracts/${contractId}`);
    onClose();
  };

  // Phase 3.3: Handle successful contract conversion
  const handleConversionSuccess = (contractId: string) => {
    // Reload contracts list
    if (deal?.id && salesService) {
      salesService.getContractsForDeal(deal.id).then(setLinkedContracts).catch(() => {
        setLinkedContracts([]);
      });
    }
    // Navigate to the new contract
    handleNavigateToContract(contractId);
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'lead': return 'default';
      case 'qualified': return 'processing';
      case 'proposal': return 'warning';
      case 'negotiation': return 'warning';
      case 'closed_won': return 'green';
      case 'closed_lost': return 'red';
      default: return 'default';
    }
  };

  const getStageProgress = (stage: string) => {
    const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won'];
    const index = stages.indexOf(stage);
    return index >= 0 ? ((index + 1) / stages.length) * 100 : 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <Drawer
        title="Deal Details"
        placement="right"
        width={550}
        onClose={onClose}
        open={visible}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={onClose}>Close</Button>
            {deal?.stage === 'closed_won' && (
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
      {deal ? (
        <div>
          {/* Basic Information */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Deal Information</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Deal Title">
              {deal.title}
            </Descriptions.Item>
            <Descriptions.Item label="Deal Value">
              {formatCurrency(deal.value || deal.amount || 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Stage">
              <Tag color={getStageColor(deal.stage)}>
                {deal.stage?.replace('_', ' ').toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={deal.status === 'won' ? 'green' : deal.status === 'lost' ? 'red' : deal.status === 'open' ? 'blue' : 'default'}>
                {deal.status?.toUpperCase() || 'OPEN'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Probability">
              {deal.probability || 50}%
            </Descriptions.Item>
            <Descriptions.Item label="Expected Close Date">
              {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : '-'}
            </Descriptions.Item>
            {deal.actual_close_date && (
              <Descriptions.Item label="Actual Close Date">
                {new Date(deal.actual_close_date).toLocaleDateString()}
              </Descriptions.Item>
            )}
            {deal.source && (
              <Descriptions.Item label="Source">
                {deal.source}
              </Descriptions.Item>
            )}
            {deal.campaign && (
              <Descriptions.Item label="Campaign">
                {deal.campaign}
              </Descriptions.Item>
            )}
            {deal.notes && (
              <Descriptions.Item label="Notes">
                {deal.notes}
              </Descriptions.Item>
            )}
            {deal.description && (
              <Descriptions.Item label="Description">
                {deal.description}
              </Descriptions.Item>
            )}
          </Descriptions>

          <Divider />

          {/* Deal Progress */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Pipeline Progress</h3>
          <Progress
            percent={getStageProgress(deal.stage)}
            status="active"
            format={() => deal.stage?.replace('_', ' ').toUpperCase()}
          />

          <Divider />

          {/* Customer Information - Phase 3.1 */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>
            <UserOutlined style={{ marginRight: 8 }} />
            Customer Information
          </h3>

          {loadingCustomer ? (
            <Spin size="small" />
          ) : customer ? (
            <>
              <Card size="small" style={{ marginBottom: 16 }}>
                <div style={{ lineHeight: 2 }}>
                  <div>
                    <strong>Company:</strong> {customer.company_name}
                  </div>
                  <div>
                    <strong>Contact:</strong> {customer.contact_name}
                  </div>
                  <div>
                    <strong>Email:</strong> {customer.email}
                  </div>
                  <div>
                    <strong>Phone:</strong> {customer.phone}
                  </div>
                  <div>
                    <strong>Industry:</strong> {customer.industry}
                  </div>
                  <div>
                    <strong>Company Size:</strong> {customer.size}
                  </div>
                  <div>
                    <strong>Status:</strong>{' '}
                    <Tag color={customer.status === 'active' ? 'green' : 'red'}>
                      {customer.status?.toUpperCase()}
                    </Tag>
                  </div>
                </div>
              </Card>

              <Alert
                message="View Full Customer Profile"
                description="Click the button to view complete customer information and related records."
                type="info"
                icon={<LinkOutlined />}
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Button
                block
                type="dashed"
                onClick={handleNavigateToCustomer}
                icon={<LinkOutlined />}
                style={{ marginBottom: 16 }}
              >
                Go to Customer Profile
              </Button>
            </>
          ) : (
            <Alert
              message="No Customer Linked"
              description="This deal is not linked to a customer. Edit the deal to add a customer relationship."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Divider />

          {/* Products/Services Section - Phase 3.2 */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>
            <ShoppingCartOutlined style={{ marginRight: 8 }} />
            Products/Services
          </h3>

          {deal.items && deal.items.length > 0 ? (
            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '12px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}>
                      <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Product</th>
                      <th style={{ padding: '8px', textAlign: 'center', width: '50px', fontWeight: 600 }}>Qty</th>
                      <th style={{ padding: '8px', textAlign: 'right', width: '70px', fontWeight: 600 }}>Price</th>
                      <th style={{ padding: '8px', textAlign: 'right', width: '70px', fontWeight: 600 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deal.items.map((item, index) => (
                      <tr key={item.id || index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '8px' }}>
                          <div style={{ fontWeight: 500, marginBottom: 4 }}>{item.product_name}</div>
                          {item.product_description && (
                            <div style={{ fontSize: '11px', color: '#999' }}>{item.product_description}</div>
                          )}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          ${item.unit_price.toFixed(2)}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
                          ${item.line_total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: '#fafafa', fontWeight: 600, borderTop: '2px solid #f0f0f0' }}>
                      <td colSpan={3} style={{ padding: '8px', textAlign: 'right' }}>
                        Total:
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        ${deal.items.reduce((sum, item) => sum + item.line_total, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Alert
              message="No Products Added"
              description="This deal doesn't have any products/services linked. Edit the deal to add products."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Divider />

          {/* Linked Contracts Section - Phase 3.3 */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>
            <FileTextOutlined style={{ marginRight: 8 }} />
            Linked Contracts
          </h3>

          {loadingContracts ? (
            <Spin size="small" />
          ) : linkedContracts.length > 0 ? (
            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '12px' }}>
                {linkedContracts.map((contract) => (
                  <div
                    key={contract.id}
                    style={{
                      padding: 12,
                      marginBottom: 8,
                      backgroundColor: '#fafafa',
                      borderRadius: 4,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{contract.title}</div>
                      <div style={{ fontSize: '11px', color: '#999', marginTop: 4 }}>
                        <span>Status: <Tag color={contract.status === 'active' ? 'green' : 'blue'}>{contract.status}</Tag></span>
                        <span style={{ marginLeft: 12 }}>Value: ${contract.value.toFixed(2)}</span>
                      </div>
                    </div>
                    <Button
                      type="text"
                      size="small"
                      onClick={() => handleNavigateToContract(contract.id)}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Alert
              message="No Contracts Linked"
              description={
                deal?.stage === 'closed_won'
                  ? 'This deal can be converted to a contract. Click the "Convert to Contract" button above.'
                  : 'Convert this deal to a contract when it reaches the closed-won stage.'
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Divider />

          {/* Deal Details */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Sales Details</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Sales Owner">
              {deal.assigned_to_name || deal.assigned_to || 'Unassigned'}
            </Descriptions.Item>
            <Descriptions.Item label="Expected Close Date">
              {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Probability">
              {deal.probability}%
            </Descriptions.Item>
            <Descriptions.Item label="Created Date">
              {deal.created_at ? new Date(deal.created_at).toLocaleDateString() : '-'}
            </Descriptions.Item>
          </Descriptions>

          {deal.notes && (
            <>
              <Divider />
              <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Notes</h3>
              <div style={{
                padding: 12,
                backgroundColor: '#fafafa',
                borderRadius: 4,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {deal.notes}
              </div>
            </>
          )}
        </div>
      ) : (
        <Empty description="No deal selected" />
      )}
      </Drawer>

      {/* Phase 3.3: Convert to Contract Modal */}
      <ConvertToContractModal
        visible={convertModalVisible}
        deal={deal}
        onClose={() => setConvertModalVisible(false)}
        onSuccess={handleConversionSuccess}
      />
    </>
  );
};