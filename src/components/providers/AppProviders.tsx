import React from 'react';
import { Outlet } from 'react-router-dom';
import { ScrollStateProvider } from '../../contexts/ScrollStateContext';
import { AuthProvider } from '../../contexts/AuthContext';
import SessionProvider from '../../providers/SessionProvider';

interface AppProvidersProps {
  children?: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <SessionProvider>
        <ScrollStateProvider maxScrollHistoryAge={60 * 60 * 1000}> {/* 1 hour */}
          {children || <Outlet />}
        </ScrollStateProvider>
      </SessionProvider>
    </AuthProvider>
  );
};

export default AppProviders;
