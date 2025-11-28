/**
 * Mock Role Request Service
 * 
 * Provides mock data for role request management in development mode.
 * Mirrors the database schema and validation rules of the Supabase implementation.
 * 
 * Layer 3: Mock Service (Development Data)
 * Database: role_requests table
 * 
 * Last Updated: 2025-02-11
 */

import {
    RoleRequestType,
    RoleRequestCreateInput,
    RoleRequestReviewInput,
    validateRoleRequest,
    validateRoleRequestCreate,
    validateRoleRequestReview,
} from '@/types/superUserModule';

/**
 * Mock role requests data store
 * In-memory storage for development and testing
 */
const mockRoleRequests: RoleRequestType[] = [
    {
        id: 'role-req-001',
        userId: 'user-123',
        requestedRole: 'admin',
        reason: 'Need admin access to manage users for Customer Success team',
        status: 'pending',
        tenantId: 'tenant-001',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'role-req-002',
        userId: 'user-456',
        requestedRole: 'manager',
        reason: 'Team lead promotion - need manager role for the Sales department',
        status: 'approved',
        tenantId: 'tenant-002',
        reviewedBy: 'super-admin-1',
        reviewComments: 'Approved after verification with HR',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'role-req-003',
        userId: 'user-789',
        requestedRole: 'super_admin',
        reason: 'Requested temporary super admin access for system migration project',
        status: 'pending',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'role-req-004',
        userId: 'user-321',
        requestedRole: 'manager',
        reason: 'Contractor needs temporary manager access for project duration',
        status: 'rejected',
        reviewedBy: 'super-admin-1',
        reviewComments: 'Cannot grant temp roles to external contractors per policy',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
];

/**
 * Mock Role Request Service
 * 
 * Provides CRUD operations for role requests with mock data.
 * All methods are synchronous with mock data but return Promises for compatibility.
 */
export const mockRoleRequestService = {
    /**
     * Get all role requests with optional filtering
     * 
     * @param status - Filter by status (pending, approved, rejected, cancelled)
     * @returns Array of role requests
     */
    async getRoleRequests(status?: string): Promise<RoleRequestType[]> {
        if (status) {
            return mockRoleRequests.filter(r => r.status === status);
        }
        return mockRoleRequests;
    },

    /**
     * Get a single role request by ID
     * 
     * @param id - Role request ID
     * @returns Role request or throws if not found
     */
    async getRoleRequest(id: string): Promise<RoleRequestType> {
        const request = mockRoleRequests.find(r => r.id === id);
        if (!request) {
            throw new Error(`Role request ${id} not found`);
        }
        return request;
    },

    /**
     * Get pending role requests
     * 
     * @returns Array of pending role requests
     */
    async getPendingRoleRequests(): Promise<RoleRequestType[]> {
        return mockRoleRequests.filter(r => r.status === 'pending');
    },

    /**
     * Get role requests for a specific user
     * 
     * @param userId - User ID
     * @returns Array of user's role requests
     */
    async getRoleRequestsByUserId(userId: string): Promise<RoleRequestType[]> {
        return mockRoleRequests.filter(r => r.userId === userId);
    },

    /**
     * Create a new role request
     * 
     * @param data - Role request creation input
     * @returns Created role request
     */
    async createRoleRequest(data: RoleRequestCreateInput): Promise<RoleRequestType> {
        // Validate input
        validateRoleRequestCreate(data);

        const newRequest: RoleRequestType = {
            id: `role-req-${Date.now()}`,
            userId: data.userId,
            requestedRole: data.requestedRole,
            reason: data.reason,
            status: 'pending',
            tenantId: data.tenantId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        mockRoleRequests.push(newRequest);
        return newRequest;
    },

    /**
     * Review (approve or reject) a role request
     * 
     * @param id - Role request ID
     * @param data - Review input (status and optional comments)
     * @param reviewerId - ID of super admin reviewing
     * @returns Updated role request
     */
    async reviewRoleRequest(
        id: string,
        data: RoleRequestReviewInput,
        reviewerId: string
    ): Promise<RoleRequestType> {
        // Validate input
        validateRoleRequestReview(data);

        const request = mockRoleRequests.find(r => r.id === id);
        if (!request) {
            throw new Error(`Role request ${id} not found`);
        }

        if (request.status !== 'pending') {
            throw new Error(`Role request ${id} has already been reviewed`);
        }

        // Update request
        request.status = data.status === 'approved' ? 'approved' : 'rejected';
        request.reviewedBy = reviewerId;
        request.reviewComments = data.reviewComments;
        request.reviewedAt = new Date().toISOString();
        request.expiresAt = data.expiresAt;
        request.updatedAt = new Date().toISOString();

        return request;
    },

    /**
     * Cancel a pending role request
     * 
     * @param id - Role request ID
     * @returns Updated role request
     */
    async cancelRoleRequest(id: string): Promise<RoleRequestType> {
        const request = mockRoleRequests.find(r => r.id === id);
        if (!request) {
            throw new Error(`Role request ${id} not found`);
        }

        if (request.status !== 'pending') {
            throw new Error(`Cannot cancel a ${request.status} role request`);
        }

        request.status = 'cancelled';
        request.updatedAt = new Date().toISOString();

        return request;
    },

    /**
     * Get role request statistics
     * 
     * @returns Object with counts by status
     */
    async getRoleRequestStats(): Promise<{
        pending: number;
        approved: number;
        rejected: number;
        cancelled: number;
        total: number;
    }> {
        return {
            pending: mockRoleRequests.filter(r => r.status === 'pending').length,
            approved: mockRoleRequests.filter(r => r.status === 'approved').length,
            rejected: mockRoleRequests.filter(r => r.status === 'rejected').length,
            cancelled: mockRoleRequests.filter(r => r.status === 'cancelled').length,
            total: mockRoleRequests.length,
        };
    },
};