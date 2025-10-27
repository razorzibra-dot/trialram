---
title: Authentication System Architecture
description: JWT tokens, Supabase Auth, MFA support, and multi-factor authentication
category: Architecture
lastUpdated: 2025-01-20
status: Active
relatedModules: auth, super-admin, user-management
---

# Authentication System Architecture

## 🎯 Overview

**Authentication** verifies user identity through email/password and optional Multi-Factor Authentication (MFA). It creates JWT tokens that protect API endpoints and enable session management.

**Key Responsibilities:**
- Email/password login
- Email verification
- Password reset flows
- Multi-factor authentication (MFA)
- JWT token creation and validation
- Session token refresh
- Account lockout protection
- Security audit logging

**Why This Matters:**
- Verifies users are who they claim to be
- Protects accounts from unauthorized access
- MFA provides additional security layer
- Audit trails for compliance
- Token rotation prevents session hijacking

---

## 🏗️ Authentication Architecture

```
┌─────────────────────────────────────────┐
│      User Authentication Attempt        │
└────────────────┬────────────────────────┘
                 │
        ┌────────▼────────┐
        │ Email/Password  │
        │ Validation      │
        └────────┬────────┘
                 │
        ┌────────▼────────────────────┐
        │ Match against database      │
        │ bcrypt password compare     │
        └────────┬────────┬───────────┘
                 │        │
            FAIL │        │ SUCCESS
                 ▼        ▼
            ┌────────┐  ┌──────────────┐
            │ Deny   │  │ Check MFA    │
            │ Access │  │ Enabled?     │
            └────────┘  └──┬────────┬──┘
                           │        │
                       YES │        │ NO
                           ▼        ▼
                    ┌──────────┐  ┌─────────────────┐
                    │ Send MFA │  │ Create JWT      │
                    │ Code     │  │ Create Tokens   │
                    │ (Email   │  │ Store Session   │
                    │ or SMS)  │  └────────┬────────┘
                    └────┬─────┘           │
                         │                 │
                    ┌────▼─────┐           │
                    │ Verify   │           │
                    │ MFA Code │           │
                    └────┬─────┘           │
                         │                 │
                         │ ┌───────────────┘
                         │ │
                    ┌────▼────────────────┐
                    │ Authentication      │
                    │ Success             │
                    │ Return JWT & tokens │
                    └────────────────────┘
```

---

## 🔐 JWT Token Structure

### Token Format

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### JWT Payload (Claims)

```typescript
interface JWTClaims {
  // Standard JWT claims
  sub: string;              // Subject (user ID)
  aud: string;              // Audience
  iss: string;              // Issuer
  exp: number;              // Expiration time (Unix timestamp)
  iat: number;              // Issued at time
  nbf?: number;             // Not before time

  // Custom claims for PDS-CRM
  email: string;            // User email
  email_verified: boolean;  // Email verification status
  
  // Multi-tenant support
  tenant_id: string;        // User's tenant UUID
  tenant_name: string;      // Organization name
  
  // RBAC support
  roles: string[];          // User's roles
  permissions: string[];    // User's permissions
  
  // MFA status
  mfa_enabled: boolean;     // If MFA is active for user
  auth_method: 'password' | 'mfa' | 'sso'; // How authenticated
}

// Example decoded payload:
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@company.com",
  "email_verified": true,
  "tenant_id": "org-123",
  "tenant_name": "ACME Corp",
  "roles": ["Sales Manager", "User"],
  "permissions": ["customer_read", "sales_create", "sales_update"],
  "mfa_enabled": true,
  "auth_method": "mfa",
  "exp": 1706829600,
  "iat": 1706826000,
  "iss": "https://supabase.project.supabase.co",
  "aud": "authenticated"
}
```

---

## 📝 Login Flow Implementation

### Step 1: Email/Password Validation

```typescript
// src/services/authService.ts
export async function validateCredentials(
  email: string,
  password: string,
  tenantId: string
): Promise<{ valid: boolean; user?: User; error?: string }> {
  try {
    // 1. Validate input format
    if (!email.includes('@')) {
      return { valid: false, error: 'Invalid email format' };
    }
    if (password.length < 8) {
      return { valid: false, error: 'Invalid password format' };
    }

    // 2. Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Check for specific errors
      if (error.message.includes('Invalid login credentials')) {
        // Log failed attempt for audit
        await logAuthAttempt(email, 'failed', 'Invalid credentials', tenantId);
        return { 
          valid: false, 
          error: 'Invalid email or password' 
        };
      }
      throw error;
    }

    // 3. Get user profile
    const user = await userService.getUser(
      data.user.id,
      tenantId
    );

    // 4. Check if account is active
    if (user.status !== 'active') {
      await logAuthAttempt(email, 'failed', 'Account inactive', tenantId);
      return { 
        valid: false, 
        error: 'Account is inactive' 
      };
    }

    // 5. Log successful attempt
    await logAuthAttempt(email, 'success', 'Credentials validated', tenantId);

    return { valid: true, user };
  } catch (error) {
    console.error('Credential validation failed:', error);
    throw error;
  }
}
```

