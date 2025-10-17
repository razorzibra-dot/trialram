/**
 * API Service Factory
 * Factory pattern for creating service instances with mock/real API switching
 */

import { isUsingMockApi } from '@/config/apiConfig';

// Import real API services
import { RealAuthService } from '../real/authService';
import { RealCustomerService } from '../real/customerService';
import { RealSalesService } from '../real/salesService';
import { RealTicketService } from '../real/ticketService';
import { RealContractService } from '../real/contractService';
import { RealUserService } from '../real/userService';
import { RealDashboardService } from '../real/dashboardService';
import { RealNotificationService } from '../real/notificationService';
import { RealFileService } from '../real/fileService';
import { RealAuditService } from '../real/auditService';

// Import mock API services (existing ones)
import { authService as mockAuthService } from '../authService';
import { customerService as mockCustomerService } from '../customerService';
import { salesService as mockSalesService } from '../salesService';
import { ticketService as mockTicketService } from '../ticketService';
import { contractService as mockContractService } from '../contractService';
import { userService as mockUserService } from '../userService';
import { dashboardService as mockDashboardService } from '../dashboardService';
import { notificationService as mockNotificationService } from '../notificationService';
import { fileService as mockFileService } from '../fileService';
import { auditService as mockAuditService } from '../auditService';

// Service interfaces
export interface IAuthService {
  login(credentials: Record<string, unknown>): Promise<Record<string, unknown>>;
  logout(): Promise<void>;
  getCurrentUser(): Record<string, unknown>;
  getToken(): string | null;
  isAuthenticated(): boolean;
  hasRole(role: string): boolean;
  hasPermission(permission: string): boolean;
  refreshToken(): Promise<string>;
  // Add other auth methods as needed
}

export interface ICustomerService {
  getCustomers(filters?: Record<string, unknown>): Promise<Record<string, unknown>[]>;
  getCustomer(id: string): Promise<Record<string, unknown>>;
  createCustomer(data: Record<string, unknown>): Promise<Record<string, unknown>>;
  updateCustomer(id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  deleteCustomer(id: string): Promise<void>;
  bulkDeleteCustomers(ids: string[]): Promise<void>;
  bulkUpdateCustomers(ids: string[], data: Record<string, unknown>): Promise<void>;
  getTags(): Promise<Record<string, unknown>[]>;
  exportCustomers(format?: string): Promise<string>;
  importCustomers(data: string): Promise<Record<string, unknown>>;
  getIndustries?(): Promise<string[]>;
  getSizes?(): Promise<string[]>;
  createTag?(name: string, color: string): Promise<Record<string, unknown>>;
  // Add other customer methods as needed
}

export interface ISalesService {
  getSales(filters?: Record<string, unknown>): Promise<Record<string, unknown>[]>;
  getSale(id: string): Promise<Record<string, unknown>>;
  createSale(data: Record<string, unknown>): Promise<Record<string, unknown>>;
  updateSale(id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  deleteSale(id: string): Promise<void>;
  getPipelineStages(): Promise<Record<string, unknown>[]>;
  getSalesAnalytics(period?: string): Promise<Record<string, unknown>>;
  // Add other sales methods as needed
}

export interface ITicketService {
  getTickets(filters?: Record<string, unknown>): Promise<Record<string, unknown>[]>;
  getTicket(id: string): Promise<Record<string, unknown>>;
  createTicket(data: Record<string, unknown>): Promise<Record<string, unknown>>;
  updateTicket(id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  deleteTicket(id: string): Promise<void>;
  getTicketCategories(): Promise<Record<string, unknown>[]>;
  getTicketPriorities(): Promise<Record<string, unknown>[]>;
  // Add other ticket methods as needed
}

export interface IContractService {
  getContracts(filters?: Record<string, unknown>): Promise<Record<string, unknown>[]>;
  getContract(id: string): Promise<Record<string, unknown>>;
  createContract(data: Record<string, unknown>): Promise<Record<string, unknown>>;
  updateContract(id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  deleteContract(id: string): Promise<void>;
  getContractTypes(): Promise<Record<string, unknown>[]>;
  getContractAnalytics(): Promise<Record<string, unknown>>;
  // Add other contract methods as needed
}

export interface IUserService {
  getUsers(filters?: Record<string, unknown>): Promise<Record<string, unknown>[]>;
  getUser(id: string): Promise<Record<string, unknown>>;
  createUser(data: Record<string, unknown>): Promise<Record<string, unknown>>;
  updateUser(id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  deleteUser(id: string): Promise<void>;
  getRoles(): Promise<Record<string, unknown>[]>;
  getPermissions(): Promise<Record<string, unknown>[]>;
  // Add other user methods as needed
}

export interface IDashboardService {
  getMetrics(): Promise<Record<string, unknown>>;
  getAnalytics(period?: string): Promise<Record<string, unknown>>;
  getRecentActivity(): Promise<Record<string, unknown>[]>;
  getWidgetData(widgetType: string): Promise<Record<string, unknown>>;
  // Add other dashboard methods as needed
}

export interface INotificationService {
  getNotifications(filters?: Record<string, unknown>): Promise<Record<string, unknown>[]>;
  createNotification(data: Record<string, unknown>): Promise<Record<string, unknown>>;
  markAsRead(id: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  getTemplates(): Promise<Record<string, unknown>[]>;
  // Add other notification methods as needed
}

export interface IFileService {
  uploadFile(file: File, options?: Record<string, unknown>): Promise<Record<string, unknown>>;
  downloadFile(id: string): Promise<void>;
  deleteFile(id: string): Promise<void>;
  getFileMetadata(id: string): Promise<Record<string, unknown>>;
  // Add other file methods as needed
}

export interface IAuditService {
  getAuditLogs(filters?: Record<string, unknown>): Promise<Record<string, unknown>[]>;
  exportAuditLogs(filters?: Record<string, unknown>): Promise<string>;
  searchAuditLogs(query: string): Promise<Record<string, unknown>[]>;
  // Add other audit methods as needed
}

/**
 * Service Factory Class
 */
class ApiServiceFactory {
  private static instance: ApiServiceFactory;
  private useMockApi: boolean;

