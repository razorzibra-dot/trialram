/**
 * Product Sales Page - Enterprise Version
 * Redesigned with Ant Design and EnterpriseLayout
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  FilterOutlined,
  BarChartOutlined,
  TableOutlined,
  BellOutlined
} from '@ant-design/icons';
import { useService } from '@/modules/core/hooks/useService';
import { 
  ProductSale, 
  ProductSaleFilters, 
  PRODUCT_SALE_STATUSES,
  ProductSalesAnalytics 
} from '@/types/productSales';
import { 
  ProductSaleFormPanel, 
  ProductSaleDetailPanel,
  AdvancedFiltersModal,
  AdvancedSearchModal,
  AdvancedSearchInputs,
  FilterPresetsModal,
  FilterPreset,
  DynamicColumnsModal,
  ColumnConfig,
  applyColumnConfig,
  ExportModal,
  BulkActionToolbar,
  ProductSalesAnalyticsDashboard,
  ReportsModal,
  NotificationPreferencesModal
} from '../components';
import { useGenerateContractFromSale, useDeleteProductSale } from '../hooks';
import { useBulkOperations } from '../hooks/useBulkOperations';
import { BulkStatusUpdateRequest, BulkDeleteRequest } from '../services/bulkOperationsService';

const { Search } = Input;
const { Option } = Select;

export const ProductSalesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  // ✅ Get service from module service container (standardized pattern)
  const productSaleService = useService<any>('productSaleService');

  // Initialize custom hooks
  const { generateContract } = useGenerateContractFromSale();
  const { mutate: deleteProductSale } = useDeleteProductSale();
  const { bulkUpdateStatus, bulkDelete, bulkExport } = useBulkOperations();

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

  // Bulk operations
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const selectedSales = productSales.filter(sale => selectedRowKeys.includes(sale.id));

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showFilterPresets, setShowFilterPresets] = useState(false);
  const [showDynamicColumns, setShowDynamicColumns] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showNotificationPreferences, setShowNotificationPreferences] = useState(false);
  const [selectedSale, setSelectedSale] = useState<ProductSale | null>(null);
  
  // Column configuration
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>([]);
  
  // View mode state
  const [viewMode, setViewMode] = useState<'table' | 'analytics'>('table');

  // Load data
   
  const loadProductSales = useCallback(async () => {
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
  }, [filters, currentPage, pageSize, productSaleService]);

   
  const loadAnalytics = useCallback(async () => {
    try {
      const analyticsData = await productSaleService.getProductSalesAnalytics();
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  }, [productSaleService]);

  useEffect(() => {
    void loadProductSales();
    void loadAnalytics();
  }, [loadProductSales, loadAnalytics]);

  // Load column configuration from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('product_sales_column_prefs');
      if (saved) {
        setColumnConfig(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load column preferences:', error);
    }
  }, []);

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

  const handleGenerateContract = () => {
    if (selectedSale) {
      generateContract(selectedSale);
      setShowDetailModal(false);
    }
  };

  const handleDeleteFromDetail = () => {
    if (selectedSale) {
      deleteProductSale(selectedSale.id, {
        onSuccess: () => {
          message.success('Product sale deleted successfully');
          setShowDetailModal(false);
          setSelectedSale(null);
          loadProductSales();
          loadAnalytics();
        },
        onError: () => {
          message.error('Failed to delete product sale');
        },
      });
    }
  };

  const handleFormSuccess = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDetailModal(false);
    setSelectedSale(null);
    loadProductSales();
    loadAnalytics();
    message.success('Operation completed successfully');
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setFilters(prev => ({ ...prev, search: value }));
    setCurrentPage(1);
  };

  const handleAdvancedSearch = (searchInputs: AdvancedSearchInputs) => {
    const newFilters: ProductSaleFilters = { ...filters };
    
    // Apply full-text search across all fields
    if (searchInputs.full_text) {
      newFilters.search = searchInputs.full_text;
    } else {
      // Apply field-specific searches
      if (searchInputs.sale_id) {
        newFilters.sale_id = searchInputs.sale_id;
      }
      if (searchInputs.customer_name) {
        newFilters.customer_name = searchInputs.customer_name;
      }
      if (searchInputs.product_name) {
        newFilters.product_name = searchInputs.product_name;
      }
      if (searchInputs.notes) {
        newFilters.notes = searchInputs.notes;
      }
    }

    setFilters(newFilters);
    setCurrentPage(1);
    setShowAdvancedSearch(false);
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

  const handleBulkStatusUpdate = (request: BulkStatusUpdateRequest) => {
    bulkUpdateStatus.mutate(request, {
      onSuccess: () => {
        setSelectedRowKeys([]);
        loadProductSales();
        loadAnalytics();
      }
    });
  };

  const handleBulkDelete = (saleIds: string[], reason?: string) => {
    const request: BulkDeleteRequest = { saleIds, reason };
    bulkDelete.mutate(request, {
      onSuccess: () => {
        setSelectedRowKeys([]);
        loadProductSales();
        loadAnalytics();
      }
    });
  };

  const handleBulkExport = (sales: ProductSale[], format: 'csv' | 'xlsx', columns: string[]) => {
    bulkExport.mutate({ sales, format, columns });
  };

  const handleClearSelection = () => {
    setSelectedRowKeys([]);
  };

  const handleApplyAdvancedFilters = (advancedFilters: ProductSaleFilters) => {
    setFilters(advancedFilters);
    setCurrentPage(1);
    setShowAdvancedFilters(false);
  };

  const handleLoadPreset = (preset: FilterPreset) => {
    // Convert preset filters back to ProductSaleFilters format
    setFilters(preset.filters as ProductSaleFilters);
    setCurrentPage(1);
    setShowFilterPresets(false);
    message.success(`Loaded preset: ${preset.name}`);
  };

  const handleColumnsChange = (newColumnConfig: ColumnConfig[]) => {
    setColumnConfig(newColumnConfig);
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

  // Table columns - base configuration
   
  const baseColumns = useMemo(() => {
    const cols: ColumnsType<ProductSale> = [
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
        render: (_: unknown, record: ProductSale) => (
          <Space size="small">
            <Tooltip title="View Details">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => handleViewSale(record)}
              />
            </Tooltip>
            {hasPermission('crm:product-sale:record:update') && (
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
            {hasPermission('crm:product-sale:record:update') && (
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
    return cols;
  }, [hasPermission]);

  // Apply column configuration
   
  const columns = useMemo(() => {
    if (columnConfig.length === 0) {
      return baseColumns;
    }
    return applyColumnConfig(baseColumns, columnConfig);
  }, [baseColumns, columnConfig]);

  if (!hasPermission('crm:product-sale:record:update')) {
    return (
      <>
        <div style={{ padding: 24 }}>
          <Alert
            message="Access Denied"
            description="You don't have permission to access product sales."
            type="warning"
            showIcon
          />
        </div>
      </>
    );
  }

  return (
    <>
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
              icon={<TableOutlined />}
              type={viewMode === 'table' ? 'primary' : 'default'}
              onClick={() => setViewMode('table')}
            >
              Table
            </Button>
            <Button
              icon={<BarChartOutlined />}
              type={viewMode === 'analytics' ? 'primary' : 'default'}
              onClick={() => setViewMode('analytics')}
            >
              Analytics
            </Button>
            <Button
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              Refresh
            </Button>
            {hasPermission('crm:product-sale:record:update') && (
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
        {/* Analytics View */}
        {viewMode === 'analytics' && analytics ? (
          <ProductSalesAnalyticsDashboard analytics={analytics} loading={loading} />
        ) : (
          <>
            {/* Table View - Statistics Cards */}
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
                  <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button
                      icon={<SearchOutlined />}
                      onClick={() => setShowAdvancedSearch(true)}
                    >
                      Advanced Search
                    </Button>
                    <Button
                      icon={<FilterOutlined />}
                      onClick={() => setShowAdvancedFilters(true)}
                    >
                      Advanced
                    </Button>
                    <Button
                      icon={<FilterOutlined />}
                      onClick={() => setShowFilterPresets(true)}
                      title="Save, load, and manage filter presets"
                    >
                      Presets
                    </Button>
                    <Tooltip title="Show/hide columns, reorder columns, and save layout">
                      <Button
                        icon={<TableOutlined />}
                        onClick={() => setShowDynamicColumns(true)}
                      >
                        Columns
                      </Button>
                    </Tooltip>
                    <Tooltip title="Configure notification preferences for product sales events">
                      <Button
                        icon={<BellOutlined />}
                        onClick={() => setShowNotificationPreferences(true)}
                      >
                        Notifications
                      </Button>
                    </Tooltip>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={() => setShowReportsModal(true)}
                    >
                      Reports
                    </Button>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={() => setShowExportModal(true)}
                    >
                      Export
                    </Button>
                    {Object.keys(filters).length > 0 && (
                      <Button
                        danger
                        onClick={clearFilters}
                      >
                        Clear
                      </Button>
                    )}
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* Bulk Action Toolbar */}
            {selectedRowKeys.length > 0 && (
              <BulkActionToolbar
                selectedCount={selectedRowKeys.length}
                selectedSales={selectedSales}
                onBulkStatusUpdate={handleBulkStatusUpdate}
                onBulkDelete={handleBulkDelete}
                onBulkExport={handleBulkExport}
                onClearSelection={handleClearSelection}
                loading={bulkUpdateStatus.isLoading || bulkDelete.isLoading || bulkExport.isLoading}
              />
            )}

            {/* Product Sales Table */}
            <Card>
              <Table
                columns={columns}
                dataSource={productSales}
                rowKey="id"
                loading={loading}
                rowSelection={{
                  selectedRowKeys,
                  onChange: (keys) => setSelectedRowKeys(keys),
                  checkStrictly: true,
                  preserveSelectedRowKeys: true
                }}
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
                      {hasPermission('crm:product-sale:record:update') && (
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
          </>
        )}
      </div>

      {/* Product Sale Form Side Panel - Create */}
      <ProductSaleFormPanel
        visible={showCreateModal}
        productSale={null}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleFormSuccess}
      />

      {/* Product Sale Form Side Panel - Edit */}
      <ProductSaleFormPanel
        visible={showEditModal}
        productSale={selectedSale}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleFormSuccess}
      />

      {/* Product Sale Detail Side Panel */}
      <ProductSaleDetailPanel
        visible={showDetailModal}
        productSale={selectedSale}
        onClose={() => setShowDetailModal(false)}
        onEdit={() => {
          setShowDetailModal(false);
          setShowEditModal(true);
        }}
        onGenerateContract={handleGenerateContract}
        onDelete={handleDeleteFromDetail}
      />

      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        visible={showAdvancedSearch}
        onSearch={handleAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
      />

      {/* Advanced Filters Modal */}
      <AdvancedFiltersModal
        visible={showAdvancedFilters}
        filters={filters}
        onApply={handleApplyAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
      />

      {/* Reports Modal */}
      <ReportsModal
        visible={showReportsModal}
        data={productSales}
        onClose={() => setShowReportsModal(false)}
      />

      {/* Export Modal */}
      <ExportModal
        visible={showExportModal}
        data={productSales}
        onClose={() => setShowExportModal(false)}
      />

      {/* Filter Presets Modal */}
      <FilterPresetsModal
        visible={showFilterPresets}
        currentFilters={filters}
        onLoadPreset={handleLoadPreset}
        onClose={() => setShowFilterPresets(false)}
      />

      {/* Dynamic Columns Modal */}
      <DynamicColumnsModal
        visible={showDynamicColumns}
        onClose={() => setShowDynamicColumns(false)}
        onColumnsChange={handleColumnsChange}
      />

      {/* Notification Preferences Modal */}
      <NotificationPreferencesModal
        visible={showNotificationPreferences}
        onClose={() => setShowNotificationPreferences(false)}
        onSuccess={() => {
          message.success('Notification preferences updated successfully');
        }}
      />
    </>
  );
};

export default ProductSalesPage;