/**
 * Super Admin Users Page - Super User Management
 * Complete super user lifecycle management (create, edit, delete, grant access)
 * 
 * **Layer Synchronization**: 
 * - Uses factory-routed hooks from Phase 7 (useSuperUserManagement)
 * - Displays Phase 8 components (SuperUserList, SuperUserFormPanel, SuperUserDetailPanel)
 * - Integrates with Phase 5 service factory pattern
 * - No direct service imports (hooks only)
 * 
 * **Features**:
 * - List all super users with sorting/filtering
 * - Create new super user with tenant assignment
 * - Edit super user access level
 * - Grant additional tenant access
 * - View super user details
 * - Delete super user with confirmation
 * - Comprehensive audit trail
 * - Advanced search and filtering
 * - Pagination with configurable page size
 */
import React, { useState, useMemo } from 'react';
import { Row, Col, Card, Button, Space, Alert, Drawer, Input, Select, Tag, Empty } from 'antd';
import { 
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, StatCard } from '@/components/common';
import { 
  useSuperUserManagement,
  useTenantAccess 
} from '@/modules/features/super-admin/hooks';
import { 
  SuperUserList,
  SuperUserFormPanel,
  SuperUserDetailPanel,
  TenantAccessList,
  GrantAccessModal
} from '@/modules/features/super-admin/components';
import { SuperAdminDTO } from '@/modules/features/super-admin/types/superAdminManagement';
import { toast } from 'sonner';

/**
 * Super user management page with full CRUD operations
 * Enables admins to manage super user accounts and their tenant access
 */
