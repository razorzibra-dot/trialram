# Configuration Module - Architecture & UI Consistency

## Overview
The Configuration module provides tools for testing and validating system configurations including email, SMS, payment gateways, and API endpoints.

## Module Structure

```
configuration/
├── components/         # Reusable UI components
│   ├── ConfigTestResultPanel.tsx
│   └── index.ts
├── hooks/             # Custom React hooks
│   ├── useConfigurationTests.ts
│   └── index.ts
├── services/          # Business logic and API integration
│   ├── configTestService.ts
│   └── index.ts
├── types/             # TypeScript type definitions
│   ├── configTest.ts
│   └── index.ts
├── views/             # Page components
│   ├── ConfigurationTestPage.tsx
│   └── TenantConfigurationPage.tsx
├── index.ts           # Module entry point
├── routes.tsx         # Route definitions
└── ARCHITECTURE.md    # This file
```

## UI Consistency Standards

### Page Layout
```
┌─────────────────────────────────────────┐
│ PageHeader (Title, Description)         │
├─────────────────────────────────────────┤
│ Info Alert (Instructions)               │
├─────────────────────────────────────────┤
│ Email Test Card                         │
│ ├─ Form Input                           │
│ ├─ Form Button                          │
│ └─ Hidden: Result displays in drawer    │
├─────────────────────────────────────────┤
│ SMS Test Card                           │
│ ... (same pattern)                      │
├─────────────────────────────────────────┤
│ Payment Gateway Test Card               │
│ ... (same pattern)                      │
├─────────────────────────────────────────┤
│ API Endpoint Test Card                  │
│ ... (same pattern)                      │
├─────────────────────────────────────────┤
│ Test History Table (Optional)           │
└─────────────────────────────────────────┘
          +
        [Result Side Drawer]
```

### Component Patterns

#### Test Card Pattern
Each test type follows a consistent card structure:

```typescript
<Card
  title={
    <Space>
      <Icon />
      <span>Test Name</span>
    </Space>
  }
>
  <Form layout="vertical" onFinish={handleTest}>
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <Form.Item
          label="Input Field"
          name="field"
          rules={[...]}
        >
          <Input />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<SendOutlined />}>
            Run Test
          </Button>
        </Form.Item>
      </Col>
    </Row>
    <Form.Item>
      <TextArea placeholder="Optional message" />
    </Form.Item>
  </Form>
</Card>
```

**Key Features:**
- Icon + Label in header for visual consistency
- Responsive layout (stacked on mobile, side-by-side on desktop)
- Input fields on the left, submit button on the right
- Optional message field below
- Results display in side drawer instead of inline

### Result Display Pattern

Results are shown in a **ConfigTestResultPanel** drawer with:
1. **Result Status**: Visual feedback (success/error/testing)
2. **Detailed Information**: Test metadata and results
3. **Test History**: Timeline of recent tests
4. **Tips/Help**: Contextual guidance for success/error states

## Data Flow

### Test Execution Flow

```
User Input (Form)
    ↓
handleTest() (Component)
    ↓
useConfigurationTests hook
    ↓
configTestService.testX()
    ↓
API/Mock Implementation
    ↓
ConfigTestResult
    ↓
Update State (result, history)
    ↓
Open ResultPanel
    ↓
Display Results
```

### Service Pattern

```typescript
class ConfigTestService {
  // Each test method:
  // 1. Records start time
  // 2. Calls API (or mock)
  // 3. Records test in history
  // 4. Returns ConfigTestResult
  
  async testEmail(config: EmailTestConfig): Promise<ConfigTestResult> {
    const startTime = Date.now();
    try {
      // Test implementation
      const duration = Date.now() - startTime;
      const result: ConfigTestResult = {
        status: 'success',
        message: '...',
        timestamp: new Date().toISOString(),
        duration
      };
      this.addToHistory(...);
      return result;
    } catch (error) {
      // Error handling
      const result: ConfigTestResult = {
        status: 'error',
        message: '...',
        timestamp: new Date().toISOString()
      };
      this.addToHistory(...);
      throw result;
    }
  }
}
```

### Hook Pattern

```typescript
export const useConfigurationTests = () => {
  const [result, setResult] = useState<ConfigTestResult | null>(null);
  const [history, setHistory] = useState<ConfigTestHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const testEmail = useCallback(async (config: EmailTestConfig) => {
    try {
      setIsLoading(true);
      const testResult = await configTestService.testEmail(config);
      setResult(testResult);
      setHistory(configTestService.getTestHistory());
      return testResult;
    } catch (error) {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return { result, history, isLoading, testEmail, testSMS, ... };
};
```

