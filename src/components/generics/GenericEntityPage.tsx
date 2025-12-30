/**
 * Generic Entity Page Component
 * Complete page layout combining filter, table, and drawers
 * 
 * This is the highest-level generic component that combines:
 * - GenericFilterBar for filtering
 * - GenericEntityTable for displaying data
 * - GenericFormDrawer for creating/editing
 * - GenericDetailDrawer for viewing details
 * 
 * Handles pagination, loading states, and all CRUD operations
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Empty, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { GenericFilterBar, FilterConfig } from './GenericFilterBar';
import { GenericEntityTable, GenericEntityTableProps } from './GenericEntityTable';
import { GenericFormDrawer } from './GenericFormDrawer';
import { GenericDetailDrawer } from './GenericDetailDrawer';
import { ColumnConfig, FormFieldConfig, QueryFilters } from '@/types/generic';

interface GenericEntityPageProps<T> {
  /**
   * Page title
   */
  title: string;

  /**
   * Table data
   */
  data: T[];

  /**
   * Total count for pagination
   */
  total: number;

  /**
   * Current page
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
   * Table columns
   */
  columns: ColumnConfig<T>[];

  /**
   * Filter configurations
   */
  filters: FilterConfig[];

  /**
   * Form fields for create/edit
   */
  formFields: FormFieldConfig[];

  /**
   * Callbacks
   */
  onFiltersChange: (filters: QueryFilters) => void;
  onPageChange: (page: number, pageSize: number) => void;
  onCreate?: (values: Record<string, unknown>) => void | Promise<void>;
  onUpdate?: (id: string | number, values: Record<string, unknown>) => void | Promise<void>;
  onDelete?: (id: string | number) => void | Promise<void>;
  onView?: (record: T) => void;

  /**
   * ID field name (default: 'id')
   */
  idField?: keyof T | string;

  /**
   * Enable create button
   */
  enableCreate?: boolean;

  /**
   * Enable edit/delete actions
   */
  enableActions?: boolean;

  /**
   * Show title
   */
  showTitle?: boolean;
}

/**
 * GenericEntityPage Component
 * 
 * Complete example:
 * ```typescript
 * const columns: ColumnConfig<Deal>[] = [
 *   { title: 'Name', key: 'name', dataIndex: 'name', sortable: true },
 *   { title: 'Amount', key: 'amount', dataIndex: 'amount', render: (v) => `$${v}` },
 *   { title: 'Status', key: 'status', dataIndex: 'status' }
 * ];
 * 
 * const filters: FilterConfig[] = [
 *   { key: 'search', label: 'Search', type: 'search', placeholder: 'Search deals' },
 *   { key: 'status', label: 'Status', type: 'select', options: [
 *     { label: 'Open', value: 'open' },
 *     { label: 'Won', value: 'won' }
 *   ]}
 * ];
 * 
 * const formFields: FormFieldConfig[] = [
 *   { type: 'text', name: 'name', label: 'Deal Name', required: true },
 *   { type: 'number', name: 'amount', label: 'Amount', required: true }
 * ];
 * 
 * const { data, isLoading, error } = useDeals(filters);
 * const createMutation = useCreateDeal();
 * 
 * <GenericEntityPage
 *   title="Deals"
 *   data={data}
 *   total={total}
 *   page={currentPage}
 *   pageSize={pageSize}
 *   loading={isLoading}
 *   columns={columns}
 *   filters={filters}
 *   formFields={formFields}
 *   onFiltersChange={(f) => setFilters(f)}
 *   onPageChange={(p, s) => setPage(p)}
 *   onCreate={(values) => createMutation.mutate(values)}
 *   onUpdate={(id, values) => updateMutation.mutate({ id, data: values })}
 *   onDelete={(id) => deleteMutation.mutate(id)}
 * />
 * ```
 */
