/**
 * Filter Presets Modal for Product Sales
 * Allows users to save, load, and manage filter presets
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  message,
  List,
  Empty,
  Popconfirm,
  Tag,
  Row,
  Col,
  Divider,
  Tooltip,
  Card,
} from 'antd';
import { DeleteOutlined, SaveOutlined, ImportOutlined, CheckOutlined } from '@ant-design/icons';
import { ProductSaleFilters } from '@/types/productSales';

export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: ProductSaleFilters;
  createdAt: string;
  isShared?: boolean;
  sharedWith?: string[];
}

interface FilterPresetsModalProps {
  visible: boolean;
  currentFilters: ProductSaleFilters;
  onLoadPreset: (preset: FilterPreset) => void;
  onClose: () => void;
}

const STORAGE_KEY_PRESETS = 'productSalesFilterPresets';

export const FilterPresetsModal: React.FC<FilterPresetsModalProps> = ({
  visible,
  currentFilters,
  onLoadPreset,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'save' | 'manage'>('save');

  const loadPresets = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PRESETS);
      if (stored) {
        const parsedPresets = JSON.parse(stored) as FilterPreset[];
        setPresets(parsedPresets);
      }
    } catch (error) {
      console.error('Error loading presets:', error);
      message.error('Failed to load presets');
    }
  }, []);

  // Load presets from localStorage on mount
  useEffect(() => {
    if (visible) {
      loadPresets();
    }
  }, [visible, loadPresets]);

  const savePreset = async () => {
    if (!presetName.trim()) {
      message.error('Please enter a preset name');
      return;
    }

    try {
      setLoading(true);
      const newPreset: FilterPreset = {
        id: `preset_${Date.now()}`,
        name: presetName,
        description: presetDescription,
        filters: currentFilters,
        createdAt: new Date().toISOString(),
      };

      const updatedPresets = [...presets, newPreset];
      localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(updatedPresets));
      setPresets(updatedPresets);

      setPresetName('');
      setPresetDescription('');
      message.success(`Preset "${presetName}" saved successfully`);
      setActiveTab('manage');
    } catch (error) {
      console.error('Error saving preset:', error);
      message.error('Failed to save preset');
    } finally {
      setLoading(false);
    }
  };

  const deletePreset = (presetId: string) => {
    try {
      const updatedPresets = presets.filter(p => p.id !== presetId);
      localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(updatedPresets));
      setPresets(updatedPresets);
      message.success('Preset deleted successfully');
    } catch (error) {
      console.error('Error deleting preset:', error);
      message.error('Failed to delete preset');
    }
  };

  const handleLoadPreset = (preset: FilterPreset) => {
    onLoadPreset(preset);
    onClose();
    message.success(`Preset "${preset.name}" loaded`);
  };

  const formatFilterSummary = (filters: ProductSaleFilters): string => {
    const parts: string[] = [];
    
    if (filters.search) parts.push(`Search: ${filters.search}`);
    if (filters.sale_id) parts.push(`Sale ID: ${filters.sale_id}`);
    if (filters.status) parts.push(`Status: ${filters.status}`);
    if (filters.warranty_status) parts.push(`Warranty: ${filters.warranty_status}`);
    if (filters.min_amount) parts.push(`Min: $${filters.min_amount}`);
    if (filters.max_amount) parts.push(`Max: $${filters.max_amount}`);
    if (filters.date_from) parts.push(`From: ${filters.date_from}`);
    if (filters.date_to) parts.push(`To: ${filters.date_to}`);

    return parts.length > 0 ? parts.slice(0, 3).join(' | ') : 'No filters';
  };

  return (
    <Modal
      title="Filter Presets"
      open={visible}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <div>
        {/* Tab Navigation */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col>
            <Button
              type={activeTab === 'save' ? 'primary' : 'default'}
              onClick={() => setActiveTab('save')}
              icon={<SaveOutlined />}
            >
              Save New Preset
            </Button>
          </Col>
          <Col>
            <Button
              type={activeTab === 'manage' ? 'primary' : 'default'}
              onClick={() => setActiveTab('manage')}
              icon={<ImportOutlined />}
            >
              Manage Presets ({presets.length})
            </Button>
          </Col>
        </Row>

        <Divider />

        {/* Save Preset Tab */}
        {activeTab === 'save' && (
          <div>
            <Card
              title="Save Current Filters as Preset"
              style={{ marginBottom: 16 }}
            >
              <Form layout="vertical">
                <Form.Item label="Preset Name" required>
                  <Input
                    placeholder="e.g., High-value sales"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    onPressEnter={savePreset}
                  />
                </Form.Item>

                <Form.Item label="Description (optional)">
                  <Input.TextArea
                    placeholder="Describe what this preset is for..."
                    value={presetDescription}
                    onChange={(e) => setPresetDescription(e.target.value)}
                    rows={3}
                  />
                </Form.Item>

                <Form.Item label="Current Filters">
                  <div
                    style={{
                      padding: 12,
                      backgroundColor: '#f5f5f5',
                      borderRadius: 4,
                      fontSize: 12,
                      minHeight: 40,
                    }}
                  >
                    {formatFilterSummary(currentFilters)}
                  </div>
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={savePreset}
                      loading={loading}
                    >
                      Save Preset
                    </Button>
                    <Button
                      onClick={() => {
                        setPresetName('');
                        setPresetDescription('');
                      }}
                    >
                      Clear
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          </div>
        )}

        {/* Manage Presets Tab */}
        {activeTab === 'manage' && (
          <div>
            {presets.length === 0 ? (
              <Empty
                description="No presets saved"
                style={{ marginTop: 24, marginBottom: 24 }}
              >
                <Button
                  type="primary"
                  onClick={() => setActiveTab('save')}
                >
                  Create First Preset
                </Button>
              </Empty>
            ) : (
              <List
                dataSource={presets}
                renderItem={(preset) => (
                  <Card
                    style={{ marginBottom: 16 }}
                    size="small"
                    hoverable
                  >
                    <Row justify="space-between" align="middle">
                      <Col span={16}>
                        <div style={{ marginBottom: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 'bold' }}>
                            {preset.name}
                          </span>
                          {preset.isShared && (
                            <Tag color="blue" style={{ marginLeft: 8 }}>
                              Shared
                            </Tag>
                          )}
                        </div>
                        {preset.description && (
                          <div
                            style={{
                              fontSize: 12,
                              color: '#666',
                              marginBottom: 8,
                            }}
                          >
                            {preset.description}
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: 11,
                            color: '#999',
                            marginBottom: 8,
                          }}
                        >
                          Filters: {formatFilterSummary(preset.filters)}
                        </div>
                        <div style={{ fontSize: 11, color: '#999' }}>
                          Created: {new Date(preset.createdAt).toLocaleDateString()}
                        </div>
                      </Col>
                      <Col span={8} style={{ textAlign: 'right' }}>
                        <Space>
                          <Tooltip title="Load preset">
                            <Button
                              type="primary"
                              size="small"
                              icon={<ImportOutlined />}
                              onClick={() => handleLoadPreset(preset)}
                            >
                              Load
                            </Button>
                          </Tooltip>
                          <Popconfirm
                            title="Delete Preset"
                            description={`Are you sure you want to delete "${preset.name}"?`}
                            onConfirm={() => deletePreset(preset.id)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <Tooltip title="Delete preset">
                              <Button
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                              />
                            </Tooltip>
                          </Popconfirm>
                        </Space>
                      </Col>
                    </Row>
                  </Card>
                )}
              />
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default FilterPresetsModal;