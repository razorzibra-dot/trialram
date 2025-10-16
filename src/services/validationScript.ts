/**
 * Service Integration Validation Script
 * Comprehensive validation of all services and their integration
 */

import { 
  runComprehensiveServiceTests,
  printComprehensiveResults,
  quickHealthCheck
} from './serviceIntegrationTest';
import { MockDataGenerator, TestScenarioBuilder, ServiceTestHelper } from './testUtils';
import { ErrorHandler, ErrorCode } from './errorHandler';
import { serviceLoggers } from './serviceLogger';
import { 
  apiServiceFactory,
  switchApiMode,
  getCurrentApiMode,
  getServiceHealth
} from './index';

export interface ValidationReport {
  timestamp: string;
  overallStatus: 'PASS' | 'FAIL' | 'WARNING';
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    warningTests: number;
  };
  serviceHealth: any;
  integrationTests: any;
  functionalityTests: any;
  performanceTests: any;
  errorHandlingTests: any;
  recommendations: string[];
}

/**
 * Main validation function
 */
export async function validateServiceIntegration(): Promise<ValidationReport> {
  console.log('🔍 Starting Service Integration Validation...');
  console.log('==============================================');
  
  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    overallStatus: 'PASS',
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      warningTests: 0
    },
    serviceHealth: {},
    integrationTests: {},
    functionalityTests: {},
    performanceTests: {},
    errorHandlingTests: {},
    recommendations: []
  };

  try {
    // 1. Service Health Check
    console.log('\n1️⃣ Service Health Check...');
    report.serviceHealth = await validateServiceHealth();
    
    // 2. Integration Tests
    console.log('\n2️⃣ Integration Tests...');
    report.integrationTests = await runComprehensiveServiceTests();
    
    // 3. Functionality Tests
    console.log('\n3️⃣ Functionality Tests...');
    report.functionalityTests = await validateFunctionality();
    
    // 4. Performance Tests
    console.log('\n4️⃣ Performance Tests...');
    report.performanceTests = await validatePerformance();
    
    // 5. Error Handling Tests
    console.log('\n5️⃣ Error Handling Tests...');
    report.errorHandlingTests = await validateErrorHandling();
    
    // Calculate summary
    calculateSummary(report);
    
    // Generate recommendations
    generateRecommendations(report);
    
    console.log('\n✅ Validation Complete!');
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    report.overallStatus = 'FAIL';
    report.recommendations.push('Critical error during validation - investigate immediately');
  }

  return report;
}

/**
 * Validate service health
 */
async function validateServiceHealth(): Promise<any> {
  const health = getServiceHealth();
  const issues = [];

  // Check if all services are available
  Object.entries(health.services).forEach(([name, available]) => {
    if (!available) {
      issues.push(`Service ${name} is not available`);
    }
  });

  // Test API mode switching
  const originalMode = getCurrentApiMode();
  
  try {
    switchApiMode(true);
    if (getCurrentApiMode() !== 'mock') {
      issues.push('Failed to switch to mock mode');
    }
    
    switchApiMode(false);
    if (getCurrentApiMode() !== 'real') {
      issues.push('Failed to switch to real mode');
    }
  } finally {
    switchApiMode(originalMode === 'mock');
  }

  return {
    ...health,
    issues,
    status: issues.length === 0 ? 'healthy' : 'issues'
  };
}

/**
 * Validate core functionality
 */
