/**
 * Unified Error Handler
 * Centralized error handling and classification for all modules
 */

/**
 * Error types supported by the handler
 */
export type ErrorType = 'auth' | 'validation' | 'not_found' | 'server' | 'network' | 'unknown';

/**
 * Unified error handler for all modules
 * Extracts error message and logs with context
 * 
 * @param error - The error object (can be Error, string, or any object)
 * @param context - Context string for logging (e.g., 'useCustomers')
 * @returns The extracted error message as string
 */
export const handleError = (error: unknown, context: string): string => {
  let message = 'An unexpected error occurred';

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    message = String((error as any).message);
  }

  // Log with context and full error object for debugging
  console.error(`[${context}] Error: ${message}`, error);

  // TODO: Send to error tracking service (Sentry, DataDog, etc.)
  // errorTracker.captureException(error, { context });

  return message;
};

/**
 * Checks if error is an authentication error
 * 
 * @param error - The error to check
 * @returns true if error is auth-related
 */
export const isAuthError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes('401') ||
      error.message.includes('Unauthorized') ||
      error.message.includes('Authentication')
    );
  }
  return false;
};

/**
 * Checks if error is a validation error
 * 
 * @param error - The error to check
 * @returns true if error is validation-related
 */
export const isValidationError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes('validation') ||
      error.message.includes('400') ||
      error.message.includes('Bad Request')
    );
  }
  return false;
};

/**
 * Checks if error is a not found error
 * 
 * @param error - The error to check
 * @returns true if error is not found
 */
export const isNotFoundError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes('404') ||
      error.message.includes('not found') ||
      error.message.includes('does not exist')
    );
  }
  return false;
};

/**
 * Checks if error is a server error
 * 
 * @param error - The error to check
 * @returns true if error is server-side
 */
export const isServerError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes('500') ||
      error.message.includes('Server Error') ||
      error.message.includes('Internal Server Error')
    );
  }
  return false;
};

/**
 * Checks if error is a network error
 * 
 * @param error - The error to check
 * @returns true if error is network-related
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes('NetworkError') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network')
    );
  }
  return false;
};

/**
 * Classifies error type
 * 
 * @param error - The error to classify
 * @returns The ErrorType classification
 */
export const classifyError = (error: unknown): ErrorType => {
  if (isAuthError(error)) return 'auth';
  if (isValidationError(error)) return 'validation';
  if (isNotFoundError(error)) return 'not_found';
  if (isServerError(error)) return 'server';
  if (isNetworkError(error)) return 'network';
  return 'unknown';
};

/**
 * Gets user-friendly error message based on error type
 * 
 * @param error - The error object
 * @param context - Optional context for better messages
 * @returns User-friendly error message
 */
export const getUserFriendlyMessage = (error: unknown, context?: string): string => {
  const errorType = classifyError(error);

  switch (errorType) {
    case 'auth':
      return 'Your session has expired. Please log in again.';
    case 'validation':
      return 'Please check your input and try again.';
    case 'not_found':
      return 'The requested item was not found.';
    case 'server':
      return 'A server error occurred. Please try again later.';
    case 'network':
      return 'Network connection failed. Please check your internet connection.';
    default:
      return handleError(error, context || 'errorHandler');
  }
};

/**
 * Usage Examples:
 * 
 * In hooks:
 * try {
 *   const data = await service.getData();
 * } catch (error) {
 *   const message = handleError(error, 'useData');
 *   showNotification(message);
 * }
 * 
 * In components:
 * catch (error) {
 *   const userMessage = getUserFriendlyMessage(error, 'DataFetch');
 *   notification.error(userMessage);
 * }
 */
