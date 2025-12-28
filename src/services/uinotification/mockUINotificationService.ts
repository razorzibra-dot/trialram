/**
 * UI Notification Service
 * Provides a unified interface for displaying toast messages and notifications
 * using Ant Design's message and notification APIs
 */

import { message, notification } from 'antd';
import type { NotificationType } from '@/types/notifications';

interface NotificationParams {
  type: NotificationType;
  message: string;
  description?: string;
  duration?: number;
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'top' | 'bottom';
  onClose?: () => void;
}

/**
 * UI Notification Service
 * Client-side only service for displaying UI notifications
 */
class UINotificationService {
  /**
   * Display a success toast message
   */
  success(content: string, duration: number = 3): void {
    message.success(content, duration);
  }

  /**
   * Display an error toast message
   */
  error(content: string, duration: number = 3): void {
    message.error(content, duration);
  }

  /**
   * Display a warning toast message
   */
  warning(content: string, duration: number = 3): void {
    message.warning(content, duration);
  }

  /**
   * Display an info toast message
   */
  info(content: string, duration: number = 3): void {
    message.info(content, duration);
  }

  /**
   * Display a loading toast message
   * Returns a function to hide the loading message
   */
  loading(content: string): () => void {
    const hide = message.loading(content, 0);
    return hide;
  }

  /**
   * Display a notification with title and description
   */
  notify(params: NotificationParams): void {
    const { type, message: title, description, duration = 4.5, placement = 'topRight', onClose } = params;

    notification[type]({
      message: title,
      description,
      duration,
      placement,
      onClose,
    });
  }

  /**
   * Display a success notification
   */
  successNotify(
    title: string,
    description?: string,
    duration: number = 4.5,
    onClose?: () => void
  ): void {
    notification.success({
      message: title,
      description,
      duration,
      placement: 'topRight',
      onClose,
    });
  }

  /**
   * Display an error notification
   */
  errorNotify(
    title: string,
    description?: string,
    duration: number = 4.5,
    onClose?: () => void
  ): void {
    notification.error({
      message: title,
      description,
      duration,
      placement: 'topRight',
      onClose,
    });
  }

  /**
   * Display a warning notification
   */
  warningNotify(
    title: string,
    description?: string,
    duration: number = 4.5,
    onClose?: () => void
  ): void {
    notification.warning({
      message: title,
      description,
      duration,
      placement: 'topRight',
      onClose,
    });
  }

  /**
   * Display an info notification
   */
  infoNotify(
    title: string,
    description?: string,
    duration: number = 4.5,
    onClose?: () => void
  ): void {
    notification.info({
      message: title,
      description,
      duration,
      placement: 'topRight',
      onClose,
    });
  }

  /**
   * Close all toast messages
   */
  closeAll(): void {
    message.destroy();
    notification.destroy();
  }
}

export const mockUINotificationService = new UINotificationService();
