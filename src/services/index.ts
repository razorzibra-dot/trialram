/**
 * Service Index
 * Central export point for all services with automatic mock/real API switching
 * 
 * ARCHITECTURE:
 * ============
 * This file provides a unified interface for all services in the application.
 * It automatically switches between mock/static data and real .NET Core backend API
 * based on the VITE_USE_MOCK_API environment variable.
 * 
 * USAGE:
 * ======
 * Always import services from this file:
 *   import { customerService, authService, salesService } from '@/services';
 * 
 * SWITCHING BETWEEN MOCK AND REAL API:
 * ====================================
 * 1. Open .env file in the root directory
 * 2. Set VITE_USE_MOCK_API=true for static/mock data
 * 3. Set VITE_USE_MOCK_API=false for .NET Core backend API
 * 4. Restart the development server (npm run dev)
 * 
 * CONSISTENCY RULES:
 * ==================
 * - All mock services must implement the same interface as real services
 * - All real services must extend IService interfaces from api/apiServiceFactory
 * - Data mapping between backend and frontend models is handled in this file
 * - All new services MUST be added to both mock and real implementations
 * 
 * SERVICE STRUCTURE:
 * ==================
 * - Mock Services: src/services/*Service.ts (e.g., customerService.ts)
 * - Real Services: src/services/real/*Service.ts (e.g., real/customerService.ts)
 * - Service Interfaces: src/services/api/apiServiceFactory.ts
 * - API Configuration: src/config/apiConfig.ts
 */

import { 
  getAuthService,
  getCustomerService,
  getSalesService,
  getTicketService,
  getContractService,
  getUserService,
  getDashboardService,
  getNotificationService,
  getFileService,
  getAuditService,
  apiServiceFactory
} from './api/apiServiceFactory';
import { Customer, CustomerTag, Sale, Deal, Ticket } from '@/types/crm';
import { User } from '@/types/auth';
import { 
  CustomerResponse,
  SaleResponse,
  TicketResponse,
  UserResponse
} from './api/interfaces';
import type { Contract as UiContract, ContractAnalytics as UiContractAnalytics } from '@/types/contracts';
import type { ContractResponse } from './api/interfaces';
import { baseApiService } from './api/baseApiService';
import apiConfig from '@/config/apiConfig';

// Export service instances
export const authService = getAuthService();

// Enhanced mappers: Real -> unified UI shapes
const mapCustomer = (c: CustomerResponse): Customer => ({
  id: c.id,
  company_name: c.companyName,
  contact_name: c.contactName,
  email: c.email,
  phone: c.phone || '',
  mobile: (c as any).mobile || '',
  website: (c as any).website || '',
  address: c.address || '',
  city: c.city || '',
  country: c.country || '',
  industry: c.industry || '',
  size: (c.size as any) || 'small',
  status: (c.status as any) || 'active',
  customer_type: ((c as any).customerType as any) || 'business',
  credit_limit: (c as any).creditLimit || 0,
  payment_terms: (c as any).paymentTerms || '',
  tax_id: (c as any).taxId || '',
  annual_revenue: (c as any).annualRevenue || 0,
  total_sales_amount: (c as any).totalSalesAmount || 0,
  total_orders: (c as any).totalOrders || 0,
  average_order_value: (c as any).averageOrderValue || 0,
  last_purchase_date: (c as any).lastPurchaseDate || '',
  tags: (c.tags || []) as CustomerTag[],
  notes: c.notes,
  assigned_to: c.assignedTo || '',
  source: (c as any).source || '',
  rating: (c as any).rating || '',
  last_contact_date: (c as any).lastContactDate || '',
  next_follow_up_date: (c as any).nextFollowUpDate || '',
  tenant_id: c.tenantId,
  created_at: c.createdAt,
  updated_at: c.updatedAt,
  created_by: (c as any).createdBy || ''
});

const stageMapToUi: Record<string, string> = {
  prospect: 'lead',
  qualified: 'qualified',
  proposal: 'proposal',
  negotiation: 'negotiation',
  won: 'closed_won',
  lost: 'closed_lost'
};