## Type System

### Test Type Hierarchy

```typescript
// Base types for each test
type TestType = 'email' | 'sms' | 'payment' | 'api';
type TestStatus = 'idle' | 'testing' | 'success' | 'error';

// Configuration inputs
interface EmailTestConfig {
  recipientEmail: string;
  testMessage?: string;
}

interface SMSTestConfig {
  phoneNumber: string;
  testMessage?: string;
}

interface PaymentTestConfig {
  gateway: 'stripe' | 'paypal' | 'razorpay';
}

interface APITestConfig {
  endpoint: string;
  method?: 'GET' | 'POST';
  timeout?: number;
}

// Test result
interface ConfigTestResult {
  status: 'success' | 'error' | 'testing';
  message: string;
  details?: string;
  timestamp: string;
  duration?: number;
}

// Historical record
interface ConfigTestHistory {
  id: string;
  type: TestType;
  status: 'success' | 'error';
  message: string;
  timestamp: string;
}
```

## State Management

### Page State
```typescript
const [activeTest, setActiveTest] = useState<string | null>(null);
const [isPanelVisible, setIsPanelVisible] = useState(false);

// Track which test is currently running
// Useful for showing loading state on correct button
```

### Test State (from Hook)
```typescript
const {
  result,        // Current test result
  history,       // All test results
  isLoading,     // Loading state
  activeTest,    // Which test type is running
  error,         // Error state
  testEmail,     // Test function
  testSMS,       // Test function
  testPaymentGateway,  // Test function
  testAPI,       // Test function
  clearHistory   // Clear history function
} = useConfigurationTests();
```

## Error Handling Strategy

### Service Level
- Simulate realistic delays (2-2.5 seconds)
- Return error objects with detailed messages
- Add to history even when tests fail
- Provide actionable error details

### Hook Level
- Catch service errors
- Set error state for UI feedback
- Still update history and results for display
- Wrap errors in proper Error objects

### Component Level
- Display user-friendly error messages
- Show error tips in result panel
- Allow users to retry tests
- Maintain test history for reference

## Visual Feedback

### Test Execution States
1. **Idle**: Initial state, ready for input
2. **Testing**: Loading spinner, button disabled
3. **Success**: Green result, success message
4. **Error**: Red result, error message

### Result Panel Feedback
- **Success Tips**: Green box with checkmarks
- **Error Tips**: Red box with action items
- **Test History**: Timeline showing past results
- **Duration**: Show how long test took

## API Integration (TODO)

Current implementation uses mock data. Replace with:

```typescript
async testEmail(config: EmailTestConfig): Promise<ConfigTestResult> {
  // TODO: Replace with actual API call
  // const response = await fetch('/api/config/test/email', {
  //   method: 'POST',
  //   headers: { 'Authorization': `Bearer ${getToken()}` },
  //   body: JSON.stringify(config)
  // });
  // const data = await response.json();
  // return data;
}
```

## Performance Considerations

### Test History Management
- Limit history to last 50 tests
- Implement clearing mechanism
- Store in memory (not persistent by default)
- Can be extended to localStorage/DB later

### Form Management
- Use Ant Design Form for built-in validation
- Reset forms after successful submission
- Preserve values on validation errors
- Lazy validate for better UX

### Rendering Optimization
- Result panel is lazily rendered (only when visible)
- History table uses virtual scrolling for large lists
- Memoize form validators

## Testing Scenarios

### Positive Tests
- Valid email configuration
- Valid phone number configuration
- Valid payment gateway credentials
- Valid API endpoints

### Negative Tests
- Invalid email addresses
- Invalid phone numbers
- Expired payment gateway keys
- Unreachable API endpoints
- Network timeouts

### Edge Cases
- Empty optional fields
- Very long input strings
- Special characters in inputs
- Concurrent test executions

## Security Considerations

### Input Validation
- Email format validation
- Phone number format validation
- URL/endpoint validation
- Timeout configuration

### Credential Handling
- Don't log sensitive credentials
- Don't display full credentials in results
- Mask credentials in history
- Use secure transmission (HTTPS)

### API Security
- Include authentication headers
- Use CORS properly
- Implement rate limiting
- Validate response types

## Future Enhancements

1. **Scheduled Tests**: Periodic automated configuration checks
2. **Alerts**: Notify admins when tests fail
3. **Performance Analytics**: Track test performance over time
4. **Advanced Validation**: More detailed configuration checks
5. **Batch Testing**: Run all tests simultaneously
6. **Report Generation**: Export test results and history
7. **Configuration Profiles**: Save and reuse test configurations