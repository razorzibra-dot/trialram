import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/services/serviceFactory';

/**
 * Hook to fetch a single notification by ID
 */
export const useNotification = (id: string) => {
  return useQuery({
    queryKey: ['notification', id],
    queryFn: () => {
      // Find the notification from the list (since service doesn't have getNotificationById)
      const notifications = notificationService.getNotifications();
      return notifications.then(notifications => notifications.find(n => n.id === id));
    },
    enabled: !!id,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};