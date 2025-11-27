import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/services/serviceFactory';
import type { NotificationFilters } from '@/types/notifications';

/**
 * Hook to fetch notifications with optional filters
 */
export const useNotifications = (filters?: NotificationFilters) => {
  return useQuery({
    queryKey: ['notifications', filters],
    queryFn: () => notificationService.getNotifications(filters),
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};