/**
 * Common formatting utilities
 * Consolidates duplicate formatting functions across views
 */

/**
 * Format number as currency with thousand separators
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format date string to localized format
 */
export const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions): string => {
  if (!dateString) return '';
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  
  return new Date(dateString).toLocaleDateString('en-US', defaultOptions);
};

/**
 * Format date and time string
 */
export const formatDateTime = (dateString: string): string => {
  if (!dateString) return '';
  
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Calculate duration between two dates
 */
export const formatDuration = (loginAt: string, logoutAt: string | null): string => {
  const login = new Date(loginAt);
  const logout = logoutAt ? new Date(logoutAt) : new Date();
  const durationMs = logout.getTime() - login.getTime();
  
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Format number with thousand separators
 */
export const formatNumber = (value: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${formatNumber(value, decimals)}%`;
};
