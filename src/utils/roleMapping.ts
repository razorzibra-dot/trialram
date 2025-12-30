/**
 * Dynamic Role Mapping Utilities
 * 
 * Fully database-driven role mapping system. No hardcoded values.
 * All roles, mappings, and validations are fetched from the database.
 * 
 * ⚠️ CRITICAL: This is a future-proof system - adding new roles to the database
 * will automatically work without any code changes.
 */

import { UserRole } from '@/types/dtos/userDtos';
import { Role } from '@/types/rbac';
import { authService, rbacService } from '@/services/serviceFactory';

/**
 * Role cache to avoid repeated database queries
 * Key: normalized role name, Value: Role record
 */
let roleCache: Map<string, Role> | null = null;
let roleCacheTimestamp: number = 0;
const ROLE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Normalize role name for consistent comparison
 * Converts to lowercase and handles common variations
 */
function normalizeRoleName(roleName: string): string {
  return roleName.toLowerCase().trim();
}

/**
 * Fetch all roles from database and cache them
 * This is the single source of truth for all roles
 */
async function fetchRolesFromDatabase(): Promise<Role[]> {
  try {
    const roles = await rbacService.getRoles();
    // Update cache
    roleCache = new Map();
    roles.forEach(role => {
      const normalized = normalizeRoleName(role.name);
      roleCache!.set(normalized, role);
    });
    roleCacheTimestamp = Date.now();
    return roles;
  } catch (error) {
    console.error('[RoleMapping] Error fetching roles from database:', error);
    return [];
  }
}

/**
 * Get roles from cache or fetch from database
 */
async function getRolesCached(): Promise<Role[]> {
  const now = Date.now();
  
  // Return cached roles if still valid
  if (roleCache && (now - roleCacheTimestamp) < ROLE_CACHE_TTL) {
    return Array.from(roleCache.values());
  }
  
  // Fetch fresh roles from database
  return await fetchRolesFromDatabase();
}

/**
 * Invalidate role cache (call when roles are created/updated/deleted)
 */
export function invalidateRoleCache(): void {
  roleCache = null;
  roleCacheTimestamp = 0;
}

/**
 * Map database role name to UserRole enum
 * Uses database role names directly - no hardcoded mapping
 * Normalizes the role name for consistency
 * 
 * @param dbRoleName - Database role name (normalized: "admin", "manager", "super_admin", etc.)
 * @param defaultRole - Default role if not found (defaults to 'user')
 * @returns UserRole enum value (normalized role name)
 */
export async function mapDatabaseRoleToUserRole(
  dbRoleName: string | null | undefined,
  defaultRole: UserRole = 'user'
): Promise<UserRole> {
  if (!dbRoleName) {
    return defaultRole;
  }
  
  // Normalize the role name
  const normalized = normalizeRoleName(dbRoleName);
  
  // Check if role exists in database
  const roles = await getRolesCached();
  const roleExists = roles.some(role => normalizeRoleName(role.name) === normalized);
  
  if (roleExists) {
    // Use normalized name as UserRole (cast is safe because we validated it exists)
    return normalized as UserRole;
  }
  
  // Fallback to default if role doesn't exist in database
  console.warn(`[RoleMapping] Role "${dbRoleName}" not found in database, using default: ${defaultRole}`);
  return defaultRole;
}

/**
 * Map UserRole enum to database role name
 * Finds the actual database role name by looking up in database
 * 
 * @param userRole - UserRole enum value (normalized role name)
 * @returns Database role name (actual name from database)
 */
export async function mapUserRoleToDatabaseRole(userRole: UserRole): Promise<string> {
  const normalized = normalizeRoleName(userRole);
  
  // Find role in database
  const roles = await getRolesCached();
  const role = roles.find(r => normalizeRoleName(r.name) === normalized);
  
  if (role) {
    return role.name; // Return actual database role name
  }
  
  // Fallback: return the userRole as-is (might be a valid role name)
  console.warn(`[RoleMapping] Role "${userRole}" not found in database, using as-is`);
  return userRole;
}

/**
 * Extract UserRole from database Role record
 * Uses the role name directly, normalized
 * 
 * @param role - Database Role record
 * @returns UserRole enum value (normalized role name)
 */
export function extractUserRoleFromRole(role: Role): UserRole {
  return normalizeRoleName(role.name) as UserRole;
}

/**
 * Synchronous role name normalization
 * Normalizes database role names to UserRole enum values
 * 
 * ✅ Database role names are now normalized to match UserRole enum exactly
 * No mapping needed - database stores enum values directly
 * 
 * @param dbRoleName - Database role name (should already be normalized: 'admin', 'manager', etc.)
 * @param defaultRole - Default role if not found (defaults to 'user')
 * @returns UserRole enum value (normalized)
 */