const SuperAdminUsersPage: React.FC = () => {
  const { hasPermission } = useAuth();
  
  // Hooks for data management with factory routing
  const { 
    superUsers = [], 
    isLoading: usersLoading, 
    error: usersError,
    createSuperUser,
    updateSuperUser,
    deleteSuperUser,
    refetch
  } = useSuperUserManagement();
  
  const { 
    tenantAccess = [],
    isLoading: accessLoading,
    grantAccess,
    revokeAccess
  } = useTenantAccess();

  // UI State
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedSuperUser, setSelectedSuperUser] = useState<SuperAdminDTO | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAccessLevel, setFilterAccessLevel] = useState<string | undefined>(undefined);
  const [filterSuperAdmin, setFilterSuperAdmin] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter and search logic (must be above permission check to avoid conditional hook call)
  const filteredUsers = useMemo(() => {
    let result = [...(superUsers || [])];

    // Apply search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(user =>
        (user.email?.toLowerCase() || '').includes(lowerQuery) ||
        (user.name?.toLowerCase() || '').includes(lowerQuery) ||
        (user.id?.toLowerCase() || '').includes(lowerQuery)
      );
    }

    // Apply access level filter
    if (filterAccessLevel) {
      result = result.filter(user => user.accessLevel === filterAccessLevel);
    }

    // Apply super admin filter
    if (filterSuperAdmin !== undefined) {
      result = result.filter(user => user.isSuperAdmin === filterSuperAdmin);
    }

    return result;
  }, [superUsers, searchQuery, filterAccessLevel, filterSuperAdmin]);

  // Calculate stats
  const totalSuperUsers = superUsers.length;
  const fullAccessCount = superUsers.filter(u => u.accessLevel === 'full').length;
  const superAdminCount = superUsers.filter(u => u.isSuperAdmin).length;
  const isLoading = usersLoading || accessLoading;
  
  // Pagination
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handle create new super user
  const handleCreateNew = () => {
    setSelectedSuperUser(null);
    setIsEditMode(false);
    setIsFormDrawerOpen(true);
  };

  // Handle edit super user
  const handleEditSuperUser = (superUser: SuperAdminDTO) => {
    setSelectedSuperUser(superUser);
    setIsEditMode(true);
    setIsFormDrawerOpen(true);
  };

  // Handle view details
  const handleViewDetails = (superUser: SuperAdminDTO) => {
    setSelectedSuperUser(superUser);
    setIsDetailDrawerOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await deleteSuperUser(id);
      toast.success('Super user deleted successfully');
      setIsDetailDrawerOpen(false);
      await refetch();
    } catch (error) {
      toast.error('Failed to delete super user');
    }
  };

  // Handle grant access
  const handleGrantAccess = (superUser: SuperAdminDTO) => {
    setSelectedSuperUser(superUser);
    setIsAccessModalOpen(true);
  };

  // Handle form submit
  const handleFormSubmit = async (formData: SuperAdminDTO) => {
    try {
      if (isEditMode && selectedSuperUser) {
        await updateSuperUser(selectedSuperUser.id, formData);
        toast.success('Super user updated successfully');
      } else {
        await createSuperUser(formData);
        toast.success('Super user created successfully');
      }
      setIsFormDrawerOpen(false);
      setSelectedSuperUser(null);
      await refetch();
    } catch (error) {
      toast.error(isEditMode ? 'Failed to update super user' : 'Failed to create super user');
    }
  };

  // Permission check - render conditional content instead of early return
  const hasPermission_check = hasPermission('super_user:manage_users');

  if (!hasPermission_check) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Access Denied"
          description="You don't have permission to manage super users."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Super Users Management"
        description="Manage super user accounts and tenant access assignments"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined spin={isLoading} />}
              onClick={() => refetch()}
              loading={isLoading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateNew}
            >
              Create Super User
            </Button>
          </Space>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Error alerts */}
        {usersError && (
          <Alert
            message="Error loading super users"
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Statistics Cards */} 
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Super Users"
              value={totalSuperUsers}
              description={`${totalSuperUsers} administrators`}
              icon={Users}
              color="primary"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Full Access"
              value={fullAccessCount}
              description={`${fullAccessCount} unrestricted access`}
              icon={Users}
              color="success"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Super Admins"
              value={superAdminCount}
              description={`${superAdminCount} highest level`}
              icon={Users}
              color="warning"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Multi-Tenant"
              value={tenantAccess.length}
              description={`${tenantAccess.length} access records`}
              icon={Users}
              color="info"
              loading={accessLoading}
            />
          </Col>
        </Row>

        {/* Search and Filter Section */}
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} lg={8}>
              <Input
                placeholder="Search by email, name, or ID..."
                prefix={<SearchOutlined />}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                allowClear
                size="large"
              />
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Select
                placeholder="Filter by access level"
                value={filterAccessLevel}
                onChange={(value) => {
                  setFilterAccessLevel(value);
                  setCurrentPage(1);
                }}
                allowClear
                style={{ width: '100%' }}
                options={[
                  { label: 'Full Access', value: 'full' },
                  { label: 'Limited Access', value: 'limited' },
                  { label: 'Read Only', value: 'read_only' },
                  { label: 'Specific Modules', value: 'specific_modules' },
                ]}
              />
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Select
                placeholder="Filter by super admin"
                value={filterSuperAdmin}
                onChange={(value) => {
                  setFilterSuperAdmin(value === 'true' ? true : value === 'false' ? false : undefined);
                  setCurrentPage(1);
                }}
                allowClear
                style={{ width: '100%' }}
                options={[
                  { label: 'Super Admin Only', value: 'true' },
                  { label: 'Regular Users', value: 'false' },
                ]}
              />
            </Col>
            <Col xs={24} sm={12} lg={8} style={{ textAlign: 'right' }}>
              <Space>
                <Button
                  icon={<ClearOutlined />}
                  onClick={() => {
                    setSearchQuery('');
                    setFilterAccessLevel(undefined);
                    setFilterSuperAdmin(undefined);
                    setCurrentPage(1);
                  }}
                >
                  Clear Filters
                </Button>
                <span style={{ color: '#666' }}>
                  {filteredUsers.length} of {totalSuperUsers} users
                </span>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Main Super User List */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24}>
            <Card variant="borderless">
              {filteredUsers.length === 0 ? (
                <Empty description="No super users found" />
              ) : (
                <>
                  <SuperUserList
                    onEdit={handleEditSuperUser}
                    onViewDetails={handleViewDetails}
                    onDelete={handleDelete}
                    onGrantAccess={handleGrantAccess}
                  />
                  {/* Pagination */}
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <span>Page size:</span>
                      <Select
                        value={pageSize}
                        onChange={setPageSize}
                        style={{ width: 80 }}
                        options={[
                          { label: '5', value: 5 },
                          { label: '10', value: 10 },
                          { label: '20', value: 20 },
                          { label: '50', value: 50 },
                        ]}
                      />
                    </Space>
                    <Space>
                      <span>
                        Page {currentPage} of {Math.ceil(filteredUsers.length / pageSize)}
                      </span>
                      <Button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        disabled={currentPage >= Math.ceil(filteredUsers.length / pageSize)}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        Next
                      </Button>
                    </Space>
                  </div>
                </>
              )}
            </Card>
          </Col>
        </Row>
      </div>

      {/* Form Drawer for Create/Edit */}
      <Drawer
        title={isEditMode ? 'Edit Super User' : 'Create Super User'}
        placement="right"
        onClose={() => setIsFormDrawerOpen(false)}
        open={isFormDrawerOpen}
        width={500}
      >
        {isFormDrawerOpen && (
          <SuperUserFormPanel
            superUser={isEditMode ? selectedSuperUser : undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormDrawerOpen(false)}
            isLoading={isLoading}
          />
        )}
      </Drawer>

      {/* Detail Drawer */}
      <Drawer
        title="Super User Details"
        placement="right"
        onClose={() => setIsDetailDrawerOpen(false)}
        open={isDetailDrawerOpen}
        width={500}
      >
        {isDetailDrawerOpen && selectedSuperUser && (
          <SuperUserDetailPanel
            superUser={selectedSuperUser}
            onEdit={() => {
              setIsDetailDrawerOpen(false);
              handleEditSuperUser(selectedSuperUser);
            }}
            onDelete={() => handleDelete(selectedSuperUser.id)}
            onGrantAccess={() => {
              setIsDetailDrawerOpen(false);
              handleGrantAccess(selectedSuperUser);
            }}
            isLoading={isLoading}
          />
        )}
      </Drawer>

      {/* Grant Access Modal */}
      {isAccessModalOpen && selectedSuperUser && (
        <GrantAccessModal
          superUserId={selectedSuperUser.id}
          onClose={() => setIsAccessModalOpen(false)}
          onSuccess={async () => {
            toast.success('Access granted successfully');
            setIsAccessModalOpen(false);
            await refetch();
          }}
          isLoading={accessLoading}
        />
      )}
    </>
  );
};

export default SuperAdminUsersPage;