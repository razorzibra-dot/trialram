/**
 * Products Page - Enterprise Layout Version
 * Main page for product master data management with consistent design
 */

import React, { useState } from 'react';
import { 
  Button, 
  Card, 
  Row, 
  Col, 
  Table, 
  Tag, 
  Space, 
  Input, 
  Select, 
  Popconfirm,
  Alert,
  Empty,
  Modal,
  Form,
  InputNumber,
  message,
  Upload as AntUpload
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PackageOutlined,
  DollarOutlined,
  WarningOutlined,
  RiseOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { PageHeader } from '@/modules/shared/components/PageHeader';
import { StatCard } from '@/modules/shared/components/StatCard';
import { useProductStats, useImportProducts, useProducts, useDeleteProduct } from '../hooks/useProducts';
import { useAuth } from '@/contexts/AuthContext';
import { Product, ProductFilters } from '@/types/masters';

const { Search } = Input;
const { Option } = Select;

export const ProductsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    pageSize: 20,
  });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');

  // Queries and mutations
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useProductStats();
  const { data: productsData, isLoading: productsLoading, refetch: refetchProducts } = useProducts(filters);
  const importProducts = useImportProducts();
  const deleteProduct = useDeleteProduct();

  const handleRefresh = () => {
    refetchStats();
    refetchProducts();
    message.success('Data refreshed successfully');
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setModalMode('create');
    setIsModalVisible(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setModalMode('edit');
    setIsModalVisible(true);
  };

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setModalMode('view');
    setIsModalVisible(true);
  };

  const handleDelete = async (product: Product) => {
    try {
      await deleteProduct.mutateAsync(product.id);
      message.success(`Product "${product.name}" deleted successfully`);
      refetchProducts();
      refetchStats();
    } catch (error) {
      message.error('Failed to delete product');
    }
  };

  const handleFileImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      importProducts.mutate(csv, {
        onSuccess: () => {
          message.success('Products imported successfully');
          refetchProducts();
          refetchStats();
        },
        onError: () => {
          message.error('Failed to import products');
        }
      });
    };
    reader.readAsText(file);
    return false; // Prevent default upload behavior
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setFilters({ ...filters, search: value, page: 1 });
  };

  const handleStatusFilterChange = (value: string): void => {
    setStatusFilter(value);
    const statusValue: 'active' | 'inactive' | 'discontinued' | undefined = value === 'all' ? undefined : (value as 'active' | 'inactive' | 'discontinued');
    setFilters({ 
      ...filters, 
      status: statusValue,
      page: 1 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'default';
      case 'discontinued':
        return 'red';
      default:
        return 'default';
    }
  };

  const getStockStatus = (product: Product) => {
    const stock = product.stock_quantity || 0;
    const reorderLevel = product.reorder_level || 0;
    
    if (stock === 0) {
      return { label: 'Out of Stock', color: 'red' };
    } else if (stock <= reorderLevel) {
      return { label: 'Low Stock', color: 'orange' };
    } else {
      return { label: 'In Stock', color: 'green' };
    }
  };

  // Table columns
  const columns: ColumnsType<Product> = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 250,
      render: (text, record) => (
        <Space>
          <div style={{ 
            width: 32, 
            height: 32, 
            borderRadius: '50%', 
            backgroundColor: '#e6f7ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <PackageOutlined style={{ color: '#1890ff' }} />
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>SKU: {record.sku}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price) => formatCurrency(price),
    },
    {
      title: 'Stock',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      width: 100,
      render: (stock, record) => {
        const stockStatus = getStockStatus(record);
        return (
          <Space direction="vertical" size={0}>
            <span>{stock || 0}</span>
            <Tag color={stockStatus.color} style={{ fontSize: 11 }}>
              {stockStatus.label}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Brand',
      dataIndex: 'brand',
      key: 'brand',
      width: 120,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            View
          </Button>
          {hasPermission('products:update') && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>
          )}
          {hasPermission('products:delete') && (
            <Popconfirm
              title="Delete Product"
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
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Products"
        description="Manage your product catalog and inventory"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Masters', path: '/masters' },
          { label: 'Products' },
        ]}
        extra={[
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>,
          hasPermission('products:create') && (
            <AntUpload
              key="import"
              accept=".csv"
              beforeUpload={handleFileImport}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} loading={importProducts.isPending}>
                Import CSV
              </Button>
            </AntUpload>
          ),
          hasPermission('products:create') && (
            <Button
              key="create"
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Add Product
            </Button>
          ),
        ].filter(Boolean)}
      />

      <div style={{ padding: 24 }}>
        {/* Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Products"
              value={stats?.total || 0}
              icon={<PackageOutlined />}
              color="primary"
              loading={statsLoading}
              suffix="products"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Active Products"
              value={stats?.activeProducts || 0}
              icon={<RiseOutlined />}
              color="success"
              loading={statsLoading}
              suffix="available"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Low Stock"
              value={stats?.lowStockProducts || 0}
              icon={<WarningOutlined />}
              color="warning"
              loading={statsLoading}
              suffix="need restocking"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Value"
              value={formatCurrency(stats?.totalValue || 0)}
              icon={<DollarOutlined />}
              color="info"
              loading={statsLoading}
              prefix=""
              suffix=""
            />
          </Col>
        </Row>

        {/* Stock Alerts */}
        {((stats?.lowStockProducts || 0) > 0 || (stats?.outOfStockProducts || 0) > 0) && (
          <Alert
            message="Stock Alerts"
            description={
              <Space direction="vertical" style={{ width: '100%' }}>
                {(stats?.outOfStockProducts || 0) > 0 && (
                  <div>
                    <WarningOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                    <strong>Out of Stock:</strong> {stats?.outOfStockProducts} products need immediate restocking
                  </div>
                )}
                {(stats?.lowStockProducts || 0) > 0 && (
                  <div>
                    <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
                    <strong>Low Stock:</strong> {stats?.lowStockProducts} products below reorder level
                  </div>
                )}
              </Space>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {/* Products Table */}
        <Card>
          {/* Search and Filters */}
          <Space style={{ marginBottom: 16, width: '100%' }} direction="vertical">
            <Space.Compact style={{ width: '100%' }}>
              <Search
                placeholder="Search products by name, SKU, or category..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                style={{ flex: 1 }}
              />
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                style={{ width: 150 }}
                size="large"
              >
                <Option value="all">All Status</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="discontinued">Discontinued</Option>
              </Select>
            </Space.Compact>
          </Space>

          <Table
            columns={columns}
            dataSource={productsData?.data || []}
            rowKey="id"
            loading={productsLoading}
            pagination={{
              current: filters.page,
              pageSize: filters.pageSize,
              total: productsData?.total || 0,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} products`,
              onChange: (page, pageSize) => {
                setFilters({ ...filters, page, pageSize });
              },
            }}
            scroll={{ x: 1200 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No products found"
                >
                  {hasPermission('products:create') && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                      Add Your First Product
                    </Button>
                  )}
                </Empty>
              ),
            }}
          />
        </Card>
      </div>

      {/* Product Modal (Create/Edit/View) */}
      <Modal
        title={
          modalMode === 'create' 
            ? 'Add New Product' 
            : modalMode === 'edit' 
            ? 'Edit Product' 
            : 'Product Details'
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={modalMode === 'view' ? [
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>
        ] : null}
        width={800}
      >
        {/* TODO: Implement product form */}
        <p>Product form will be implemented here</p>
        {selectedProduct && (
          <div>
            <p><strong>Name:</strong> {selectedProduct.name}</p>
            <p><strong>SKU:</strong> {selectedProduct.sku}</p>
            <p><strong>Price:</strong> {formatCurrency(selectedProduct.price)}</p>
            <p><strong>Stock:</strong> {selectedProduct.stock_quantity || 0}</p>
            <p><strong>Status:</strong> {selectedProduct.status}</p>
          </div>
        )}
      </Modal>
    </>
  );
};
