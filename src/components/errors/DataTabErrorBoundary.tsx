/**
 * Data Tab Error Boundary
 * Ant Design compatible error boundary for data loading in tabs
 * Provides retry functionality for failed data loads
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
  tabName: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class DataTabErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error });
    console.error(`Error in ${this.props.tabName}:`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Failed to load data';
      
      return (
        <div style={{ padding: '16px' }}>
          <Alert
            message={`Error Loading ${this.props.tabName}`}
            description={errorMessage}
            type="error"
            showIcon
            action={
              <Button
                size="small"
                danger
                onClick={this.handleRetry}
                icon={<ReloadOutlined />}
              >
                Retry
              </Button>
            }
            style={{ marginBottom: 0 }}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default DataTabErrorBoundary;