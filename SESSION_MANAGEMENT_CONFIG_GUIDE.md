# Session Management - Configuration Guide

**Version**: 1.0.0  
**Status**: ✅ Production Ready

---

## 🎯 Configuration Overview

This guide explains how to configure session management for different scenarios and use cases.

---

## 📊 Configuration Parameters

### sessionTimeout
- **What**: Total session duration before force logout
- **Type**: Number (seconds)
- **Default**: 3600 (1 hour)
- **Range**: 300 - 86400 (5 min - 24 hours)
- **Recommendation**: 
  - Development: 28800 (8 hours)
  - Production: 3600 (1 hour)
  - High Security: 1800 (30 minutes)

### idleTimeout
- **What**: Inactivity duration before warning
- **Type**: Number (seconds)
- **Default**: 1800 (30 minutes)
- **Range**: 60 - 43200 (1 min - 12 hours)
- **Recommendation**:
  - Development: 7200 (2 hours)
  - Production: 1800 (30 minutes)
  - High Security: 900 (15 minutes)

### idleWarningTime
- **What**: Time to show warning before idle logout
- **Type**: Number (seconds)
- **Default**: 300 (5 minutes)
- **Range**: 30 - 3600 (30 sec - 1 hour)
- **Recommendation**:
  - Development: 600 (10 minutes)
  - Production: 300 (5 minutes)
  - High Security: 180 (3 minutes)

### checkInterval
- **What**: How often to check session state
- **Type**: Number (milliseconds)
- **Default**: 10000 (10 seconds)
- **Range**: 1000 - 60000 (1 sec - 1 minute)
- **Recommendation**:
  - Development: 30000 (30 seconds)
  - Production: 10000 (10 seconds)
  - High Security: 5000 (5 seconds)

---

## 🛠️ Configuration Methods

### Method 1: Using Presets

**Quickest Method**

```typescript
import { sessionConfigService } from '@/services/sessionConfigService';

// Load preset
sessionConfigService.loadPreset('production');

// Use in provider
<SessionProvider config={sessionConfigService.getConfig()}>
  <App />
</SessionProvider>
```

**Available Presets**:
- `development`
- `production`
- `highSecurity`
- `lowSecurity`

### Method 2: Custom Configuration

**Most Flexible**

```typescript
const customConfig = {
  sessionTimeout: 7200,      // 2 hours
  idleTimeout: 3600,         // 1 hour
  idleWarningTime: 600,      // 10 minutes
  checkInterval: 20000       // 20 seconds
};

<SessionProvider config={customConfig}>
  <App />
</SessionProvider>
```

### Method 3: Environment-Based

**Automatic**

```typescript
// Automatically loads based on VITE_API_ENVIRONMENT
sessionConfigService.initializeFromEnvironment();

// development → development preset
// production → production preset
```

### Method 4: Dynamic Configuration

**Runtime Changes**

```typescript
// Change single value
sessionConfigService.updateConfigValue('idleTimeout', 900);

// Listen for changes
const unsubscribe = sessionConfigService.onConfigChange((newConfig) => {
  console.log('Config changed:', newConfig);
});

// Later: unsubscribe()
```

### Method 5: Tenant-Specific Configuration

**Per-Organization**

```typescript
async function getTenantSessionConfig(tenantId: string) {
  const tenant = await fetchTenant(tenantId);
  return {
    sessionTimeout: tenant.settings.sessionTimeout,
    idleTimeout: tenant.settings.idleTimeout,
    idleWarningTime: tenant.settings.idleWarningTime,
    checkInterval: 10000
  };
}

// Use in app initialization
const config = await getTenantSessionConfig(currentTenant);
<SessionProvider config={config}>
  <App />
</SessionProvider>
```

---

## 📋 Configuration Scenarios

### Scenario 1: Development Environment

**Goal**: Minimal interruptions, long sessions

```typescript
sessionConfigService.loadPreset('development');

// Results in:
{
  sessionTimeout: 28800,     // 8 hours
  idleTimeout: 7200,         // 2 hours
  idleWarningTime: 600,      // 10 minutes warning
  checkInterval: 30000       // Less frequent checks
}
```

**Use When**:
- ✅ Local development
- ✅ Testing features
- ✅ Long debugging sessions

---

### Scenario 2: Production Environment

**Goal**: Balance security and usability

```typescript
sessionConfigService.loadPreset('production');

// Results in:
{
  sessionTimeout: 3600,      // 1 hour
  idleTimeout: 1800,         // 30 minutes
  idleWarningTime: 300,      // 5 minutes warning
  checkInterval: 10000       // Regular checks
}
```

**Use When**:
- ✅ Live production environment
- ✅ Normal user workflows
- ✅ Standard security requirements

---

### Scenario 3: High Security

**Goal**: Strict security, frequent re-authentication

