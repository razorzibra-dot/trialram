/**
 * Super User Module - TypeScript Types & Validation
 * 
 * This file defines all TypeScript interfaces and Zod validation schemas
 * for the Super User module. These types MUST exactly match the database
 * schema defined in:
 * supabase/migrations/20250211_super_user_schema.sql
 * 
 * Field Naming Convention:
 * - Database uses snake_case (e.g., super_user_id)
 * - TypeScript uses camelCase (e.g., superUserId)
 * 
 * Last Updated: 2025-02-11
 */

import { z } from 'zod';

/**
 * =====================================================
 * ENTITY TYPES FOR SUPER USER MANAGEMENT
 * =====================================================
 */

/**
 * Super User Type (represents a super admin user in the system)
 */
export interface SuperUserType {
    /** UUID primary key */
    id: string;
    
    /** Associated user ID (FK to users) */
    userId: string;
    
    /** Tenant ID (null for platform-wide super admins) */
    tenantId?: string | null;
    
    /** Permission level */
    permissionLevel: 'full' | 'limited' | 'read_only';
    
    /** Created timestamp */
    createdAt: string;
    
    /** Updated timestamp */
    updatedAt: string;
}

/**
 * Alias for backward compatibility and module-specific typing
 */
export type TenantAccessType = SuperUserTenantAccessType;

/**
 * Type alias for tenant access create input
 */
export type TenantAccessCreateInput = SuperUserTenantAccessCreateInput;

/**
 * Type alias for configuration override input
 */
export type ConfigOverrideInput = TenantConfigOverrideCreateInput;

/**
 * Super User Create Input
 */
export interface SuperUserCreateInput {
    userId: string;
    tenantId?: string | null;
    permissionLevel: 'full' | 'limited' | 'read_only';
}

/**
 * Super User Update Input
 */
export interface SuperUserUpdateInput {
    permissionLevel?: 'full' | 'limited' | 'read_only';
}

/**
 * =====================================================
 * ENUMS & CONSTANTS
 * =====================================================
 */

/**
 * Access levels for super user tenant access control
 */
export const AccessLevelEnum = {
    FULL: 'full',
    LIMITED: 'limited',
    READ_ONLY: 'read_only',
    SPECIFIC_MODULES: 'specific_modules',
} as const;

export type AccessLevel = typeof AccessLevelEnum[keyof typeof AccessLevelEnum];

/**
 * Metric types for tenant statistics
 */
export const MetricTypeEnum = {
    ACTIVE_USERS: 'active_users',
    TOTAL_CONTRACTS: 'total_contracts',
    TOTAL_SALES: 'total_sales',
    TOTAL_TRANSACTIONS: 'total_transactions',
    DISK_USAGE: 'disk_usage',
    API_CALLS_DAILY: 'api_calls_daily',
} as const;

export type MetricType = typeof MetricTypeEnum[keyof typeof MetricTypeEnum];

/**
 * =====================================================
 * ENTITY TYPES (Database Models)
 * =====================================================
 */

/**
 * Super User Tenant Access
 * Represents the relationship between a super user and a tenant
 * with an associated access level
 */
export interface SuperUserTenantAccessType {
    /** UUID primary key */
    id: string;
    
    /** Super user ID (FK to users) */
    superUserId: string;
    
    /** Tenant ID (FK to tenants) */
    tenantId: string;
    
    /** Access level for this tenant */
    accessLevel: AccessLevel;
    
    /** Created timestamp */
    createdAt: string;
    
    /** Last updated timestamp */
    updatedAt: string;
}

/**
 * Impersonation Action
 * Represents a single action (page visit, API call, data modification) during impersonation
 */
export interface ImpersonationAction {
    /** Action type: 'PAGE_VIEW', 'API_CALL', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'SEARCH' */
    actionType: 'PAGE_VIEW' | 'API_CALL' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'SEARCH' | 'PRINT';
    
    /** Resource being accessed (e.g., 'customers', 'contracts', '/dashboard') */
    resource: string;
    
    /** Resource ID (optional, for specific record actions) */
    resourceId?: string;
    
