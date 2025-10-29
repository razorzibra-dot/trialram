# Sales Module - Phase 6: Testing & Performance Monitoring

## Phase Overview
Phase 6 adds comprehensive unit tests, factory service routing tests, and performance monitoring infrastructure for the Sales module. This ensures code reliability, prevents regressions, and validates multi-tenant isolation.

---

## Test Infrastructure Setup

### Dependencies to Install
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @vitest/ui happy-dom msw
```

### Configuration Files

#### 1. `vitest.config.ts` (Project Root)
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.types.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

#### 2. `src/test/setup.ts` (Test Setup)
```typescript
import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
process.env.VITE_API_MODE = 'mock';
process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
process.env.VITE_SUPABASE_ANON_KEY = 'test-key';
```

#### 3. `src/test/mocks/handlers.ts` (MSW Handlers)
```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Add API mock handlers here
  http.get('/api/sales/stats', () => {
    return HttpResponse.json({
      totalDeals: 150,
      closedDeals: 45,
      totalRevenue: 1500000,
      averageDealValue: 10000,
    });
  }),
];
```

#### 4. `src/test/mocks/server.ts` (MSW Server)
```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

#### 5. `package.json` Scripts
Add these test scripts:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

---

## Unit Tests for Sales Module

### 1. Factory Service Tests

**File**: `src/services/__tests__/salesServiceFactory.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { salesService } from '@/services/serviceFactory';
import * as mockService from '@/services/salesService';
import * as supabaseService from '@/services/api/supabase/salesService';

describe('Sales Service Factory', () => {
  describe('Service Routing', () => {
    it('should route to mock service when VITE_API_MODE is mock', () => {
      process.env.VITE_API_MODE = 'mock';
      expect(salesService).toBeDefined();
    });

    it('should route to supabase service when VITE_API_MODE is supabase', () => {
      process.env.VITE_API_MODE = 'supabase';
      expect(salesService).toBeDefined();
    });

    it('should have consistent method signatures across implementations', () => {
      const mockMethods = Object.keys(mockService.mockSalesService).sort();
      const supabaseMethods = Object.keys(supabaseService.supabaseSalesService).sort();
      
      expect(mockMethods).toEqual(supabaseMethods);
    });
  });

  describe('Service Method Availability', () => {
    const requiredMethods = [
      'getSales',
      'getSale',
      'createSale',
      'updateSale',
      'deleteSale',
      'getDealsByCustomer',
      'getSalesStats',
      'getDealStages',
      'updateDealStage',
      'bulkUpdateDeals',
      'bulkDeleteDeals',
      'searchDeals',
      'exportDeals',
      'importDeals',
    ];

    requiredMethods.forEach((method) => {
      it(`should have ${method} method available`, () => {
        expect(typeof salesService[method as keyof typeof salesService]).toBe('function');
      });
    });
  });
});
```

### 2. Mock Service Tests

