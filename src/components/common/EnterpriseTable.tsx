import React, { useEffect, useRef } from 'react';
import { Table } from 'antd';
import type { TableProps, TablePaginationConfig } from 'antd/es/table';

export interface EnterpriseTableProps<RecordType> extends TableProps<RecordType> {
  enableAutoScrollTop?: boolean;
  scrollTopBehavior?: 'smooth' | 'instant';
  scrollOffset?: number; // pixels from top to align
}

/**
 * EnterpriseTable - AntD Table wrapper with enterprise UX enhancements
 * - Auto scroll-to-top on pagination changes
 * - Configurable behavior and offset
 * - Drop-in replacement for AntD Table
 */
export function EnterpriseTable<RecordType extends object>(props: EnterpriseTableProps<RecordType>) {
  const {
    enableAutoScrollTop = true,
    scrollTopBehavior = 'smooth',
    scrollOffset = 0,
    onChange,
    pagination,
    ...rest
  } = props;

  // Wrapper ref to calculate position for scroll
  const wrapperRef = useRef<HTMLDivElement>(null);
  const prevPageRef = useRef<number | undefined>(
    typeof pagination === 'object' ? (pagination as TablePaginationConfig).current : undefined
  );

  // Intercept Table onChange to detect user-driven pagination changes
  const handleChange: TableProps<RecordType>['onChange'] = (pag, filters, sorter, extra) => {
    if (enableAutoScrollTop) {
      const nextPage = (pag as TablePaginationConfig)?.current;
      const prevPage = prevPageRef.current;
      if (nextPage && prevPage && nextPage !== prevPage) {
        scrollToTop();
      }
      prevPageRef.current = nextPage;
    }
    onChange?.(pag, filters, sorter, extra);
  };

  // Effect to handle programmatic page changes (e.g., auto-correct)
  useEffect(() => {
    if (!enableAutoScrollTop) return;
    const current = typeof pagination === 'object' ? (pagination as TablePaginationConfig).current : undefined;
    const prev = prevPageRef.current;
    if (current && prev !== undefined && current !== prev) {
      scrollToTop();
    }
    prevPageRef.current = current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeof pagination === 'object' ? (pagination as TablePaginationConfig).current : pagination]);

  const scrollToTop = () => {
    // Prefer scrolling the page, fallback to wrapper if present
    const behavior = scrollTopBehavior === 'smooth' ? 'smooth' : 'auto';
    // Scroll window to top of the wrapper
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const top = window.scrollY + rect.top - scrollOffset;
      window.scrollTo({ top, behavior });
    } else {
      window.scrollTo({ top: 0, behavior });
    }
  };

  return (
    <div ref={wrapperRef}>
      <Table
        {...rest}
        pagination={pagination}
        onChange={handleChange}
      />
    </div>
  );
}

export default EnterpriseTable;
