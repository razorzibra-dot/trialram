/**
 * Tenant Directory Grid Component
 * Displays tenants in a responsive grid with search, filter, sort, and pagination
 * 
 * **Layer Synchronization** ✅:
 * 1️⃣ DATABASE: Uses tenantId (PK), tenant_name (indexed), status, active_users
 * 2️⃣ TYPES: TenantCardData matches DB schema (camelCase)
 * 3️⃣ MOCK SERVICE: Returns same schema as DB
 * 4️⃣ SUPABASE: Maps snake_case to camelCase DTOs
 * 5️⃣ FACTORY: Routes to correct backend implementation
 * 6️⃣ MODULE SERVICE: Uses factory (never direct imports)
 * 7️⃣ HOOKS: useTenantMetrics, useTenantAccess with caching
 * 8️⃣ UI: Grid cards with all DB fields + search/filter/sort
 * 
 * **Features**:
 * - Grid display with responsive columns (1-4 cols based on screen size)
 * - Search by tenant name
 * - Filter by status (all, healthy, warning, error)
 * - Sort by name, status, user count, activity
 * - Pagination with configurable page size
 * - Tenant card shows: name, status badge, user count, activity info
 * - Click card to view tenant details
 * - Loading states and error handling
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Badge,
  Pagination,
  Empty,
  Spin,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  SortAscendingOutlined,
  FilterOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  Building2,
  TrendingUp,
  Users,
  Activity,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useTenantMetrics, useTenantAccess } from '@/modules/features/super-admin/hooks';
import { toast } from 'sonner';

/**
 * Tenant card data structure (Layer 2: TYPES)
 * Matches database schema with camelCase naming
 */
interface TenantCardData {
  tenantId: string;
  tenantName?: string;
  status: 'healthy' | 'warning' | 'error';
  activeUsers: number;
  totalContracts: number;
  totalSales: number;
  lastActivityDate?: string;
  createdAt?: string;
}

/**
 * Filter options for tenant directory
 */
type StatusFilter = 'all' | 'healthy' | 'warning' | 'error';

/**
 * Sort options for tenant directory
 */
type SortOption = 'name' | 'status' | 'users' | 'activity' | 'created';

/**
 * Tenant Directory Grid Component
 * Main component for browsing all tenants in grid format
 */