const mapSale = (s: SaleResponse): Sale => ({
  id: s.id,
  sale_number: s.id, // Use ID as sale number for now
  title: s.title,
  description: s.description || '',
  customer_id: s.customer?.id || '',
  customer_name: s.customer?.companyName,
  value: s.value,
  amount: s.value, // Alias for backend compatibility
  currency: 'USD',
  probability: s.probability,
  weighted_amount: s.value * (s.probability / 100),
  stage: stageMapToUi[(s.stage || '').toLowerCase()] as any || 'lead',
  status: s.stage === 'won' ? 'won' : s.stage === 'lost' ? 'lost' : 'open',
  source: '',
  campaign: '',
  expected_close_date: s.expectedCloseDate || '',
  actual_close_date: s.actualCloseDate || '',
  last_activity_date: '',
  next_activity_date: '',
  assigned_to: s.assignedTo || '',
  assigned_to_name: s.assignedUser?.name,
  notes: s.description || '',
  tags: [],
  competitor_info: '',
  items: s.products?.map(p => ({
    id: p.id,
    sale_id: s.id,
    product_id: p.productId,
    product_name: p.productName,
    product_description: '',
    quantity: p.quantity,
    unit_price: p.unitPrice,
    discount: 0,
    tax: 0,
    line_total: p.totalPrice
  })) || [],
  tenant_id: s.tenantId,
  created_at: s.createdAt,
  updated_at: s.updatedAt,
  created_by: ''
});

const mapTicket = (t: TicketResponse): Ticket => ({
  id: t.id,
  ticket_number: t.id, // Use ID as ticket number for now
  title: t.title,
  description: t.description,

  // Customer Relationship
  customer_id: t.customer?.id || undefined,
  customer_name: t.customer?.companyName,
  customer_email: t.customer?.contactName, // Assuming contactName contains email
  customer_phone: '',

  // Status and Classification
  status: (t.status as any) || 'open',
  priority: (t.priority as any) || 'medium',
  category: (t.category as any) || 'general',
  sub_category: '',
  source: '',

  // Assignment and Reporting
  assigned_to: t.assignedTo || undefined,
  assigned_to_name: t.assignedUser?.name,
  reported_by: '',
  reported_by_name: '',

  // Dates and SLA
  due_date: t.dueDate || undefined,
  resolved_at: t.resolvedAt || undefined,
  closed_at: undefined,
  first_response_date: undefined,

  // Time Tracking
  estimated_hours: undefined,
  actual_hours: undefined,
  first_response_time: undefined,
  resolution_time: undefined,
  is_sla_breached: false,

  // Resolution and Notes
  resolution: '',
  tags: t.tags?.map(tag => tag.name) || [],

  // Relationships
  comments: t.comments?.map(c => ({
    id: c.id,
    ticket_id: t.id,
    content: c.content,
    author_id: c.author.id,
    author_name: c.author.name,
    author_role: '',
    created_at: c.createdAt,
    updated_at: c.createdAt,
    parent_id: undefined,
    replies: []
  })) || [],
  attachments: t.attachments?.map(a => ({
    id: a.id,
    ticket_id: t.id,
    filename: a.filename,
    original_filename: a.filename,
    file_path: '',
    file_url: a.url,
    content_type: '',
    file_size: a.size,
    uploaded_by: '',
    uploaded_by_name: '',
    created_at: t.createdAt
  })) || [],

  // System Information
  tenant_id: t.tenantId,
  created_at: t.createdAt,
  updated_at: t.updatedAt,
  created_by: ''
});

const mapUser = (u: UserResponse): UiUser => {
  const [firstName, ...rest] = (u.name || '').split(' ');
  return {
    id: u.id,
    email: u.email,
    firstName: firstName || '',
    lastName: rest.join(' '),
    role: (u.role as any) || 'Viewer',
    status: (u as any).status || 'active',
    tenantId: u.tenantId,
    tenantName: '',
    lastLogin: u.lastLogin || '',
    createdAt: u.createdAt || '',
    avatar: u.avatar,
    phone: ''
  };
};

