/* eslint-disable */
/**
 * RBAC Testing Utility
 * Comprehensive testing for Role-Based Access Control
 */

import { authService } from '@/services';
import { CUSTOMER_PERMISSIONS } from '@/modules/features/customers/constants/permissions';

export interface RBACTestResult {
  testName: string;
  passed: boolean;
  details: string;
  expected: any;
  actual: any;
}

export interface RBACTestSuite {
  suiteName: string;
  results: RBACTestResult[];
  passed: number;
  failed: number;
  total: number;
}

/**
 * RBAC Test Runner
 */
export class RBACTester {
  private results: RBACTestSuite[] = [];

  /**
   * Test super admin permissions
   */
  async testSuperAdminAccess(): Promise<RBACTestSuite> {
    const suite: RBACTestSuite = {
      suiteName: 'Super Admin Access Tests',
      results: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    // Login as super admin
    try {
      await authService.login({
        email: 'superadmin@platform.com',
        password: 'password123'
      });

      const user = authService.getCurrentUser();
      
      // Test 1: Super admin role check
      const hasRole = authService.hasRole('super_admin');
      suite.results.push({
        testName: 'Super Admin Role Check',
        passed: hasRole,
        details: hasRole ? 'Super admin role correctly identified' : 'Super admin role not recognized',
        expected: true,
        actual: hasRole
      });

      // Test 2: Super admin can access all roles
      const canAccessAdmin = authService.hasRole('admin');
      const canAccessManager = authService.hasRole('manager');
      const canAccessAgent = authService.hasRole('agent');
      
      suite.results.push({
        testName: 'Super Admin Universal Role Access',
        passed: canAccessAdmin && canAccessManager && canAccessAgent,
        details: `Admin: ${canAccessAdmin}, Manager: ${canAccessManager}, Agent: ${canAccessAgent}`,
        expected: { admin: true, manager: true, agent: true },
        actual: { admin: canAccessAdmin, manager: canAccessManager, agent: canAccessAgent }
      });

      // Test 3: Super admin has all permissions
      const permissions = [
        'read', 'write', 'delete',
        CUSTOMER_PERMISSIONS.UPDATE, 'crm:sales:deal:update', 'manage_tickets',
        'crm:user:record:update', 'crm:role:record:update', 'crm:platform:control:admin'
      ];
      
      const permissionResults = permissions.map(perm => ({
        permission: perm,
        hasPermission: authService.hasPermission(perm)
      }));
      
      const allPermissions = permissionResults.every(p => p.hasPermission);
      
      suite.results.push({
        testName: 'Super Admin Universal Permissions',
        passed: allPermissions,
        details: allPermissions ? 'All permissions granted' : `Missing: ${permissionResults.filter(p => !p.hasPermission).map(p => p.permission).join(', ')}`,
        expected: 'All permissions should be true',
        actual: permissionResults
      });

      // Test 4: Super admin portal access
      const canAccessSuperAdmin = authService.canAccessSuperAdminPortal();
      suite.results.push({
        testName: 'Super Admin Portal Access',
        passed: canAccessSuperAdmin,
        details: canAccessSuperAdmin ? 'Can access super admin portal' : 'Cannot access super admin portal',
        expected: true,
        actual: canAccessSuperAdmin
      });

      // Test 5: Tenant portal access
      const canAccessTenant = authService.canAccessTenantPortal();
      suite.results.push({
        testName: 'Tenant Portal Access',
        passed: canAccessTenant,
        details: canAccessTenant ? 'Can access tenant portal' : 'Cannot access tenant portal',
        expected: true,
        actual: canAccessTenant
      });

      // Test 6: User management capabilities
      const canManageUsers = authService.hasPermission('crm:user:record:update');
      const canManageRoles = authService.hasPermission('crm:role:record:update');
      const canManageTenants = authService.hasPermission('crm:platform:tenant:manage');
      
      suite.results.push({
        testName: 'Management Capabilities',
        passed: canManageUsers && canManageRoles && canManageTenants,
        details: `Users: ${canManageUsers}, Roles: ${canManageRoles}, Tenants: ${canManageTenants}`,
        expected: { users: true, roles: true, tenants: true },
        actual: { users: canManageUsers, roles: canManageRoles, tenants: canManageTenants }
      });

    } catch (error) {
      suite.results.push({
        testName: 'Super Admin Login',
        passed: false,
        details: `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        expected: 'Successful login',
        actual: 'Login failed'
      });
    }

    // Calculate totals
    suite.total = suite.results.length;
    suite.passed = suite.results.filter(r => r.passed).length;
    suite.failed = suite.total - suite.passed;

    this.results.push(suite);
    return suite;
  }

  /**
   * Test regular admin permissions
   */
  async testAdminAccess(): Promise<RBACTestSuite> {
    const suite: RBACTestSuite = {
      suiteName: 'Admin Access Tests',
      results: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    try {
      await authService.login({
        email: 'admin@techcorp.com',
        password: 'password123'
      });

      // Test 1: Admin role check
      const hasAdminRole = authService.hasRole('admin');
      const hasNoSuperAdminRole = !authService.hasRole('super_admin');
      
      suite.results.push({
        testName: 'Admin Role Check',
        passed: hasAdminRole && hasNoSuperAdminRole,
        details: `Admin: ${hasAdminRole}, Not Super Admin: ${hasNoSuperAdminRole}`,
        expected: { admin: true, superAdmin: false },
        actual: { admin: hasAdminRole, superAdmin: !hasNoSuperAdminRole }
      });

      // Test 2: Admin permissions
      const adminPermissions = [
        'read', 'write', 'delete',
        CUSTOMER_PERMISSIONS.UPDATE, 'crm:sales:deal:update', 'manage_tickets',
        'crm:user:record:update', 'crm:role:record:update'
      ];
      
      const adminPermissionResults = adminPermissions.map(perm => ({
        permission: perm,
        hasPermission: authService.hasPermission(perm)
      }));
      
      const hasAdminPermissions = adminPermissionResults.every(p => p.hasPermission);
      
      suite.results.push({
        testName: 'Admin Permissions',
        passed: hasAdminPermissions,
        details: hasAdminPermissions ? 'All admin permissions granted' : `Missing: ${adminPermissionResults.filter(p => !p.hasPermission).map(p => p.permission).join(', ')}`,
        expected: 'All admin permissions should be true',
        actual: adminPermissionResults
      });

      // Test 3: No super admin permissions
      const noSuperAdminPermissions = !authService.hasPermission('crm:platform:control:admin') && 
                                     !authService.hasPermission('crm:platform:tenant:manage');
      
      suite.results.push({
        testName: 'No Super Admin Permissions',
        passed: noSuperAdminPermissions,
        details: noSuperAdminPermissions ? 'Correctly restricted from super admin permissions' : 'Has unauthorized super admin permissions',
        expected: false,
        actual: !noSuperAdminPermissions
      });

      // Test 4: Portal access
      const cannotAccessSuperAdmin = !authService.canAccessSuperAdminPortal();
      const canAccessTenant = authService.canAccessTenantPortal();
      
      suite.results.push({
        testName: 'Portal Access Restrictions',
        passed: cannotAccessSuperAdmin && canAccessTenant,
        details: `Super Admin Portal: ${!cannotAccessSuperAdmin}, Tenant Portal: ${canAccessTenant}`,
        expected: { superAdmin: false, tenant: true },
        actual: { superAdmin: !cannotAccessSuperAdmin, tenant: canAccessTenant }
      });

    } catch (error) {
      suite.results.push({
        testName: 'Admin Login',
        passed: false,
        details: `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        expected: 'Successful login',
        actual: 'Login failed'
      });
    }

    // Calculate totals
    suite.total = suite.results.length;
    suite.passed = suite.results.filter(r => r.passed).length;
    suite.failed = suite.total - suite.passed;

    this.results.push(suite);
    return suite;
  }

  /**
   * Test manager permissions
   */
  async testManagerAccess(): Promise<RBACTestSuite> {
    const suite: RBACTestSuite = {
      suiteName: 'Manager Access Tests',
      results: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    try {
      await authService.login({
        email: 'manager@techcorp.com',
        password: 'password123'
      });

      // Test manager permissions
      const managerPermissions = ['read', 'write', CUSTOMER_PERMISSIONS.UPDATE, 'crm:sales:deal:update'];
      const restrictedPermissions = ['delete', 'crm:user:record:update', 'crm:role:record:update'];
      
      const hasManagerPerms = managerPermissions.every(perm => authService.hasPermission(perm));
      const lacksRestrictedPerms = restrictedPermissions.every(perm => !authService.hasPermission(perm));
      
      suite.results.push({
        testName: 'Manager Permission Boundaries',
        passed: hasManagerPerms && lacksRestrictedPerms,
        details: `Has manager perms: ${hasManagerPerms}, Lacks restricted: ${lacksRestrictedPerms}`,
        expected: { hasRequired: true, lacksRestricted: true },
        actual: { hasRequired: hasManagerPerms, lacksRestricted: lacksRestrictedPerms }
      });

    } catch (error) {
      suite.results.push({
        testName: 'Manager Login',
        passed: false,
        details: `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        expected: 'Successful login',
        actual: 'Login failed'
      });
    }

    // Calculate totals
    suite.total = suite.results.length;
    suite.passed = suite.results.filter(r => r.passed).length;
    suite.failed = suite.total - suite.passed;

    this.results.push(suite);
    return suite;
  }

  /**
   * Run all RBAC tests
   */
  async runAllTests(): Promise<RBACTestSuite[]> {
    console.log('🔐 Starting RBAC Tests...');
    
    this.results = [];
    
    await this.testSuperAdminAccess();
    await this.testAdminAccess();
    await this.testManagerAccess();
    
    return this.results;
  }

  /**
   * Print test results
   */
  printResults(): void {
    console.log('\n🔐 RBAC Test Results');
    console.log('===================');
    
    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;
    
    this.results.forEach(suite => {
      console.log(`\n📋 ${suite.suiteName}`);
      console.log(`   ✅ Passed: ${suite.passed}`);
      console.log(`   ❌ Failed: ${suite.failed}`);
      console.log(`   📊 Total: ${suite.total}`);
      
      if (suite.failed > 0) {
        console.log('   Failed Tests:');
        suite.results.filter(r => !r.passed).forEach(result => {
          console.log(`     ❌ ${result.testName}: ${result.details}`);
        });
      }
      
      totalPassed += suite.passed;
      totalFailed += suite.failed;
      totalTests += suite.total;
    });
    
    console.log('\n📊 Overall Results:');
    console.log(`   ✅ Total Passed: ${totalPassed}`);
    console.log(`   ❌ Total Failed: ${totalFailed}`);
    console.log(`   📊 Total Tests: ${totalTests}`);
    console.log(`   📈 Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 All RBAC tests passed! The system is properly configured.');
    } else {
      console.log('\n⚠️  Some RBAC tests failed. Please review the configuration.');
    }
    
    console.log('===================\n');
  }

  /**
   * Get test summary
   */
  getSummary(): { passed: number; failed: number; total: number; successRate: number } {
    const totalPassed = this.results.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = this.results.reduce((sum, suite) => sum + suite.failed, 0);
    const totalTests = this.results.reduce((sum, suite) => sum + suite.total, 0);
    
    return {
      passed: totalPassed,
      failed: totalFailed,
      total: totalTests,
      successRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0
    };
  }
}

/**
 * Quick RBAC validation
 */
export async function quickRBACValidation(): Promise<void> {
  console.log('⚡ Quick RBAC Validation...');
  
  const tester = new RBACTester();
  await tester.testSuperAdminAccess();
  
  const summary = tester.getSummary();
  console.log(`✅ Super Admin Tests: ${summary.passed}/${summary.total} passed (${summary.successRate.toFixed(1)}%)`);
  
  if (summary.failed > 0) {
    tester.printResults();
  } else {
    console.log('🎉 Super Admin RBAC is working correctly!');
  }
}

export default RBACTester;
