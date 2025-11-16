/**
 * Supabase Role Request Service
 * 
 * Provides role request management operations against Supabase PostgreSQL database.
 * Implements full CRUD operations with proper column mapping (snake_case → camelCase).
 * 
 * Layer 4: Supabase Service (Production Data)
 * Database: role_requests table
 * 
 * Last Updated: 2025-02-11
 */

import { createClient } from '@supabase/supabase-js';

const supabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

const getSupabaseClient = () => supabaseClient;
import {
    RoleRequestType,
    RoleRequestCreateInput,
    RoleRequestReviewInput,
    validateRoleRequest,
    validateRoleRequestCreate,
    validateRoleRequestReview,
} from '@/types/superUserModule';

/**
 * Row mapper function to convert database rows to TypeScript types
 * Maps snake_case database columns to camelCase TypeScript fields
 * 
 * CRITICAL: Keep this function synchronized with database schema
 * 
 * @param row - Database row from Supabase
 * @returns Mapped RoleRequestType
 */
function mapRoleRequestRow(row: any): RoleRequestType {
    return {
        id: row.id,
        userId: row.user_id,
        requestedRole: row.requested_role,
        reason: row.reason,
        status: row.status,
        tenantId: row.tenant_id,
        reviewedBy: row.reviewed_by,
        reviewComments: row.review_comments,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        reviewedAt: row.reviewed_at,
        expiresAt: row.expires_at,
    };
}

/**
 * Supabase Role Request Service
 * 
 * Provides CRUD operations for role requests against Supabase database.
 * All methods include proper error handling and validation.
 */
export const supabaseRoleRequestService = {
    /**
     * Get all role requests with optional filtering
     * 
     * @param status - Filter by status (pending, approved, rejected, cancelled)
     * @returns Array of role requests
     */
    async getRoleRequests(status?: string): Promise<RoleRequestType[]> {
        const supabase = getSupabaseClient();
        let query = supabase
            .from('role_requests')
            .select(`
                id,
                user_id as userId,
                requested_role as requestedRole,
                reason,
                status,
                tenant_id as tenantId,
                reviewed_by as reviewedBy,
                review_comments as reviewComments,
                created_at as createdAt,
                updated_at as updatedAt,
                reviewed_at as reviewedAt,
                expires_at as expiresAt
            `)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;
        return (data || []).map(mapRoleRequestRow);
    },

    /**
     * Get a single role request by ID
     * 
     * @param id - Role request ID
     * @returns Role request
     */
    async getRoleRequest(id: string): Promise<RoleRequestType> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('role_requests')
            .select(`
                id,
                user_id as userId,
                requested_role as requestedRole,
                reason,
                status,
                tenant_id as tenantId,
                reviewed_by as reviewedBy,
                review_comments as reviewComments,
                created_at as createdAt,
                updated_at as updatedAt,
                reviewed_at as reviewedAt,
                expires_at as expiresAt
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) throw new Error(`Role request ${id} not found`);
        return mapRoleRequestRow(data);
    },

    /**
     * Get pending role requests
     * 
     * @returns Array of pending role requests
     */
    async getPendingRoleRequests(): Promise<RoleRequestType[]> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('role_requests')
            .select(`
                id,
                user_id as userId,
                requested_role as requestedRole,
                reason,
                status,
                tenant_id as tenantId,
                reviewed_by as reviewedBy,
                review_comments as reviewComments,
                created_at as createdAt,
                updated_at as updatedAt,
                reviewed_at as reviewedAt,
                expires_at as expiresAt
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (error) throw error;
        return (data || []).map(mapRoleRequestRow);
    },

    /**
     * Get role requests for a specific user
     * 
     * @param userId - User ID
     * @returns Array of user's role requests
     */
    async getRoleRequestsByUserId(userId: string): Promise<RoleRequestType[]> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('role_requests')
            .select(`
                id,
                user_id as userId,
                requested_role as requestedRole,
                reason,
                status,
                tenant_id as tenantId,
                reviewed_by as reviewedBy,
                review_comments as reviewComments,
                created_at as createdAt,
                updated_at as updatedAt,
                reviewed_at as reviewedAt,
                expires_at as expiresAt
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapRoleRequestRow);
    },

    /**
     * Create a new role request
     * 
     * @param data - Role request creation input
     * @returns Created role request
     */
    async createRoleRequest(data: RoleRequestCreateInput): Promise<RoleRequestType> {
        const supabase = getSupabaseClient();
        // Validate input
        validateRoleRequestCreate(data);

        const { data: result, error } = await supabase
            .from('role_requests')
            .insert([{
                user_id: data.userId,
                requested_role: data.requestedRole,
                reason: data.reason,
                tenant_id: data.tenantId || null,
                status: 'pending',
            }])
            .select()
            .single();

        if (error) throw error;
        return mapRoleRequestRow(result);
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
        const supabase = getSupabaseClient();
        // Validate input
        validateRoleRequestReview(data);

        // Check current status first
        const { data: existing, error: fetchError } = await supabase
            .from('role_requests')
            .select('status')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;
        if (existing.status !== 'pending') {
            throw new Error(`Role request ${id} has already been reviewed`);
        }

        // Update the request
        const { data: result, error } = await supabase
            .from('role_requests')
            .update({
                status: data.status === 'approved' ? 'approved' : 'rejected',
                reviewed_by: reviewerId,
                review_comments: data.reviewComments || null,
                reviewed_at: new Date().toISOString(),
                expires_at: data.expiresAt || null,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return mapRoleRequestRow(result);
    },

    /**
     * Cancel a pending role request
     * 
     * @param id - Role request ID
     * @returns Updated role request
     */
    async cancelRoleRequest(id: string): Promise<RoleRequestType> {
        const supabase = getSupabaseClient();
        // Check current status first
        const { data: existing, error: fetchError } = await supabase
            .from('role_requests')
            .select('status')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;
        if (existing.status !== 'pending') {
            throw new Error(`Cannot cancel a ${existing.status} role request`);
        }

        // Update the request
        const { data: result, error } = await supabase
            .from('role_requests')
            .update({
                status: 'cancelled',
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return mapRoleRequestRow(result);
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
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('role_requests')
            .select('status');

        if (error) throw error;

        const counts = {
            pending: 0,
            approved: 0,
            rejected: 0,
            cancelled: 0,
            total: data?.length || 0,
        };

        data?.forEach(row => {
            counts[row.status as keyof typeof counts]++;
        });

        return counts;
    },
};