### Step 2: MFA Check & Trigger

```typescript
// src/services/mfaService.ts
export async function isMFAEnabled(userId: string, tenantId: string): Promise<boolean> {
  try {
    const user = await userService.getUser(userId, tenantId);
    return user.mfaEnabled || false;
  } catch {
    return false;
  }
}

export async function sendMFACode(
  email: string,
  userId: string,
  tenantId: string,
  method: 'email' | 'sms' = 'email'
): Promise<{ success: boolean; sessionToken?: string }> {
  try {
    // 1. Generate secure 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 2. Hash code with salt
    const hashedCode = bcrypt.hashSync(code, 10);
    
    // 3. Store code in temporary table with 10-minute expiry
    await supabase
      .from('mfa_sessions')
      .insert({
        user_id: userId,
        tenant_id: tenantId,
        hashed_code: hashedCode,
        method: method,
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
      });

    // 4. Send code via email or SMS
    if (method === 'email') {
      await sendEmail({
        to: email,
        subject: 'Your MFA Code',
        template: 'mfa-code',
        data: { code, expiryMinutes: 10 },
      });
    } else if (method === 'sms') {
      await sendSMS({
        to: getUserPhone(userId),
        message: `Your MFA code is: ${code}. Valid for 10 minutes.`,
      });
    }

    // 5. Create temporary session token
    const sessionToken = generateSessionToken();
    await redis.setex(
      `mfa-session:${sessionToken}`,
      600, // 10 minutes
      JSON.stringify({ userId, tenantId, email })
    );

    // 6. Log MFA attempt
    await logAuthAttempt(email, 'mfa_sent', `Code sent via ${method}`, tenantId);

    return { success: true, sessionToken };
  } catch (error) {
    console.error('Failed to send MFA code:', error);
    throw error;
  }
}
```

### Step 3: MFA Verification

```typescript
export async function verifyMFACode(
  sessionToken: string,
  code: string,
  tenantId: string
): Promise<{ valid: boolean; user?: User; error?: string }> {
  try {
    // 1. Retrieve MFA session
    const sessionData = await redis.get(`mfa-session:${sessionToken}`);
    if (!sessionData) {
      return { 
        valid: false, 
        error: 'MFA session expired' 
      };
    }

    const { userId, email } = JSON.parse(sessionData);

    // 2. Get stored MFA session from DB
    const { data: mfaSessions } = await supabase
      .from('mfa_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!mfaSessions || mfaSessions.length === 0) {
      return { 
        valid: false, 
        error: 'No active MFA session' 
      };
    }

    const mfaSession = mfaSessions[0];

    // 3. Check if expired
    if (new Date() > new Date(mfaSession.expires_at)) {
      await supabase
        .from('mfa_sessions')
        .delete()
        .eq('id', mfaSession.id);
      
      return { 
        valid: false, 
        error: 'MFA code expired' 
      };
    }

    // 4. Verify code (constant-time comparison)
    const isValid = await bcrypt.compare(code, mfaSession.hashed_code);
    if (!isValid) {
      // Log failed MFA attempt
      await logAuthAttempt(email, 'mfa_failed', 'Invalid code', tenantId);
      
      return { 
        valid: false, 
        error: 'Invalid MFA code' 
      };
    }

    // 5. Clean up used MFA session
    await supabase
      .from('mfa_sessions')
      .delete()
      .eq('id', mfaSession.id);

    // 6. Clean up session token
    await redis.del(`mfa-session:${sessionToken}`);

    // 7. Get user profile
    const user = await userService.getUser(userId, tenantId);

    // 8. Log successful MFA
    await logAuthAttempt(email, 'mfa_success', 'MFA verified', tenantId);

    return { valid: true, user };
  } catch (error) {
    console.error('MFA verification failed:', error);
    throw error;
  }
}
```

### Step 4: Create Session & JWT

