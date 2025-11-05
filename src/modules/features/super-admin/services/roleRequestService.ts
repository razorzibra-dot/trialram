/**
 * Super Admin Role Request Module Service
 * 
 * Layer 6: Module Service - integrates with factory pattern
 * 
 * This service bridges the UI layer with the factory-routed services.
 * All service calls go through the factory pattern to ensure proper
 * multi-backend support (mock vs Supabase).
 * 
 * Usage:
 * ```typescript
 * import { roleRequestService } from '@/modules/features/super-admin/services/roleRequestService';
 * 
 * // Get all requests
 * const requests = await roleRequestService.fetchAllRequests();
 * 
 * // Get pending requests only
 * const pending = await roleRequestService.fetchPendingRequests();
 * 
 * // Approve a request
 * await roleRequestService.approveRequest(requestId, {
 *   reviewComments: 'Approved',
 *   expiresAt: '2025-03-21T00:00:00Z'
 * }, userId);
 * ```
 */

import { 
  roleRequestService as factoryRoleRequestService 
} from '@/services/serviceFactory';
import { RoleRequestType, RoleRequestReviewInput } from '@/types/superUserModule';

/**
 * Super Admin Role Request Module Service
 * 
 * Provides business logic for role request management.
 * All methods delegate to factory-routed services.
 */
class SuperAdminRoleRequestService {
  /**
   * Fetch all role requests with optional status filter
   * @param status - Optional: 'pending', 'approved', 'rejected', 'cancelled'
   * @returns List of role requests
   */
  async fetchAllRequests(status?: string): Promise<RoleRequestType[]> {
    try {
      const requests = await factoryRoleRequestService.getRoleRequests(status);
      return requests || [];
    } catch (error) {
      console.error('Failed to fetch role requests:', error);
      throw new Error('Failed to fetch role requests');
    }
  }

  /**
   * Fetch a single role request by ID
   * @param requestId - Request ID
   * @returns Role request details
   */
  async fetchRequestById(requestId: string): Promise<RoleRequestType | null> {
    try {
      return await factoryRoleRequestService.getRoleRequest(requestId);
    } catch (error) {
      console.error(`Failed to fetch request ${requestId}:`, error);
      throw new Error(`Failed to fetch request details`);
    }
  }

  /**
   * Fetch pending role requests
   * @returns List of pending requests
   */
  async fetchPendingRequests(): Promise<RoleRequestType[]> {
    try {
      const requests = await factoryRoleRequestService.getPendingRoleRequests();
      return requests || [];
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
      throw new Error('Failed to fetch pending requests');
    }
  }

  /**
   * Fetch requests for a specific user
   * @param userId - User ID
   * @returns List of requests for the user
   */
  async fetchRequestsByUserId(userId: string): Promise<RoleRequestType[]> {
    try {
      const requests = await factoryRoleRequestService.getRoleRequestsByUserId(userId);
      return requests || [];
    } catch (error) {
      console.error(`Failed to fetch requests for user ${userId}:`, error);
      throw new Error('Failed to fetch user requests');
    }
  }