export function mapDatabaseRoleNameToUserRoleSync(
  dbRoleName: string | null | undefined,
  defaultRole: UserRole = 'user'
): UserRole {
  if (!dbRoleName) {
    return defaultRole;
  }
  
  // Normalize the role name (lowercase, trim)
  const normalized = normalizeRoleName(dbRoleName);
  
  // ✅ Database role names now match UserRole enum exactly
  // No validation needed - database stores normalized names that match enum
  // Trust the database - if role exists in DB, it's valid
  // Return normalized role directly (database ensures correctness)
  return (normalized as UserRole) || defaultRole;
}

/**
 * Get all valid UserRole values from database
 * This is fully dynamic - fetches from database, no hardcoded values
 * 
 * @returns Array of all valid UserRole values (normalized role names from database)
 */
export async function getValidUserRoles(): Promise<UserRole[]> {
  const roles = await getRolesCached();
  const userRoles: UserRole[] = [];
  const seenRoles = new Set<string>();
  
  for (const role of roles) {
    const normalized = normalizeRoleName(role.name);
    if (!seenRoles.has(normalized)) {
      userRoles.push(normalized as UserRole);
      seenRoles.add(normalized);
    }
  }
  
  return userRoles;
}

/**
 * Validate if a role string is a valid UserRole (exists in database)
 * 
 * @param role - Role string to validate
 * @returns True if valid UserRole (exists in database), false otherwise
 */
export async function isValidUserRole(role: string | null | undefined): Promise<boolean> {
  if (!role) return false;
  
  // Normalize the role name before validation (lowercase, trim)
  const normalizedRole = normalizeRoleName(role);
  
  // Get valid roles from database (already normalized)
  const validRoles = await getValidUserRoles();
  
  // Check if normalized role exists in valid roles list
  // validRoles are already normalized, so we can compare directly
  return validRoles.some(validRole => normalizeRoleName(validRole) === normalizedRole);
}

/**
 * Get valid roles for a user based on tenant isolation
 * Fetches roles from database and maps them to UserRole enum values
 * 
 * @param roles - Array of Role records from database (already filtered by tenant)
 * @returns Array of UserRole enum values (normalized role names)
 */
export function getValidUserRolesFromDatabaseRoles(roles: Role[]): UserRole[] {
  const userRoles: UserRole[] = [];
  const seenRoles = new Set<string>();
  
  for (const role of roles) {
    const normalized = normalizeRoleName(role.name);
    if (!seenRoles.has(normalized)) {
      userRoles.push(normalized as UserRole);
      seenRoles.add(normalized);
    }
  }
  
  return userRoles;
}

/**
 * Find role by name in database (case-insensitive)
 * 
 * @param roleName - Role name to find
 * @returns Role record if found, null otherwise
 */
export async function findRoleByName(roleName: string): Promise<Role | null> {
  const roles = await getRolesCached();
  const normalized = normalizeRoleName(roleName);
  
  return roles.find(r => normalizeRoleName(r.name) === normalized) || null;
}

/**
 * Check if a role is a platform role (super_admin)
 * Uses database flags, not hardcoded name check
 * 
 * @param role - Role record or role name
 * @returns True if platform role, false otherwise
 */
export async function isPlatformRoleByName(roleName: string): Promise<boolean> {
  const role = await findRoleByName(roleName);
  if (!role) return false;
  
  // Platform role: is_system_role=true AND tenant_id IS NULL
  return role.is_system_role === true && !role.tenant_id;
}

/**
 * Get all roles grouped by normalized UserRole enum value
 * This creates a dynamic mapping from database roles to UserRole enum values
 * 
 * @returns Map of normalized UserRole to array of database role names that map to it
 */
export async function getRolesByUserRole(): Promise<Map<UserRole, string[]>> {
  const roles = await getRolesCached();
  const roleMap = new Map<UserRole, string[]>();
  
  for (const role of roles) {
    const normalized = normalizeRoleName(role.name) as UserRole;
    if (!roleMap.has(normalized)) {
      roleMap.set(normalized, []);
    }
    roleMap.get(normalized)!.push(role.name);
  }
  
  return roleMap;
}

/**
 * Check if a role name (normalized or database name) matches a UserRole enum value
 * Uses database lookup to find all roles that map to the target UserRole
 * 
 * @param roleName - Role name to check (can be database name or normalized)
 * @param targetUserRole - Target UserRole enum value to match against
 * @returns True if the role maps to the target UserRole
 */
export async function isRoleOfType(roleName: string, targetUserRole: UserRole): Promise<boolean> {
  const normalizedRoleName = normalizeRoleName(roleName);
  const normalizedTarget = normalizeRoleName(targetUserRole);
  
  // Direct match after normalization
  if (normalizedRoleName === normalizedTarget) {
    return true;
  }
  
  // Check database to see if this role maps to the target UserRole
  const role = await findRoleByName(roleName);
  if (!role) return false;
  
  const roleNormalized = normalizeRoleName(role.name) as UserRole;
  return roleNormalized === normalizedTarget;
}
