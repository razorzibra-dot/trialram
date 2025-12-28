import React from 'react';
import { Outlet } from 'react-router-dom';
import { ScrollStateProvider } from '../../contexts/ScrollStateContext';
import SessionProvider from '../../providers/SessionProvider';
import { SessionConfigProvider } from '../../contexts/SessionConfigContext';
import { RoleProvider } from '../../contexts/RoleContext';

interface AppProvidersProps {
  children?: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <SessionProvider>
      <SessionConfigProvider>
        <RoleProvider>
          <ScrollStateProvider maxScrollHistoryAge={60 * 60 * 1000}> {/* 1 hour */}
            {children || <Outlet />}
          </ScrollStateProvider>
        </RoleProvider>
      </SessionConfigProvider>
    </SessionProvider>
  );
};

export default AppProviders;
