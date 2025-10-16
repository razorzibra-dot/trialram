/**
 * Enterprise Layout Component
 * Salesforce-inspired professional layout with sidebar navigation
 * Consistent across all pages (Admin, Super Admin, Regular Users)
 */

import React, { useState } from 'react';
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

const { Header, Sider, Content } = Layout;

interface EnterpriseLayoutProps {
  children: React.ReactNode;
}

export const EnterpriseLayout: React.FC<EnterpriseLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Generate breadcrumb from current path
  const pathSnippets = location.pathname.split('/').filter((i) => i);
  const breadcrumbItems = [
    {
      title: (
        <span>
          <HomeOutlined style={{ marginRight: 4 }} />
          Home
        </span>
      ),
      href: '/',
    },
    ...pathSnippets.map((snippet, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
      const title = snippet.charAt(0).toUpperCase() + snippet.slice(1).replace(/-/g, ' ');
      return {
        title,
        href: url,
      };
    }),
  ];

  // Menu items based on user role
  const getMenuItems = (): MenuProps['items'] => {
    const commonItems: MenuProps['items'] = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        onClick: () => navigate('/dashboard'),
      },
      {
        key: '/customers',
        icon: <TeamOutlined />,
        label: 'Customers',
        onClick: () => navigate('/customers'),
      },
      {
        key: '/sales',
        icon: <ShoppingCartOutlined />,
        label: 'Sales',
        children: [
          {
            key: '/sales/opportunities',
            label: 'Opportunities',
            onClick: () => navigate('/sales/opportunities'),
          },
          {
            key: '/sales/product-sales',
            label: 'Product Sales',
            onClick: () => navigate('/sales/product-sales'),
          },
        ],
      },
      {
        key: '/contracts',
        icon: <FileTextOutlined />,
        label: 'Contracts',
        children: [
          {
            key: '/contracts/list',
            label: 'All Contracts',
            onClick: () => navigate('/contracts'),
          },
          {
            key: '/contracts/service',
            label: 'Service Contracts',
            onClick: () => navigate('/service-contracts'),
          },
        ],
      },
      {
        key: '/tickets',
        icon: <CustomerServiceOutlined />,
        label: 'Support Tickets',
        onClick: () => navigate('/tickets'),
      },
      {
        key: '/complaints',
        icon: <CustomerServiceOutlined />,
        label: 'Complaints',
        onClick: () => navigate('/complaints'),
      },
      {
        key: '/jobworks',
        icon: <ToolOutlined />,
        label: 'Job Works',
        onClick: () => navigate('/jobworks'),
      },
    ];

    const adminItems: MenuProps['items'] = [
      { type: 'divider' },
      {
        key: 'admin-section',
        label: 'Administration',
        type: 'group',
      },
      {
        key: '/masters',
        icon: <DatabaseOutlined />,
        label: 'Masters',
        children: [
          {
            key: '/masters/companies',
            label: 'Companies',
            onClick: () => navigate('/masters/companies'),
          },
          {
            key: '/masters/products',
            label: 'Products',
            onClick: () => navigate('/masters/products'),
          },
        ],
      },
      {
        key: '/users',
        icon: <UserOutlined />,
        label: 'User Management',
        children: [
          {
            key: '/users/list',
            label: 'Users',
            onClick: () => navigate('/users'),
          },
          {
            key: '/users/roles',
            label: 'Roles',
            onClick: () => navigate('/role-management'),
          },
          {
            key: '/users/permissions',
            label: 'Permissions',
            onClick: () => navigate('/permission-matrix'),
          },
        ],
      },
      {
        key: '/configuration',
        icon: <SettingOutlined />,
        label: 'Configuration',
        children: [
          {
            key: '/configuration/tenant',
            label: 'Tenant Settings',
            onClick: () => navigate('/tenant-configuration'),
          },
          {
            key: '/configuration/pdf-templates',
            label: 'PDF Templates',
            onClick: () => navigate('/pdf-templates'),
          },
        ],
      },
      {
        key: '/notifications',
        icon: <BellOutlined />,
        label: 'Notifications',
        onClick: () => navigate('/notifications'),
      },
      {
        key: '/logs',
        icon: <FileTextOutlined />,
        label: 'System Logs',
        onClick: () => navigate('/logs'),
      },
    ];

    const superAdminItems: MenuProps['items'] = [
      { type: 'divider' },
      {
        key: 'superadmin-section',
        label: 'Super Admin',
        type: 'group',
      },
      {
        key: '/super-admin',
        icon: <SafetyOutlined />,
        label: 'Super Admin',
        children: [
          {
            key: '/super-admin/dashboard',
            label: 'Dashboard',
            onClick: () => navigate('/super-admin/dashboard'),
          },
          {
            key: '/super-admin/tenants',
            label: 'Tenants',
            onClick: () => navigate('/super-admin/tenants'),
          },
          {
            key: '/super-admin/users',
            label: 'All Users',
            onClick: () => navigate('/super-admin/users'),
          },
          {
            key: '/super-admin/analytics',
            label: 'Analytics',
            onClick: () => navigate('/super-admin/analytics'),
          },
          {
            key: '/super-admin/health',
            label: 'System Health',
            onClick: () => navigate('/super-admin/health'),
          },
          {
            key: '/super-admin/configuration',
            label: 'Configuration',
            onClick: () => navigate('/super-admin/configuration'),
          },
          {
            key: '/super-admin/role-requests',
            label: 'Role Requests',
            onClick: () => navigate('/super-admin/role-requests'),
          },
        ],
      },
    ];

    // Build menu based on user role
    let menuItems = [...commonItems];
    
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      menuItems = [...menuItems, ...adminItems];
    }
    
    if (user?.role === 'super_admin') {
      menuItems = [...menuItems, ...superAdminItems];
    }

    return menuItems;
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