    /** HTTP method (GET, POST, PUT, DELETE) for API_CALL actions */
    method?: string;
    
    /** HTTP status code or result (200, 404, 'success', 'error') */
    status?: number | string;
    
    /** Additional metadata about the action */
    metadata?: Record<string, unknown>;
    
    /** Timestamp when action was performed */
    timestamp: string;
    
    /** Duration of action in milliseconds (optional) */
    duration?: number;
}

/**
 * Impersonation Log Entry
 * Tracks audit trail of super user impersonation sessions
 */
export interface ImpersonationLogType {
    /** UUID primary key */
    id: string;
    
    /** Super user performing impersonation (FK to users) */
    superUserId: string;
    
    /** User being impersonated (FK to users) */
    impersonatedUserId: string;
    
    /** Tenant context (FK to tenants) */
    tenantId: string;
    
    /** Reason for impersonation (optional, max 500 chars) */
    reason?: string;
    
    /** Session start time */
    loginAt: string;
    
    /** Session end time (nullable if still active) */
    logoutAt?: string;
    
    /** Actions taken during impersonation (JSONB array) */
    actionsTaken?: Record<string, unknown>[];
    
    /** IP address of super user (optional) */
    ipAddress?: string;
    
    /** User agent string (optional, max 500 chars) */
    userAgent?: string;
    
    /** Created timestamp */
    createdAt: string;
    
    /** Last updated timestamp */
    updatedAt: string;
}

/**
 * Tenant Statistic
 * Represents a single metric measurement for a tenant
 */
export interface TenantStatisticType {
    /** UUID primary key */
    id: string;
    
    /** Tenant ID (FK to tenants) */
    tenantId: string;
    
    /** Type of metric being recorded */
    metricType: MetricType;
    
    /** Metric value (nullable, non-negative) */
    metricValue?: number;
    
    /** When this metric was recorded */
    recordedAt: string;
    
    /** Last updated timestamp */
    updatedAt: string;
}

/**
 * Tenant Configuration Override
 * Represents a configuration value override for a specific tenant
 */
export interface TenantConfigOverrideType {
    /** UUID primary key */
    id: string;
    
    /** Tenant ID (FK to tenants) */
    tenantId: string;
    
    /** Configuration key (max 255 chars, unique per tenant) */
    configKey: string;
    
    /** Configuration value (JSONB) */
    configValue: Record<string, unknown>;
    
    /** Reason for override (optional, max 500 chars) */
    overrideReason?: string;
    
    /** User who created this override (FK to users) */
    createdBy?: string;
    
    /** Created timestamp */
    createdAt: string;
    
    /** When this override expires (optional) */
    expiresAt?: string;
    
    /** Last updated timestamp */
    updatedAt: string;
}

/**
 * =====================================================
 * INPUT/DTO TYPES (Request Bodies)
 * =====================================================
 */

/**
 * Input for creating a new super user tenant access
 */
export interface SuperUserTenantAccessCreateInput {
    /** Super user ID (required) */
    superUserId: string;
    
    /** Tenant ID (required) */
    tenantId: string;
    
    /** Access level (optional, defaults to 'limited') */
    accessLevel?: AccessLevel;
}

/**
 * Input for updating super user tenant access
 */
export interface SuperUserTenantAccessUpdateInput {
    /** New access level (optional) */
    accessLevel?: AccessLevel;
}

/**
 * Input for starting an impersonation session
 */
export interface ImpersonationStartInput {
    /** User to impersonate (required) */
    impersonatedUserId: string;
    
    /** Tenant context (required) */
    tenantId: string;
    
    /** Reason for impersonation (optional) */
    reason?: string;
    
    /** IP address of requester (optional) */
    ipAddress?: string;
    
    /** User agent string (optional) */
    userAgent?: string;
}

/**
 * Input for ending an impersonation session
 */
export interface ImpersonationEndInput {
    /** Impersonation log ID to end (required) */
    logId: string;
    
    /** Actions captured during session (optional) */
    actionsTaken?: Record<string, unknown>[];
}

