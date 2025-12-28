/**
 * Product List Page
 * Main page for displaying and managing products
 */

import React, { useState } from 'react';
import { Row, Col, Card, Button, Table, Input, Select, Space, Tag, Popconfirm, Empty, Layout, Divider, List, Typography, Modal, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined, ClearOutlined, FilterOutlined, BranchesOutlined } from '@ant-design/icons';
import { PageHeader, StatCard } from '@/components/common';
import { Product, ProductFormData } from '@/types/masters';
import { useProducts, useDeleteProduct, useCreateProduct, useUpdateProduct } from '@/modules/features/masters/hooks/useProducts';
import { useAuth } from '@/contexts/AuthContext';
import { useReferenceDataByCategory } from '@/hooks/useReferenceDataOptions';
import { useCurrentTenantId } from '@/hooks/usePermission';
import ProductComparisonModal from '../ProductComparisonModal';
import SupplierManagementModal from '../SupplierManagementModal';
import PurchaseOrdersModal from '../PurchaseOrdersModal';
import ProductFormModal from '../forms/ProductFormModal';
import ProductVariantsModal from '../ProductVariantsModal';
import type { ProductCategory } from '@/types/referenceData.types';

const { Search } = Input;
const { Option } = Select;

const ProductListPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [filters, setFilters] = useState<any>({
    page: 1,
    limit: 10,
  });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [comparisonModalVisible, setComparisonModalVisible] = useState(false);
  const [productsForComparison, setProductsForComparison] = useState<Product[]>([]);
  const [supplierModalVisible, setSupplierModalVisible] = useState(false);
  const [purchaseOrdersModalVisible, setPurchaseOrdersModalVisible] = useState(false);
  const [productFormModalVisible, setProductFormModalVisible] = useState(false);
  const [variantsModalVisible, setVariantsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Queries
  const { data: productsData, isLoading: productsLoading, refetch } = useProducts(filters);
  const deleteProduct = useDeleteProduct();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const tenantId = useCurrentTenantId();
  const { items: categoryItems, loading: categoriesLoading } = useReferenceDataByCategory(tenantId, 'product_category');
  
  // Convert reference data items to ProductCategory format
  const categories = categoryItems.map(item => ({
    id: item.id,
    tenantId: item.tenantId,
    name: item.label,
    description: item.description,
    isActive: item.isActive,
    sortOrder: item.sortOrder,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    createdBy: item.createdBy,
  } as ProductCategory));

  const products = productsData?.data || [];
  const pagination = productsData || { total: 0, page: 1, pageSize: 10, totalPages: 0 };

  const handleRefresh = () => {
    refetch();
    message.success('Data refreshed successfully');
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setProductFormModalVisible(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setProductFormModalVisible(true);
  };

  const handleViewVariants = (product: Product) => {
    setSelectedProduct(product);
    setVariantsModalVisible(true);
  };

  const handleCreateVariant = (parentProduct: Product) => {
    setSelectedProduct({
      ...parentProduct,
      id: '',
      name: `${parentProduct.name} - Variant`,
      sku: `${parentProduct.sku}-VAR`,
      parent_id: parentProduct.id,
      is_variant: true,
      variant_group_id: parentProduct.variant_group_id || `${parentProduct.id}-group`,
    } as Product);
    setVariantsModalVisible(false);
    setProductFormModalVisible(true);
  };

  const handleProductFormSubmit = async (data: ProductFormData) => {
    if (selectedProduct?.id) {
      await updateProduct.mutateAsync({ id: selectedProduct.id, data });
    } else {
      await createProduct.mutateAsync(data);
    }
    setProductFormModalVisible(false);
    setSelectedProduct(null);
    refetch();
  };

  const handleView = (product: Product) => {
    // View logic handled in drawer
  };

  const handleDelete = async (product: Product) => {
    await deleteProduct.mutateAsync(product.id);
    refetch();
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setFilters({ ...filters, search: value, page: 1 });
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    const statusValue = value === 'all' ? undefined : value;
    setFilters({ ...filters, status: statusValue, page: 1 });
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    setFilters({ ...filters, type: value || undefined, page: 1 });
  };

  const handleClearFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setTypeFilter('');
    setCategoryFilter('');
    setSelectedProducts([]);
    setFilters({ page: 1, limit: 10 });
  };

  const handleProductSelection = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleCompare = () => {
    if (selectedProducts.length < 2) {
      message.warning('Please select at least 2 products to compare');
      return;
    }
    if (selectedProducts.length > 4) {
      message.warning('You can compare up to 4 products at a time');
      return;
    }

    // Find the selected products from the current products list
    const productsToCompare = products.filter(product =>
      selectedProducts.includes(product.id)
    );

    setProductsForComparison(productsToCompare);
    setComparisonModalVisible(true);
  };

  const handleCloseComparisonModal = () => {
    setComparisonModalVisible(false);
    setProductsForComparison([]);
  };

  const handleRemoveFromComparison = (productId: string) => {
    setProductsForComparison(prev => prev.filter(p => p.id !== productId));
    setSelectedProducts(prev => prev.filter(id => id !== productId));
  };

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
    setFilters({ ...filters, category: value || undefined, page: 1 });
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCategoryFilter(categoryId);
    setFilters({ ...filters, category: categoryId || undefined, page: 1 });
  };

  const handleClearCategoryFilter = () => {
    setSelectedCategory('');
    setCategoryFilter('');
    setFilters({ ...filters, category: undefined, page: 1 });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'default';
      case 'discontinued': return 'red';
      default: return 'default';
    }
  };

  // Table columns
  const columns: ColumnsType<Product> = [
    {
      title: (
        <input
          type="checkbox"
          checked={selectedProducts.length === products.length && products.length > 0}
          onChange={(e) => handleSelectAll(e.target.checked)}
        />
      ),
      key: 'select',
      width: 50,
      render: (_, record) => (
        <input
          type="checkbox"
          checked={selectedProducts.includes(record.id)}
          onChange={(e) => handleProductSelection(record.id, e.target.checked)}
        />
      ),
    },
    {
      title: 'Product',
      key: 'name',
      dataIndex: 'name',
      width: 250,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>SKU: {record.sku}</div>
        </div>
      ),
    },
    {
      title: 'Category',
      key: 'category',
      dataIndex: 'category',
      width: 120,
      render: (category) => (
        <Tag color="purple">{category || 'Not specified'}</Tag>
      ),
    },
    {
      title: 'Type',
      key: 'type',
      dataIndex: 'type',
      width: 120,
      render: (type) => (
        <Tag color="blue">{type || 'Not specified'}</Tag>
      ),
    },
    {
      title: 'Price',
      key: 'price',
      dataIndex: 'price',
      width: 100,
      render: (price, record) => (
        <span>${price} {record.currency}</span>
      ),
    },
    {
      title: 'Stock',
      key: 'stock_quantity',
      dataIndex: 'stock_quantity',
      width: 100,
      render: (stock, record) => (
        <span style={{
          color: stock <= (record.min_stock_level || 0) ? 'red' : 'green'
        }}>
          {stock}
        </span>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      dataIndex: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Created',
      key: 'created_at',
      dataIndex: 'created_at',
      width: 120,
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 200,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Variants">
            <Button
              type="text"
              size="small"
              icon={<BranchesOutlined />}
              onClick={() => handleViewVariants(record)}
            />
          </Tooltip>
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          {hasPermission('crm:product:record:update') && (
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {hasPermission('crm:product:record:delete') && (
            <Popconfirm
              title="Delete Product"
              description={`Are you sure you want to delete "${record.name}"?`}
              onConfirm={() => handleDelete(record)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Delete">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider
        collapsible
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        width={280}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
        }}
      >
        <div style={{ padding: 16 }}>
          <Typography.Title level={5} style={{ marginBottom: 16 }}>
            <FilterOutlined style={{ marginRight: 8 }} />
            {!sidebarCollapsed && 'Browse Categories'}
          </Typography.Title>
          {!sidebarCollapsed && (
            <>
              <Button
                type={selectedCategory === '' ? 'primary' : 'default'}
                block
                style={{ marginBottom: 8 }}
                onClick={handleClearCategoryFilter}
              >
                All Categories
              </Button>
              <List
                size="small"
                dataSource={categories as ProductCategory[]}
                loading={categoriesLoading}
                renderItem={(category: ProductCategory) => (
                  <List.Item
                    style={{
                      padding: '8px 0',
                      cursor: 'pointer',
                      backgroundColor: selectedCategory === category.id ? '#f6ffed' : 'transparent',
                      borderRadius: 4,
                    }}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{category.name}</div>
                      {category.description && (
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                          {category.description}
                        </div>
                      )}
                    </div>
                  </List.Item>
                )}
              />
            </>
          )}
        </div>
      </Layout.Sider>

      <Layout.Content>
        <PageHeader
          title="Products"
          description="Manage your product catalog and inventory"
          breadcrumb={{
            items: [
              { title: 'Dashboard', path: '/tenant/dashboard' },
              { title: 'Products' }
            ]
          }}
          extra={
            <>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                Refresh
              </Button>
              {selectedProducts.length > 0 && (
                <Button
                  type="default"
                  icon={<span>⚖️</span>}
                  onClick={handleCompare}
                  disabled={selectedProducts.length < 2}
                >
                  Compare ({selectedProducts.length})
                </Button>
              )}
              {hasPermission('crm:product:record:create') && (
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  Add Product
                </Button>
              )}
            </>
          }
        />

        <div style={{ padding: 24 }}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Products"
              value={pagination.total || 0}
              description="All products"
              icon={() => <span>📦</span>}
              color="primary"
              loading={productsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Active Products"
              value={products.filter(p => p.status === 'active').length}
              description="Currently available"
              icon={() => <span>✅</span>}
              color="success"
              loading={productsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Low Stock"
              value={products.filter(p => p.stock_quantity <= (p.min_stock_level || 0)).length}
              description="Need attention"
              icon={() => <span>⚠️</span>}
              color="warning"
              loading={productsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Value"
              value={`$${products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0).toLocaleString()}`}
              description="Inventory value"
              icon={() => <span>💰</span>}
              color="info"
              loading={productsLoading}
            />
          </Col>
        </Row>

        {/* Products Table */}
        <Card
          style={{
            borderRadius: 8,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Search and Filters */}
          <Space style={{ marginBottom: 16, width: '100%' }} direction="vertical">
            <Space.Compact style={{ width: '100%' }}>
              <Search
                placeholder="Search products by name or SKU..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                style={{ flex: 1 }}
              />
              <Button
                icon={<ClearOutlined />}
                onClick={handleClearFilters}
                size="large"
                title="Clear all filters"
              >
                Clear
              </Button>
            </Space.Compact>
            <Space style={{ width: '100%' }} wrap>
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                style={{ width: 130 }}
                placeholder="Status"
                size="large"
              >
                <Option value="all">All Status</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="discontinued">Discontinued</Option>
              </Select>

              <Select
                value={typeFilter}
                onChange={handleTypeFilterChange}
                style={{ width: 140 }}
                placeholder="Type"
                allowClear
                size="large"
              >
                <Option value="Hardware">Hardware</Option>
                <Option value="Software">Software</Option>
                <Option value="Service">Service</Option>
              </Select>

              <Select
                value={categoryFilter}
                onChange={handleCategoryFilterChange}
                style={{ width: 150 }}
                placeholder="Category"
                allowClear
                size="large"
              >
                <Option value="Electronics">Electronics</Option>
                <Option value="Software">Software</Option>
                <Option value="Services">Services</Option>
                <Option value="Hardware">Hardware</Option>
              </Select>
            </Space>
          </Space>

          {/* Table */}
          <Table
            columns={columns}
            dataSource={products}
            loading={productsLoading}
            pagination={{
              current: pagination.page || 1,
              pageSize: pagination.pageSize || 10,
              total: pagination.total || 0,
              showSizeChanger: true,
              showQuickJumper: true,
              onChange: (page, pageSize) => {
                setFilters({ ...filters, page, limit: pageSize });
              },
            }}
            rowKey="id"
            locale={{
              emptyText: <Empty description="No products found" style={{ marginTop: 48, marginBottom: 48 }} />,
            }}
          />
        </Card>

        {/* Inventory Management Section */}
        <Card
          title="Inventory Management"
          style={{
            borderRadius: 8,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
            marginTop: 24,
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                  {products.filter(p => p.stock_quantity <= (p.min_stock_level || 0)).length}
                </div>
                <div style={{ color: '#666' }}>Low Stock Items</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                  {products.reduce((sum, p) => sum + p.stock_quantity, 0)}
                </div>
                <div style={{ color: '#666' }}>Total Stock</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                  {products.filter(p => p.stock_quantity <= (p.min_stock_level || 0) * 1.5).length}
                </div>
                <div style={{ color: '#666' }}>Reorder Alerts</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
                  ${products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0).toLocaleString()}
                </div>
                <div style={{ color: '#666' }}>Inventory Value</div>
              </Card>
            </Col>
          </Row>

          <Divider />

          <Space style={{ width: '100%', justifyContent: 'center' }} wrap>
            <Button
              type="default"
              icon={<span>🏢</span>}
              onClick={() => setSupplierModalVisible(true)}
            >
              Manage Suppliers
            </Button>
            <Button
              type="default"
              icon={<span>📦</span>}
              onClick={() => setPurchaseOrdersModalVisible(true)}
            >
              Create Purchase Order
            </Button>
            <Button
              type="default"
              icon={<span>📊</span>}
              onClick={() => message.info('Inventory reports coming soon')}
            >
              Inventory Reports
            </Button>
            <Button
              type="default"
              icon={<span>🔄</span>}
              onClick={() => message.info('Stock adjustments coming soon')}
            >
              Stock Adjustments
            </Button>
          </Space>
        </Card>
        </div>
      </Layout.Content>

      <ProductComparisonModal
        visible={comparisonModalVisible}
        products={productsForComparison}
        onClose={handleCloseComparisonModal}
        onRemoveProduct={handleRemoveFromComparison}
      />

      <SupplierManagementModal
        visible={supplierModalVisible}
        onClose={() => setSupplierModalVisible(false)}
      />

      <PurchaseOrdersModal
        visible={purchaseOrdersModalVisible}
        onClose={() => setPurchaseOrdersModalVisible(false)}
        lowStockProducts={products.filter(p => p.stock_quantity <= (p.min_stock_level || 0))}
      />

      <ProductFormModal
        visible={productFormModalVisible}
        product={selectedProduct}
        onClose={() => {
          setProductFormModalVisible(false);
          setSelectedProduct(null);
        }}
        onSubmit={handleProductFormSubmit}
        loading={createProduct.isPending || updateProduct.isPending}
      />

      <ProductVariantsModal
        visible={variantsModalVisible}
        product={selectedProduct}
        onClose={() => {
          setVariantsModalVisible(false);
          setSelectedProduct(null);
        }}
        onCreateVariant={handleCreateVariant}
        onEditProduct={handleEdit}
        onDeleteProduct={(product) => {
          Modal.confirm({
            title: 'Delete Product',
            content: `Are you sure you want to delete "${product.name}"?`,
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk: () => handleDelete(product),
          });
        }}
      />
    </Layout>
  );
};

export default ProductListPage;