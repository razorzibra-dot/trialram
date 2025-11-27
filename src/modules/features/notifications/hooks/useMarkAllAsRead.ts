import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/serviceFactory';

/**
 * Hook to mark all notifications as read
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      // Update all notifications in the cache to be read
      queryClient.setQueryData(['notifications'], (oldData: any[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(notification => ({
          ...notification,
          read: true,
          is_read: true,
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
      });

      // Invalidate unread count
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
};