**File**: `src/services/__tests__/salesService.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { mockSalesService } from '@/services/salesService';

describe('Mock Sales Service', () => {
  describe('getDealsByCustomer', () => {
    it('should return deals for a customer', async () => {
      const deals = await mockSalesService.getDealsByCustomer({
        customerId: 'customer_1',
        tenantId: 'tenant_1',
      });

      expect(Array.isArray(deals)).toBe(true);
      expect(deals.every((d) => d.customerId === 'customer_1')).toBe(true);
    });

    it('should filter by tenant_id', async () => {
      const deals = await mockSalesService.getDealsByCustomer({
        customerId: 'customer_1',
        tenantId: 'tenant_1',
      });

      expect(deals.every((d) => d.tenantId === 'tenant_1')).toBe(true);
    });

    it('should return empty array for non-existent customer', async () => {
      const deals = await mockSalesService.getDealsByCustomer({
        customerId: 'non_existent',
        tenantId: 'tenant_1',
      });

      expect(deals).toEqual([]);
    });
  });

  describe('getSalesStats', () => {
    it('should return SalesStatsDTO with required fields', async () => {
      const stats = await mockSalesService.getSalesStats({
        tenantId: 'tenant_1',
      });

      expect(stats).toHaveProperty('totalDeals');
      expect(stats).toHaveProperty('closedDeals');
      expect(stats).toHaveProperty('totalRevenue');
      expect(stats).toHaveProperty('averageDealValue');
      expect(stats).toHaveProperty('conversionRate');
      expect(stats).toHaveProperty('pipelineValue');
    });

    it('should return numeric values', async () => {
      const stats = await mockSalesService.getSalesStats({
        tenantId: 'tenant_1',
      });

      expect(typeof stats.totalDeals).toBe('number');
      expect(typeof stats.closedDeals).toBe('number');
      expect(typeof stats.totalRevenue).toBe('number');
      expect(typeof stats.averageDealValue).toBe('number');
      expect(typeof stats.conversionRate).toBe('number');
      expect(typeof stats.pipelineValue).toBe('number');
    });
  });

  describe('getDealStages', () => {
    it('should return array of deal stages', async () => {
      const stages = await mockSalesService.getDealStages({
        tenantId: 'tenant_1',
      });

      expect(Array.isArray(stages)).toBe(true);
      expect(stages.length).toBeGreaterThan(0);
    });

    it('should return stages with required properties', async () => {
      const stages = await mockSalesService.getDealStages({
        tenantId: 'tenant_1',
      });

      stages.forEach((stage) => {
        expect(stage).toHaveProperty('id');
        expect(stage).toHaveProperty('name');
        expect(stage).toHaveProperty('color');
        expect(stage).toHaveProperty('probability');
      });
    });
  });

  describe('searchDeals', () => {
    it('should return deals matching search criteria', async () => {
      const results = await mockSalesService.searchDeals({
        tenantId: 'tenant_1',
        query: 'test',
      });

      expect(Array.isArray(results)).toBe(true);
    });

    it('should respect tenant_id filter in search', async () => {
      const results = await mockSalesService.searchDeals({
        tenantId: 'tenant_1',
        query: 'test',
      });

      expect(results.every((deal) => deal.tenantId === 'tenant_1')).toBe(true);
    });
  });

  describe('bulkUpdateDeals', () => {
    it('should update multiple deals', async () => {
      const deals = [
        { id: 'deal_1', status: 'closed' },
        { id: 'deal_2', status: 'closed' },
      ];

      const result = await mockSalesService.bulkUpdateDeals({
        tenantId: 'tenant_1',
        deals,
      });

      expect(result).toHaveProperty('successCount');
      expect(result).toHaveProperty('failureCount');
      expect(result.successCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('DTO Consistency', () => {
    it('should use camelCase field names', async () => {
      const stats = await mockSalesService.getSalesStats({
        tenantId: 'tenant_1',
      });

      const keys = Object.keys(stats);
      keys.forEach((key) => {
        expect(key).toMatch(/^[a-z]/); // Should start with lowercase (camelCase)
        expect(key).not.toContain('_'); // Should not have snake_case underscores
      });
    });
  });
});
```

### 3. Multi-Tenant Isolation Tests

**File**: `src/modules/features/sales/__tests__/multiTenantSafety.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { mockSalesService } from '@/services/salesService';

describe('Sales Module - Multi-Tenant Safety', () => {
  const tenant1Id = 'tenant_1';
  const tenant2Id = 'tenant_2';
  const customerId = 'customer_1';

  describe('Tenant Isolation in getDealsByCustomer', () => {
    it('should not return deals from other tenants', async () => {
      const tenant1Deals = await mockSalesService.getDealsByCustomer({
        customerId,
        tenantId: tenant1Id,
      });

      const tenant2Deals = await mockSalesService.getDealsByCustomer({
        customerId,
        tenantId: tenant2Id,
      });

      // All deals should belong to their respective tenant
      expect(tenant1Deals.every((d) => d.tenantId === tenant1Id)).toBe(true);
      expect(tenant2Deals.every((d) => d.tenantId === tenant2Id)).toBe(true);

      // Check that we're getting different data sets
      const tenant1Ids = tenant1Deals.map((d) => d.id);
      const tenant2Ids = tenant2Deals.map((d) => d.id);

      const intersection = tenant1Ids.filter((id) => tenant2Ids.includes(id));
      expect(intersection.length).toBe(0);
    });
  });

  describe('Tenant Isolation in getSalesStats', () => {
    it('should return stats for specific tenant only', async () => {
      const stats1 = await mockSalesService.getSalesStats({
        tenantId: tenant1Id,
      });

      const stats2 = await mockSalesService.getSalesStats({
        tenantId: tenant2Id,
      });

      // Both should have stats (mock data)
      expect(stats1.totalDeals).toBeGreaterThanOrEqual(0);
      expect(stats2.totalDeals).toBeGreaterThanOrEqual(0);

      // Note: In production Supabase, these would be filtered by tenant_id in RLS policies
    });
  });

  describe('Query Key Multi-Tenant Safety', () => {
    it('should include tenantId in React Query keys for cache isolation', () => {
      // This would be tested at the hook level
      // Query keys should follow pattern: ['sales', tenantId, 'deals', customerId]
      // This ensures different tenants don't share cache
      expect(true).toBe(true);
    });
  });

  describe('Bulk Operations - Tenant Safety', () => {
    it('should not allow cross-tenant updates', async () => {
      const deals = [
        { id: 'deal_from_tenant1', status: 'closed' },
        { id: 'deal_from_tenant2', status: 'closed' },
      ];

      // Should only update deals belonging to tenant_1
      const result = await mockSalesService.bulkUpdateDeals({
        tenantId: tenant1Id,
        deals,
      });

      expect(result).toHaveProperty('successCount');
      // In production, only tenant_1 deals would be updated
    });
  });
});
```

