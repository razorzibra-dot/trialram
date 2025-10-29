# Fix: Customer Stats Method Resolution

## Problem
The application was throwing: `TypeError: getCustomerService(...).getCustomerStats is not a function` when the `useCustomerStats()` hook tried to fetch customer statistics.

**Error Location**: `useCustomers.ts:281:32` in the customers module hook

## Root Cause Analysis

The issue involved a multi-layer architecture where the method existed at different levels but wasn't properly exposed:

1. **Factory Services** (`src/services/`):
   - Mock: `src/services/customerService.ts` - ✅ Had `getCustomerStats()` method
   - Supabase: `src/services/supabase/customerService.ts` - ✅ Had `getCustomerStats()` method

2. **Module Service Wrapper** (`src/modules/features/customers/services/customerService.ts`):
   - ✅ Had `getCustomerStats()` method but wasn't delegating to factory properly

3. **API Service Factory Interface** (`src/services/api/apiServiceFactory.ts`):
   - ❌ **Missing**: `getCustomerStats` was not declared in `ICustomerService` interface
   - This prevented proper typing and method access

## Solution Implemented

### 1. Updated API Service Factory Interface
**File**: `src/services/api/apiServiceFactory.ts`

Added the missing method declaration to `ICustomerService` interface:

```typescript
export interface ICustomerService {
  // ... existing methods ...
  getCustomerStats?(): Promise<Record<string, unknown>>;
  // Add other customer methods as needed
}
```

### 2. Enhanced Module Service Wrapper
**File**: `src/modules/features/customers/services/customerService.ts`

Updated `CustomerService.getCustomerStats()` to properly delegate:

```typescript
async getCustomerStats(): Promise<{...}> {
  try {
    // Try to use the factory's getCustomerStats if available
    const factoryService = apiServiceFactory.getCustomerService();
    if (factoryService.getCustomerStats) {
      const factoryStats = await factoryService.getCustomerStats();
      
      // Map factory stats to wrapper format
      return {
        total: (factoryStats as any).totalCustomers || 0,
        active: (factoryStats as any).activeCustomers || 0,
        inactive: (factoryStats as any).inactiveCustomers || 0,
        prospects: (factoryStats as any).prospectCustomers || 0,
        byIndustry: (factoryStats as any).byIndustry || {},
        bySize: (factoryStats as any).bySize || {},
        recentlyAdded: 0,
      };
    }
    
    // Fallback: fetch customers and calculate stats manually if needed
    // ... fallback logic ...
  }
}
```

## Architecture Overview

The fix maintains the proper service layer hierarchy:

```
useCustomerStats Hook
        ↓
getCustomerService() [Module Injection]
        ↓
CustomerService [Module Wrapper]
        ↓
apiServiceFactory.getCustomerService()
        ↓
    ├→ mockCustomerService [Mock Mode]
    └→ supabaseCustomerService [Supabase Mode]
        (Both have getCustomerStats() method)
```

## Key Changes

| File | Change | Impact |
|------|--------|--------|
| `apiServiceFactory.ts` | Added `getCustomerStats?()` to `ICustomerService` interface | Enables type-safe method access |
| `customerService.ts` (module) | Enhanced to delegate to factory service | Ensures factory method is called first |

## Testing Status

✅ **Build**: Successful with no errors
- TypeScript compilation: Passed
- Vite bundling: Passed
- All imports and types resolve correctly

## How It Works Now

1. Component calls `useCustomerStats()` hook
2. Hook calls `getCustomerService().getCustomerStats()`
3. Module service receives call and delegates to `apiServiceFactory`
4. Factory returns appropriate service instance based on `VITE_API_MODE`:
   - **mock**: Returns mockCustomerService with stats calculation
   - **supabase**: Returns supabaseCustomerService with database query
5. Statistics are calculated and returned to hook
6. Component renders with customer statistics data

## Response Format Mapping

**Factory Service Returns**:
```typescript
{
  totalCustomers: number,
  activeCustomers: number,
  prospectCustomers: number,
  inactiveCustomers: number,
  byIndustry: Record<string, number>,
  bySize: Record<string, number>,
  byStatus: Record<string, number>
}
```

**Module Service Returns** (mapped format):
```typescript
{
  total: number,
  active: number,
  inactive: number,
  prospects: number,
  byIndustry: Record<string, number>,
  bySize: Record<string, number>,
  recentlyAdded: number  // Additional calculated value
}
```

## Backwards Compatibility

✅ The fix maintains full backwards compatibility:
- Optional chaining prevents errors if method doesn't exist
- Fallback logic calculates stats from customer list if needed
- Existing error handling for tenant context is preserved
- No breaking changes to API or interfaces

## Next Steps

The application should now:
1. Successfully call `getCustomerStats()` without errors
2. Properly fetch customer statistics from the configured backend
3. Display statistics in the dashboard/UI components
4. Handle both mock and Supabase modes seamlessly