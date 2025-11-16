import React from 'react';
import { Outlet } from 'react-router-dom';
import { ScrollStateProvider } from '../../contexts/ScrollStateContext';
import SessionProvider from '../../providers/SessionProvider';

interface AppProvidersProps {
  children?: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <SessionProvider>
      <ScrollStateProvider maxScrollHistoryAge={60 * 60 * 1000}> {/* 1 hour */}
        {children || <Outlet />}
      </ScrollStateProvider>
    </SessionProvider>
  );
};

export default AppProviders;
