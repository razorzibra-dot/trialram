/**
 * API Service Factory
 * Factory pattern for creating service instances with multi-backend switching
 * 
 * SUPPORTED BACKENDS:
 * ==================
 * 1. Mock API - Static/demo data for development
 * 2. Real API - .NET Core backend
 * 3. Supabase - PostgreSQL with real-time capabilities (Phase 3)
 * 
 * ROUTING LOGIC:
 * ==============
 * - Global mode: VITE_API_MODE (mock|real|supabase)
 * - Per-service override: VITE_*_BACKEND (e.g., VITE_CUSTOMER_BACKEND)
 * - Backward compatible: VITE_USE_MOCK_API (legacy)
 */

import { getApiMode, getServiceBackend, type ApiMode } from '@/config/apiConfig';

// Import mock API services (existing ones)
// Note: Real API services have been archived to MARK_FOR_DELETE/legacy_services_real/
// They were never fully implemented and routes to mock fallback
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

// Import Supabase services (Phase 3)
// Note: Fully implemented Supabase services for complete data retrieval support
import { 
  supabasesSalesService,
  supabaseUserService,
  supabaseRbacService,
  supabaseCustomerService,
  supabaseTicketService,
  supabaseContractService,
  supabaseNotificationService
} from '../supabase';

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
  getCustomerStats?(): Promise<Record<string, unknown>>;
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
 * Manages service instance creation and switching between backends
 */
class ApiServiceFactory {
  private static instance: ApiServiceFactory;
  private currentMode: ApiMode;

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
    this.currentMode = getApiMode();
    
    // Log initial mode
    console.log(`[API Factory] Initialized with mode: ${this.currentMode}`);
    
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
   * Setup environment change listener for hot-reload support
   */
  private setupEnvironmentListener(): void {
    const originalMode = this.currentMode;
    
    setInterval(() => {
      const newMode = getApiMode();
      if (newMode !== this.currentMode) {
        this.switchApiMode(newMode);
      }
    }, 1000);
  }