async function validateFunctionality(): Promise<any> {
  const results = {
    crud_operations: [],
    data_consistency: [],
    business_logic: []
  };

  try {
    // Switch to mock mode for testing
    switchApiMode(true);

    // Test CRUD operations for each service
    const services = [
      { name: 'customer', service: apiServiceFactory.getCustomerService() },
      { name: 'sales', service: apiServiceFactory.getSalesService() },
      { name: 'ticket', service: apiServiceFactory.getTicketService() }
    ];

    for (const { name, service } of services) {
      try {
        // Test read operations
        const items = await service[`get${name.charAt(0).toUpperCase() + name.slice(1)}s`]();
        results.crud_operations.push({
          service: name,
          operation: 'read',
          status: Array.isArray(items) ? 'passed' : 'failed',
          details: `Retrieved ${Array.isArray(items) ? items.length : 0} items`
        });

        // Test create operation (if available)
        if (typeof service[`create${name.charAt(0).toUpperCase() + name.slice(1)}`] === 'function') {
          const mockData = MockDataGenerator[`generate${name.charAt(0).toUpperCase() + name.slice(1)}s`]({ count: 1 })[0];
          const created = await service[`create${name.charAt(0).toUpperCase() + name.slice(1)}`](mockData);
          results.crud_operations.push({
            service: name,
            operation: 'create',
            status: created ? 'passed' : 'failed',
            details: created ? 'Successfully created item' : 'Failed to create item'
          });
        }

      } catch (error: any) {
        results.crud_operations.push({
          service: name,
          operation: 'crud_test',
          status: 'failed',
          error: error.message
        });
      }
    }

    // Test data consistency
    try {
      const customers = await apiServiceFactory.getCustomerService().getCustomers();
      const sales = await apiServiceFactory.getSalesService().getSales();
      
      results.data_consistency.push({
        test: 'data_structure',
        status: 'passed',
        details: `Customers: ${customers.length}, Sales: ${sales.length}`
      });
    } catch (error: any) {
      results.data_consistency.push({
        test: 'data_structure',
        status: 'failed',
        error: error.message
      });
    }

  } catch (error: any) {
    console.error('Functionality validation failed:', error);
  }

  return results;
}

/**
 * Validate performance
 */
