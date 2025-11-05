/**
 * Testing and Mock Data Types
 * Centralized types for testing utilities and mock data
 */

export interface TestScenario {
  id: string;
  name: string;
  description?: string;
  steps: Array<{
    action: string;
    expected: string;
  }>;
  setup?: Record<string, unknown>;
  teardown?: Record<string, unknown>;
}

export interface MockDataOptions {
  seed?: number;
  recordCount?: number;
  includeRelations?: boolean;
  dataQuality?: 'minimal' | 'realistic' | 'comprehensive';
  metadata?: Record<string, unknown>;
}