```typescript
export async function createSession(
  user: User,
  tenantId: string,
  authMethod: 'password' | 'mfa' = 'password'
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  try {
    // 1. Get user permissions
    const rbacService = rbacService as IRBACService;
    const roles = await rbacService.getRoles(tenantId);
    const userRoles = roles.filter(r => r.userIds?.includes(user.id));
    const permissions = userRoles
      .flatMap(r => r.permissionIds || [])
      .filter((value, index, self) => self.indexOf(value) === index); // unique

    // 2. Create JWT payload
    const jwtPayload: JWTClaims = {
      sub: user.id,
      email: user.email,
      email_verified: user.emailVerified,
      tenant_id: tenantId,
      tenant_name: user.tenantName,
      roles: userRoles.map(r => r.name),
      permissions: permissions,
      mfa_enabled: user.mfaEnabled,
      auth_method: authMethod,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
      iss: import.meta.env.VITE_SUPABASE_URL,
      aud: 'authenticated',
    };

    // 3. Sign JWT with secret
    const accessToken = jsonwebtoken.sign(
      jwtPayload,
      import.meta.env.VITE_JWT_SECRET,
      { algorithm: 'HS256' }
    );

    // 4. Create refresh token
    const refreshToken = generateSecureToken();
    const refreshTokenHash = hashToken(refreshToken);

    // 5. Store refresh token in DB with expiry (7 days)
    await supabase
      .from('auth_sessions')
      .insert({
        user_id: user.id,
        tenant_id: tenantId,
        refresh_token_hash: refreshTokenHash,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ip_address: getClientIP(),
        user_agent: navigator.userAgent,
      });

    // 6. Store tokens in session store
    const { setUser, setTenant } = useSessionStore();
    setUser({
      ...user,
      permissions: permissions.map(p => p.name),
    });
    setTenant({
      id: tenantId,
      name: user.tenantName,
    });

    // 7. Store tokens in localStorage
    localStorage.setItem('sb-auth-token', accessToken);
    localStorage.setItem('sb-refresh-token', refreshToken);
    localStorage.setItem(
      'session-expiry',
      (Date.now() + 60 * 60 * 1000).toString()
    );

    // 8. Log successful authentication
    await logAuthAttempt(
      user.email,
      'login_success',
      `Logged in via ${authMethod}`,
      tenantId
    );

    // 9. Update last login
    await userService.updateUser(user.id, {
      lastLogin: new Date(),
    }, tenantId);

    return {
      accessToken,
      refreshToken,
      expiresIn: 60 * 60, // 1 hour in seconds
    };
  } catch (error) {
    console.error('Session creation failed:', error);
    throw error;
  }
}
```

---

## 🔄 Token Refresh Flow

```typescript
export async function refreshAccessToken(
  expiredToken: string,
  refreshToken: string,
  tenantId: string
): Promise<{ accessToken: string; expiresIn: number }> {
  try {
    // 1. Validate refresh token exists and not expired
    const { data: sessions } = await supabase
      .from('auth_sessions')
      .select('*')
      .eq('tenant_id', tenantId)
      .gt('expires_at', new Date().toISOString())
      .limit(1);

    if (!sessions || sessions.length === 0) {
      throw new Error('Refresh token expired');
    }

    const session = sessions[0];
    const refreshTokenHash = hashToken(refreshToken);

    // 2. Verify refresh token hash matches
    if (session.refresh_token_hash !== refreshTokenHash) {
      throw new Error('Invalid refresh token');
    }

    // 3. Decode expired JWT to get user info
    const decoded = jsonwebtoken.decode(expiredToken) as JWTClaims;

    // 4. Create new JWT with same claims but new expiry
    const newPayload: JWTClaims = {
      ...decoded,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
    };

    const newAccessToken = jsonwebtoken.sign(
      newPayload,
      import.meta.env.VITE_JWT_SECRET,
      { algorithm: 'HS256' }
    );

    // 5. Update session in DB
    await supabase
      .from('auth_sessions')
      .update({
        last_refreshed_at: new Date(),
      })
      .eq('id', session.id);

    // 6. Store new token
    localStorage.setItem('sb-auth-token', newAccessToken);
    localStorage.setItem(
      'session-expiry',
      (Date.now() + 60 * 60 * 1000).toString()
    );

    return {
      accessToken: newAccessToken,
      expiresIn: 60 * 60,
    };
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
}
```

---

## 🔒 Password Reset Flow

