import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/services/serviceFactory';

/**
 * Hook to get notification statistics
 */
export const useNotificationStats = () => {
  return useQuery({
    queryKey: ['notificationStats'],
    queryFn: () => notificationService.getNotificationStats(),
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};