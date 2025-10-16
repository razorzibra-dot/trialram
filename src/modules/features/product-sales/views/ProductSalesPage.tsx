/**
 * Product Sales Page - Enterprise Version
 * Redesigned with Ant Design and EnterpriseLayout
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Row,
  Col,
  Popconfirm,
  Alert,
  Empty,
  Modal,
  message,
  Tooltip
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  FileTextOutlined,
  RiseOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { productSaleService } from '@/services/productSaleService';
import { 
  ProductSale, 
  ProductSaleFilters, 
  PRODUCT_SALE_STATUSES,
  ProductSalesAnalytics 
} from '@/types/productSales';
import ProductSaleForm from '@/components/product-sales/ProductSaleForm';
import ProductSaleDetail from '@/components/product-sales/ProductSaleDetail';

const { Search } = Input;
const { Option } = Select;

export const ProductSalesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  // State management
  const [productSales, setProductSales] = useState<ProductSale[]>([]);
  const [analytics, setAnalytics] = useState<ProductSalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<ProductSaleFilters>({});
  const [searchText, setSearchText] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<ProductSale | null>(null);

  // Load data
  useEffect(() => {
    loadProductSales();
    loadAnalytics();
  }, [currentPage, pageSize, filters]);

  const loadProductSales = async () => {
    try {
      setLoading(true);
      const response = await productSaleService.getProductSales(filters, currentPage, pageSize);
      setProductSales(response.data);
      setTotalItems(response.total);
    } catch (err) {
      message.error('Failed to load product sales');
      console.error('Error loading product sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analyticsData = await productSaleService.getProductSalesAnalytics();
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadProductSales(), loadAnalytics()]);
    setRefreshing(false);
    message.success('Data refreshed successfully');
  };

  const handleCreateSale = () => {
    setSelectedSale(null);
    setShowCreateModal(true);
  };

  const handleEditSale = (sale: ProductSale) => {
    setSelectedSale(sale);
    setShowEditModal(true);
  };

  const handleViewSale = (sale: ProductSale) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
  };

  const handleDeleteSale = async (sale: ProductSale) => {
    try {
      await productSaleService.deleteProductSale(sale.id);
      message.success('Product sale deleted successfully');
      loadProductSales();
      loadAnalytics();
    } catch (err) {
      message.error('Failed to delete product sale');
      console.error('Error deleting product sale:', err);
    }
  };

  const handleFormSuccess = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedSale(null);
    loadProductSales();
    loadAnalytics();
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setFilters(prev => ({ ...prev, search: value }));
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setFilters(prev => ({ ...prev, status: value || undefined }));
    setCurrentPage(1);
  };

  const handleCustomerFilter = (value: string) => {
    setFilters(prev => ({ ...prev, customer_name: value || undefined }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchText('');
    setCurrentPage(1);
  };

  const getStatusTag = (status: string) => {
    const statusConfig = PRODUCT_SALE_STATUSES.find(s => s.value === status);
    const colorMap: Record<string, string> = {
      'draft': 'default',
      'pending': 'processing',
      'confirmed': 'success',
      'delivered': 'success',
      'cancelled': 'error',
      'refunded': 'warning'
    };
    return (
      <Tag color={colorMap[status] || 'default'}>
        {statusConfig?.label || status}
      </Tag>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Table columns
  const columns: ColumnsType<ProductSale> = [
    {
      title: 'Sale #',
      dataIndex: 'sale_number',
      key: 'sale_number',
      width: 150,
      render: (text: string, record: ProductSale) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>ID: {record.id}</div>
        </div>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 200,
      render: (text: string, record: ProductSale) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>ID: {record.customer_id}</div>
        </div>
      ),
    },
    {
      title: 'Product',
      dataIndex: 'product_name',
      key: 'product_name',
      width: 200,
      render: (text: string, record: ProductSale) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {record.warranty_period} months warranty
          </div>
        </div>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
      render: (text: number) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: 'Unit Price',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 120,
      align: 'right',
      render: (text: number) => <span style={{ fontWeight: 500 }}>{formatCurrency(text)}</span>,
    },
    {
      title: 'Total Value',
      dataIndex: 'total_value',
      key: 'total_value',
      width: 130,
      align: 'right',
      render: (text: number) => (
        <span style={{ fontWeight: 600, color: '#1890ff' }}>{formatCurrency(text)}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Sale Date',
      dataIndex: 'sale_date',
      key: 'sale_date',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 180,
      align: 'center',
      render: (_: any, record: ProductSale) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewSale(record)}
            />
          </Tooltip>
          {hasPermission('manage_product_sales') && (
            <Tooltip title="Edit">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEditSale(record)}
              />
            </Tooltip>
          )}
          {record.invoice_url && (
            <Tooltip title="Download Invoice">
              <Button
                type="text"
                icon={<DownloadOutlined />}
                onClick={() => window.open(record.invoice_url, '_blank')}
              />
            </Tooltip>
          )}
          {hasPermission('manage_product_sales') && (
            <Popconfirm
              title="Delete Product Sale"
              description={`Are you sure you want to delete sale ${record.sale_number}? This action cannot be undone.`}
              onConfirm={() => handleDeleteSale(record)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Delete">
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (!hasPermission('manage_product_sales')) {
    return (
      <EnterpriseLayout>
        <div style={{ padding: 24 }}>
          <Alert
            message="Access Denied"
            description="You don't have permission to access product sales."
            type="warning"
            showIcon
          />
        </div>
      </EnterpriseLayout>
    );
  }

  return (
    <EnterpriseLayout>
      <PageHeader
        title="Product Sales"
        description="Manage product sales and generate service contracts"
        breadcrumb={{
          items: [
            { title: 'Home', path: '/tenant/dashboard' },
            { title: 'Sales', path: '/tenant/sales' },
            { title: 'Product Sales' }
          ]
        }}
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              Refresh
            </Button>
            {hasPermission('manage_product_sales') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateSale}
              >
                Create Sale
              </Button>
            )}
          </Space>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Statistics Cards */}
        {analytics && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="Total Sales"
                value={analytics.total_sales}
                icon={<ShoppingCartOutlined />}
                color="primary"
                description="All product sales"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="Total Revenue"
                value={formatCurrency(analytics.total_revenue)}
                icon={<DollarOutlined />}
                color="success"
                description="Total sales value"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="Active Contracts"
                value={analytics.active_contracts}
                icon={<FileTextOutlined />}
                color="info"
                description="Generated contracts"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="Avg Sale Value"
                value={formatCurrency(analytics.average_sale_value)}
                icon={<RiseOutlined />}
                color="warning"
                description="Per sale average"
              />
            </Col>
          </Row>
        )}

        {/* Filters */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="Search sales..."
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={handleSearch}
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Filter by status"
                allowClear
                style={{ width: '100%' }}
                onChange={handleStatusFilter}
                value={filters.status}
              >
                {PRODUCT_SALE_STATUSES.map((status) => (
                  <Option key={status.value} value={status.value}>
                    {status.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="Filter by customer..."
                allowClear
                value={filters.customer_name}
                onChange={(e) => handleCustomerFilter(e.target.value)}
              />
            </Col>
            <Col xs={24} sm={12} md={4}>
              {Object.keys(filters).length > 0 && (
                <Button
                  icon={<FilterOutlined />}
                  onClick={clearFilters}
                  block
                >
                  Clear Filters
                </Button>
              )}
            </Col>
          </Row>
        </Card>

        {/* Product Sales Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={productSales}
            rowKey="id"
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalItems,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} sales`,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
            }}
            scroll={{ x: 1400 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No product sales found"
                >
                  {hasPermission('manage_product_sales') && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleCreateSale}
                    >
                      Create First Sale
                    </Button>
                  )}
                </Empty>
              ),
            }}
          />
        </Card>
      </div>

      {/* Create Product Sale Modal */}
      <ProductSaleForm
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleFormSuccess}
      />

      {/* Edit Product Sale Modal */}
      <ProductSaleForm
        open={showEditModal}
        onOpenChange={setShowEditModal}
        productSale={selectedSale}
        onSuccess={handleFormSuccess}
      />

      {/* Product Sale Detail Modal */}
      {selectedSale && (
        <ProductSaleDetail
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
          productSale={selectedSale}
          onSuccess={handleFormSuccess}
        />
      )}
    </EnterpriseLayout>
  );
};

export default ProductSalesPage;