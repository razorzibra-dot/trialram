import { useQuery } from '@tanstack/react-query';
import { auditService } from '@/services/serviceFactory';
import { AuditLog } from '@/types/logs';

interface UseAuditLogsOptions {
  page?: number;
  limit?: number;
  action?: string;
  resource?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export const useAuditLogs = (options: UseAuditLogsOptions = {}) => {
  return useQuery({
    queryKey: ['audit-logs', options],
    queryFn: async (): Promise<AuditLog[]> => {
      return auditService.getAuditLogs(options);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};