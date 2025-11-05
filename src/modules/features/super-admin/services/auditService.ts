/**
 * Super Admin Audit Service - Layer 6 Module Service
 * 
 * **Architecture**: Layer 6 (Module Service) in 8-layer pattern
 * - Delegates to factory-routed services (Layer 5)
 * - Provides module-specific convenience methods
 * - No direct service imports (uses serviceFactory only)
 * - Implements business logic for audit operations
 * 
 * **Pattern**: Module services wrap factory services with:
 * - Helper methods for common queries
 * - Consistent error handling
 * - Caching hints for React Query
 * - Type-safe operations
 * 
 * @example
 * ```typescript
 * import { auditServiceModule } from '@/modules/features/super-admin/services';
 * 
 * // Get audit logs with filters
 * const logs = await auditServiceModule.getAuditLogsWithDefaults();
 * const filtered = await auditServiceModule.searchAuditLogs(query);
 * ```
 */

import { auditService as factoryAuditService } from '@/services/serviceFactory';
import type { AuditLog } from '@/types';

interface AuditFilterOptions {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

interface AuditSearchQuery {
  query: string;
  fields?: ('action' | 'resource' | 'user' | 'reason')[];
}

/**
 * Module-level audit service
 * Wraps factory-routed auditService with helper methods
 */
const auditServiceModule = {
  /**
   * Get all audit logs with pagination
   * @param limit - Max records to return (default: 50)
   * @param offset - Pagination offset (default: 0)
   */
  async getAuditLogs(limit = 50, offset = 0) {
    try {
      return await factoryAuditService.getAuditLogs(limit, offset);
    } catch (error) {
      console.error('[Audit Service] Error fetching audit logs:', error);
      throw error;
    }
  },

  /**
   * Get single audit log entry
   * @param logId - Audit log ID to fetch
   */
  async getAuditLog(logId: string) {
    try {
      return await factoryAuditService.getAuditLog?.(logId);
    } catch (error) {
      console.error('[Audit Service] Error fetching audit log:', error);
      throw error;
    }
  },

  /**
   * Search audit logs with text query
   * @param searchQuery - Search parameters
   */
  async searchAuditLogs(searchQuery: AuditSearchQuery) {
    try {
      const { query, fields = ['action', 'resource', 'user'] } = searchQuery;
      return await factoryAuditService.searchAuditLogs({
        query,
        fields: fields as any,
      });
    } catch (error) {
      console.error('[Audit Service] Error searching audit logs:', error);
      throw error;
    }
  },

  /**
   * Get audit logs filtered by date range
   * @param startDate - Start date (ISO format)
   * @param endDate - End date (ISO format)
   * @param limit - Max records (default: 100)
   */
  async getAuditLogsByDateRange(startDate: string, endDate: string, limit = 100) {
    try {
      const logs = await factoryAuditService.getAuditLogs(limit, 0);
      if (!logs) return [];
      
      return (logs as AuditLog[]).filter((log) => {
        const logDate = new Date(log.createdAt).getTime();
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        return logDate >= start && logDate <= end;
      });
    } catch (error) {
      console.error('[Audit Service] Error filtering audit logs by date:', error);
      throw error;
    }
  },

  /**
   * Get audit logs for specific user
   * @param userId - User ID to filter by
   * @param limit - Max records (default: 50)
   */
  async getAuditLogsByUser(userId: string, limit = 50) {
    try {
      const logs = await factoryAuditService.getAuditLogs(limit, 0);
      if (!logs) return [];
      
      return (logs as AuditLog[]).filter((log) => log.userId === userId);
    } catch (error) {
      console.error('[Audit Service] Error fetching audit logs for user:', error);
      throw error;
    }
  },

  /**
   * Get audit logs for specific resource
   * @param resource - Resource type (e.g., 'customer', 'contract')
   * @param limit - Max records (default: 50)
   */
  async getAuditLogsByResource(resource: string, limit = 50) {
    try {
      const logs = await factoryAuditService.getAuditLogs(limit, 0);
      if (!logs) return [];
      
      return (logs as AuditLog[]).filter((log) => log.resource === resource);
    } catch (error) {
      console.error('[Audit Service] Error fetching audit logs for resource:', error);
      throw error;
    }
  },

  /**
   * Get audit logs by action type
   * @param action - Action type (CREATE, UPDATE, DELETE, etc.)
   * @param limit - Max records (default: 50)
   */
  async getAuditLogsByAction(action: string, limit = 50) {
    try {
      const logs = await factoryAuditService.getAuditLogs(limit, 0);
      if (!logs) return [];
      
      return (logs as AuditLog[]).filter((log) => log.action === action);
    } catch (error) {
      console.error('[Audit Service] Error fetching audit logs for action:', error);
      throw error;
    }
  },

  /**
   * Get audit statistics
   * Returns summary metrics for audit logs
   */
  async getAuditStats() {
    try {
      return await factoryAuditService.getAuditStats();
    } catch (error) {
      console.error('[Audit Service] Error fetching audit stats:', error);
      throw error;
    }
  },

  /**
   * Export audit logs to CSV or JSON
   * @param format - Export format ('csv' or 'json')
   * @param filters - Optional filters for export
   */
  async exportAuditLogs(format: 'csv' | 'json', filters?: AuditFilterOptions) {
    try {
      return await factoryAuditService.exportAuditLogs(format, filters);
    } catch (error) {
      console.error('[Audit Service] Error exporting audit logs:', error);
      throw error;
    }
  },

  /**
   * Log an action to audit trail
   * @param data - Action data to log
   */
  async logAction(data: any) {
    try {
      return await factoryAuditService.logAction(data);
    } catch (error) {
      console.error('[Audit Service] Error logging action:', error);
      throw error;
    }
  },

  /**
   * Get recent audit logs (last N records)
   * Convenience method for dashboard summaries
   * @param count - Number of recent logs to fetch (default: 10)
   */
  async getRecentAuditLogs(count = 10) {
    try {
      const logs = await factoryAuditService.getAuditLogs(count, 0);
      return logs || [];
    } catch (error) {
      console.error('[Audit Service] Error fetching recent audit logs:', error);
      throw error;
    }
  },

  /**
   * Get audit logs with combined filters
   * Helper method for complex queries
   * @param options - Filter options
   */
  async getAuditLogsWithFilters(options: AuditFilterOptions) {
    try {
      const { limit = 50, offset = 0, userId, action, resource } = options;
      
      const logs = await factoryAuditService.getAuditLogs(limit, offset);
      if (!logs) return [];
      
      return (logs as AuditLog[]).filter((log) => {
        if (userId && log.userId !== userId) return false;
        if (action && log.action !== action) return false;
        if (resource && log.resource !== resource) return false;
        return true;
      });
    } catch (error) {
      console.error('[Audit Service] Error filtering audit logs:', error);
      throw error;
    }
  },
};

export default auditServiceModule;
export type { AuditFilterOptions, AuditSearchQuery };