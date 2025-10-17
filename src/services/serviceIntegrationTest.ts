/**
 * Service Integration Test
 * Validates that all services are properly integrated and can switch between mock and real APIs
 */

import { 
  apiServiceFactory,
  switchApiMode,
  getCurrentApiMode,
  getServiceHealth,
  authService,
  customerService,
  salesService,
  ticketService,
  contractService,
  userService,
  dashboardService,
  notificationService,
  fileService,
  auditService
} from './index';

export interface ServiceTestResult {
  serviceName: string;
  mockMode: {
    available: boolean;
    error?: string;
  };
  realMode: {
    available: boolean;
    error?: string;
  };
  interfaceCompliance: {
    hasRequiredMethods: boolean;
    missingMethods: string[];
  };
}

export interface IntegrationTestResults {
  overallStatus: 'pass' | 'fail' | 'warning';
  apiSwitching: {
    canSwitchToMock: boolean;
    canSwitchToReal: boolean;
    currentMode: 'mock' | 'real';
  };
  serviceHealth: Record<string, unknown>;
  serviceResults: ServiceTestResult[];
  summary: {
    totalServices: number;
    passedServices: number;
    failedServices: number;
    warningServices: number;
  };
}

/**
 * Test service interface compliance
 */
function testServiceInterface(service: Record<string, unknown>, expectedMethods: string[]): {
  hasRequiredMethods: boolean;
  missingMethods: string[];
} {
  const missingMethods: string[] = [];
  
  for (const method of expectedMethods) {
    if (typeof service[method] !== 'function') {
      missingMethods.push(method);
    }
  }
  
  return {
    hasRequiredMethods: missingMethods.length === 0,
    missingMethods
  };
}

/**
 * Test individual service
 */
async function testService(
  serviceName: string,
  getServiceFn: () => Record<string, unknown>,
  expectedMethods: string[]
): Promise<ServiceTestResult> {
  const result: ServiceTestResult = {
    serviceName,
    mockMode: { available: false },
    realMode: { available: false },
    interfaceCompliance: { hasRequiredMethods: false, missingMethods: [] }
  };

  try {
    // Test mock mode
    switchApiMode(true);
    const mockService = getServiceFn();
    result.mockMode.available = !!mockService;
    
    // Test real mode
    switchApiMode(false);
    const realService = getServiceFn();
    result.realMode.available = !!realService;
    
    // Test interface compliance (using mock service for testing)
    switchApiMode(true);
    const testService = getServiceFn();
    result.interfaceCompliance = testServiceInterface(testService, expectedMethods);
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    result.mockMode.error = message;
    result.realMode.error = message;
  }

  return result;
}

/**
 * Run comprehensive service integration tests
 */
export async function runServiceIntegrationTests(): Promise<IntegrationTestResults> {
  console.log('🧪 Starting Service Integration Tests...');
  
  const results: IntegrationTestResults = {
    overallStatus: 'pass',
    apiSwitching: {
      canSwitchToMock: false,
      canSwitchToReal: false,
      currentMode: getCurrentApiMode()
    },
    serviceHealth: {},
    serviceResults: [],
    summary: {
      totalServices: 0,
      passedServices: 0,
      failedServices: 0,
      warningServices: 0
    }
  };

  try {
    // Test API switching
    const originalMode = getCurrentApiMode();
    
    switchApiMode(true);
    results.apiSwitching.canSwitchToMock = getCurrentApiMode() === 'mock';
    
    switchApiMode(false);
    results.apiSwitching.canSwitchToReal = getCurrentApiMode() === 'real';
    
    // Restore original mode
    switchApiMode(originalMode === 'mock');
    results.apiSwitching.currentMode = getCurrentApiMode();

    // Get service health
    results.serviceHealth = getServiceHealth();

    // Test individual services
    const serviceTests = [
      {
        name: 'Auth Service',
        getter: () => apiServiceFactory.getAuthService(),
        methods: ['login', 'logout', 'getCurrentUser', 'getToken', 'isAuthenticated', 'hasRole', 'hasPermission', 'refreshToken']
      },
      {
        name: 'Customer Service',
        getter: () => apiServiceFactory.getCustomerService(),
        methods: ['getCustomers', 'getCustomer', 'createCustomer', 'updateCustomer', 'deleteCustomer', 'bulkDeleteCustomers', 'bulkUpdateCustomers', 'getTags', 'exportCustomers', 'importCustomers']
      },
      {
        name: 'Sales Service',
        getter: () => apiServiceFactory.getSalesService(),
        methods: ['getSales', 'getSale', 'createSale', 'updateSale', 'deleteSale', 'getPipelineStages', 'getSalesAnalytics']
      },
      {
        name: 'Ticket Service',
        getter: () => apiServiceFactory.getTicketService(),
        methods: ['getTickets', 'getTicket', 'createTicket', 'updateTicket', 'deleteTicket', 'getTicketCategories', 'getTicketPriorities']
      },
      {
        name: 'Contract Service',
        getter: () => apiServiceFactory.getContractService(),
        methods: ['getContracts', 'getContract', 'createContract', 'updateContract', 'deleteContract', 'getContractTypes', 'getContractAnalytics']
      },
      {
        name: 'User Service',
        getter: () => apiServiceFactory.getUserService(),
        methods: ['getUsers', 'getUser', 'createUser', 'updateUser', 'deleteUser', 'getRoles', 'getPermissions']
      },
      {
        name: 'Dashboard Service',
        getter: () => apiServiceFactory.getDashboardService(),
        methods: ['getMetrics', 'getAnalytics', 'getRecentActivity', 'getWidgetData']
      },
      {
        name: 'Notification Service',
        getter: () => apiServiceFactory.getNotificationService(),
        methods: ['getNotifications', 'createNotification', 'markAsRead', 'deleteNotification', 'getTemplates']
      },
      {
        name: 'File Service',
        getter: () => apiServiceFactory.getFileService(),
        methods: ['uploadFile', 'downloadFile', 'deleteFile', 'getFileMetadata']
      },
      {
        name: 'Audit Service',
        getter: () => apiServiceFactory.getAuditService(),
        methods: ['getAuditLogs', 'exportAuditLogs', 'searchAuditLogs']
      }
    ];

    for (const test of serviceTests) {
      const serviceResult = await testService(test.name, test.getter, test.methods);
      results.serviceResults.push(serviceResult);
    }

    // Calculate summary
    results.summary.totalServices = results.serviceResults.length;
    
    for (const serviceResult of results.serviceResults) {
      if (serviceResult.mockMode.available && serviceResult.realMode.available && serviceResult.interfaceCompliance.hasRequiredMethods) {
        results.summary.passedServices++;
      } else if (serviceResult.mockMode.available || serviceResult.realMode.available) {
        results.summary.warningServices++;
      } else {
        results.summary.failedServices++;
      }
    }

    // Determine overall status
    if (results.summary.failedServices > 0) {
      results.overallStatus = 'fail';
    } else if (results.summary.warningServices > 0) {
      results.overallStatus = 'warning';
    } else {
      results.overallStatus = 'pass';
    }

  } catch (error: unknown) {
    console.error('❌ Service integration test failed:', error);
    results.overallStatus = 'fail';
  }

  return results;
}

