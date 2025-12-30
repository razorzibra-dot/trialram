/**
 * Page Loader Component
 * Consistent loading state for all pages
 * Configurable with custom messages and sizes
 */

import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

export interface PageLoaderProps {
  /** Loading message to display */
  message?: string;
  /** Size of the spinner */
  size?: 'small' | 'default' | 'large';
  /** Minimum height of the loader container */
  minHeight?: number | string;
  /** Custom tip text */
  tip?: string;
  /** Show fullscreen overlay */
  fullscreen?: boolean;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  message = 'Loading...',
  size = 'large',
  minHeight = '400px',
  tip,
  fullscreen = false,
}) => {
  const antIcon = <LoadingOutlined style={{ fontSize: size === 'large' ? 48 : size === 'default' ? 32 : 24 }} spin />;

  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
        padding: 24,
      }}
    >
      <Spin 
        indicator={antIcon} 
        size={size}
        tip={tip || message}
      />
      {tip && message && (
        <div
          style={{
            marginTop: 16,
            fontSize: 14,
            color: '#8c8c8c',
            textAlign: 'center',
          }}
        >
          {message}
        </div>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {content}
      </div>
    );
  }

  return content;
};

export default PageLoader;
