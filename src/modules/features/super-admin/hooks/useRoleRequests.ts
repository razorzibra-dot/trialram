/**
 * Role Request Hooks
 * 
 * Provides React Query hooks for role request management
 * with proper caching, loading states, and error handling.
 * 
 * Layer 7: Hooks (Data Fetching & State Management)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleRequestService } from '@/services/serviceFactory';
import {
    RoleRequestType,
    RoleRequestCreateInput,
    RoleRequestReviewInput,
} from '@/types/superUserModule';

/**
 * Query key factory for role requests
 */
const ROLE_REQUEST_KEYS = {
    all: ['roleRequests'] as const,
    lists: () => [...ROLE_REQUEST_KEYS.all, 'list'] as const,
    list: (filters?: any) => [...ROLE_REQUEST_KEYS.lists(), { filters }] as const,
    pending: () => [...ROLE_REQUEST_KEYS.all, 'pending'] as const,
    details: () => [...ROLE_REQUEST_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...ROLE_REQUEST_KEYS.details(), id] as const,
    byUser: (userId: string) => [...ROLE_REQUEST_KEYS.all, 'user', userId] as const,
    stats: () => [...ROLE_REQUEST_KEYS.all, 'stats'] as const,
};

/**
 * Fetch all role requests
 * 
 * @param status - Optional status filter (pending, approved, rejected, cancelled)
 * @returns Query result with role requests list
 */
export function useRoleRequests(status?: string) {
    return useQuery({
        queryKey: ROLE_REQUEST_KEYS.list({ status }),
        queryFn: () => roleRequestService.getRoleRequests(status),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000,    // 10 minutes
    });
}

/**
 * Fetch pending role requests
 * 
 * @returns Query result with pending role requests
 */
export function usePendingRoleRequests() {
    return useQuery({
        queryKey: ROLE_REQUEST_KEYS.pending(),
        queryFn: () => roleRequestService.getPendingRoleRequests(),
        staleTime: 2 * 60 * 1000, // 2 minutes (fresher for pending)
        gcTime: 5 * 60 * 1000,    // 5 minutes
    });
}

/**
 * Fetch a single role request by ID
 * 
 * @param id - Role request ID
 * @returns Query result with single role request
 */
export function useRoleRequest(id: string) {
    return useQuery({
        queryKey: ROLE_REQUEST_KEYS.detail(id),
        queryFn: () => roleRequestService.getRoleRequest(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}

/**
 * Fetch role requests for a specific user
 * 
 * @param userId - User ID
 * @returns Query result with user's role requests
 */
export function useRoleRequestsByUser(userId: string) {
    return useQuery({
        queryKey: ROLE_REQUEST_KEYS.byUser(userId),
        queryFn: () => roleRequestService.getRoleRequestsByUserId(userId),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}

/**
 * Fetch role request statistics
 * 
 * @returns Query result with statistics
 */
export function useRoleRequestStats() {
    return useQuery({
        queryKey: ROLE_REQUEST_KEYS.stats(),
        queryFn: () => roleRequestService.getRoleRequestStats(),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}

/**
 * Create a new role request
 * 
 * @returns Mutation function and state
 */
export function useCreateRoleRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: RoleRequestCreateInput) =>
            roleRequestService.createRoleRequest(data),
        onSuccess: () => {
            // Invalidate all role request queries
            queryClient.invalidateQueries({
                queryKey: ROLE_REQUEST_KEYS.all,
            });
        },
    });
}

/**
 * Review a role request (approve/reject)
 * 
 * @param roleRequestId - Role request ID to review
 * @returns Mutation function and state
 */
export function useReviewRoleRequest(roleRequestId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { reviewData: RoleRequestReviewInput; reviewerId: string }) =>
            roleRequestService.reviewRoleRequest(
                roleRequestId,
                data.reviewData,
                data.reviewerId
            ),
        onSuccess: () => {
            // Invalidate role request queries
            queryClient.invalidateQueries({
                queryKey: ROLE_REQUEST_KEYS.detail(roleRequestId),
            });
            queryClient.invalidateQueries({
                queryKey: ROLE_REQUEST_KEYS.all,
            });
        },
    });
}

/**
 * Cancel a role request
 * 
 * @param roleRequestId - Role request ID to cancel
 * @returns Mutation function and state
 */
export function useCancelRoleRequest(roleRequestId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => roleRequestService.cancelRoleRequest(roleRequestId),
        onSuccess: () => {
            // Invalidate role request queries
            queryClient.invalidateQueries({
                queryKey: ROLE_REQUEST_KEYS.detail(roleRequestId),
            });
            queryClient.invalidateQueries({
                queryKey: ROLE_REQUEST_KEYS.all,
            });
        },
    });
}

/**
 * Combined hook for role request management
 * Provides all operations needed for role request page
 * 
 * @returns Object with all role request hooks
 */
export function useRoleRequestManagement() {
    const roleRequests = useRoleRequests();
    const pendingRequests = usePendingRoleRequests();
    const stats = useRoleRequestStats();
    const createRequest = useCreateRoleRequest();

    return {
        roleRequests,
        pendingRequests,
        stats,
        createRequest,
    };
}