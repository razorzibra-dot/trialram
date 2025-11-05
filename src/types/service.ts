/**
 * Core Service Interface Types
 * Defines service contracts and factory patterns
 */

// ✅ Centralized utility types (moved from @/modules/core/types to prevent circular dependencies)
export type ID = string | number;

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export type ApiMode = 'mock' | 'supabase' | 'real';

// Service interfaces
export interface IAuthService {
  login(email: string, password: string): Promise<any>;
  logout(): Promise<void>;
  refreshToken(): Promise<string>;
  getCurrentUser(): Promise<any>;
}

export interface ICustomerService {
  getCustomers(): Promise<any[]>;
  getCustomer(id: string): Promise<any>;
  createCustomer(data: any): Promise<any>;
  updateCustomer(id: string, data: any): Promise<any>;
  deleteCustomer(id: string): Promise<void>;
}

export interface ISalesService {
  getSales(): Promise<any[]>;
  getSale(id: string): Promise<any>;
  createSale(data: any): Promise<any>;
  updateSale(id: string, data: any): Promise<any>;
  deleteSale(id: string): Promise<void>;
}

export interface ITicketService {
  getTickets(): Promise<any[]>;
  getTicket(id: string): Promise<any>;
  createTicket(data: any): Promise<any>;
  updateTicket(id: string, data: any): Promise<any>;
  deleteTicket(id: string): Promise<void>;
}

export interface IContractService {
  getContracts(): Promise<any[]>;
  getContract(id: string): Promise<any>;
  createContract(data: any): Promise<any>;
  updateContract(id: string, data: any): Promise<any>;
  deleteContract(id: string): Promise<void>;
}

export interface IUserService {
  getUsers(): Promise<any[]>;
  getUser(id: string): Promise<any>;
  createUser(data: any): Promise<any>;
  updateUser(id: string, data: any): Promise<any>;
  deleteUser(id: string): Promise<void>;
}

export interface IDashboardService {
  getDashboardMetrics(): Promise<any>;
  getChartData(): Promise<any>;
}

export interface INotificationService {
  getNotifications(): Promise<any[]>;
  createNotification(data: any): Promise<any>;
  markAsRead(id: string): Promise<void>;
}

export interface IFileService {
  uploadFile(file: File): Promise<string>;
  deleteFile(fileId: string): Promise<void>;
  getFileUrl(fileId: string): Promise<string>;
}

export interface IAuditService {
  getAuditLogs(): Promise<any[]>;
  logAction(action: any): Promise<void>;
}

// Testing types
export interface ServiceTestResult {
  serviceName: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  duration: number;
  details?: Record<string, unknown>;
}

export interface IntegrationTestResults {
  timestamp: Date;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: ServiceTestResult[];
  summary: string;
}

// Logging types
export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  message: string;
  data?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
  };
}

export interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  destination: 'console' | 'file' | 'both';
  filePath?: string;
  maxFileSize?: number;
  maxFiles?: number;
}