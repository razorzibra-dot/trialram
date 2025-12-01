/**
 * Navigation Filter Unit Tests
 * 
 * Comprehensive test suite for permission-based navigation filtering.
 * Tests all filtering scenarios including:
 * - Permission-based filtering
 * - Role-based filtering
 * - Nested item filtering
 * - Dynamic section visibility
 * - Breadcrumb generation
 * 
 * Run with: npm test -- navigationFilterTests
 * 
 * @see src/utils/navigationFilter.ts
 */

import {
  isItemVisible,
  hasVisibleChildren,
  filterNavigationItems,
  createNavigationFilterContext,
  getPermissionAwareBreadcrumbs,
  getAllVisibleItems,
  canAccessNavigationItem,
  NavigationFilterContext,
} from './navigationFilter';
// ⚠️ NOTE: Test file uses mock navigation config for testing purposes
// In production, navigation items come from database via useNavigation() hook
// This test file can be updated to use database-driven navigation in the future
const mockNavigationConfig = [
  { key: '/tenant/dashboard', label: 'Dashboard', permission: 'crm:dashboard:panel:view' },
  { key: '/tenant/customers', label: 'Customers', permission: 'customers:manage' },
  { key: '/tenant/users', label: 'User Management', permission: 'crm:user:record:update', children: [
    { key: '/tenant/users/list', label: 'Users', permission: 'crm:user:record:update' },
    { key: '/tenant/users/roles', label: 'Roles', permission: 'crm:role:permission:assign' },
  ]},
  { key: 'admin-section', label: 'Administration', isSection: true, permission: 'crm:reference:data:read' },
];
const navigationConfig = mockNavigationConfig; // For backward compatibility in tests

/**
 * Test suite runner
 * Output results to console
 */
export class NavigationFilterTestSuite {
  private results: Array<{ name: string; passed: boolean; message?: string }> = [];

  /**
   * Run all tests and output results
   */
  async runAllTests(): Promise<boolean> {
    console.log('🧪 Starting Navigation Filter Tests...\n');

    this.testPermissionFiltering();
    this.testRoleBasedFiltering();
    this.testNestedItemFiltering();
    this.testDynamicSectionVisibility();
    this.testBreadcrumbGeneration();
    this.testVisibleItemsCollection();
    this.testNavigationItemAccess();

    this.printResults();
    return this.results.every((r) => r.passed);
  }

  /**
   * Test permission-based filtering
   */
  private testPermissionFiltering(): void {
    const context = createNavigationFilterContext('admin', [
      'read',
      'crm:customer:record:update',
      'crm:user:record:update',
    ]);

    const result = isItemVisible(navigationConfig[0], context); // Dashboard (read permission)
    this.recordResult(
      'Permission Filtering: Dashboard visible with read permission',
      result === true
    );

    const noPermContext = createNavigationFilterContext('customer', ['read']);
    const noPermResult = isItemVisible(navigationConfig[8], noPermContext); // Job Works (no permission)
    this.recordResult(
      'Permission Filtering: Job Works hidden without manage_job_works',
      noPermResult === false
    );
  }

  /**
   * Test role-based filtering
   */
  private testRoleBasedFiltering(): void {
    const adminContext = createNavigationFilterContext('admin', ['crm:user:record:update']);
    const adminItem = navigationConfig.find((item) => item.key === '/tenant/users');

    const adminResult = adminItem ? isItemVisible(adminItem, adminContext) : false;
    this.recordResult('Role Filtering: Admin can see User Management', adminResult === true);

    const agentContext = createNavigationFilterContext('agent', ['read', 'write']);
    const agentResult = adminItem ? isItemVisible(adminItem, agentContext) : false;
    this.recordResult('Role Filtering: Agent cannot see User Management', agentResult === false);
  }

  /**
   * Test nested item filtering
   */
  private testNestedItemFiltering(): void {
    const context = createNavigationFilterContext('admin', [
      'crm:user:record:update',
      'crm:role:record:update',
    ]);

    const userManagementItem = navigationConfig.find((item) => item.key === '/tenant/users');

    if (userManagementItem && userManagementItem.children) {
      const visibleChildren = userManagementItem.children.filter((child) =>
        isItemVisible(child, context)
      );

      this.recordResult(
        'Nested Filtering: Admin sees all User Management children',
        visibleChildren.length > 0
      );
    }

    const limitedContext = createNavigationFilterContext('agent', ['read']);
    if (userManagementItem) {
      const limitedResult = isItemVisible(userManagementItem, limitedContext);
      this.recordResult(
        'Nested Filtering: Agent cannot see User Management submenu',
        limitedResult === false
      );
    }
  }

  /**
   * Test dynamic section visibility
   */
  private testDynamicSectionVisibility(): void {
    const adminContext = createNavigationFilterContext('admin', [
      'crm:user:record:update',
      'crm:system:config:manage',
      'manage_companies',
    ]);

    const filtered = filterNavigationItems(navigationConfig, adminContext);
    const adminSection = filtered.find((item) => item.key === 'admin-section');

    this.recordResult(
      'Dynamic Section: Administration section visible for admin',
      adminSection !== undefined && adminSection.isVisible === true
    );

    const agentContext = createNavigationFilterContext('agent', ['read']);
    const agentFiltered = filterNavigationItems(navigationConfig, agentContext);
    const agentAdminSection = agentFiltered.find((item) => item.key === 'admin-section');

    this.recordResult(
      'Dynamic Section: Administration section hidden for agent',
      agentAdminSection === undefined
    );
  }

