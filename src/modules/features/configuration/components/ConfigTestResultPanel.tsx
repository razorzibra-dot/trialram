/**
 * Configuration Test Result Panel
 * Side drawer panel for displaying configuration test results
 */

import React from 'react';
import {
  Drawer,
  Button,
  Descriptions,
  Result,
  Timeline,
  Empty,
  Divider,
  Tag,
  Space,
  Row,
  Col,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { ConfigTestResult, ConfigTestHistory } from '../types/configTest';

interface ConfigTestResultPanelProps {
  visible: boolean;
  result: ConfigTestResult | null;
  history?: ConfigTestHistory[];
  loading?: boolean;
  onClose: () => void;
}

export const ConfigTestResultPanel: React.FC<ConfigTestResultPanelProps> = ({
  visible,
  result,
  history = [],
  loading = false,
  onClose,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />;
      case 'testing':
        return <ClockCircleOutlined style={{ color: '#1890ff', fontSize: 16 }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'testing':
        return 'processing';
      default:
        return 'default';
    }
  };

  if (!result) {
    return (
      <Drawer
        title="Test Results"
        placement="right"
        onClose={onClose}
        open={visible}
        width={500}
      >
        <Empty description="No test results" />
      </Drawer>
    );
  }

  return (
    <Drawer
      title="Test Results"
      placement="right"
      onClose={onClose}
      open={visible}
      width={500}
      loading={loading}
      footer={
        <Row gutter={8} justify="end">
          <Col>
            <Button onClick={onClose}>Close</Button>
          </Col>
        </Row>
      }
    >
      <div style={{ marginBottom: 24 }}>
        {/* Result Status */}
        <div style={{ marginBottom: 24 }}>
          <Result
            status={result.status as any}
            title={result.message}
            subTitle={result.details}
            extra={
              <Space>
                <Tag color={getStatusColor(result.status)}>
                  {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                </Tag>
                {result.duration && (
                  <Tag>Duration: {result.duration}ms</Tag>
                )}
              </Space>
            }
          />
        </div>

        {/* Test Details */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Test Information</div>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Status" span={1}>
              <Tag color={getStatusColor(result.status)}>
                {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Message" span={1}>
              {result.message}
            </Descriptions.Item>

            {result.details && (
              <Descriptions.Item label="Details" span={1}>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                  {result.details}
                </div>
              </Descriptions.Item>
            )}

            <Descriptions.Item label="Tested At" span={1}>
              {new Date(result.timestamp).toLocaleString()}
            </Descriptions.Item>

            {result.duration && (
              <Descriptions.Item label="Duration" span={1}>
                {result.duration}ms
              </Descriptions.Item>
            )}
          </Descriptions>
        </div>

        {/* Test History */}
        {history && history.length > 0 && (
          <>
            <Divider />
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Recent Test History</div>
              <Timeline
                items={history.slice(0, 10).map((item) => ({
                  dot: getStatusIcon(item.status),
                  children: (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{
                        fontWeight: 500,
                        marginBottom: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                        {item.message}
                        <Tag color={getStatusColor(item.status)}>
                          {item.status}
                        </Tag>
                      </div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ),
                }))}
              />
            </div>
          </>
        )}

        {/* Success Tips */}
        {result.status === 'success' && (
          <>
            <Divider />
            <div style={{
              padding: 12,
              backgroundColor: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 4,
              fontSize: 12,
              color: '#52c41a',
            }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>✓ Configuration is working correctly</div>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>All required credentials are valid</li>
                <li>Connection is established</li>
                <li>Service is responding normally</li>
              </ul>
            </div>
          </>
        )}

        {/* Error Tips */}
        {result.status === 'error' && (
          <>
            <Divider />
            <div style={{
              padding: 12,
              backgroundColor: '#fff1f0',
              border: '1px solid #ffa39e',
              borderRadius: 4,
              fontSize: 12,
              color: '#ff4d4f',
            }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>✗ Configuration test failed</div>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Please verify your configuration settings</li>
                <li>Check API credentials and endpoints</li>
                <li>Ensure network connectivity</li>
                <li>Review error message for details</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
};