/**
 * Print test results to console
 */
export function printTestResults(results: IntegrationTestResults): void {
  console.log('\n📊 Service Integration Test Results');
  console.log('=====================================');
  
  console.log(`\n🎯 Overall Status: ${results.overallStatus.toUpperCase()}`);
  console.log(`📡 Current API Mode: ${results.apiSwitching.currentMode}`);
  console.log(`🔄 Can Switch to Mock: ${results.apiSwitching.canSwitchToMock ? '✅' : '❌'}`);
  console.log(`🔄 Can Switch to Real: ${results.apiSwitching.canSwitchToReal ? '✅' : '❌'}`);
  
  console.log('\n📈 Summary:');
  console.log(`  Total Services: ${results.summary.totalServices}`);
  console.log(`  ✅ Passed: ${results.summary.passedServices}`);
  console.log(`  ⚠️  Warnings: ${results.summary.warningServices}`);
  console.log(`  ❌ Failed: ${results.summary.failedServices}`);
  
  console.log('\n🔍 Service Details:');
  for (const service of results.serviceResults) {
    const status = service.mockMode.available && service.realMode.available && service.interfaceCompliance.hasRequiredMethods ? '✅' : 
                   service.mockMode.available || service.realMode.available ? '⚠️' : '❌';
    
    console.log(`  ${status} ${service.serviceName}`);
    console.log(`    Mock: ${service.mockMode.available ? '✅' : '❌'} | Real: ${service.realMode.available ? '✅' : '❌'} | Interface: ${service.interfaceCompliance.hasRequiredMethods ? '✅' : '❌'}`);
    
    if (service.interfaceCompliance.missingMethods.length > 0) {
      console.log(`    Missing methods: ${service.interfaceCompliance.missingMethods.join(', ')}`);
    }
  }
  
  console.log('\n=====================================\n');
}

/**
 * Quick service health check
 */
export function quickHealthCheck(): void {
  console.log('🏥 Quick Service Health Check');
  console.log('============================');
  
  const health = getServiceHealth();
  console.log(`Mode: ${health.mode}`);
  console.log(`Last Check: ${health.lastCheck}`);
  console.log('Services:');
  
  Object.entries(health.services).forEach(([name, available]) => {
    console.log(`  ${available ? '✅' : '❌'} ${name}`);
  });
  
  console.log('============================\n');
}

// Export for use in development/testing
/**
 * Run comprehensive service tests including edge cases and performance
 */
export async function runComprehensiveServiceTests(): Promise<{
  integration: IntegrationTestResults;
  edgeCases: Record<string, unknown>;
  performance: Record<string, unknown>;
}> {
  console.log('🚀 Starting Comprehensive Service Tests...');

  // Run integration tests
  const integrationResults = await runServiceIntegrationTests();

  // Test edge cases
  const edgeCaseResults = await testEdgeCases();

  // Test performance
  const performanceResults = await testPerformance();

  return {
    integration: integrationResults,
    edgeCases: edgeCaseResults,
    performance: performanceResults
  };
}

