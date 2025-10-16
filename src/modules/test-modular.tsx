/**
 * Modular Architecture Test
 * Simple test to validate the new modular architecture
 */

import React from 'react';
import { moduleRegistry } from './ModuleRegistry';
import { serviceContainer } from './core/services/ServiceContainer';
import { useStore } from './core/store';

const ModularArchitectureTest: React.FC = () => {
  const [testResults, setTestResults] = React.useState<string[]>([]);
  const { user, isAuthenticated } = useStore();

  const runTests = async () => {
    const results: string[] = [];

    try {
      // Test 1: Module Registry
      const modules = moduleRegistry.getModuleNames();
      results.push(`✅ Module Registry: ${modules.length} modules registered (${modules.join(', ')})`);

      // Test 2: Service Container
      const services = serviceContainer.getRegisteredServices();
      results.push(`✅ Service Container: ${services.length} services registered (${services.join(', ')})`);

      // Test 3: Store
      results.push(`✅ Store: ${isAuthenticated ? 'User authenticated' : 'User not authenticated'}`);

      // Test 4: Module Initialization
      const initializedModules = moduleRegistry.getInitializedModules();
      results.push(`✅ Initialized Modules: ${initializedModules.length} modules (${initializedModules.join(', ')})`);

      // Test 5: Customer Module
      if (moduleRegistry.has('customers')) {
        results.push('✅ Customer Module: Available');
        
        if (serviceContainer.has('customerService')) {
          results.push('✅ Customer Service: Registered');
        } else {
          results.push('❌ Customer Service: Not registered');
        }
      } else {
        results.push('❌ Customer Module: Not available');
      }

      // Test 6: Sales Module
      if (moduleRegistry.has('sales')) {
        results.push('✅ Sales Module: Available');
        
        if (serviceContainer.has('salesService')) {
          results.push('✅ Sales Service: Registered');
        } else {
          results.push('❌ Sales Service: Not registered');
        }
      } else {
        results.push('❌ Sales Module: Not available');
      }

      results.push('🎉 All tests completed!');
    } catch (error) {
      results.push(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setTestResults(results);
  };

  React.useEffect(() => {
    // Run tests after a short delay to allow modules to initialize
    const timer = setTimeout(runTests, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Modular Architecture Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Results</h2>
        
        {testResults.length === 0 ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Running tests...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-2 rounded ${
                  result.startsWith('✅') 
                    ? 'bg-green-50 text-green-800' 
                    : result.startsWith('❌')
                    ? 'bg-red-50 text-red-800'
                    : result.startsWith('🎉')
                    ? 'bg-blue-50 text-blue-800'
                    : 'bg-gray-50 text-gray-800'
                }`}
              >
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Architecture Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Registered Modules</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              {moduleRegistry.getModuleNames().map(name => (
                <li key={name} className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>{name}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Registered Services</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              {serviceContainer.getRegisteredServices().map(name => (
                <li key={name} className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>{name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Actions</h2>
        <div className="space-x-4">
          <button
            onClick={runTests}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Re-run Tests
          </button>
          
          <button
            onClick={() => {
              console.log('Module Registry:', moduleRegistry);
              console.log('Service Container:', serviceContainer);
              console.log('Store State:', useStore.getState());
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Log to Console
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModularArchitectureTest;