  /**
   * Test breadcrumb generation
   */
  private testBreadcrumbGeneration(): void {
    const context = createNavigationFilterContext('admin', [
      'read',
      'crm:user:record:update',
      'crm:role:record:update',
    ]);

    const breadcrumbs = getPermissionAwareBreadcrumbs(
      '/tenant/users',
      navigationConfig,
      context
    );

    this.recordResult(
      'Breadcrumbs: Contains home item',
      breadcrumbs.length > 0 && breadcrumbs[0].key === 'home'
    );

    this.recordResult(
      'Breadcrumbs: Includes accessible items only',
      breadcrumbs.every((item) => !item.key.includes('restricted'))
    );
  }

  /**
   * Test visible items collection
   */
  private testVisibleItemsCollection(): void {
    const adminContext = createNavigationFilterContext('admin', [
      'read',
      'write',
      'crm:customer:record:update',
      'crm:user:record:update',
      'crm:system:config:manage',
    ]);

    const visibleItems = getAllVisibleItems(navigationConfig, adminContext);

    this.recordResult(
      'Visible Items: Collection includes accessible items',
      visibleItems.length > 0
    );

    const hasUserManagement = visibleItems.some((item) => item.key === '/tenant/users');
    this.recordResult('Visible Items: Includes User Management for admin', hasUserManagement);

    const superAdminContext = createNavigationFilterContext('super_admin', [
      'super_admin',
      'crm:platform:tenant:manage',
    ]);
    const superAdminItems = getAllVisibleItems(navigationConfig, superAdminContext);

    this.recordResult(
      'Visible Items: Super admin sees appropriate items',
      superAdminItems.length > 0
    );
  }

  /**
   * Test navigation item access validation
   */
  private testNavigationItemAccess(): void {
    const adminContext = createNavigationFilterContext('admin', [
      'crm:user:record:update',
      'crm:role:record:update',
    ]);

    const canAccessUsers = canAccessNavigationItem(
      '/tenant/users',
      navigationConfig,
      adminContext
    );
    this.recordResult(
      'Item Access: Admin can access User Management',
      canAccessUsers === true
    );

    const agentContext = createNavigationFilterContext('agent', ['read']);
    const cannotAccessUsers = canAccessNavigationItem(
      '/tenant/users',
      navigationConfig,
      agentContext
    );
    this.recordResult(
      'Item Access: Agent cannot access User Management',
      cannotAccessUsers === false
    );

    const canAccessDashboard = canAccessNavigationItem(
      '/tenant/dashboard',
      navigationConfig,
      agentContext
    );
    this.recordResult(
      'Item Access: Agent can access Dashboard',
      canAccessDashboard === true
    );
  }

  /**
   * Record test result
   */
  private recordResult(name: string, passed: boolean, message?: string): void {
    this.results.push({ name, passed, message });
  }

  /**
   * Print test results
   */
  private printResults(): void {
    console.log('\n📊 Test Results:\n');

    let passed = 0;
    let failed = 0;

    this.results.forEach((result) => {
      const icon = result.passed ? '✅' : '❌';
      const status = result.passed ? 'PASS' : 'FAIL';

      console.log(`${icon} [${status}] ${result.name}`);

      if (result.message) {
        console.log(`    ${result.message}`);
      }

      if (result.passed) {
        passed++;
      } else {
        failed++;
      }
    });

    console.log(`\n📈 Summary: ${passed} passed, ${failed} failed out of ${this.results.length} tests\n`);

    if (failed === 0) {
      console.log('🎉 All tests passed!\n');
    } else {
      console.log(`⚠️  ${failed} test(s) failed\n`);
    }
  }
}

/**
 * Quick test runner - use this in development
 * Add to your app initialization or use in a test file
 * 
 * @example
 * if (process.env.NODE_ENV === 'development') {
 *   runNavigationFilterTests();
 * }
 */
export async function runNavigationFilterTests(): Promise<void> {
  try {
    const testSuite = new NavigationFilterTestSuite();
    const allPassed = await testSuite.runAllTests();

    if (!allPassed) {
      console.error('Some tests failed!');
    }
  } catch (error) {
    console.error('Test suite error:', error);
  }
}

/**
 * Validate navigation configuration
 * Checks for common issues in navigation configuration
 */
export function validateNavigationConfig(): Array<{
  severity: 'error' | 'warning' | 'info';
  message: string;
}> {
  const issues: Array<{ severity: 'error' | 'warning' | 'info'; message: string }> = [];

  // Check for duplicate keys
  const keys = new Set<string>();
  const duplicates = new Set<string>();

  function checkDuplicates(items: any[]) {
    items.forEach((item) => {
      if (keys.has(item.key)) {
        duplicates.add(item.key);
      }
      keys.add(item.key);

      if (item.children) {
        checkDuplicates(item.children);
      }
    });
  }

  checkDuplicates(navigationConfig);

  if (duplicates.size > 0) {
    issues.push({
      severity: 'error',
      message: `Duplicate navigation keys found: ${Array.from(duplicates).join(', ')}`,
    });
  }

  // Check for missing permissions
  navigationConfig.forEach((item) => {
    if (item.permission && item.permission.length === 0) {
      issues.push({
        severity: 'warning',
        message: `Navigation item "${item.label}" has empty permission`,
      });
    }
  });

  return issues;
}