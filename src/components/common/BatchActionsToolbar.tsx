/**
 * Batch Actions Toolbar Component
 * 
 * Enterprise-grade toolbar for batch operations with customizable actions.
 * 
 * ✅ FEATURES:
 * - Selection count display
 * - Primary batch actions (delete, export, etc.)
 * - Custom action buttons
 * - Responsive layout
 * - Loading states
 * - Accessible design
 * - Confirmation dialogs
 * 
 * ✅ USE CASES:
 * - Batch delete with confirmation
 * - Bulk export
 * - Mass status updates
 * - Multi-item operations
 * 
 * @example
 * <BatchActionsToolbar
 *   selectedCount={5}
 *   totalCount={100}
 *   onClearSelection={() => clearSelection()}
 *   actions={[
 *     {
 *       label: 'Delete',
 *       icon: Trash2,
 *       onClick: handleBatchDelete,
 *       variant: 'destructive',
 *       loading: isDeleting,
 *     },
 *     {
 *       label: 'Export',
 *       icon: Download,
 *       onClick: handleExport,
 *     },
 *   ]}
 * />
 */

import React, { useState, useEffect } from 'react';
import { X, Loader2, LucideIcon, Trash2 as TrashIcon } from 'lucide-react';
import { Button, Modal, Space } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { cn } from '@/lib/utils';

export interface BatchAction {
  /**
   * Action label
   */
  label: string;
  
  /**
   * Icon component
   */
  icon?: LucideIcon;
  
  /**
   * Click handler
   */
  onClick: () => void | Promise<void>;
  
  /**
   * Button variant
   * @default 'default'
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  
  /**
   * Loading state
   * @default false
   */
  loading?: boolean;
  
  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Show confirmation before executing
   * @default false
   */
  confirm?: boolean;
  
  /**
   * Confirmation message (string or React node)
   */
  confirmMessage?: string | React.ReactNode;
  
  /**
   * Confirmation title
   */
  confirmTitle?: string;
  
  /**
   * Tooltip text
   */
  tooltip?: string;
}

export interface BatchActionsToolbarProps {
  /**
   * Number of selected items
   */
  selectedCount: number;
  
  /**
   * Total number of items available
   */
  totalCount?: number;
  
  /**
   * Callback to clear selection
   */
  onClearSelection: () => void;
  
  /**
   * Array of batch actions
   */
  actions: BatchAction[];
  
  /**
   * Custom className
   */
  className?: string;
  
  /**
   * Show "Select All" button
   * @default false
   */
  showSelectAll?: boolean;
  
  /**
   * Callback for "Select All"
   */
  onSelectAll?: () => void;
  
  /**
   * Custom selection message
   */
  selectionMessage?: (count: number, total?: number) => string;
}