/**
 * Input for creating a tenant statistic
 */
export interface TenantStatisticCreateInput {
    /** Tenant ID (required) */
    tenantId: string;
    
    /** Metric type (required) */
    metricType: MetricType;
    
    /** Metric value (required) */
    metricValue: number;
}

/**
 * Input for creating a tenant configuration override
 */
export interface TenantConfigOverrideCreateInput {
    /** Tenant ID (required) */
    tenantId: string;
    
    /** Configuration key (required, max 255 chars) */
    configKey: string;
    
    /** Configuration value (required) */
    configValue: Record<string, unknown>;
    
    /** Reason for override (optional) */
    overrideReason?: string;
    
    /** When this override should expire (optional) */
    expiresAt?: string;
}

/**
 * Input for updating a tenant configuration override
 */
export interface TenantConfigOverrideUpdateInput {
    /** New configuration value (optional) */
    configValue?: Record<string, unknown>;
    
    /** New expiration time (optional) */
    expiresAt?: string;
    
    /** New reason (optional) */
    overrideReason?: string;
}

/**
 * =====================================================
 * ZOD VALIDATION SCHEMAS
 * =====================================================
 */

/**
 * Super User validation schema
 */
export const SuperUserSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    tenantId: z.string().uuid().nullable().optional(),
    permissionLevel: z.enum(['full', 'limited', 'read_only']),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

/**
 * Super User Create input validation
 */
export const SuperUserCreateSchema = z.object({
    userId: z.string().uuid('User ID must be valid UUID'),
    tenantId: z.string().uuid().nullable().optional(),
    permissionLevel: z.enum(['full', 'limited', 'read_only']),
});

/**
 * Super User Update input validation
 */
export const SuperUserUpdateSchema = z.object({
    permissionLevel: z.enum(['full', 'limited', 'read_only']).optional(),
});

/**
 * Access Level validation schema
 */
export const AccessLevelSchema = z.enum(['full', 'limited', 'read_only', 'specific_modules']);

/**
 * Metric Type validation schema
 */
export const MetricTypeSchema = z.enum([
    'active_users',
    'total_contracts',
    'total_sales',
    'total_transactions',
    'disk_usage',
    'api_calls_daily',
]);

/**
 * Super User Tenant Access validation schema
 * Matches database constraints exactly
 */
