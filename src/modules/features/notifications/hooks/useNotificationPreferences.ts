import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/serviceFactory';
import type { UINotificationPreferences } from '@/types/notifications';

/**
 * Hook to fetch notification preferences
 */
export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: () => notificationService.getNotificationPreferences(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to update notification preferences
 */
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: Partial<UINotificationPreferences>) =>
      notificationService.updateNotificationPreferences(preferences),
    onSuccess: () => {
      // Invalidate and refetch preferences
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
    },
  });
};