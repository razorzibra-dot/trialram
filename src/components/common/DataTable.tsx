/**
 * Data Table Component
 * Enterprise-grade table with consistent styling
 * Built on Ant Design Table with professional enhancements
 */

import React from 'react';
import { Table, Card, Space, Button, Input, Select } from 'antd';
import type { TableProps, TablePaginationConfig } from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FilterOutlined,
} from '@ant-design/icons';

const { Search } = Input;

export interface DataTableProps<T> extends TableProps<T> {
  title?: string;
  description?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  showRefresh?: boolean;
  onRefresh?: () => void;
  showExport?: boolean;
  onExport?: () => void;
  extra?: React.ReactNode;
  cardStyle?: React.CSSProperties;
}

export function DataTable<T extends object>({
  title,
  description,
  showSearch = true,
  searchPlaceholder = 'Search...',
  onSearch,
  showRefresh = true,
  onRefresh,
  showExport = false,
  onExport,
  extra,
  cardStyle,
  ...tableProps
}: DataTableProps<T>) {
  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 8,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        ...cardStyle,
      }}
      styles={{
        body: {
          padding: 0,
        },
      }}
    >
      {/* Table Header */}
      {(title || showSearch || showRefresh || showExport || extra) && (
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #E5E7EB',
            background: '#FFFFFF',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            {/* Left Section - Title */}
            <div style={{ flex: 1, minWidth: 200 }}>
              {title && (
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#111827',
                    margin: 0,
                    marginBottom: description ? 4 : 0,
                  }}
                >
                  {title}
                </h3>
              )}
              {description && (
                <p
                  style={{
                    fontSize: 13,
                    color: '#6B7280',
                    margin: 0,
                  }}
                >
                  {description}
                </p>
              )}
            </div>

            {/* Right Section - Actions */}
            <Space size="middle" wrap>
              {showSearch && onSearch && (
                <Search
                  placeholder={searchPlaceholder}
                  allowClear
                  onSearch={onSearch}
                  style={{ width: 250 }}
                  prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
                />
              )}
              {showRefresh && onRefresh && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={onRefresh}
                >
                  Refresh
                </Button>
              )}
              {showExport && onExport && (
                <Button
                  icon={<DownloadOutlined />}
                  onClick={onExport}
                >
                  Export
                </Button>
              )}
              {extra}
            </Space>
          </div>
        </div>
      )}

      {/* Table */}
      <Table<T>
        {...tableProps}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          ...tableProps.pagination,
        }}
        style={{
          ...tableProps.style,
        }}
      />
    </Card>
  );
}

export default DataTable;