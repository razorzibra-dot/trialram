# Task 3.10 Quick Reference Guide

## Overview
Action tracking for super admin impersonation sessions. Automatically record all actions performed while impersonating another user.

---

## Quick Start

### Using in a Component

```typescript
import { useImpersonationActionTracker } from '@/hooks';

function MyComponent() {
  const tracker = useImpersonationActionTracker();

  // Track page view
  useEffect(() => {
    tracker.trackPageView('/my-page');
  }, [tracker]);

  // Track API call
  const fetchData = async () => {
    const start = Date.now();
    const response = await api.get('/data');
    const duration = Date.now() - start;
    
    await tracker.trackApiCall('GET', 'data', undefined, response.status, duration);
    return response.data;
  };

  // Track CRUD operations
  const createRecord = async (data) => {
    const response = await api.post('/records', data);
    await tracker.trackCreate('record', response.data.id, data);
  };

  return <div>...</div>;
}
```

---

## Available Methods

### Page View Tracking
```typescript
await tracker.trackPageView('/customers');
await tracker.trackPageView('/customers', { filters: { status: 'active' } });
```

### API Call Tracking
```typescript
await tracker.trackApiCall('GET', 'customers');
await tracker.trackApiCall('GET', 'customers', 'cust_123', 200, 150);
await tracker.trackApiCall('POST', 'customers', undefined, 201, 250, { source: 'web' });
```

### CRUD Operations
```typescript
await tracker.trackCreate('customer', 'cust_123', { name: 'Acme Corp' });
await tracker.trackUpdate('customer', 'cust_123', { status: 'active' });
await tracker.trackDelete('customer', 'cust_123');
```

### Data Operations
```typescript
await tracker.trackExport('customers', 'csv', 100);
await tracker.trackSearch('customers', 'Acme', 5);
await tracker.trackPrint('/report/customers');
```

### Retrieving Actions
```typescript
// Get all tracked actions
const actions = tracker.getActions();

// Get action count
const count = tracker.getActionCount();

// Get summary by action type
const summary = tracker.getActionSummary();
// Returns: { PAGE_VIEW: 2, API_CALL: 5, CREATE: 1, UPDATE: 0, ... }

// Clear actions (usually not needed)
tracker.clearActions();
```

### Status
```typescript
// Check if currently tracking
console.log(tracker.isTracking); // boolean

// Get current session ID
console.log(tracker.sessionId); // string | null
```

---

## Action Types

| Type | Method | Example |
|------|--------|---------|
| PAGE_VIEW | trackPageView | User visited /customers page |
| API_CALL | trackApiCall | GET /api/customers returned 200 |
| CREATE | trackCreate | Created new customer record |
| UPDATE | trackUpdate | Updated customer status |
| DELETE | trackDelete | Deleted customer record |
| EXPORT | trackExport | Exported 100 customers to CSV |
| SEARCH | trackSearch | Searched for "Acme" (5 results) |
| PRINT | trackPrint | Printed customer report |

---

## Common Patterns

### Track Page Navigation
```typescript
useEffect(() => {
  tracker.trackPageView(pathname);
}, [pathname, tracker]);
```

### Track Form Submission
```typescript
const handleSubmit = async (formData) => {
  try {
    const start = Date.now();
    const response = await api.post('/api/customers', formData);
    const duration = Date.now() - start;

    await tracker.trackApiCall('POST', 'customers', undefined, response.status, duration);
    await tracker.trackCreate('customer', response.data.id, { name: formData.name });

    return response.data;
  } catch (error) {
    // Tracking errors don't block the main operation
    console.error('Error:', error);
  }
};
```

### Track Search
```typescript
const handleSearch = async (query) => {
  const results = await api.get('/api/customers', { params: { q: query } });
  
  await tracker.trackSearch('customers', query, results.length);
  
  return results;
};
```

### Track Export
```typescript
const handleExport = async (format) => {
  const response = await api.get(`/api/customers/export`, { params: { format } });
  
  await tracker.trackExport('customers', format, response.data.count);
  
  return response.data;
};
```

