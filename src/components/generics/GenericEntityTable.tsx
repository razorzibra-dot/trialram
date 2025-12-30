/**
 * Generic Entity Table Component
 * Reusable paginated table for any entity
 * 
 * Features:
 * - Ant Design Table integration
 * - Pagination support
 * - Loading states
 * - Actions column (View, Edit, Delete)
 * - Empty state handling
 * - Responsive design
 */

import React, { useMemo } from 'react';
import { Table, Button, Popconfirm, Space, Empty } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import { ColumnConfig } from '@/types/generic';

export interface GenericEntityTableProps<T> {
  /**
   * Table data rows
   */
  data: T[];

  /**
   * Total number of rows (for pagination)
   */
  total: number;

  /**
   * Current page number (1-indexed)
   */
  page: number;

  /**
   * Page size
   */
  pageSize: number;

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Column configuration
   */
  columns: ColumnConfig<T>[];

  /**
   * Actions
   */
  onView?: (record: T) => void;
  onEdit?: (record: T) => void;
  onDelete?: (record: T) => void;
  onPageChange?: (page: number, pageSize: number) => void;

  /**
   * Show actions column (default: true)
   */
  showActions?: boolean;

  /**
   * Row key (default: 'id')
   */
  rowKey?: keyof T | string;

  /**
   * Additional table props
   */
  tableProps?: Partial<TableProps<T>>;
}

/**
 * GenericEntityTable Component
 * 
 * Usage:
 * ```typescript
 * const columns: ColumnConfig<Deal>[] = [
 *   { title: 'Name', key: 'name', dataIndex: 'name', sortable: true },
 *   { title: 'Amount', key: 'amount', dataIndex: 'amount', render: (value) => `$${value}` },
 *   { 
 *     title: 'Status', 
 *     key: 'status', 
 *     dataIndex: 'status',
 *     render: (status) => <Tag color={status === 'won' ? 'green' : 'orange'}>{status}</Tag>
 *   }
 * ];
 * 
 * <GenericEntityTable<Deal>
 *   data={deals}
 *   total={totalDeals}
 *   page={currentPage}
 *   pageSize={10}
 *   columns={columns}
 *   loading={isLoading}
 *   onEdit={(deal) => openEditDrawer(deal)}
 *   onDelete={(deal) => deleteDeal(deal.id)}
 *   onPageChange={(page, size) => setPage(page)}
 * />
 * ```
 */
export const GenericEntityTable = React.forwardRef<any, GenericEntityTableProps<any>>(
  (
    {
      data,
      total,
      page,
      pageSize,
      loading = false,
      columns,
      onView,
      onEdit,
      onDelete,
      onPageChange,
      showActions = true,
      rowKey = 'id',
      tableProps
    },
    ref
  ) => {
    // Build table columns
    const tableColumns: TableProps<any>['columns'] = useMemo(() => {
      const cols: NonNullable<TableProps<any>['columns']> = columns.map((col) => ({
        title: col.title,
        dataIndex: (col.dataIndex as string) || col.key,
        key: col.key,
        width: col.width,
        fixed: col.fixed,
        align: col.align as 'left' | 'center' | 'right' | undefined,
        sorter: !!col.sortable,
        filters: col.filters,
        render: col.render
      }));

      // Add actions column if enabled
      if (showActions && (onView || onEdit || onDelete)) {
        const actionColumn: NonNullable<TableProps<any>['columns']>[number] = {
          title: 'Actions',
          key: 'actions',
          dataIndex: 'actions',
          width: 120,
          fixed: 'right' as const,
          align: 'center' as const,
          sorter: false,
          filters: undefined,
          render: (_: unknown, record: any) => (
            <Space size="small">
              {onView && (
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => onView(record)}
                  title="View"
                />
              )}
              {onEdit && (
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onEdit(record)}
                  title="Edit"
                />
              )}
              {onDelete && (
                <Popconfirm
                  title="Delete"
                  description="Are you sure you want to delete this?"
                  onConfirm={() => onDelete(record)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    title="Delete"
                  />
                </Popconfirm>
              )}
            </Space>
          )
        };
        cols.push(actionColumn);
      }

      return cols;
    }, [columns, showActions, onView, onEdit, onDelete]);

    return (
      <Table<any>
        ref={ref as any}
        columns={tableColumns}
        dataSource={data}
        rowKey={rowKey as string}
        loading={loading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          onChange: onPageChange,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `Total ${total} items`
        }}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: <Empty description="No data" /> }}
        {...tableProps}
      />
    );
  }
);

GenericEntityTable.displayName = 'GenericEntityTable';
