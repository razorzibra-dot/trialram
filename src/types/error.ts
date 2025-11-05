/**
 * Error Handling Types
 * Centralized types for error management and context
 */

export interface ServiceError {
  code: string;
  message: string;
  status: number;
  details?: Record<string, unknown>;
  timestamp: Date;
  context?: ErrorContext;
}

export interface ErrorContext {
  service: string;
  method: string;
  userId?: string;
  tenantId?: string;
  metadata?: Record<string, unknown>;
  stack?: string;
}