export const SuperUserTenantAccessSchema = z.object({
    id: z.string().uuid('Must be valid UUID'),
    superUserId: z.string().uuid('Must be valid UUID'),
    tenantId: z.string().uuid('Must be valid UUID'),
    accessLevel: AccessLevelSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

/**
 * Super User Tenant Access Create input validation
 */
export const SuperUserTenantAccessCreateSchema = z.object({
    superUserId: z
        .string()
        .uuid('Super user ID must be valid UUID'),
    tenantId: z
        .string()
        .uuid('Tenant ID must be valid UUID'),
    accessLevel: AccessLevelSchema.optional().default('limited'),
});

/**
 * Impersonation Action validation schema
 * Validates action tracking during impersonation sessions
 */
export const ImpersonationActionSchema = z.object({
    actionType: z.enum(['PAGE_VIEW', 'API_CALL', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'SEARCH', 'PRINT']),
    resource: z.string().min(1, 'Resource must not be empty'),
    resourceId: z.string().optional(),
    method: z.string().optional(),
    status: z.union([z.number(), z.string()]).optional(),
    metadata: z.record(z.unknown()).optional(),
    timestamp: z.string().datetime(),
    duration: z.number().int().positive().optional(),
});

/**
 * Impersonation Log validation schema
 * Matches database constraints exactly
 */
export const ImpersonationLogSchema = z.object({
    id: z.string().uuid(),
    superUserId: z.string().uuid(),
    impersonatedUserId: z.string().uuid(),
    tenantId: z.string().uuid(),
    reason: z.string().max(500, 'Reason must be 500 characters or less').optional(),
    loginAt: z.string().datetime(),
    logoutAt: z.string().datetime().optional(),
    actionsTaken: z.array(ImpersonationActionSchema).optional(),
    ipAddress: z.string().max(45, 'Invalid IP address').optional(),
    userAgent: z.string().max(500, 'User agent must be 500 characters or less').optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

/**
 * Impersonation Start input validation
 */
export const ImpersonationStartSchema = z.object({
    impersonatedUserId: z
        .string()
        .uuid('Impersonated user ID must be valid UUID'),
    tenantId: z
        .string()
        .uuid('Tenant ID must be valid UUID'),
    reason: z.string().max(500, 'Reason must be 500 characters or less').optional(),
    ipAddress: z.string().max(45, 'Invalid IP address').optional(),
    userAgent: z.string().max(500, 'User agent must be 500 characters or less').optional(),
});

/**
 * Impersonation End input validation
 */
export const ImpersonationEndSchema = z.object({
    logId: z.string().uuid('Log ID must be valid UUID'),
    actionsTaken: z.array(z.record(z.unknown())).optional(),
});

/**
 * Tenant Statistic validation schema
 * Matches database constraints exactly
 */
export const TenantStatisticSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    metricType: MetricTypeSchema,
    metricValue: z.number().nonnegative('Metric value must be non-negative').optional(),
    recordedAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

/**
 * Tenant Statistic Create input validation
 */
export const TenantStatisticCreateSchema = z.object({
    tenantId: z
        .string()
        .uuid('Tenant ID must be valid UUID'),
    metricType: MetricTypeSchema,
    metricValue: z
        .number()
        .nonnegative('Metric value must be non-negative'),
});

/**
 * Tenant Config Override validation schema
 * Matches database constraints exactly
 */
export const TenantConfigOverrideSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    configKey: z.string().max(255, 'Config key must be 255 characters or less'),
    configValue: z.record(z.unknown()),
    overrideReason: z.string().max(500, 'Reason must be 500 characters or less').optional(),
    createdBy: z.string().uuid().optional(),
    createdAt: z.string().datetime(),
    expiresAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime(),
});

/**
 * Tenant Config Override Create input validation
 */
export const TenantConfigOverrideCreateSchema = z.object({
    tenantId: z
        .string()
        .uuid('Tenant ID must be valid UUID'),
    configKey: z
        .string()
        .min(1, 'Config key is required')
        .max(255, 'Config key must be 255 characters or less'),
    configValue: z.record(z.unknown()).refine(
        (value) => Object.keys(value).length > 0,
        'Config value must not be empty'
    ),
    overrideReason: z
        .string()
        .max(500, 'Reason must be 500 characters or less')
        .optional(),
    expiresAt: z.string().datetime().optional(),
});

/**
 * Tenant Config Override Update input validation
 */
export const TenantConfigOverrideUpdateSchema = z.object({
    configValue: z.record(z.unknown()).optional(),
    expiresAt: z.string().datetime().optional(),
    overrideReason: z
        .string()
        .max(500, 'Reason must be 500 characters or less')
        .optional(),
});

/**
 * =====================================================
 * VALIDATION FUNCTIONS
 * =====================================================
 */

/**
 * Validates a super user object
 * @throws {z.ZodError} if validation fails
 */
export function validateSuperUser(data: unknown): SuperUserType {
    return SuperUserSchema.parse(data);
}

/**
 * Validates super user create input
 * @throws {z.ZodError} if validation fails
 */
export function validateSuperUserCreate(data: unknown): SuperUserCreateInput {
    return SuperUserCreateSchema.parse(data);
}

/**
 * Validates super user update input
 * @throws {z.ZodError} if validation fails
 */
export function validateSuperUserUpdate(data: unknown): SuperUserUpdateInput {
    return SuperUserUpdateSchema.parse(data);
}

/**
 * Validates a super user tenant access object
 * @throws {z.ZodError} if validation fails
 */
export function validateSuperUserTenantAccess(data: unknown): SuperUserTenantAccessType {
    return SuperUserTenantAccessSchema.parse(data);
}

/**
 * Validates super user tenant access create input
 * @throws {z.ZodError} if validation fails
 */
export function validateSuperUserTenantAccessCreate(
    data: unknown
): SuperUserTenantAccessCreateInput {
    return SuperUserTenantAccessCreateSchema.parse(data);
}

/**
 * Validates an impersonation log object
 * @throws {z.ZodError} if validation fails
 */
export function validateImpersonationLog(data: unknown): ImpersonationLogType {
    return ImpersonationLogSchema.parse(data);
}

/**
 * Validates impersonation start input
 * @throws {z.ZodError} if validation fails
 */
export function validateImpersonationStart(data: unknown): ImpersonationStartInput {
    return ImpersonationStartSchema.parse(data);
}

/**
 * Validates impersonation end input
 * @throws {z.ZodError} if validation fails
 */
export function validateImpersonationEnd(data: unknown): ImpersonationEndInput {
    return ImpersonationEndSchema.parse(data);
}

/**
 * Validates a tenant statistic object
 * @throws {z.ZodError} if validation fails
 */
export function validateTenantStatistic(data: unknown): TenantStatisticType {
    return TenantStatisticSchema.parse(data);
}

/**
 * Validates tenant statistic create input
 * @throws {z.ZodError} if validation fails
 */
export function validateTenantStatisticCreate(data: unknown): TenantStatisticCreateInput {
    return TenantStatisticCreateSchema.parse(data);
}

/**
 * Validates a tenant config override object
 * @throws {z.ZodError} if validation fails
 */
export function validateTenantConfigOverride(data: unknown): TenantConfigOverrideType {
    return TenantConfigOverrideSchema.parse(data);
}

/**
 * Validates tenant config override create input
 * @throws {z.ZodError} if validation fails
 */
export function validateTenantConfigOverrideCreate(
    data: unknown
): TenantConfigOverrideCreateInput {
    return TenantConfigOverrideCreateSchema.parse(data);
}

/**
 * Validates tenant config override update input
 * @throws {z.ZodError} if validation fails
 */
export function validateTenantConfigOverrideUpdate(
    data: unknown
): TenantConfigOverrideUpdateInput {
    return TenantConfigOverrideUpdateSchema.parse(data);
}

/**
 * Validates tenant access (alias for backward compatibility)
 * @throws {z.ZodError} if validation fails
 */
export function validateTenantAccess(data: unknown): SuperUserTenantAccessCreateInput {
    return validateSuperUserTenantAccessCreate(data);
}

/**
 * Validates config override (alias for backward compatibility)
 * @throws {z.ZodError} if validation fails
 */
export function validateConfigOverride(data: unknown): TenantConfigOverrideCreateInput {
    return validateTenantConfigOverrideCreate(data);
}

/**
 * =====================================================
 * ROLE REQUEST TYPES
 * =====================================================
 */

/**
 * Role Request Status enum
 */
export const RoleRequestStatusEnum = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
} as const;

export type RoleRequestStatus = typeof RoleRequestStatusEnum[keyof typeof RoleRequestStatusEnum];

/**
 * Role Request Type
 * Represents a request for role elevation from a regular user
 */
export interface RoleRequestType {
    /** UUID primary key */
    id: string;
    
    /** User requesting the role (FK to users) */
    userId: string;
    
    /** Role being requested */
    requestedRole: 'admin' | 'manager' | 'super_admin';
    
    /** Reason for role request (max 1000 chars) */
    reason: string;
    
    /** Current status: pending, approved, rejected, cancelled */
    status: RoleRequestStatus;
    
    /** Tenant context (FK to tenants, null for platform-wide requests) */
    tenantId?: string | null;
    
    /** Super user who reviewed/approved/rejected (FK to users, optional) */
    reviewedBy?: string | null;
    
    /** Review comments (optional, max 1000 chars) */
    reviewComments?: string | null;
    
    /** When the request was created */
    createdAt: string;
    
    /** When the request was last updated */
    updatedAt: string;
    
    /** When the request was reviewed (null if pending) */
    reviewedAt?: string | null;
    
    /** When the role expires (optional, for temporary elevations) */
    expiresAt?: string | null;
}

/**
 * Role Request Create Input
 */
export interface RoleRequestCreateInput {
    /** User ID requesting the role */
    userId: string;
    
    /** Role being requested */
    requestedRole: 'admin' | 'manager' | 'super_admin';
    
    /** Reason for request */
    reason: string;
    
    /** Tenant context (optional) */
    tenantId?: string | null;
}

/**
 * Role Request Review Input (for approval/rejection)
 */
export interface RoleRequestReviewInput {
    /** Review decision: approved or rejected */
    status: 'approved' | 'rejected';
    
    /** Review comments */
    reviewComments?: string;
    
    /** Role expiration time (optional, for temporary elevations) */
    expiresAt?: string | null;
}

/**
 * Zod Schema for Role Request
 */
export const RoleRequestSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    requestedRole: z.enum(['admin', 'manager', 'super_admin']),
    reason: z.string().max(1000),
    status: z.enum(['pending', 'approved', 'rejected', 'cancelled']),
    tenantId: z.string().uuid().nullable().optional(),
    reviewedBy: z.string().uuid().nullable().optional(),
    reviewComments: z.string().max(1000).nullable().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    reviewedAt: z.string().datetime().nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
});

