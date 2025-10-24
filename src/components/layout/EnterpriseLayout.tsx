/**
 * Enterprise Layout Component
 * Salesforce-inspired professional layout with sidebar navigation
 * Consistent across all pages (Admin, Super Admin, Regular Users)
 * 
 * Features:
 * - Permission-based navigation filtering
 * - Role-based access control
 * - Dynamic section visibility (only shows when children are visible)
 * - Full RBAC integration with AuthContext
 * - Responsive design with collapsed sidebar
 * 
 * @see src/config/navigationPermissions.ts for navigation configuration
 * @see src/utils/navigationFilter.ts for filtering logic
 */

import React, { useState, useMemo } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Breadcrumb, Space, Divider } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  SettingOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  ProfileOutlined,
  SafetyOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  CustomerServiceOutlined,
  BarChartOutlined,
  ToolOutlined,
  DatabaseOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { navigationConfig } from '@/config/navigationPermissions';
import {
  filterNavigationItems,
  createNavigationFilterContext,
  getPermissionAwareBreadcrumbs,
} from '@/utils/navigationFilter';
import type { FilteredNavigationItem } from '@/utils/navigationFilter';

const { Header, Sider, Content } = Layout;

interface EnterpriseLayoutProps {
  children: React.ReactNode;
}

