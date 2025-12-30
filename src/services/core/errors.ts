/**
 * Core Error Classes for Generic Services
 * Provides typed error handling across all service layers
 */

export class BaseServiceError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Repository Layer Errors
 * Thrown by GenericRepository when database operations fail
 */
export class RepositoryError extends BaseServiceError {
  constructor(
    message: string,
    originalError?: unknown,
    details?: Record<string, unknown>
  ) {
    const errorDetails = {
      ...details,
      originalError: originalError instanceof Error ? originalError.message : String(originalError),
    };
    
    super(message, 'REPOSITORY_ERROR', 500, errorDetails);
  }
}

/**
 * Service Layer Errors
 * Thrown by GenericCrudService for business logic failures
 */
export class ServiceError extends BaseServiceError {
  constructor(
    message: string,
    code: string = 'SERVICE_ERROR',
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message, code, statusCode, details);
  }
}

/**
 * Validation Errors
 * Thrown when data validation fails before database operations
 */
export class ValidationError extends BaseServiceError {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(
    message: string,
    fieldErrors: Record<string, string[]> = {},
    details?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', 400, { ...details, fieldErrors });
    this.fieldErrors = fieldErrors;
  }

  /**
   * Create validation error from single field
   */
  static fromField(field: string, message: string): ValidationError {
    return new ValidationError('Validation failed', { [field]: [message] });
  }

  /**
   * Create validation error from multiple fields
   */
  static fromFields(errors: Record<string, string | string[]>): ValidationError {
    const fieldErrors: Record<string, string[]> = {};
    
    Object.entries(errors).forEach(([field, messages]) => {
      fieldErrors[field] = Array.isArray(messages) ? messages : [messages];
    });

    return new ValidationError('Validation failed', fieldErrors);
  }
}

/**
 * Not Found Error
 * Thrown when entity doesn't exist
 */
export class NotFoundError extends BaseServiceError {
  constructor(
    entityName: string,
    identifier: string | Record<string, unknown>,
    details?: Record<string, unknown>
  ) {
    const idString = typeof identifier === 'string' 
      ? identifier 
      : JSON.stringify(identifier);
    
    super(
      `${entityName} not found: ${idString}`,
      'NOT_FOUND',
      404,
      { ...details, entityName, identifier }
    );
  }
}

/**
 * Unauthorized Error
 * Thrown when user lacks permission
 */
export class UnauthorizedError extends BaseServiceError {
  constructor(
    action: string,
    resource?: string,
    details?: Record<string, unknown>
  ) {
    const message = resource
      ? `Unauthorized to ${action} ${resource}`
      : `Unauthorized to ${action}`;
    
    super(message, 'UNAUTHORIZED', 403, { ...details, action, resource });
  }
}

/**
 * Conflict Error
 * Thrown when operation conflicts with existing data
 */
export class ConflictError extends BaseServiceError {
  constructor(
    message: string,
    conflictingField?: string,
    details?: Record<string, unknown>
  ) {
    super(
      message,
      'CONFLICT',
      409,
      { ...details, conflictingField }
    );
  }
}

/**
 * Tenant Isolation Error
 * Thrown when tenant boundary is violated
 */
export class TenantIsolationError extends BaseServiceError {
  constructor(
    message: string,
    tenantId: string,
    details?: Record<string, unknown>
  ) {
    super(
      message,
      'TENANT_ISOLATION_VIOLATION',
      403,
      { ...details, tenantId }
    );
  }
}

/**
 * Error Handler Utility
 * Converts various error types to typed service errors
 */
export class ErrorHandler {
  /**
   * Convert unknown error to BaseServiceError
   */
  static handle(error: unknown): BaseServiceError {
    if (error instanceof BaseServiceError) {
      return error;
    }

    if (error instanceof Error) {
      return new ServiceError(error.message, 'UNKNOWN_ERROR', 500, {
        originalError: error.message,
        stack: error.stack,
      });
    }

    return new ServiceError(
      'An unknown error occurred',
      'UNKNOWN_ERROR',
      500,
      { error: String(error) }
    );
  }

  /**
   * Extract user-friendly message from error
   */
  static getUserMessage(error: unknown): string {
    if (error instanceof BaseServiceError) {
      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'An unexpected error occurred';
  }

  /**
   * Check if error is a specific type
   */
  static isNotFound(error: unknown): boolean {
    return error instanceof NotFoundError;
  }

  static isValidation(error: unknown): boolean {
    return error instanceof ValidationError;
  }

  static isUnauthorized(error: unknown): boolean {
    return error instanceof UnauthorizedError;
  }

  static isConflict(error: unknown): boolean {
    return error instanceof ConflictError;
  }

  /**
   * Log error with context
   */
  static log(error: unknown, context?: Record<string, unknown>): void {
    const serviceError = ErrorHandler.handle(error);
    
    console.error('[Service Error]', {
      name: serviceError.name,
      code: serviceError.code,
      message: serviceError.message,
      statusCode: serviceError.statusCode,
      details: serviceError.details,
      context,
      stack: serviceError.stack,
    });
  }
}
