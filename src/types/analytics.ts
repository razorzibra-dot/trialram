import { ReactNode } from 'react';

export type AnalyticsWidgetType = 'stat' | 'progress' | 'table' | 'list' | 'custom';

export interface AnalyticsWidgetBase {
  id: string;
  title?: string;
  description?: string;
  permission?: string;
  type: AnalyticsWidgetType;
}

export interface StatWidgetConfig extends AnalyticsWidgetBase {
  type: 'stat';
  value: (data: any) => number | string | ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  color?: string;
  formatter?: (value: any) => ReactNode;
  loadingKey?: string;
}

export interface ProgressWidgetConfig extends AnalyticsWidgetBase {
  type: 'progress';
  value: (data: any) => number;
  percent: (data: any) => number;
  suffix?: ReactNode;
  prefix?: ReactNode;
  color?: string;
  formatter?: (value: any) => ReactNode;
  loadingKey?: string;
}

export interface TableColumnConfig {
  title: string;
  dataIndex?: string;
  key?: string;
  render?: (value: any, record: any, index: number) => ReactNode;
}

export interface TableWidgetConfig extends AnalyticsWidgetBase {
  type: 'table';
  columns: TableColumnConfig[];
  dataSource: (data: any) => any[];
  rowKey?: string;
  loadingKey?: string;
  emptyText?: string;
}

export interface ListItemConfig {
  id: string;
  label: ReactNode;
  value?: ReactNode;
  percent?: number;
  color?: string;
  extra?: ReactNode;
}

export interface ListWidgetConfig extends AnalyticsWidgetBase {
  type: 'list';
  items: (data: any) => ListItemConfig[];
  loadingKey?: string;
}

export interface CustomWidgetConfig extends AnalyticsWidgetBase {
  type: 'custom';
  render: (data: any) => ReactNode;
  loadingKey?: string;
}

export type AnalyticsWidgetConfig =
  | StatWidgetConfig
  | ProgressWidgetConfig
  | TableWidgetConfig
  | ListWidgetConfig
  | CustomWidgetConfig;

export interface AnalyticsSection {
  id: string;
  title?: string;
  type: 'grid' | 'tabs';
  widgets?: AnalyticsWidgetConfig[];
  columns?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  tabs?: AnalyticsTabConfig[];
}

export interface AnalyticsTabConfig {
  key: string;
  label: ReactNode;
  sections: AnalyticsSection[];
}

export interface AnalyticsConfig {
  title: string;
  description?: string;
  breadcrumb?: { title: string; path?: string }[];
  permission?: string;
  sections: AnalyticsSection[];
}