### Get Action Summary for Display
```typescript
const ActionSummary = () => {
  const tracker = useImpersonationActionTracker();
  const summary = tracker.getActionSummary();

  return (
    <div>
      <p>Page Views: {summary.PAGE_VIEW}</p>
      <p>API Calls: {summary.API_CALL}</p>
      <p>Created: {summary.CREATE}</p>
      <p>Updated: {summary.UPDATE}</p>
      <p>Deleted: {summary.DELETE}</p>
    </div>
  );
};
```

---

## Integration with Impersonation End

When ending an impersonation session, submit tracked actions to the backend:

```typescript
// In ImpersonationBanner or impersonation end handler:
import { superUserService } from '@/services/serviceFactory';
import { useImpersonationActionTracker } from '@/hooks';

async function endImpersonationSession() {
  const tracker = useImpersonationActionTracker();
  const { activeSession } = useImpersonationMode();
  
  // Get all tracked actions
  const actions = tracker.getActions();
  
  // Submit to backend
  if (activeSession?.id) {
    await superUserService.endImpersonation(activeSession.id, actions);
  }
  
  // Clear local tracking
  tracker.clearActions();
}
```

---

## Error Handling

The hook handles errors gracefully - tracking failures don't block main operations:

```typescript
// This won't throw even if tracking fails
await tracker.trackPageView('/page');

// Errors are logged as warnings, not thrown
// Your component continues to work normally
```

### When NOT Impersonating

If you try to track when not impersonating:

```typescript
if (!tracker.isTracking) {
  // Tracking is inactive
  // Methods still work but don't record anything
}
```

---

## Backend Action Storage

Tracked actions are stored in the `actionsTaken` array of the impersonation log:

```typescript
// Database schema (actionsTaken field)
actionsTaken: [
  {
    actionType: 'PAGE_VIEW',
    resource: '/customers',
    timestamp: '2025-02-21T10:00:00Z',
    ...
  },
  {
    actionType: 'API_CALL',
    resource: 'customers',
    method: 'GET',
    status: 200,
    duration: 150,
    timestamp: '2025-02-21T10:00:05Z',
    ...
  },
  ...
]
```

---

## Files & Locations

| Purpose | File |
|---------|------|
| Hook | `src/hooks/useImpersonationActionTracker.ts` |
| Service | `src/services/impersonationActionTracker.ts` |
| Factory | `src/services/serviceFactory.ts` |
| Types | `src/types/superUserModule.ts` |
| Tests | `src/services/__tests__/impersonationActionTracker.test.ts` |
| Tests | `src/hooks/__tests__/useImpersonationActionTracker.test.ts` |

---

## Testing

All action tracking is covered by 70+ test cases:
- Service tests: 45+ cases
- Hook tests: 25+ cases

Run tests:
```bash
npm test -- impersonationActionTracker
npm test -- useImpersonationActionTracker
```

---

## Performance Notes

- **Memory**: 1000 action limit per session (oldest removed if exceeded)
- **Lookup**: O(1) for session retrieval
- **Query**: O(n) for action retrieval (linear in action count)
- **Summary**: O(n) for summary calculation

For typical usage (100-500 actions per session), performance is excellent.

---

## FAQ

**Q: Do I need to manually submit actions when ending impersonation?**
A: Yes, you need to collect the actions and pass them to `endImpersonation()`. This is typically done in the ImpersonationBanner or impersonation end handler.

**Q: What if tracking fails?**
A: Tracking errors are logged as warnings but don't throw exceptions. Your main operation continues normally.

**Q: Can I track across multiple components?**
A: Yes! Each component gets the same hook instance with the same session ID, so all tracking is automatically aggregated.

**Q: How many actions can I track?**
A: Up to 1000 actions per session. Oldest actions are removed if you exceed this limit.

**Q: Do I need to clear actions manually?**
A: No, they're cleared automatically when the impersonation session ends. You can manually clear if needed.

**Q: What's the performance impact?**
A: Negligible. Each track operation is O(1) except for retrieval/summary which is O(n) on action count.

---

## Related Tasks

- **Task 3.9**: Impersonation Auto-Cleanup on Logout
- **Task 3.11**: Create Impersonation History View (uses tracked actions)
- **Task 3.12**: Add Impersonation Details Panel (shows action summary)

---

## Support

For issues or questions about action tracking:
1. Check the JSDoc comments in `useImpersonationActionTracker.ts`
2. Review test cases for usage examples
3. See `TASK_3_10_COMPLETION_SUMMARY.md` for detailed documentation