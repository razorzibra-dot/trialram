/**
 * User Management DTOs
 * Standardized data transfer objects for user operations
 * Ensures consistent field naming across mock and Supabase implementations
 */

import { AuditMetadataDTO, EntityStatus, PaginatedResponseDTO } from './commonDtos';

/**
 * User Role Types
 * Matches database enum: user_role
 */
export type UserRole = 'super_admin' | 'admin' | 'manager' | 'agent' | 'engineer' | 'customer';

/**
 * User Status Types
 * Matches database enum: user_status
 */
export type UserStatus = 'active' | 'inactive' | 'suspended';

/**
 * User Profile DTO
 * Complete user information
 *
 * FIELD MAPPING REFERENCE:
 * Database → DTO Field Mapping
 * - id → id
 * - email → email
 * - name → name
 * - first_name → firstName
 * - last_name → lastName
 * - role → role (enum)
 * - status → status (enum)
 * - tenant_id → tenantId
 * - avatar_url → avatarUrl
 * - phone → phone
 * - mobile → mobile
 * - company_name → companyName
 * - department → department
 * - position → position
 * - created_at → createdAt
 * - updated_at → updatedAt
 * - last_login → lastLogin
 * - created_by → createdBy
 * - deleted_at → deletedAt
 */
export interface UserDTO {
  /** Unique user identifier */
  id: string;

  /** User email address */
  email: string;

  /** Full display name */
  name: string;

  /** First name */
  firstName?: string;

  /** Last name */
  lastName?: string;

  /** User role in the system */
  role: UserRole;

  /** User account status */
  status: UserStatus;

  /** Tenant identifier */
  tenantId: string;

  /** Profile avatar URL */
  avatarUrl?: string;

  /** Primary phone number */
  phone?: string;

  /** Mobile phone number */
  mobile?: string;

  /** Company name */
  companyName?: string;

  /** Department within company */
  department?: string;

  /** Job position/title */
  position?: string;

  /** Account creation timestamp */
  createdAt: string;

  /** Last update timestamp */
  updatedAt?: string;

  /** Last login timestamp */
  lastLogin?: string;

  /** User who created this account */
  createdBy?: string;

  /** Soft delete timestamp */
  deletedAt?: string;
}

/**
 * User Statistics DTO
 * Analytics and metrics for user management
 */
export interface UserStatsDTO {
  /** Total number of users */
  totalUsers: number;

  /** Number of active users */
  activeUsers: number;

  /** Number of inactive users */
  inactiveUsers: number;

  /** Number of suspended users */
  suspendedUsers: number;

  /** Users by role distribution */
  usersByRole: Record<UserRole, number>;

  /** New users in the last 30 days */
  newUsersLast30Days: number;

  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Create User Request DTO
 * Fields required for creating a new user
 */
export interface CreateUserDTO {
  /** User email address */
  email: string;

  /** Full display name */
  name: string;

  /** First name */
  firstName?: string;

  /** Last name */
  lastName?: string;

  /** User role in the system */
  role: UserRole;

  /** User account status */
  status: UserStatus;

  /** Profile avatar URL */
  avatarUrl?: string;

  /** Primary phone number */
  phone?: string;

  /** Mobile phone number */
  mobile?: string;

  /** Company name */
  companyName?: string;

  /** Department within company */
  department?: string;

  /** Job position/title */
  position?: string;
}

/**
 * Update User Request DTO
 * Fields allowed for updating an existing user
 */
export interface UpdateUserDTO {
  /** User email address */
  email?: string;

  /** Full display name */
  name?: string;

  /** First name */
  firstName?: string;

  /** Last name */
  lastName?: string;

  /** User role in the system */
  role?: UserRole;

  /** User account status */
  status?: UserStatus;

  /** Profile avatar URL */
  avatarUrl?: string;

  /** Primary phone number */
  phone?: string;

  /** Mobile phone number */
  mobile?: string;

  /** Company name */
  companyName?: string;

  /** Department within company */
  department?: string;

  /** Job position/title */
  position?: string;
}

/**
 * User Filters DTO
 * Filtering options for user queries
 */
export interface UserFiltersDTO {
  /** Filter by user status */
  status?: UserStatus[];

  /** Filter by user role */
  role?: UserRole[];

  /** Filter by department */
  department?: string[];

  /** Search by name or email */
  search?: string;

  /** Filter by creation date range */
  createdAfter?: string;

  /** Filter by creation date range */
  createdBefore?: string;
}

/**
 * User List Response DTO
 * Paginated response for user listing
 */
export interface UserListResponseDTO extends PaginatedResponseDTO<UserDTO> {
  /** Applied filters */
  filters: UserFiltersDTO;

  /** Total count matching filters */
  totalCount: number;
}

/**
 * User Activity DTO
 * User activity log entry
 */
export interface UserActivityDTO {
  /** Activity identifier */
  id: string;

  /** User who performed the action */
  userId: string;

  /** Action performed */
  action: string;

  /** Resource affected */
  resource: string;

  /** Additional details */
  details?: Record<string, any>;

  /** Activity timestamp */
  timestamp: string;

  /** IP address */
  ipAddress?: string;
}