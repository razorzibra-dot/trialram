/**
 * Export Modal for Product Sales
 * Handles CSV and PDF export with column selection
 */

import React, { useState } from 'react';
import {
  Modal,
  Form,
  Select,
  Button,
  Space,
  message,
  Checkbox,
  Row,
  Col,
  Radio,
  Divider,
  Empty,
} from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { ProductSale } from '@/types/productSales';
import * as XLSX from 'xlsx';

interface ExportModalProps {
  open: boolean;
  data: ProductSale[];
  onClose: () => void;
}

interface ExportColumn {
  key: string;
  label: string;
  default: boolean;
}

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'id', label: 'Sale ID', default: true },
  { key: 'customer_id', label: 'Customer ID', default: true },
  { key: 'product_id', label: 'Product ID', default: true },
  { key: 'units', label: 'Units', default: true },
  { key: 'cost_per_unit', label: 'Cost Per Unit', default: true },
  { key: 'total_cost', label: 'Total Cost', default: true },
  { key: 'status', label: 'Status', default: true },
  { key: 'delivery_date', label: 'Delivery Date', default: true },
  { key: 'warranty_expiry', label: 'Warranty Expiry', default: false },
  { key: 'notes', label: 'Notes', default: false },
  { key: 'created_at', label: 'Created At', default: false },
  { key: 'updated_at', label: 'Updated At', default: false },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  open,
  data,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    EXPORT_COLUMNS.filter((c) => c.default).map((c) => c.key)
  );
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');

  const handleColumnChange = (columnKey: string, checked: boolean) => {
    if (checked) {
      setSelectedColumns([...selectedColumns, columnKey]);
    } else {
      setSelectedColumns(selectedColumns.filter((c) => c !== columnKey));
    }
  };

  const handleSelectAll = () => {
    if (selectedColumns.length === EXPORT_COLUMNS.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(EXPORT_COLUMNS.map((c) => c.key));
    }
  };

  const formatCellValue = (value: any, key: string): string => {
    if (value === null || value === undefined) return '';

    switch (key) {
      case 'cost_per_unit':
      case 'total_cost':
        return typeof value === 'number' ? `$${value.toFixed(2)}` : String(value);
      case 'delivery_date':
      case 'warranty_expiry':
      case 'created_at':
      case 'updated_at':
        return new Date(value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      default:
        return String(value);
    }
  };

  const exportToCSV = () => {
    if (selectedColumns.length === 0) {
      message.error('Please select at least one column to export');
      return;
    }

    try {
      // Prepare data
      const headers = selectedColumns.map((col) => {
        const column = EXPORT_COLUMNS.find((c) => c.key === col);
        return column?.label || col;
      });

      const rows = data.map((item) =>
        selectedColumns.map((col) => formatCellValue(item[col as keyof ProductSale], col))
      );

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row
            .map((cell) =>
              cell.includes(',') || cell.includes('"') || cell.includes('\n')
                ? `"${cell.replace(/"/g, '""')}"`
                : cell
            )
            .join(',')
        ),
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `product_sales_${new Date().getTime()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success(`${data.length} records exported to CSV successfully`);
      onClose();
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      message.error('Failed to export to CSV');
    }
  };

  const exportToExcel = () => {
    if (selectedColumns.length === 0) {
      message.error('Please select at least one column to export');
      return;
    }

    try {
      // Prepare data
      const headers = selectedColumns.map((col) => {
        const column = EXPORT_COLUMNS.find((c) => c.key === col);
        return column?.label || col;
      });

      const rows = data.map((item) =>
        selectedColumns.map((col) => formatCellValue(item[col as keyof ProductSale], col))
      );

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      
      // Set column widths
      ws['!cols'] = selectedColumns.map(() => ({ wch: 20 }));

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Product Sales');

      // Write file
      XLSX.writeFile(wb, `product_sales_${new Date().getTime()}.xlsx`);

      message.success(`${data.length} records exported to Excel successfully`);
      onClose();
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      message.error('Failed to export to Excel');
    }
  };

  const handleExport = () => {
    if (exportFormat === 'csv') {
      exportToCSV();
    } else {
      exportToExcel();
    }
  };

  return (
    <Modal
      title="Export Product Sales"
      open={open}
      onCancel={onClose}
      width={600}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            disabled={selectedColumns.length === 0}
          >
            Export ({data.length} records)
          </Button>
        </Space>
      }
    >
      {data.length === 0 ? (
        <Empty description="No data to export" />
      ) : (
        <>
          {/* Export Format Selection */}
          <Form layout="vertical">
            <Form.Item label="Export Format" required>
              <Radio.Group
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
              >
                <Radio value="csv">CSV (.csv)</Radio>
                <Radio value="pdf">Excel (.xlsx)</Radio>
              </Radio.Group>
            </Form.Item>
          </Form>

          <Divider>Select Columns to Export</Divider>

          {/* Column Selection */}
          <div style={{ marginBottom: 16 }}>
            <Button
              size="small"
              onClick={handleSelectAll}
              style={{ marginBottom: 12 }}
            >
              {selectedColumns.length === EXPORT_COLUMNS.length
                ? 'Deselect All'
                : 'Select All'}
            </Button>
            <div style={{ fontSize: 12, color: '#999' }}>
              Selected: {selectedColumns.length} / {EXPORT_COLUMNS.length}
            </div>
          </div>

          <Row gutter={[16, 12]}>
            {EXPORT_COLUMNS.map((column) => (
              <Col key={column.key} span={12}>
                <Checkbox
                  checked={selectedColumns.includes(column.key)}
                  onChange={(e) => handleColumnChange(column.key, e.target.checked)}
                >
                  {column.label}
                </Checkbox>
              </Col>
            ))}
          </Row>

          <Divider />

          {/* Export Summary */}
          <div style={{ fontSize: 12, color: '#666' }}>
            <strong>Export Summary:</strong>
            <div>• Format: {exportFormat.toUpperCase()}</div>
            <div>• Columns: {selectedColumns.length} selected</div>
            <div>• Records: {data.length}</div>
            <div>• File: product_sales_[timestamp].{exportFormat === 'csv' ? 'csv' : 'xlsx'}</div>
          </div>
        </>
      )}
    </Modal>
  );
};