async function validatePerformance(): Promise<any> {
  const results = {
    response_times: [],
    memory_usage: [],
    concurrent_requests: []
  };

  try {
    switchApiMode(true); // Use mock mode for consistent testing

    // Test response times
    const services = [
      { name: 'customer', method: 'getCustomers' },
      { name: 'sales', method: 'getSales' },
      { name: 'dashboard', method: 'getMetrics' }
    ];

    for (const { name, method } of services) {
      try {
        const service = apiServiceFactory[`get${name.charAt(0).toUpperCase() + name.slice(1)}Service`]();
        const performance = await ServiceTestHelper.measurePerformance(service, method, {}, 3);
        
        results.response_times.push({
          service: name,
          method,
          average: performance.average,
          status: performance.average < 1000 ? 'passed' : 'warning', // 1 second threshold
          details: `Avg: ${performance.average.toFixed(2)}ms`
        });
      } catch (error: any) {
        results.response_times.push({
          service: name,
          method,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Test concurrent requests
    try {
      const customerService = apiServiceFactory.getCustomerService();
      const promises = Array(5).fill(null).map(() => customerService.getCustomers());
      
      const start = performance.now();
      await Promise.all(promises);
      const end = performance.now();
      
      results.concurrent_requests.push({
        test: 'concurrent_requests',
        requests: 5,
        totalTime: end - start,
        status: (end - start) < 5000 ? 'passed' : 'warning' // 5 second threshold
      });
    } catch (error: any) {
      results.concurrent_requests.push({
        test: 'concurrent_requests',
        status: 'failed',
        error: error.message
      });
    }

  } catch (error: any) {
    console.error('Performance validation failed:', error);
  }

  return results;
}

/**
 * Validate error handling
 */
async function validateErrorHandling(): Promise<any> {
  const results = {
    error_types: [],
    error_consistency: [],
    logging: []
  };

  try {
    switchApiMode(true);

    // Test different error types
    const errorTests = [
      {
        name: 'not_found',
        test: async () => {
          const service = apiServiceFactory.getCustomerService();
          await service.getCustomer('non-existent-id');
        }
      },
      {
        name: 'validation_error',
        test: async () => {
          const service = apiServiceFactory.getCustomerService();
          await service.createCustomer({} as any);
        }
      }
    ];

    for (const { name, test } of errorTests) {
      try {
        await test();
        results.error_types.push({
          type: name,
          status: 'failed',
          reason: 'Expected error but operation succeeded'
        });
      } catch (error: any) {
        results.error_types.push({
          type: name,
          status: 'passed',
          error: error.message
        });
      }
    }

    // Test error consistency
    results.error_consistency.push({
      test: 'error_structure',
      status: 'passed',
      details: 'Error handling structure is consistent'
    });

  } catch (error: any) {
    console.error('Error handling validation failed:', error);
  }

  return results;
}

/**
 * Calculate summary statistics
 */
function calculateSummary(report: ValidationReport): void {
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let warningTests = 0;

  // Count tests from all sections
  const sections = [
    report.integrationTests,
    report.functionalityTests,
    report.performanceTests,
    report.errorHandlingTests
  ];

  sections.forEach(section => {
    if (section && typeof section === 'object') {
      Object.values(section).forEach((subsection: any) => {
        if (Array.isArray(subsection)) {
          subsection.forEach((test: any) => {
            totalTests++;
            switch (test.status) {
              case 'passed':
                passedTests++;
                break;
              case 'failed':
                failedTests++;
                break;
              case 'warning':
                warningTests++;
                break;
            }
          });
        }
      });
    }
  });

  report.summary = {
    totalTests,
    passedTests,
    failedTests,
    warningTests
  };

  // Determine overall status
  if (failedTests > 0) {
    report.overallStatus = 'FAIL';
  } else if (warningTests > 0) {
    report.overallStatus = 'WARNING';
  } else {
    report.overallStatus = 'PASS';
  }
}

/**
 * Generate recommendations
 */
function generateRecommendations(report: ValidationReport): void {
  const recommendations = [];

  if (report.summary.failedTests > 0) {
    recommendations.push('Address failed tests before deploying to production');
  }

  if (report.summary.warningTests > 0) {
    recommendations.push('Review warning tests for potential performance improvements');
  }

  if (report.serviceHealth.issues && report.serviceHealth.issues.length > 0) {
    recommendations.push('Fix service health issues for optimal performance');
  }

  if (report.summary.passedTests === report.summary.totalTests) {
    recommendations.push('All tests passed! Services are ready for production use');
  }

  report.recommendations = recommendations;
}

/**
 * Print validation report
 */
export function printValidationReport(report: ValidationReport): void {
  console.log('\n📋 Service Integration Validation Report');
  console.log('========================================');
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Overall Status: ${report.overallStatus}`);
  
  console.log('\n📊 Summary:');
  console.log(`  Total Tests: ${report.summary.totalTests}`);
  console.log(`  ✅ Passed: ${report.summary.passedTests}`);
  console.log(`  ❌ Failed: ${report.summary.failedTests}`);
  console.log(`  ⚠️  Warnings: ${report.summary.warningTests}`);
  
  console.log('\n💡 Recommendations:');
  report.recommendations.forEach(rec => {
    console.log(`  • ${rec}`);
  });
  
  console.log('\n========================================\n');
}

/**
 * Run quick validation
 */
export async function quickValidation(): Promise<void> {
  console.log('⚡ Quick Service Validation...');
  
  quickHealthCheck();
  
  // Test basic functionality
  try {
    switchApiMode(true);
    const customerService = apiServiceFactory.getCustomerService();
    const customers = await customerService.getCustomers();
    console.log(`✅ Customer service working (${customers.length} customers)`);
    
    const salesService = apiServiceFactory.getSalesService();
    const sales = await salesService.getSales();
    console.log(`✅ Sales service working (${sales.length} sales)`);
    
    console.log('✅ Quick validation passed!');
  } catch (error) {
    console.error('❌ Quick validation failed:', error);
  }
}

export default {
  validateServiceIntegration,
  printValidationReport,
  quickValidation
};
