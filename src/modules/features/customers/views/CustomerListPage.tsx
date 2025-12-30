/**
 * Customer List Page - Enterprise Design (Matching Lead Module)
 * Comprehensive customer listing with filtering, sorting, and bulk operations
 * ✨ Exact styling match with Lead module for consistency
 */

import React, { useState, useMemo } from 'react';
import {
  Input,
  Select,
  Space,
  Button,
  Tag,
  Tooltip,
  Empty,
  Row,
  Col,
  Card,
  Typography,
  Dropdown,
  Divider,
  Checkbox,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  PlusOutlined,
  MoreOutlined,
  GlobalOutlined,
  HomeOutlined,
  TeamOutlined,
  CalendarOutlined,
  TagOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Trash2 } from 'lucide-react';
import { Customer } from '@/types/crm';
import { useAuth } from '@/contexts/AuthContext';
import { CUSTOMER_PERMISSIONS } from '../constants/permissions';
import { useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '../hooks/useCustomers';
import { useReferenceDataByCategory } from '@/hooks/useReferenceDataOptions';
import { useCurrentTenant } from '@/hooks/useCurrentTenant';
import { useAssignedToOptions } from '@/hooks/useAssignedToOptions';
import { formatDate } from '@/utils/formatters';
import CustomerFormDrawer from '../components/CustomerFormDrawer';
import CustomerDetailDrawer from '../components/CustomerDetailDrawer';
import { useConfirmDelete } from '@/components/modals/useConfirmDelete';
import { PageHeader, StatsGrid, RefreshButton, PageLoader, AccessDenied, EnterpriseTable } from '@/components/common';
import { useModuleData } from '@/contexts/ModuleDataContext';
import { useEntityMutationWithRefresh } from '@/hooks/useEntityMutationWithRefresh';
import { useTableSelection } from '@/hooks/useTableSelection';
import { useBatchDelete } from '@/hooks/useBatchDelete';
import { BatchActionsToolbar } from '@/components/common/BatchActionsToolbar';
import { ImportExportToolbar } from '@/components/common/ImportExportToolbar';
import { useExport, type ExportColumn } from '@/hooks/useExport';
import { useImport, type ImportColumn } from '@/hooks/useImport';
import { useService } from '@/modules/core/hooks/useService';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const statusColors: Record<string, string> = {
  active: 'green',
  inactive: 'red',
  prospect: 'blue',
  suspended: 'orange',
};

interface CustomerListPageEnhancedProps {
  onViewCustomer?: (customer: Customer) => void;
  onEditCustomer?: (customer: Customer) => void;
  onCreateCustomer?: () => void;
}

export const CustomerListPageEnhanced: React.FC<CustomerListPageEnhancedProps> = ({
  onViewCustomer,
  onEditCustomer,
  onCreateCustomer
}) => {
  const { hasPermission } = useAuth();
  const currentTenant = useCurrentTenant();
  const tenantId = currentTenant?.id;
  const { data: moduleData, isLoading: moduleLoading, error, refresh } = useModuleData();
  const customerService = useService('customerService') as any; // Service with batchDelete method

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('all');

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const canUpdate = hasPermission(CUSTOMER_PERMISSIONS.UPDATE);
  const canDelete = hasPermission(CUSTOMER_PERMISSIONS.DELETE);
  const canCreate = hasPermission(CUSTOMER_PERMISSIONS.CREATE);
  const canRead = hasPermission(CUSTOMER_PERMISSIONS.VIEW);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Ensure current page stays within valid range when data changes (e.g., after deletions)
  // Moved below filteredCustomers definition to avoid temporal dead zone

  // Queries and mutations
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const { confirmDelete } = useConfirmDelete();
  
  // Use generic mutation handler with automatic refresh
  const { handleCreate, handleUpdate, handleDelete: handleDeleteMutation } = useEntityMutationWithRefresh({
    createMutation: createCustomer,
    updateMutation: updateCustomer,
    deleteMutation: deleteCustomer,
    refresh,
    entityName: 'Customer',
  });

  // Reference data
  const { options: statusOptionsRef, isLoading: loadingStatus } = useReferenceDataByCategory(tenantId, 'customer_status');
  const { options: industryOptionsRef, isLoading: loadingIndustry } = useReferenceDataByCategory(tenantId, 'industry');
  const { options: sizeOptionsRef, isLoading: loadingSizes } = useReferenceDataByCategory(tenantId, 'company_size');
  const { options: typeOptionsRef, isLoading: loadingTypes } = useReferenceDataByCategory(tenantId, 'customer_type');
  const assignedToOptions = useAssignedToOptions('customers');
  const customersResponse = moduleData?.moduleData?.customers;
  
  const customersList = useMemo(() => {
    if (!customersResponse) return [] as Customer[];
    if (Array.isArray(customersResponse)) return customersResponse as Customer[];
    if (typeof customersResponse === 'object' && 'data' in customersResponse) {
      return (customersResponse as { data?: Customer[] }).data || [];
    }
    return [] as Customer[];
  }, [customersResponse]);

  // Apply filters to compute visible customers
  const filteredCustomers = useMemo(() => {
    const normalize = (val?: string) => (val || '').toLowerCase().trim();
    const search = normalize(searchText);
    const statusFilterNorm = normalize(statusFilter);
    const industryFilterNorm = normalize(industryFilter);
    const sizeFilterNorm = normalize(sizeFilter);
    const assignedFilter = assignedToFilter;

    return customersList.filter((customer) => {
      const company = normalize(customer.companyName);
      const contact = normalize(customer.contactName);
      const email = normalize(customer.email);
      const status = normalize(customer.status);
      const industry = normalize(customer.industry);
      const size = normalize(customer.size);

      const matchesSearch = search.length === 0
        || company.includes(search)
        || contact.includes(search)
        || email.includes(search);

      const matchesStatus = statusFilterNorm === 'all' || status === statusFilterNorm;
      const matchesIndustry = industryFilterNorm === 'all' || industry === industryFilterNorm;
      const matchesSize = sizeFilterNorm === 'all' || size === sizeFilterNorm;
      const matchesAssignedTo = assignedFilter === 'all' || (customer.assignedTo as string | undefined) === assignedFilter;

      return matchesSearch && matchesStatus && matchesIndustry && matchesSize && matchesAssignedTo;
    });
  }, [customersList, searchText, statusFilter, industryFilter, sizeFilter, assignedToFilter]);

  // Table selection hook
  const {
    selectedIds,
    selectedCount,
    isSelected,
    toggleSelection,
    toggleAll,
    clearSelection,
    isAllSelected,
    isPartiallySelected,
  } = useTableSelection<Customer>({
    items: filteredCustomers,
    getId: (customer) => customer.id,
    disabled: moduleLoading,
  });

  // Batch delete hook
  const { batchDelete, isDeleting, progress } = useBatchDelete<Customer>({
    service: customerService,
    entityName: 'customer',
    entityNamePlural: 'customers',
    onSuccess: async () => {
      clearSelection();
      await refresh();
    },
  });

  // Export configuration
  const exportColumns: ExportColumn[] = useMemo(() => [
    { field: 'companyName', header: 'Company Name' },
    { field: 'contactName', header: 'Contact Name' },
    { field: 'email', header: 'Email' },
    { field: 'phone', header: 'Phone' },
    { field: 'mobile', header: 'Mobile' },
    { field: 'status', header: 'Status' },
    { field: 'industry', header: 'Industry' },
    { field: 'size', header: 'Company Size' },
    { field: 'website', header: 'Website' },
    { field: 'address', header: 'Address' },
    { field: 'city', header: 'City' },
    { field: 'state', header: 'State' },
    { field: 'country', header: 'Country' },
    { field: 'postalCode', header: 'Postal Code' },
    {
      field: 'createdAt',
      header: 'Created Date',
      transform: (value) => value ? formatDate(value) : '',
    },
  ], []);

  // Export hook
  const { exportData, isExporting } = useExport({
    entityName: 'Customers',
    columns: exportColumns,
    onSuccess: () => {
      // Optionally clear selection after export
    },
  });

  // Import configuration
  const importColumns: ImportColumn[] = useMemo(() => [
    {
      field: 'companyName',
      csvHeader: 'Company Name',
      required: true,
      validate: (value) => {
        if (!value || value.length < 2) {
          return 'Company name must be at least 2 characters';
        }
        return null;
      },
    },
    {
      field: 'contactName',
      csvHeader: 'Contact Name',
    },
    {
      field: 'email',
      csvHeader: 'Email',
      required: true,
      validate: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Invalid email format';
        }
        return null;
      },
    },
    {
      field: 'phone',
      csvHeader: 'Phone',
    },
    {
      field: 'mobile',
      csvHeader: 'Mobile',
    },
    {
      field: 'status',
      csvHeader: 'Status',
      transform: (value) => value?.toLowerCase() || 'active',
      validate: (value) => {
        const validStatuses = ['active', 'inactive', 'prospect', 'suspended'];
        if (!validStatuses.includes(value)) {
          return `Status must be one of: ${validStatuses.join(', ')}`;
        }
        return null;
      },
    },
    {
      field: 'industry',
      csvHeader: 'Industry',
    },
    {
      field: 'size',
      csvHeader: 'Company Size',
    },
    {
      field: 'website',
      csvHeader: 'Website',
    },
    {
      field: 'address',
      csvHeader: 'Address',
    },
    {
      field: 'city',
      csvHeader: 'City',
    },
    {
      field: 'state',
      csvHeader: 'State',
    },
    {
      field: 'country',
      csvHeader: 'Country',
    },
    {
      field: 'postalCode',
      csvHeader: 'Postal Code',
    },
  ], []);

  // Import hook
  const { importData, isImporting, progress: importProgress } = useImport({
    entityName: 'Customer',
    service: customerService,
    columns: importColumns,
    onSuccess: async (result) => {
      await refresh();
    },
  });

  // Handle export
  const handleExport = (format: 'csv' | 'excel' | 'json', scope: 'selected' | 'filtered' | 'all') => {
    let dataToExport: Customer[] = [];
    
    if (scope === 'selected' && selectedCount > 0) {
      dataToExport = customersList.filter(c => selectedIds.includes(c.id));
    } else if (scope === 'filtered') {
      dataToExport = filteredCustomers;
    } else {
      dataToExport = customersList;
    }

    void exportData(dataToExport, format);
  };

  // Handle import
  const handleImport = async (file: File) => {
    await importData(file);
  };

  const stats = useMemo(() => {
    const totalCustomers = customersList.length;
    const activeCustomers = customersList.filter(c => c.status === 'active').length;
    const inactiveCustomers = customersList.filter(c => c.status === 'inactive').length;
    const prospectCustomers = customersList.filter(c => c.status === 'prospect').length;
    return {
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      prospectCustomers,
    };
  }, [customersList]);

  const statusOptions = statusOptionsRef.length ? statusOptionsRef : [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Prospect', value: 'prospect' },
  ];

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleIndustryFilterChange = (value: string) => {
    setIndustryFilter(value);
  };

  const handleSizeFilterChange = (value: string) => {
    setSizeFilter(value);
  };

  const handleAssignedToFilterChange = (value: string) => {
    setAssignedToFilter(value);
  };

  const handleDelete = async (customer: Customer) => {
    await handleDeleteMutation(customer.id);
  };

  const handleCreateCustomer = () => {
    setSelectedCustomer(null);
    setIsEditMode(false);
    setIsFormOpen(true);
    onCreateCustomer?.();
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditMode(true);
    setIsFormOpen(true);
    onEditCustomer?.(customer);
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailOpen(true);
    onViewCustomer?.(customer);
  };

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    try {
      if (isEditMode && selectedCustomer) {
        await handleUpdate(selectedCustomer.id, values as any);
      } else {
        await handleCreate(values as any);
      }
      
      // Close form AFTER refresh completes
      setIsFormOpen(false);
    } catch (error) {
      // Keep form open on error so user can retry
    }
  };

  const getStatusColor = (status: string) => statusColors[status] || 'default';

  // Table columns
  const columns: ColumnsType<Customer> = [
    // Checkbox column for batch selection
    {
      title: (
        <Checkbox
          checked={isAllSelected}
          indeterminate={isPartiallySelected}
          onChange={toggleAll}
          disabled={moduleLoading || !canDelete}
        />
      ),
      key: 'selection',
      width: 50,
      align: 'center' as const,
      render: (_, record) => (
        <Checkbox
          checked={isSelected(record)}
          onChange={() => toggleSelection(record)}
          disabled={moduleLoading || !canDelete}
        />
      ),
    },
    {
      title: 'Company',
      key: 'companyName',
      dataIndex: 'companyName',
      width: 220,
      sorter: true,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserOutlined style={{ color: '#1890ff', fontSize: 16 }} />
          <div>
            <div style={{ fontWeight: 600, color: '#1f2937' }}>
              {record.companyName}
            </div>
            {record.contactName && (
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {record.contactName}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      dataIndex: 'email',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <MailOutlined style={{ color: '#1890ff' }} />
            <span style={{ fontSize: 12 }}>{record.email || '-'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <PhoneOutlined style={{ color: '#52c41a' }} />
            <span style={{ fontSize: 12 }}>{record.phone || record.mobile || '-'}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      dataIndex: 'status',
      width: 120,
      filters: statusOptions.map(o => ({ text: o.label, value: o.value as string })),
      onFilter: (value, record) => record.status === value,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status?.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
      sorter: true,
    },
    {
      title: 'Industry',
      key: 'industry',
      dataIndex: 'industry',
      width: 140,
      render: (industry: string) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <GlobalOutlined style={{ color: '#6366f1' }} />
          {industry || '-'}
        </span>
      ),
    },
    {
      title: 'Company Size',
      key: 'size',
      dataIndex: 'size',
      width: 130,
      render: (size: string) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <HomeOutlined style={{ color: '#f59e0b' }} />
          {size || '-'}
        </span>
      ),
    },
    {
      title: 'Assigned To',
      key: 'assignedTo',
      dataIndex: 'assignedTo',
      width: 160,
      render: (_: string, record) => {
        const id = record.assignedTo as string | undefined;
        const friendly = assignedToOptions.labelMap[id || ''] || (record as any).assignedToName;
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TeamOutlined />
            {friendly || id || 'Unassigned'}
          </span>
        );
      },
    },
    {
      title: 'Last Contact',
      key: 'lastContactDate',
      dataIndex: 'lastContactDate',
      width: 140,
      render: (date: string) => {
        if (!date) return '-';
        return formatDate(date);
      },
      sorter: true,
    },
    {
      title: 'Next Follow-up',
      key: 'nextFollowUpDate',
      dataIndex: 'nextFollowUpDate',
      width: 160,
      render: (date: string) => {
        if (!date) return '-';
        const followUpDate = new Date(date);
        const now = new Date();
        const isOverdue = followUpDate < now;

        return (
          <Tooltip title={formatDate(date)}>
            <span style={{ color: isOverdue ? '#ff4d4f' : 'inherit' }}>
              {formatDate(date)}
              {isOverdue && ' (Overdue)'}
            </span>
          </Tooltip>
        );
      },
      sorter: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 80,
      align: 'center' as const,
      render: (_, record) => {
        const menuItems: MenuProps['items'] = [] as MenuProps['items'];

        menuItems.push({
          key: 'view',
          icon: <EyeOutlined />,
          label: 'View Details',
          onClick: () => handleViewCustomer(record),
        });

        if (canUpdate) {
          menuItems.push({
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit Customer',
            onClick: () => handleEditCustomer(record),
          });
          menuItems.push({ type: 'divider' } as MenuProps['items'][number]);
        }

        if (canDelete) {
          menuItems.push({
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete Customer',
            danger: true,
            onClick: async () => {
              const confirmed = await confirmDelete({
                title: 'Delete Customer',
                description: `Are you sure you want to delete "${record.companyName}"? This action cannot be undone.`,
                okText: 'Delete',
                cancelText: 'Cancel',
              });
              if (confirmed) {
                await handleDelete(record);
              }
            },
          });
        }

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined style={{ fontSize: 16 }} />}
            />
          </Dropdown>
        );
      },
    },
  ];


  // Auto-correct pagination when filtered data length changes (e.g., after deleting last page items)
  React.useEffect(() => {
    const total = filteredCustomers.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (page > totalPages) {
      setPage(totalPages);
    } else if (page < 1) {
      setPage(1);
    }
  }, [filteredCustomers.length, pageSize, page]);

  const pagedCustomers = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredCustomers.slice(start, end);
  }, [filteredCustomers, page, pageSize]);

  // Loading state
  if (moduleLoading) {
    return <PageLoader message="Loading customers..." tip="Fetching customer data and statistics" />;
  }

  // Error state
  if (error) {
    return (
      <AccessDenied
        variant="result"
        title="Error Loading Customers"
        description={`Failed to load customers: ${error.message}`}
        showHomeButton={true}
      />
    );
  }

  // Permission check
  if (!canRead) {
    return (
      <AccessDenied
        variant="result"
        resource="customers"
        showHomeButton={true}
      />
    );
  }

  return (
    <>
      {/* Page Header with Breadcrumbs */}
      <PageHeader
        title="Customer Management"
        description="Manage customer accounts and relationships"
        breadcrumb={{
          items: [
            { title: 'Dashboard', path: '/tenant/dashboard' },
            { title: 'Customers' },
          ],
        }}
        extra={
          <Space>
            <RefreshButton
              tooltip="Reload customers and stats"
              onRefresh={() => { void refresh(); }}
            />
            {canCreate && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateCustomer}
              >
                New Customer
              </Button>
            )}
          </Space>
        }
      />

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        {/* Statistics */}
        <StatsGrid
          items={[
            {
              title: 'Total Customers',
              value: stats?.totalCustomers ?? 0,
              description: 'All customers in system',
              icon: <TeamOutlined />,
              color: 'primary',
              loading: moduleLoading,
            },
            {
              title: 'Active',
              value: stats?.activeCustomers ?? 0,
              description: 'Currently active customers',
              icon: <CheckCircleOutlined />,
              color: 'success',
              loading: moduleLoading,
            },
            {
              title: 'Prospects',
              value: stats?.prospectCustomers ?? 0,
              description: 'Potential conversions',
              icon: <TagOutlined />,
              color: 'warning',
              loading: moduleLoading,
            },
            {
              title: 'Inactive',
              value: stats?.inactiveCustomers ?? 0,
              description: 'Needs re-engagement',
              icon: <ClockCircleOutlined />,
              color: 'error',
              loading: moduleLoading,
            },
          ]}
          colProps={{ xs: 24, sm: 12, md: 12, lg: 6 }}
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search company, contact, email"
              prefix={<SearchOutlined />}
              allowClear
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              size="large"
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Status"
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={handleStatusFilterChange}
              size="large"
            >
              <Option value="all">All Status</Option>
              {statusOptions.map(o => (
                <Option key={o.value} value={o.value}>{o.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Industry"
              style={{ width: '100%' }}
              value={industryFilter}
              onChange={handleIndustryFilterChange}
              size="large"
              loading={loadingIndustry}
            >
              <Option value="all">All Industries</Option>
              {industryOptionsRef.map(o => (
                <Option key={o.value} value={o.value}>{o.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Company Size"
              style={{ width: '100%' }}
              value={sizeFilter}
              onChange={handleSizeFilterChange}
              size="large"
              loading={loadingSizes}
            >
              <Option value="all">All Sizes</Option>
              {sizeOptionsRef.map(o => (
                <Option key={o.value} value={o.value}>{o.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Assigned To"
              style={{ width: '100%' }}
              value={assignedToFilter}
              onChange={handleAssignedToFilterChange}
              size="large"
              loading={assignedToOptions.loading}
            >
              <Option value="all">All Owners</Option>
              {assignedToOptions.options.map(o => (
                <Option key={o.value} value={o.value}>{o.label}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        {/* Import/Export Toolbar */}
        <div style={{ marginBottom: 16 }}>
          <ImportExportToolbar
            onImport={handleImport}
            onExport={handleExport}
            isImporting={isImporting}
            isExporting={isExporting}
            selectedCount={selectedCount}
            totalCount={filteredCustomers.length}
            canImport={canCreate}
            canExport={canRead}
            importFormats={['.csv', '.json']}
            exportFormats={['csv', 'json']}
          />
        </div>

        {/* Batch Actions Toolbar */}
        <BatchActionsToolbar
          selectedCount={selectedCount}
          totalCount={filteredCustomers.length}
          onClearSelection={clearSelection}
          selectionMessage={() => ''}
          actions={[
            {
              label: 'Delete',
              icon: Trash2,
              onClick: async () => {
                void batchDelete(selectedIds); // Fire and forget, notification handled by hook
              },
              variant: 'destructive',
              loading: isDeleting,
              disabled: !canDelete || isDeleting,
              tooltip: canDelete ? 'Delete selected customers' : 'No permission to delete',
              confirmTitle: 'Delete Customers',
              confirmMessage: (
                <div>
                  <p>
                    <strong>You are about to delete {selectedCount} customer{selectedCount === 1 ? '' : 's'}.</strong>
                  </p>
                  <p style={{ marginTop: 12, color: '#666', fontSize: 13 }}>
                    This action cannot be undone. All associated data and history will be permanently removed.
                  </p>
                </div>
              ),
            },
          ]}
          className="mb-4"
        />

        {customersList.length === 0 && !moduleLoading ? (
          <Empty description="No customers found" />
        ) : (
          <EnterpriseTable<Customer>
            columns={columns}
            dataSource={pagedCustomers}
            rowKey="id"
            loading={moduleLoading || loadingStatus || loadingIndustry || loadingSizes || loadingTypes || assignedToOptions.loading}
            pagination={{
              current: page,
              pageSize,
              total: filteredCustomers.length,
              showSizeChanger: true,
              showQuickJumper: true,
              onChange: (nextPage, nextPageSize) => {
                setPage(nextPage);
                setPageSize(nextPageSize || 20);
              },
              showTotal: (total) => `Total ${total} customers`
            }}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: <Empty description="No data" /> }}
            enableAutoScrollTop={true}
            scrollTopBehavior="smooth"
            scrollOffset={16}
          />
        )}
      </Card>

      {/* Form Drawer */}
      <CustomerFormDrawer
        open={isFormOpen}
        customer={selectedCustomer}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedCustomer(null);
          setIsEditMode(false);
        }}
        onSuccess={() => {
          setIsFormOpen(false);
          setSelectedCustomer(null);
          setIsEditMode(false);
          void refresh();
        }}
        onSubmit={handleFormSubmit}
        statusOptions={statusOptions}
        industryOptions={industryOptionsRef}
        sizeOptions={sizeOptionsRef}
        typeOptions={typeOptionsRef}
        assignedToOptions={assignedToOptions.options}
        isLoading={createCustomer.isPending || updateCustomer.isPending}
      />

      {/* Detail Drawer */}
      <CustomerDetailDrawer
        open={isDetailOpen}
        customer={selectedCustomer}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedCustomer(null);
        }}
        onEdit={() => {
          setIsDetailOpen(false);
          handleEditCustomer(selectedCustomer!);
        }}
        onDelete={async () => {
          setIsDetailOpen(false);
          if (selectedCustomer) {
            await handleDelete(selectedCustomer);
          }
        }}
      />
    </>
  );
};

export default CustomerListPageEnhanced;
