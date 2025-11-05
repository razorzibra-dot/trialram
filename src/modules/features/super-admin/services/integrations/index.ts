/**
 * Super User Module Integration Layer Index
 * 
 * Coordinates all integrations with dependent modules:
 * ✅ User Management Module Integration
 * ✅ RBAC Module Integration  
 * ✅ Tenant Management Module Integration
 * ✅ Audit Logging Module Integration
 * 
 * This index file exports all integration functions and checks
 * for use throughout the super user module.
 */

// User Management Integration
export {
  validateUserForSuperUserAssignment,
  verifyUserActiveStatus,
  enrichSuperUserWithUserData,
  validateSuperUserCreation,
  handleUserDeactivation,
  handleUserDeletion,
  integrationChecks as userManagementChecks,
} from './userManagementIntegration';

// RBAC Integration
export {
  SUPER_USER_PERMISSIONS,
  SUPER_USER_ROLE_TEMPLATES,
  initializeSuperUserPermissions,
  createSuperUserRoleTemplates,
  validatePermission,
  validatePermissions,
  getSuperUserPermissions,
  logPermissionEnforcement,
  integrationChecks as rbacIntegrationChecks,
} from './rbacIntegration';

export type { SuperUserPermission } from './rbacIntegration';

// Tenant Management Integration
export {
  getAllTenantsForSuperUser,
  getTenantMetadata,
  verifySuperUserTenantAccess,
  getTenantStatisticsForDashboard,
  updateTenantConfiguration,
  getTenantHealthStatus,
  verifyRLSPolicies,
  integrationChecks as tenantManagementChecks,
} from './tenantManagementIntegration';

export type { TenantMetadata } from './tenantManagementIntegration';

// Audit Logging Integration
export {
  SuperUserAuditAction,
  logSuperUserAction,
  logSuperUserCreation,
  logSuperUserUpdate,
  logSuperUserDeletion,
  logTenantAccessGrant,
  logTenantAccessRevocation,
  logImpersonationStart,
  logImpersonationAction,
  logImpersonationEnd,
  logConfigOverride,
  logConfigOverrideDeletion,
  getAuditLogs,
  getImpersonationLogs,
  integrationChecks as auditLoggingChecks,
} from './auditLoggingIntegration';

export type {
  SuperUserAuditLog,
  ImpersonationAuditLog,
} from './auditLoggingIntegration';

/**
 * Run all integration verification checks
 * Use this during module initialization to verify all dependencies are properly configured
 */
export async function runAllIntegrationChecks(): Promise<{
  userManagement: any;
  rbac: any;
  tenantManagement: any;
  auditLogging: any;
  overallStatus: 'healthy' | 'warning' | 'error';
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    const userManagement = await userManagementChecks.testIntegration();
    const rbac = await rbacIntegrationChecks.verifyPermissionsConfigured();
    const tenantManagement = await tenantManagementChecks.verifyTenantServiceAccessibility();
    const auditLogging = await auditLoggingChecks.verifyAuditLoggingFunctional();

    const allHealthy =
      userManagement.success &&
      rbac.isValid &&
      tenantManagement.isAccessible &&
      auditLogging.isValid;

    return {
      userManagement,
      rbac,
      tenantManagement,
      auditLogging,
      overallStatus: allHealthy ? 'healthy' : 'warning',
      errors,
    };
  } catch (error) {
    errors.push(
      `Failed to run integration checks: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return {
      userManagement: null,
      rbac: null,
      tenantManagement: null,
      auditLogging: null,
      overallStatus: 'error',
      errors,
    };
  }
}

/**
 * Initialize all integrations
 * Call this during module startup
 */
export async function initializeAllIntegrations(): Promise<{
  permissionsInitialized: boolean;
  roleTemplatesCreated: boolean;
  integrationChecksRun: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    // Initialize RBAC permissions
    const permResult = await initializeSuperUserPermissions();
    if (!permResult.success) {
      errors.push(...permResult.errors);
    }

    // Create RBAC role templates
    const roleResult = await createSuperUserRoleTemplates();
    if (!roleResult.success) {
      errors.push(...roleResult.errors);
    }

    // Run integration checks
    const checks = await runAllIntegrationChecks();
    if (checks.overallStatus === 'error') {
      errors.push(...checks.errors);
    }

    return {
      permissionsInitialized: permResult.success,
      roleTemplatesCreated: roleResult.success,
      integrationChecksRun: checks.overallStatus !== 'error',
      errors,
    };
  } catch (error) {
    errors.push(
      `Failed to initialize integrations: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return {
      permissionsInitialized: false,
      roleTemplatesCreated: false,
      integrationChecksRun: false,
      errors,
    };
  }
}

// Phase 16 Verification
export {
  verifyUserManagementSync,
  verifyRbacSync,
  verifyTenantSync,
  verifyAuditSync,
  runPhase16Verification,
} from './verifyIntegrations';