/**
 * Role Request Service
 * Handles role change request operations
 */

import {
  RoleRequest,
  RoleRequestFilters,
  RoleRequestStats,
  RoleRequestResponse,
} from '../types/roleRequest';

class RoleRequestService {
  private baseUrl = '/api/super-admin/role-requests';

  /**
   * Get all role requests with filters
   */
  async getRoleRequests(filters?: RoleRequestFilters): Promise<RoleRequestResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.tenantId) params.append('tenantId', filters.tenantId);
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.search) params.append('search', filters.search);

      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}?${params}`, {
      //   headers: { 'Authorization': `Bearer ${getToken()}` }
      // });
      // const data = await response.json();

      // Mock data for now
      const mockRequests: RoleRequest[] = [
        {
          id: '1',
          userId: 'user1',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          tenantId: 'tenant1',
          tenantName: 'Acme Corp',
          currentRole: 'agent',
          requestedRole: 'manager',
          status: 'pending',
          reason: 'Promoted to team lead',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          userId: 'user2',
          userName: 'Jane Smith',
          userEmail: 'jane@example.com',
          tenantId: 'tenant2',
          tenantName: 'Tech Solutions',
          currentRole: 'manager',
          requestedRole: 'admin',
          status: 'approved',
          reason: 'Need admin privileges for system configuration',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          reviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          reviewedBy: 'admin@platform.com',
          reviewerEmail: 'admin@platform.com'
        },
        {
          id: '3',
          userId: 'user3',
          userName: 'Mike Johnson',
          userEmail: 'mike@example.com',
          tenantId: 'tenant1',
          tenantName: 'Acme Corp',
          currentRole: 'agent',
          requestedRole: 'supervisor',
          status: 'rejected',
          reason: 'Request for supervisory access',
          rejectionReason: 'Insufficient tenure in current role',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          reviewedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          reviewedBy: 'admin@platform.com',
          reviewerEmail: 'admin@platform.com'
        },
      ];

      const filtered = this.filterRequests(mockRequests, filters);
      const stats = this.calculateStats(filtered);

      return {
        data: filtered,
        stats,
        pagination: {
          page: 1,
          pageSize: 50,
          total: filtered.length,
        },
      };
    } catch (error) {
      console.error('Failed to fetch role requests:', error);
      throw new Error('Failed to fetch role requests');
    }
  }

  /**
   * Get a single role request
   */
  async getRoleRequest(id: string): Promise<RoleRequest> {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/${id}`, {
      //   headers: { 'Authorization': `Bearer ${getToken()}` }
      // });
      // return await response.json();

      // Mock data
      const allRequests = await this.getRoleRequests();
      const request = allRequests.data.find(r => r.id === id);
      if (!request) throw new Error('Request not found');
      return request;
    } catch (error) {
      console.error('Failed to fetch role request:', error);
      throw new Error('Failed to fetch role request details');
    }
  }

  /**
   * Approve a role request
   */
  async approveRoleRequest(id: string): Promise<RoleRequest> {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/${id}/approve`, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${getToken()}` }
      // });
      // return await response.json();

      // Mock implementation
      const request = await this.getRoleRequest(id);
      return {
        ...request,
        status: 'approved' as const,
        reviewedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to approve role request:', error);
      throw new Error('Failed to approve role request');
    }
  }

  /**
   * Reject a role request
   */
  async rejectRoleRequest(id: string, reason: string): Promise<RoleRequest> {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/${id}/reject`, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${getToken()}` },
      //   body: JSON.stringify({ reason })
      // });
      // return await response.json();

      // Mock implementation
      const request = await this.getRoleRequest(id);
      return {
        ...request,
        status: 'rejected' as const,
        rejectionReason: reason,
        reviewedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to reject role request:', error);
      throw new Error('Failed to reject role request');
    }
  }

  /**
   * Private helper methods
   */
  private filterRequests(requests: RoleRequest[], filters?: RoleRequestFilters): RoleRequest[] {
    if (!filters) return requests;

    return requests.filter(request => {
      if (filters.status && request.status !== filters.status) return false;
      if (filters.tenantId && request.tenantId !== filters.tenantId) return false;
      if (filters.userId && request.userId !== filters.userId) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          request.userName.toLowerCase().includes(searchLower) ||
          request.userEmail.toLowerCase().includes(searchLower) ||
          request.tenantName.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }

  private calculateStats(requests: RoleRequest[]): RoleRequestStats {
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
    };
  }
}

export const roleRequestService = new RoleRequestService();