```typescript
export async function requestPasswordReset(
  email: string,
  tenantId: string
): Promise<{ success: boolean }> {
  try {
    // 1. Find user by email
    const user = await userService.getUserByEmail(email, tenantId);
    if (!user) {
      // Don't reveal if email exists (security best practice)
      return { success: true };
    }

    // 2. Generate secure reset token
    const resetToken = generateSecureToken();
    const resetTokenHash = hashToken(resetToken);

    // 3. Store reset token with 24-hour expiry
    await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        tenant_id: tenantId,
        token_hash: resetTokenHash,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

    // 4. Send reset email
    const resetUrl = `${window.location.origin}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      data: { resetUrl, expiryHours: 24 },
    });

    // 5. Log reset request
    await logAuthAttempt(
      email,
      'password_reset_requested',
      'Reset email sent',
      tenantId
    );

    return { success: true };
  } catch (error) {
    console.error('Password reset request failed:', error);
    throw error;
  }
}

export async function resetPassword(
  resetToken: string,
  newPassword: string,
  tenantId: string
): Promise<{ success: boolean }> {
  try {
    // 1. Find reset token
    const { data: tokens } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('tenant_id', tenantId)
      .gt('expires_at', new Date().toISOString())
      .limit(1);

    if (!tokens || tokens.length === 0) {
      throw new Error('Invalid or expired reset token');
    }

    const token = tokens[0];
    const resetTokenHash = hashToken(resetToken);

    if (token.token_hash !== resetTokenHash) {
      throw new Error('Invalid reset token');
    }

    // 2. Validate new password
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // 3. Update password in Supabase Auth
    const { error } = await supabase.auth.admin.updateUserById(
      token.user_id,
      { password: newPassword }
    );

    if (error) throw error;

    // 4. Invalidate all existing sessions
    await supabase
      .from('auth_sessions')
      .delete()
      .eq('user_id', token.user_id);

    // 5. Delete reset token
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('id', token.id);

    // 6. Log password reset
    const user = await userService.getUser(token.user_id, tenantId);
    await logAuthAttempt(
      user.email,
      'password_reset_success',
      'Password changed',
      tenantId
    );

    return { success: true };
  } catch (error) {
    console.error('Password reset failed:', error);
    throw error;
  }
}
```

---

## 📊 Database Schema

```sql
-- Auth sessions for refresh tokens
CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  refresh_token_hash VARCHAR NOT NULL,  -- Hashed, never store plain text
  
  created_at TIMESTAMP DEFAULT now(),
  last_refreshed_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  
  ip_address INET,
  user_agent TEXT,
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- MFA sessions for code verification
CREATE TABLE mfa_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  hashed_code VARCHAR NOT NULL,  -- Hashed 6-digit code
  method VARCHAR NOT NULL,       -- 'email' or 'sms'
  
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP NOT NULL,
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  token_hash VARCHAR NOT NULL,   -- Hashed token
  
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create indexes for fast lookups
CREATE INDEX idx_auth_sessions_user ON auth_sessions(user_id, tenant_id);
CREATE INDEX idx_auth_sessions_expiry ON auth_sessions(expires_at);
CREATE INDEX idx_mfa_sessions_user ON mfa_sessions(user_id, expires_at);
CREATE INDEX idx_password_reset_token_hash ON password_reset_tokens(token_hash);
```

---

## ✅ Security Best Practices

### ✅ DO
- Store JWT tokens in localStorage (or secure httpOnly cookies)
- Include tenant_id in JWT claims
- Hash password reset tokens
- Hash refresh tokens
- Invalidate all sessions on password change
- Use exponential backoff for failed login attempts
- Log all authentication events
- Validate token expiry before API calls
- Implement rate limiting on login attempts

### ❌ DON'T
- Store passwords in plain text
- Include passwords in JWT
- Store tokens in sessionStorage (lost on tab close)
- Trust client-side validation only
- Store refresh tokens in JWT
- Log sensitive data (passwords, tokens)
- Use short expiry times (creates refresh burden)
- Allow unlimited login attempts

---

## ✅ Implementation Checklist

- [ ] Supabase Auth configured for email/password
- [ ] JWT payload structure includes tenant_id and permissions
- [ ] Login flow validates credentials
- [ ] MFA triggered if enabled
- [ ] MFA code sent via email/SMS
- [ ] Tokens stored in localStorage
- [ ] Session store updated with user info
- [ ] Token auto-refresh implemented
- [ ] Password reset flow implemented
- [ ] Account lockout after failed attempts
- [ ] All auth events logged
- [ ] Refresh token stored in DB with hash

---

## 🔗 Related Documentation

- [Session Management](./SESSION_MANAGEMENT.md) - Token storage and refresh
- [RBAC & Permissions](./RBAC_AND_PERMISSIONS.md) - Permission claims in JWT
- [Service Factory Pattern](./SERVICE_FACTORY.md) - Using JWT in API calls

---

**Last Updated**: 2025-01-20  
**Status**: ✅ Active and Maintained  
**Maintainer**: Architecture Team