/**
 * UI Notification Service - Ant Design Toast/Message Wrapper
 * 
 * This service provides a unified interface for displaying notifications
 * and messages throughout the application. It replaces the legacy toast system.
 * 
 * Features:
 * - Message notifications (info, success, error, warning) - auto-dismiss at top
 * - Persistent notifications - stay until user closes
 * - Consistent styling with Ant Design theme
 * - Automatic position management
 * 
 * Usage:
 * import { uiNotificationService } from '@/services/uiNotificationService';
 * 
 * // Quick message (auto-dismisses)
 * uiNotificationService.success('Operation completed');
 * uiNotificationService.error('Something went wrong');
 * 
 * // Persistent notification
 * uiNotificationService.notify({
 *   type: 'success',
 *   message: 'Title',
 *   description: 'Detailed message',
 *   duration: 0 // 0 = don't auto-dismiss
 * });
 */

import { message, notification } from 'antd';
import type { NotificationPlacement } from 'antd/es/notification/interface';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type MessageType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface NotificationConfig {
  type: NotificationType;
  message: string;
  description?: string;
  duration?: number; // seconds, 0 = persistent
  placement?: NotificationPlacement;
  onClose?: () => void;
}

interface MessageConfig {
  type: MessageType;
  content: string;
  duration?: number; // seconds
}

/**
 * Displays a quick message that auto-dismisses
 * Used for brief feedback on user actions
 */
const showMessage = async (config: MessageConfig): Promise<void> => {
  return new Promise((resolve) => {
    const hideMessage = message[config.type](
      config.content,
      config.duration ?? 3
    );
    
    // Message API returns a promise in newer versions
    if (hideMessage instanceof Promise) {
      hideMessage.then(resolve).catch(resolve);
    } else {
      // Fallback for older versions
      setTimeout(resolve, (config.duration ?? 3) * 1000);
    }
  });
};

/**
 * Displays a persistent notification
 * Used for important alerts or detailed messages
 */
const showNotification = (config: NotificationConfig): void => {
  notification[config.type]({
    message: config.message,
    description: config.description,
    duration: config.duration ?? 4.5,
    placement: config.placement ?? 'topRight',
    onClose: config.onClose,
  });
};

/**
 * Quick success message
 */
const success = (content: string, duration?: number): Promise<void> => {
  return showMessage({ type: 'success', content, duration });
};

/**
 * Quick error message
 */
const error = (content: string, duration?: number): Promise<void> => {
  return showMessage({ type: 'error', content, duration });
};

/**
 * Quick warning message
 */
const warning = (content: string, duration?: number): Promise<void> => {
  return showMessage({ type: 'warning', content, duration });
};

/**
 * Quick info message
 */
const info = (content: string, duration?: number): Promise<void> => {
  return showMessage({ type: 'info', content, duration });
};

/**
 * Loading message (doesn't auto-dismiss)
 */
const loading = (content: string): (() => void) => {
  const hideLoading = message.loading(content);
  
  // Return function to hide loading message
  return () => {
    if (hideLoading instanceof Promise) {
      hideLoading.catch(() => {
        // Handle error silently
      });
    }
  };
};

/**
 * Notify with title and description
 * Used for more detailed notifications
 */
const notify = (config: NotificationConfig): void => {
  showNotification(config);
};

/**
 * Success notification with title and description
 */
const successNotify = (
  message: string,
  description?: string,
  duration?: number,
  onClose?: () => void
): void => {
  notify({
    type: 'success',
    message,
    description,
    duration: duration ?? 4.5,
    onClose,
  });
};

/**
 * Error notification with title and description
 */
const errorNotify = (
  message: string,
  description?: string,
  duration?: number,
  onClose?: () => void
): void => {
  notify({
    type: 'error',
    message,
    description,
    duration: duration ?? 4.5,
    onClose,
  });
};

/**
 * Warning notification with title and description
 */
const warningNotify = (
  message: string,
  description?: string,
  duration?: number,
  onClose?: () => void
): void => {
  notify({
    type: 'warning',
    message,
    description,
    duration: duration ?? 4.5,
    onClose,
  });
};

/**
 * Info notification with title and description
 */
const infoNotify = (
  message: string,
  description?: string,
  duration?: number,
  onClose?: () => void
): void => {
  notify({
    type: 'info',
    message,
    description,
    duration: duration ?? 4.5,
    onClose,
  });
};

/**
 * Close all messages and notifications
 */
const closeAll = (): void => {
  message.destroy();
  notification.destroy();
};

/**
 * Configure default settings
 */
const config = {
  setMessageDuration: (duration: number): void => {
    message.config({ duration });
  },
  setNotificationDuration: (duration: number): void => {
    notification.config({ duration });
  },
  setNotificationPosition: (placement: NotificationPlacement): void => {
    notification.config({ placement });
  },
};

export const uiNotificationService = {
  // Quick messages (auto-dismiss)
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
  config,
  
  // Raw access to Ant Design APIs
  message,
  notification,
};

export default uiNotificationService;