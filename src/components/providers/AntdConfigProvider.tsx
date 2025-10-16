/**
 * Ant Design Config Provider
 * Wraps the entire application with Ant Design theme configuration
 * Ensures consistent styling across all components
 */

import React from 'react';
import { ConfigProvider, App as AntApp } from 'antd';
import { antdTheme } from '@/theme/antdTheme';
import enUS from 'antd/locale/en_US';

interface AntdConfigProviderProps {
  children: React.ReactNode;
}

export const AntdConfigProvider: React.FC<AntdConfigProviderProps> = ({ children }) => {
  return (
    <ConfigProvider
      theme={antdTheme}
      locale={enUS}
      componentSize="middle"
      form={{
        validateMessages: {
          required: '${label} is required',
          types: {
            email: '${label} is not a valid email',
            number: '${label} is not a valid number',
          },
          number: {
            range: '${label} must be between ${min} and ${max}',
          },
        },
      }}
      button={{
        autoInsertSpace: true,
      }}
      input={{
        autoComplete: 'off',
      }}
      select={{
        showSearch: true,
      }}
      table={{
        expandable: {
          expandIcon: ({ expanded, onExpand, record }) =>
            expanded ? (
              <span onClick={(e) => onExpand(record, e)} style={{ cursor: 'pointer' }}>
                ▼
              </span>
            ) : (
              <span onClick={(e) => onExpand(record, e)} style={{ cursor: 'pointer' }}>
                ▶
              </span>
            ),
        },
      }}
    >
      <AntApp>
        {children}
      </AntApp>
    </ConfigProvider>
  );
};

export default AntdConfigProvider;