/**
 * useToastCompat Hook - Backward Compatibility Layer
 * 
 * This hook provides a migration bridge from the old toast system to the new
 * Ant Design notification system. It mimics the old useToast API but uses
 * the new notification service under the hood.
 * 
 * DEPRECATED: This is for backward compatibility only.
 * Please use useNotification() for new code.
 * 
 * Migration Guide:
 * OLD:  const { toast } = useToast();
 *       toast({ title: 'Error', description: 'msg', variant: 'destructive' });
 * 
 * NEW:  const { error } = useNotification();
 *       error('msg');
 */

import { useCallback } from 'react';
import { notificationService } from '@/services/notificationService';

interface LegacyToastProps {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: 'default' | 'destructive';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

interface LegacyToastReturn {
  id: string;
  dismiss: () => void;
  update: (props: LegacyToastProps) => void;
}

interface UseToastReturn {
  toasts: LegacyToastProps[];
  toast: (props: Omit<LegacyToastProps, 'id'>) => LegacyToastReturn;
  dismiss: (toastId?: string) => void;
}

/**
 * Legacy toast function - maps to new notification service
 */
const createLegacyToast = (props: Omit<LegacyToastProps, 'id'>): LegacyToastReturn => {
  const id = Math.random().toString(36).substr(2, 9);
  
  // Determine notification type
  const type = props.variant === 'destructive' ? 'error' : 'info';
  const message = String(props.title || '');
  const description = props.description ? String(props.description) : undefined;
  
  // Show the notification
  if (message || description) {
    notificationService.notify({
      type,
      message: message || 'Notification',
      description,
      duration: 4.5,
    });
  }
  
  return {
    id,
    dismiss: () => {
      // No-op for compatibility
    },
    update: (updatedProps: LegacyToastProps) => {
      // If description changed, show new notification
      const updatedMessage = String(updatedProps.title || '');
      const updatedDescription = updatedProps.description ? String(updatedProps.description) : undefined;
      
      if (updatedMessage && updatedMessage !== message) {
        notificationService.notify({
          type,
          message: updatedMessage,
          description: updatedDescription,
          duration: 4.5,
        });
      }
    },
  };
};

/**
 * useToastCompat - Backward compatible toast hook
 * 
 * DEPRECATED: Use useNotification() instead for new code
 */
export const useToastCompat = (): UseToastReturn => {
  // Keep empty toasts array for compatibility
  const toasts: LegacyToastProps[] = [];
  
  const toast = useCallback((props: Omit<LegacyToastProps, 'id'>) => {
    return createLegacyToast(props);
  }, []);
  
  const dismiss = useCallback((_toastId?: string) => {
    // Close all notifications for compatibility
    notificationService.closeAll();
  }, []);
  
  return {
    toasts,
    toast,
    dismiss,
  };
};

/**
 * Standalone toast function for backward compatibility
 * Can be called directly without using the hook
 */
export const toastCompat = (props: Omit<LegacyToastProps, 'id'>): LegacyToastReturn => {
  return createLegacyToast(props);
};

/**
 * Re-export for convenience - allows old imports to work
 * OLD: import { useToast } from '@/hooks/use-toast';
 * NEW: import { useToastCompat as useToast } from '@/hooks/useToastCompat';
 */
export { useToastCompat as useToast };
export { toastCompat as toast };

export default useToastCompat;