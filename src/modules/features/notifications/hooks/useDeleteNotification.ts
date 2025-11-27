import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/serviceFactory';

/**
 * Hook to delete a notification
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: (_, deletedId) => {
      // Remove the notification from the cache
      queryClient.removeQueries({ queryKey: ['notification', deletedId] });

      // Update the notifications list
      queryClient.setQueryData(['notifications'], (oldData: any[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter(notification => notification.id !== deletedId);
      });

      // Invalidate unread count
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
};