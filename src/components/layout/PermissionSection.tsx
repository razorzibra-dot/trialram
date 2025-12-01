/**
 * Permission-aware layout section component
 * Conditionally renders entire sections based on module permissions
 *
 * Follows strict layer synchronization rules:
 * - Uses factory service pattern (no direct imports)
 * - Handles loading/error states properly
 * - Supports nested permission hierarchies
 * - Database-driven permission evaluation
 */

import React, { ReactNode } from 'react';
import { usePermission } from '@/hooks/useElementPermissions';

interface PermissionSectionProps {
  /** Element path for the section (e.g., "contacts:module") */
  elementPath: string;
  /** Children to render when permission is granted */
  children: ReactNode;
  /** Fallback content when permission is denied */
  fallback?: ReactNode;
  /** Whether to show loading state */
  showLoading?: boolean;
  /** Custom loading component */
  loadingComponent?: ReactNode;
  /** CSS class for the section container */
  className?: string;
  /** Section title */
  title?: string;
  /** Whether to render as a card/section wrapper */
  asCard?: boolean;
  /** Card/section props */
  cardProps?: Record<string, any>;
}

export const PermissionSection: React.FC<PermissionSectionProps> = ({
  elementPath,
  children,
  fallback,
  showLoading = true,
  loadingComponent,
  className = '',
  title,
  asCard = false,
  cardProps = {}
}) => {
  const hasAccessPermission = usePermission(elementPath, 'accessible');

  // Show loading state while permissions are being evaluated
  if (hasAccessPermission === null && showLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    const loadingContent = (
      <div className="permission-section-loading animate-pulse" aria-live="polite">
        <div className="bg-gray-200 rounded h-8 w-48 mb-4"></div>
        <div className="space-y-3">
          <div className="bg-gray-200 rounded h-4 w-full"></div>
          <div className="bg-gray-200 rounded h-4 w-3/4"></div>
          <div className="bg-gray-200 rounded h-4 w-1/2"></div>
        </div>
      </div>
    );

    if (asCard) {
      return (
        <div className={`permission-section-card ${className}`} {...cardProps}>
          {title && <h3 className="text-lg font-medium mb-4">{title}</h3>}
          {loadingContent}
        </div>
      );
    }

    return loadingContent;
  }

  // No access permission - show fallback or nothing
  if (hasAccessPermission === false) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Show access denied message
    const accessDeniedContent = (
      <div className="permission-section-denied text-gray-500 text-center py-8">
        <div className="text-sm">
          You don't have permission to access this section.
        </div>
      </div>
    );

    if (asCard) {
      return (
        <div className={`permission-section-card ${className}`} {...cardProps}>
          {title && <h3 className="text-lg font-medium mb-4">{title}</h3>}
          {accessDeniedContent}
        </div>
      );
    }

    return accessDeniedContent;
  }

  // Has access permission - render the section
  const sectionContent = (
    <div className={`permission-section ${className}`}>
      {title && <h3 className="text-lg font-medium mb-4">{title}</h3>}
      {children}
    </div>
  );

  if (asCard) {
    return (
      <div className={`permission-section-card border rounded-lg p-6 shadow-sm ${className}`} {...cardProps}>
        {sectionContent}
      </div>
    );
  }

  return sectionContent;
};

// Specialized component for navigation sections
export const PermissionNavigationSection: React.FC<{
  elementPath: string;
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ elementPath, children, fallback }) => {
  const hasAccessPermission = usePermission(elementPath, 'accessible');

  if (hasAccessPermission === false) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

// Specialized component for sidebar sections
export const PermissionSidebarSection: React.FC<{
  elementPath: string;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ elementPath, title, icon, children, fallback }) => {
  const hasAccessPermission = usePermission(elementPath, 'accessible');

  if (hasAccessPermission === false) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <div className="permission-sidebar-section">
      <div className="flex items-center mb-2">
        {icon && <span className="mr-2">{icon}</span>}
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
      </div>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
};

// Specialized component for toolbar sections
export const PermissionToolbarSection: React.FC<{
  elementPath: string;
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}> = ({ elementPath, children, fallback, className = '' }) => {
  const hasAccessPermission = usePermission(elementPath, 'accessible');

  if (hasAccessPermission === false) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <div className={`permission-toolbar-section flex items-center space-x-2 ${className}`}>
      {children}
    </div>
  );
};