  /**
   * Switch between backends (mock, real, supabase)
   */
  public switchApiMode(newMode: ApiMode): void {
    if (this.currentMode !== newMode) {
      this.currentMode = newMode;
      this.clearServiceInstances();
      
      const modeLabel = {
        'mock': '🎭 Mock',
        'real': '🔌 Real .NET',
        'supabase': '🗄️ Supabase'
      }[newMode];
      
      console.log(`[API Factory] Switched to ${modeLabel} API mode`);
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
   * Get Auth Service (Mock | Real | Supabase)
   */
  public getAuthService(): IAuthService {
    if (!this.authServiceInstance) {
      // Auth service only has mock implementation, all modes use mock
      this.authServiceInstance = mockAuthService as IAuthService;
    }
    return this.authServiceInstance;
  }

  /**
   * Get Customer Service (Mock | Real | Supabase)
   */
  public getCustomerService(): ICustomerService {
    if (!this.customerServiceInstance) {
      const mode = getServiceBackend('customer');
      
      switch (mode) {
        case 'supabase':
          console.log('[API Factory] 🗄️  Using Supabase for Customer Service');
          this.customerServiceInstance = supabaseCustomerService as unknown as ICustomerService;
          break;
        case 'real':
          console.log('[API Factory] 🔌 Using Real API for Customer Service');
          // Real backend not implemented yet, fall back to mock
          this.customerServiceInstance = mockCustomerService as ICustomerService;
          break;
        case 'mock':
        default:
          console.log('[API Factory] 🎭 Using Mock for Customer Service');
          this.customerServiceInstance = mockCustomerService as ICustomerService;
      }
    }
    return this.customerServiceInstance;
  }

  /**
   * Get Sales Service (Mock | Real | Supabase)
   */
  public getSalesService(): ISalesService {
    if (!this.salesServiceInstance) {
      const mode = getServiceBackend('sales');
      
      switch (mode) {
        case 'supabase':
          this.salesServiceInstance = supabasesSalesService as unknown as ISalesService;
          break;
        case 'real':
          // Real backend not implemented yet, fall back to mock
          this.salesServiceInstance = mockSalesService as ISalesService;
          break;
        case 'mock':
        default:
          this.salesServiceInstance = mockSalesService as ISalesService;
      }
    }
    return this.salesServiceInstance;
  }

  /**
   * Get Ticket Service (Mock | Real | Supabase)
   */
  public getTicketService(): ITicketService {
    if (!this.ticketServiceInstance) {
      const mode = getServiceBackend('ticket');
      
      switch (mode) {
        case 'supabase':
          console.log('[API Factory] 🗄️  Using Supabase for Ticket Service');
          this.ticketServiceInstance = supabaseTicketService as unknown as ITicketService;
          break;
        case 'real':
          console.log('[API Factory] 🔌 Using Real API for Ticket Service');
          // Real backend not implemented yet, fall back to mock
          this.ticketServiceInstance = mockTicketService as ITicketService;
          break;
        case 'mock':
        default:
          console.log('[API Factory] 🎭 Using Mock for Ticket Service');
          this.ticketServiceInstance = mockTicketService as ITicketService;
      }
    }
    return this.ticketServiceInstance;
  }

  /**
   * Get Contract Service (Mock | Real | Supabase)
   */
  public getContractService(): IContractService {
    if (!this.contractServiceInstance) {
      const mode = getServiceBackend('contract');
      
      switch (mode) {
        case 'supabase':
          console.log('[API Factory] 🗄️  Using Supabase for Contract Service');
          this.contractServiceInstance = supabaseContractService as unknown as IContractService;
          break;
        case 'real':
          console.log('[API Factory] 🔌 Using Real API for Contract Service');
          // Real backend not implemented yet, fall back to mock
          this.contractServiceInstance = mockContractService as IContractService;
          break;
        case 'mock':
        default:
          console.log('[API Factory] 🎭 Using Mock for Contract Service');
          this.contractServiceInstance = mockContractService as IContractService;
      }
    }
    return this.contractServiceInstance;
  }

  /**
   * Get User Service
   * Note: Real backend implementation archived, using mock fallback
   */
  public getUserService(): IUserService {
    if (!this.userServiceInstance) {
      this.userServiceInstance = mockUserService as IUserService;
    }
    return this.userServiceInstance;
  }

  /**
   * Get Dashboard Service
   * Note: Real backend implementation archived, using mock fallback
   */
  public getDashboardService(): IDashboardService {
    if (!this.dashboardServiceInstance) {
      this.dashboardServiceInstance = mockDashboardService as IDashboardService;
    }
    return this.dashboardServiceInstance;
  }

  /**
   * Get Notification Service (Mock | Real | Supabase)
   */
  public getNotificationService(): INotificationService {
    if (!this.notificationServiceInstance) {
      const mode = getServiceBackend('notification');
      
      switch (mode) {
        case 'supabase':
          console.log('[API Factory] 🗄️  Using Supabase for Notification Service');
          this.notificationServiceInstance = supabaseNotificationService as unknown as INotificationService;
          break;
        case 'real':
          console.log('[API Factory] 🔌 Using Real API for Notification Service');
          // Real backend not implemented yet, fall back to mock
          this.notificationServiceInstance = mockNotificationService as INotificationService;
          break;
        case 'mock':
        default:
          console.log('[API Factory] 🎭 Using Mock for Notification Service');
          this.notificationServiceInstance = mockNotificationService as INotificationService;
      }
    }
    return this.notificationServiceInstance;
  }

  /**
   * Get File Service (Mock | Supabase)
   * Note: Real backend implementation archived, using mock fallback
   */
  public getFileService(): IFileService {
    if (!this.fileServiceInstance) {
      const mode = getServiceBackend('file');
      
      switch (mode) {
        case 'real':
        case 'mock':
        case 'supabase':
        default:
          this.fileServiceInstance = mockFileService as IFileService;
      }
    }
    return this.fileServiceInstance;
  }

  /**
   * Get Audit Service (Mock | Supabase)
   * Note: Real backend implementation archived, using mock fallback
   */
  public getAuditService(): IAuditService {
    if (!this.auditServiceInstance) {
      const mode = getServiceBackend('audit');
      
      switch (mode) {
        case 'real':
        case 'mock':
        case 'supabase':
        default:
          this.auditServiceInstance = mockAuditService as IAuditService;
      }
    }
    return this.auditServiceInstance;
  }

  /**
   * Get current API mode
   */
  public isUsingMockApi(): boolean {
    return this.currentMode === 'mock';
  }

  /**
   * Get current API mode
   */
  public getApiMode(): ApiMode {
    return this.currentMode;
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