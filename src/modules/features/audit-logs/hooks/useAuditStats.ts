import { useQuery } from '@tanstack/react-query';
import { auditService } from '@/services/serviceFactory';

export const useAuditStats = () => {
  return useQuery({
    queryKey: ['audit-stats'],
    queryFn: async () => {
      return auditService.getAuditStats();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};