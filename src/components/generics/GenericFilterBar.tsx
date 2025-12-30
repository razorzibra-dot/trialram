/**
 * Generic Filter Bar Component
 * Reusable filter/search controls for entity lists
 * 
 * Features:
 * - Text search across configured fields
 * - Custom filter controls (date range, select, etc.)
 * - Reset filters button
 * - Configurable fields and filters
 */

import React, { useState, useCallback } from 'react';
import { Form, Input, Button, Select, DatePicker, Space, Row, Col } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { QueryFilters } from '@/types/generic';

export interface FilterConfig {
  key: string;
  label: string;
  type: 'search' | 'select' | 'dateRange' | 'date' | 'custom';
  placeholder?: string;
  options?: Array<{ label: string; value: string | number }>;
  render?: (value: unknown, onChange: (value: unknown) => void) => React.ReactNode;
}

interface GenericFilterBarProps {
  filters: FilterConfig[];
  onFiltersChange: (filters: QueryFilters) => void;
  loading?: boolean;
}

/**
 * GenericFilterBar Component
 * 
 * Usage:
 * ```typescript
 * const filters: FilterConfig[] = [
 *   { key: 'search', label: 'Search', type: 'search', placeholder: 'Search by name or email' },
 *   { key: 'status', label: 'Status', type: 'select', options: [
 *     { label: 'Active', value: 'active' },
 *     { label: 'Inactive', value: 'inactive' }
 *   ]}
 * ];
 * 
 * <GenericFilterBar 
 *   filters={filters}
 *   onFiltersChange={(filters) => setFilters(filters)}
 * />
 * ```
 */
export const GenericFilterBar: React.FC<GenericFilterBarProps> = ({
  filters,
  onFiltersChange,
  loading = false
}) => {
  const [form] = Form.useForm();
  const [values, setValues] = useState<Record<string, unknown>>({});

  const handleFilterChange = useCallback(
    (changedValue: Record<string, unknown>) => {
      const newValues = { ...values, ...changedValue };
      setValues(newValues);

      // Build query filters
      const queryFilters: QueryFilters = {
        customFilters: {}
      };

      Object.entries(newValues).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          return;
        }

        const filterConfig = filters.find(f => f.key === key);
        if (!filterConfig) return;

        switch (filterConfig.type) {
          case 'search':
            queryFilters.search = String(value);
            break;
          case 'dateRange':
            if (Array.isArray(value) && value.length === 2) {
              queryFilters.customFilters![`${key}_from`] = value[0];
              queryFilters.customFilters![`${key}_to`] = value[1];
            }
            break;
          default:
            queryFilters.customFilters![key] = value;
        }
      });

      onFiltersChange(queryFilters);
    },
    [filters, onFiltersChange, values]
  );

  const handleReset = useCallback(() => {
    form.resetFields();
    setValues({});
    onFiltersChange({ customFilters: {} });
  }, [form, onFiltersChange]);

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={handleFilterChange}
      className="generic-filter-bar"
    >
      <Row gutter={[16, 16]}>
        {filters.map(filter => (
          <Col key={filter.key} xs={24} sm={12} md={8} lg={6}>
            <Form.Item label={filter.label} name={filter.key}>
              {filter.type === 'search' && (
                <Input
                  placeholder={filter.placeholder || 'Search...'}
                  prefix={<SearchOutlined />}
                  disabled={loading}
                />
              )}
              {filter.type === 'select' && (
                <Select
                  placeholder={filter.placeholder || 'Select...'}
                  allowClear
                  options={filter.options}
                  disabled={loading}
                />
              )}
              {filter.type === 'dateRange' && (
                <DatePicker.RangePicker
                  style={{ width: '100%' }}
                  disabled={loading}
                />
              )}
              {filter.type === 'date' && (
                <DatePicker style={{ width: '100%' }} disabled={loading} />
              )}
              {filter.type === 'custom' && filter.render && (
                filter.render(values[filter.key], (value) => {
                  handleFilterChange({ [filter.key]: value });
                })
              )}
            </Form.Item>
          </Col>
        ))}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item label=" ">
            <Space style={{ width: '100%' }}>
              <Button
                icon={<ClearOutlined />}
                onClick={handleReset}
                disabled={loading}
              >
                Reset
              </Button>
            </Space>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};
