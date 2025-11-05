/**
 * Audit Retention Service - Module Layer
 * Layer 6: Module service wrapper for super-admin features
 * 
 * Provides convenience methods for common retention workflows
 * Uses factory-routed service (never direct imports)
 * Ensures consistent logging and error handling
 */

import { auditRetentionService as factoryAuditRetentionService } from '@/services/serviceFactory';
import {
  RetentionPolicy,
  AuditLogArchive,
  RetentionCleanupResult,
  RetentionStats
} from '@/types';

/**
 * Module service wrapper for audit retention operations
 * Provides domain-specific convenience methods for the super-admin module
 */
class AuditRetentionServiceModule {
  /**
   * Get all retention policies
   */
  async getRetentionPolicies(tenantId?: string): Promise<RetentionPolicy[]> {
    try {
      return await factoryAuditRetentionService.getRetentionPolicies(tenantId);
    } catch (error) {
      console.error('[AuditRetention] Error fetching retention policies:', error);
      throw error;
    }
  }

  /**
   * Get a specific retention policy
   */
  async getRetentionPolicy(policyId: string): Promise<RetentionPolicy | null> {
    try {
      return await factoryAuditRetentionService.getRetentionPolicy(policyId);
    } catch (error) {
      console.error(`[AuditRetention] Error fetching retention policy ${policyId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new retention policy
   */
  async createRetentionPolicy(
    policy: Omit<RetentionPolicy, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<RetentionPolicy> {
    try {
      console.log('[AuditRetention] Creating retention policy:', policy.name);
      return await factoryAuditRetentionService.createRetentionPolicy(policy);
    } catch (error) {
      console.error('[AuditRetention] Error creating retention policy:', error);
      throw error;
    }
  }

  /**
   * Update a retention policy
   */
  async updateRetentionPolicy(
    policyId: string,
    updates: Partial<Omit<RetentionPolicy, 'id' | 'createdAt'>>
  ): Promise<RetentionPolicy> {
    try {
      console.log(`[AuditRetention] Updating retention policy ${policyId}`);
      return await factoryAuditRetentionService.updateRetentionPolicy(policyId, updates);
    } catch (error) {
      console.error(`[AuditRetention] Error updating retention policy ${policyId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a retention policy
   */
  async deleteRetentionPolicy(policyId: string): Promise<boolean> {
    try {
      console.log(`[AuditRetention] Deleting retention policy ${policyId}`);
      return await factoryAuditRetentionService.deleteRetentionPolicy(policyId);
    } catch (error) {
      console.error(`[AuditRetention] Error deleting retention policy ${policyId}:`, error);
      throw error;
    }
  }

  /**
   * Execute retention cleanup
   */
  async executeRetentionCleanup(tenantId?: string): Promise<RetentionCleanupResult> {
    try {
      console.log(`[AuditRetention] Executing retention cleanup${tenantId ? ` for tenant ${tenantId}` : ''}`);
      return await factoryAuditRetentionService.executeRetentionCleanup(tenantId);
    } catch (error) {
      console.error('[AuditRetention] Error executing retention cleanup:', error);
      throw error;
    }
  }

  /**
   * Get retention statistics
   */
  async getRetentionStats(tenantId?: string): Promise<RetentionStats> {
    try {
      return await factoryAuditRetentionService.getRetentionStats(tenantId);
    } catch (error) {
      console.error('[AuditRetention] Error fetching retention statistics:', error);
      throw error;
    }
  }

  /**
   * Get archived logs
   */
  async getArchives(tenantId?: string, limit?: number): Promise<AuditLogArchive[]> {
    try {
      return await factoryAuditRetentionService.getArchives(tenantId, limit);
    } catch (error) {
      console.error('[AuditRetention] Error fetching archives:', error);
      throw error;
    }
  }

  /**
   * Get cleanup history
   */
  async getCleanupHistory(limit?: number): Promise<RetentionCleanupResult[]> {
    try {
      return await factoryAuditRetentionService.getCleanupHistory(limit);
    } catch (error) {
      console.error('[AuditRetention] Error fetching cleanup history:', error);
      throw error;
    }
  }

  /**
   * Schedule retention cleanup
   */
  async scheduleRetentionCleanup(config: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    timeOfDay: string;
    timezone: string;
  }): Promise<{ scheduled: boolean; nextRun: string; message: string }> {
    try {
      console.log('[AuditRetention] Scheduling retention cleanup:', config);
      return await factoryAuditRetentionService.scheduleRetentionCleanup(config);
    } catch (error) {
      console.error('[AuditRetention] Error scheduling retention cleanup:', error);
      throw error;
    }
  }

  /**
   * Convenience method: Get default retention policy
   */
  async getDefaultPolicy(): Promise<RetentionPolicy | null> {
    try {
      return await this.getRetentionPolicy('policy_default');
    } catch (error) {
      console.warn('[AuditRetention] Could not fetch default policy:', error);
      return null;
    }
  }

  /**
   * Convenience method: Update default retention days
   */
  async updateDefaultRetention(retentionDays: number): Promise<RetentionPolicy> {
    try {
      return await this.updateRetentionPolicy('policy_default', {
        retentionDays
      });
    } catch (error) {
      console.error(`[AuditRetention] Error updating default retention to ${retentionDays} days:`, error);
      throw error;
    }
  }

  /**
   * Convenience method: Get total archived logs count
   */
  async getTotalArchivedCount(tenantId?: string): Promise<number> {
    try {
      const stats = await this.getRetentionStats(tenantId);
      return stats.archivedLogsCount;
    } catch (error) {
      console.error('[AuditRetention] Error fetching total archived count:', error);
      return 0;
    }
  }

  /**
   * Convenience method: Get cleanup status
   */
  async getCleanupStatus(): Promise<{
    lastRun?: Date;
    nextScheduled?: Date;
    logsEligibleForCleanup: number;
    archiveCount: number;
  }> {
    try {
      const stats = await this.getRetentionStats();
      const history = await this.getCleanupHistory(1);
      
      const lastRun = history.length > 0 ? new Date(history[0].executedAt) : undefined;

      return {
        lastRun,
        nextScheduled: new Date(Date.now() + 24 * 60 * 60 * 1000), // Mock next run
        logsEligibleForCleanup: stats.logsEligibleForDeletion,
        archiveCount: stats.archiveCount
      };
    } catch (error) {
      console.error('[AuditRetention] Error fetching cleanup status:', error);
      return {
        logsEligibleForCleanup: 0,
        archiveCount: 0
      };
    }
  }

  /**
   * Validate retention policy configuration
   */
  validateRetentionPolicy(policy: Partial<RetentionPolicy>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!policy.name?.trim()) {
      errors.push('Policy name is required');
    }

    if (!policy.description?.trim()) {
      errors.push('Policy description is required');
    }

    if (!policy.retentionDays || policy.retentionDays <= 0) {
      errors.push('Retention days must be greater than 0');
    }

    if (policy.retentionDays && policy.retentionDays > 2555) {
      errors.push('Retention days cannot exceed 7 years (2555 days)');
    }

    if (policy.logTypes && !Array.isArray(policy.logTypes)) {
      errors.push('Log types must be an array');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get metadata about retention capabilities
   */
  getRetentionMetadata(): {
    minRetentionDays: number;
    maxRetentionDays: number;
    supportedLogTypes: string[];
    archiveFormats: string[];
  } {
    return {
      minRetentionDays: 30,
      maxRetentionDays: 2555, // 7 years
      supportedLogTypes: [
        'CREATE',
        'READ',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'LOGOUT',
        'IMPERSONATE',
        'UNAUTHORIZED_ACCESS',
        'EXPORT',
        'IMPORT'
      ],
      archiveFormats: ['tar.gz', 'zip']
    };
  }
}

export const auditRetentionServiceModule = new AuditRetentionServiceModule();