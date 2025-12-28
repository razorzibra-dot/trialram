/**
 * Customer List Page - Enterprise Design
 * Main page for displaying and managing customers
 * Unified grid control with side drawer panels for CRUD operations
 */

import React, { useState, useRef } from 'react';
import { Row, Col, Card, Button, Table, Input, Select, Space, Tag, Popconfirm, Tooltip, Empty, Modal, Checkbox, Alert, Upload, Spin, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined, ClearOutlined, DeleteFilled, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { Users, Mail, Phone } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/common';
import { CustomerDetailPanel } from '../components/CustomerDetailPanel';
import { CustomerFormPanel } from '../components/CustomerFormPanel';
import { Customer } from '@/types/crm';
import { CustomerFilters, CustomerStats } from '../services/customerService';
import { useCustomers, useDeleteCustomer, useCustomerStats, useCustomerExport, useCustomerImport } from '../hooks/useCustomers';
import { useActiveUsers } from '@/hooks/useActiveUsers'; // Shared hook for all modules
import { useAuth } from '@/contexts/AuthContext';
import { useReferenceDataByCategory } from '@/hooks/useReferenceDataOptions';
import { useCurrentTenant } from '@/hooks/useCurrentTenant';

const { Search } = Input;
const { Option } = Select;

const CustomerListPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [filters, setFilters] = useState<Partial<CustomerFilters>>({
    page: 1,
    pageSize: 20,
  });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('');
  const [sizeFilter, setSizeFilter] = useState<string>('');
  const [assignedFilter, setAssignedFilter] = useState<string>('');
  
  // Drawer states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view' | null>(null);

  // Bulk operations states
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Export/Import states
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreviewData, setImportPreviewData] = useState<any[]>([]);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);

  // Queries
  const {
    data: customerResponse,
    isLoading: customersLoading,
    refetch
  } = useCustomers(filters as CustomerFilters);
  const customers = customerResponse?.data || [];
  const pagination = customerResponse
    ? {
        page: customerResponse.page,
        pageSize: customerResponse.pageSize,
        total: customerResponse.total,
        totalPages: customerResponse.totalPages,
      }
    : {
        page: filters.page ?? 1,
        pageSize: filters.pageSize ?? 20,
        total: 0,
        totalPages: 0,
      };
  const deleteCustomer = useDeleteCustomer();
  const exportCustomers = useCustomerExport();
  const importCustomers = useCustomerImport();
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useCustomerStats();
  
  // Fetch dynamic dropdown data using consistent pattern
  const currentTenant = useCurrentTenant();
  const tenantId = currentTenant?.id;
  const { options: industryOptions } = useReferenceDataByCategory(tenantId, 'industry');
  const { options: companySizeOptions } = useReferenceDataByCategory(tenantId, 'company_size');
  const { data: users = [] } = useActiveUsers();

  // Real stats from service
  const defaultStats: CustomerStats = {
    totalCustomers: 0,
    activeCustomers: 0,
    inactiveCustomers: 0,
    prospectCustomers: 0,
    byIndustry: {},
    bySize: {},
    byStatus: {},
    recentlyAdded: 0,
  };
  const stats: CustomerStats = statsData ?? defaultStats;

  const handleRefresh = () => {
    refetch();
    refetchStats();
    message.success('Data refreshed successfully');
  };

  const handleCreate = () => {
    setSelectedCustomer(null);
    setDrawerMode('create');
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDrawerMode('edit');
  };

  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDrawerMode('view');
  };

  const handleDelete = async (customer: Customer) => {
    // Notifications handled by useDeleteCustomer hook
    await deleteCustomer.mutateAsync(customer.id);
    refetch();
  };

  const handleBulkDelete = async () => {
    if (!hasPermission('crm:customer:record:delete')) {
      message.error('You do not have permission to delete customers');
      return;
    }

    const customersToDelete = customers?.filter(c => selectedRowKeys.includes(c.id)) || [];
    
    Modal.confirm({
      title: 'Bulk Delete Customers',
      icon: <DeleteFilled />,
      content: (
        <div>
          <p>Are you sure you want to delete <strong>{selectedRowKeys.length}</strong> customer(s)?</p>
          {customersToDelete.length > 0 && (
            <div style={{ marginTop: 16, maxHeight: 200, overflowY: 'auto' }}>
              <p style={{ fontSize: 12, color: '#8c8c8c' }}>Selected customers:</p>
              {customersToDelete.map(c => (
                <div key={c.id} style={{ fontSize: 12, padding: '4px 0' }}>
                  • {c.company_name}
                </div>
              ))}
            </div>
          )}
          <Alert 
            message="This action cannot be undone"
            type="warning"
            style={{ marginTop: 16 }}
            showIcon
          />
        </div>
      ),
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setIsBulkDeleting(true);
          const failedIds: string[] = [];
          
          for (const customerId of selectedRowKeys as string[]) {
            try {
              await deleteCustomer.mutateAsync(customerId);
            } catch (error) {
              failedIds.push(customerId);
            }
          }
          
          if (failedIds.length === 0) {
            message.success(`Successfully deleted ${selectedRowKeys.length} customer(s)`);
            setSelectedRowKeys([]);
            refetch();
          } else {
            message.warning(`Deleted ${selectedRowKeys.length - failedIds.length} customer(s), but ${failedIds.length} failed`);
            setSelectedRowKeys(failedIds as React.Key[]);
            refetch();
          }
        } catch (error) {
          message.error('Failed to bulk delete customers');
        } finally {
          setIsBulkDeleting(false);
        }
      },
    });
  };

  // Export handler
  const handleExport = async () => {
    if (!hasPermission('crm:customer:record:read')) {
      message.error('You do not have permission to export customers');
      return;
    }

    try {
      await exportCustomers.mutateAsync(exportFormat);
      setIsExportModalVisible(false);
      message.success(`Customers exported successfully as ${exportFormat.toUpperCase()}`);
    } catch (error) {
      message.error('Failed to export customers');
    }
  };

  // Import handlers
  const handleImportFileSelect = (file: File) => {
    setImportFile(file);
    
    // Read file to preview
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          const preview = Array.isArray(data) ? data.slice(0, 5) : [data];
          setImportPreviewData(preview);
        } else if (file.name.endsWith('.csv')) {
          // Simple CSV preview - first 5 lines
          const lines = content.split('\n').slice(0, 6);
          setImportPreviewData(lines.map((line, idx) => ({ row: idx, data: line })));
        }
        setShowImportPreview(true);
      } catch (error) {
        message.error('Invalid file format');
        setImportFile(null);
      }
    };
    reader.readAsText(file);
    
    return false; // Prevent default upload behavior
  };

  const handleImportConfirm = async () => {
    if (!importFile) {
      message.error('Please select a file to import');
      return;
    }

    if (!hasPermission('crm:customer:record:create')) {
      message.error('You do not have permission to import customers');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const result = await importCustomers.mutateAsync(content);
          
          setImportResults(result);
          setShowImportPreview(false);
          
          if (result.errors && result.errors.length > 0) {
            message.warning(
              `Import completed: ${result.success} imported, ${result.errors.length} failed`
            );
          } else {
            message.success('Customers imported successfully');
          }
          
          // Refresh the table
          refetch();
          setIsImportModalVisible(false);
          setImportFile(null);
        } catch (error) {
          message.error('Failed to import customers');
        }
      };
      reader.readAsText(importFile);
    } catch (error) {
      message.error('Failed to process import file');
    }
  };

  const handleImportCancel = () => {
    setIsImportModalVisible(false);
    setImportFile(null);
    setImportPreviewData([]);
    setShowImportPreview(false);
    setImportResults(null);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setFilters({ ...filters, search: value, page: 1 });
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    const statusValue: 'active' | 'inactive' | 'prospect' | undefined = value === 'all' ? undefined : (value as 'active' | 'inactive' | 'prospect');
    setFilters({ ...filters, status: statusValue, page: 1 });
  };

  const handleIndustryFilterChange = (value: string) => {
    setIndustryFilter(value);
    setFilters({ ...filters, industry: value || undefined, page: 1 });
  };

  const handleSizeFilterChange = (value: string) => {
    setSizeFilter(value);
    setFilters({ ...filters, size: value || undefined, page: 1 });
  };

  const handleAssignedFilterChange = (value: string) => {
    setAssignedFilter(value);
    setFilters({ ...filters, assignedTo: value || undefined, page: 1 });
  };

  const handleClearFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setIndustryFilter('');
    setSizeFilter('');
    setAssignedFilter('');
    setSelectedRowKeys([]);
    setFilters({ page: 1, pageSize: 20 });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'default';
      case 'prospect': return 'blue';
      default: return 'default';
    }
  };

  // Table columns
  const columns: ColumnsType<Customer> = [
    {
      title: 'Customer',
      key: 'company_name',
      dataIndex: 'company_name',
      width: 250,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.contact_name}</div>
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.email && (
            <div style={{ fontSize: 12, display: 'flex', alignItems: 'center' }}>
              <Mail size={12} style={{ marginRight: 6 }} />
              {record.email}
            </div>
          )}
          {record.phone && (
            <div style={{ fontSize: 12, color: '#8c8c8c', display: 'flex', alignItems: 'center' }}>
              <Phone size={12} style={{ marginRight: 6 }} />
              {record.phone}
            </div>
          )}
        </Space>
      ),
    },
    {
      title: 'Industry',
      key: 'industry',
      dataIndex: 'industry',
      width: 120,
      render: (industry) => (
        <Tag color="blue">{industry || 'Not specified'}</Tag>
      ),
    },
    {
      title: 'Company Size',
      key: 'size',
      dataIndex: 'size',
      width: 110,
      render: (size) => (
        <Tag color="purple">{size || 'Not specified'}</Tag>
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
      title: 'Assigned To',
      key: 'assigned_to',
      dataIndex: 'assigned_to',
      width: 130,
      render: (assignedTo: string) => (
        <span>{assignedTo ? users.find(u => u.id === assignedTo)?.firstName : 'Unassigned'}</span>
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
      width: 160,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          {hasPermission('crm:customer:record:update') && (
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {hasPermission('crm:customer:record:delete') && (
            <Popconfirm
              title="Delete Customer"
              description={`Are you sure you want to delete "${record.company_name}"?`}
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
    <>
      <PageHeader
        title="Customers"
        description="Manage your customer relationships and interactions"
        breadcrumb={{
          items: [
            { title: 'Dashboard', path: '/tenant/dashboard' },
            { title: 'Customers' }
          ]
        }}
        extra={
          <>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              Refresh
            </Button>
            {hasPermission('crm:customer:record:read') && (
              <Button icon={<DownloadOutlined />} onClick={() => setIsExportModalVisible(true)}>
                Export
              </Button>
            )}
            {hasPermission('crm:customer:record:create') && (
              <Button icon={<UploadOutlined />} onClick={() => setIsImportModalVisible(true)}>
                Import
              </Button>
            )}
            {hasPermission('crm:customer:record:create') && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                Add Customer
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
              title="Total Customers"
              value={stats.totalCustomers}
              description="All customers"
              icon={Users}
              color="primary"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Active Customers"
              value={stats.activeCustomers}
              description={`${stats.totalCustomers > 0 ? ((stats.activeCustomers / stats.totalCustomers) * 100).toFixed(1) : 0}% of total`}
              icon={Users}
              color="success"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Prospects"
              value={stats.prospectCustomers}
              description="Potential customers"
              icon={Users}
              color="info"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Top Industry"
              value={
                (() => {
                  const topIndustryKey = Object.entries(stats.byIndustry).sort(([,a], [,b]) => b - a)[0]?.[0];
                  if (!topIndustryKey || topIndustryKey === 'unknown') return 'N/A';
                  // Look up the label from reference data options (case-insensitive)
                  const normalizedKey = topIndustryKey.toLowerCase();
                  const industryOption = industryOptions.find(opt => opt.value?.toLowerCase() === normalizedKey);
                  // If found in reference data, use the label; otherwise, capitalize the first letter
                  return industryOption?.label || (topIndustryKey.charAt(0).toUpperCase() + topIndustryKey.slice(1));
                })()
              }
              description="Most common"
              icon={Users}
              color="warning"
              loading={statsLoading}
            />
          </Col>
        </Row>

        {/* Customers Table */}
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
                placeholder="Search customers by name, email, or phone..."
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
                <Option value="prospect">Prospect</Option>
              </Select>
              
              <Select
                value={industryFilter}
                onChange={handleIndustryFilterChange}
                style={{ width: 140 }}
                placeholder="Industry"
                allowClear
                size="large"
              >
                {industryOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
              
              <Select
                value={sizeFilter}
                onChange={handleSizeFilterChange}
                style={{ width: 130 }}
                placeholder="Company Size"
                allowClear
                size="large"
              >
                {companySizeOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
              
              <Select
                value={assignedFilter}
                onChange={handleAssignedFilterChange}
                style={{ width: 150 }}
                placeholder="Assigned To"
                allowClear
                size="large"
              >
                {users.map(user => (
                  <Option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </Option>
                ))}
              </Select>
            </Space>
          </Space>

          {/* Bulk Operations Toolbar */}
          {selectedRowKeys.length > 0 && (
            <Alert
              message={`${selectedRowKeys.length} customer(s) selected`}
              type="info"
              style={{ marginBottom: 16 }}
              action={
                <Space size="small">
                  <Button 
                    type="primary" 
                    danger
                    size="small"
                    icon={<DeleteFilled />}
                    onClick={handleBulkDelete}
                    loading={isBulkDeleting}
                    disabled={!hasPermission('crm:customer:record:delete')}
                  >
                    Delete Selected
                  </Button>
                  <Button 
                    size="small"
                    onClick={() => setSelectedRowKeys([])}
                  >
                    Clear Selection
                  </Button>
                </Space>
              }
            />
          )}

          {/* Table */}
          <Table
            columns={columns}
            dataSource={customers || []}
            loading={customersLoading}
            pagination={{
              current: filters.page || 1,
              pageSize: filters.pageSize || 20,
              total: pagination?.total || 0,
              showSizeChanger: true,
              showQuickJumper: true,
              onChange: (page, pageSize) => {
                setFilters({ ...filters, page, pageSize });
              },
            }}
            rowKey="id"
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
              selections: [
                Table.SELECTION_ALL,
                Table.SELECTION_INVERT,
                Table.SELECTION_NONE,
              ],
            }}
            locale={{
              emptyText: <Empty description="No customers found" style={{ marginTop: 48, marginBottom: 48 }} />,
            }}
          />
        </Card>
      </div>

      {/* Detail Panel (View) */}
      <CustomerDetailPanel
        open={drawerMode === 'view'}
        customer={selectedCustomer}
        onClose={() => setDrawerMode(null)}
        onEdit={() => setDrawerMode('edit')}
      />

      {/* Form Panel (Create/Edit) */}
      <CustomerFormPanel
        open={drawerMode === 'create' || drawerMode === 'edit'}
        customer={drawerMode === 'edit' ? selectedCustomer : null}
        onClose={() => setDrawerMode(null)}
        onSuccess={() => {
          setDrawerMode(null);
          refetch();
        }}
      />

      {/* Export Modal */}
      <Modal
        title="Export Customers"
        open={isExportModalVisible}
        onOk={handleExport}
        onCancel={() => setIsExportModalVisible(false)}
        okText="Export"
        cancelText="Cancel"
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <p>Select the format for your export:</p>
          <Select
            value={exportFormat}
            onChange={(value) => setExportFormat(value as 'csv' | 'json')}
            style={{ width: '100%' }}
            size="large"
          >
            <Option value="csv">
              <div>
                <div style={{ fontWeight: 500 }}>CSV Format</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  Compatible with Excel and other spreadsheet applications
                </div>
              </div>
            </Option>
            <Option value="json">
              <div>
                <div style={{ fontWeight: 500 }}>JSON Format</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  Structured format for data import or API usage
                </div>
              </div>
            </Option>
          </Select>
        </div>
        <Alert
          message={`You will export ${customers?.length || 0} customer records`}
          type="info"
          showIcon
        />
      </Modal>

      {/* Import Modal */}
      <Modal
        title="Import Customers"
        open={isImportModalVisible}
        onOk={showImportPreview ? handleImportConfirm : undefined}
        onCancel={handleImportCancel}
        okText={showImportPreview ? 'Confirm Import' : undefined}
        cancelText="Cancel"
        width={600}
        footer={
          showImportPreview
            ? [
                <Button key="cancel" onClick={handleImportCancel}>
                  Cancel
                </Button>,
                <Button
                  key="submit"
                  type="primary"
                  loading={importCustomers.isPending}
                  onClick={handleImportConfirm}
                >
                  Confirm Import
                </Button>,
              ]
            : [
                <Button key="cancel" onClick={handleImportCancel}>
                  Cancel
                </Button>,
              ]
        }
      >
        {!showImportPreview ? (
          <div>
            <p style={{ marginBottom: 16 }}>
              Upload a CSV or JSON file with customer data:
            </p>
            <Upload
              accept=".csv,.json"
              maxCount={1}
              beforeUpload={handleImportFileSelect}
              onRemove={() => {
                setImportFile(null);
                setImportPreviewData([]);
              }}
            >
              <Button icon={<UploadOutlined />}>
                Select File
              </Button>
            </Upload>
            <Alert
              message="Supported formats: CSV, JSON"
              type="info"
              style={{ marginTop: 16 }}
              showIcon
            />
            <Alert
              message="Required fields: company_name, email, phone"
              type="warning"
              style={{ marginTop: 8 }}
              showIcon
            />
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h4>Preview</h4>
              <div
                style={{
                  backgroundColor: '#fafafa',
                  padding: 12,
                  borderRadius: 4,
                  maxHeight: 300,
                  overflowY: 'auto',
                  border: '1px solid #e0e0e0',
                }}
              >
                {importPreviewData.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 0',
                      borderBottom: '1px solid #e8e8e8',
                      fontSize: 12,
                    }}
                  >
                    {typeof item === 'string' ? (
                      <code>{item}</code>
                    ) : (
                      <code>{JSON.stringify(item)}</code>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Alert
              message="Please verify the data above is correct before confirming"
              type="warning"
              showIcon
            />
          </div>
        )}

        {importResults && (
          <div style={{ marginTop: 16 }}>
            <Alert
              message={`Import Results: ${importResults.successCount} imported, ${
                importResults.errors?.length || 0
              } failed`}
              type={importResults.errors?.length > 0 ? 'warning' : 'success'}
              showIcon
            />
            {importResults.errors && importResults.errors.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4>Errors:</h4>
                <div
                  style={{
                    backgroundColor: '#fff7e6',
                    padding: 12,
                    borderRadius: 4,
                    maxHeight: 200,
                    overflowY: 'auto',
                    border: '1px solid #ffe7ba',
                  }}
                >
                  {importResults.errors.map((error: any, idx: number) => (
                    <div key={idx} style={{ padding: '4px 0', fontSize: 12 }}>
                      • {typeof error === 'string' ? error : error.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default CustomerListPage;
