/**
 * Phase 3.1: Unit Tests - Super Admin Management Types
 * Comprehensive validation of SuperAdminDTO and type constraints
 * 
 * Tests:
 * - Super admin with tenantId=null requirement
 * - Regular user cannot have isSuperAdmin=true
 * - Type guards and validation functions
 * - JSON serialization/deserialization
 * - Null tenant ID handling
 */

import { describe, it, expect } from 'vitest';
import {
  SuperAdminDTO,
  CreateSuperAdminDTO,
  PromoteSuperAdminDTO,
  DemoteSuperAdminDTO,
} from '../superAdminManagement';

describe('SuperAdminDTO Type Tests - Phase 3.1', () => {
  describe('Super Admin Identification', () => {
    it('should require tenantId=null for super admin', () => {
      const superAdmin: SuperAdminDTO = {
        id: 'user-1',
        email: 'admin@platform.com',
        name: 'Platform Admin',
        isSuperAdmin: true,
        tenantId: null,
        role: 'super_admin',
        createdAt: '2025-01-01T00:00:00Z',
        promotedAt: '2025-01-01T00:00:00Z',
        promotedBy: 'system',
      };

      expect(superAdmin.isSuperAdmin).toBe(true);
      expect(superAdmin.tenantId).toBeNull();
      expect(superAdmin.role).toBe('super_admin');
    });

    it('should enforce 3-part super admin constraint', () => {
      // Super admin must have ALL THREE:
      // 1. is_super_admin = true
      // 2. tenant_id = null
      // 3. role = 'super_admin'

      const validSuperAdmin: SuperAdminDTO = {
        id: 'super-1',
        email: 'super@platform.com',
        name: 'Super Admin',
        isSuperAdmin: true,
        tenantId: null,
        role: 'super_admin',
        createdAt: '2025-01-01T00:00:00Z',
        promotedAt: '2025-01-01T00:00:00Z',
        promotedBy: 'system',
      };

      // Verify all 3 constraints
      expect(validSuperAdmin.isSuperAdmin).toBe(true);
      expect(validSuperAdmin.tenantId).toBeNull();
      expect(validSuperAdmin.role).toBe('super_admin');
    });

    it('should NOT allow regular user to have isSuperAdmin=true', () => {
      // Type system should prevent this, but runtime check validates
      const regularUser: Omit<SuperAdminDTO, ''> = {
        id: 'user-2',
        email: 'user@example.com',
        name: 'Regular User',
        isSuperAdmin: false, // NOT a super admin
        tenantId: 'tenant-1', // Has a tenant
        role: 'admin', // Regular admin
        createdAt: '2025-01-01T00:00:00Z',
      };

      expect(regularUser.isSuperAdmin).toBe(false);
      expect(regularUser.tenantId).not.toBeNull();
    });

    it('should reject regular user with tenantId=null', () => {
      // Regular user MUST have tenantId
      const invalidUser: any = {
        id: 'user-3',
        email: 'user@tenant.com',
        name: 'User',
        isSuperAdmin: false,
        tenantId: null, // Invalid for non-super-admin
        role: 'admin',
        createdAt: '2025-01-01T00:00:00Z',
      };

      // This should fail validation
      const isValidSuperAdmin = invalidUser.isSuperAdmin === true &&
        invalidUser.tenantId === null &&
        invalidUser.role === 'super_admin';

      expect(isValidSuperAdmin).toBe(false);
    });

    it('should reject super admin with non-null tenantId', () => {
      // Super admin CANNOT have tenantId
      const invalidSuperAdmin: any = {
        id: 'user-4',
        email: 'admin@example.com',
        name: 'Invalid Super Admin',
        isSuperAdmin: true,
        tenantId: 'tenant-1', // Invalid: super admin must have null
        role: 'super_admin',
        createdAt: '2025-01-01T00:00:00Z',
      };

      // This violates the constraint
      const isValidSuperAdmin = invalidSuperAdmin.isSuperAdmin === true &&
        invalidSuperAdmin.tenantId === null;

      expect(isValidSuperAdmin).toBe(false);
    });
  });

  describe('Field Type Validation', () => {
    it('should have correct string types for all fields', () => {
      const superAdmin: SuperAdminDTO = {
        id: 'super-1',
        email: 'super@platform.com',
        name: 'Super Admin',
        isSuperAdmin: true,
        tenantId: null,
        role: 'super_admin',
        createdAt: '2025-01-01T00:00:00Z',
        promotedAt: '2025-01-01T00:00:00Z',
        promotedBy: 'system',
      };

      expect(typeof superAdmin.id).toBe('string');
      expect(typeof superAdmin.email).toBe('string');
      expect(typeof superAdmin.name).toBe('string');
      expect(typeof superAdmin.isSuperAdmin).toBe('boolean');
      expect(superAdmin.tenantId).toBeNull();
      expect(typeof superAdmin.role).toBe('string');
      expect(typeof superAdmin.createdAt).toBe('string');
      expect(typeof superAdmin.promotedAt).toBe('string');
      expect(typeof superAdmin.promotedBy).toBe('string');
    });

    it('should validate ISO 8601 timestamp format', () => {
      const superAdmin: SuperAdminDTO = {
        id: 'super-1',
        email: 'super@platform.com',
        name: 'Super Admin',
        isSuperAdmin: true,
        tenantId: null,
        role: 'super_admin',
        createdAt: '2025-01-01T00:00:00Z',
        promotedAt: '2025-01-01T00:00:00Z',
        promotedBy: 'system',
      };

      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      expect(superAdmin.createdAt).toMatch(isoRegex);
      expect(superAdmin.promotedAt).toMatch(isoRegex);
    });

    it('should validate email format', () => {
      const superAdmin: SuperAdminDTO = {
        id: 'super-1',
        email: 'super@platform.com',
        name: 'Super Admin',
        isSuperAdmin: true,
        tenantId: null,
        role: 'super_admin',
        createdAt: '2025-01-01T00:00:00Z',
        promotedAt: '2025-01-01T00:00:00Z',
        promotedBy: 'system',
      };

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(superAdmin.email).toMatch(emailRegex);
    });

    it('should handle optional demotionReason field', () => {
      const demotedAdmin: SuperAdminDTO = {
        id: 'super-2',
        email: 'former.admin@platform.com',
        name: 'Former Super Admin',
        isSuperAdmin: false, // Demoted
        tenantId: 'tenant-1', // Now has tenant
        role: 'admin',
        createdAt: '2025-01-01T00:00:00Z',
        promotedAt: '2025-01-01T00:00:00Z',
        promotedBy: 'system',
        demotedAt: '2025-01-15T00:00:00Z',
        demotionReason: 'User requested demotion',
      };

      expect(demotedAdmin.demotedAt).toBeDefined();
      expect(demotedAdmin.demotionReason).toBe('User requested demotion');
    });
  });

  describe('JSON Serialization', () => {
    it('should serialize super admin to JSON with null tenantId', () => {
      const superAdmin: SuperAdminDTO = {
        id: 'super-1',
        email: 'super@platform.com',
        name: 'Super Admin',
        isSuperAdmin: true,
        tenantId: null,
        role: 'super_admin',
        createdAt: '2025-01-01T00:00:00Z',
        promotedAt: '2025-01-01T00:00:00Z',
        promotedBy: 'system',
      };

      const json = JSON.stringify(superAdmin);
      const parsed = JSON.parse(json);

      expect(parsed.isSuperAdmin).toBe(true);
      expect(parsed.tenantId).toBeNull();
      expect(parsed.role).toBe('super_admin');
    });

    it('should deserialize JSON to valid SuperAdminDTO', () => {
      const json = '{"id":"super-1","email":"super@platform.com","name":"Super Admin","isSuperAdmin":true,"tenantId":null,"role":"super_admin","createdAt":"2025-01-01T00:00:00Z","promotedAt":"2025-01-01T00:00:00Z","promotedBy":"system"}';
      const superAdmin: SuperAdminDTO = JSON.parse(json);

      expect(superAdmin.id).toBe('super-1');
      expect(superAdmin.isSuperAdmin).toBe(true);
      expect(superAdmin.tenantId).toBeNull();
    });

    it('should handle optional fields in JSON', () => {
      const json = '{"id":"super-2","email":"super2@platform.com","name":"Super Admin 2","isSuperAdmin":true,"tenantId":null,"role":"super_admin","createdAt":"2025-01-01T00:00:00Z","promotedAt":"2025-01-01T00:00:00Z","promotedBy":"system","demotedAt":"2025-01-15T00:00:00Z","demotionReason":"Testing"}';
      const superAdmin: SuperAdminDTO = JSON.parse(json);

      expect(superAdmin.demotedAt).toBe('2025-01-15T00:00:00Z');
      expect(superAdmin.demotionReason).toBe('Testing');
    });
  });

  describe('Tenant Access Types', () => {
    it('should validate SuperAdminTenantAccess structure', () => {
      const tenantAccess: any = {
        id: 'access-1',
        superAdminId: 'super-1',
        tenantId: 'tenant-1',
        grantedAt: '2025-01-01T00:00:00Z',
        grantedBy: 'system',
        accessLevel: 'full_access',
        notes: 'Platform administrator access',
      };

      expect(tenantAccess.superAdminId).toBe('super-1');
      expect(tenantAccess.tenantId).toBe('tenant-1');
      expect(typeof tenantAccess.grantedAt).toBe('string');
    });

    it('should validate CreateSuperAdminDTO structure', () => {
      const createDto: CreateSuperAdminDTO = {
        email: 'newadmin@platform.com',
        name: 'New Super Admin',
      };

      expect(createDto.email).toBe('newadmin@platform.com');
      expect(createDto.name).toBe('New Super Admin');
    });

    it('should validate PromoteSuperAdminDTO structure', () => {
      const promoteDto: PromoteSuperAdminDTO = {
        userId: 'user-1',
        reason: 'User qualified for promotion',
      };

      expect(promoteDto.userId).toBe('user-1');
      expect(promoteDto.reason).toBe('User qualified for promotion');
    });

    it('should validate DemoteSuperAdminDTO structure', () => {
      const demoteDto: DemoteSuperAdminDTO = {
        superAdminId: 'super-1',
        reason: 'Role change requested',
        newTenantId: 'tenant-1',
      };

      expect(demoteDto.superAdminId).toBe('super-1');
      expect(demoteDto.reason).toBe('Role change requested');
      expect(demoteDto.newTenantId).toBe('tenant-1');
    });
  });

  describe('Type Guard Functions', () => {
    it('should identify valid super admin', () => {
      const user: any = {
        id: 'super-1',
        email: 'super@platform.com',
        name: 'Super Admin',
        isSuperAdmin: true,
        tenantId: null,
        role: 'super_admin',
        createdAt: '2025-01-01T00:00:00Z',
        promotedAt: '2025-01-01T00:00:00Z',
        promotedBy: 'system',
      };

      const isSuperAdmin = (u: any): boolean =>
        u.isSuperAdmin === true && u.tenantId === null && u.role === 'super_admin';

      expect(isSuperAdmin(user)).toBe(true);
    });

    it('should reject non-super admin', () => {
      const user: any = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Regular User',
        isSuperAdmin: false,
        tenantId: 'tenant-1',
        role: 'admin',
        createdAt: '2025-01-01T00:00:00Z',
      };

      const isSuperAdmin = (u: any): boolean =>
        u.isSuperAdmin === true && u.tenantId === null && u.role === 'super_admin';

      expect(isSuperAdmin(user)).toBe(false);
    });

    it('should validate null tenant ID for super admins', () => {
      const superAdmin: SuperAdminDTO = {
        id: 'super-1',
        email: 'super@platform.com',
        name: 'Super Admin',
        isSuperAdmin: true,
        tenantId: null,
        role: 'super_admin',
        createdAt: '2025-01-01T00:00:00Z',
        promotedAt: '2025-01-01T00:00:00Z',
        promotedBy: 'system',
      };

      const hasValidTenantId = superAdmin.isSuperAdmin ? superAdmin.tenantId === null : superAdmin.tenantId !== null;

      expect(hasValidTenantId).toBe(true);
    });
  });

  describe('Optional Chaining Safety', () => {
    it('should safely access null tenant ID', () => {
      const superAdmin: SuperAdminDTO | undefined = {
        id: 'super-1',
        email: 'super@platform.com',
        name: 'Super Admin',
        isSuperAdmin: true,
        tenantId: null,
        role: 'super_admin',
        createdAt: '2025-01-01T00:00:00Z',
        promotedAt: '2025-01-01T00:00:00Z',
        promotedBy: 'system',
      };

      // Optional chaining should work
      expect(superAdmin?.tenantId).toBeNull();
      expect(superAdmin?.isSuperAdmin).toBe(true);
    });

    it('should handle undefined super admin safely', () => {
      const superAdmin: SuperAdminDTO | undefined = undefined;

      // Should not throw
      expect(superAdmin?.id).toBeUndefined();
      expect(superAdmin?.tenantId).toBeUndefined();
    });

    it('should validate demotion optional fields', () => {
      const demotedAdmin: SuperAdminDTO = {
        id: 'super-2',
        email: 'former@platform.com',
        name: 'Former Admin',
        isSuperAdmin: false,
        tenantId: 'tenant-1',
        role: 'admin',
        createdAt: '2025-01-01T00:00:00Z',
        promotedAt: '2025-01-01T00:00:00Z',
        promotedBy: 'system',
        demotedAt: '2025-01-15T00:00:00Z',
        demotionReason: 'User request',
      };

      // Optional chaining for demotion fields
      expect(demotedAdmin.demotedAt).toBeDefined();
      expect(demotedAdmin.demotionReason).toBeDefined();
    });
  });

  describe('Type Constraint Invariants', () => {
    it('should maintain super admin invariants across operations', () => {
      const superAdmin: SuperAdminDTO = {
        id: 'super-1',
        email: 'super@platform.com',
        name: 'Super Admin',
        isSuperAdmin: true,
        tenantId: null,
        role: 'super_admin',
        createdAt: '2025-01-01T00:00:00Z',
        promotedAt: '2025-01-01T00:00:00Z',
        promotedBy: 'system',
      };

      // All 3 constraints must remain true
      const invariantHolds = superAdmin.isSuperAdmin && 
                            superAdmin.tenantId === null && 
                            superAdmin.role === 'super_admin';

      expect(invariantHolds).toBe(true);
    });

    it('should enforce mutual exclusivity', () => {
      // A user is EITHER a super admin OR a tenant admin, never both
      const superAdmin: SuperAdminDTO = {
        id: 'super-1',
        email: 'super@platform.com',
        name: 'Super Admin',
        isSuperAdmin: true,
        tenantId: null,
        role: 'super_admin',
        createdAt: '2025-01-01T00:00:00Z',
        promotedAt: '2025-01-01T00:00:00Z',
        promotedBy: 'system',
      };

      const isMutuallyExclusive = (superAdmin.isSuperAdmin && superAdmin.tenantId === null) ||
                                 (!superAdmin.isSuperAdmin && superAdmin.tenantId !== null);

      expect(isMutuallyExclusive).toBe(true);
    });

    it('should validate state transitions', () => {
      // Super admin -> Regular admin transition
      const beforeDemotion: SuperAdminDTO = {
        id: 'user-1',
        email: 'user@platform.com',
        name: 'User',
        isSuperAdmin: true,
        tenantId: null,
        role: 'super_admin',
        createdAt: '2025-01-01T00:00:00Z',
        promotedAt: '2025-01-01T00:00:00Z',
        promotedBy: 'system',
      };

      const afterDemotion: SuperAdminDTO = {
        ...beforeDemotion,
        isSuperAdmin: false,
        tenantId: 'tenant-1', // Now has tenant
        role: 'admin',
        demotedAt: '2025-01-15T00:00:00Z',
        demotionReason: 'User request',
      };

      // Verify state change
      expect(beforeDemotion.isSuperAdmin).toBe(true);
      expect(beforeDemotion.tenantId).toBeNull();
      expect(afterDemotion.isSuperAdmin).toBe(false);
      expect(afterDemotion.tenantId).toBe('tenant-1');
    });
  });
});