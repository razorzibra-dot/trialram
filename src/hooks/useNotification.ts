/**
 * useNotification Hook
 * 
 * Provides a React hook interface for displaying notifications using Ant Design.
 * Replaces the legacy useToast hook with a cleaner, more flexible API.
 * 
 * Usage:
 * const { success, error, warning, info, notify } = useNotification();
 * 
 * // Quick messages (auto-dismiss after 3 seconds)
 * success('Operation completed');
 * error('Something went wrong');
 * warning('Please be careful');
 * info('Here is some information');
 * 
 * // Persistent notification
 * notify({
 *   type: 'success',
 *   message: 'Title',
 *   description: 'Detailed description',
 *   duration: 0, // 0 = never auto-dismiss
 * });
 * 
 * // Loading message
 * const hideLoading = notify.loading('Processing...');
 * // Later: hideLoading();
 */

import { useCallback } from 'react';
import { uiNotificationService as factoryUINotificationService } from '@/services/serviceFactory';
import type { NotificationType } from '@/types/notifications';

interface NotificationParams {
  type: NotificationType;
  message: string;
  description?: string;
  duration?: number;
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  onClose?: () => void;
}

export const useNotification = () => {
  /**
   * Display a quick success message (auto-dismiss)
   */
  const success = useCallback((content: string, duration?: number) => {
    return factoryUINotificationService.success(content, duration);
  }, []);

  /**
   * Display a quick error message (auto-dismiss)
   */
  const error = useCallback((content: string, duration?: number) => {
    return factoryUINotificationService.error(content, duration);
  }, []);

  /**
   * Display a quick warning message (auto-dismiss)
   */
  const warning = useCallback((content: string, duration?: number) => {
    return factoryUINotificationService.warning(content, duration);
  }, []);

  /**
   * Display a quick info message (auto-dismiss)
   */
  const info = useCallback((content: string, duration?: number) => {
    return factoryUINotificationService.info(content, duration);
  }, []);

  /**
   * Display a loading message
   */
  const loading = useCallback((content: string) => {
    return factoryUINotificationService.loading(content);
  }, []);

  /**
   * Display a persistent notification with title and description
   */
  const notify = useCallback((params: NotificationParams) => {
    factoryUINotificationService.notify({
      type: params.type,
      message: params.message,
      description: params.description,
      duration: params.duration,
      placement: params.placement as any,
      onClose: params.onClose,
    });
  }, []);

  /**
   * Display a success notification with title and description
   */
  const successNotify = useCallback(
    (
      message: string,
      description?: string,
      duration?: number,
      onClose?: () => void
    ) => {
      factoryUINotificationService.successNotify(message, description, duration, onClose);
    },
    []
  );

  /**
   * Display an error notification with title and description
   */
  const errorNotify = useCallback(
    (
      message: string,
      description?: string,
      duration?: number,
      onClose?: () => void
    ) => {
      factoryUINotificationService.errorNotify(message, description, duration, onClose);
    },
    []
  );

  /**
   * Display a warning notification with title and description
   */
  const warningNotify = useCallback(
    (
      message: string,
      description?: string,
      duration?: number,
      onClose?: () => void
    ) => {
      factoryUINotificationService.warningNotify(message, description, duration, onClose);
    },
    []
  );

  /**
   * Display an info notification with title and description
   */
  const infoNotify = useCallback(
    (
      message: string,
      description?: string,
      duration?: number,
      onClose?: () => void
    ) => {
      factoryUINotificationService.infoNotify(message, description, duration, onClose);
    },
    []
  );

  /**
   * Close all notifications and messages
   */
  const closeAll = useCallback(() => {
    factoryUINotificationService.closeAll();
  }, []);

  return {
    // Quick messages
    success,
    error,
    warning,
    info,
    loading,
    
    // Persistent notifications
    notify,
    successNotify,
    errorNotify,
    warningNotify,
    infoNotify,
    
    // Utilities
    closeAll,
  };
};

export default useNotification;