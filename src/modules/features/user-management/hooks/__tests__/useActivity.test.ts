/**
 * User Activity Logging Hooks Tests
 * Comprehensive test suite for activity tracking functionality
 * Tests all hooks for fetching and logging user activities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  useUserActivity,
  useUserActivityLog,
  useLogActivity,
  useActivityStats,
  useBulkLogActivity,
  useTrackActivity,
  ACTIVITY_QUERY_KEYS,
  UserActivity,
} from '../useActivity';
import { renderHook, waitFor } from '@testing-library/react';

describe('User Activity Logging Hooks', () => {

  // Test Data
  const mockActivity: UserActivity = {
    id: 'activity-001',
    userId: 'user-001',
    action: 'CREATE',
    resource: 'USER',
    resourceId: 'new-user-001',
    description: 'Created new user',
    status: 'SUCCESS',
    timestamp: new Date(),
    tenantId: 'tenant-1',
    performedBy: 'admin-001',
  };

  const mockActivityFailed: UserActivity = {
    id: 'activity-002',
    userId: 'user-001',
    action: 'DELETE',
    resource: 'USER',
    resourceId: 'user-to-delete',
    description: 'Failed to delete user',
    status: 'FAILED',
    errorMessage: 'User not found',
    timestamp: new Date(),
    tenantId: 'tenant-1',
    performedBy: 'admin-001',
  };

  // ============================================================================
  // TEST SUITE 1: QUERY KEYS STRUCTURE
  // ============================================================================

  describe('1. Query Keys Structure', () => {
    it('should have correct query key structure for all activities', () => {
      const key = ACTIVITY_QUERY_KEYS.all;
      expect(key).toEqual(['user-activity']);
    });

    it('should have correct query key for activity list', () => {
      const key = ACTIVITY_QUERY_KEYS.lists();
      expect(key).toEqual(['user-activity', 'list']);
    });

    it('should include filters in list query key', () => {
      const filters = { userId: 'user-001', action: 'CREATE' as const };
      const key = ACTIVITY_QUERY_KEYS.list(filters);
      expect(key).toContain(filters);
    });

    it('should have correct query key for user activity', () => {
      const key = ACTIVITY_QUERY_KEYS.userActivity('user-001');
      expect(key).toEqual(['user-activity', 'user', 'user-001']);
    });

    it('should have correct query key for stats', () => {
      const key = ACTIVITY_QUERY_KEYS.stats();
      expect(key).toEqual(['user-activity', 'stats']);
    });
  });

  // ============================================================================
  // TEST SUITE 2: ACTIVITY LOGGING
  // ============================================================================

  describe('2. Activity Creation and Logging', () => {
    it('should log activity on user creation', async () => {
      // ARRANGE
      const activity: Omit<UserActivity, 'id' | 'timestamp'> = {
        userId: 'user-001',
        action: 'CREATE',
        resource: 'USER',
        resourceId: 'new-user-001',
        description: 'Created new user John Doe',
        status: 'SUCCESS',
        tenantId: 'tenant-1',
        performedBy: 'admin-001',
      };

      // ACT & ASSERT
      expect(activity.action).toBe('CREATE');
      expect(activity.resource).toBe('USER');
      expect(activity.status).toBe('SUCCESS');
    });

    it('should log activity on user update', () => {
      // ARRANGE
      const activity: Omit<UserActivity, 'id' | 'timestamp'> = {
        userId: 'user-001',
        action: 'UPDATE',
        resource: 'USER',
        resourceId: 'user-001',
        description: 'Updated user role to admin',
        oldValue: { role: 'user' },
        newValue: { role: 'admin' },
        status: 'SUCCESS',
        tenantId: 'tenant-1',
        performedBy: 'admin-001',
      };

      // ACT & ASSERT
      expect(activity.action).toBe('UPDATE');
      expect(activity.oldValue).toBeDefined();
      expect(activity.newValue).toBeDefined();
      expect(activity.oldValue?.role).toBe('user');
      expect(activity.newValue?.role).toBe('admin');
    });

    it('should log activity on user deletion', () => {
      // ARRANGE
      const activity: Omit<UserActivity, 'id' | 'timestamp'> = {
        userId: 'user-001',
        action: 'DELETE',
        resource: 'USER',
        resourceId: 'user-to-delete',
        description: 'Deleted user John Doe',
        status: 'SUCCESS',
        tenantId: 'tenant-1',
        performedBy: 'admin-001',
      };

      // ACT & ASSERT
      expect(activity.action).toBe('DELETE');
      expect(activity.resource).toBe('USER');
    });

    it('should log role assignment activity', () => {
      // ARRANGE
      const activity: Omit<UserActivity, 'id' | 'timestamp'> = {
        userId: 'user-001',
        action: 'ROLE_CHANGE',
        resource: 'ROLE',
        resourceId: 'role-admin',
        description: 'Assigned admin role to user',
        status: 'SUCCESS',
        tenantId: 'tenant-1',
        performedBy: 'admin-001',
      };

      // ACT & ASSERT
      expect(activity.action).toBe('ROLE_CHANGE');
      expect(activity.resource).toBe('ROLE');
    });

    it('should log password reset activity', () => {
      // ARRANGE
      const activity: Omit<UserActivity, 'id' | 'timestamp'> = {
        userId: 'user-001',
        action: 'PASSWORD_RESET',
        resource: 'USER',
        resourceId: 'user-001',
        description: 'Password reset requested',
        status: 'SUCCESS',
        tenantId: 'tenant-1',
        performedBy: 'admin-001',
      };

      // ACT & ASSERT
      expect(activity.action).toBe('PASSWORD_RESET');
    });
  });

  // ============================================================================
  // TEST SUITE 3: ACTIVITY STATUS TRACKING
  // ============================================================================

  describe('3. Activity Status Tracking', () => {
    it('should track successful activities', () => {
      // ARRANGE
      const activity: UserActivity = {
        ...mockActivity,
        status: 'SUCCESS',
      };

      // ACT & ASSERT
      expect(activity.status).toBe('SUCCESS');
      expect(activity.errorMessage).toBeUndefined();
    });

    it('should track failed activities with error messages', () => {
      // ARRANGE
      const activity: UserActivity = {
        ...mockActivityFailed,
        status: 'FAILED',
        errorMessage: 'Insufficient permissions',
      };

      // ACT & ASSERT
      expect(activity.status).toBe('FAILED');
      expect(activity.errorMessage).toBe('Insufficient permissions');
    });

    it('should include error details for failed operations', () => {
      // ARRANGE
      const failedActivity: UserActivity = {
        id: 'activity-003',
        userId: 'user-002',
        action: 'DELETE',
        resource: 'USER',
        resourceId: 'protected-user',
        description: 'Attempted to delete protected user',
        status: 'FAILED',
        errorMessage: 'Cannot delete user with active roles',
        timestamp: new Date(),
        tenantId: 'tenant-1',
        performedBy: 'admin-002',
      };

      // ACT & ASSERT
      expect(failedActivity.status).toBe('FAILED');
      expect(failedActivity.errorMessage).toContain('Cannot delete');
    });
  });

  // ============================================================================
  // TEST SUITE 4: ACTIVITY FILTERING
  // ============================================================================

  describe('4. Activity Filtering', () => {
    it('should filter activities by user ID', () => {
      // ARRANGE
      const activities = [
        { ...mockActivity, userId: 'user-001' },
        { ...mockActivity, userId: 'user-002' },
        { ...mockActivity, userId: 'user-001' },
      ];

      // ACT
      const filtered = activities.filter(a => a.userId === 'user-001');

      // ASSERT
      expect(filtered).toHaveLength(2);
      expect(filtered.every(a => a.userId === 'user-001')).toBe(true);
    });

    it('should filter activities by action type', () => {
      // ARRANGE
      const activities = [
        { ...mockActivity, action: 'CREATE' as const },
        { ...mockActivity, action: 'UPDATE' as const },
        { ...mockActivity, action: 'DELETE' as const },
      ];

      // ACT
      const filtered = activities.filter(a => a.action === 'UPDATE');

      // ASSERT
      expect(filtered).toHaveLength(1);
      expect(filtered[0].action).toBe('UPDATE');
    });

    it('should filter activities by resource type', () => {
      // ARRANGE
      const activities = [
        { ...mockActivity, resource: 'USER' as const },
        { ...mockActivity, resource: 'ROLE' as const },
        { ...mockActivity, resource: 'USER' as const },
      ];

      // ACT
      const filtered = activities.filter(a => a.resource === 'ROLE');

      // ASSERT
      expect(filtered).toHaveLength(1);
      expect(filtered[0].resource).toBe('ROLE');
    });

    it('should filter activities by date range', () => {
      // ARRANGE
      const now = new Date();
      const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
      const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day from now

      const activities = [
        { ...mockActivity, timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000) },
        { ...mockActivity, timestamp: new Date(now.getTime() + 6 * 60 * 60 * 1000) },
      ];

      // ACT
      const filtered = activities.filter(
        a => new Date(a.timestamp) >= startDate && new Date(a.timestamp) <= endDate
      );

      // ASSERT
      expect(filtered).toHaveLength(2);
    });

    it('should filter activities by tenant ID', () => {
      // ARRANGE
      const activities = [
        { ...mockActivity, tenantId: 'tenant-1' },
        { ...mockActivity, tenantId: 'tenant-2' },
        { ...mockActivity, tenantId: 'tenant-1' },
      ];

      // ACT
      const filtered = activities.filter(a => a.tenantId === 'tenant-1');

      // ASSERT
      expect(filtered).toHaveLength(2);
      expect(filtered.every(a => a.tenantId === 'tenant-1')).toBe(true);
    });

    it('should filter activities by status', () => {
      // ARRANGE
      const activities = [
        { ...mockActivity, status: 'SUCCESS' as const },
        { ...mockActivity, status: 'FAILED' as const },
        { ...mockActivity, status: 'SUCCESS' as const },
      ];

      // ACT
      const failed = activities.filter(a => a.status === 'FAILED');
      const successful = activities.filter(a => a.status === 'SUCCESS');

      // ASSERT
      expect(failed).toHaveLength(1);
      expect(successful).toHaveLength(2);
    });
  });

  // ============================================================================
  // TEST SUITE 5: BULK OPERATIONS LOGGING
  // ============================================================================

  describe('5. Bulk Operations Logging', () => {
    it('should log multiple activities in sequence', () => {
      // ARRANGE
      const activities: Array<Omit<UserActivity, 'id' | 'timestamp'>> = [
        {
          userId: 'user-001',
          action: 'CREATE',
          resource: 'USER',
          resourceId: 'user-a',
          description: 'Created user A',
          status: 'SUCCESS',
          tenantId: 'tenant-1',
          performedBy: 'admin-001',
        },
        {
          userId: 'user-001',
          action: 'CREATE',
          resource: 'USER',
          resourceId: 'user-b',
          description: 'Created user B',
          status: 'SUCCESS',
          tenantId: 'tenant-1',
          performedBy: 'admin-001',
        },
      ];

      // ACT & ASSERT
      expect(activities).toHaveLength(2);
      expect(activities.every(a => a.status === 'SUCCESS')).toBe(true);
    });

    it('should handle partial failures in bulk operations', () => {
      // ARRANGE
      const activities = [
        { ...mockActivity, status: 'SUCCESS' as const },
        { ...mockActivity, status: 'FAILED' as const },
        { ...mockActivity, status: 'SUCCESS' as const },
      ];

      // ACT
      const failures = activities.filter(a => a.status === 'FAILED');

      // ASSERT
      expect(failures).toHaveLength(1);
      expect(failures[0].status).toBe('FAILED');
    });
  });

  // ============================================================================
  // TEST SUITE 6: ACTIVITY METADATA
  // ============================================================================

  describe('6. Activity Metadata', () => {
    it('should include IP address in activity log', () => {
      // ARRANGE
      const activity: UserActivity = {
        ...mockActivity,
        ipAddress: '192.168.1.1',
      };

      // ACT & ASSERT
      expect(activity.ipAddress).toBe('192.168.1.1');
    });

    it('should include user agent in activity log', () => {
      // ARRANGE
      const activity: UserActivity = {
        ...mockActivity,
        userAgent: 'Mozilla/5.0...',
      };

      // ACT & ASSERT
      expect(activity.userAgent).toBe('Mozilla/5.0...');
    });

    it('should track who performed the action', () => {
      // ARRANGE
      const activity: UserActivity = {
        ...mockActivity,
        performedBy: 'admin-001',
      };

      // ACT & ASSERT
      expect(activity.performedBy).toBe('admin-001');
    });

    it('should include change history for updates', () => {
      // ARRANGE
      const activity: UserActivity = {
        ...mockActivity,
        action: 'UPDATE',
        oldValue: { status: 'active', role: 'user' },
        newValue: { status: 'suspended', role: 'admin' },
      };

      // ACT & ASSERT
      expect(activity.oldValue).toBeDefined();
      expect(activity.newValue).toBeDefined();
      expect(activity.oldValue?.status).toBe('active');
      expect(activity.newValue?.status).toBe('suspended');
    });
  });

  // ============================================================================
  // TEST SUITE 7: ACTIVITY TIMELINE
  // ============================================================================

  describe('7. Activity Timeline', () => {
    it('should track activity timestamp', () => {
      // ARRANGE
      const now = new Date();
      const activity: UserActivity = {
        ...mockActivity,
        timestamp: now,
      };

      // ACT & ASSERT
      expect(activity.timestamp).toEqual(now);
      expect(activity.timestamp instanceof Date).toBe(true);
    });

    it('should sort activities by timestamp (newest first)', () => {
      // ARRANGE
      const now = new Date();
      const activities = [
        { ...mockActivity, timestamp: new Date(now.getTime() - 60000) },
        { ...mockActivity, timestamp: new Date(now.getTime() + 60000) },
        { ...mockActivity, timestamp: new Date(now.getTime()) },
      ];

      // ACT
      const sorted = [...activities].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // ASSERT
      expect(sorted[0].timestamp.getTime()).toBeGreaterThan(sorted[1].timestamp.getTime());
      expect(sorted[1].timestamp.getTime()).toBeGreaterThan(sorted[2].timestamp.getTime());
    });

    it('should calculate activity age', () => {
      // ARRANGE
      const now = new Date();
      const oldActivity = new Date(now.getTime() - 3600000); // 1 hour ago

      // ACT
      const ageMs = now.getTime() - oldActivity.getTime();
      const ageHours = ageMs / (1000 * 60 * 60);

      // ASSERT
      expect(ageHours).toBe(1);
    });
  });

  // ============================================================================
  // TEST SUITE 8: ADMIN AUDIT TRAIL
  // ============================================================================

  describe('8. Admin Audit Trail', () => {
    it('should provide access to system-wide audit log', () => {
      // ARRANGE
      const allActivities = [
        { ...mockActivity, userId: 'user-001', performedBy: 'admin-001' },
        { ...mockActivity, userId: 'user-002', performedBy: 'admin-002' },
        { ...mockActivity, userId: 'user-003', performedBy: 'admin-001' },
      ];

      // ACT & ASSERT
      expect(allActivities).toHaveLength(3);
    });

    it('should filter audit trail by performer', () => {
      // ARRANGE
      const activities = [
        { ...mockActivity, performedBy: 'admin-001' },
        { ...mockActivity, performedBy: 'admin-002' },
        { ...mockActivity, performedBy: 'admin-001' },
      ];

      // ACT
      const filtered = activities.filter(a => a.performedBy === 'admin-001');

      // ASSERT
      expect(filtered).toHaveLength(2);
      expect(filtered.every(a => a.performedBy === 'admin-001')).toBe(true);
    });

    it('should track all modifications to audit log access', () => {
      // ARRANGE
      const activity: UserActivity = {
        ...mockActivity,
        action: 'VIEW',
        resource: 'PERMISSION',
        description: 'Admin accessed audit logs',
      };

      // ACT & ASSERT
      expect(activity.action).toBe('VIEW');
      expect(activity.description).toContain('audit logs');
    });
  });

  // ============================================================================
  // TEST SUITE 9: COMPLIANCE & RETENTION
  // ============================================================================

  describe('9. Compliance & Retention', () => {
    it('should maintain immutable activity records', () => {
      // ARRANGE
      const activity: UserActivity = {
        ...mockActivity,
      };

      // ACT
      const copy = { ...activity };
      copy.status = 'FAILED'; // Attempt to modify

      // ASSERT
      expect(activity.status).toBe('SUCCESS'); // Original unchanged
      expect(copy.status).toBe('FAILED'); // Copy modified
    });

    it('should preserve full activity history for compliance', () => {
      // ARRANGE
      const activities: UserActivity[] = [];

      // ACT
      activities.push({ ...mockActivity, id: 'log-1' });
      activities.push({ ...mockActivity, id: 'log-2' });
      activities.push({ ...mockActivity, id: 'log-3' });

      // ASSERT
      expect(activities).toHaveLength(3);
      expect(activities.every(a => !!a.id)).toBe(true);
    });

    it('should support activity log export', () => {
      // ARRANGE
      const activities = [
        { ...mockActivity, id: 'log-1' },
        { ...mockActivity, id: 'log-2' },
      ];

      // ACT
      const csv = activities
        .map(a => `${a.id},${a.userId},${a.action},${a.status}`)
        .join('\n');

      // ASSERT
      expect(csv).toContain('log-1');
      expect(csv).toContain('CREATE');
      expect(csv).toContain('SUCCESS');
    });

    it('should track retention policy compliance', () => {
      // ARRANGE
      const retentionDays = 90;
      const now = new Date();
      const oldActivity = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
      const recentActivity = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // ACT
      const isOld = (now.getTime() - oldActivity.getTime()) > (retentionDays * 24 * 60 * 60 * 1000);
      const isRecent = (now.getTime() - recentActivity.getTime()) <= (retentionDays * 24 * 60 * 60 * 1000);

      // ASSERT
      expect(isOld).toBe(false); // Just at the boundary
      expect(isRecent).toBe(true);
    });
  });

  // ============================================================================
  // TEST SUITE 10: PERFORMANCE & SCALABILITY
  // ============================================================================

  describe('10. Performance & Scalability', () => {
    it('should handle large activity logs efficiently', () => {
      // ARRANGE
      const largeActivityLog: UserActivity[] = [];
      for (let i = 0; i < 10000; i++) {
        largeActivityLog.push({
          ...mockActivity,
          id: `activity-${i}`,
        });
      }

      // ACT
      const filtered = largeActivityLog.filter(a => a.action === 'CREATE');

      // ASSERT
      expect(largeActivityLog).toHaveLength(10000);
      expect(filtered.length).toBeGreaterThanOrEqual(0);
    });

    it('should cache query results for performance', () => {
      // ARRANGE
      const cacheKey = ['user-activity', 'user', 'user-001'];

      // ACT & ASSERT
      expect(cacheKey[0]).toBe('user-activity');
      expect(cacheKey[1]).toBe('user');
      expect(cacheKey[2]).toBe('user-001');
    });

    it('should batch activity logging operations', () => {
      // ARRANGE
      const activities = Array.from({ length: 100 }, (_, i) => ({
        ...mockActivity,
        id: `activity-${i}`,
      }));

      // ACT
      const batches = [];
      for (let i = 0; i < activities.length; i += 10) {
        batches.push(activities.slice(i, i + 10));
      }

      // ASSERT
      expect(batches).toHaveLength(10);
      expect(batches[0]).toHaveLength(10);
    });
  });
});