/**
 * Zod Schema for Role Request Create Input
 */
export const RoleRequestCreateSchema = z.object({
    userId: z.string().uuid(),
    requestedRole: z.enum(['admin', 'manager', 'super_admin']),
    reason: z.string().min(10).max(1000),
    tenantId: z.string().uuid().nullable().optional(),
});

/**
 * Zod Schema for Role Request Review Input
 */
export const RoleRequestReviewSchema = z.object({
    status: z.enum(['approved', 'rejected']),
    reviewComments: z.string().max(1000).optional(),
    expiresAt: z.string().datetime().nullable().optional(),
});

/**
 * Validates a role request
 * @throws {z.ZodError} if validation fails
 */
export function validateRoleRequest(data: unknown): RoleRequestType {
    return RoleRequestSchema.parse(data);
}

/**
 * Validates role request create input
 * @throws {z.ZodError} if validation fails
 */
export function validateRoleRequestCreate(data: unknown): RoleRequestCreateInput {
    return RoleRequestCreateSchema.parse(data);
}

/**
 * Validates role request review input
 * @throws {z.ZodError} if validation fails
 */
export function validateRoleRequestReview(data: unknown): RoleRequestReviewInput {
    return RoleRequestReviewSchema.parse(data);
}

/**
 * =====================================================
 * RATE LIMITING TYPES (Task 6.1)
 * =====================================================
 */

