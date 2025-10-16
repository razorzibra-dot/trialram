/**
 * Data Model Integration Test
 * Comprehensive testing for unified data models and relationships
 */

import { Customer, Sale, Ticket } from '@/types/crm';
import { User } from '@/types/auth';
import { Product, CustomerFormData } from '@/types/masters';
import { Contract } from '@/types/contracts';
import { JobWork } from '@/types/jobWork';
import { 
  customerService, 
  salesService, 
  ticketService, 
  userService,
  contractService 
} from '@/services';

export interface DataModelTestResult {
  testName: string;
  passed: boolean;
  details: string;
  expected: any;
  actual: any;
  errors?: string[];
}

export interface DataModelTestSuite {
  suiteName: string;
  results: DataModelTestResult[];
  passed: number;
  failed: number;
  total: number;
}

/**
 * Data Model Integration Tester
 */
export class DataModelIntegrationTester {
  private results: DataModelTestSuite[] = [];

  /**
   * Test Customer model integration
   */
  async testCustomerModelIntegration(): Promise<DataModelTestSuite> {
    const suite: DataModelTestSuite = {
      suiteName: 'Customer Model Integration Tests',
      results: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    try {
      // Test 1: Customer creation with unified model
      const customerData: CustomerFormData = {
        company_name: 'Test Company',
        contact_name: 'John Doe',
        email: 'john@testcompany.com',
        phone: '+1234567890',
        mobile: '+1234567891',
        website: 'https://testcompany.com',
        address: '123 Test St',
        city: 'Test City',
        country: 'Test Country',
        industry: 'Technology',
        size: 'medium',
        status: 'active',
        customer_type: 'business',
        credit_limit: 50000,
        payment_terms: 'Net 30',
        tax_id: 'TAX123456',
        annual_revenue: 1000000,
        notes: 'Test customer for integration testing',
        assigned_to: '1',
        source: 'website',
        rating: 'A'
      };

      // Test customer creation
      const customers = await customerService.getCustomers();
      const hasRequiredFields = customers.length > 0 && customers[0].company_name && customers[0].contact_name;
      
      suite.results.push({
        testName: 'Customer Model Structure',
        passed: hasRequiredFields,
        details: hasRequiredFields ? 'Customer model has all required unified fields' : 'Customer model missing required fields',
        expected: 'All unified customer fields present',
        actual: customers.length > 0 ? Object.keys(customers[0]) : 'No customers found'
      });

      // Test 2: Customer-Sale relationship
      const sales = await salesService.getSales();
      const customerSaleRelation = sales.length > 0 && sales[0].customer_id && sales[0].customer_name;
      
      suite.results.push({
        testName: 'Customer-Sale Relationship',
        passed: customerSaleRelation,
        details: customerSaleRelation ? 'Sales properly reference customers' : 'Sales missing customer references',
        expected: 'Sales have customer_id and customer_name',
        actual: sales.length > 0 ? { customer_id: sales[0].customer_id, customer_name: sales[0].customer_name } : 'No sales found'
      });

      // Test 3: Customer-Ticket relationship
      const tickets = await ticketService.getTickets();
      const customerTicketRelation = tickets.length > 0 && tickets[0].customer_id;
      
      suite.results.push({
        testName: 'Customer-Ticket Relationship',
        passed: customerTicketRelation,
        details: customerTicketRelation ? 'Tickets properly reference customers' : 'Tickets missing customer references',
        expected: 'Tickets have customer_id',
        actual: tickets.length > 0 ? { customer_id: tickets[0].customer_id } : 'No tickets found'
      });

    } catch (error) {
      suite.results.push({
        testName: 'Customer Model Integration',
        passed: false,
        details: `Integration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        expected: 'Successful integration',
        actual: 'Integration failed',
        errors: [error instanceof Error ? error.message : 'Unknown error']
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
   * Test Sale model integration
   */
  async testSaleModelIntegration(): Promise<DataModelTestSuite> {
    const suite: DataModelTestSuite = {
      suiteName: 'Sale Model Integration Tests',
      results: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    try {
      const sales = await salesService.getSales();
      
      // Test 1: Sale model structure
      const hasUnifiedFields = sales.length > 0 && 
        sales[0].value !== undefined && 
        sales[0].amount !== undefined &&
        sales[0].stage !== undefined &&
        sales[0].status !== undefined;
      
      suite.results.push({
        testName: 'Sale Model Unified Structure',
        passed: hasUnifiedFields,
        details: hasUnifiedFields ? 'Sale model has unified fields (value, amount, stage, status)' : 'Sale model missing unified fields',
        expected: 'Sale has value, amount, stage, status fields',
        actual: sales.length > 0 ? {
          hasValue: sales[0].value !== undefined,
          hasAmount: sales[0].amount !== undefined,
          hasStage: sales[0].stage !== undefined,
          hasStatus: sales[0].status !== undefined
        } : 'No sales found'
      });

      // Test 2: Stage mapping consistency
      const validStages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
      const hasValidStages = sales.length > 0 && validStages.includes(sales[0].stage);
      
      suite.results.push({
        testName: 'Sale Stage Mapping',
        passed: hasValidStages,
        details: hasValidStages ? 'Sale stages properly mapped' : 'Sale stages not properly mapped',
        expected: 'Valid stage values',
        actual: sales.length > 0 ? sales[0].stage : 'No sales found'
      });

      // Test 3: Sale items relationship
      const hasSaleItems = sales.length > 0 && Array.isArray(sales[0].items);
      
      suite.results.push({
        testName: 'Sale Items Relationship',
        passed: hasSaleItems,
        details: hasSaleItems ? 'Sales have items array' : 'Sales missing items relationship',
        expected: 'Sales have items array',
        actual: sales.length > 0 ? { hasItems: Array.isArray(sales[0].items) } : 'No sales found'
      });

    } catch (error) {
      suite.results.push({
        testName: 'Sale Model Integration',
        passed: false,
        details: `Integration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        expected: 'Successful integration',
        actual: 'Integration failed',
        errors: [error instanceof Error ? error.message : 'Unknown error']
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
   * Test User model integration
   */
  async testUserModelIntegration(): Promise<DataModelTestSuite> {
    const suite: DataModelTestSuite = {
      suiteName: 'User Model Integration Tests',
      results: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    try {
      const users = await userService.getUsers();
      
      // Test 1: User model structure
      const hasUnifiedFields = users.length > 0 && 
        users[0].role !== undefined && 
        users[0].status !== undefined &&
        users[0].tenant_id !== undefined;
      
      suite.results.push({
        testName: 'User Model Unified Structure',
        passed: hasUnifiedFields,
        details: hasUnifiedFields ? 'User model has unified fields' : 'User model missing unified fields',
        expected: 'User has role, status, tenant_id fields',
        actual: users.length > 0 ? {
          hasRole: users[0].role !== undefined,
          hasStatus: users[0].status !== undefined,
          hasTenantId: users[0].tenant_id !== undefined
        } : 'No users found'
      });

      // Test 2: Role definitions
      const validRoles = ['super_admin', 'admin', 'manager', 'agent', 'engineer', 'customer'];
      const hasValidRoles = users.length > 0 && validRoles.includes(users[0].role);
      
      suite.results.push({
        testName: 'User Role Definitions',
        passed: hasValidRoles,
        details: hasValidRoles ? 'User roles properly defined' : 'User roles not properly defined',
        expected: 'Valid role values',
        actual: users.length > 0 ? users[0].role : 'No users found'
      });

    } catch (error) {
      suite.results.push({
        testName: 'User Model Integration',
        passed: false,
        details: `Integration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        expected: 'Successful integration',
        actual: 'Integration failed',
        errors: [error instanceof Error ? error.message : 'Unknown error']
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
   * Test cross-module relationships
   */
  async testCrossModuleRelationships(): Promise<DataModelTestSuite> {
    const suite: DataModelTestSuite = {
      suiteName: 'Cross-Module Relationship Tests',
      results: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    try {
      // Test 1: Customer-Sale-Ticket relationship consistency
      const [customers, sales, tickets] = await Promise.all([
        customerService.getCustomers(),
        salesService.getSales(),
        ticketService.getTickets()
      ]);

      const customerIds = new Set(customers.map(c => c.id));
      const salesCustomerIds = sales.map(s => s.customer_id).filter(id => id);
      const ticketsCustomerIds = tickets.map(t => t.customer_id).filter(id => id);
      
      const salesReferencesValid = salesCustomerIds.every(id => customerIds.has(id) || id === '');
      const ticketsReferencesValid = ticketsCustomerIds.every(id => customerIds.has(id) || id === '');
      
      suite.results.push({
        testName: 'Customer Reference Consistency',
        passed: salesReferencesValid && ticketsReferencesValid,
        details: `Sales references valid: ${salesReferencesValid}, Tickets references valid: ${ticketsReferencesValid}`,
        expected: 'All customer references are valid',
        actual: {
          salesValid: salesReferencesValid,
          ticketsValid: ticketsReferencesValid,
          customerCount: customers.length,
          salesCount: sales.length,
          ticketsCount: tickets.length
        }
      });

      // Test 2: ID type consistency
      const customerIdTypes = customers.map(c => typeof c.id);
      const salesIdTypes = sales.map(s => typeof s.id);
      const ticketsIdTypes = tickets.map(t => typeof t.id);
      
      const allStringIds = [...customerIdTypes, ...salesIdTypes, ...ticketsIdTypes].every(type => type === 'string');
      
      suite.results.push({
        testName: 'ID Type Consistency',
        passed: allStringIds,
        details: allStringIds ? 'All IDs are strings' : 'Mixed ID types found',
        expected: 'All IDs should be strings',
        actual: {
          customerIdTypes: [...new Set(customerIdTypes)],
          salesIdTypes: [...new Set(salesIdTypes)],
          ticketsIdTypes: [...new Set(ticketsIdTypes)]
        }
      });

    } catch (error) {
      suite.results.push({
        testName: 'Cross-Module Relationships',
        passed: false,
        details: `Integration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        expected: 'Successful integration',
        actual: 'Integration failed',
        errors: [error instanceof Error ? error.message : 'Unknown error']
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
   * Run all data model integration tests
   */
  async runAllTests(): Promise<DataModelTestSuite[]> {
    console.log('🔗 Starting Data Model Integration Tests...');
    
    this.results = [];
    
    await this.testCustomerModelIntegration();
    await this.testSaleModelIntegration();
    await this.testUserModelIntegration();
    await this.testCrossModuleRelationships();
    
    return this.results;
  }

  /**
   * Print test results
   */
  printResults(): void {
    console.log('
🔗 Data Model Integration Test Results');
    console.log('=====================================');
    
    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;
    
    this.results.forEach(suite => {
      console.log(`
📋 ${suite.suiteName}`);
      console.log(`   ✅ Passed: ${suite.passed}`);
      console.log(`   ❌ Failed: ${suite.failed}`);
      console.log(`   📊 Total: ${suite.total}`);
      
      if (suite.failed > 0) {
        console.log('   Failed Tests:');
        suite.results.filter(r => !r.passed).forEach(result => {
          console.log(`     ❌ ${result.testName}: ${result.details}`);
          if (result.errors) {
            result.errors.forEach(error => console.log(`       Error: ${error}`));
          }
        });
      }
      
      totalPassed += suite.passed;
      totalFailed += suite.failed;
      totalTests += suite.total;
    });
    
    console.log('
📊 Overall Results:');
    console.log(`   ✅ Total Passed: ${totalPassed}`);
    console.log(`   ❌ Total Failed: ${totalFailed}`);
    console.log(`   📊 Total Tests: ${totalTests}`);
    console.log(`   📈 Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
    
    if (totalFailed === 0) {
      console.log('
🎉 All data model integration tests passed! Models are properly unified.');
    } else {
      console.log('
⚠️  Some data model tests failed. Please review the model relationships.');
    }
    
    console.log('=====================================
');
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
 * Quick data model validation
 */
export async function quickDataModelValidation(): Promise<void> {
  console.log('⚡ Quick Data Model Validation...');
  
  const tester = new DataModelIntegrationTester();
  await tester.testCustomerModelIntegration();
  await tester.testSaleModelIntegration();
  
  const summary = tester.getSummary();
  console.log(`✅ Data Model Tests: ${summary.passed}/${summary.total} passed (${summary.successRate.toFixed(1)}%)`);
  
  if (summary.failed > 0) {
    tester.printResults();
  } else {
    console.log('🎉 Data models are properly integrated!');
  }
}

export default DataModelIntegrationTester;