```typescript
sessionConfigService.loadPreset('highSecurity');

// Results in:
{
  sessionTimeout: 1800,      // 30 minutes
  idleTimeout: 900,          // 15 minutes
  idleWarningTime: 180,      // 3 minutes warning
  checkInterval: 5000        // Frequent checks
}
```

**Use When**:
- ✅ Banking/financial data
- ✅ Healthcare (HIPAA)
- ✅ Legal/sensitive information
- ✅ Government systems

---

### Scenario 4: Low Security

**Goal**: Minimal interruptions, mostly for open data

```typescript
sessionConfigService.loadPreset('lowSecurity');

// Results in:
{
  sessionTimeout: 86400,     // 24 hours
  idleTimeout: 43200,        // 12 hours
  idleWarningTime: 1800,     // 30 minutes warning
  checkInterval: 60000       // Minimal checks
}
```

**Use When**:
- ✅ Public/internal tools
- ✅ Non-sensitive data
- ✅ Internal employee dashboards
- ✅ Minimal security requirements

---

### Scenario 5: Call Center

**Goal**: Balance between no interruption and security

```typescript
const callCenterConfig = {
  sessionTimeout: 14400,     // 4 hours
  idleTimeout: 3600,         // 1 hour idle
  idleWarningTime: 900,      // 15 minutes warning
  checkInterval: 20000       // Less frequent checks
};

<SessionProvider config={callCenterConfig}>
  <App />
</SessionProvider>
```

**Rationale**:
- Agents work long shifts
- Need breaks without logout
- Security still important

---

### Scenario 6: Data Entry

**Goal**: Frequent timeout, prevent accidental data loss

```typescript
const dataEntryConfig = {
  sessionTimeout: 3600,      // 1 hour
  idleTimeout: 900,          // 15 minutes idle
  idleWarningTime: 300,      // 5 minutes warning
  checkInterval: 5000        // Frequent checks
};

<SessionProvider config={dataEntryConfig}>
  <App />
</SessionProvider>
```

**Rationale**:
- Critical data entry work
- Need to catch idle quickly
- Users save work frequently

---

### Scenario 7: Mobile App

**Goal**: Aggressive timeout for battery/security

```typescript
const mobileConfig = {
  sessionTimeout: 1800,      // 30 minutes
  idleTimeout: 600,          // 10 minutes
  idleWarningTime: 120,      // 2 minutes warning
  checkInterval: 15000       // Moderate checks
};

<SessionProvider config={mobileConfig}>
  <App />
</SessionProvider>
```

**Rationale**:
- Battery life concerns
- Screen lock likely to occur
- High security needed for mobile

---

### Scenario 8: API-Only Integration

**Goal**: Minimal UI interruption, API-driven

```typescript
// For API calls without UI
const apiConfig = {
  sessionTimeout: 7200,      // 2 hours
  idleTimeout: 3600,         // 1 hour
  idleWarningTime: 300,      // 5 minutes
  checkInterval: 60000       // Very infrequent
};
```

**Rationale**:
- Limited UI (mostly API)
- Check less frequently
- Long sessions acceptable

---

## 🔄 Role-Based Configuration

### Manager Role
```typescript
const managerConfig = {
  sessionTimeout: 3600,      // 1 hour
  idleTimeout: 1800,         // 30 minutes
  idleWarningTime: 300,      // 5 minutes
  checkInterval: 10000
};
```

### Agent Role
```typescript
const agentConfig = {
  sessionTimeout: 14400,     // 4 hours (longer shifts)
  idleTimeout: 3600,         // 1 hour
  idleWarningTime: 900,      // 15 minutes
  checkInterval: 20000
};
```

### Admin Role
```typescript
const adminConfig = {
  sessionTimeout: 1800,      // 30 minutes (strict)
  idleTimeout: 900,          // 15 minutes
  idleWarningTime: 180,      // 3 minutes
  checkInterval: 5000
};
```

### Customer Role
```typescript
const customerConfig = {
  sessionTimeout: 7200,      // 2 hours
  idleTimeout: 3600,         // 1 hour
  idleWarningTime: 600,      // 10 minutes
  checkInterval: 30000
};
```

---

## 🌍 Geographic/Regional Configuration

### GDPR (Europe)
```typescript
const gdprConfig = {
  sessionTimeout: 3600,      // 1 hour (strict)
  idleTimeout: 1800,         // 30 minutes
  idleWarningTime: 300,      // 5 minutes
  checkInterval: 10000
};
```

### HIPAA (Healthcare)
```typescript
const hipaaConfig = {
  sessionTimeout: 1800,      // 30 minutes (very strict)
  idleTimeout: 900,          // 15 minutes
  idleWarningTime: 180,      // 3 minutes
  checkInterval: 5000
};
```

### PCI-DSS (Payment)
```typescript
const pciConfig = {
  sessionTimeout: 1800,      // 30 minutes (very strict)
  idleTimeout: 900,          // 15 minutes
  idleWarningTime: 180,      // 3 minutes
  checkInterval: 5000
};
```

