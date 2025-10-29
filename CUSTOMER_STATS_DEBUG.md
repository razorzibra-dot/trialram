# Customer Stats Method - Debugging Progress

## Issue
Error: `TypeError: getCustomerStats is not a function`
- Location: `useCustomers.ts:281:32` in `useCustomerStats()` hook
- Occurs when `useCustomerStats()` hook tries to call `getCustomerService().getCustomerStats()`

## Investigation Findings

### 1. Method Definition Status
✅ `getCustomerStats()` is defined in multiple places:
- **Module Service**: `/src/modules/features/customers/services/customerService.ts` (line 291)
  - Extends `BaseService` correctly
  - Async method with proper return type
  - Delegates to `apiServiceFactory.getCustomerService().getCustomerStats()`
  
- **Mock Service**: `/src/services/customerService.ts`
  - Has `getCustomerStats()` implementation
  
- **Supabase Service**: `/src/services/supabase/customerService.ts`
  - Has `getCustomerStats()` implementation

- **API Service Factory**: `/src/services/api/apiServiceFactory.ts`
  - Interface declares `getCustomerStats?()` as optional method (line 83)
  - Both mock and Supabase services implement it

### 2. Service Registration
✅ Service is registered in customer module (`/src/modules/features/customers/index.ts`):
- Module registers `CustomerService` class via `registerService('customerService', CustomerService)`
- Service container instantiates with `new CustomerService()`
- Should preserve all class methods on instance

### 3. Hook Implementation  
✅ `useCustomerStats()` hook exists in `/src/modules/features/customers/hooks/useCustomers.ts`:
- Line 276-287: Hook definition
- Calls `getCustomerService().getCustomerStats()` 
- Now exports from module index

### 4. Enhanced Exports
✅ Updated `/src/modules/features/customers/index.ts`:
- Added `useCustomerStats` to hook exports (line 24)
- Added `useBulkCustomerOperations` to hook exports (line 28)

## Diagnostic Enhancements Made

### 1. Module Initialization Logging
Enhanced `/src/modules/features/customers/index.ts`:
- Added prototype method detection for CustomerService
- Logs all methods on the class prototype
- Specifically checks for `getCustomerStats` presence
- Logs timing and validation data

```typescript
const protoMethods = Object.getOwnPropertyNames(CustomerService.prototype || {});
const hasGetCustomerStats = protoMethods.includes('getCustomerStats');
```

### 2. Service Instantiation Logging
Enhanced `/src/modules/core/services/ServiceContainer.ts`:
- Added detailed logging after service instantiation
- Shows instance type and prototype methods
- Helps verify methods are preserved on instance

```typescript
console.log(`[ServiceContainer.get] ✓ Successfully instantiated '${name}' as constructor`, {
  instanceType: typeof instance,
  constructor: (instance as any)?.constructor?.name || 'unknown',
  protoMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(instance) || {})
});
```

### 3. Hook-Level Method Detection
Enhanced `/src/modules/features/customers/hooks/useCustomers.ts`:
- Added method existence check before calling
- Logs service structure and available methods
- Provides clear error if method is missing
- Shows what type/value the method actually is

```typescript
if (typeof (service as any)?.getCustomerStats !== 'function') {
  console.error('[useCustomerStats] ✗ getCustomerStats is not a function!', {
    service,
    type: typeof (service as any)?.getCustomerStats
  });
}
```

## Next Steps for Diagnosis

When you run the app (`npm run dev`), check the browser console for:

1. **Module Initialization Phase**:
   - Look for: `[customerModule.initialize]` logs
   - Verify: `hasGetCustomerStats: true` in the output
   - Verify: `prototypeMethods` includes `"getCustomerStats"`

2. **Service Instantiation Phase**:
   - Look for: `[ServiceContainer.get]` logs for `customerService`
   - Verify: `instanceType: "object"`
   - Verify: `protoMethods` includes `"getCustomerStats"`

3. **Hook Execution Phase**:
   - Look for: `[useCustomerStats]` logs
   - Verify: `hasGetCustomerStats: "function"` in the retrieved service
   - If error: Log will show what type the method actually is

## Root Cause Analysis - Possible Scenarios

### Scenario A: Method Not on Class Prototype ❌
**Evidence**: `prototypeMethods` won't include `"getCustomerStats"` at module init
**Fix**: Check if class method definition has syntax errors or compilation issues

### Scenario B: Method Lost During Instantiation ❌
**Evidence**: Class has method but instance doesn't in ServiceContainer logs
**Fix**: Check if BaseService or custom getter/setter interferes with methods

### Scenario C: Service Instance is Wrong Type ❌
**Evidence**: `instanceType` is not "object" or constructor name is wrong
**Fix**: Check if registerService() is routing to wrong registration method

### Scenario D: Timing/Race Condition ⚠️
**Evidence**: Service retrieved but method call fails intermittently
**Fix**: Add initialization check before calling the hook

## Files Modified

1. `/src/modules/features/customers/index.ts`
   - Added method detection diagnostics in module initialization
   - Added missing hook exports

2. `/src/modules/core/services/ServiceContainer.ts`
   - Added instance method logging during instantiation

3. `/src/modules/features/customers/hooks/useCustomers.ts`
   - Added comprehensive logging and error handling
   - Added method existence verification before calling

## How to Interpret Console Logs

Look for patterns in this order:

```
✓ SUCCESS PATTERN:
[customerModule.initialize] ...hasGetCustomerStats: true...
[customerModule.initialize] ...prototypeMethods: [..., "getCustomerStats", ...]
[ServiceContainer.get] ✓ Successfully instantiated 'customerService' as constructor
[ServiceContainer.get] ...protoMethods: [..., "getCustomerStats", ...]
[useCustomerStats] Retrieved service: ...hasGetCustomerStats: "function"...
[useCustomerStats] ✓ Retrieved stats: {...}

✗ FAILURE PATTERN:
[customerModule.initialize] ...hasGetCustomerStats: false...  ← Method not on class!
OR
[ServiceContainer.get] ...protoMethods: [...]  (getCustomerStats missing) ← Lost during instantiation
OR
[useCustomerStats] ✗ getCustomerStats is not a function! ...type: "undefined"  ← Instance missing method
```

## Testing

After starting the dev server with these diagnostics:
1. Navigate to the Customers section
2. Look for the customer stats widget or hook usage
3. Open browser DevTools (F12)
4. Go to Console tab
5. Search for logs starting with `[customerModule.initialize]`, `[ServiceContainer.get]`, and `[useCustomerStats]`
6. Compare actual output with patterns above

This will definitively show which step in the service lifecycle is failing.