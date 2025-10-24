/**
 * Tickets Detail Panel
 * Read-only side drawer for viewing ticket details
 */

import React from 'react';
import { Drawer, Button, Row, Col, Tag, Empty, Spin } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { Ticket } from '@/types/crm';
import { useAuth } from '@/contexts/AuthContext';
import dayjs from 'dayjs';

interface TicketsDetailPanelProps {
  ticket: Ticket | null;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onEdit: () => void;
}

/**
 * Status color mapping
 */
const statusColors: Record<string, string> = {
  open: 'warning',
  in_progress: 'processing',
  resolved: 'success',
  closed: 'default',
  pending: 'warning',
};

/**
 * Priority color mapping
 */
const priorityColors: Record<string, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
};

/**
 * Descriptions component for formatted display
 */
const Descriptions: React.FC<{
  items: Array<{ label: string; value: React.ReactNode }>;
}> = ({ items }) => (
  <div style={{ fontSize: 14 }}>
    {items.map((item, index) => (
      <Row key={index} style={{ marginBottom: 16, paddingBottom: 12, borderBottom: index < items.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
        <Col span={8} style={{ color: '#666', fontWeight: 500 }}>
          {item.label}
        </Col>
        <Col span={16} style={{ color: '#000' }}>
          {item.value || '-'}
        </Col>
      </Row>
    ))}
  </div>
);

export const TicketsDetailPanel: React.FC<TicketsDetailPanelProps> = ({
  ticket,
  isOpen,
  isLoading = false,
  onClose,
  onEdit,
}) => {
  const { hasPermission } = useAuth();

  if (!ticket) {
    return (
      <Drawer
        title="Ticket Details"
        placement="right"
        onClose={onClose}
        open={isOpen}
        width={500}
        bodyStyle={{ padding: 0 }}
      >
        <Empty description="No ticket selected" />
      </Drawer>
    );
  }

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span>Ticket Details</span>
          {hasPermission('tickets:update') && (
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={onEdit}
              style={{ marginRight: 16 }}
            >
              Edit
            </Button>
          )}
        </div>
      }
      placement="right"
      onClose={onClose}
      open={isOpen}
      width={500}
      bodyStyle={{ padding: '24px' }}
    >
      <Spin spinning={isLoading}>
        {/* Title Section */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 12px 0', color: '#111827', fontSize: 20, fontWeight: 600 }}>
            {ticket.title}
          </h2>
          {ticket.description && (
            <p style={{ margin: 0, color: '#666', fontSize: 14, lineHeight: 1.6 }}>
              {ticket.description}
            </p>
          )}
        </div>

        {/* Status & Priority */}
        <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: '#666', fontWeight: 500 }}>Status</span>
            <div style={{ marginTop: 6 }}>
              <Tag color={statusColors[ticket.status || 'open']} style={{ fontSize: 13, padding: '4px 12px' }}>
                {(ticket.status || 'open').replace('_', ' ').toUpperCase()}
              </Tag>
            </div>
          </div>
          <div>
            <span style={{ fontSize: 12, color: '#666', fontWeight: 500 }}>Priority</span>
            <div style={{ marginTop: 6 }}>
              <Tag color={priorityColors[ticket.priority || 'medium']} style={{ fontSize: 13, padding: '4px 12px' }}>
                {(ticket.priority || 'medium').toUpperCase()}
              </Tag>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#111827' }}>
            Basic Information
          </h3>
          <Descriptions
            items={[
              {
                label: 'Ticket ID',
                value: ticket.id,
              },
              {
                label: 'Customer',
                value: ticket.customer_name || ticket.customer_id || '-',
              },
              {
                label: 'Category',
                value: ticket.category ? ticket.category.replace('_', ' ').toUpperCase() : '-',
              },
            ]}
          />
        </div>

        {/* Assignment & Timeline */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#111827' }}>
            Assignment & Timeline
          </h3>
          <Descriptions
            items={[
              {
                label: 'Assigned To',
                value: ticket.assigned_to_name || 'Unassigned',
              },
              {
                label: 'Created',
                value: ticket.created_at ? dayjs(ticket.created_at).format('MMM DD, YYYY HH:mm') : '-',
              },
              {
                label: 'Updated',
                value: ticket.updated_at ? dayjs(ticket.updated_at).format('MMM DD, YYYY HH:mm') : '-',
              },
              {
                label: 'Due Date',
                value:
                  ticket.due_date && new Date(ticket.due_date) < new Date() && ticket.status !== 'resolved' && ticket.status !== 'closed' ? (
                    <span style={{ color: '#dc2626', fontWeight: 500 }}>
                      {dayjs(ticket.due_date).format('MMM DD, YYYY')}
                    </span>
                  ) : ticket.due_date ? (
                    dayjs(ticket.due_date).format('MMM DD, YYYY')
                  ) : (
                    '-'
                  ),
              },
              {
                label: 'Resolved',
                value: ticket.resolved_at ? dayjs(ticket.resolved_at).format('MMM DD, YYYY HH:mm') : 'Not resolved',
              },
            ]}
          />
        </div>

        {/* Additional Tags */}
        {ticket.tags && ticket.tags.length > 0 && (
          <div style={{ paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#111827' }}>
              Tags
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ticket.tags.map((tag, index) => (
                <Tag key={index} color="blue">
                  {tag}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </Spin>
    </Drawer>
  );
};