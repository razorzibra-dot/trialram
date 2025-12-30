/**
 * Generic Detail Drawer Component
 * Read-only view for displaying entity details in a drawer
 * 
 * Features:
 * - Ant Design Drawer integration
 * - Dynamic field rendering
 * - Loading states
 * - Edit/Delete action buttons
 * - Responsive design
 */

import React from 'react';
import { Drawer, Descriptions, Button, Space, Spin, Empty, Divider } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { ColumnConfig } from '@/types/generic';

interface GenericDetailDrawerProps<T> {
  /**
   * Drawer title
   */
  title: string;

  /**
   * Is drawer open
   */
  open: boolean;

  /**
   * Entity data to display
   */
  data?: T;

  /**
   * Column configuration (defines which fields to show)
   */
  columns: ColumnConfig<T>[];

  /**
   * Callbacks
   */
  onEdit?: () => void;
  onDelete?: () => void;
  onClose: () => void;

  /**
   * Loading state
   */
  loading?: boolean;
}

/**
 * GenericDetailDrawer Component
 * 
 * Usage:
 * ```typescript
 * const columns: ColumnConfig<Deal>[] = [
 *   { title: 'Name', key: 'name', dataIndex: 'name' },
 *   { title: 'Amount', key: 'amount', dataIndex: 'amount', render: (value) => `$${value}` },
 *   { title: 'Status', key: 'status', dataIndex: 'status' }
 * ];
 * 
 * <GenericDetailDrawer<Deal>
 *   open={isOpen}
 *   title={deal?.name}
 *   data={deal}
 *   columns={columns}
 *   onEdit={() => openEditDrawer(deal)}
 *   onDelete={() => deleteDeal(deal.id)}
 *   onClose={() => setIsOpen(false)}
 * />
 * ```
 */
export const GenericDetailDrawer = React.forwardRef<unknown, GenericDetailDrawerProps<any>>(
  (
    {
      title,
      open,
      data,
      columns,
      onEdit,
      onDelete,
      onClose,
      loading = false
    },
    ref
  ) => {
    if (!data) {
      return (
        <Drawer
          title={title}
          onClose={onClose}
          open={open}
          width={600}
        >
          <Empty description="No data" />
        </Drawer>
      );
    }

    return (
      <Drawer
        title={title}
        onClose={onClose}
        open={open}
        width={600}
        footer={
          <Space style={{ float: 'right' }}>
            {onEdit && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={onEdit}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={onDelete}
              >
                Delete
              </Button>
            )}
            <Button onClick={onClose}>Close</Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Descriptions column={1} bordered size="small">
            {columns.map(col => {
              const value = col.dataIndex ? (data as any)[col.dataIndex] : null;
              const displayValue = col.render ? col.render(value, data, 0) : value;

              return (
                <Descriptions.Item
                  key={col.key}
                  label={col.title}
                >
                  {displayValue === null || displayValue === undefined ? '-' : displayValue}
                </Descriptions.Item>
              );
            })}
          </Descriptions>
        </Spin>
      </Drawer>
    );
  }
);

GenericDetailDrawer.displayName = 'GenericDetailDrawer';
