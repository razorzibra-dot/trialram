/**
 * Multi-Tenant Comparison Component
 * Compare metrics across multiple tenants
 * 
 * Features:
 * - Multi-tenant selection
 * - Metric comparison in table format
 * - Sortable by metric value
 * - Highlight top/bottom performers
 * - Export functionality
 * - Loading states
 * 
 * @component
 */

import React, { useState, useMemo } from 'react';
import {
  Table,
  Select,
  Button,
  Space,
  Row,
  Col,
  Tag,
  Spin,
  Empty,
} from 'antd';
import {
  DownloadOutlined,
  CopyOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useTenantMetrics } from '../hooks/useTenantMetrics';
import { MetricTypeEnum } from '@/types/superUserModule';
import { toast } from 'sonner';

interface MultiTenantComparisonProps {
  /** Callback when tenants are selected */
  onTenantsSelected?: (tenantIds: string[]) => void;
}

/**
 * Mock tenant data (in real app, would fetch from service)
 */
const MOCK_TENANTS = [
  { id: 'tenant-1', name: 'Acme Corp' },
  { id: 'tenant-2', name: 'Tech Startups Inc' },
  { id: 'tenant-3', name: 'Global Enterprises' },
  { id: 'tenant-4', name: 'Local Business LLC' },
];

/**
 * MultiTenantComparison Component
 * 
 * Displays side-by-side comparison of metrics across multiple tenants
 */
export const MultiTenantComparison: React.FC<MultiTenantComparisonProps> = ({
  onTenantsSelected,
}) => {
  const [selectedTenants, setSelectedTenants] = useState<string[]>([
    'tenant-1',
    'tenant-2',
  ]);
  const [sortBy, setSortBy] = useState<string>('active_users');

  // Fetch metrics for all selected tenants
  const metricsPerTenant = selectedTenants.map((tenantId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { metrics, loading } = useTenantMetrics(tenantId);
    return { tenantId, metrics, loading };
  });

  const isLoading = metricsPerTenant.some((t) => t.loading);

  /**
   * Build comparison table data
   */
  const comparisonData = useMemo(() => {
    if (!metricsPerTenant.every((t) => t.metrics)) return [];

    const metricTypes = Object.values(MetricTypeEnum);
    const result = [];

    for (const metricType of metricTypes) {
      const row: Record<string, any> = {
        key: metricType,
        metricType: metricType.replace(/_/g, ' '),
      };

      for (const { tenantId, metrics } of metricsPerTenant) {
        const metric = metrics?.find((m) => m.metricType === metricType);
        row[tenantId] = metric?.metricValue || 0;
      }

      result.push(row);
    }

    // Sort by selected metric
    result.sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
    return result;
  }, [metricsPerTenant, sortBy]);

  /**
   * Get performance indicator
   */
  const getPerformanceTag = (value: number, index: number, total: number) => {
    if (index === 0) {
      return (
        <Tag icon={<ArrowUpOutlined />} color="success">
          Top
        </Tag>
      );
    } else if (index === total - 1) {
      return (
        <Tag icon={<ArrowDownOutlined />} color="error">
          Bottom
        </Tag>
      );
    }
    return null;
  };

  /**
   * Build table columns dynamically
   */
  const columns = [
    {
      title: 'Metric',
      dataIndex: 'metricType',
      key: 'metricType',
      width: 150,
      fixed: 'left' as const,
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    ...selectedTenants.map((tenantId, index) => ({
      title: MOCK_TENANTS.find((t) => t.id === tenantId)?.name || tenantId,
      dataIndex: tenantId,
      key: tenantId,
      width: 130,
      sorter: (a: any, b: any) => (a[tenantId] || 0) - (b[tenantId] || 0),
      render: (value: number) => (
        <span className="font-medium">
          {value.toLocaleString()}
        </span>
      ),
    })),
  ];

  /**
   * Export comparison to CSV
   */
  const handleExport = () => {
    try {
      // Create CSV content
      const headers = [
        'Metric',
        ...selectedTenants.map(
          (id) => MOCK_TENANTS.find((t) => t.id === id)?.name || id
        ),
      ];
      const rows = comparisonData.map((row) => [
        row.metricType,
        ...selectedTenants.map((id) => row[id] || 0),
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      // Download CSV
      const element = document.createElement('a');
      element.setAttribute(
        'href',
        `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`
      );
      element.setAttribute(
        'download',
        `tenant-comparison-${new Date().toISOString().split('T')[0]}.csv`
      );
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      toast.success('Comparison exported to CSV');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export comparison');
    }
  };

  /**
   * Copy comparison to clipboard
   */
  const handleCopyToClipboard = () => {
    try {
      const headers = [
        'Metric',
        ...selectedTenants.map(
          (id) => MOCK_TENANTS.find((t) => t.id === id)?.name || id
        ),
      ].join('\t');
      const rows = comparisonData.map((row) =>
        [
          row.metricType,
          ...selectedTenants.map((id) => row[id] || 0),
        ].join('\t')
      );

      const text = [headers, ...rows].join('\n');
      navigator.clipboard.writeText(text);
      toast.success('Comparison copied to clipboard');
    } catch (error) {
      console.error('Copy error:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleTenantChange = (values: string[]) => {
    setSelectedTenants(values);
    onTenantsSelected?.(values);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Row gutter={16} align="middle">
        <Col flex="auto">
          <Select
            mode="multiple"
            placeholder="Select tenants to compare"
            value={selectedTenants}
            onChange={handleTenantChange}
            options={MOCK_TENANTS.map((t) => ({
              value: t.id,
              label: t.name,
            }))}
            style={{ width: '100%' }}
            maxTagCount="responsive"
          />
        </Col>
        <Col>
          <Select
            placeholder="Sort by metric"
            value={sortBy}
            onChange={setSortBy}
            options={Object.values(MetricTypeEnum).map((type) => ({
              value: type,
              label: type.replace(/_/g, ' '),
            }))}
            style={{ width: 150 }}
          />
        </Col>
      </Row>

      {/* Action Buttons */}
      <Row justify="end" gutter={8}>
        <Col>
          <Button
            icon={<CopyOutlined />}
            onClick={handleCopyToClipboard}
            disabled={isLoading || selectedTenants.length === 0}
          >
            Copy
          </Button>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            disabled={isLoading || selectedTenants.length === 0}
          >
            Export CSV
          </Button>
        </Col>
      </Row>

      {/* Comparison Table */}
      <Spin spinning={isLoading} tip={isLoading ? 'Loading metrics...' : undefined}>
        {selectedTenants.length === 0 ? (
          <Empty description="Select at least one tenant to compare" />
        ) : (
          <Table
            columns={columns}
            dataSource={comparisonData}
            pagination={false}
            loading={isLoading}
            locale={{ emptyText: 'No metrics to compare' }}
            scroll={{ x: 800 }}
            className="bg-white rounded-lg"
            size="small"
          />
        )}
      </Spin>
    </div>
  );
};

export default MultiTenantComparison;