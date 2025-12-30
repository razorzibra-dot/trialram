import React from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Tabs, Spin, Alert, Empty } from 'antd';
import type { AnalyticsConfig, AnalyticsSection, AnalyticsWidgetConfig, StatWidgetConfig, ProgressWidgetConfig, TableWidgetConfig, ListWidgetConfig, CustomWidgetConfig } from '@/types/analytics';
import { useAuth } from '@/contexts/AuthContext';

interface GenericAnalyticsPageProps {
  config: AnalyticsConfig;
  data: Record<string, any>;
  loading?: boolean;
  loadingMap?: Record<string, boolean>;
  error?: Error | null;
  onRetry?: () => void;
}

const defaultColumns = { xs: 24, sm: 12, md: 12, lg: 6, xl: 6 };

export const GenericAnalyticsPage: React.FC<GenericAnalyticsPageProps> = ({
  config,
  data,
  loading = false,
  loadingMap = {},
  error,
  onRetry,
}) => {
  const { hasPermission } = useAuth();

  if (config.permission && !hasPermission(config.permission)) {
    return (
      <Alert
        type="warning"
        message="Permission denied"
        description="You do not have permission to view this analytics page."
        showIcon
      />
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        message="Failed to load analytics"
        description={error.message}
        action={onRetry ? <a onClick={onRetry}>Retry</a> : null}
        showIcon
      />
    );
  }

  const renderWidget = (widget: AnalyticsWidgetConfig) => {
    if (widget.permission && !hasPermission(widget.permission)) {
      return null;
    }

    const loadingKey = (widget as any).loadingKey as string | undefined;
    const isLoading = loading || (loadingKey ? loadingMap[loadingKey] : false);

    switch (widget.type) {
      case 'stat': {
        const w = widget as StatWidgetConfig;
        const value = w.formatter ? w.formatter(data) : w.value(data);
        return (
          <Card title={w.title} bordered>
            <Spin spinning={!!isLoading}>
              <Statistic
                value={value as any}
                prefix={w.prefix}
                suffix={w.suffix}
                valueStyle={w.color ? { color: w.color } : undefined}
              />
              {w.description && (
                <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>{w.description}</div>
              )}
            </Spin>
          </Card>
        );
      }
      case 'progress': {
        const w = widget as ProgressWidgetConfig;
        const value = w.formatter ? w.formatter(data) : w.value(data);
        const percent = w.percent(data);
        return (
          <Card title={w.title} bordered>
            <Spin spinning={!!isLoading}>
              <Statistic
                value={value as any}
                prefix={w.prefix}
                suffix={w.suffix}
                valueStyle={w.color ? { color: w.color } : undefined}
              />
              <Progress percent={percent} strokeColor={w.color} showInfo={false} style={{ marginTop: 8 }} />
              {w.description && (
                <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>{w.description}</div>
              )}
            </Spin>
          </Card>
        );
      }
      case 'table': {
        const w = widget as TableWidgetConfig;
        const dataSource = w.dataSource(data) || [];
        return (
          <Card title={w.title} bordered>
            <Spin spinning={!!isLoading}>
              <Table
                size="small"
                columns={w.columns}
                dataSource={dataSource}
                rowKey={w.rowKey || 'id'}
                pagination={false}
                locale={{ emptyText: w.emptyText || <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
              />
            </Spin>
          </Card>
        );
      }
      case 'list': {
        const w = widget as ListWidgetConfig;
        const items = w.items(data) || [];
        if (!items.length) {
          return (
            <Card title={w.title} bordered>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </Card>
          );
        }
        return (
          <Card title={w.title} bordered>
            <Spin spinning={!!isLoading}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 500 }}>{item.label}</span>
                      {item.extra && <span style={{ fontSize: 12, color: '#8c8c8c' }}>{item.extra}</span>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {item.value !== undefined && <div style={{ fontWeight: 600 }}>{item.value}</div>}
                      {item.percent !== undefined && (
                        <Progress
                          percent={item.percent}
                          strokeColor={item.color}
                          showInfo
                          size="small"
                          style={{ width: 160, marginTop: 4 }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Spin>
          </Card>
        );
      }
      case 'custom': {
        const w = widget as CustomWidgetConfig;
        return (
          <Card title={w.title} bordered>
            <Spin spinning={!!isLoading}>{w.render(data)}</Spin>
          </Card>
        );
      }
      default:
        return null;
    }
  };

  const renderSection = (section: AnalyticsSection) => {
    if (section.type === 'tabs' && section.tabs) {
      return (
        <Card>
          <Tabs size="large">
            {section.tabs.map((tab) => (
              <Tabs.TabPane tab={tab.label} key={tab.key}>
                {tab.sections.map((s) => renderSection(s))}
              </Tabs.TabPane>
            ))}
          </Tabs>
        </Card>
      );
    }

    if (section.type === 'grid' && section.widgets) {
      const cols = { ...defaultColumns, ...(section.columns || {}) };
      return (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {section.widgets.map((widget) => (
            <Col key={widget.id} {...cols}>
              {renderWidget(widget)}
            </Col>
          ))}
        </Row>
      );
    }

    return null;
  };

  return (
    <div style={{ padding: 24 }}>
      {config.sections.map((section) => (
        <React.Fragment key={section.id}>{renderSection(section)}</React.Fragment>
      ))}
    </div>
  );
};

export default GenericAnalyticsPage;
