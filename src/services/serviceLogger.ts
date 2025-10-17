/**
 * Service Logger
 * Provides consistent logging across all services with structured data
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  operation: string;
  message: string;
  data?: unknown;
  userId?: string;
  tenantId?: string;
  correlationId?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  serviceName: string;
  includeStackTrace: boolean;
}

/**
 * Service Logger class
 */
export class ServiceLogger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableRemote: false,
      serviceName: 'CRM',
      includeStackTrace: false,
      ...config
    };

    // Start periodic flush if remote logging is enabled
    if (this.config.enableRemote) {
      this.startPeriodicFlush();
    }
  }

  /**
   * Create a logger for a specific service
   */
  static forService(serviceName: string, config?: Partial<LoggerConfig>): ServiceLogger {
    return new ServiceLogger({
      ...config,
      serviceName
    });
  }

  /**
   * Log debug message
   */
  debug(operation: string, message: string, data?: unknown, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, operation, message, data, metadata);
  }

  /**
   * Log info message
   */
  info(operation: string, message: string, data?: unknown, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, operation, message, data, metadata);
  }

  /**
   * Log warning message
   */
  warn(operation: string, message: string, data?: unknown, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, operation, message, data, metadata);
  }

  /**
   * Log error message
   */
  error(operation: string, message: string, error?: unknown, metadata?: Record<string, unknown>): void {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: this.config.includeStackTrace ? error.stack : undefined
    } : error;

    this.log(LogLevel.ERROR, operation, message, errorData, metadata);
  }

  /**
   * Log operation start
   */
  startOperation(operation: string, data?: unknown, metadata?: Record<string, unknown>): OperationLogger {
    const correlationId = this.generateCorrelationId();
    const startTime = Date.now();

    this.info(operation, 'Operation started', data, { 
      ...metadata, 
      correlationId,
      phase: 'start'
    });

    return new OperationLogger(this, operation, correlationId, startTime);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    operation: string,
    message: string,
    data?: unknown,
    metadata?: Record<string, unknown>
  ): void {
    // Check if log level is enabled
    if (!this.isLevelEnabled(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.config.serviceName,
      operation,
      message,
      data,
      metadata,
      correlationId: metadata?.correlationId || this.generateCorrelationId()
    };

    // Add user context if available
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('crm_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          entry.userId = user.id;
          entry.tenantId = user.tenant_id;
        } catch {
          // Ignore parsing errors
        }
      }
    }

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Remote logging
    if (this.config.enableRemote) {
      this.logBuffer.push(entry);
    }
  }

  /**
   * Check if log level is enabled
   */
  private isLevelEnabled(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Log to console with appropriate formatting
   */
  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.service}] [${entry.operation}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data, entry.metadata);
        break;
      case LogLevel.INFO:
        console.info(message, entry.data, entry.metadata);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data, entry.metadata);
        break;
      case LogLevel.ERROR:
        console.error(message, entry.data, entry.metadata);
        break;
    }
  }

  /**
   * Start periodic flush for remote logging
   */
  private startPeriodicFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushLogs();
    }, 5000); // Flush every 5 seconds
  }

  /**
   * Flush logs to remote endpoint
   */
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0 || !this.config.remoteEndpoint) {
      return;
    }

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: logsToFlush })
      });
    } catch (error) {
      // If remote logging fails, log to console and restore logs
      console.error('Failed to flush logs to remote endpoint:', error);
      this.logBuffer.unshift(...logsToFlush);
    }
  }

  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    // Flush remaining logs
    if (this.config.enableRemote && this.logBuffer.length > 0) {
      this.flushLogs();
    }
  }
}

/**
 * Operation Logger for tracking operation lifecycle
 */
export class OperationLogger {
  constructor(
    private logger: ServiceLogger,
    private operation: string,
    private correlationId: string,
    private startTime: number
  ) {}

  /**
   * Log operation progress
   */
  progress(message: string, data?: unknown): void {
    this.logger.info(this.operation, message, data, {
      correlationId: this.correlationId,
      phase: 'progress',
      duration: Date.now() - this.startTime
    });
  }

  /**
   * Log operation success
   */
  success(message: string = 'Operation completed successfully', data?: unknown): void {
    const duration = Date.now() - this.startTime;
    this.logger.info(this.operation, message, data, {
      correlationId: this.correlationId,
      phase: 'success',
      duration
    });
  }

  /**
   * Log operation failure
   */
  failure(message: string, error?: unknown): void {
    const duration = Date.now() - this.startTime;
    this.logger.error(this.operation, message, error, {
      correlationId: this.correlationId,
      phase: 'failure',
      duration
    });
  }

  /**
   * Log operation warning
   */
  warning(message: string, data?: unknown): void {
    const duration = Date.now() - this.startTime;
    this.logger.warn(this.operation, message, data, {
      correlationId: this.correlationId,
      phase: 'warning',
      duration
    });
  }
}

/**
 * Global logger instance
 */
export const globalLogger = new ServiceLogger({
  serviceName: 'CRM-Global',
  level: LogLevel.INFO,
  enableConsole: true,
  enableRemote: false
});

/**
 * Service-specific loggers
 */
export const serviceLoggers = {
  auth: ServiceLogger.forService('Auth'),
  customer: ServiceLogger.forService('Customer'),
  sales: ServiceLogger.forService('Sales'),
  ticket: ServiceLogger.forService('Ticket'),
  contract: ServiceLogger.forService('Contract'),
  user: ServiceLogger.forService('User'),
  dashboard: ServiceLogger.forService('Dashboard'),
  notification: ServiceLogger.forService('Notification'),
  file: ServiceLogger.forService('File'),
  audit: ServiceLogger.forService('Audit')
};

/**
 * Performance monitoring decorator
 */
export function logPerformance<T extends unknown[], R>(
  logger: ServiceLogger,
  operation: string
) {
  return function (target: Record<string, unknown>, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: T): Promise<R> {
      const opLogger = logger.startOperation(`${operation}.${propertyKey}`, { args });
      
      try {
        const result = await originalMethod.apply(this, args);
        opLogger.success('Method completed', { result });
        return result;
      } catch (error) {
        opLogger.failure('Method failed', error);
        throw error;
      }
    };

    return descriptor;
  };
}

export default ServiceLogger;
