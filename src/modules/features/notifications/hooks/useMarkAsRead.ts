import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/serviceFactory';
import type { Notification } from '@/types/notifications';

/**
 * Hook to mark a notification as read
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: (updatedNotification: Notification) => {
      // Update the notification in the cache
      queryClient.setQueryData(['notification', updatedNotification.id], updatedNotification);

      // Update the notifications list
      queryClient.setQueryData(['notifications'], (oldData: Notification[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(notification =>
          notification.id === updatedNotification.id ? updatedNotification : notification
        );
      });

      // Invalidate unread count
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
};