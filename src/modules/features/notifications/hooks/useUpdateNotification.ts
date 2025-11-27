import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/serviceFactory';
import type { Notification } from '@/types/notifications';

/**
 * Hook to update a notification
 */
export const useUpdateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Notification> }) => {
      // The service doesn't have an update method, so we'll simulate it
      throw new Error('Update notification not implemented in service');
    },
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
    },
  });
};