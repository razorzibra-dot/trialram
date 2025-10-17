/**
 * Data Table Hook
 * Provides state management and functionality for data tables
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@/modules/core/hooks/useQuery';
import { FilterOptions, PaginatedResponse } from '@/modules/core/types';

export interface UseDataTableOptions<T> {
  queryKey: string[];
  queryFn: (params: FilterOptions) => Promise<PaginatedResponse<T>>;
  initialPageSize?: number;
  initialSortBy?: string;
  initialSortOrder?: 'asc' | 'desc';
  initialFilters?: Record<string, unknown>;
  enableSelection?: boolean;
  enableSearch?: boolean;
  searchDebounceMs?: number;
}

export function useDataTable<T extends Record<string, unknown>>({
  queryKey,
  queryFn,
  initialPageSize = 20,
  initialSortBy,
  initialSortOrder = 'asc',
  initialFilters = {},
  enableSelection = false,
  enableSearch = true,
  searchDebounceMs = 300,
}: UseDataTableOptions<T>) {
  // State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);
  const [filters, setFilters] = useState(initialFilters);
  const [search, setSearch] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<T[]>([]);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, searchDebounceMs);

    return () => clearTimeout(timer);
  }, [search, searchDebounceMs]);

  // Query parameters
  const queryParams = useMemo(() => ({
    page,
    pageSize,
    sortBy,
    sortOrder,
    search: enableSearch ? debouncedSearch : undefined,
    filters,
  }), [page, pageSize, sortBy, sortOrder, debouncedSearch, filters, enableSearch]);

  // Data query
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery(
    [...queryKey, queryParams],
    () => queryFn(queryParams),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const data = response?.data || [];
  const total = response?.total || 0;
  const totalPages = response?.totalPages || 0;

  // Handlers
  const handlePageChange = useCallback((newPage: number, newPageSize: number) => {
    setPage(newPage);
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setPage(1); // Reset to first page when page size changes
    }
  }, [pageSize]);

  const handleSortChange = useCallback((newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1); // Reset to first page when sorting changes
  }, []);

  const handleFilterChange = useCallback((newFilters: Record<string, unknown>) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  }, []);

  const handleSearchChange = useCallback((newSearch: string) => {
    setSearch(newSearch);
    setPage(1); // Reset to first page when search changes
  }, []);

  const handleSelectionChange = useCallback((newSelectedRowKeys: string[], newSelectedRows: T[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
    setSelectedRows(newSelectedRows);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRowKeys([]);
    setSelectedRows([]);
  }, []);

  const selectAll = useCallback(() => {
    const allKeys = data.map((item, index) => item.id || index.toString());
    setSelectedRowKeys(allKeys);
    setSelectedRows(data);
  }, [data]);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearch('');
    setSortBy(initialSortBy);
    setSortOrder(initialSortOrder);
    setPage(1);
  }, [initialFilters, initialSortBy, initialSortOrder]);

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Table configuration
  const tableProps = useMemo(() => ({
    data,
    loading: isLoading,
    pagination: {
      current: page,
      pageSize,
      total,
      onChange: handlePageChange,
    },
    sorting: sortBy ? {
      sortBy,
      sortOrder,
      onChange: handleSortChange,
    } : undefined,
    filtering: {
      filters,
      onChange: handleFilterChange,
    },
    search: enableSearch ? {
      value: search,
      onChange: handleSearchChange,
    } : undefined,
    selection: enableSelection ? {
      selectedRowKeys,
      onChange: handleSelectionChange,
    } : undefined,
  }), [
    data,
    isLoading,
    page,
    pageSize,
    total,
    sortBy,
    sortOrder,
    filters,
    search,
    selectedRowKeys,
    enableSearch,
    enableSelection,
    handlePageChange,
    handleSortChange,
    handleFilterChange,
    handleSearchChange,
    handleSelectionChange,
  ]);

  return {
    // Data
    data,
    total,
    totalPages,
    isLoading,
    error,

    // State
    page,
    pageSize,
    sortBy,
    sortOrder,
    filters,
    search,
    selectedRowKeys,
    selectedRows,

    // Handlers
    setPage,
    setPageSize,
    setSortBy,
    setSortOrder,
    setFilters,
    setSearch,
    handlePageChange,
    handleSortChange,
    handleFilterChange,
    handleSearchChange,
    handleSelectionChange,

    // Actions
    clearSelection,
    selectAll,
    resetFilters,
    refresh,

    // Table props
    tableProps,
  };
}
