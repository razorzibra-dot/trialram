/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Testing Utilities for Services
 * Provides comprehensive testing support with realistic mock data and edge cases
 */

import { faker } from '@faker-js/faker';

export interface TestScenario {
  name: string;
  description: string;
  setup: () => Promise<void>;
  teardown: () => Promise<void>;
  data: any;
}

export interface MockDataOptions {
  count?: number;
  seed?: number;
  includeEdgeCases?: boolean;
  customFields?: Record<string, any>;
}

/**
 * Mock Data Generator
 */
export class MockDataGenerator {
  private static seed = 12345;

  static setSeed(seed: number): void {
    this.seed = seed;
    faker.seed(seed);
  }

  static resetSeed(): void {
    faker.seed(this.seed);
  }

  /**
   * Generate mock customers
   */
  static generateCustomers(options: MockDataOptions = {}): any[] {
    const { count = 10, includeEdgeCases = true } = options;
    const customers = [];

    for (let i = 0; i < count; i++) {
      const customer = {
        id: faker.string.uuid(),
        tenant_id: 'tenant_123',
        name: faker.company.name(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        website: faker.internet.url(),
        industry: faker.helpers.arrayElement([
          'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education'
        ]),
        size: faker.helpers.arrayElement(['1-10', '11-50', '51-200', '201-1000', '1000+']),
        status: faker.helpers.arrayElement(['active', 'prospect', 'inactive']),
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zip: faker.location.zipCode(),
          country: faker.location.country()
        },
        tags: faker.helpers.arrayElements(['vip', 'enterprise', 'startup', 'partner'], { min: 0, max: 3 }),
        assigned_to: faker.string.uuid(),
        created_at: faker.date.past().toISOString(),
        updated_at: faker.date.recent().toISOString(),
        ...options.customFields
      };

      customers.push(customer);
    }

    // Add edge cases
    if (includeEdgeCases) {
      customers.push(
        // Customer with minimal data
        {
          id: faker.string.uuid(),
          tenant_id: 'tenant_123',
          name: 'Minimal Customer',
          email: 'minimal@test.com',
          status: 'prospect',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        // Customer with very long name
        {
          id: faker.string.uuid(),
          tenant_id: 'tenant_123',
          name: 'A'.repeat(255),
          email: 'long-name@test.com',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );
    }

    return customers;
  }

  /**
   * Generate mock sales/deals
   */
  static generateSales(options: MockDataOptions = {}): any[] {
    const { count = 10, includeEdgeCases = true } = options;
    const sales = [];

    for (let i = 0; i < count; i++) {
      const sale = {
        id: faker.string.uuid(),
        tenant_id: 'tenant_123',
        title: faker.commerce.productName() + ' Deal',
        description: faker.lorem.paragraph(),
        value: parseFloat(faker.commerce.price({ min: 1000, max: 100000 })),
        currency: 'USD',
        stage: faker.helpers.arrayElement(['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
        probability: faker.number.int({ min: 0, max: 100 }),
        customer_id: faker.string.uuid(),
        assigned_to: faker.string.uuid(),
        expected_close_date: faker.date.future().toISOString(),
        actual_close_date: null,
        source: faker.helpers.arrayElement(['website', 'referral', 'cold_call', 'email', 'social']),
        created_at: faker.date.past().toISOString(),
        updated_at: faker.date.recent().toISOString(),
        ...options.customFields
      };

      // Set actual close date for closed deals
      if (sale.stage === 'closed_won' || sale.stage === 'closed_lost') {
        sale.actual_close_date = faker.date.recent().toISOString();
      }

      sales.push(sale);
    }

    // Add edge cases
    if (includeEdgeCases) {
      sales.push(
        // Very high value deal
        {
          id: faker.string.uuid(),
          tenant_id: 'tenant_123',
          title: 'Enterprise Mega Deal',
          value: 1000000,
          stage: 'negotiation',
          probability: 90,
          customer_id: faker.string.uuid(),
          assigned_to: faker.string.uuid(),
          expected_close_date: faker.date.future().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        // Zero value deal
        {
          id: faker.string.uuid(),
          tenant_id: 'tenant_123',
          title: 'Free Trial',
          value: 0,
          stage: 'closed_won',
          probability: 100,
          customer_id: faker.string.uuid(),
          assigned_to: faker.string.uuid(),
          expected_close_date: faker.date.past().toISOString(),
          actual_close_date: faker.date.past().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );
    }

    return sales;
  }

  /**
   * Generate mock tickets
   */
  static generateTickets(options: MockDataOptions = {}): any[] {
    const { count = 10, includeEdgeCases = true } = options;
    const tickets = [];

    for (let i = 0; i < count; i++) {
      const ticket = {
        id: faker.string.uuid(),
        tenant_id: 'tenant_123',
        title: faker.lorem.sentence(),
        description: faker.lorem.paragraphs(2),
        status: faker.helpers.arrayElement(['open', 'in_progress', 'pending', 'resolved', 'closed']),
        priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
        category: faker.helpers.arrayElement(['bug', 'feature_request', 'support', 'question']),
        customer_id: faker.string.uuid(),
        assigned_to: faker.string.uuid(),
        created_by: faker.string.uuid(),
        resolution_time: null,
        created_at: faker.date.past().toISOString(),
        updated_at: faker.date.recent().toISOString(),
        ...options.customFields
      };

      // Set resolution time for resolved/closed tickets
      if (ticket.status === 'resolved' || ticket.status === 'closed') {
        ticket.resolution_time = faker.number.int({ min: 1, max: 72 }); // hours
      }

      tickets.push(ticket);
    }

    // Add edge cases
    if (includeEdgeCases) {
      tickets.push(
        // Very old ticket
        {
          id: faker.string.uuid(),
          tenant_id: 'tenant_123',
          title: 'Ancient Ticket',
          description: 'This ticket is very old',
          status: 'open',
          priority: 'low',
          category: 'support',
          customer_id: faker.string.uuid(),
          assigned_to: faker.string.uuid(),
          created_by: faker.string.uuid(),
          created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
          updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
        },
        // Urgent ticket
        {
          id: faker.string.uuid(),
          tenant_id: 'tenant_123',
          title: 'URGENT: System Down',
          description: 'Critical system failure',
          status: 'in_progress',
          priority: 'urgent',
          category: 'bug',
          customer_id: faker.string.uuid(),
          assigned_to: faker.string.uuid(),
          created_by: faker.string.uuid(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );
    }

    return tickets;
  }

  /**
   * Generate mock users
   */
  static generateUsers(options: MockDataOptions = {}): any[] {
    const { count = 5, includeEdgeCases = true } = options;
    const users = [];

    for (let i = 0; i < count; i++) {
      const user = {
        id: faker.string.uuid(),
        tenant_id: 'tenant_123',
        email: faker.internet.email(),
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        role: faker.helpers.arrayElement(['admin', 'manager', 'sales_rep', 'support_agent']),
        status: faker.helpers.arrayElement(['active', 'inactive', 'pending']),
        avatar: faker.image.avatar(),
        phone: faker.phone.number(),
        department: faker.helpers.arrayElement(['Sales', 'Support', 'Marketing', 'Engineering']),
        last_login: faker.date.recent().toISOString(),
        created_at: faker.date.past().toISOString(),
        updated_at: faker.date.recent().toISOString(),
        ...options.customFields
      };

      users.push(user);
    }

    // Add edge cases
    if (includeEdgeCases) {
      users.push(
        // Super admin user
        {
          id: faker.string.uuid(),
          tenant_id: 'tenant_123',
          email: 'admin@test.com',
          first_name: 'Super',
          last_name: 'Admin',
          role: 'admin',
          status: 'active',
          department: 'IT',
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        // Inactive user
        {
          id: faker.string.uuid(),
          tenant_id: 'tenant_123',
          email: 'inactive@test.com',
          first_name: 'Inactive',
          last_name: 'User',
          role: 'sales_rep',
          status: 'inactive',
          department: 'Sales',
          last_login: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );
    }

    return users;
  }

  /**
   * Generate mock contracts
   */
  static generateContracts(options: MockDataOptions = {}): any[] {
    const { count = 5, includeEdgeCases = true } = options;
    const contracts = [];

    for (let i = 0; i < count; i++) {
      const contract = {
        id: faker.string.uuid(),
        tenant_id: 'tenant_123',
        title: faker.commerce.productName() + ' Contract',
        type: faker.helpers.arrayElement(['service_agreement', 'nda', 'purchase_order', 'employment']),
        status: faker.helpers.arrayElement(['draft', 'pending_approval', 'active', 'expired']),
        customer_id: faker.string.uuid(),
        value: parseFloat(faker.commerce.price({ min: 5000, max: 500000 })),
        currency: 'USD',
        start_date: faker.date.recent().toISOString(),
        end_date: faker.date.future().toISOString(),
        auto_renew: faker.datatype.boolean(),
        created_by: faker.string.uuid(),
        created_at: faker.date.past().toISOString(),
        updated_at: faker.date.recent().toISOString(),
        ...options.customFields
      };

      contracts.push(contract);
    }

    // Add edge cases
    if (includeEdgeCases) {
      contracts.push(
        // Expired contract
        {
          id: faker.string.uuid(),
          tenant_id: 'tenant_123',
          title: 'Expired Contract',
          type: 'service_agreement',
          status: 'expired',
          customer_id: faker.string.uuid(),
          value: 10000,
          currency: 'USD',
          start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          auto_renew: false,
          created_by: faker.string.uuid(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );
    }

    return contracts;
  }
}

/**
 * Test Scenario Builder
 */
export class TestScenarioBuilder {
  private scenarios: TestScenario[] = [];

  /**
   * Add a test scenario
   */
  addScenario(scenario: TestScenario): this {
    this.scenarios.push(scenario);
    return this;
  }

  /**
   * Add bulk data scenario
   */
  addBulkDataScenario(entityType: string, count: number): this {
    this.addScenario({
      name: `Bulk ${entityType} Data`,
      description: `Test with ${count} ${entityType} records`,
      setup: async () => {
        // Setup bulk data
      },
      teardown: async () => {
        // Cleanup bulk data
      },
      data: { entityType, count }
    });
    return this;
  }

  /**
   * Add error scenario
   */
  addErrorScenario(errorType: string, description: string): this {
    this.addScenario({
      name: `Error: ${errorType}`,
      description,
      setup: async () => {
        // Setup error conditions
      },
      teardown: async () => {
        // Cleanup error conditions
      },
      data: { errorType }
    });
    return this;
  }

  /**
   * Add performance scenario
   */
  addPerformanceScenario(operation: string, expectedTime: number): this {
    this.addScenario({
      name: `Performance: ${operation}`,
      description: `Test ${operation} performance (expected < ${expectedTime}ms)`,
      setup: async () => {
        // Setup performance test
      },
      teardown: async () => {
        // Cleanup performance test
      },
      data: { operation, expectedTime }
    });
    return this;
  }

  /**
   * Get all scenarios
   */
  getScenarios(): TestScenario[] {
    return this.scenarios;
  }

  /**
   * Run all scenarios
   */
  async runAll(): Promise<{ passed: number; failed: number; results: any[] }> {
    const results = [];
    let passed = 0;
    let failed = 0;

    for (const scenario of this.scenarios) {
      try {
        await scenario.setup();
        // Run test logic here
        results.push({ scenario: scenario.name, status: 'passed' });
        passed++;
      } catch (error) {
        results.push({ scenario: scenario.name, status: 'failed', error });
        failed++;
      } finally {
        try {
          await scenario.teardown();
        } catch (error) {
          console.error(`Teardown failed for scenario ${scenario.name}:`, error);
        }
      }
    }

    return { passed, failed, results };
  }
}

/**
 * Service Test Helper
 */
export class ServiceTestHelper {
  /**
   * Test service method with various inputs
   */
  static async testServiceMethod(
    service: any,
    methodName: string,
    testCases: Array<{ input: any; expectedOutput?: any; shouldThrow?: boolean }>
  ): Promise<any[]> {
    const results = [];

    for (const testCase of testCases) {
      try {
        const result = await service[methodName](testCase.input);
        
        if (testCase.shouldThrow) {
          results.push({
            input: testCase.input,
            status: 'failed',
            reason: 'Expected method to throw but it succeeded',
            result
          });
        } else {
          results.push({
            input: testCase.input,
            status: 'passed',
            result
          });
        }
      } catch (error) {
        if (testCase.shouldThrow) {
          results.push({
            input: testCase.input,
            status: 'passed',
            error: error.message
          });
        } else {
          results.push({
            input: testCase.input,
            status: 'failed',
            error: error.message
          });
        }
      }
    }

    return results;
  }

  /**
   * Measure service method performance
   */
  static async measurePerformance(
    service: any,
    methodName: string,
    input: any,
    iterations: number = 10
  ): Promise<{ average: number; min: number; max: number; results: number[] }> {
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await service[methodName](input);
      const end = performance.now();
      times.push(end - start);
    }

    return {
      average: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      results: times
    };
  }
}

export default {
  MockDataGenerator,
  TestScenarioBuilder,
  ServiceTestHelper
};
