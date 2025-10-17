/**
 * Centralized Error Handling for Services
 * Provides consistent error handling, logging, and response formatting
 */

export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_FORMAT = 'INVALID_FORMAT',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',

  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  RESOURCE_DELETED = 'RESOURCE_DELETED',

  // Permission errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ROLE_REQUIRED = 'ROLE_REQUIRED',
  TENANT_ACCESS_DENIED = 'TENANT_ACCESS_DENIED',

  // Network/API errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Business logic errors
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export interface ServiceError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  field?: string;
  timestamp: string;
  service: string;
  operation: string;
  userId?: string;
  tenantId?: string;
  correlationId?: string;
}

export interface ErrorContext {
  service: string;
  operation: string;
  userId?: string;
  tenantId?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Service Error class for consistent error handling
 */
export class CrmServiceError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;
  public readonly field?: string;
  public readonly timestamp: string;
  public readonly service: string;
  public readonly operation: string;
  public readonly userId?: string;
  public readonly tenantId?: string;
  public readonly correlationId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    context: ErrorContext,
    details?: Record<string, unknown>,
    field?: string
  ) {
    super(message);
    this.name = 'CrmServiceError';
    this.code = code;
    this.details = details;
    this.field = field;
    this.timestamp = new Date().toISOString();
    this.service = context.service;
    this.operation = context.operation;
    this.userId = context.userId;
    this.tenantId = context.tenantId;
    this.correlationId = context.correlationId || this.generateCorrelationId();

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, CrmServiceError.prototype);
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON(): ServiceError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      field: this.field,
      timestamp: this.timestamp,
      service: this.service,
      operation: this.operation,
      userId: this.userId,
      tenantId: this.tenantId,
      correlationId: this.correlationId
    };
  }
}

/**
 * Error Handler utility class
 */
export class ErrorHandler {
  private static logErrors = true;
  private static errorCallbacks: Array<(error: ServiceError) => void> = [];

  /**
   * Configure error handling
   */
  static configure(options: {
    logErrors?: boolean;
    onError?: (error: ServiceError) => void;
  }): void {
    if (options.logErrors !== undefined) {
      this.logErrors = options.logErrors;
    }
    if (options.onError) {
      this.errorCallbacks.push(options.onError);
    }
  }

  /**
   * Handle and format errors consistently
   */
  static handle(
    error: unknown,
    context: ErrorContext,
    defaultCode: ErrorCode = ErrorCode.INTERNAL_ERROR
  ): never {
    let serviceError: CrmServiceError;

    if (error instanceof CrmServiceError) {
      serviceError = error;
    } else if (error instanceof Error) {
      // Map common error types
      const code = this.mapErrorToCode(error, defaultCode);
      serviceError = new CrmServiceError(code, error.message, context, error);
    } else {
      // Handle non-Error objects
      const message = typeof error === 'string' ? error : 'Unknown error occurred';
      serviceError = new CrmServiceError(defaultCode, message, context, error);
    }

    // Log the error
    if (this.logErrors) {
      this.logError(serviceError);
    }

    // Call error callbacks
    this.errorCallbacks.forEach(callback => {
      try {
        callback(serviceError.toJSON());
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });

    throw serviceError;
  }

  /**
   * Create a specific error type
   */
  static createError(
    code: ErrorCode,
    message: string,
    context: ErrorContext,
    details?: Record<string, unknown>,
    field?: string
  ): CrmServiceError {
    return new CrmServiceError(code, message, context, details, field);
  }

  /**
   * Validation error helper
   */
  static validationError(
    message: string,
    context: ErrorContext,
    field?: string,
    details?: Record<string, unknown>
  ): never {
    throw new CrmServiceError(ErrorCode.VALIDATION_ERROR, message, context, details, field);
  }

  /**
   * Not found error helper
   */
  static notFound(
    resource: string,
    id: string,
    context: ErrorContext
  ): never {
    throw new CrmServiceError(
      ErrorCode.NOT_FOUND,
      `${resource} with ID '${id}' not found`,
      context,
      { resource, id }
    );
  }

  /**
   * Unauthorized error helper
   */
  static unauthorized(
    message: string = 'Authentication required',
    context: ErrorContext
  ): never {
    throw new CrmServiceError(ErrorCode.UNAUTHORIZED, message, context);
  }

  /**
   * Forbidden error helper
   */
  static forbidden(
    message: string = 'Insufficient permissions',
    context: ErrorContext,
    requiredPermission?: string
  ): never {
    throw new CrmServiceError(
      ErrorCode.INSUFFICIENT_PERMISSIONS,
      message,
      context,
      { requiredPermission }
    );
  }

  /**
   * Map generic errors to specific error codes
   */
  private static mapErrorToCode(error: Error, defaultCode: ErrorCode): ErrorCode {
    const message = error.message.toLowerCase();

    if (message.includes('unauthorized') || message.includes('authentication')) {
      return ErrorCode.UNAUTHORIZED;
    }
    if (message.includes('forbidden') || message.includes('permission')) {
      return ErrorCode.FORBIDDEN;
    }
    if (message.includes('not found')) {
      return ErrorCode.NOT_FOUND;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCode.VALIDATION_ERROR;
    }
    if (message.includes('network') || message.includes('connection')) {
      return ErrorCode.NETWORK_ERROR;
    }
    if (message.includes('timeout')) {
      return ErrorCode.TIMEOUT_ERROR;
    }
    if (message.includes('duplicate') || message.includes('already exists')) {
      return ErrorCode.ALREADY_EXISTS;
    }

    return defaultCode;
  }

  /**
   * Log error with appropriate level
   */
  private static logError(error: CrmServiceError): void {
    const logData = {
      ...error.toJSON(),
      stack: error.stack
    };

    switch (error.code) {
      case ErrorCode.UNAUTHORIZED:
      case ErrorCode.FORBIDDEN:
      case ErrorCode.NOT_FOUND:
        console.warn(`[${error.service}] ${error.operation}:`, logData);
        break;
      
      case ErrorCode.VALIDATION_ERROR:
      case ErrorCode.BUSINESS_RULE_VIOLATION:
        console.info(`[${error.service}] ${error.operation}:`, logData);
        break;
      
      default:
        console.error(`[${error.service}] ${error.operation}:`, logData);
        break;
    }
  }
}

/**
 * Service wrapper for consistent error handling
 */
export function withErrorHandling<T extends unknown[], R>(
  service: string,
  operation: string,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      ErrorHandler.handle(error, { service, operation });
    }
  };
}

/**
 * Async operation wrapper with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  context: ErrorContext
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new CrmServiceError(
        ErrorCode.TIMEOUT_ERROR,
        `Operation timed out after ${timeoutMs}ms`,
        context
      ));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Retry wrapper for operations
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  context: ErrorContext,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    retryableErrors?: ErrorCode[];
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    retryableErrors = [ErrorCode.NETWORK_ERROR, ErrorCode.TIMEOUT_ERROR, ErrorCode.SERVICE_UNAVAILABLE]
  } = options;

  let lastError: unknown;
  let delay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt === maxAttempts) {
        break;
      }

      // Check if error is retryable
      if (error instanceof CrmServiceError && !retryableErrors.includes(error.code)) {
        break;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= backoffMultiplier;
    }
  }

  ErrorHandler.handle(lastError, context);
}

export default ErrorHandler;
