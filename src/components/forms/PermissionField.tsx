/**
 * Permission-aware form field component
 * Conditionally renders form fields based on element-level permissions
 *
 * Follows strict layer synchronization rules:
 * - Uses factory service pattern (no direct imports)
 * - Handles loading/error states properly
 * - Supports field-level visibility and editability
 * - Database-driven permission evaluation
 */

import React, { ReactNode } from 'react';
import { usePermission } from '@/hooks/useElementPermissions';

interface PermissionFieldProps {
  /** Element path for the field (e.g., "contact:field.email") */
  elementPath: string;
  /** Field name for form integration */
  fieldName: string;
  /** Children to render when permission is granted */
  children: ReactNode;
  /** Fallback content when permission is denied */
  fallback?: ReactNode;
  /** Whether to show loading state */
  showLoading?: boolean;
  /** Custom loading component */
  loadingComponent?: ReactNode;
  /** Whether the field should be read-only when permission is denied */
  readOnlyOnDeny?: boolean;
  /** Tooltip text explaining permission requirements */
  permissionTooltip?: string;
}

export const PermissionField: React.FC<PermissionFieldProps> = ({
  elementPath,
  fieldName,
  children,
  fallback,
  showLoading = true,
  loadingComponent,
  readOnlyOnDeny = false,
  permissionTooltip
}) => {
  const hasEditPermission = usePermission(elementPath, 'editable');
  const hasViewPermission = usePermission(elementPath, 'visible');

  // Show loading state while permissions are being evaluated
  if ((hasEditPermission === null || hasViewPermission === null) && showLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    return (
      <div className="permission-field-loading" aria-live="polite">
        <div className="animate-pulse bg-gray-200 rounded h-8 w-full"></div>
      </div>
    );
  }

  // No view permission - hide the field entirely
  if (hasViewPermission === false) {
    return fallback ? <>{fallback}</> : null;
  }

  // Has view permission but no edit permission
  if (hasViewPermission === true && hasEditPermission === false) {
    if (readOnlyOnDeny) {
      // Render children but make them read-only
      return (
        <div className="permission-field-readonly" title={permissionTooltip}>
          {React.cloneElement(children as React.ReactElement, {
            readOnly: true,
            disabled: true,
            'aria-readonly': true
          })}
        </div>
      );
    } else {
      // Hide the field if read-only is not acceptable
      return fallback ? <>{fallback}</> : null;
    }
  }

  // Full permissions - render normally
  if (hasViewPermission === true && hasEditPermission === true) {
    return (
      <div className="permission-field" title={permissionTooltip}>
        {children}
      </div>
    );
  }

  // Fallback for any other cases
  return fallback ? <>{fallback}</> : null;
};

// Higher-order component for form libraries
export function withPermissionField<P extends object>(
  elementPath: string,
  options: {
    readOnlyOnDeny?: boolean;
    fallback?: React.ComponentType<P> | React.ReactNode;
    permissionTooltip?: string;
  } = {}
) {
  return function (WrappedComponent: React.ComponentType<P>) {
    return function WithPermissionFieldComponent(props: P) {
      return (
        <PermissionField
          elementPath={elementPath}
          fieldName="" // Will be set by form library
          readOnlyOnDeny={options.readOnlyOnDeny}
          fallback={typeof options.fallback === 'function' ? React.createElement(options.fallback, props) : options.fallback}
          permissionTooltip={options.permissionTooltip}
        >
          <WrappedComponent {...props} />
        </PermissionField>
      );
    };
  };
}

// Utility component for conditional field sections
export const PermissionFieldSection: React.FC<{
  elementPath: string;
  title?: string;
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ elementPath, title, children, fallback }) => {
  const hasViewPermission = usePermission(elementPath, 'visible');

  if (hasViewPermission === false) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <div className="permission-field-section">
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
};