export const EnterpriseLayout: React.FC<EnterpriseLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasRole, hasPermission } = useAuth();

  /**
   * Get user permissions based on role
   * Maps role to their permissions for navigation purposes
   * This determines which menu items are visible
   * 
   * Note: In production, this should fetch from the actual permission system
   */
  const getUserPermissions = (role: string): string[] => {
    // Map roles to their permissions for navigation purposes
    // This determines which menu items are visible
    const rolePermissionMap: Record<string, string[]> = {
      super_admin: [
        'read',
        'write',
        'delete',
        'manage_customers',
        'manage_sales',
        'manage_tickets',
        'manage_complaints',
        'manage_contracts',
        'manage_service_contracts',
        'manage_products',
        'manage_product_sales',
        'manage_job_works',
        'manage_users',
        'manage_roles',
        'view_analytics',
        'manage_settings',
        'manage_companies',
        'platform_admin',
        'super_admin',
        'manage_tenants',
        'system_monitoring',
      ],
      admin: [
        'read',
        'write',
        'delete',
        'manage_customers',
        'manage_sales',
        'manage_tickets',
        'manage_complaints',
        'manage_contracts',
        'manage_service_contracts',
        'manage_products',
        'manage_product_sales',
        'manage_job_works',
        'manage_users',
        'manage_roles',
        'view_analytics',
        'manage_settings',
        'manage_companies',
      ],
      manager: [
        'read',
        'write',
        'manage_customers',
        'manage_sales',
        'manage_tickets',
        'manage_complaints',
        'manage_contracts',
        'manage_service_contracts',
        'manage_products',
        'manage_product_sales',
        'view_analytics',
      ],
      engineer: [
        'read',
        'write',
        'manage_products',
        'manage_product_sales',
        'manage_job_works',
        'manage_tickets',
      ],
      agent: ['read', 'write', 'manage_customers', 'manage_tickets', 'manage_complaints'],
      customer: ['read'],
    };

    return rolePermissionMap[role] || ['read'];
  };

  /**
   * Get permission-filtered navigation items
   * 
   * Memoized computation to avoid recalculating on every render.
   * Filters navigation items based on user permissions and roles.
   * Only includes items the user has access to.
   */
  const filteredNavItems = useMemo(() => {
    if (!user) return [];

    // Get user permissions from role mapping
    const userPermissions = getUserPermissions(user.role);

    const filterContext = createNavigationFilterContext(user.role, userPermissions);
    return filterNavigationItems(navigationConfig, filterContext);
  }, [user]);

  /**
   * Get permission-aware breadcrumbs
   */
  const breadcrumbItems = useMemo(() => {
    if (!user) return [];

    const userPermissions = getUserPermissions(user.role);
    const filterContext = createNavigationFilterContext(user.role, userPermissions);

    const breadcrumbs = [
      {
        title: (
          <span>
            <HomeOutlined style={{ marginRight: 4 }} />
            Home
          </span>
        ),
        href: '/',
      },
    ];

    return breadcrumbs;
  }, [user, location.pathname]);

  /**
   * Convert filtered navigation config to Ant Design menu items
   */
  const getMenuItems = (): MenuProps['items'] => {
    const iconMap: Record<string, React.ReactNode> = {
      '/tenant/dashboard': <DashboardOutlined />,
      '/tenant/customers': <TeamOutlined />,
      '/tenant/sales': <ShoppingCartOutlined />,
      '/tenant/product-sales': <ShoppingCartOutlined />,
      '/tenant/contracts': <FileTextOutlined />,
      '/tenant/service-contracts': <FileTextOutlined />,
      '/tenant/tickets': <CustomerServiceOutlined />,
      '/tenant/complaints': <CustomerServiceOutlined />,
      '/tenant/job-works': <ToolOutlined />,
      '/tenant/masters': <DatabaseOutlined />,
      '/tenant/users': <UserOutlined />,
      '/tenant/configuration': <SettingOutlined />,
      '/tenant/notifications': <BellOutlined />,
      '/tenant/logs': <FileTextOutlined />,
      '/super-admin': <SafetyOutlined />,
    };

    const convertToMenuItems = (items: FilteredNavigationItem[]): MenuProps['items'] => {
      return items.map((item) => {
        // Section items become groups
        if (item.isSection) {
          return {
            type: 'group',
            key: item.key,
            label: item.label,
          };
        }

        // Items with children become submenus
        if (item.filteredChildren && item.filteredChildren.length > 0) {
          return {
            key: item.key,
            icon: iconMap[item.key] || <AppstoreOutlined />,
            label: item.label,
            children: convertToMenuItems(item.filteredChildren),
          };
        }

        // Regular items
        return {
          key: item.key,
          icon: iconMap[item.key] || <AppstoreOutlined />,
          label: item.label,
          onClick: () => navigate(item.key),
        };
      });
    };

    return convertToMenuItems(filteredNavItems);
  };

  // User dropdown menu
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <ProfileOutlined />,
      label: 'My Profile',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/settings'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: logout,
      danger: true,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: '#FFFFFF',
          borderRight: '1px solid #E5E7EB',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 24px',
            borderBottom: '1px solid #E5E7EB',
            background: '#FFFFFF',
          }}
        >
          {collapsed ? (
            <AppstoreOutlined style={{ fontSize: 24, color: '#1B7CED' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <AppstoreOutlined style={{ fontSize: 28, color: '#1B7CED' }} />
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#111827',
                  letterSpacing: '-0.02em',
                }}
              >
                CRM Portal
              </span>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['/sales', '/contracts', '/users', '/configuration', '/super-admin']}
          items={getMenuItems()}
          style={{
            border: 'none',
            marginTop: 8,
          }}
        />
      </Sider>

      {/* Main Layout */}
      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'margin-left 0.2s' }}>
        {/* Header */}
        <Header
          style={{
            padding: '0 24px',
            background: '#FFFFFF',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 999,
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* Left Section */}
          <Space size="middle">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: 18,
                width: 40,
                height: 40,
              }}
            />
            <Divider type="vertical" style={{ height: 32 }} />
            <Breadcrumb items={breadcrumbItems} />
          </Space>

          {/* Right Section */}
          <Space size="middle">
            {/* Notifications */}
            <Badge count={5} size="small">
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: 18 }} />}
                onClick={() => navigate('/notifications')}
                style={{
                  width: 40,
                  height: 40,
                }}
              />
            </Badge>

            <Divider type="vertical" style={{ height: 32 }} />

            {/* User Profile */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  size={36}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1B7CED' }}
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </Avatar>
                {!collapsed && (
                  <div style={{ lineHeight: 1.3 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                      {user?.name || 'User'}
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>
                      {user?.role?.replace('_', ' ').toUpperCase() || 'User'}
                    </div>
                  </div>
                )}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Content */}
        <Content
          style={{
            margin: 0,
            padding: 0,
            background: '#F9FAFB',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default EnterpriseLayout;