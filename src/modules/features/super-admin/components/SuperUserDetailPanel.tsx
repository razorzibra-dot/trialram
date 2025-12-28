/**
 * Super User Detail Panel Component
 * Side drawer displaying super user details with tenant access and activity info
 * 
 * Features:
 * - Read-only display of super user information
 * - Tenant access list with access levels
 * - Last activity timestamp
 * - Action buttons (Edit, Grant Access, Delete)
 * - Confirmation dialogs for destructive actions
 * 
 * @component
 */

import React, { useState } from 'react';
import {
  Drawer,
  Descriptions,
  Button,
  Space,
  Divider,
  Tag,
  List,
  Empty,
  Popconfirm,
  Spin,
  Row,
  Col,
  Alert,
  Card,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
  DisconnectOutlined,
  ReloadOutlined,
  UserOutlined,
  SafetyOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useTenantAccess } from '../hooks/useTenantAccess';
import { SuperUserType } from '@/types/superUserModule';
import { toast } from 'sonner';

interface SuperUserDetailPanelProps {
  /** Super user to display */
  superUser?: SuperUserType;
  
  /** Whether drawer is visible */
  visible: boolean;
  
  /** Callback when drawer is closed */
  onClose: () => void;
  
  /** Callback when edit is clicked */
  onEdit?: (superUser: SuperUserType) => void;
  
  /** Callback when delete is clicked */
  onDelete?: (superUserId: string) => void;
  
  /** Callback when grant access is clicked */
  onGrantAccess?: (superUserId: string) => void;
  
  /** Callback when revoke access is clicked */
  onRevokeAccess?: (superUserId: string, tenantId: string) => void;
}

/**
 * SuperUserDetailPanel Component
 * 
 * Displays comprehensive super user information in a side drawer
 */
export const SuperUserDetailPanel: React.FC<SuperUserDetailPanelProps> = ({
  superUser,
  visible,
  onClose,
  onEdit,
  onDelete,
  onGrantAccess,
  onRevokeAccess,
}) => {
  const [loadingTenants, setLoadingTenants] = useState(false);
  const { accessList, refetch: refetchAccess } = useTenantAccess(superUser?.id);

  const handleRefreshAccess = async () => {
    try {
      setLoadingTenants(true);
      await refetchAccess();
      toast.success('Tenant access refreshed');
    } catch (error) {
      toast.error('Failed to refresh tenant access');
      console.error('Refresh error:', error);
    } finally {
      setLoadingTenants(false);
    }
  };

  const handleDelete = () => {
    if (superUser?.id) {
      onDelete?.(superUser.id);
      onClose();
    }
  };

  if (!superUser) return null;

  const accessLevelColor: Record<string, string> = {
    full: 'red',
    limited: 'orange',
    read_only: 'blue',
    specific_modules: 'green',
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserOutlined style={{ fontSize: 20, color: '#0ea5e9' }} />
          <span>Super User Details</span>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={500}
      styles={{ body: { padding: 0, paddingTop: 24 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button size="large" onClick={onClose}>Close</Button>
          <Button
            size="large"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => onEdit?.(superUser)}
          >
            Edit
          </Button>
          <Button
            size="large"
            icon={<LinkOutlined />}
            onClick={() => onGrantAccess?.(superUser.id)}
          >
            Grant Access
          </Button>
          <Popconfirm
            title="Delete Super User"
            description="Are you sure you want to delete this super user?"
            okText="Yes, Delete"
            okType="danger"
            cancelText="Cancel"
            onConfirm={handleDelete}
          >
            <Button size="large" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </div>
      }
    >
      <div style={{ padding: '0 24px 24px 24px' }}>
        {/* Basic Information */}
        <Card size="small" style={{ marginBottom: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }} variant="borderless">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid #e5e7eb' }}>
            <SafetyOutlined style={{ fontSize: 18, color: '#0ea5e9', marginRight: 10, fontWeight: 600 }} />
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1f2937', margin: 0 }}>Basic Information</h3>
          </div>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="ID">
              <code style={{ fontSize: '11px' }}>{superUser.id}</code>
            </Descriptions.Item>
            <Descriptions.Item label="User ID">
              {superUser.userId}
            </Descriptions.Item>
            <Descriptions.Item label="Access Level">
              <Tag color={accessLevelColor[superUser.accessLevel] || 'default'}>
                {superUser.accessLevel}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Super Admin">
              <Tag color={superUser.isSuperAdmin ? 'green' : 'default'}>
                {superUser.isSuperAdmin ? 'Yes' : 'No'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Tenant Access */}
        <Card size="small" style={{ marginBottom: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }} variant="borderless">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid #e5e7eb' }}>
            <LinkOutlined style={{ fontSize: 18, color: '#0ea5e9', marginRight: 10, fontWeight: 600 }} />
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1f2937', margin: 0 }}>Tenant Access</h3>
          </div>
          <Spin spinning={loadingTenants} tip="Loading tenant access...">
            {accessList && accessList.length > 0 ? (
              <List
                dataSource={accessList}
                renderItem={(access) => (
                  <List.Item
                    key={access.id}
                    actions={[
                      <Popconfirm
                        title="Revoke Access"
                        description="Remove access to this tenant?"
                        okText="Yes"
                        cancelText="No"
                        onConfirm={() =>
                          onRevokeAccess?.(superUser.id, access.tenantId)
                        }
                      >
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DisconnectOutlined />}
                          title="Revoke Access"
                        />
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <span>
                          Tenant ID: {access.tenantId}
                          <Tag
                            color={accessLevelColor[access.accessLevel] || 'default'}
                            style={{ marginLeft: 8 }}
                          >
                            {access.accessLevel}
                          </Tag>
                        </span>
                      }
                      description={`Access granted: ${new Date(
                        access.createdAt
                      ).toLocaleDateString()}`}
                    />
                  </List.Item>
                )}
                locale={{ emptyText: 'No tenant access assigned' }}
              />
            ) : (
              <Empty description="No tenant access assigned" />
            )}
          </Spin>
          <Button
            block
            style={{ marginTop: 12 }}
            icon={<ReloadOutlined />}
            onClick={handleRefreshAccess}
            loading={loadingTenants}
          >
            Refresh Access
          </Button>
        </Card>

        {/* Activity Information */}
        <Card size="small" style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }} variant="borderless">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid #e5e7eb' }}>
            <HistoryOutlined style={{ fontSize: 18, color: '#0ea5e9', marginRight: 10, fontWeight: 600 }} />
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1f2937', margin: 0 }}>Activity Information</h3>
          </div>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Created">
              {new Date(superUser.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Updated">
              {new Date(superUser.updatedAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Last Activity">
              {superUser.lastActivityAt
                ? new Date(superUser.lastActivityAt).toLocaleString()
                : <span style={{ color: '#999' }}>Never</span>}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    </Drawer>
  );
};

export default SuperUserDetailPanel;