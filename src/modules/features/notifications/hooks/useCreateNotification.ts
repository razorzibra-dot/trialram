import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/serviceFactory';
import type { Notification } from '@/types/notifications';

/**
 * Hook to create a new notification
 */
export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notification: Partial<Notification>) => {
      // The service doesn't have a create method, so we'll simulate it
      // In a real implementation, this would call notificationService.createNotification(notification)
      throw new Error('Create notification not implemented in service');
    },
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
};