/**
 * Test edge cases and error scenarios
 */
async function testEdgeCases(): Promise<Record<string, unknown>> {
  console.log('🔍 Testing Edge Cases...');

  const results = {
    authenticationErrors: [],
    validationErrors: [],
    notFoundErrors: [],
    permissionErrors: [],
    networkErrors: []
  };

  try {
    // Test authentication errors
    switchApiMode(true); // Use mock mode for testing

    // Test with invalid user
    try {
      const customerService = apiServiceFactory.getCustomerService();
      await customerService.getCustomers();
      results.authenticationErrors.push({ test: 'invalid_user', status: 'failed', reason: 'Should have thrown auth error' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      results.authenticationErrors.push({ test: 'invalid_user', status: 'passed', error: message });
    }

    // Test validation errors
    try {
      const customerService = apiServiceFactory.getCustomerService();
      await customerService.createCustomer({} as Record<string, unknown>);
      results.validationErrors.push({ test: 'empty_data', status: 'failed', reason: 'Should have thrown validation error' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      results.validationErrors.push({ test: 'empty_data', status: 'passed', error: message });
    }

    // Test not found errors
    try {
      const customerService = apiServiceFactory.getCustomerService();
      await customerService.getCustomer('non-existent-id');
      results.notFoundErrors.push({ test: 'non_existent_id', status: 'failed', reason: 'Should have thrown not found error' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      results.notFoundErrors.push({ test: 'non_existent_id', status: 'passed', error: message });
    }

  } catch (error) {
    console.error('Edge case testing failed:', error);
  }

  return results;
}

/**
 * Test service performance
 */
async function testPerformance(): Promise<Record<string, unknown>> {
  console.log('⚡ Testing Performance...');

  const results = {
    responseTime: {},
    throughput: {},
    memoryUsage: {}
  };

  try {
    switchApiMode(true); // Use mock mode for consistent testing

    // Test response times
    const services = [
      { name: 'customer', service: apiServiceFactory.getCustomerService(), method: 'getCustomers' },
      { name: 'sales', service: apiServiceFactory.getSalesService(), method: 'getSales' },
      { name: 'tickets', service: apiServiceFactory.getTicketService(), method: 'getTickets' }
    ];

    for (const { name, service, method } of services) {
      const times = [];
      const iterations = 5;

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await service[method]();
        const end = performance.now();
        times.push(end - start);
      }

      results.responseTime[name] = {
        average: times.reduce((a, b) => a + b, 0) / times.length,
        min: Math.min(...times),
        max: Math.max(...times),
        times
      };
    }

  } catch (error) {
    console.error('Performance testing failed:', error);
  }

  return results;
}

/**
 * Print comprehensive test results
 */
export function printComprehensiveResults(results: Record<string, unknown>): void {
  console.log('\n📊 Comprehensive Service Test Results');
  console.log('=====================================');

  // Print integration results
  if (results.integration && typeof results.integration === 'object') {
    printTestResults(results.integration as IntegrationTestResults);
  }

  // Print edge case results
  console.log('\n🔍 Edge Case Test Results:');
  if (results.edgeCases && typeof results.edgeCases === 'object') {
    Object.entries(results.edgeCases).forEach(([category, tests]) => {
      console.log(`\n  ${category}:`);
      if (Array.isArray(tests)) {
        tests.forEach((test: unknown) => {
          if (test && typeof test === 'object') {
            const testObj = test as Record<string, unknown>;
            const status = testObj.status === 'passed' ? '✅' : '❌';
            console.log(`    ${status} ${testObj.test}: ${testObj.error || testObj.reason || 'OK'}`);
          }
        });
      }
    });
  }

  // Print performance results
  console.log('\n⚡ Performance Test Results:');
  if (results.performance && typeof results.performance === 'object') {
    const perfObj = results.performance as Record<string, unknown>;
    if (perfObj.responseTime && typeof perfObj.responseTime === 'object') {
      Object.entries(perfObj.responseTime).forEach(([service, metrics]) => {
        console.log(`\n  ${service}:`);
        if (metrics && typeof metrics === 'object') {
          const metricsObj = metrics as Record<string, unknown>;
          if (typeof metricsObj.average === 'number' && typeof metricsObj.min === 'number' && typeof metricsObj.max === 'number') {
            console.log(`    Average: ${metricsObj.average.toFixed(2)}ms`);
            console.log(`    Min: ${metricsObj.min.toFixed(2)}ms`);
            console.log(`    Max: ${metricsObj.max.toFixed(2)}ms`);
          }
        }
      });
    }
  }

  console.log('\n=====================================\n');
}

export default {
  runServiceIntegrationTests,
  runComprehensiveServiceTests,
  printTestResults,
  printComprehensiveResults,
  quickHealthCheck
};
