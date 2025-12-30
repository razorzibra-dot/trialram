# Enhanced Diagnostic Logging Guide

## Overview

The application now includes comprehensive diagnostic logging at critical points in the service registration and retrieval process. This guide will help you interpret the logs to identify and resolve the "factory is not a function" error.

## Files Enhanced

1. **ServiceContainer.ts** - Core dependency injection container
2. **customerModule/index.ts** - Customer module initialization  
3. **ModuleRegistry.ts** - Module lifecycle management

## Log Interpretation

### Phase 1: Module Registration

When the app starts, you should see logs like:

```
[ModuleRegistry.initializeAll] ▶ Starting initialization of X modules
modules: ['core', 'shared', 'customers', 'sales', ...]
```

This shows all registered modules are ready to initialize.

### Phase 2: Module Dependencies

For the customer module with dependencies on 'core' and 'shared':

```
[ModuleRegistry.initialize] ▶ Initializing module 'customers'
hasDependencies: true
dependencies: ['core', 'shared']

[ModuleRegistry.initialize] Initializing dependency 'core' of 'customers'
[ModuleRegistry.initialize] Initializing dependency 'shared' of 'customers'
```

**Expected**: Dependencies initialize before the module itself.

### Phase 3: Customer Module Initialization

```
[customerModule.initialize] ▶ Starting customer module initialization
timestamp: "2025-01-29T..."

[customerModule.initialize] Imported registerService (X.XXms)

[customerModule.initialize] Imported CustomerService (X.XXms)
isClass: true
hasPrototype: true
name: "CustomerService"
type: "function"
isConstructor: true
toString: "class CustomerService extends BaseService { ... }"
```

**Expected**: CustomerService should be a function with prototype = class constructor

### Phase 4: Service Registration

```
[ServiceContainer.register] Registering 'customerService'
type: "function"
hasPrototype: true
protoType: "Object"
isConstructor: true
isFactory: false
isSingleton: true
defName: "CustomerService"
toString: "class CustomerService extends BaseService { ... }"

[ServiceContainer.register] Verification - stored definition:
isPresent: true
type: "function"
name: "CustomerService"
sameAsInput: true
storedProto: true

[ServiceContainer] ✓ Registered service 'customerService' as constructor
```

**Expected**: 
- Type should be "function"
- hasPrototype should be true
- isConstructor should be true
- sameAsInput should be true (verifies correct storage)

### Phase 5: Service Retrieval

When `inject<CustomerService>('customerService')` is called:

```
[inject] Called for 'customerService'

[ServiceContainer.get] ▶ Retrieving service 'customerService'
timestamp: "2025-01-29T..."
directInstanceExists: false
singletonExists: true
factoryExists: true
allRegisteredServices: ['customerService', ...]

[ServiceContainer.get] Singleton slot exists but is empty, will create new instance

[ServiceContainer.get] Factory retrieved for 'customerService'
type: "function"
hasPrototype: true
factoryName: "CustomerService"
toString: "class CustomerService extends BaseService { ... }"
isFunction: true
isCallable: true

[ServiceContainer.get] Instantiating 'customerService' as constructor

[ServiceContainer.get] ✓ Successfully instantiated 'customerService' as constructor

[ServiceContainer.get] Stored singleton instance for 'customerService'

[inject] ✓ Successfully retrieved 'customerService'
```

**Expected**: All type checks should pass, instantiation should succeed.

## Error Diagnosis

### Error Pattern 1: Service Not Found

```
[ServiceContainer.get] ✗ Service 'customerService' not found in factories. 
Registered services: [core services only - no customerService]
```

**Cause**: Module was not initialized before service retrieval.
**Solution**: Ensure module.initialize() completes before hooks that use the service run.

### Error Pattern 2: Invalid Type During Registration

```
[customerModule.initialize] Imported CustomerService (X.XXms)
isClass: false
type: "object"  ← WRONG: should be "function"

[ServiceContainer] Cannot register service 'customerService': definition must be a constructor or factory function. 
Got type: object
```

**Cause**: CustomerService import returned an object instead of the class.
**Solution**: Check that `/src/modules/features/customers/services/customerService.ts` properly exports the class.

### Error Pattern 3: Invalid Definition in Factories Map

```
[ServiceContainer.get] ✗ CRITICAL: Service 'customerService' has invalid definition in factories map!
Expected function but got object
Factory value: [object Object]
```

**Cause**: Something non-function was stored in the factories map.
**Solution**: Check that registerService() was called with correct parameters.

## Debugging Steps

### 1. Check Module Initialization Order

Look for:
```
[ModuleRegistry.initialize] ▶ Initializing module 'customers'
[ModuleRegistry.initialize] ✓ Module 'customers' marked as initialized
```

If you see an error before this, module initialization failed.

### 2. Verify CustomerService Import

Look for:
```
[customerModule.initialize] Imported CustomerService
isClass: true
type: "function"
```

If type is not "function", there's an import issue.

### 3. Check Registration

Look for:
```
[ServiceContainer.register] Verification - stored definition:
sameAsInput: true
```

If `sameAsInput: false`, something went wrong during registration.

### 4. Trace Service Retrieval

Look for:
```
[ServiceContainer.get] Factory retrieved for 'customerService'
type: "function"
isCallable: true
```

If `isCallable: false` or `type: "object"`, the factory is corrupted.

## Common Solutions

### Issue: "factory is not a function"

1. **Check initialization timing**: Ensure `initializeModules()` completes before components try to use `inject()`

2. **Verify module dependencies**: CustomerModule should have `dependencies: ['core', 'shared']`

3. **Check for circular imports**: Avoid importing services that import the container

4. **Verify export format**: Check that CustomerService class is properly exported:
   ```typescript
   export class CustomerService extends BaseService { ... }
   ```

5. **Check for race conditions**: If multiple components try to inject before initialization completes, add loading state

### Performance Considerations

The logs show timing information:
```
[customerModule.initialize] ✓ Customer module initialized successfully (X.XXms)
[ModuleRegistry.initialize] ✓ Module 'customers' initialize() completed (X.XXms)
[ModuleRegistry.initializeAll] ✓ Module initialization completed
duration: "X.XXms"
```

If initialization takes > 1000ms, there may be blocking operations. Consider using lazy loading.

## Console Filtering

To focus on specific errors, filter the browser console:

```
// Show only ServiceContainer errors
[ServiceContainer.get] ✗

// Show only module initialization errors
[customerModule.initialize] ✗

// Show only registration verification
Verification - stored definition
```

## Next Steps

1. Run the application with these enhancements
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for any ERROR logs with the patterns above
5. Compare with this guide to identify the issue
6. Report the specific error pattern to fix the root cause

## Key Metrics to Monitor

- **Registration Duration**: Should be < 1ms
- **Module Initialization**: Should be < 100ms per module
- **Service Retrieval**: Should be < 1ms for already instantiated singletons
- **Total Init Time**: Should be < 500ms for all modules

If any metric is significantly higher, there may be async operations or performance issues to investigate.