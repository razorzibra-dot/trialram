/**
 * Create Product Sales Modal
 * Phase 3.3: Workflow modal for creating product sales entries from deal items
 * Handles bulk creation of product sales when a deal is closed
 */

import React, { useState, useMemo } from 'react';
import {
  Modal,
  Table,
  Button,
  Space,
  message,
  Alert,
  Spin,
  Tag,
  Checkbox,
  Row,
  Col,
  Card,
  Divider,
} from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Deal, SaleItem } from '@/types/crm';
import { useService } from '@/modules/core/hooks/useService';
import { SalesService } from '../services/salesService';
import { productSaleService } from '@/services';

interface CreateProductSalesModalProps {
  visible: boolean;
  deal: Deal | null;
  onClose: () => void;
  onSuccess: (createdCount: number) => void;
}

export const CreateProductSalesModal: React.FC<CreateProductSalesModalProps> = ({
  visible,
  deal,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const salesService = useService<SalesService>('salesService');

  // Get items from deal
  const items = useMemo(() => {
    return deal?.items || [];
  }, [deal]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalValue = items.reduce((sum, item) => sum + (item.line_total || 0), 0);
    const selectedCount = selectedItems.size;

    return {
      totalItems,
      totalQuantity,
      totalValue,
      selectedCount,
    };
  }, [items, selectedItems]);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedItems(new Set(items.map((_, idx) => idx.toString())));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (index: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedItems(newSelected);
    setSelectAll(newSelected.size === items.length);
  };

  const handleCreateProductSales = async () => {
    try {
      if (selectedItems.size === 0) {
        message.warning('Please select at least one item');
        return;
      }

      if (!deal) {
        message.error('Deal information not available');
        return;
      }

      setLoading(true);

      const itemsToCreate = items.filter((_, idx) => selectedItems.has(idx.toString()));

      console.log('📦 Creating product sales for deal:', {
        dealId: deal.id,
        dealTitle: deal.title,
        customerId: deal.customer_id,
        itemCount: itemsToCreate.length,
      });

      // Create product sales entries
      let createdCount = 0;
      const errors: string[] = [];

      for (const item of itemsToCreate) {
        try {
          const productSaleData = {
            deal_id: deal.id,
            deal_title: deal.title,
            product_id: item.product_id,
            product_name: item.product_name,
            product_description: item.product_description || '',
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            discount: item.discount || 0,
            tax: item.tax || 0,
            total_price: item.line_total || 0,
            customer_id: deal.customer_id,
            sale_date: new Date().toISOString().split('T')[0],
            assigned_to: deal.assigned_to,
            notes: `Created from deal: ${deal.title}`,
          };

          // Call product sale service to create entry
          await productSaleService.createProductSale(productSaleData);
          createdCount++;
          console.log(`✅ Created product sale for: ${item.product_name}`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${item.product_name}: ${errorMsg}`);
          console.error(`❌ Failed to create product sale for ${item.product_name}:`, error);
        }
      }

      if (createdCount > 0) {
        message.success(
          `${createdCount} product sale${createdCount !== 1 ? 's' : ''} created successfully`
        );
        console.log('✅ Product sales creation completed:', { createdCount, total: itemsToCreate.length });
        onSuccess(createdCount);
      }

      if (errors.length > 0) {
        message.warning(
          `${errors.length} item${errors.length !== 1 ? 's' : ''} failed to create:\n${errors.join('\n')}`
        );
      }

      // Close modal after successful creation
      if (createdCount > 0) {
        onClose();
      }
    } catch (error) {
      console.error('❌ Error creating product sales:', error);
      message.error(
        error instanceof Error ? error.message : 'Failed to create product sales entries'
      );
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: (
        <Checkbox
          checked={selectAll}
          indeterminate={
            selectedItems.size > 0 && selectedItems.size < items.length
          }
          onChange={(e) => handleSelectAll(e.target.checked)}
        />
      ),
      key: 'select',
      width: 50,
      render: (_: any, __: any, index: number) => (
        <Checkbox
          checked={selectedItems.has(index.toString())}
          onChange={(e) => handleSelectItem(index.toString(), e.target.checked)}
        />
      ),
    },
    {
      title: 'Product Name',
      dataIndex: 'product_name',
      key: 'product_name',
      width: 200,
      render: (text: string) => (
        <span style={{ fontWeight: 500 }}>{text}</span>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'center' as const,
      render: (qty: number) => <strong>{qty}</strong>,
    },
    {
      title: 'Unit Price',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 100,
      align: 'right' as const,
      render: (price: number) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Discount',
      dataIndex: 'discount',
      key: 'discount',
      width: 80,
      align: 'right' as const,
      render: (discount: number) => discount > 0 ? `-$${discount.toFixed(2)}` : '-',
    },
    {
      title: 'Line Total',
      dataIndex: 'line_total',
      key: 'line_total',
      width: 100,
      align: 'right' as const,
      render: (total: number) => (
        <strong style={{ color: '#1890ff' }}>
          ${total.toFixed(2)}
        </strong>
      ),
    },
  ];

  if (!deal || items.length === 0) {
    return (
      <Modal
        title="Create Product Sales Entries"
        open={visible}
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            Close
          </Button>,
        ]}
      >
        <Alert
          message="No products available"
          description="This deal does not have any product items to create sales entries from."
          type="info"
          showIcon
        />
      </Modal>
    );
  }

  return (
    <Modal
      title="Create Product Sales Entries"
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleCreateProductSales}
          disabled={selectedItems.size === 0}
        >
          Create {selectedItems.size > 0 ? `(${selectedItems.size} selected)` : ''}
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        {/* Deal Information */}
        {deal && (
          <>
            <Alert
              message="Creating Product Sales from Deal"
              description={`Deal: ${deal.title} | Customer ID: ${deal.customer_id} | Stage: ${deal.stage}`}
              type="info"
              icon={<CheckCircleOutlined />}
              showIcon
              style={{ marginBottom: 24 }}
            />
          </>
        )}

        {/* Summary Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card size="small" bordered={false} style={{ backgroundColor: '#f5f5f5' }}>
              <div style={{ fontSize: '12px', color: '#666' }}>Total Items</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: 8 }}>
                {summary.totalItems}
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" bordered={false} style={{ backgroundColor: '#f5f5f5' }}>
              <div style={{ fontSize: '12px', color: '#666' }}>Total Quantity</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: 8 }}>
                {summary.totalQuantity}
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" bordered={false} style={{ backgroundColor: '#e6f7ff' }}>
              <div style={{ fontSize: '12px', color: '#0050b3' }}>Total Value</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: 8, color: '#0050b3' }}>
                ${summary.totalValue.toFixed(2)}
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card 
              size="small" 
              bordered={false} 
              style={{ 
                backgroundColor: summary.selectedCount > 0 ? '#f6ffed' : '#f5f5f5'
              }}
            >
              <div style={{ fontSize: '12px', color: '#666' }}>Selected</div>
              <div 
                style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  marginTop: 8,
                  color: summary.selectedCount > 0 ? '#52c41a' : '#999'
                }}
              >
                {summary.selectedCount} / {summary.totalItems}
              </div>
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* Items Table */}
        <h4 style={{ marginBottom: 16 }}>Select Products to Create Sales Entries</h4>
        <Table
          columns={columns}
          dataSource={items.map((item, idx) => ({
            ...item,
            key: idx.toString(),
          }))}
          pagination={false}
          size="small"
          bordered
          scroll={{ x: true }}
        />

        <Divider />

        {/* Info Message */}
        <Alert
          message="Product Sales will be created for selected items with:"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>Quantity, Unit Price, and Discount values from the deal</li>
              <li>Customer information linked from the deal</li>
              <li>Today's date as the sale date</li>
              <li>Deal title and reference in notes</li>
            </ul>
          }
          type="warning"
          icon={<ExclamationCircleOutlined />}
          showIcon
          style={{ marginTop: 16 }}
        />
      </Spin>
    </Modal>
  );
};