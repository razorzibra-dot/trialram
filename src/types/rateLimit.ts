/**
 * Rate Limiting and Session Management Types
 * Centralized types for rate limits and active sessions
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // milliseconds
  message: string;
  statusCode: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

export interface RateLimitViolation {
  id: string;
  userId: string;
  endpoint: string;
  timestamp: Date;
  ipAddress: string;
  requestCount: number;
  severity: 'warning' | 'block' | 'critical';
  resolved: boolean;
  resolvedAt?: Date;
}

export interface ActiveSession {
  sessionId: string;
  userId: string;
  startTime: Date;
  lastActivityTime: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

export interface RateLimitStats {
  totalViolations: number;
  activeViolations: number;
  mostFrequentUser: string;
  mostFrequentEndpoint: string;
  averageViolationsPerDay: number;
  lastViolation: Date;
}

// Impersonation-specific
export interface ImpersonationSession {
  sessionId: string;
  adminId: string;
  userId: string; // Impersonated user
  startTime: Date;
  endTime?: Date;
  reason: string;
  status: 'active' | 'ended' | 'revoked';
  actions: string[]; // Actions performed during session
}

export interface ImpersonationAction {
  timestamp: Date;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
}

export interface ImpersonationRateLimit {
  adminUserId: string;
  sessionCount: number;
  maxSessions: number;
  lastSessionTime: Date;
}