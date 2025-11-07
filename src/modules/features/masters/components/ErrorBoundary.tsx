/**
 * Error Boundary for Masters Module
 * Catches and displays errors in Products and Companies components
 * Provides fallback UI and error recovery options
 * 
 * @component
 * @example
 * <MastersErrorBoundary>
 *   <ProductsList />
 * </MastersErrorBoundary>
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Result, Button, Collapse, Drawer } from 'antd';
import { ReloadOutlined, BugOutlined } from '@ant-design/icons';
import './ErrorBoundary.css';

/**
 * Props for ErrorBoundary component
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * State for ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isDrawerOpen: boolean;
}

/**
 * Masters Module Error Boundary Component
 * Catches errors in child components and provides graceful error handling
 */
class MastersErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isDrawerOpen: false,
    };
  }

  /**
   * Update state when an error occurs
   * @param {Error} error - The error that was thrown
   * @returns {ErrorBoundaryState} Updated state
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error to console and call onError callback
   * @param {Error} error - The error that occurred
   * @param {ErrorInfo} errorInfo - Additional error information
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with detailed error information
    this.setState({
      errorInfo,
    });

    // Log to console for debugging
    console.error('Masters Module Error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Optionally send error to external logging service
    this.logErrorToService(error, errorInfo);
  }

  /**
   * Log error to external service
   * @param {Error} error - The error to log
   * @param {ErrorInfo} errorInfo - Error details
   */
  private logErrorToService = (error: Error, errorInfo: ErrorInfo): void => {
    // TODO: Implement external error logging (e.g., Sentry, LogRocket)
    // Example:
    // errorTrackingService.captureException(error, {
    //   contexts: {
    //     component: {
      //       componentStack: errorInfo.componentStack,
    //     },
    //   },
    // });
  };

  /**
   * Reset error boundary and retry
   */
  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Toggle error details drawer
   */
  handleToggleDetails = (): void => {
    this.setState((prevState) => ({
      isDrawerOpen: !prevState.isDrawerOpen,
    }));
  };

  /**
   * Copy error details to clipboard
   */
  handleCopyError = (): void => {
    const { error, errorInfo } = this.state;
    const errorText = `
Error: ${error?.message}

Stack: ${error?.stack}

Component Stack:
${errorInfo?.componentStack}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      // Show success message
      const div = document.createElement('div');
      div.textContent = 'Error details copied to clipboard';
      div.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        background: #52c41a;
        color: white;
        padding: 12px 16px;
        border-radius: 4px;
        z-index: 9999;
      `;
      document.body.appendChild(div);
      setTimeout(() => div.remove(), 3000);
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, isDrawerOpen } = this.state;
    const { children, fallback } = this.props;

    // If no error, render children normally
    if (!hasError) {
      return children;
    }

    // If custom fallback provided, use it
    if (fallback) {
      return fallback;
    }

    // Default error UI
    return (
      <>
        <div className="masters-error-boundary">
          <Result
            status="error"
            title="Something went wrong"
            subTitle="An error occurred in the Masters module. Our team has been notified."
            extra={[
              <Button
                key="retry"
                type="primary"
                icon={<ReloadOutlined />}
                onClick={this.handleRetry}
              >
                Try Again
              </Button>,
              <Button
                key="details"
                icon={<BugOutlined />}
                onClick={this.handleToggleDetails}
              >
                View Details
              </Button>,
            ]}
          />

          {/* Additional Information */}
          <div className="masters-error-info" style={{ marginTop: 24 }}>
            <Collapse
              items={[
                {
                  key: '1',
                  label: `Error: ${error?.message || 'Unknown error'}`,
                  children: (
                    <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                      <p><strong>Message:</strong></p>
                      <pre>{error?.message}</pre>
                      <p><strong>Stack:</strong></p>
                      <pre>{error?.stack}</pre>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>

        {/* Error Details Drawer */}
        <Drawer
          title="Error Details"
          placement="right"
          onClose={this.handleToggleDetails}
          open={isDrawerOpen}
          width={500}
        >
          <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                size="small"
                onClick={this.handleCopyError}
                style={{ marginBottom: 12 }}
              >
                Copy to Clipboard
              </Button>
            </div>

            <h4>Error Message</h4>
            <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
              {error?.message}
            </pre>

            <h4>Stack Trace</h4>
            <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
              {error?.stack}
            </pre>

            <h4>Component Stack</h4>
            <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
              {errorInfo?.componentStack}
            </pre>

            <h4>Browser Information</h4>
            <p>User Agent: {navigator.userAgent}</p>
            <p>Timestamp: {new Date().toISOString()}</p>
          </div>
        </Drawer>
      </>
    );
  }
}

export default MastersErrorBoundary;

/**
 * HOC to wrap component with error boundary
 * @param {React.ComponentType<any>} Component - Component to wrap
 * @returns {React.ComponentType<any>} Wrapped component with error boundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P) => (
    <MastersErrorBoundary>
      <Component {...props} />
    </MastersErrorBoundary>
  );
};

/**
 * Version History
 * v1.0 - 2025-01-30 - Initial error boundary implementation
 *   - Catches errors in child components
 *   - Displays user-friendly error messages
 *   - Provides error details for debugging
 *   - Includes retry mechanism
 *   - HOC wrapper for easy integration
 *   - Error logging infrastructure
 */