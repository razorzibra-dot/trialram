/**
 * User Management Module Service
 * Coordinates between UI hooks and backend services using factory pattern
 * 
 * CRITICAL: Uses factory service for multi-backend support
 * Never import mock/supabase services directly - always use factory
 * 
 * Layer Synchronization:
 * ✅ Uses ServiceFactory to route to correct backend (mock/supabase)
 * ✅ Returns DTOs matching database exactly
 * ✅ Applies module-specific business logic if needed
 * ✅ Handles errors consistently
 */

import { getUserService } from '@/services/serviceFactory';
import {
  UserDTO,
  UserStatsDTO,
  CreateUserDTO,
  UpdateUserDTO,
  UserFiltersDTO,
  UserActivityDTO,
  UserRole,
  UserStatus,
} from '@/types/dtos/userDtos';

/**
 * Module-level service for user management
 * Coordinates data between UI and backend services
 * All methods use factory-routed services
 */
export const userService = {
  /**
   * Get all users with optional filters
   * ✅ Returns: UserDTO[]
   * ✅ Filters: status, role, department, search, date range
   */
  async getUsers(filters?: UserFiltersDTO): Promise<UserDTO[]> {
    const service = getUserService();
    return await service.getUsers(filters);
  },

  /**
   * Get a single user by ID
   * ✅ Returns: UserDTO
   * ✅ Throws: Error if not found
   */
  async getUser(id: string): Promise<UserDTO> {
    const service = getUserService();
    return await service.getUser(id);
  },

  /**
   * Create a new user
   * ✅ Returns: Created UserDTO with generated id and timestamps
   * ✅ Validation: Email uniqueness, required fields, format
   */
  async createUser(data: CreateUserDTO): Promise<UserDTO> {
    const service = getUserService();
    return await service.createUser(data);
  },

  /**
   * Update an existing user
   * ✅ Returns: Updated UserDTO
   * ✅ Validation: Email uniqueness if updated, role/status validation
   */
  async updateUser(id: string, data: UpdateUserDTO): Promise<UserDTO> {
    const service = getUserService();
    return await service.updateUser(id, data);
  },

  /**
   * Delete a user (soft delete in production)
   * ✅ Validation: User exists
   */
  async deleteUser(id: string): Promise<void> {
    const service = getUserService();
    return await service.deleteUser(id);
  },

  /**
   * Reset user password
   * ✅ Validation: User exists
   * Note: In production, triggers Supabase Auth password reset
   */
  async resetPassword(id: string): Promise<void> {
    const service = getUserService();
    return await service.resetPassword(id);
  },

  /**
   * Get user statistics
   * ✅ Returns: UserStatsDTO with aggregated metrics
   */
  async getUserStats(): Promise<UserStatsDTO> {
    const service = getUserService();
    return await service.getUserStats();
  },

  /**
   * Get available roles
   * ✅ Returns: UserRole[]
   */
  async getRoles(): Promise<UserRole[]> {
    const service = getUserService();
    return await service.getRoles();
  },

  /**
   * Get available statuses
   * ✅ Returns: UserStatus[]
   */
  async getStatuses(): Promise<UserStatus[]> {
    const service = getUserService();
    return await service.getStatuses();
  },

  /**
   * Get user activity log
   * ✅ Returns: UserActivityDTO[]
   */
  async getUserActivity(userId: string): Promise<UserActivityDTO[]> {
    const service = getUserService();
    return await service.getUserActivity(userId);
  },

  /**
   * Log user activity
   * ✅ Returns: Created UserActivityDTO
   */
  async logActivity(activity: Omit<UserActivityDTO, 'id'>): Promise<UserActivityDTO> {
    const service = getUserService();
    return await service.logActivity(activity);
  },

  /**
   * Get available tenants
   * ✅ Returns: TenantDTO[]
   * Used for multi-tenant user assignment
   */
  async getTenants() {
    const service = getUserService();
    return await service.getTenants();
  },
};