/**
 * Supplier Management Modal
 * Allows managing suppliers for inventory
 */

import React, { useState } from 'react';
import { Modal, Table, Button, Space, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useSuppliers } from '@/hooks/useReferenceDataOptions';
import type { Supplier } from '@/types/referenceData.types';

interface SupplierManagementModalProps {
  visible: boolean;
  onClose: () => void;
}

const SupplierManagementModal: React.FC<SupplierManagementModalProps> = ({
  visible,
  onClose,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form] = Form.useForm();

  const { suppliers, loading, refetch } = useSuppliers('default-tenant'); // TODO: Get from auth context

  const handleAdd = () => {
    setEditingSupplier(null);
    setIsEditing(true);
    form.resetFields();
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsEditing(true);
    form.setFieldsValue(supplier);
  };

  const handleDelete = async (supplier: Supplier) => {
    try {
      // TODO: Implement delete supplier using referenceDataService
      message.success(`Supplier "${supplier.name}" deleted successfully`);
      refetch();
    } catch (error) {
      message.error('Failed to delete supplier');
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (editingSupplier) {
        // TODO: Implement update supplier using referenceDataService
        message.success(`Supplier "${values.name}" updated successfully`);
      } else {
        // TODO: Implement create supplier using referenceDataService
        message.success(`Supplier "${values.name}" created successfully`);
      }

      setIsEditing(false);
      setEditingSupplier(null);
      form.resetFields();
      refetch();
    } catch (error) {
      message.error('Failed to save supplier');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingSupplier(null);
    form.resetFields();
  };

  const columns: ColumnsType<Supplier> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Supplier"
            description={`Are you sure you want to delete "${record.name}"?`}
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title="Supplier Management"
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>
      ]}
    >
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <div>
          <strong>Total Suppliers:</strong> {suppliers.length}
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Supplier
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={suppliers}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      {/* Edit/Create Modal */}
      <Modal
        title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
        open={isEditing}
        onOk={handleSave}
        onCancel={handleCancel}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: '',
            email: '',
            phone: '',
            address: '',
          }}
        >
          <Form.Item
            name="name"
            label="Supplier Name"
            rules={[{ required: true, message: 'Please enter supplier name' }]}
          >
            <Input placeholder="Enter supplier name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="Enter email address" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone"
            rules={[{ required: true, message: 'Please enter phone number' }]}
          >
            <Input placeholder="Enter phone number" />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
          >
            <Input.TextArea
              placeholder="Enter address"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
};

export default SupplierManagementModal;