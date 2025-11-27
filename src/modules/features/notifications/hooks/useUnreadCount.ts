import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/services/serviceFactory';

/**
 * Hook to get unread notification count
 */
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 10000, // 10 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};