// Customer service wrapper
export const customerService = {
  async getCustomers(filters?: any): Promise<Customer[]> {
    const base: any = getCustomerService();
    if (apiServiceFactory.isUsingMockApi()) return base.getCustomers(filters);
    const res: CustomerResponse[] = await base.getCustomers(filters);
    return res.map(mapCustomer);
  },
  async getCustomer(id: string): Promise<Customer> {
    const base: any = getCustomerService();
    if (apiServiceFactory.isUsingMockApi()) return base.getCustomer(id);
    const c: CustomerResponse = await base.getCustomer(id);
    return mapCustomer(c);
  },
  async createCustomer(data: any): Promise<Customer> {
    const base: any = getCustomerService();
    if (apiServiceFactory.isUsingMockApi()) return base.createCustomer(data);
    const req = {
      companyName: data.company_name,
      contactName: data.contact_name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      country: data.country,
      industry: data.industry,
      size: data.size,
      status: data.status,
      notes: data.notes,
      assignedTo: data.assigned_to
    };
    const c: CustomerResponse = await base.createCustomer(req);
    return mapCustomer(c);
  },
  async updateCustomer(id: string, data: any): Promise<Customer> {
    const base: any = getCustomerService();
    if (apiServiceFactory.isUsingMockApi()) return base.updateCustomer(id, data);
    const req = {
      companyName: data.company_name,
      contactName: data.contact_name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      country: data.country,
      industry: data.industry,
      size: data.size,
      status: data.status,
      notes: data.notes,
      assignedTo: data.assigned_to
    };
    const c: CustomerResponse = await base.updateCustomer(id, req);
    return mapCustomer(c);
  },
  async deleteCustomer(id: string): Promise<void> {
    const base: any = getCustomerService();
    return base.deleteCustomer(id);
  },
  async getTags(): Promise<CustomerTag[]> {
    const base: any = getCustomerService();
    return base.getTags();
  },
  async createTag(name: string, color: string): Promise<CustomerTag> {
    const base: any = getCustomerService();
    if (base.createTag) return base.createTag(name, color);
    // Fallback no-op
    return { id: Date.now().toString(), name, color };
  },
  async getIndustries(): Promise<string[]> { return ['Technology','Manufacturing','Software','Retail','Healthcare','Finance','Education','Other']; },
  async getSizes(): Promise<string[]> { return ['startup','small','medium','enterprise']; },
  async exportCustomers(format: 'csv'|'json' = 'csv'): Promise<string> {
    const list = await this.getCustomers();
    if (format === 'json') return JSON.stringify(list, null, 2);
    const headers = ['Company Name','Contact Name','Email','Phone','Address','City','Country','Industry','Size','Status','Created At'];
    const rows = list.map(c => [c.company_name,c.contact_name,c.email,c.phone,c.address,c.city,c.country,c.industry,c.size,c.status,new Date(c.created_at).toLocaleDateString()]);
    return [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\r\n');
  },
  async importCustomers(csv: string): Promise<{ success: number; errors: string[] }> {
    // Fallback stub
    return { success: 0, errors: [] };
  }
};

// Sales service wrapper (normalizes to Deal API)
export const salesService = {
  async getDeals(filters?: any): Promise<Deal[]> {
    const base: any = getSalesService();
    if (apiServiceFactory.isUsingMockApi() && base.getDeals) return base.getDeals(filters);
    const res: SaleResponse[] = await base.getSales(filters);
    return res.map(mapSale);
  },
  async deleteDeal(id: string): Promise<void> {
    const base: any = getSalesService();
    if (apiServiceFactory.isUsingMockApi() && base.deleteDeal) return base.deleteDeal(id);
    return base.deleteSale(id);
  }
};

// Ticket service wrapper
export const ticketService = {
  async getTickets(filters?: any): Promise<Ticket[]> {
    const base: any = getTicketService();
    if (apiServiceFactory.isUsingMockApi()) return base.getTickets(filters);
    const res: TicketResponse[] = await base.getTickets(filters);
    return res.map(mapTicket);
  },
  async deleteTicket(id: string): Promise<void> {
    const base: any = getTicketService();
    return base.deleteTicket(id);
  }
};

// Contract service: passthrough (mock-heavy features); keep direct for now

// User service wrapper
export const userService = {
  async getUsers(filters?: any): Promise<UiUser[]> {
    const base: any = getUserService();
    if (apiServiceFactory.isUsingMockApi()) return base.getUsers(filters);
    const res: UserResponse[] = await base.getUsers(filters);
    return res.map(mapUser);
  },
  async updateUser(id: string, updates: Partial<UiUser>): Promise<any> {
    const base: any = getUserService();
    if (apiServiceFactory.isUsingMockApi()) return base.updateUser(id, updates);
    const req = {
      name: `${updates.firstName ?? ''} ${updates.lastName ?? ''}`.trim() || undefined,
      email: updates.email,
      role: updates.role,
      avatar: updates.avatar
    };
    return base.updateUser(id, req);
  },
  async createUser(data: Omit<UiUser,'id'|'createdAt'|'lastLogin'>): Promise<any> {
    const base: any = getUserService();
    if (apiServiceFactory.isUsingMockApi()) return base.createUser(data);
    const req = {
      name: `${data.firstName} ${data.lastName}`.trim(),
      email: data.email,
      role: data.role,
      avatar: data.avatar
    };
    return base.createUser(req);
  },
  async deleteUser(id: string): Promise<void> {
    const base: any = getUserService();
    return base.deleteUser(id);
  },
  async resetPassword(id: string): Promise<void> {
    const base: any = getUserService();
    if (base.resetPassword) return base.resetPassword(id);
    // Stub
    return;
  },
  async getTenants(): Promise<Array<{ id: string; name: string }>> {
    const base: any = getUserService();
    if (base.getTenants) return base.getTenants();
    // Stub a couple of tenants
    return [
      { id: 'techcorp', name: 'TechCorp Solutions' },
      { id: 'innovatecorp', name: 'InnovateCorp' }
    ];
  }
};
export const dashboardService = getDashboardService();
export const fileService = getFileService();
export const auditService = getAuditService();

// Import and export productService
import { productService as _productService } from './productService';
export const productService = _productService;

// Import and export serviceContractService
import { serviceContractService as _serviceContractService } from './serviceContractService';
export const serviceContractService = _serviceContractService;

// Contract service wrapper
const mapContractTypeToUi = (t?: string): UiContract['type'] => {
  const v = (t || '').toLowerCase();
  if (v === 'service') return 'service_agreement';
  if (v === 'product') return 'purchase_order';
  if (v === 'nda') return 'nda';
  if (v === 'employment') return 'employment';
  return 'custom';
};

const mapStatusToUi = (s?: string): UiContract['status'] => {
  const v = (s || '').toLowerCase();
  if (v === 'draft') return 'draft';
  if (v === 'active') return 'active';
  if (v === 'expired' || v === 'terminated') return 'expired';
  if (v === 'renewed') return 'renewed';
  return 'draft';
};

const mapContract = (c: ContractResponse): UiContract => ({
  id: c.id,
  title: c.title,
  type: mapContractTypeToUi(c.type),
  status: mapStatusToUi(c.status),
  parties: [],
  value: c.value,
  currency: 'USD',
  startDate: c.startDate,
  endDate: c.endDate,
  autoRenew: false,
  renewalTerms: '',
  approvalStage: 'draft',
  signedDate: (c as any).signedDate,
  createdBy: '',
  assignedTo: '',
  tenant_id: c.tenantId,
  content: '',
  templateId: undefined,
  version: 1,
  tags: [],
  priority: 'medium',
  reminderDays: [],
  nextReminderDate: (c as any).nextRenewalDate,
  complianceStatus: 'pending_review',
  attachments: [],
  approvalHistory: [],
  signatureStatus: { totalRequired: 0, completed: 0, pending: [] },
  created_at: c.createdAt,
  updated_at: c.updatedAt
});

export const contractService = {
  async getContracts(filters?: any): Promise<UiContract[]> {
    const base: any = getContractService();
    if (apiServiceFactory.isUsingMockApi()) return base.getContracts(filters);
    const res: ContractResponse[] = await base.getContracts(filters);
    return res.map(mapContract);
  },
  async getContract(id: string): Promise<UiContract> {
    const base: any = getContractService();
    if (apiServiceFactory.isUsingMockApi()) return base.getContract(id);
    const c: ContractResponse = await base.getContract(id);
    return mapContract(c);
  },
  async deleteContract(id: string): Promise<void> {
    const base: any = getContractService();
    return base.deleteContract(id);
  },
  async createContract(data: Partial<UiContract>): Promise<UiContract> {
    const base: any = getContractService();
    if (apiServiceFactory.isUsingMockApi()) return base.createContract(data);
    const req = {
      title: data.title,
      customerId: (data as any).customerId || '',
      type: (data?.type === 'purchase_order' ? 'product' : 'service') as any,
      value: data?.value || 0,
      startDate: data?.startDate || new Date().toISOString().slice(0,10),
      endDate: data?.endDate || new Date().toISOString().slice(0,10),
      status: 'draft' as const,
      terms: data?.renewalTerms || ''
    };
    const c: ContractResponse = await base.createContract(req);
    return mapContract(c);
  },
  async updateContract(id: string, data: Partial<UiContract>): Promise<UiContract> {
    const base: any = getContractService();
    if (apiServiceFactory.isUsingMockApi()) return base.updateContract(id, data);
    const req = {
      title: data.title,
      type: (data?.type === 'purchase_order' ? 'product' : 'service') as any,
      value: data?.value,
      startDate: data?.startDate,
      endDate: data?.endDate,
      status: data?.status as any,
      terms: data?.renewalTerms
    } as any;
    const c: ContractResponse = await base.updateContract(id, req);
    return mapContract(c);
  },
  async approveContract(id: string, stage: string, comments?: string): Promise<void> {
    const base: any = getContractService();
    if (apiServiceFactory.isUsingMockApi()) return base.approveContract(id, stage, comments);
    // Real fallback: set status to active
    await base.updateContract(id, { status: 'active' });
  },
  async toggleAutoRenewal(id: string, autoRenew: boolean): Promise<void> {
    const base: any = getContractService();
    if (apiServiceFactory.isUsingMockApi()) return base.toggleAutoRenewal(id, autoRenew);
    // No direct endpoint; best effort no-op for now
    return;
  },
  async getAnalytics(): Promise<UiContractAnalytics> {
    const base: any = getContractService();
    if (apiServiceFactory.isUsingMockApi()) return base.getAnalytics();
    const real = await base.getContractAnalytics();
    const totalContracts = (real.byStatus || []).reduce((sum: number, s: any) => sum + (s.count || 0), 0);
    return {
      totalContracts: totalContracts || 0,
      activeContracts: real.activeContracts || 0,
      pendingApprovals: 0,
      expiringContracts: real.expiringContracts || 0,
      totalValue: real.totalValue || 0,
      averageApprovalTime: 0,
      renewalRate: real.renewalRate || 0,
      complianceRate: 95,
      monthlyStats: (real.monthlyRevenue || []).map((m: any) => ({ month: m.month, created: 0, signed: 0, expired: 0, value: m.revenue })),
      statusDistribution: (real.byStatus || []).map((s: any) => ({ status: s.status, count: s.count, percentage: 0 })),
      typeDistribution: (real.byType || []).map((t: any) => ({ type: t.type, count: t.count, value: t.value }))
    };
  }
};

// Notification service wrapper
export const notificationService = {
  async getNotificationStats(): Promise<import('@/types/notifications').NotificationStats> {
    const base: any = getNotificationService();
    if (apiServiceFactory.isUsingMockApi()) return base.getNotificationStats();
    return base.getNotificationStats();
  },
  async getQueueStatus(): Promise<{ pending: number; processing: number; sent: number; failed: number }> {
    const base: any = getNotificationService();
    if (apiServiceFactory.isUsingMockApi()) return { pending: 0, processing: 0, sent: 0, failed: 0 };
    const queue = await base.getNotificationQueue();
    const counts = { pending: 0, processing: 0, sent: 0, failed: 0 } as any;
    queue.forEach((q: any) => { counts[q.status] = (counts[q.status] || 0) + 1; });
    return counts;
  },
  async processQueue(): Promise<void> {
    if (apiServiceFactory.isUsingMockApi()) {
      const base: any = getNotificationService();
      return base.processQueue?.();
    }
    await baseApiService.post(`${apiConfig.endpoints.notifications.queue}/process`);
  },
  async retryFailedNotifications(): Promise<void> {
    const base: any = getNotificationService();
    if (apiServiceFactory.isUsingMockApi()) return base.retryFailedNotifications?.();
    const queue = await base.getNotificationQueue();
    for (const q of queue.filter((x: any) => x.status === 'failed')) {
      await base.retryNotification(q.notification?.id || q.id);
    }
  },
  async getNotificationQueue(): Promise<import('@/types/notifications').NotificationQueue[]> {
    const base: any = getNotificationService();
    if (apiServiceFactory.isUsingMockApi() && base.getNotificationQueue) return base.getNotificationQueue();
    // Fetch from real API
    const resp = await baseApiService.get<any[]>(`${apiConfig.endpoints.notifications.base}/queue`);
    const list = (resp.data || []) as any[];
    return list.map((q: any) => ({
      id: q.id,
      template_id: q.notification?.id || '',
      recipient_id: (q.notification?.recipients?.[0]?.userId) || '',
      channel: (q.notification?.channels?.[0] || 'push') as any,
      status: q.status,
      priority: 'normal',
      scheduled_at: q.scheduledAt,
      sent_at: q.sentAt,
      delivered_at: undefined,
      failed_at: q.status === 'failed' ? q.sentAt : undefined,
      retry_count: q.attempts || 0,
      max_retries: 3,
      error_message: q.error,
      template_variables: {},
      external_id: undefined,
      created_at: q.notification?.createdAt || new Date().toISOString(),
      updated_at: q.notification?.createdAt || new Date().toISOString()
    }));
  },
  async retryQueueItem(queueId: string): Promise<void> {
    if (apiServiceFactory.isUsingMockApi()) return; // mock handled elsewhere
    await baseApiService.post(`${apiConfig.endpoints.notifications.base}/queue/${queueId}/retry`);
  },
  async cancelQueueItem(queueId: string): Promise<void> {
    if (apiServiceFactory.isUsingMockApi()) return; // mock handled elsewhere
    await baseApiService.post(`${apiConfig.endpoints.notifications.base}/queue/${queueId}/cancel`);
  },
  async sendTemplateNotification(templateId: string, data: { recipients: string[]; channels: Array<'email'|'sms'|'push'|'in_app'>; variables?: Record<string,any>; scheduledAt?: string; }): Promise<any> {
    const base: any = getNotificationService();
    if (apiServiceFactory.isUsingMockApi() && base.sendTemplateNotification) return base.sendTemplateNotification(templateId, data);
    const resp = await baseApiService.post(`${apiConfig.endpoints.notifications.templates}/${templateId}/send`, data);
    return resp.data;
  },
  // passthrough common methods
  async getNotifications(filters?: any) { const base: any = getNotificationService(); return base.getNotifications(filters); },
  async createNotification(data: any) { const base: any = getNotificationService(); return base.createNotification(data); },
  async getTemplates() { const base: any = getNotificationService(); return base.getTemplates(); }
};

// Export factory for advanced usage
export { apiServiceFactory };

// Export service factory methods
export {
  getAuthService,
  getCustomerService,
  getSalesService,
  getTicketService,
  getContractService,
  getUserService,
  getDashboardService,
  getNotificationService,
  getFileService,
  getAuditService,
};

// Export service interfaces for type checking
export type {
  IAuthService,
  ICustomerService,
  ISalesService,
  ITicketService,
  IContractService,
  IUserService,
  IDashboardService,
  INotificationService,
  IFileService,
  IAuditService,
} from './api/apiServiceFactory';

// Export API configuration
export { apiConfig, isUsingMockApi } from '../config/apiConfig';

// Export base API service for direct usage
export { baseApiService } from './api/baseApiService';

// Export API interfaces
export * from './api/interfaces';

/**
 * Utility function to switch API mode at runtime
 */
export function switchApiMode(useMock: boolean): void {
  apiServiceFactory.switchApiMode(useMock);
  
  // Update environment variable for consistency
  if (typeof window !== 'undefined') {
    // Note: This won't actually change the import.meta.env value,
    // but the factory will use its internal state
    console.log(`API mode switched to: ${useMock ? 'Mock' : 'Real'}`);
  }
}

/**
 * Get current API mode
 */
export function getCurrentApiMode(): 'mock' | 'real' {
  return apiServiceFactory.isUsingMockApi() ? 'mock' : 'real';
}

/**
 * Get service health status
 */
export function getServiceHealth(): {
  mode: 'mock' | 'real';
  services: Record<string, boolean>;
  lastCheck: string;
} {
  const services = apiServiceFactory.getServiceInstances();
  
  return {
    mode: getCurrentApiMode(),
    services: Object.keys(services).reduce((acc, key) => {
      acc[key] = services[key] !== null;
      return acc;
    }, {} as Record<string, boolean>),
    lastCheck: new Date().toISOString(),
  };
}

// Default export for convenience
export default {
  auth: authService,
  customer: customerService,
  sales: salesService,
  ticket: ticketService,
  contract: contractService,
  user: userService,
  dashboard: dashboardService,
  notification: notificationService,
  file: fileService,
  audit: auditService,
  factory: apiServiceFactory,
  switchApiMode,
  getCurrentApiMode,
  getServiceHealth,
};

// Export testing and validation utilities
export * from './serviceIntegrationTest';
export * from './testUtils';
export * from './validationScript';
export * from './errorHandler';
export * from './serviceLogger';