### SOC 2 (General Compliance)
```typescript
const soc2Config = {
  sessionTimeout: 3600,      // 1 hour
  idleTimeout: 1800,         // 30 minutes
  idleWarningTime: 300,      // 5 minutes
  checkInterval: 10000
};
```

---

## 📊 Comparison Table

| Scenario | Session | Idle | Warning | Check | Use Case |
|----------|---------|------|---------|-------|----------|
| Development | 8h | 2h | 10m | 30s | Local dev |
| Production | 1h | 30m | 5m | 10s | Standard use |
| High Security | 30m | 15m | 3m | 5s | Sensitive data |
| Low Security | 24h | 12h | 30m | 60s | Public data |
| Call Center | 4h | 1h | 15m | 20s | Agent shifts |
| Data Entry | 1h | 15m | 5m | 5s | Form entry |
| Mobile | 30m | 10m | 2m | 15s | Mobile app |
| GDPR | 1h | 30m | 5m | 10s | EU users |
| HIPAA | 30m | 15m | 3m | 5s | Healthcare |
| PCI-DSS | 30m | 15m | 3m | 5s | Payments |

---

## 🔐 Security Recommendations by Industry

### Financial Services
```typescript
const financeConfig = {
  sessionTimeout: 1800,      // 30 minutes
  idleTimeout: 900,          // 15 minutes
  idleWarningTime: 180,      // 3 minutes
  checkInterval: 5000        // 5 seconds
};
// Reasoning: Sensitive financial data requires strict re-authentication
```

### Healthcare
```typescript
const healthcareConfig = {
  sessionTimeout: 1800,      // 30 minutes
  idleTimeout: 900,          // 15 minutes
  idleWarningTime: 180,      // 3 minutes
  checkInterval: 5000        // 5 seconds
};
// Reasoning: HIPAA compliance and patient privacy
```

### E-Commerce
```typescript
const ecommerceConfig = {
  sessionTimeout: 7200,      // 2 hours
  idleTimeout: 3600,         // 1 hour
  idleWarningTime: 600,      // 10 minutes
  checkInterval: 20000       // 20 seconds
};
// Reasoning: Users need longer sessions but security still important
```

### SaaS/Multi-Tenant
```typescript
const saasConfig = {
  sessionTimeout: 3600,      // 1 hour
  idleTimeout: 1800,         // 30 minutes
  idleWarningTime: 300,      // 5 minutes
  checkInterval: 10000       // 10 seconds
};
// Reasoning: Balanced approach for diverse users
```

### Internal Tools
```typescript
const internalConfig = {
  sessionTimeout: 14400,     // 4 hours
  idleTimeout: 7200,         // 2 hours
  idleWarningTime: 900,      // 15 minutes
  checkInterval: 30000       // 30 seconds
};
// Reasoning: Internal users, less strict security
```

---

## 🚀 Deployment Checklist

Before deploying custom configuration:

- [ ] Validate configuration with `sessionConfigService.validateConfig()`
- [ ] Test with actual user workflows
- [ ] Ensure warning time is reasonable
- [ ] Verify idle timeout > warning time
- [ ] Test on different browsers
- [ ] Test on mobile devices
- [ ] Get security team approval
- [ ] Document in runbook
- [ ] Monitor logs after deployment
- [ ] Be ready to adjust

---

## 📝 Implementation Example

**Complete setup for production**:

```typescript
// src/modules/App.tsx
import SessionProvider from '@/providers/SessionProvider';
import { sessionConfigService } from '@/services/sessionConfigService';

// Load production config
sessionConfigService.loadPreset('production');

console.log('[App] Session Configuration:');
console.log(sessionConfigService.getConfigAsString());

export default function App() {
  return (
    <SessionProvider config={sessionConfigService.getConfig()}>
      <BrowserRouter>
        <AuthProvider>
          {/* Your app */}
        </AuthProvider>
      </BrowserRouter>
    </SessionProvider>
  );
}
```

---

## 🆘 Troubleshooting Configuration

### Config Not Applied
```typescript
// ❌ Wrong - Config loaded after render
<SessionProvider>
  <App />
</SessionProvider>

// ✅ Correct - Config loaded before
sessionConfigService.loadPreset('production');
const config = sessionConfigService.getConfig();
<SessionProvider config={config}>
  <App />
</SessionProvider>
```

### Invalid Configuration
```typescript
// Validate before use
if (sessionConfigService.validateConfig()) {
  // Safe to use
} else {
  // Config has issues - check console
}
```

### Users Complaining About Timeouts
```typescript
// Increase idle timeout
sessionConfigService.updateConfigValue('idleTimeout', 3600);

// Increase warning time
sessionConfigService.updateConfigValue('idleWarningTime', 600);
```

---

**Ready to configure!** 🎯