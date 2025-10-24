/**
 * Sales Deal Detail Panel
 * Side drawer for viewing deal details in read-only mode
 * TODO: Complete with all deal-specific fields
 */

import React from 'react';
import { Drawer, Descriptions, Button, Space, Divider, Tag, Empty, Progress } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { Deal } from '@/types/crm';

interface SalesDealDetailPanelProps {
  visible: boolean;
  deal: Deal | null;
  onClose: () => void;
  onEdit: () => void;
}

export const SalesDealDetailPanel: React.FC<SalesDealDetailPanelProps> = ({
  visible,
  deal,
  onClose,
  onEdit,
}) => {
  if (!deal) {
    return null;
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'lead': return 'default';
      case 'qualified': return 'processing';
      case 'proposal': return 'warning';
      case 'negotiation': return 'warning';
      case 'closed_won': return 'green';
      case 'closed_lost': return 'red';
      default: return 'default';
    }
  };

  const getStageProgress = (stage: string) => {
    const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won'];
    const index = stages.indexOf(stage);
    return index >= 0 ? ((index + 1) / stages.length) * 100 : 0;
  };

  return (
    <Drawer
      title="Deal Details"
      placement="right"
      width={500}
      onClose={onClose}
      open={visible}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose}>Close</Button>
          <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
            Edit
          </Button>
        </Space>
      }
    >
      {deal ? (
        <div>
          {/* Basic Information */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Basic Information</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Deal Name">
              {deal.name}
            </Descriptions.Item>
            <Descriptions.Item label="Customer">
              {deal.customer_name}
            </Descriptions.Item>
            <Descriptions.Item label="Deal Value">
              ${deal.amount?.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Stage">
              <Tag color={getStageColor(deal.stage)}>
                {deal.stage?.replace('_', ' ').toUpperCase()}
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          {/* Deal Progress */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Pipeline Progress</h3>
          <Progress
            percent={getStageProgress(deal.stage)}
            status="active"
            format={() => deal.stage?.replace('_', ' ').toUpperCase()}
          />

          <Divider />

          {/* Deal Details */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Deal Details</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Sales Owner">
              {deal.owner_name}
            </Descriptions.Item>
            <Descriptions.Item label="Expected Close Date">
              {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Probability">
              {deal.probability}%
            </Descriptions.Item>
            <Descriptions.Item label="Created Date">
              {deal.created_at ? new Date(deal.created_at).toLocaleDateString() : '-'}
            </Descriptions.Item>
          </Descriptions>

          {deal.notes && (
            <>
              <Divider />
              <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Notes</h3>
              <div style={{
                padding: 12,
                backgroundColor: '#fafafa',
                borderRadius: 4,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {deal.notes}
              </div>
            </>
          )}
        </div>
      ) : (
        <Empty description="No deal selected" />
      )}
    </Drawer>
  );
};