export const BatchActionsToolbar: React.FC<BatchActionsToolbarProps> = ({
  selectedCount,
  totalCount,
  onClearSelection,
  actions,
  className,
  showSelectAll = false,
  onSelectAll,
  selectionMessage,
}) => {
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  // Trigger animation on mount/when selectedCount changes
  useEffect(() => {
    if (selectedCount > 0) {
      setShowAnimation(false);
      // Trigger reflow to restart animation
      const element = document.querySelector('[data-batch-toolbar]') as HTMLElement | null;
      if (element) {
        void element.offsetHeight;
      }
      setShowAnimation(true);
    }
  }, [selectedCount]);

  if (selectedCount === 0) {
    return null;
  }

  const defaultMessage = selectionMessage
    ? selectionMessage(selectedCount, totalCount)
    : totalCount !== undefined
    ? `${selectedCount} of ${totalCount} selected`
    : `${selectedCount} selected`;

  const handleActionClick = async (action: BatchAction) => {
    if (action.disabled || action.loading || actionInProgress) return;

    // Show confirmation if needed
    if (action.confirm || action.variant === 'destructive') {
      return new Promise<void>((resolve) => {
        Modal.confirm({
          title: action.confirmTitle || `Confirm ${action.label}`,
          icon: <ExclamationCircleOutlined />,
          content: action.confirmMessage || (
            <div style={{ marginTop: 16 }}>
              <p style={{ marginBottom: 12 }}>
                <strong>You are about to {action.label.toLowerCase()} {selectedCount} item{selectedCount === 1 ? '' : 's'}.</strong>
              </p>
              <p style={{ color: '#666', fontSize: 13 }}>
                {action.variant === 'destructive' 
                  ? 'This action cannot be undone. Please proceed carefully.'
                  : 'Please confirm to continue.'}
              </p>
            </div>
          ),
          okText: action.label,
          okType: action.variant === 'destructive' ? 'danger' : 'primary',
          cancelText: 'Cancel',
          okButtonProps: {
            danger: action.variant === 'destructive',
          },
          onOk: async () => {
            setActionInProgress(action.label);
            try {
              await action.onClick();
            } finally {
              setActionInProgress(null);
              resolve();
            }
          },
          onCancel: () => {
            resolve();
          },
        });
      });
    }

    // Execute without confirmation
    setActionInProgress(action.label);
    try {
      await action.onClick();
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <>
      {/* Animated styles */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-scale {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }

        [data-batch-toolbar] {
          animation: ${showAnimation ? 'slideDown 0.3s ease-out' : 'none'};
        }

        [data-batch-delete-btn] {
          animation: ${showAnimation ? 'pulse-scale 0.5s ease-out' : 'none'};
        }

        [data-batch-delete-btn]:hover {
          transform: translateY(-2px);
          transition: all 0.2s ease;
        }

        [data-batch-delete-btn]:active {
          transform: translateY(0);
        }
      `}</style>

      <div
        data-batch-toolbar
        className={cn(
          'relative flex items-center justify-between gap-3 rounded-lg',
          'border border-red-200 dark:border-red-900',
          'bg-gradient-to-r from-red-50 to-red-50/50 dark:from-red-950 dark:to-red-950/50',
          'px-3 py-2 shadow-md dark:shadow-lg',
          'border-l-4 border-l-red-500 dark:border-l-red-600',
          className
        )}
        role="toolbar"
        aria-label="Batch actions toolbar"
      >
        {/* Selection Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Badge with count */}
            <div className="relative">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-xs font-bold text-white shadow-sm">
                {selectedCount}
              </div>
              {selectedCount > 1 && (
                <div className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-400 text-[10px] font-bold text-white">
                  ✓
                </div>
              )}
            </div>

            {/* Selection text */}
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-red-900 dark:text-red-100 leading-tight">
                {selectedCount} item{selectedCount === 1 ? '' : 's'} selected
              </span>
              {defaultMessage && (
                <span className="text-[11px] text-red-700 dark:text-red-300 leading-tight">
                  {defaultMessage}
                </span>
              )}
            </div>
          </div>

          {/* Select All Button */}
          {showSelectAll && onSelectAll && totalCount && selectedCount < totalCount && (
            <Button
              type="link"
              size="small"
              onClick={onSelectAll}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              style={{
                height: 'auto',
                padding: '2px 8px',
              }}
            >
              Select all {totalCount}
            </Button>
          )}
        </div>

        {/* Actions - Enhanced Icon-Only Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Primary Delete Button */}
          {actions.map((action, index) => {
            const Icon = action.icon;
            const isLoading = action.loading || actionInProgress === action.label;
            const isDisabled = action.disabled || isLoading || actionInProgress !== null;

            // Highlight delete button - Icon only design
            if (action.variant === 'destructive') {
              return (
                <div key={`${action.label}-${index}`} className="flex flex-col items-center gap-0.5">
                  <Button
                    data-batch-delete-btn
                    type="primary"
                    danger
                    shape="circle"
                    size="middle"
                    onClick={() => handleActionClick(action)}
                    disabled={isDisabled}
                    title={action.tooltip || `${action.label} ${selectedCount} item${selectedCount === 1 ? '' : 's'}`}
                    loading={isLoading}
                    className={cn(
                      'shadow-md hover:shadow-lg transition-all duration-200',
                      '!flex !items-center !justify-center',
                      isLoading && 'cursor-wait'
                    )}
                    style={{
                      width: 38,
                      height: 38,
                      minWidth: 38,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    icon={isLoading ? <Loader2 style={{ width: 18, height: 18 }} className="animate-spin" /> : <TrashIcon style={{ width: 18, height: 18 }} />}
                  />
                  <span className="text-[10px] font-medium text-red-700 dark:text-red-300 leading-tight">
                    {isLoading ? 'Deleting...' : 'Delete'}
                  </span>
                </div>
              );
            }

            // Other actions - Icon only design
            return (
              <div key={`${action.label}-${index}`} className="flex flex-col items-center gap-0.5">
                <Button
                  type="default"
                  shape="circle"
                  size="small"
                  onClick={() => handleActionClick(action)}
                  disabled={isDisabled}
                  title={action.tooltip || action.label}
                  loading={isLoading}
                  className="!flex !items-center !justify-center shadow-sm hover:shadow-md transition-all"
                  style={{
                    width: 34,
                    height: 34,
                    minWidth: 34,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  icon={isLoading ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : Icon && <Icon style={{ width: 14, height: 14 }} />}
                />
                <span className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight">
                  {isLoading ? 'Loading...' : action.label}
                </span>
              </div>
            );
          })}

          {/* Divider */}
          <div className="w-px h-8 bg-red-300 dark:bg-red-700 mx-0.5" />

          {/* Clear Selection Button */}
          <div className="flex flex-col items-center gap-0.5">
            <Button
              type="text"
              shape="circle"
              size="small"
              onClick={onClearSelection}
              disabled={actionInProgress !== null}
              className="hover:bg-red-100 dark:hover:bg-red-900 transition-all !flex !items-center !justify-center"
              style={{
                width: 34,
                height: 34,
                minWidth: 34,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Clear selection"
              icon={<X style={{ width: 16, height: 16 }} />}
            >
              <span className="sr-only">Clear selection</span>
            </Button>
            <span className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight">Clear</span>
          </div>
        </div>
      </div>
    </>
  );
};

BatchActionsToolbar.displayName = 'BatchActionsToolbar';