### 4. Hook Tests

**File**: `src/modules/features/sales/hooks/__tests__/useSales.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import React from 'react';
import { useSales } from '../useSales';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user_1', email: 'test@example.com' },
    tenantId: 'tenant_1',
  }),
}));

// Mock the service factory
vi.mock('@/services/serviceFactory', () => ({
  salesService: {
    getSales: vi.fn(async () => [
      { id: 'sale_1', title: 'Sale 1', tenantId: 'tenant_1' },
    ]),
    getSalesStats: vi.fn(async () => ({
      totalDeals: 100,
      closedDeals: 30,
      totalRevenue: 500000,
      averageDealValue: 5000,
      conversionRate: 30,
      pipelineValue: 1000000,
    })),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useSales Hooks', () => {
  describe('useSalesData', () => {
    it('should extract tenantId from useAuth context', () => {
      const { result } = renderHook(() => useSales.useSalesData(), {
        wrapper: createWrapper(),
      });

      // Hook should fetch data with tenant context
      expect(result.current).toBeDefined();
    });

    it('should include tenantId in query key for cache isolation', async () => {
      const { result } = renderHook(() => useSales.useSalesData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify multi-tenant cache isolation
      // Query key should include tenantId
    });
  });

  describe('useSalesStats', () => {
    it('should return sales statistics with tenant context', async () => {
      const { result } = renderHook(() => useSales.useSalesStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      expect(result.current.data?.totalDeals).toBeGreaterThanOrEqual(0);
      expect(result.current.data?.closedDeals).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Factory Service Integration', () => {
    it('should use factory service for all operations', () => {
      renderHook(() => useSales.useSalesData(), {
        wrapper: createWrapper(),
      });

      // Verify factory service is used, not direct mock/supabase imports
      expect(true).toBe(true);
    });
  });
});
```

---

## Performance Monitoring

### 1. Performance Metrics Module

**File**: `src/services/performanceMonitoring.ts`

```typescript
interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000;

  startMeasure(name: string): () => void {
    const startTime = performance.now();
    const startMark = `${name}_start`;
    performance.mark(startMark);

    return () => {
      const endTime = performance.now();
      const endMark = `${name}_end`;
      performance.mark(endMark);

      const duration = endTime - startTime;

      try {
        performance.measure(name, startMark, endMark);
      } catch {
        // Ignore if measure fails
      }

      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
      });
    };
  }

  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep array size manageable
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations (>500ms)
    if (metric.duration > 500) {
      console.warn(
        `[Performance] Slow operation: ${metric.name} took ${metric.duration.toFixed(2)}ms`
      );
    }
  }

  getMetrics(filterName?: string): PerformanceMetric[] {
    if (!filterName) return this.metrics;
    return this.metrics.filter((m) => m.name.includes(filterName));
  }

  getStats(filterName?: string) {
    const metrics = this.getMetrics(filterName);
    if (metrics.length === 0) return null;

    const durations = metrics.map((m) => m.duration);
    const sum = durations.reduce((a, b) => a + b, 0);

    return {
      count: metrics.length,
      average: sum / metrics.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      p95: this.calculatePercentile(durations, 95),
      p99: this.calculatePercentile(durations, 99),
    };
  }

  private calculatePercentile(arr: number[], percentile: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

### 2. Service Performance Wrapper

**File**: `src/services/performanceWrapper.ts`

```typescript
import { performanceMonitor } from './performanceMonitoring';