export const GenericEntityPage = React.forwardRef<unknown, GenericEntityPageProps<any>>(
  (
    {
      title,
      data,
      total,
      page,
      pageSize,
      loading = false,
      columns,
      filters,
      formFields,
      onFiltersChange,
      onPageChange,
      onCreate,
      onUpdate,
      onDelete,
      onView,
      idField = 'id',
      enableCreate = true,
      enableActions = true,
      showTitle = true
    },
    ref
  ) => {
    // State for modals/drawers
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<any>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    // Reset form state when closing
    useEffect(() => {
      if (!isFormOpen) {
        setSelectedRecord(null);
        setIsEditMode(false);
      }
    }, [isFormOpen]);

    const handleCreate = () => {
      setSelectedRecord(null);
      setIsEditMode(false);
      setIsFormOpen(true);
    };

    const handleEdit = (record: any) => {
      setSelectedRecord(record);
      setIsEditMode(true);
      setIsFormOpen(true);
    };

    const handleDelete = async (record: any) => {
      if (onDelete) {
        try {
          setFormLoading(true);
          await onDelete(record[idField as string]);
        } finally {
          setFormLoading(false);
        }
      }
    };

    const handleFormSubmit = async (values: Record<string, unknown>) => {
      try {
        setFormLoading(true);
        if (isEditMode && onUpdate && selectedRecord) {
          await onUpdate(selectedRecord[idField as string], values);
        } else if (!isEditMode && onCreate) {
          await onCreate(values);
        }
        setIsFormOpen(false);
      } finally {
        setFormLoading(false);
      }
    };

    const handleViewDetails = (record: any) => {
      setSelectedRecord(record);
      setIsDetailOpen(true);
      onView?.(record);
    };

    return (
      <>
        {/* Page Header with Title and Create Button */}
        {showTitle && (
          <Card
            style={{ marginBottom: 16 }}
            title={<h2>{title}</h2>}
            extra={
              enableCreate && onCreate && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                >
                  New {title.slice(0, -1)}
                </Button>
              )
            }
          />
        )}

        {/* Filters */}
        <Card style={{ marginBottom: 16 }}>
          <GenericFilterBar
            filters={filters}
            onFiltersChange={onFiltersChange}
            loading={loading}
          />
        </Card>

        {/* Table */}
        <Card loading={loading}>
          {data.length === 0 && !loading ? (
            <Empty description="No data found" />
          ) : (
            <GenericEntityTable
              ref={ref}
              data={data}
              total={total}
              page={page}
              pageSize={pageSize}
              loading={loading}
              columns={columns}
              onView={handleViewDetails}
              onEdit={enableActions ? handleEdit : undefined}
              onDelete={enableActions && onDelete ? handleDelete : undefined}
              onPageChange={onPageChange}
              showActions={enableActions && !!(onView || onUpdate || onDelete)}
              rowKey={idField as string}
            />
          )}
        </Card>

        {/* Form Drawer for Create/Edit */}
        {(onCreate || onUpdate) && (
          <GenericFormDrawer
            title={isEditMode ? `Edit ${title.slice(0, -1)}` : `New ${title.slice(0, -1)}`}
            open={isFormOpen}
            data={selectedRecord}
            fields={formFields}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
            loading={formLoading}
            submitText={isEditMode ? 'Update' : 'Create'}
            isEdit={isEditMode}
          />
        )}

        {/* Detail Drawer for Viewing */}
        {onView && (
          <GenericDetailDrawer
            ref={ref}
            title={selectedRecord?.[columns[0]?.dataIndex] || 'Details'}
            open={isDetailOpen}
            data={selectedRecord}
            columns={columns}
            onEdit={() => {
              setIsDetailOpen(false);
              handleEdit(selectedRecord);
            }}
            onDelete={() => {
              setIsDetailOpen(false);
              handleDelete(selectedRecord);
            }}
            onClose={() => setIsDetailOpen(false)}
            loading={loading}
          />
        )}
      </>
    );
  }
);

GenericEntityPage.displayName = 'GenericEntityPage';