  /**
   * Get statistics on role requests
   * @returns Request counts by status
   */
  async fetchRequestStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
    total: number;
  }> {
    try {
      const stats = await factoryRoleRequestService.getRoleRequestStats();
      return stats || {
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        total: 0,
      };
    } catch (error) {
      console.error('Failed to fetch request stats:', error);
      throw new Error('Failed to fetch request statistics');
    }
  }

  /**
   * Create a new role request
   * @param data - Role request creation data
   * @returns Created role request
   */
  async createRequest(data: {
    userId: string;
    requestedRole: string;
    reason: string;
    tenantId?: string;
    expiresAt?: string;
  }): Promise<RoleRequestType> {
    try {
      // Validate required fields
      if (!data.userId || !data.requestedRole || !data.reason) {
        throw new Error('Missing required fields: userId, requestedRole, reason');
      }

      const request = await factoryRoleRequestService.createRoleRequest(data);
      if (!request) {
        throw new Error('Failed to create role request');
      }
      return request;
    } catch (error) {
      console.error('Failed to create role request:', error);
      throw error;
    }
  }

  /**
   * Review a role request (approve or reject)
   * @param requestId - Request ID
   * @param reviewData - Review information
   * @param reviewerId - ID of the reviewer
   * @returns Updated role request
   */
  async reviewRequest(
    requestId: string,
    reviewData: RoleRequestReviewInput,
    reviewerId: string
  ): Promise<RoleRequestType> {
    try {
      // Validate required fields
      if (!requestId || !reviewData || !reviewerId) {
        throw new Error('Missing required fields: requestId, reviewData, reviewerId');
      }

      if (!['approved', 'rejected'].includes(reviewData.status)) {
        throw new Error(`Invalid review status: ${reviewData.status}`);
      }

      // Add reviewer info
      const enrichedReviewData = {
        ...reviewData,
        reviewedBy: reviewerId,
      };

      const request = await factoryRoleRequestService.reviewRoleRequest(
        requestId,
        enrichedReviewData
      );

      if (!request) {
        throw new Error('Failed to review role request');
      }

      return request;
    } catch (error) {
      console.error('Failed to review role request:', error);
      throw error;
    }
  }

  /**
   * Approve a role request
   * @param requestId - Request ID
   * @param reviewComments - Optional comments
   * @param expiresAt - Optional expiration date
   * @param reviewerId - ID of the reviewer
   * @returns Updated role request
   */
  async approveRequest(
    requestId: string,
    reviewComments?: string,
    expiresAt?: string,
    reviewerId?: string
  ): Promise<RoleRequestType> {
    const reviewData: RoleRequestReviewInput = {
      status: 'approved',
      reviewComments: reviewComments || '',
      expiresAt,
    };

    return this.reviewRequest(requestId, reviewData, reviewerId || 'system');
  }

  /**
   * Reject a role request
   * @param requestId - Request ID
   * @param reviewComments - Rejection reason
   * @param reviewerId - ID of the reviewer
   * @returns Updated role request
   */
  async rejectRequest(
    requestId: string,
    reviewComments?: string,
    reviewerId?: string
  ): Promise<RoleRequestType> {
    const reviewData: RoleRequestReviewInput = {
      status: 'rejected',
      reviewComments: reviewComments || '',
    };

    return this.reviewRequest(requestId, reviewData, reviewerId || 'system');
  }

  /**
   * Cancel a role request
   * @param requestId - Request ID
   * @returns Updated role request
   */
  async cancelRequest(requestId: string): Promise<RoleRequestType> {
    try {
      if (!requestId) {
        throw new Error('Request ID is required');
      }

      const request = await factoryRoleRequestService.cancelRoleRequest(requestId);
      if (!request) {
        throw new Error('Failed to cancel role request');
      }
      return request;
    } catch (error) {
      console.error('Failed to cancel role request:', error);
      throw error;
    }
  }

  /**
   * Get recent role requests
   * @param limit - Number of requests to return
   * @returns List of recent requests
   */
  async fetchRecentRequests(limit: number = 10): Promise<RoleRequestType[]> {
    try {
      const requests = await factoryRoleRequestService.getRoleRequests();
      if (!requests) return [];

      // Sort by createdAt descending and take first 'limit' items
      return requests
        .sort((a: RoleRequestType, b: RoleRequestType) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch recent requests:', error);
      throw new Error('Failed to fetch recent requests');
    }
  }

  /**
   * Search role requests
   * @param query - Search term (searches userId, requestedRole, reason)
   * @returns Matching role requests
   */
  async searchRequests(query: string): Promise<RoleRequestType[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      const allRequests = await factoryRoleRequestService.getRoleRequests();
      if (!allRequests) return [];

      const lowerQuery = query.toLowerCase();
      return allRequests.filter(
        (req: RoleRequestType) =>
          req.userId.toLowerCase().includes(lowerQuery) ||
          req.requestedRole.toLowerCase().includes(lowerQuery) ||
          req.reason.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Failed to search requests:', error);
      throw new Error('Failed to search requests');
    }
  }

  /**
   * Get requests by status with pagination
   * @param status - Request status
   * @param page - Page number (1-indexed)
   * @param pageSize - Items per page
   * @returns Paginated requests
   */
  async fetchRequestsByStatusPaginated(
    status: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{
    data: RoleRequestType[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const requests = await factoryRoleRequestService.getRoleRequests(status);
      const total = requests?.length || 0;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      return {
        data: requests?.slice(start, end) || [],
        total,
        page,
        pageSize,
      };
    } catch (error) {
      console.error('Failed to fetch paginated requests:', error);
      throw new Error('Failed to fetch paginated requests');
    }
  }
}

/**
 * Export singleton instance
 */
export const roleRequestService = new SuperAdminRoleRequestService();

/**
 * Export class for testing or custom instantiation
 */
export default SuperAdminRoleRequestService;