/**
 * Rate limiting configuration for impersonation sessions
 * Enforces limits on impersonation abuse
 */
export interface ImpersonationRateLimitConfigType {
  /** UUID primary key */
  id: string;
  
  /** Max impersonations per hour per super admin */
  maxImpersonationsPerHour: number;
  
  /** Max concurrent impersonation sessions per super admin */
  maxConcurrentSessions: number;
  
  /** Max session duration in minutes */
  maxSessionDurationMinutes: number;
  
  /** Whether rate limiting is enabled */
  enabled: boolean;
  
  /** Timestamp when created */
  createdAt: string;
  
  /** Timestamp when last updated */
  updatedAt: string;
}

/**
 * Rate limit status for a super admin
 * Shows current usage against limits
 */
export interface ImpersonationRateLimitStatusType {
  /** Super admin user ID */
  superAdminId: string;
  
  /** Current impersonations in last hour */
  impersonationsThisHour: number;
  
  /** Current concurrent sessions */
  concurrentSessionCount: number;
  
  /** Current longest session duration in seconds */
  longestSessionDurationSeconds: number;
  
  /** Rate limit config ID being used */
  configId: string;
  
  /** Whether super admin is rate limited */
  isRateLimited: boolean;
  
  /** Reason if rate limited (empty if not) */
  rateLimitReason?: string;
  
  /** When rate limit will be reset (ISO 8601 timestamp) */
  resetAt?: string;
  
