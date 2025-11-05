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
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
  DisconnectOutlined,
  ReloadOutlined,
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
      title="Super User Details"
      placement="right"
      onClose={onClose}
      open={visible}
      width={500}
      bodyStyle={{ paddingBottom: 80 }}
    >
      {/* Basic Information */}
      <Descriptions
        column={1}
        size="small"
        bordered
        className="mb-6"
        items={[
          {
            label: 'ID',
            children: <code className="text-xs">{superUser.id}</code>,
          },
          {
            label: 'User ID',
            children: superUser.userId,
          },
          {
            label: 'Access Level',
            children: (
              <Tag color={accessLevelColor[superUser.accessLevel] || 'default'}>
                {superUser.accessLevel}
              </Tag>
            ),
          },
          {
            label: 'Super Admin',
            children: (
              <Tag color={superUser.isSuperAdmin ? 'green' : 'default'}>
                {superUser.isSuperAdmin ? 'Yes' : 'No'}
              </Tag>
            ),
          },
          {
            label: 'Created',
            children: new Date(superUser.createdAt).toLocaleString(),
          },
          {
            label: 'Updated',
            children: new Date(superUser.updatedAt).toLocaleString(),
          },
          {
            label: 'Last Activity',
            children: superUser.lastActivityAt
              ? new Date(superUser.lastActivityAt).toLocaleString()
              : <span className="text-gray-400">Never</span>,
          },
        ]}
      />

      <Divider>Tenant Access</Divider>

      {/* Tenant Access List */}
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
                    description={`Remove access to tenant?`}
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

      {/* Action Buttons */}
      <Divider />
      <Space direction="vertical" style={{ width: '100%' }}>
        <Alert
          message="Tip"
          description="Use the buttons below to manage this super user's permissions and access rights"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Row gutter={8}>
          <Col span={24}>
            <Button
              block
              icon={<ReloadOutlined />}
              onClick={handleRefreshAccess}
              loading={loadingTenants}
            >
              Refresh Access
            </Button>
          </Col>
        </Row>
        <Row gutter={8}>
          <Col span={12}>
            <Button
              block
              type="primary"
              icon={<EditOutlined />}
              onClick={() => onEdit?.(superUser)}
            >
              Edit
            </Button>
          </Col>
          <Col span={12}>
            <Button
              block
              icon={<LinkOutlined />}
              onClick={() => onGrantAccess?.(superUser.id)}
            >
              Grant Access
            </Button>
          </Col>
        </Row>
        <Popconfirm
          title="Delete Super User"
          description="Are you sure you want to delete this super user? This action cannot be undone."
          okText="Yes, Delete"
          okType="danger"
          cancelText="Cancel"
          onConfirm={handleDelete}
        >
          <Button block danger icon={<DeleteOutlined />}>
            Delete Super User
          </Button>
        </Popconfirm>
      </Space>
    </Drawer>
  );
};

export default SuperUserDetailPanel;