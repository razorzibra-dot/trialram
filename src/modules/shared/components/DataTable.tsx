/**
 * Enhanced Data Table Component
 * Reusable table component with sorting, filtering, pagination, and selection
 */

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner, LoadingSkeleton } from '@/modules/core/components/LoadingSpinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  MoreHorizontal,
  Download,
  Plus,
} from 'lucide-react';

export interface Column<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
  className?: string;
}

export interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
    onChange: (page: number, pageSize: number) => void;
  };
  selection?: {
    selectedRowKeys: string[];
    onChange: (selectedRowKeys: string[], selectedRows: T[]) => void;
    getCheckboxProps?: (record: T) => { disabled?: boolean };
  };
  sorting?: {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    onChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  };
  filtering?: {
    filters: Record<string, any>;
    onChange: (filters: Record<string, any>) => void;
  };
  search?: {
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
  };
  actions?: {
    onCreate?: () => void;
    onExport?: () => void;
    rowActions?: (record: T) => Array<{
      label: string;
      onClick: () => void;
      icon?: React.ReactNode;
      disabled?: boolean;
    }>;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  bordered?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  sticky?: boolean;
  emptyText?: string;
  rowKey?: string | ((record: T) => string);
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  pagination,
  selection,
  sorting,
  filtering,
  search,
  actions,
  className,
  size = 'md',
  bordered = true,
  striped = true,
  hoverable = true,
  sticky = false,
  emptyText = 'No data available',
  rowKey = 'id',
}: DataTableProps<T>) {
  const [searchValue, setSearchValue] = useState(search?.value || '');

  // Get row key
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return record[rowKey] || index.toString();
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchValue(value);
    search?.onChange(value);
  };

  // Handle sorting
  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !sorting) return;

    const { sortBy, sortOrder } = sorting;
    let newSortOrder: 'asc' | 'desc' = 'asc';

    if (sortBy === column.key) {
      newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }

    sorting.onChange(column.key, newSortOrder);
  };

  // Render sort icon
  const renderSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;

    const { sortBy, sortOrder } = sorting || {};
    const isActive = sortBy === column.key;

    if (isActive) {
      return sortOrder === 'asc' ? (
        <ArrowUp className="w-4 h-4" />
      ) : (
        <ArrowDown className="w-4 h-4" />
      );
    }

    return <ArrowUpDown className="w-4 h-4 opacity-50" />;
  };

  // Render cell content
  const renderCell = (column: Column<T>, record: T, index: number) => {
    const value = column.dataIndex ? record[column.dataIndex] : record[column.key];

    if (column.render) {
      return column.render(value, record, index);
    }

    return value;
  };

  // Pagination component
  const renderPagination = () => {
    if (!pagination) return null;

    const { current, pageSize, total, onChange } = pagination;
    const totalPages = Math.ceil(total / pageSize);
    const startItem = (current - 1) * pageSize + 1;
    const endItem = Math.min(current * pageSize, total);

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="text-sm text-gray-700">
          Showing {startItem} to {endItem} of {total} results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange(1, pageSize)}
            disabled={current === 1}
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange(current - 1, pageSize)}
            disabled={current === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium">
            Page {current} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange(current + 1, pageSize)}
            disabled={current === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange(totalPages, pageSize)}
            disabled={current === totalPages}
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={cn('border rounded-lg', className)}>
        <div className="p-4">
          <LoadingSkeleton lines={5} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('border rounded-lg bg-white', className)}>
      {/* Header with search and actions */}
      {(search || actions) && (
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            {search && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={search.placeholder || 'Search...'}
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {actions?.onCreate && (
              <Button onClick={actions.onCreate} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            )}
            {actions?.onExport && (
              <Button onClick={actions.onExport} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto">
        <Table>
          <TableHeader className={sticky ? 'sticky top-0 bg-white z-10' : ''}>
            <TableRow>
              {selection && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      data.length > 0 &&
                      data.every((record) =>
                        selection.selectedRowKeys.includes(getRowKey(record, 0))
                      )
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const allKeys = data.map((record, index) => getRowKey(record, index));
                        selection.onChange(allKeys, data);
                      } else {
                        selection.onChange([], []);
                      }
                    }}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.className,
                    column.sortable && 'cursor-pointer select-none',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right'
                  )}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {renderSortIcon(column)}
                  </div>
                </TableHead>
              ))}
              {actions?.rowActions && <TableHead className="w-12"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selection ? 1 : 0) + (actions?.rowActions ? 1 : 0)}
                  className="text-center py-8 text-gray-500"
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
              data.map((record, index) => {
                const key = getRowKey(record, index);
                const isSelected = selection?.selectedRowKeys.includes(key);

                return (
                  <TableRow
                    key={key}
                    className={cn(
                      hoverable && 'hover:bg-gray-50',
                      striped && index % 2 === 1 && 'bg-gray-50/50',
                      isSelected && 'bg-blue-50'
                    )}
                  >
                    {selection && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            const newSelectedKeys = checked
                              ? [...selection.selectedRowKeys, key]
                              : selection.selectedRowKeys.filter((k) => k !== key);
                            const newSelectedRows = data.filter((r, i) =>
                              newSelectedKeys.includes(getRowKey(r, i))
                            );
                            selection.onChange(newSelectedKeys, newSelectedRows);
                          }}
                          {...selection.getCheckboxProps?.(record)}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn(
                          column.className,
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {renderCell(column, record, index)}
                      </TableCell>
                    ))}
                    {actions?.rowActions && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {actions.rowActions(record).map((action, actionIndex) => (
                              <DropdownMenuItem
                                key={actionIndex}
                                onClick={action.onClick}
                                disabled={action.disabled}
                              >
                                {action.icon && <span className="mr-2">{action.icon}</span>}
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
}
