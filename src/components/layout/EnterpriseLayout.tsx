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
 * ✅ Database-driven: Navigation items fetched from navigation_items table
 * @see src/hooks/useNavigation.ts for database-driven navigation hook
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
import { useNavigation } from '@/hooks/useNavigation';
import { createNavigationFilterContext, getPermissionAwareBreadcrumbs } from '@/utils/navigationFilter';
import type { FilteredNavigationItem } from '@/utils/navigationFilter';

const { Header, Sider, Content } = Layout;

interface EnterpriseLayoutProps {
  children: React.ReactNode;
}

export const EnterpriseLayout: React.FC<EnterpriseLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasRole, hasPermission, getUserPermissions } = useAuth();

  // ✅ Database-driven: Fetch navigation items from database
  const { filteredItems: filteredNavItems, configItems, isLoading: navLoading } = useNavigation();

  // Debug logging for navigation items
  React.useEffect(() => {
    console.log('[EnterpriseLayout] 🎯 Filtered navigation items:', filteredNavItems.length);
    filteredNavItems.forEach(item => {
      console.log(`[EnterpriseLayout] 📋 Menu item: "${item.label}" (key: ${item.key}, visible: ${item.isVisible})`);
      if (item.filteredChildren) {
        item.filteredChildren.forEach(child => {
          console.log(`[EnterpriseLayout]   └─ "${child.label}" (key: ${child.key}, visible: ${child.isVisible})`);
        });
      }
    });
  }, [filteredNavItems]);
  const breadcrumbItems = useMemo(() => {
    if (!user || !configItems || configItems.length === 0) return [];

    const userPermissions = getUserPermissions();
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

    // Find breadcrumb path from database navigation items
    const findBreadcrumbPath = (items: typeof configItems, pathname: string): typeof configItems => {
      for (const item of items) {
        if (item.routePath === pathname || item.key === pathname) {
          return [item];
        }
        if (item.children) {
          const childPath = findBreadcrumbPath(item.children, pathname);
          if (childPath.length > 0) {
            return [item, ...childPath];
          }
        }
      }
      return [];
    };

    const path = findBreadcrumbPath(configItems, location.pathname);
    path.forEach(item => {
      if (!item.isSection && item.routePath) {
        breadcrumbs.push({
          title: item.label,
          href: item.routePath,
        });
      }
    });

    return breadcrumbs;
  }, [user, location.pathname, configItems, getUserPermissions]);

  /**
   * Convert filtered navigation config to Ant Design menu items
   * ✅ Database-driven: Uses navigation items from database
   */
  const getMenuItems = (): MenuProps['items'] => {
    // ✅ Database-driven: Icon mapping can be extended to use item.icon from database
    // For now, keeping hardcoded icons for UI display only (acceptable per rules)
    const iconMap: Record<string, React.ReactNode> = {
      '/tenant/dashboard': <DashboardOutlined />,
      '/tenant/customers': <TeamOutlined />,
      '/tenant/deals': <ShoppingCartOutlined />,
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
      '/super-admin': <SafetyOutlined />,
    };

    const convertToMenuItems = (items: FilteredNavigationItem[]): MenuProps['items'] => {
      return items.map((item) => {
        // Section items with children become submenus (not groups)
        if (item.isSection && item.filteredChildren && item.filteredChildren.length > 0) {
          return {
            key: item.key,
            icon: iconMap[item.key] || (item.icon ? <span>{item.icon}</span> : <AppstoreOutlined />),
            label: item.label,
            children: convertToMenuItems(item.filteredChildren),
          };
        }
  
        // Section items without children become groups (visual separators)
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
            icon: iconMap[item.key] || (item.icon ? <span>{item.icon}</span> : <AppstoreOutlined />),
            label: item.label,
            children: convertToMenuItems(item.filteredChildren),
          };
        }
  
        // Regular items - use routePath from database if available
        const routePath = item.routePath || item.key;
        return {
          key: item.key,
          icon: iconMap[item.key] || (item.icon ? <span>{item.icon}</span> : <AppstoreOutlined />),
          label: item.label,
          onClick: () => navigate(routePath),
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
          defaultOpenKeys={['/deals', '/contracts', '/users', '/configuration', '/super-admin']}
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