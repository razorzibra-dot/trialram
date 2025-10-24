/**
 * Role Request Types
 * Type definitions for role change requests
 */

export interface RoleRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  tenantId: string;
  tenantName: string;
  currentRole: string;
  requestedRole: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerEmail?: string;
}

export interface RoleRequestFilters {
  status?: 'pending' | 'approved' | 'rejected';
  tenantId?: string;
  userId?: string;
  search?: string;
}

export interface RoleRequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface RoleRequestFormData {
  reason: string;
  rejectionReason?: string;
}

export interface RoleRequestResponse {
  data: RoleRequest[];
  stats: RoleRequestStats;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
}