  // Service instances
  private authServiceInstance: IAuthService | null = null;
  private customerServiceInstance: ICustomerService | null = null;
  private salesServiceInstance: ISalesService | null = null;
  private ticketServiceInstance: ITicketService | null = null;
  private contractServiceInstance: IContractService | null = null;
  private userServiceInstance: IUserService | null = null;
  private dashboardServiceInstance: IDashboardService | null = null;
  private notificationServiceInstance: INotificationService | null = null;
  private fileServiceInstance: IFileService | null = null;
  private auditServiceInstance: IAuditService | null = null;

  private constructor() {
    this.useMockApi = isUsingMockApi();
    
    // Listen for environment changes
    this.setupEnvironmentListener();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ApiServiceFactory {
    if (!ApiServiceFactory.instance) {
      ApiServiceFactory.instance = new ApiServiceFactory();
    }
    return ApiServiceFactory.instance;
  }

  /**
   * Setup environment change listener
   */
  private setupEnvironmentListener(): void {
    // Listen for environment variable changes
    const originalEnv = import.meta.env.VITE_USE_MOCK_API;
    
    setInterval(() => {
      const currentEnv = import.meta.env.VITE_USE_MOCK_API;
      if (currentEnv !== originalEnv) {
        this.switchApiMode(currentEnv === 'true');
      }
    }, 1000);
  }

  /**
   * Switch between mock and real API
   */
  public switchApiMode(useMock: boolean): void {
    if (this.useMockApi !== useMock) {
      this.useMockApi = useMock;
      this.clearServiceInstances();
      
      console.log(`[API Factory] Switched to ${useMock ? 'Mock' : 'Real'} API mode`);
    }
  }

  /**
   * Clear all service instances to force recreation
   */
  private clearServiceInstances(): void {
    this.authServiceInstance = null;
    this.customerServiceInstance = null;
    this.salesServiceInstance = null;
    this.ticketServiceInstance = null;
    this.contractServiceInstance = null;
    this.userServiceInstance = null;
    this.dashboardServiceInstance = null;
    this.notificationServiceInstance = null;
    this.fileServiceInstance = null;
    this.auditServiceInstance = null;
  }

  /**
   * Get Auth Service
   */
  public getAuthService(): IAuthService {
    if (!this.authServiceInstance) {
      this.authServiceInstance = this.useMockApi 
        ? mockAuthService as IAuthService
        : new RealAuthService();
    }
    return this.authServiceInstance;
  }

  /**
   * Get Customer Service
   */
  public getCustomerService(): ICustomerService {
    if (!this.customerServiceInstance) {
      this.customerServiceInstance = this.useMockApi 
        ? mockCustomerService as ICustomerService
        : new RealCustomerService();
    }
    return this.customerServiceInstance;
  }

  /**
   * Get Sales Service
   */
  public getSalesService(): ISalesService {
    if (!this.salesServiceInstance) {
      this.salesServiceInstance = this.useMockApi 
        ? mockSalesService as ISalesService
        : new RealSalesService();
    }
    return this.salesServiceInstance;
  }

  /**
   * Get Ticket Service
   */
  public getTicketService(): ITicketService {
    if (!this.ticketServiceInstance) {
      this.ticketServiceInstance = this.useMockApi 
        ? mockTicketService as ITicketService
        : new RealTicketService();
    }
    return this.ticketServiceInstance;
  }

  /**
   * Get Contract Service
   */
  public getContractService(): IContractService {
    if (!this.contractServiceInstance) {
      this.contractServiceInstance = this.useMockApi 
        ? mockContractService as IContractService
        : new RealContractService();
    }
    return this.contractServiceInstance;
  }

  /**
   * Get User Service
   */
  public getUserService(): IUserService {
    if (!this.userServiceInstance) {
      this.userServiceInstance = this.useMockApi 
        ? mockUserService as IUserService
        : new RealUserService();
    }
    return this.userServiceInstance;
  }

  /**
   * Get Dashboard Service
   */
  public getDashboardService(): IDashboardService {
    if (!this.dashboardServiceInstance) {
      this.dashboardServiceInstance = this.useMockApi 
        ? mockDashboardService as IDashboardService
        : new RealDashboardService();
    }
    return this.dashboardServiceInstance;
  }

  /**
   * Get Notification Service
   */
  public getNotificationService(): INotificationService {
    if (!this.notificationServiceInstance) {
      this.notificationServiceInstance = this.useMockApi 
        ? mockNotificationService as INotificationService
        : new RealNotificationService();
    }
    return this.notificationServiceInstance;
  }

  /**
   * Get File Service
   */
  public getFileService(): IFileService {
    if (!this.fileServiceInstance) {
      this.fileServiceInstance = this.useMockApi
        ? mockFileService as IFileService
        : new RealFileService();
    }
    return this.fileServiceInstance;
  }

  /**
   * Get Audit Service
   */
  public getAuditService(): IAuditService {
    if (!this.auditServiceInstance) {
      this.auditServiceInstance = this.useMockApi
        ? mockAuditService as IAuditService
        : new RealAuditService();
    }
    return this.auditServiceInstance;
  }



  /**
   * Get current API mode
   */
  public isUsingMockApi(): boolean {
    return this.useMockApi;
  }

  /**
   * Get all service instances (for debugging)
   */
  public getServiceInstances(): Record<string, IAuthService | ICustomerService | ISalesService | ITicketService | IContractService | IUserService | IDashboardService | INotificationService | IFileService | IAuditService | null> {
    return {
      auth: this.authServiceInstance,
      customer: this.customerServiceInstance,
      sales: this.salesServiceInstance,
      ticket: this.ticketServiceInstance,
      contract: this.contractServiceInstance,
      user: this.userServiceInstance,
      dashboard: this.dashboardServiceInstance,
      notification: this.notificationServiceInstance,
      file: this.fileServiceInstance,
      audit: this.auditServiceInstance,
    };
  }
}

// Export singleton instance
export const apiServiceFactory = ApiServiceFactory.getInstance();

// Export convenience methods
export const getAuthService = () => apiServiceFactory.getAuthService();
export const getCustomerService = () => apiServiceFactory.getCustomerService();
export const getSalesService = () => apiServiceFactory.getSalesService();
export const getTicketService = () => apiServiceFactory.getTicketService();
export const getContractService = () => apiServiceFactory.getContractService();
export const getUserService = () => apiServiceFactory.getUserService();
export const getDashboardService = () => apiServiceFactory.getDashboardService();
export const getNotificationService = () => apiServiceFactory.getNotificationService();
export const getFileService = () => apiServiceFactory.getFileService();
export const getAuditService = () => apiServiceFactory.getAuditService();

export default apiServiceFactory;