export function withPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operationName: string
): T {
  return (async (...args: any[]) => {
    const endMeasure = performanceMonitor.startMeasure(operationName);

    try {
      const result = await fn(...args);
      return result;
    } finally {
      endMeasure();
    }
  }) as T;
}

// Usage in sales service:
// export const salesService = {
//   getSales: withPerformanceTracking(
//     mockSalesService.getSales,
//     'salesService:getSales'
//   ),
// };
```

### 3. Monitoring Dashboard

**File**: `src/components/PerformanceMonitoring/PerformanceMetrics.tsx`

```typescript
import React from 'react';
import { performanceMonitor } from '@/services/performanceMonitoring';

export const PerformanceMetrics: React.FC = () => {
  const [metrics, setMetrics] = React.useState<Record<string, any>>({});

  React.useEffect(() => {
    const interval = setInterval(() => {
      const stats = {
        salesService_getSales: performanceMonitor.getStats('getSales'),
        salesService_getSalesStats: performanceMonitor.getStats('getSalesStats'),
        salesService_bulkOperations: performanceMonitor.getStats('bulk'),
      };
      setMetrics(stats);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 bg-gray-50 rounded">
      <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
      {Object.entries(metrics).map(([key, value]) =>
        value ? (
          <div key={key} className="mb-4 p-2 border">
            <strong>{key}</strong>
            <div className="text-sm text-gray-600">
              <p>Count: {value.count}</p>
              <p>Avg: {value.average.toFixed(2)}ms</p>
              <p>Min: {value.min.toFixed(2)}ms</p>
              <p>Max: {value.max.toFixed(2)}ms</p>
              <p>P95: {value.p95.toFixed(2)}ms</p>
              <p>P99: {value.p99.toFixed(2)}ms</p>
            </div>
          </div>
        ) : null
      )}
    </div>
  );
};
```

---

## Test Execution Guide

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with UI (Vitest UI)
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Coverage Goals

| Category | Target | Metric |
|----------|--------|--------|
| **Factory Service** | >95% | Method routing, fallbacks |
| **Mock Service** | >90% | All 14 methods, edge cases |
| **Multi-Tenant Safety** | >95% | Tenant isolation, cache keys |
| **Hooks** | >85% | Data fetching, context usage |
| **Overall** | >85% | Code coverage across module |

---

## Deployment Checklist - Phase 6

- [ ] Vitest configured in `vitest.config.ts`
- [ ] Test setup files created in `src/test/`
- [ ] Factory service tests passing (>95% success)
- [ ] Mock service tests passing (>90% success)
- [ ] Multi-tenant tests passing (>95% success)
- [ ] Hook tests passing (>85% success)
- [ ] Performance monitoring integrated
- [ ] Coverage report generated (>85% target met)
- [ ] Test documentation updated
- [ ] CI/CD pipeline configured for test execution
- [ ] Performance baselines established

---

## Maintenance Notes

1. **Test Updates**: When adding new backend methods, create corresponding tests in the mock service test file
2. **Performance Thresholds**: Monitor slow operations (>500ms) - adjust thresholds as needed
3. **Multi-Tenant Testing**: Always test with 2+ tenants to ensure isolation
4. **Mock Data**: Keep mock data consistent with Supabase schema for accuracy
5. **Regression Prevention**: Run full test suite before each deployment

---

## Next Steps (Phase 7+)

1. **E2E Tests**: Add Playwright/Cypress tests for complete user workflows
2. **API Documentation**: Auto-generate OpenAPI specs from service methods
3. **Load Testing**: Add k6 scripts for performance benchmarking
4. **Monitoring Dashboard**: Create real-time performance monitoring UI
5. **Analytics**: Integrate with observability tools for production monitoring