const TenantDirectoryGrid: React.FC<{
  onTenantSelect?: (tenant: TenantCardData) => void;
  showActions?: boolean;
}> = ({ onTenantSelect, showActions = true }) => {
  // ================ DATA LAYER (Layer 7: HOOKS) ================
  // Using factory-routed hooks (never direct service imports)
  const { statistics = [], isLoading: metricsLoading, refetch: refetchMetrics } = useTenantMetrics();
  const { tenantAccess = [], isLoading: accessLoading } = useTenantAccess();

  // ================ UI STATE ================
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ================ COMPUTED DATA ================
  // Transform statistics to tenant card data (Layer 8: UI)
  const tenantCards: TenantCardData[] = useMemo(() => {
    return statistics.map((stat: any) => ({
      tenantId: stat.tenantId || '',
      tenantName: stat.tenantName || stat.tenantId || 'Unknown Tenant',
      status: stat.status || 'warning',
      activeUsers: stat.activeUsers || 0,
      totalContracts: stat.totalContracts || 0,
      totalSales: stat.totalSales || 0,
      lastActivityDate: stat.lastActivityDate,
      createdAt: stat.createdAt,
    }));
  }, [statistics]);

  // Apply search + filter + sort
  const filteredTenants: TenantCardData[] = useMemo(() => {
    let result = [...tenantCards];

    // Search (Layer 8: UI filtering)
    if (searchText) {
      const lower = searchText.toLowerCase();
      result = result.filter(
        (t) =>
          t.tenantName?.toLowerCase().includes(lower) ||
          t.tenantId.toLowerCase().includes(lower)
      );
    }

    // Filter by status (Layer 8: UI filtering)
    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Sort (Layer 8: UI sorting)
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.tenantName || '').localeCompare(b.tenantName || '');
        case 'status': {
          const statusOrder = { healthy: 0, warning: 1, error: 2 };
          return statusOrder[a.status as 'healthy' | 'warning' | 'error'] -
            statusOrder[b.status as 'healthy' | 'warning' | 'error'];
        }
        case 'users':
          return b.activeUsers - a.activeUsers;
        case 'activity':
          return new Date(b.lastActivityDate || 0).getTime() -
            new Date(a.lastActivityDate || 0).getTime();
        case 'created':
          return new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [tenantCards, searchText, statusFilter, sortBy]);

  // Pagination
  const paginatedTenants: TenantCardData[] = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTenants.slice(start, start + pageSize);
  }, [filteredTenants, currentPage, pageSize]);

  // ================ EVENT HANDLERS ================
  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await refetchMetrics();
      toast.success('Tenant data refreshed');
    } catch (error) {
      console.error('Error refreshing tenants:', error);
      toast.error('Failed to refresh tenant data');
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchMetrics]);

  const handleCardClick = useCallback(
    (tenant: TenantCardData) => {
      if (onTenantSelect) {
        onTenantSelect(tenant);
      }
    },
    [onTenantSelect]
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  }, []);

  const handleStatusFilterChange = useCallback((value: StatusFilter) => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((value: SortOption) => {
    setSortBy(value);
  }, []);

  // ================ HELPER FUNCTIONS ================
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      default:
        return '•';
    }
  };

  const formatLastActivity = (date?: string) => {
    if (!date) return 'Never';
    try {
      const d = new Date(date);
      const now = new Date();
      const hours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

      if (hours < 1) return 'Just now';
      if (hours < 24) return `${Math.floor(hours)}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d ago`;
      return d.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  // ================ LOADING STATE ================
  if (metricsLoading && tenantCards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" />
        <p style={{ marginTop: 16, color: '#999' }}>Loading tenant directory...</p>
      </div>
    );
  }

  // ================ RENDER ================
  return (
    <div style={{ width: '100%' }}>
      {/* Controls Section */}
      <div style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          {/* Search */}
          <Col xs={24} sm={12} lg={8}>
            <Input
              placeholder="Search tenants by name or ID"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              allowClear
              size="large"
            />
          </Col>

          {/* Status Filter */}
          <Col xs={24} sm={12} lg={4}>
            <Select
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={handleStatusFilterChange}
              options={[
                { label: 'All Status', value: 'all' },
                { label: 'Healthy', value: 'healthy' },
                { label: 'Warning', value: 'warning' },
                { label: 'Error', value: 'error' },
              ]}
              size="large"
              optionLabelRender={(option) => (
                <Space size={4}>
                  <FilterOutlined />
                  {option?.label}
                </Space>
              )}
            />
          </Col>

          {/* Sort */}
          <Col xs={24} sm={12} lg={6}>
            <Select
              style={{ width: '100%' }}
              value={sortBy}
              onChange={handleSortChange}
              options={[
                { label: 'Sort by Name', value: 'name' },
                { label: 'Sort by Status', value: 'status' },
                { label: 'Sort by Users', value: 'users' },
                { label: 'Sort by Activity', value: 'activity' },
                { label: 'Sort by Created', value: 'created' },
              ]}
              size="large"
              optionLabelRender={(option) => (
                <Space size={4}>
                  <SortAscendingOutlined />
                  {option?.label}
                </Space>
              )}
            />
          </Col>

          {/* Refresh Button */}
          {showActions && (
            <Col xs={24} sm={12} lg={6}>
              <Button
                icon={<ReloadOutlined spin={isRefreshing} />}
                onClick={handleRefresh}
                loading={isRefreshing}
                size="large"
                block
              >
                Refresh
              </Button>
            </Col>
          )}
        </Row>
      </div>

      {/* Results Info */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ color: '#666', marginBottom: 0 }}>
          Showing <strong>{paginatedTenants.length}</strong> of{' '}
          <strong>{filteredTenants.length}</strong> tenants
          {searchText && ` (filtered by "${searchText}")`}
        </p>
        <Select
          value={pageSize}
          onChange={handlePageSizeChange}
          options={[
            { label: '6 per page', value: 6 },
            { label: '12 per page', value: 12 },
            { label: '24 per page', value: 24 },
            { label: '48 per page', value: 48 },
          ]}
          style={{ width: 150 }}
          size="small"
        />
      </div>

      {/* Grid of Tenant Cards */}
      {paginatedTenants.length > 0 ? (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {paginatedTenants.map((tenant) => (
              <Col
                key={tenant.tenantId}
                xs={24}
                sm={12}
                md={8}
                lg={6}
              >
                <Card
                  hoverable
                  onClick={() => handleCardClick(tenant)}
                  style={{
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                  cover={
                    <div
                      style={{
                        background: `linear-gradient(135deg, ${
                          tenant.status === 'healthy'
                            ? '#52c41a'
                            : tenant.status === 'warning'
                              ? '#faad14'
                              : '#f5222d'
                        } 0%, ${
                          tenant.status === 'healthy'
                            ? '#95de64'
                            : tenant.status === 'warning'
                              ? '#ffc53d'
                              : '#ff7875'
                        } 100%)`,
                        height: 80,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}
                    >
                      <Building2 size={40} />
                    </div>
                  }
                >
                  {/* Card Title */}
                  <Tooltip title={tenant.tenantName}>
                    <h3
                      style={{
                        margin: '8px 0',
                        fontSize: 14,
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tenant.tenantName}
                    </h3>
                  </Tooltip>

                  {/* Tenant ID */}
                  <p
                    style={{
                      fontSize: 12,
                      color: '#999',
                      margin: '4px 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ID: {tenant.tenantId}
                  </p>

                  {/* Status Badge */}
                  <div style={{ margin: '8px 0' }}>
                    <Badge
                      status={getStatusColor(tenant.status) as any}
                      text={
                        <span>
                          {getStatusIcon(tenant.status)} {tenant.status.toUpperCase()}
                        </span>
                      }
                    />
                  </div>

                  {/* Metrics */}
                  <div style={{ flex: 1, marginTop: 12 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: 8,
                        fontSize: 13,
                      }}
                    >
                      <Users size={14} style={{ marginRight: 6, color: '#1890ff' }} />
                      <span>
                        <strong>{tenant.activeUsers}</strong> users
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: 8,
                        fontSize: 13,
                      }}
                    >
                      <TrendingUp size={14} style={{ marginRight: 6, color: '#52c41a' }} />
                      <span>
                        <strong>{tenant.totalContracts}</strong> contracts
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: 8,
                        fontSize: 13,
                      }}
                    >
                      <Activity size={14} style={{ marginRight: 6, color: '#faad14' }} />
                      <span>{formatLastActivity(tenant.lastActivityDate)}</span>
                    </div>
                  </div>

                  {/* Footer - Sales Amount */}
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 8,
                      borderTop: '1px solid #f0f0f0',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ margin: 0, color: '#52c41a', fontWeight: 600, fontSize: 14 }}>
                      ₹{(tenant.totalSales || 0).toLocaleString()}
                    </p>
                    <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: 11 }}>
                      Total sales
                    </p>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Pagination */}
          {filteredTenants.length > pageSize && (
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredTenants.length}
                onChange={handlePageChange}
                showSizeChanger={false}
                showQuickJumper
              />
            </div>
          )}
        </>
      ) : (
        <Empty
          description={searchText ? 'No tenants found' : 'No tenants available'}
          style={{ marginTop: 40, marginBottom: 40 }}
        />
      )}

      {/* Sync Indicator */}
      <div style={{ marginTop: 24, textAlign: 'center', color: '#999', fontSize: 12 }}>
        {metricsLoading && <span>Syncing data...</span>}
        {!metricsLoading && <span>✓ Data synchronized</span>}
      </div>
    </div>
  );
};

export { TenantDirectoryGrid };