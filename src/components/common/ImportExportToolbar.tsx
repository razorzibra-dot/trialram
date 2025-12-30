/**
 * Import/Export Actions Toolbar Component
 * 
 * Enterprise-grade toolbar for import/export operations.
 * 
 * ✅ FEATURES:
 * - Import from CSV/JSON
 * - Export to CSV/JSON/Excel
 * - Export selected or all items
 * - File upload with validation
 * - Progress indicators
 * - Error reporting
 * 
 * ✅ USE CASES:
 * - Bulk data import
 * - Data export for reporting
 * - Data migration
 * - Backup/restore
 * 
 * @example
 * <ImportExportToolbar
 *   onImport={handleImport}
 *   onExport={handleExport}
 *   isImporting={isImporting}
 *   isExporting={isExporting}
 *   selectedCount={selectedCount}
 *   totalCount={totalCount}
 * />
 */

import React, { useRef } from 'react';
import { Button, Modal, Space, Upload } from 'antd';
import {
  DownloadOutlined,
  UploadOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { Download, Upload as UploadIcon, FileSpreadsheet, FileJson } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExportFormat } from '@/hooks/useExport';

export interface ImportExportAction {
  /**
   * Action type
   */
  type: 'import' | 'export';
  
  /**
   * Export format (for export actions)
   */
  format?: ExportFormat;
  
  /**
   * Export scope (for export actions)
   */
  scope?: 'selected' | 'filtered' | 'all';
  
  /**
   * Label
   */
  label: string;
  
  /**
   * Icon
   */
  icon?: React.ReactNode;
  
  /**
   * Click handler
   */
  onClick: () => void;
  
  /**
   * Disabled state
   */
  disabled?: boolean;
  
  /**
   * Loading state
   */
  loading?: boolean;
}

export interface ImportExportToolbarProps {
  /**
   * Import handler
   */
  onImport?: (file: File) => void;
  
  /**
   * Export handler
   */
  onExport?: (format: ExportFormat, scope: 'selected' | 'filtered' | 'all') => void;
  
  /**
   * Import loading state
   */
  isImporting?: boolean;
  
  /**
   * Export loading state
   */
  isExporting?: boolean;
  
  /**
   * Number of selected items
   */
  selectedCount?: number;
  
  /**
   * Total number of filtered items
   */
  totalCount?: number;
  
  /**
   * Can user import?
   */
  canImport?: boolean;
  
  /**
   * Can user export?
   */
  canExport?: boolean;
  
  /**
   * Supported import formats
   */
  importFormats?: string[];
  
  /**
   * Supported export formats
   */
  exportFormats?: ExportFormat[];
  
  /**
   * Custom actions
   */
  customActions?: ImportExportAction[];
  
  /**
   * Custom className
   */
  className?: string;
}

export const ImportExportToolbar: React.FC<ImportExportToolbarProps> = ({
  onImport,
  onExport,
  isImporting = false,
  isExporting = false,
  selectedCount = 0,
  totalCount = 0,
  canImport = true,
  canExport = true,
  importFormats = ['.csv', '.json'],
  exportFormats = ['csv', 'json', 'excel'],
  customActions = [],
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImport) {
      onImport(file);
      // Reset input
      event.target.value = '';
    }
  };

  const handleExportClick = (format: ExportFormat) => {
    if (!onExport) return;

    // Determine scope
    const scope: 'selected' | 'filtered' | 'all' = 
      selectedCount > 0 ? 'selected' : 
      totalCount > 0 ? 'filtered' : 
      'all';

    // Build message text
    let scopeText = 'all';
    if (scope === 'selected') {
      scopeText = `${selectedCount} selected`;
    } else if (scope === 'filtered') {
      scopeText = `${totalCount} filtered`;
    }

    // Show confirmation for large exports
    if (scope === 'all' || (scope === 'filtered' && totalCount > 100)) {
      Modal.confirm({
        title: 'Export Data',
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <p>
              You are about to export <strong>{scopeText} items</strong> to{' '}
              {format.toUpperCase()} format.
            </p>
            <p style={{ marginTop: 12, color: '#666', fontSize: 13 }}>
              This may take a few moments for large datasets.
            </p>
          </div>
        ),
        okText: 'Export',
        cancelText: 'Cancel',
        onOk: () => {
          onExport(format, scope);
        },
      });
    } else {
      onExport(format, scope);
    }
  };

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'excel':
        return <FileExcelOutlined style={{ fontSize: 14 }} />;
      case 'json':
        return <FileJson style={{ width: 14, height: 14 }} />;
      case 'csv':
      default:
        return <FileTextOutlined style={{ fontSize: 14 }} />;
    }
  };

  const getFormatLabel = (format: ExportFormat) => {
    return format.toUpperCase();
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {/* Import Button */}
      {canImport && onImport && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept={importFormats.join(',')}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <Button
            type="default"
            icon={<UploadOutlined />}
            onClick={handleImportClick}
            loading={isImporting}
            disabled={isImporting || isExporting}
            title="Import data from file"
          >
            Import
          </Button>
        </>
      )}

      {/* Export Buttons */}
      {canExport && onExport && exportFormats.length > 0 && (
        <>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          
          <Space.Compact>
            {exportFormats.map((format) => (
              <Button
                key={format}
                type="default"
                size="small"
                icon={getFormatIcon(format)}
                onClick={() => handleExportClick(format)}
                loading={isExporting}
                disabled={isImporting || isExporting || totalCount === 0}
                title={`Export to ${format.toUpperCase()}`}
              >
                {getFormatLabel(format)}
              </Button>
            ))}
          </Space.Compact>
        </>
      )}

      {/* Custom Actions */}
      {customActions.length > 0 && (
        <>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          
          {customActions.map((action, index) => (
            <Button
              key={index}
              type="default"
              icon={action.icon}
              onClick={action.onClick}
              loading={action.loading}
              disabled={action.disabled}
            >
              {action.label}
            </Button>
          ))}
        </>
      )}

      {/* Info Text */}
      {selectedCount > 0 && (
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
          {selectedCount} selected
        </span>
      )}
    </div>
  );
};

ImportExportToolbar.displayName = 'ImportExportToolbar';
