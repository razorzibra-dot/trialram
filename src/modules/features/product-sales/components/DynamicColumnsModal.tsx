/**
 * Dynamic Columns Modal - Product Sales
 * Allows users to show/hide, reorder, and manage table columns
 * Preferences are saved to localStorage for persistence
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  List,
  Checkbox,
  Button,
  Space,
  Row,
  Col,
  message,
  Empty,
  Divider,
  Tag,
  Tooltip,
  Alert
} from 'antd';
import {
  DragOutlined,
  CheckOutlined,
  UndoOutlined,
  SaveOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { ProductSale } from '@/types/productSales';

// Storage key for column preferences
const STORAGE_KEY_COLUMN_PREFS = 'product_sales_column_prefs';

// Column configuration
export interface ColumnConfig {
  key: string;
  title: string;
  visible: boolean;
  order: number;
}

// Default column configuration
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'sale_number', title: 'Sale #', visible: true, order: 0 },
  { key: 'customer_id', title: 'Customer ID', visible: true, order: 1 },
  { key: 'product_id', title: 'Product ID', visible: true, order: 2 },
  { key: 'quantity', title: 'Quantity', visible: true, order: 3 },
  { key: 'unit_price', title: 'Unit Price', visible: true, order: 4 },
  { key: 'total_value', title: 'Total Value', visible: true, order: 5 },
  { key: 'status', title: 'Status', visible: true, order: 6 },
  { key: 'sale_date', title: 'Sale Date', visible: true, order: 7 },
  { key: 'actions', title: 'Actions', visible: true, order: 8 } // Always visible
];

interface DynamicColumnsModalProps {
  visible: boolean;
  onClose: () => void;
  onColumnsChange: (columns: ColumnConfig[]) => void;
}

export const DynamicColumnsModal: React.FC<DynamicColumnsModalProps> = ({
  visible,
  onClose,
  onColumnsChange
}) => {
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [isChanged, setIsChanged] = useState(false);

  // Load preferences from localStorage on component mount
  const loadColumnPrefs = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COLUMN_PREFS);
      if (saved) {
        const parsedPrefs = JSON.parse(saved);
        // Merge with defaults to handle new columns added in future
        const merged = DEFAULT_COLUMNS.map(defaultCol => ({
          ...defaultCol,
          ...parsedPrefs.find((p: ColumnConfig) => p.key === defaultCol.key)
        })).sort((a, b) => a.order - b.order);
        setColumns(merged);
      } else {
        setColumns(DEFAULT_COLUMNS);
      }
      setIsChanged(false);
    } catch (error) {
      console.error('Failed to load column preferences:', error);
      setColumns(DEFAULT_COLUMNS);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadColumnPrefs();
    }
  }, [visible, loadColumnPrefs]);

  // Toggle column visibility
  const handleToggleVisibility = (key: string) => {
    // Actions column is always visible
    if (key === 'actions') {
      message.info('Actions column is always visible');
      return;
    }

    setColumns(prevColumns =>
      prevColumns.map(col =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
    setIsChanged(true);
  };

  // Move column up in order
  const handleMoveUp = (index: number) => {
    if (index === 0) return;

    const newColumns = [...columns];
    const temp = newColumns[index];
    newColumns[index] = newColumns[index - 1];
    newColumns[index - 1] = temp;

    // Update order values
    newColumns.forEach((col, idx) => {
      col.order = idx;
    });

    setColumns(newColumns);
    setIsChanged(true);
  };

  // Move column down in order
  const handleMoveDown = (index: number) => {
    if (index === columns.length - 1) return;

    const newColumns = [...columns];
    const temp = newColumns[index];
    newColumns[index] = newColumns[index + 1];
    newColumns[index + 1] = temp;

    // Update order values
    newColumns.forEach((col, idx) => {
      col.order = idx;
    });

    setColumns(newColumns);
    setIsChanged(true);
  };

  // Save preferences to localStorage
  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY_COLUMN_PREFS, JSON.stringify(columns));
      onColumnsChange(columns);
      setIsChanged(false);
      message.success('Column preferences saved');
      onClose();
    } catch (error) {
      console.error('Failed to save column preferences:', error);
      message.error('Failed to save preferences');
    }
  };

  // Reset to default layout
  const handleReset = () => {
    setColumns(DEFAULT_COLUMNS);
    setIsChanged(true);
    message.info('Reset to default layout');
  };

  // Reset and save defaults
  const handleResetAndSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY_COLUMN_PREFS, JSON.stringify(DEFAULT_COLUMNS));
      onColumnsChange(DEFAULT_COLUMNS);
      setColumns(DEFAULT_COLUMNS);
      setIsChanged(false);
      message.success('Column layout reset to default');
      onClose();
    } catch (error) {
      console.error('Failed to reset column preferences:', error);
      message.error('Failed to reset preferences');
    }
  };

  // Count visible columns
  const visibleCount = columns.filter(col => col.visible).length;
  const hiddenCount = columns.filter(col => !col.visible).length;

  return (
    <Modal
      title="Manage Columns"
      visible={visible}
      onCancel={onClose}
      width={600}
      centered
      footer={[
        <Button key="reset" onClick={handleResetAndSave} danger>
          <UndoOutlined /> Reset to Default
        </Button>,
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSave}
          disabled={!isChanged}
          icon={<SaveOutlined />}
        >
          Save Changes
        </Button>
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <Alert
          message="Drag items to reorder, use toggle to show/hide columns, or reset to default layout"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div>
            <EyeOutlined style={{ marginRight: 8 }} />
            Visible: <Tag color="blue">{visibleCount}</Tag>
          </div>
          <div>
            <EyeInvisibleOutlined style={{ marginRight: 8 }} />
            Hidden: <Tag color="default">{hiddenCount}</Tag>
          </div>
        </div>
      </div>

      <Divider />

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <List
          dataSource={columns}
          renderItem={(column, index) => (
            <List.Item
              key={column.key}
              style={{
                padding: '12px 0',
                borderBottom: index === columns.length - 1 ? 'none' : '1px solid #f0f0f0'
              }}
            >
              <div style={{ width: '100%' }}>
                <Row gutter={12} align="middle">
                  <Col span={2}>
                    <Tooltip title="Drag to reorder">
                      <DragOutlined style={{ cursor: 'grab', color: '#999' }} />
                    </Tooltip>
                  </Col>
                  <Col span={2}>
                    <Checkbox
                      checked={column.visible}
                      onChange={() => handleToggleVisibility(column.key)}
                      disabled={column.key === 'actions'}
                    />
                  </Col>
                  <Col span={10}>
                    <span
                      style={{
                        fontWeight: 500,
                        opacity: column.visible ? 1 : 0.5
                      }}
                    >
                      {column.title}
                    </span>
                    {column.key === 'actions' && (
                      <Tag
                        color="cyan"
                        style={{ marginLeft: 8 }}
                      >
                        Always Visible
                      </Tag>
                    )}
                  </Col>
                  <Col span={10} style={{ textAlign: 'right' }}>
                    <Space size="small">
                      <Tooltip title="Move up">
                        <Button
                          type="text"
                          size="small"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                      </Tooltip>
                      <Tooltip title="Move down">
                        <Button
                          type="text"
                          size="small"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === columns.length - 1}
                        >
                          ↓
                        </Button>
                      </Tooltip>
                    </Space>
                  </Col>
                </Row>
              </div>
            </List.Item>
          )}
        />
      </div>

      {columns.length === 0 && <Empty description="No columns available" />}
    </Modal>
  );
};

// Export column configuration utility
export const getVisibleColumns = (): ColumnConfig[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_COLUMN_PREFS);
    if (saved) {
      return JSON.parse(saved).filter((col: ColumnConfig) => col.visible);
    }
  } catch (error) {
    console.error('Failed to get visible columns:', error);
  }
  return DEFAULT_COLUMNS.filter(col => col.visible);
};

// Export function to apply column configuration to table columns
export const applyColumnConfig = (
  tableColumns: ColumnsType<ProductSale>,
  columnConfig: ColumnConfig[]
): ColumnsType<ProductSale> => {
  // Create a map for quick lookup
  const configMap = new Map(columnConfig.map(c => [c.key, c]));

  // Filter and reorder columns
  return tableColumns
    .filter(col => {
      const config = configMap.get(col.key as string);
      return config ? config.visible : true;
    })
    .sort((a, b) => {
      const configA = configMap.get(a.key as string);
      const configB = configMap.get(b.key as string);
      const orderA = configA?.order ?? 999;
      const orderB = configB?.order ?? 999;
      return orderA - orderB;
    });
};

// Export hook for using dynamic columns
export const useDynamicColumns = () => {
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);

  const loadConfig = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COLUMN_PREFS);
      if (saved) {
        setColumnConfig(JSON.parse(saved));
      } else {
        setColumnConfig(DEFAULT_COLUMNS);
      }
    } catch (error) {
      console.error('Failed to load column config:', error);
      setColumnConfig(DEFAULT_COLUMNS);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return { columnConfig, loadConfig };
};