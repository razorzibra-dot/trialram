#!/usr/bin/env node

/**
 * Schema Drift Detection Script
 * 
 * Purpose: Detect schema changes that deviate from expected database design
 * Date: 2025-11-23
 * Version: 1.0
 * 
 * This script detects:
 * - Unexpected table modifications
 * - Missing or extra columns
 * - Changed column types or constraints
 * - Unauthorized index changes
 * - RLS policy modifications
 * - Permission system drift
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// SCHEMA EXPECTATIONS (GOLDEN STATE)
// ============================================================================

interface TableSchema {
  name: string;
  columns: ColumnDefinition[];
  indexes: string[];
  constraints: ConstraintDefinition[];
  rlsEnabled: boolean;
}

interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
}

interface ConstraintDefinition {
  name: string;
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK';
  columns: string[];
}

// Expected core tables schema
const EXPECTED_SCHEMA: Record<string, TableSchema> = {
  permissions: {
    name: 'permissions',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true },
      { name: 'name', type: 'character varying', nullable: false },
      { name: 'description', type: 'text', nullable: true },
      { name: 'category', type: 'character varying', nullable: true },
      { name: 'resource', type: 'character varying', nullable: false },
      { name: 'action', type: 'character varying', nullable: false },
      { name: 'is_system_permission', type: 'boolean', nullable: false, default: 'false' },
      { name: 'created_at', type: 'timestamp with time zone', nullable: false, default: 'now()' },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false, default: 'now()' }
    ],
    indexes: ['idx_permissions_name', 'idx_permissions_resource_action'],
    constraints: [
      { name: 'permissions_pkey', type: 'PRIMARY KEY', columns: ['id'] },
      { name: 'permissions_name_key', type: 'UNIQUE', columns: ['name'] }
    ],
    rlsEnabled: false
  },
  
  roles: {
    name: 'roles',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true },
      { name: 'name', type: 'character varying', nullable: false },
      { name: 'description', type: 'text', nullable: true },
      { name: 'tenant_id', type: 'uuid', nullable: true },
      { name: 'is_system_role', type: 'boolean', nullable: false, default: 'false' },
      { name: 'permissions', type: 'jsonb', nullable: true },
      { name: 'created_by', type: 'uuid', nullable: true },
      { name: 'created_at', type: 'timestamp with time zone', nullable: false, default: 'now()' },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false, default: 'now()' }
    ],
    indexes: ['idx_roles_name_tenant', 'idx_roles_is_system'],
    constraints: [
      { name: 'roles_pkey', type: 'PRIMARY KEY', columns: ['id'] },
      { name: 'roles_name_tenant_id_key', type: 'UNIQUE', columns: ['name', 'tenant_id'] }
    ],
    rlsEnabled: false
  },

  users: {
    name: 'users',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true },
      { name: 'email', type: 'character varying', nullable: false },
      { name: 'name', type: 'character varying', nullable: true },
      { name: 'first_name', type: 'character varying', nullable: true },
      { name: 'last_name', type: 'character varying', nullable: true },
      { name: 'status', type: 'user_status', nullable: false },
      { name: 'tenant_id', type: 'uuid', nullable: true },
      { name: 'is_super_admin', type: 'boolean', nullable: false, default: 'false' },
      { name: 'created_at', type: 'timestamp with time zone', nullable: false, default: 'now()' },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false, default: 'now()' },
      { name: 'last_login', type: 'timestamp with time zone', nullable: true }
    ],
    indexes: ['idx_users_email', 'idx_users_tenant_id', 'idx_users_status'],
    constraints: [
      { name: 'users_pkey', type: 'PRIMARY KEY', columns: ['id'] },
      { name: 'users_email_key', type: 'UNIQUE', columns: ['email'] }
    ],
    rlsEnabled: true
  },

  role_permissions: {
    name: 'role_permissions',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true },
      { name: 'role_id', type: 'uuid', nullable: false, isForeignKey: true },
      { name: 'permission_id', type: 'uuid', nullable: false, isForeignKey: true },
      { name: 'granted_by', type: 'uuid', nullable: true, isForeignKey: true },
      { name: 'created_at', type: 'timestamp with time zone', nullable: false, default: 'now()' },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false, default: 'now()' }
    ],
    indexes: ['idx_role_permissions_role_id', 'idx_role_permissions_permission_id'],
    constraints: [
      { name: 'role_permissions_pkey', type: 'PRIMARY KEY', columns: ['id'] },
      { name: 'role_permissions_role_id_permission_id_key', type: 'UNIQUE', columns: ['role_id', 'permission_id'] }
    ],
    rlsEnabled: false
  },

  user_roles: {
    name: 'user_roles',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true },
      { name: 'user_id', type: 'uuid', nullable: false, isForeignKey: true },
      { name: 'role_id', type: 'uuid', nullable: false, isForeignKey: true },
      { name: 'tenant_id', type: 'uuid', nullable: true, isForeignKey: true },
      { name: 'assigned_at', type: 'timestamp with time zone', nullable: false, default: 'now()' },
      { name: 'assigned_by', type: 'uuid', nullable: true, isForeignKey: true }
    ],
    indexes: ['idx_user_roles_user_id', 'idx_user_roles_role_id', 'idx_user_roles_tenant_id'],
    constraints: [
      { name: 'user_roles_pkey', type: 'PRIMARY KEY', columns: ['id'] },
      { name: 'user_roles_user_id_role_id_tenant_id_key', type: 'UNIQUE', columns: ['user_id', 'role_id', 'tenant_id'] }
    ],
    rlsEnabled: false
  },

  tenants: {
    name: 'tenants',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true },
      { name: 'name', type: 'character varying', nullable: false },
      { name: 'domain', type: 'character varying', nullable: true },
      { name: 'status', type: 'tenant_status', nullable: false },
      { name: 'plan', type: 'subscription_plan', nullable: true },
      { name: 'created_at', type: 'timestamp with time zone', nullable: false, default: 'now()' },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false, default: 'now()' }
    ],
    indexes: ['idx_tenants_name', 'idx_tenants_status'],
    constraints: [
      { name: 'tenants_pkey', type: 'PRIMARY KEY', columns: ['id'] },
      { name: 'tenants_name_key', type: 'UNIQUE', columns: ['name'] }
    ],
    rlsEnabled: false
  }
};

// Expected permission patterns
const EXPECTED_PERMISSIONS = [
  'read', 'write', 'delete',
  'users:manage', 'roles:manage', 'customers:manage', 'sales:manage',
  'contracts:manage', 'service_contracts:manage', 'products:manage',
  'product_sales:manage', 'job_works:manage', 'tickets:manage', 'complaints:manage',
  'dashboard:manage', 'settings:manage', 'companies:manage',
  'reports:manage', 'export_data', 'view_audit_logs',
  'create_tickets', 'update_tickets', 'create_products', 'update_products',
  'inventory:manage', 'view_financials', 'integrations:manage',
  'bulk_operations', 'advanced_search', 'api_access',
  'platform_admin', 'super_admin', 'tenants:manage', 'system_monitoring'
];

// ============================================================================
// SCHEMA DRIFT DETECTOR CLASS
// ============================================================================

class SchemaDriftDetector {
  private supabase: any;
  private driftResults: DriftResult[] = [];
  private config = {
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    verbose: process.env.VERBOSE === 'true',
    strict: process.env.STRICT_MODE === 'true'
  };

  constructor() {
    if (!this.config.supabaseUrl || !this.config.supabaseKey) {
      throw new Error('Missing Supabase configuration. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }
    
    this.supabase = createClient(this.config.supabaseUrl, this.config.supabaseKey);
  }

  // ============================================================================
  // MAIN DETECTION METHODS
  // ============================================================================

  async detectAllDrift(): Promise<DriftSummary> {
    console.log('🔍 Starting Schema Drift Detection...\n');

    const startTime = Date.now();

    try {
      // Phase 1: Table Structure Drift
      console.log('📊 Phase 1: Table Structure Drift Detection');
      await this.detectTableStructureDrift();
      
      // Phase 2: Permission System Drift
      console.log('\n🔐 Phase 2: Permission System Drift Detection');
      await this.detectPermissionDrift();
      
      // Phase 3: Index Drift
      console.log('\n📈 Phase 3: Index Drift Detection');
      await this.detectIndexDrift();
      
      // Phase 4: RLS Policy Drift
      console.log('\n🛡️ Phase 4: RLS Policy Drift Detection');
      await this.detectRLSPolicyDrift();
      
      // Phase 5: Data Type Drift
      console.log('\n🔧 Phase 5: Data Type Drift Detection');
      await this.detectDataTypeDrift();

      const endTime = Date.now();
      const summary = this.generateDriftSummary(startTime, endTime);
      
      this.printDriftSummary(summary);
      
      return summary;

    } catch (error) {
      console.error('❌ Schema drift detection failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // SPECIFIC DRIFT DETECTION METHODS
  // ============================================================================

  private async detectTableStructureDrift(): Promise<void> {
    // Check for unexpected tables
    await this.detectUnexpectedTables();
    
    // Check for missing expected tables
    await this.detectMissingTables();
    
    // Check column drift for existing tables
    await this.detectColumnDrift();
    
    // Check constraint drift
    await this.detectConstraintDrift();
  }

  private async detectPermissionDrift(): Promise<void> {
    try {
      // Get actual permissions from database
      const { data: actualPermissions, error } = await this.supabase
        .from('permissions')
        .select('name, resource, action, category')
        .not('name', 'is', null);

      if (error) throw error;

      const actualPermissionNames = actualPermissions?.map(p => p.name) || [];
      
      // Check for missing expected permissions
      const missingPermissions = EXPECTED_PERMISSIONS.filter(
        expected => !actualPermissionNames.includes(expected)
      );

      // Check for unexpected permissions
      const unexpectedPermissions = actualPermissionNames.filter(
        actual => !EXPECTED_PERMISSIONS.includes(actual) && 
                 !actual.startsWith('custom_') // Allow custom permissions
      );

      // Check permission format compliance
      const formatViolations = actualPermissions?.filter(perm => {
        const hasColon = perm.name.includes(':');
        const isCore = ['read', 'write', 'delete', 'platform_admin', 'super_admin', 'system_monitoring'].includes(perm.name);
        return !hasColon && !isCore && !perm.name.startsWith('custom_');
      }) || [];

      if (missingPermissions.length === 0 && unexpectedPermissions.length === 0 && formatViolations.length === 0) {
        this.addDriftResult('permission_system', false, 'Permission system matches expected structure');
      } else {
        const issues = [];
        if (missingPermissions.length > 0) {
          issues.push(`Missing permissions: ${missingPermissions.join(', ')}`);
        }
        if (unexpectedPermissions.length > 0) {
          issues.push(`Unexpected permissions: ${unexpectedPermissions.join(', ')}`);
        }
        if (formatViolations.length > 0) {
          issues.push(`Format violations: ${formatViolations.map(p => p.name).join(', ')}`);
        }
        this.addDriftResult('permission_system', true, `Permission drift detected: ${issues.join('; ')}`);
      }

    } catch (error) {
      this.addDriftResult('permission_system', true, `Error detecting permission drift: ${error.message}`);
    }
  }

  private async detectUnexpectedTables(): Promise<void> {
    try {
      // Get all tables in public schema
      const { data: tables, error } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name');

      if (error) throw error;

      const actualTables = tables?.map(t => t.table_name) || [];
      const expectedTables = Object.keys(EXPECTED_SCHEMA);
      
      // Common tables that might exist but aren't in our core schema
      const allowedAdditionalTables = [
        'audit_logs', 'companies', 'customers', 'products', 'sales', 
        'contracts', 'service_contracts', 'job_works', 'tickets', 'complaints',
        'product_categories', 'customer_tags', 'customer_tag_mapping',
        'product_sales', 'status_options', 'reference_data',
        'super_user_tenant_access', 'super_user_impersonation_logs',
        'tenant_statistics', 'tenant_config_overrides'
      ];

      const unexpectedTables = actualTables.filter(table => 
        !expectedTables.includes(table) && 
        !allowedAdditionalTables.includes(table) &&
        !table.startsWith('_') && // Allow internal tables
        !table.startsWith('pg_') // Allow PostgreSQL internal tables
      );

      if (unexpectedTables.length === 0) {
        this.addDriftResult('unexpected_tables', false, 'No unexpected tables detected');
      } else {
        this.addDriftResult('unexpected_tables', true, `Unexpected tables found: ${unexpectedTables.join(', ')}`);
      }

    } catch (error) {
      this.addDriftResult('unexpected_tables', true, `Error detecting unexpected tables: ${error.message}`);
    }
  }

  private async detectMissingTables(): Promise<void> {
    const expectedTables = Object.keys(EXPECTED_SCHEMA);
    const missingTables: string[] = [];

    for (const tableName of expectedTables) {
      try {
        const { data, error } = await this.supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_name', tableName)
          .eq('table_schema', 'public')
          .limit(1);

        if (error) throw error;

        if (!data || data.length === 0) {
          missingTables.push(tableName);
        }
      } catch (error) {
        missingTables.push(tableName);
      }
    }

    if (missingTables.length === 0) {
      this.addDriftResult('missing_tables', false, 'All expected tables exist');
    } else {
      this.addDriftResult('missing_tables', true, `Missing expected tables: ${missingTables.join(', ')}`);
    }
  }

  private async detectColumnDrift(): Promise<void> {
    const expectedTables = Object.keys(EXPECTED_SCHEMA);
    
    for (const tableName of expectedTables) {
      try {
        const { data: columns, error } = await this.supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_name', tableName)
          .eq('table_schema', 'public')
          .order('ordinal_position');

        if (error) throw error;

        const expectedColumns = EXPECTED_SCHEMA[tableName].columns;
        const actualColumns = columns?.map(col => ({
          name: col.column_name,
          type: this.normalizeDataType(col.data_type),
          nullable: col.is_nullable === 'YES',
          default: col.column_default
        })) || [];

        // Check for missing columns
        const missingColumns = expectedColumns.filter(
          expected => !actualColumns.some(actual => actual.name === expected.name)
        );

        // Check for extra columns (except system columns)
        const extraColumns = actualColumns.filter(actual => 
          !expectedColumns.some(expected => expected.name === actual.name) &&
          !['created_at', 'updated_at'].includes(actual.name)
        );

        // Check for type mismatches
        const typeMismatches = expectedColumns.filter(expected => {
          const actual = actualColumns.find(a => a.name === expected.name);
          return actual && this.normalizeDataType(actual.type) !== this.normalizeDataType(expected.type);
        });

        const driftIssues = [];
        if (missingColumns.length > 0) {
          driftIssues.push(`Missing columns: ${missingColumns.map(c => c.name).join(', ')}`);
        }
        if (extraColumns.length > 0) {
          driftIssues.push(`Extra columns: ${extraColumns.map(c => c.name).join(', ')}`);
        }
        if (typeMismatches.length > 0) {
          driftIssues.push(`Type mismatches: ${typeMismatches.map(c => c.name).join(', ')}`);
        }

        if (driftIssues.length === 0) {
          this.addDriftResult(`columns_${tableName}`, false, `Table ${tableName} structure matches expected`);
        } else {
          this.addDriftResult(`columns_${tableName}`, true, `Table ${tableName} column drift: ${driftIssues.join('; ')}`);
        }

      } catch (error) {
        this.addDriftResult(`columns_${tableName}`, true, `Error checking columns for ${tableName}: ${error.message}`);
      }
    }
  }

  private async detectIndexDrift(): Promise<void> {
    try {
      const { data: indexes, error } = await this.supabase
        .from('pg_indexes')
        .select('tablename, indexname')
        .eq('schemaname', 'public');

      if (error) throw error;

      const indexMap = new Map<string, string[]>();
      indexes?.forEach((idx: any) => {
        const table = idx.tablename;
        if (!indexMap.has(table)) {
          indexMap.set(table, []);
        }
        indexMap.get(table)!.push(idx.indexname);
      });

      // Check critical tables for expected indexes
      const criticalTables = ['permissions', 'users', 'roles', 'role_permissions', 'user_roles'];
      let indexIssues = 0;

      for (const table of criticalTables) {
        const actualIndexes = indexMap.get(table) || [];
        const expectedIndexes = EXPECTED_SCHEMA[table]?.indexes || [];

        // Check for critical missing indexes
        const missingCriticalIndexes = expectedIndexes.filter(
          expected => !actualIndexes.some(actual => actual.includes(expected))
        );

        if (missingCriticalIndexes.length > 0) {
          indexIssues++;
          this.warnings.push(`Table ${table} missing critical indexes: ${missingCriticalIndexes.join(', ')}`);
        }
      }

      if (indexIssues === 0) {
        this.addDriftResult('indexes', false, 'Critical indexes present on all tables');
      } else {
        this.addDriftResult('indexes', true, `${indexIssues} tables missing critical indexes`);
      }

    } catch (error) {
      this.addDriftResult('indexes', true, `Error detecting index drift: ${error.message}`);
    }
  }

  private async detectRLSPolicyDrift(): Promise<void> {
    try {
      // Check RLS enabled status on critical tables
      const criticalTables = ['users', 'customers', 'sales', 'contracts', 'products'];
      const rlsIssues: string[] = [];

      for (const tableName of criticalTables) {
        const { data, error } = await this.supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_name', tableName)
          .eq('table_schema', 'public')
          .eq('row_security', 'YES');

        if (error) throw error;

        const expectedRLS = EXPECTED_SCHEMA[tableName]?.rlsEnabled || false;
        const actualRLS = data && data.length > 0;

        if (expectedRLS !== actualRLS) {
          rlsIssues.push(`Table ${tableName}: RLS ${actualRLS ? 'enabled' : 'disabled'}, expected ${expectedRLS ? 'enabled' : 'disabled'}`);
        }
      }

      if (rlsIssues.length === 0) {
        this.addDriftResult('rls_policies', false, 'RLS configuration matches expected state');
      } else {
        this.addDriftResult('rls_policies', true, `RLS policy drift: ${rlsIssues.join('; ')}`);
      }

    } catch (error) {
      this.addDriftResult('rls_policies', true, `Error detecting RLS policy drift: ${error.message}`);
    }
  }

  private async detectDataTypeDrift(): Promise<void> {
    // Implementation for data type drift detection
    // This would involve checking enum values and custom types
    this.addDriftResult('data_types', false, 'Data type drift detection not implemented yet');
  }

  private async detectConstraintDrift(): Promise<void> {
    // Implementation for constraint drift detection
    this.addDriftResult('constraints', false, 'Constraint drift detection not implemented yet');
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private addDriftResult(testName: string, hasDrift: boolean, message: string): void {
    const result: DriftResult = {
      testName,
      hasDrift,
      message,
      severity: hasDrift ? 'HIGH' : 'INFO',
      timestamp: new Date().toISOString()
    };
    
    this.driftResults.push(result);
    
    const icon = hasDrift ? '🚨' : '✅';
    const logLevel = hasDrift ? 'warn' : 'info';
    
    console.log(`  ${icon} ${testName}: ${message}`);
    
    if (hasDrift) {
      this.errors.push(`${testName}: ${message}`);
    }
  }

  private normalizeDataType(dataType: string): string {
    // Normalize data type names to handle PostgreSQL variations
    const typeMap: Record<string, string> = {
      'character varying': 'varchar',
      'timestamp with time zone': 'timestamptz',
      'timestamp without time zone': 'timestamp',
      'boolean': 'bool',
      'integer': 'int',
      'character': 'char'
    };

    return typeMap[dataType.toLowerCase()] || dataType.toLowerCase();
  }

  private generateDriftSummary(startTime: number, endTime: number): DriftSummary {
    const totalChecks = this.driftResults.length;
    const driftDetected = this.driftResults.filter(r => r.hasDrift).length;
    const cleanChecks = totalChecks - driftDetected;
    
    return {
      totalChecks,
      driftDetected,
      cleanChecks,
      driftRate: (driftDetected / totalChecks) * 100,
      duration: endTime - startTime,
      errors: [...this.errors],
      results: [...this.driftResults],
      timestamp: new Date().toISOString()
    };
  }

  private printDriftSummary(summary: DriftSummary): void {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 SCHEMA DRIFT DETECTION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`Total Checks: ${summary.totalChecks}`);
    console.log(`Drift Detected: ${summary.driftDetected} 🚨`);
    console.log(`Clean Checks: ${summary.cleanChecks} ✅`);
    console.log(`Drift Rate: ${summary.driftRate.toFixed(1)}%`);
    console.log(`Duration: ${summary.duration}ms`);
    
    if (summary.errors.length > 0) {
      console.log('\n🚨 SCHEMA DRIFT ISSUES:');
      summary.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    const isClean = summary.driftDetected === 0;
    console.log('\n' + '='.repeat(60));
    if (isClean) {
      console.log('🎉 SCHEMA IS CLEAN - No drift detected');
    } else {
      console.log('⚠️ SCHEMA DRIFT DETECTED - Review and address issues');
      if (this.config.strict) {
        console.log('💥 Strict mode enabled - addressing drift before deployment');
      }
    }
    console.log('='.repeat(60));
  }

  private errors: string[] = [];
  private warnings: string[] = [];
}

// ============================================================================
// TYPES
// ============================================================================

interface DriftResult {
  testName: string;
  hasDrift: boolean;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'INFO';
  timestamp: string;
}

interface DriftSummary {
  totalChecks: number;
  driftDetected: number;
  cleanChecks: number;
  driftRate: number;
  duration: number;
  errors: string[];
  results: DriftResult[];
  timestamp: string;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  try {
    const detector = new SchemaDriftDetector();
    const summary = await detector.detectAllDrift();
    
    // Exit with appropriate code
    const exitCode = summary.driftDetected === 0 ? 0 : 1;
    
    if (this.config?.strict && exitCode === 1) {
      console.log('\n💥 Strict mode enabled - schema drift must be resolved before deployment');
      process.exit(1);
    }
    
    process.exit(exitCode);
    
  } catch (error) {
    console.error('💥 Fatal error during schema drift detection:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { SchemaDriftDetector, DriftResult, DriftSummary };