  /** Timestamp of status check */
  checkedAt: string;
}

/**
 * Rate limit check result
 * Returned when checking if impersonation is allowed
 */
export interface ImpersonationRateLimitCheckResult {
  /** Whether impersonation is allowed */
  allowed: boolean;
  
  /** Reason if denied (empty if allowed) */
  reason?: string;
  
  /** Current usage statistics */
  currentUsage: {
    impersonationsThisHour: number;
    concurrentSessions: number;
    longestSessionMinutes: number;
  };
  
  /** Configured limits */
  limits: {
    maxPerHour: number;
    maxConcurrent: number;
    maxDurationMinutes: number;
  };
  
  /** Remaining capacity before rate limit hit */
  remainingCapacity: {
    impersonations: number;
    concurrentSlots: number;
  };
}

/**
 * Input for creating/updating rate limit configuration
 */
export interface ImpersonationRateLimitConfigCreateInput {
  /** Max impersonations per hour per super admin (default: 10) */
  maxImpersonationsPerHour: number;
  
  /** Max concurrent impersonation sessions (default: 5) */
  maxConcurrentSessions: number;
  
  /** Max session duration in minutes (default: 30) */
  maxSessionDurationMinutes: number;
  
  /** Enable or disable rate limiting */
  enabled?: boolean;
}

/**
 * Zod Schema for Rate Limit Config
 */
export const ImpersonationRateLimitConfigSchema = z.object({
  id: z.string().uuid(),
  maxImpersonationsPerHour: z.number().int().min(1).max(1000),
  maxConcurrentSessions: z.number().int().min(1).max(100),
  maxSessionDurationMinutes: z.number().int().min(1).max(1440),
  enabled: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Zod Schema for Rate Limit Check Result
 */
export const ImpersonationRateLimitCheckResultSchema = z.object({
  allowed: z.boolean(),
  reason: z.string().optional(),
  currentUsage: z.object({
    impersonationsThisHour: z.number().int().nonnegative(),
    concurrentSessions: z.number().int().nonnegative(),
    longestSessionMinutes: z.number().int().nonnegative(),
  }),
  limits: z.object({
    maxPerHour: z.number().int().positive(),
    maxConcurrent: z.number().int().positive(),
    maxDurationMinutes: z.number().int().positive(),
  }),
  remainingCapacity: z.object({
    impersonations: z.number().int().nonnegative(),
    concurrentSlots: z.number().int().nonnegative(),
  }),
});

/**
 * Validates rate limit config
 * @throws {z.ZodError} if validation fails
 */
export function validateRateLimitConfig(
  data: unknown
): ImpersonationRateLimitConfigType {
  return ImpersonationRateLimitConfigSchema.parse(data);
}

/**
 * Validates rate limit check result
 * @throws {z.ZodError} if validation fails
 */
export function validateRateLimitCheckResult(
  data: unknown
): ImpersonationRateLimitCheckResult {
  return ImpersonationRateLimitCheckResultSchema.parse(data);
}

/**
 * =====================================================
 * EXPORT SUMMARY
 * =====================================================
 * 
 * Entity Types:
 * - SuperUserTenantAccessType
 * - ImpersonationLogType
 * - TenantStatisticType
 * - TenantConfigOverrideType
 * - ImpersonationRateLimitConfigType (NEW)
 * - ImpersonationRateLimitStatusType (NEW)
 * - ImpersonationRateLimitCheckResult (NEW)
 * 
 * Input Types:
 * - SuperUserTenantAccessCreateInput
 * - SuperUserTenantAccessUpdateInput
 * - ImpersonationStartInput
 * - ImpersonationEndInput
 * - TenantStatisticCreateInput
 * - TenantConfigOverrideCreateInput
 * - TenantConfigOverrideUpdateInput
 * - ImpersonationRateLimitConfigCreateInput (NEW)
 * 
 * Enums:
 * - AccessLevel
 * - MetricType
 * 
 * Schemas:
 * - *Schema (Zod validation objects)
 * 
 * Functions:
 * - validate* (Validation helper functions)
 */