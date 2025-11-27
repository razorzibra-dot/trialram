/**
 * Purchase Orders Modal
 * Allows creating and managing purchase orders for inventory replenishment
 */

import React, { useState } from 'react';
import { Modal, Table, Button, Space, Form, Input, Select, InputNumber, message, Popconfirm, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Product } from '@/types/masters';
import { useSuppliers } from '@/hooks/useReferenceDataOptions';
import type { Supplier } from '@/types/referenceData.types';

interface PurchaseOrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  supplier_name: string;
  order_date: string;
  expected_date: string;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  items: PurchaseOrderItem[];
  total_amount: number;
}

interface PurchaseOrdersModalProps {
  visible: boolean;
  onClose: () => void;
  lowStockProducts?: Product[];
}

const PurchaseOrdersModal: React.FC<PurchaseOrdersModalProps> = ({
  visible,
  onClose,
  lowStockProducts = [],
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [form] = Form.useForm();

  const { suppliers } = useSuppliers('default-tenant'); // TODO: Get from auth context

  // Mock data for existing orders
  const [orders, setOrders] = useState<PurchaseOrder[]>([
    {
      id: '1',
      order_number: 'PO-2025-001',
      supplier_id: '1',
      supplier_name: 'Tech Supplies Inc',
      order_date: '2025-01-15',
      expected_date: '2025-01-30',
      status: 'ordered',
      items: [],
      total_amount: 2500.00,
    },
  ]);

  const handleCreateOrder = () => {
    setIsCreating(true);
    setSelectedProducts(lowStockProducts.slice(0, 3)); // Pre-select some low stock items
    setOrderItems([]);
    form.resetFields();
  };

  const handleAddProduct = (product: Product) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product]);
      const newItem: PurchaseOrderItem = {
        id: Date.now().toString(),
        product_id: product.id,
        product_name: product.name,
        quantity: Math.max(10, (product.min_stock_level || 0) * 2), // Default reorder quantity
        unit_price: product.cost_price || product.price * 0.8,
        total: 0,
      };
      newItem.total = newItem.quantity * newItem.unit_price;
      setOrderItems([...orderItems, newItem]);
    }
  };

  const handleUpdateItem = (itemId: string, field: keyof PurchaseOrderItem, value: any) => {
    setOrderItems(items =>
      items.map(item => {
        if (item.id === itemId) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unit_price') {
            updated.total = updated.quantity * updated.unit_price;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(items => items.filter(item => item.id !== itemId));
    setSelectedProducts(products => products.filter(p => p.id !== itemId));
  };

  const handleSaveOrder = async () => {
    try {
      const values = await form.validateFields();
      const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);

      const newOrder: PurchaseOrder = {
        id: Date.now().toString(),
        order_number: `PO-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`,
        supplier_id: values.supplier_id,
        supplier_name: suppliers.find(s => s.id === values.supplier_id)?.name || 'Unknown',
        order_date: new Date().toISOString().split('T')[0],
        expected_date: values.expected_date.format('YYYY-MM-DD'),
        status: 'draft',
        items: orderItems,
        total_amount: totalAmount,
      };

      setOrders([...orders, newOrder]);
      message.success(`Purchase order ${newOrder.order_number} created successfully`);
      setIsCreating(false);
      setSelectedProducts([]);
      setOrderItems([]);
      form.resetFields();
    } catch (error) {
      message.error('Failed to create purchase order');
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders(orders => orders.filter(o => o.id !== orderId));
    message.success('Purchase order deleted successfully');
  };

  const columns: ColumnsType<PurchaseOrder> = [
    {
      title: 'Order Number',
      dataIndex: 'order_number',
      key: 'order_number',
      width: 150,
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier_name',
      key: 'supplier_name',
      width: 200,
    },
    {
      title: 'Order Date',
      dataIndex: 'order_date',
      key: 'order_date',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Expected Date',
      dataIndex: 'expected_date',
      key: 'expected_date',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <span style={{
          color: status === 'ordered' ? '#1890ff' :
                 status === 'received' ? '#52c41a' :
                 status === 'cancelled' ? '#ff4d4f' : '#d9d9d9'
        }}>
          {status.toUpperCase()}
        </span>
      ),
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (amount) => `$${amount.toFixed(2)}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => message.info('View order details')}>
            View
          </Button>
          {record.status === 'draft' && (
            <Popconfirm
              title="Delete Order"
              description={`Are you sure you want to delete "${record.order_number}"?`}
              onConfirm={() => handleDeleteOrder(record.id)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button type="link" size="small" danger>
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const itemColumns: ColumnsType<PurchaseOrderItem> = [
    {
      title: 'Product',
      dataIndex: 'product_name',
      key: 'product_name',
      width: 200,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value) => handleUpdateItem(record.id, 'quantity', value)}
          size="small"
        />
      ),
    },
    {
      title: 'Unit Price',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 100,
      render: (_, record) => (
        <InputNumber
          min={0}
          step={0.01}
          value={record.unit_price}
          onChange={(value) => handleUpdateItem(record.id, 'unit_price', value)}
          size="small"
          prefix="$"
        />
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 100,
      render: (_, record) => `$${record.total.toFixed(2)}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(record.id)}
        />
      ),
    },
  ];

  return (
    <Modal
      title="Purchase Orders"
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>
      ]}
    >
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <div>
          <strong>Total Orders:</strong> {orders.length}
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateOrder}>
          Create Purchase Order
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      {/* Create Order Modal */}
      <Modal
        title="Create Purchase Order"
        open={isCreating}
        onOk={handleSaveOrder}
        onCancel={() => setIsCreating(false)}
        width={1000}
        okText="Create Order"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="supplier_id"
            label="Supplier"
            rules={[{ required: true, message: 'Please select a supplier' }]}
          >
            <Select placeholder="Select supplier">
              {suppliers.map(supplier => (
                <Select.Option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="expected_date"
            label="Expected Delivery Date"
            rules={[{ required: true, message: 'Please select expected delivery date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <Space style={{ marginBottom: 8 }}>
              <span><strong>Order Items</strong></span>
              <Button
                type="default"
                size="small"
                onClick={() => {
                  // Show available products to add
                  const availableProducts = lowStockProducts.filter(p =>
                    !selectedProducts.find(sp => sp.id === p.id)
                  );
                  if (availableProducts.length > 0) {
                    handleAddProduct(availableProducts[0]);
                  }
                }}
              >
                Add Low Stock Item
              </Button>
            </Space>

            <Table
              columns={itemColumns}
              dataSource={orderItems}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </div>

          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <strong>Total: ${orderItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}</strong>
          </div>
        </Form>
      </Modal>
    </Modal>
  );
};

export default PurchaseOrdersModal;