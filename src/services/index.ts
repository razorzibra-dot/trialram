/**
 * Service Index - Central Service Layer Hub
 * 
 * PHASE 4: UNIFIED MULTI-BACKEND SERVICE LAYER
 * ============================================
 * 
 * ARCHITECTURE:
 * =============
 * This file provides a unified interface for all services in the application
 * with seamless switching between THREE backend systems:
 * 
 * 1. MOCK/STATIC DATA (src/services/*Service.ts)
 *    - Development and testing with static data
 *    - Set: VITE_API_MODE=mock or VITE_USE_MOCK_API=true
 * 
 * 2. REAL .NET CORE BACKEND (src/services/real/*Service.ts)
 *    - Production API backend
 *    - Set: VITE_API_MODE=real or VITE_USE_MOCK_API=false
 *    - Requires: dotnet backend running at VITE_API_BASE_URL
 * 
 * 3. SUPABASE POSTGRESQL (src/services/supabase/*Service.ts - Phase 3)
 *    - Modern PostgreSQL with real-time capabilities
 *    - Multi-tenant with Row-Level Security
 *    - Set: VITE_API_MODE=supabase
 *    - Requires: Supabase local/cloud setup
 * 
 * SWITCHING BACKENDS:
 * ===================
 * 1. GLOBAL MODE - All services use same backend:
 *    Set in .env: VITE_API_MODE=mock|real|supabase
 * 
 * 2. PER-SERVICE OVERRIDE - Mix backends as needed:
 *    Set in .env: 
 *      VITE_API_MODE=real
 *      VITE_CUSTOMER_BACKEND=supabase  # Use Supabase for customers only
 *      VITE_SALES_BACKEND=supabase     # Use Supabase for sales only
 * 
 * BACKWARD COMPATIBILITY:
 * ======================
 * Legacy VITE_USE_MOCK_API=true|false still works
 * But VITE_API_MODE takes precedence if set
 * 
 * USAGE:
 * ======
 * Always import from this file:
 *   import { customerService, salesService, ticketService } from '@/services';
 * 
 * Or use Phase 4 custom hooks (recommended):
 *   import { useSupabaseCustomers, useSupabaseSales } from '@/hooks';
 * 
 * HOW IT WORKS:
 * =============
 * 1. src/config/apiConfig.ts determines current mode: getApiMode()
 * 2. src/services/api/apiServiceFactory.ts routes requests to correct backend
 * 3. Services are automatically selected based on configuration
 * 4. Data transformations handled here for consistency
 * 
 * SERVICE STRUCTURE:
 * ==================
 * ├── Mock Services: src/services/*Service.ts
 * ├── Real Services: src/services/real/*Service.ts
 * ├── Supabase Services: src/services/supabase/*Service.ts (Phase 3)
 * ├── Interfaces: src/services/api/apiServiceFactory.ts
 * ├── Configuration: src/config/apiConfig.ts
 * └── Custom Hooks: src/hooks/useSupabase*.ts (Phase 4)
 * 
 * PHASE 4 FEATURES:
 * =================
 * ✅ Seamless backend switching without code changes
 * ✅ Per-service backend override capability
 * ✅ Custom React hooks for component integration
 * ✅ Real-time data synchronization (Supabase)
 * ✅ Backward compatible with existing code
 * ✅ Type-safe service interfaces
 * ✅ Automatic environment detection and logging
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
  apiServiceFactory,
  ICustomerService,
  ISalesService,
  ITicketService,
  IUserService,
  IContractService,
  INotificationService
} from './api/apiServiceFactory';
import { productSaleService as factoryProductSaleService, jobWorkService as factoryJobWorkService, notificationService as factoryNotificationService } from './serviceFactory';
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
import { uiNotificationService } from './uiNotificationService';

// Type alias for UI user representation
type UiUser = User;

// Export service instances - lazy load to avoid initialization issues
export const authService = {
  login: (credentials: Record<string, unknown>) => getAuthService().login(credentials),
  logout: () => getAuthService().logout(),
  getCurrentUser: () => getAuthService().getCurrentUser(),
  getToken: () => getAuthService().getToken(),
  isAuthenticated: () => getAuthService().isAuthenticated(),
  hasRole: (role: string) => getAuthService().hasRole(role),
  hasPermission: (permission: string) => getAuthService().hasPermission(permission),
  refreshToken: () => getAuthService().refreshToken(),
} as unknown as ReturnType<typeof getAuthService>;

// Enhanced mappers: Real -> unified UI shapes
const mapCustomer = (c: CustomerResponse): Customer => {
  const customer = c as Record<string, unknown>;
  return {
    id: c.id,
    company_name: c.companyName,
    contact_name: c.contactName,
    email: c.email,
    phone: c.phone || '',
    mobile: String(customer.mobile || ''),
    website: String(customer.website || ''),
    address: c.address || '',
    city: c.city || '',
    country: c.country || '',
    industry: c.industry || '',
    size: String(c.size || 'small'),
    status: String(c.status || 'active'),
    customer_type: String(customer.customerType || 'business'),
    credit_limit: Number(customer.creditLimit) || 0,
    payment_terms: String(customer.paymentTerms || ''),
    tax_id: String(customer.taxId || ''),
    annual_revenue: Number(customer.annualRevenue) || 0,
    total_sales_amount: Number(customer.totalSalesAmount) || 0,
    total_orders: Number(customer.totalOrders) || 0,
    average_order_value: Number(customer.averageOrderValue) || 0,
    last_purchase_date: String(customer.lastPurchaseDate || ''),
    tags: (c.tags || []) as CustomerTag[],
    notes: c.notes,
    assigned_to: c.assignedTo || '',
    source: String(customer.source || ''),
    rating: String(customer.rating || ''),
    last_contact_date: String(customer.lastContactDate || ''),
    next_follow_up_date: String(customer.nextFollowUpDate || ''),
    tenant_id: c.tenantId,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
    created_by: String(customer.createdBy || '')
  };
};

const stageMapToUi: Record<string, string> = {
  prospect: 'lead',
  qualified: 'qualified',
  proposal: 'proposal',
  negotiation: 'negotiation',
  won: 'closed_won',
  lost: 'closed_lost'
};

const mapSale = (s: any): Sale => {
  const saleData = s as Record<string, unknown>;
  
  // Handle both SaleResponse (camelCase) and Supabase Sale (snake_case) formats
  const expectedCloseDate = (s.expectedCloseDate || s.expected_close_date || '') as string;
  const actualCloseDate = (s.actualCloseDate || s.actual_close_date || '') as string;
  
  return {
    id: s.id,
    sale_number: s.id, // Use ID as sale number for now
    title: s.title,
    description: s.description || '',
    customer_id: s.customer?.id || s.customer_id || '',
    customer_name: s.customer?.companyName || s.customer?.company_name || String(saleData.customer_name || ''),
    value: s.value || Number(saleData.value) || 0,
    amount: s.value || s.amount || Number(saleData.value) || 0,
    currency: 'USD',
    probability: s.probability || Number(saleData.probability) || 50,
    weighted_amount: (s.value || Number(saleData.value) || 0) * ((s.probability || Number(saleData.probability) || 50) / 100),
    stage: (stageMapToUi[(s.stage || '').toLowerCase()] || 'lead') as Sale['stage'],
    status: s.status || (s.stage === 'won' ? 'won' : s.stage === 'lost' ? 'lost' : 'open'),
    source: String(saleData.source || ''),
    campaign: String(saleData.campaign || ''),
    expected_close_date: expectedCloseDate,
    actual_close_date: actualCloseDate,
    last_activity_date: String(saleData.last_activity_date || ''),
    next_activity_date: String(saleData.next_activity_date || ''),
    assigned_to: s.assignedTo || s.assigned_to || '',
    assigned_to_name: s.assignedUser?.name || s.assigned_to_name || '',
    notes: s.notes || '',
    tags: Array.isArray(saleData.tags) ? (saleData.tags as string[]) : [],
    competitor_info: String(saleData.competitor_info || ''),
    // Handle both products array (camelCase) and items array (snake_case)
    items: (s.products?.map((p: any) => ({
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
    })) || (Array.isArray(saleData.items) ? (saleData.items as any[]).map(item => ({
      id: item.id || '',
      sale_id: item.sale_id || s.id,
      product_id: item.product_id || '',
      product_name: item.product_name || '',
      product_description: item.product_description || '',
      quantity: Number(item.quantity) || 0,
      unit_price: Number(item.unit_price) || 0,
      discount: Number(item.discount) || 0,
      tax: Number(item.tax) || 0,
      line_total: Number(item.line_total) || 0,
    })) : [])) || [],
    tenant_id: s.tenantId || s.tenant_id || '',
    created_at: s.createdAt || s.created_at || new Date().toISOString(),
    updated_at: s.updatedAt || s.updated_at || new Date().toISOString(),
    created_by: String(saleData.created_by || '')
  };
};

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
  status: (String(t.status) || 'open') as Ticket['status'],
  priority: (String(t.priority) || 'medium') as Ticket['priority'],
  category: (String(t.category) || 'general') as Ticket['category'],
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
  const user = u as Record<string, unknown>;
  return {
    id: u.id,
    email: u.email,
    firstName: firstName || '',
    lastName: rest.join(' '),
    role: (String(u.role) || 'Viewer') as User['role'],
    status: (String(user.status) || 'active') as User['status'],
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
  async getCustomers(filters?: Record<string, unknown>): Promise<Customer[]> {
    const base: ICustomerService = getCustomerService();
    if (apiServiceFactory.isUsingMockApi()) return base.getCustomers(filters) as Promise<Customer[]>;
    const res: CustomerResponse[] = await base.getCustomers(filters) as CustomerResponse[];
    return res.map(mapCustomer);
  },
  async getCustomer(id: string): Promise<Customer> {
    const base: ICustomerService = getCustomerService();
    if (apiServiceFactory.isUsingMockApi()) return base.getCustomer(id) as Promise<Customer>;
    const c: CustomerResponse = await base.getCustomer(id) as CustomerResponse;
    return mapCustomer(c);
  },
  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    const base: ICustomerService = getCustomerService();
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
    if (apiServiceFactory.isUsingMockApi()) return base.createCustomer(req) as Promise<Customer>;
    const c: CustomerResponse = await base.createCustomer(req) as CustomerResponse;
    return mapCustomer(c);
  },
  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    const base: ICustomerService = getCustomerService();
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
    if (apiServiceFactory.isUsingMockApi()) return base.updateCustomer(id, req) as Promise<Customer>;
    const c: CustomerResponse = await base.updateCustomer(id, req) as CustomerResponse;
    return mapCustomer(c);
  },
  async deleteCustomer(id: string): Promise<void> {
    const base: ICustomerService = getCustomerService();
    return base.deleteCustomer(id);
  },
  async getTags(): Promise<CustomerTag[]> {
    const base: ICustomerService = getCustomerService();
    return base.getTags() as Promise<CustomerTag[]>;
  },
  async createTag(name: string, color: string): Promise<CustomerTag> {
    const base: ICustomerService = getCustomerService();
    if (base.createTag) return base.createTag(name, color) as Promise<CustomerTag>;
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
  async getDeals(filters?: Record<string, unknown>): Promise<Deal[]> {
    const base: ISalesService = getSalesService();
    if (apiServiceFactory.isUsingMockApi() && 'getDeals' in base) return (base as Record<string, unknown>).getDeals?.(filters) as Promise<Deal[]>;
    const res: SaleResponse[] = await base.getSales(filters) as SaleResponse[];
    return res.map(mapSale);
  },
  async getDeal(id: string): Promise<Deal> {
    const base: ISalesService = getSalesService();
    if (apiServiceFactory.isUsingMockApi() && 'getDeal' in base) return (base as Record<string, unknown>).getDeal?.(id) as Promise<Deal>;
    const res: SaleResponse = await base.getSale(id) as SaleResponse;
    return mapSale(res);
  },
  async createDeal(data: Record<string, unknown>): Promise<Deal> {
    const base: ISalesService = getSalesService();
    if (apiServiceFactory.isUsingMockApi() && 'createDeal' in base) return (base as Record<string, unknown>).createDeal?.(data) as Promise<Deal>;
    const res: SaleResponse = await base.createSale(data) as SaleResponse;
    return mapSale(res);
  },
  async updateDeal(id: string, data: Record<string, unknown>): Promise<Deal> {
    const base: ISalesService = getSalesService();
    if (apiServiceFactory.isUsingMockApi() && 'updateDeal' in base) return (base as Record<string, unknown>).updateDeal?.(id, data) as Promise<Deal>;
    const res: SaleResponse = await base.updateSale(id, data) as SaleResponse;
    return mapSale(res);
  },
  async deleteDeal(id: string): Promise<void> {
    const base: ISalesService = getSalesService();
    if (apiServiceFactory.isUsingMockApi() && 'deleteDeal' in base) return (base as Record<string, unknown>).deleteDeal?.(id) as Promise<void>;
    return base.deleteSale(id);
  }
};

// Ticket service wrapper
export const ticketService = {
  async getTickets(filters?: Record<string, unknown>): Promise<Ticket[]> {
    const base: ITicketService = getTicketService();
    if (apiServiceFactory.isUsingMockApi()) return base.getTickets(filters) as Promise<Ticket[]>;
    const res: TicketResponse[] = await base.getTickets(filters) as TicketResponse[];
    return res.map(mapTicket);
  },
  async deleteTicket(id: string): Promise<void> {
    const base: ITicketService = getTicketService();
    return base.deleteTicket(id);
  }
};

// Contract service: passthrough (mock-heavy features); keep direct for now

// Product Sale Service - Routes to Supabase or Mock based on VITE_API_MODE
export const productSaleService = factoryProductSaleService;

// User service wrapper
export const userService = {
  async getUsers(filters?: Record<string, unknown>): Promise<UiUser[]> {
    const base: IUserService = getUserService();
    if (apiServiceFactory.isUsingMockApi()) return base.getUsers(filters) as Promise<UiUser[]>;
    const res: UserResponse[] = await base.getUsers(filters) as UserResponse[];
    return res.map(mapUser);
  },
  async updateUser(id: string, updates: Partial<UiUser>): Promise<UiUser> {
    const base: IUserService = getUserService();
    if (apiServiceFactory.isUsingMockApi()) return base.updateUser(id, updates as Record<string, unknown>) as Promise<UiUser>;
    const req = {
      name: `${updates.firstName ?? ''} ${updates.lastName ?? ''}`.trim() || undefined,
      email: updates.email,
      role: updates.role,
      avatar: updates.avatar
    };
    return base.updateUser(id, req) as Promise<UiUser>;
  },
  async createUser(data: Omit<UiUser,'id'|'createdAt'|'lastLogin'>): Promise<UiUser> {
    const base: IUserService = getUserService();
    if (apiServiceFactory.isUsingMockApi()) return base.createUser(data as Record<string, unknown>) as Promise<UiUser>;
    const req = {
      name: `${data.firstName} ${data.lastName}`.trim(),
      email: data.email,
      role: data.role,
      avatar: data.avatar
    };
    return base.createUser(req) as Promise<UiUser>;
  },
  async deleteUser(id: string): Promise<void> {
    const base: IUserService = getUserService();
    return base.deleteUser(id);
  },
  async resetPassword(id: string): Promise<void> {
    const base: IUserService = getUserService();
    if ('resetPassword' in base) return (base as Record<string, unknown>).resetPassword?.(id) as Promise<void>;
    // Stub
    return;
  },
  async getTenants(): Promise<Array<{ id: string; name: string }>> {
    const base: IUserService = getUserService();
    if ('getTenants' in base) return (base as Record<string, unknown>).getTenants?.() as Promise<Array<{ id: string; name: string }>>;
    // Stub a couple of tenants
    return [
      { id: 'techcorp', name: 'TechCorp Solutions' },
      { id: 'innovatecorp', name: 'InnovateCorp' }
    ];
  }
};
// Lazy load dashboard service
export const dashboardService = {
  getMetrics: () => getDashboardService().getMetrics(),
  getAnalytics: (period?: string) => getDashboardService().getAnalytics(period),
  getRecentActivity: () => getDashboardService().getRecentActivity(),
  getWidgetData: (widgetType: string) => getDashboardService().getWidgetData(widgetType),
} as unknown as ReturnType<typeof getDashboardService>;

// Lazy load file service
export const fileService = {
  uploadFile: (file: File, options?: Record<string, unknown>) => getFileService().uploadFile(file, options),
  downloadFile: (id: string) => getFileService().downloadFile(id),
  deleteFile: (id: string) => getFileService().deleteFile(id),
  getFileMetadata: (id: string) => getFileService().getFileMetadata(id),
} as unknown as ReturnType<typeof getFileService>;

// Lazy load audit service
export const auditService = {
  getAuditLogs: (filters?: Record<string, unknown>) => getAuditService().getAuditLogs(filters),
  exportAuditLogs: (filters?: Record<string, unknown>) => getAuditService().exportAuditLogs(filters),
  searchAuditLogs: (query: string) => getAuditService().searchAuditLogs(query),
} as unknown as ReturnType<typeof getAuditService>;

// Export productService from factory (supports mock/supabase/real backends)
import { productService as factoryProductService } from './serviceFactory';
export const productService = factoryProductService;

// Export jobWorkService from factory (supports mock/supabase/real backends)
export const jobWorkService = factoryJobWorkService;

// Import and export serviceContractService (factory-routed for Supabase/Mock switching)
import { serviceContractService as factoryServiceContractService } from './serviceFactory';
export const serviceContractService = factoryServiceContractService;

// Import and export companyService (factory-routed for Supabase/Mock switching)
import { companyService as factoryCompanyService } from './serviceFactory';
export const companyService = factoryCompanyService;

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

const mapContract = (c: ContractResponse): UiContract => {
  const contract = c as Record<string, unknown>;
  return {
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
    signedDate: contract.signedDate as string | undefined,
    createdBy: '',
    assignedTo: '',
    tenant_id: c.tenantId,
    content: '',
    templateId: undefined,
    version: 1,
    tags: [],
    priority: 'medium',
    reminderDays: [],
    nextReminderDate: contract.nextRenewalDate as string | undefined,
    complianceStatus: 'pending_review',
    attachments: [],
    approvalHistory: [],
    signatureStatus: { totalRequired: 0, completed: 0, pending: [] },
    created_at: c.createdAt,
    updated_at: c.updatedAt
  };
};

export const contractService = {
  async getContracts(filters?: Record<string, unknown>): Promise<UiContract[]> {
    const base: IContractService = getContractService();
    if (apiServiceFactory.isUsingMockApi()) return base.getContracts(filters) as Promise<UiContract[]>;
    const res: ContractResponse[] = await base.getContracts(filters) as ContractResponse[];
    return res.map(mapContract);
  },
  async getContract(id: string): Promise<UiContract> {
    const base: IContractService = getContractService();
    if (apiServiceFactory.isUsingMockApi()) return base.getContract(id) as Promise<UiContract>;
    const c: ContractResponse = await base.getContract(id) as ContractResponse;
    return mapContract(c);
  },
  async deleteContract(id: string): Promise<void> {
    const base: IContractService = getContractService();
    return base.deleteContract(id);
  },
  async createContract(data: Partial<UiContract>): Promise<UiContract> {
    const base: IContractService = getContractService();
    const req: Record<string, unknown> = {
      title: data.title,
      customerId: (data as Record<string, unknown>).customerId || '',
      type: (data?.type === 'purchase_order' ? 'product' : 'service'),
      value: data?.value || 0,
      startDate: data?.startDate || new Date().toISOString().slice(0,10),
      endDate: data?.endDate || new Date().toISOString().slice(0,10),
      status: 'draft',
      terms: data?.renewalTerms || ''
    };
    if (apiServiceFactory.isUsingMockApi()) return base.createContract(req) as Promise<UiContract>;
    const c: ContractResponse = await base.createContract(req) as ContractResponse;
    return mapContract(c);
  },
  async updateContract(id: string, data: Partial<UiContract>): Promise<UiContract> {
    const base: IContractService = getContractService();
    const req: Record<string, unknown> = {
      title: data.title,
      type: (data?.type === 'purchase_order' ? 'product' : 'service'),
      value: data?.value,
      startDate: data?.startDate,
      endDate: data?.endDate,
      status: data?.status,
      terms: data?.renewalTerms
    };
    if (apiServiceFactory.isUsingMockApi()) return base.updateContract(id, req) as Promise<UiContract>;
    const c: ContractResponse = await base.updateContract(id, req) as ContractResponse;
    return mapContract(c);
  },
  async approveContract(id: string, stage: string, comments?: string): Promise<void> {
    const base: IContractService = getContractService();
    if (apiServiceFactory.isUsingMockApi()) {
      const mock = base as Record<string, unknown>;
      return mock.approveContract?.(id, stage, comments) as Promise<void>;
    }
    // Real fallback: set status to active
    await base.updateContract(id, { status: 'active' });
  },
  async toggleAutoRenewal(id: string, autoRenew: boolean): Promise<void> {
    const base: IContractService = getContractService();
    if (apiServiceFactory.isUsingMockApi()) {
      const mock = base as Record<string, unknown>;
      return mock.toggleAutoRenewal?.(id, autoRenew) as Promise<void>;
    }
    // No direct endpoint; best effort no-op for now
    return;
  },
  async getAnalytics(): Promise<UiContractAnalytics> {
    const base: IContractService = getContractService();
    if (apiServiceFactory.isUsingMockApi()) {
      const mock = base as Record<string, unknown>;
      return mock.getAnalytics?.() as Promise<UiContractAnalytics>;
    }
    const real = await base.getContractAnalytics() as Record<string, unknown>;
    const byStatus = (real.byStatus || []) as Array<Record<string, unknown>>;
    const totalContracts = byStatus.reduce((sum: number, s: Record<string, unknown>) => sum + (Number(s.count) || 0), 0);
    const monthlyRevenue = (real.monthlyRevenue || []) as Array<Record<string, unknown>>;
    const byType = (real.byType || []) as Array<Record<string, unknown>>;
    return {
      totalContracts: totalContracts || 0,
      activeContracts: Number(real.activeContracts) || 0,
      pendingApprovals: 0,
      expiringContracts: Number(real.expiringContracts) || 0,
      totalValue: Number(real.totalValue) || 0,
      averageApprovalTime: 0,
      renewalRate: Number(real.renewalRate) || 0,
      complianceRate: 95,
      monthlyStats: monthlyRevenue.map((m: Record<string, unknown>) => ({ month: String(m.month), created: 0, signed: 0, expired: 0, value: Number(m.revenue) })),
      statusDistribution: byStatus.map((s: Record<string, unknown>) => ({ status: String(s.status), count: Number(s.count), percentage: 0 })),
      typeDistribution: byType.map((t: Record<string, unknown>) => ({ type: String(t.type), count: Number(t.count), value: Number(t.value) }))
    };
  }
};

// Notification API service wrapper (for managing notification queue, not for UI notifications)
export const notificationApiService = {
  async getNotificationStats(): Promise<import('@/types/notifications').NotificationStats> {
    const base: INotificationService = getNotificationService();
    if (apiServiceFactory.isUsingMockApi()) return base.getNotifications() as Promise<import('@/types/notifications').NotificationStats>;
    return base.getNotifications() as Promise<import('@/types/notifications').NotificationStats>;
  },
  async getQueueStatus(): Promise<{ pending: number; processing: number; sent: number; failed: number }> {
    const base: INotificationService = getNotificationService();
    if (apiServiceFactory.isUsingMockApi()) return { pending: 0, processing: 0, sent: 0, failed: 0 };
    const queue = await base.getNotifications() as Array<Record<string, unknown>>;
    const counts: Record<string, number> = { pending: 0, processing: 0, sent: 0, failed: 0 };
    queue.forEach((q: Record<string, unknown>) => { 
      const status = String(q.status || 'pending');
      counts[status] = (counts[status] || 0) + 1; 
    });
    return counts as { pending: number; processing: number; sent: number; failed: number };
  },
  async processQueue(): Promise<void> {
    if (apiServiceFactory.isUsingMockApi()) {
      const base: INotificationService = getNotificationService();
      const mock = base as Record<string, unknown>;
      return mock.processQueue?.() as Promise<void>;
    }
    await baseApiService.post(`${apiConfig.endpoints.notifications.queue}/process`);
  },
  async retryFailedNotifications(): Promise<void> {
    const base: INotificationService = getNotificationService();
    if (apiServiceFactory.isUsingMockApi()) {
      const mock = base as Record<string, unknown>;
      return mock.retryFailedNotifications?.() as Promise<void>;
    }
    const queue = await base.getNotifications() as Array<Record<string, unknown>>;
    const failed = queue.filter((x: Record<string, unknown>) => x.status === 'failed');
    const baseMock = base as Record<string, unknown>;
    for (const q of failed) {
      await (baseMock.retryNotification as (id: string) => Promise<void>)((q.notification as Record<string, unknown>)?.id || q.id);
    }
  },
  async getNotificationQueue(): Promise<import('@/types/notifications').NotificationQueue[]> {
    const base: INotificationService = getNotificationService();
    if (apiServiceFactory.isUsingMockApi()) {
      const mock = base as Record<string, unknown>;
      if (mock.getNotificationQueue) return mock.getNotificationQueue() as Promise<import('@/types/notifications').NotificationQueue[]>;
    }
    // Fetch from real API
    const resp = await baseApiService.get<Array<Record<string, unknown>>>(`${apiConfig.endpoints.notifications.base}/queue`);
    const list = (resp.data || []);
    return list.map((q: Record<string, unknown>) => {
      const notification = q.notification as Record<string, unknown> | undefined;
      const channels = notification?.channels as unknown[] | undefined;
      const recipients = notification?.recipients as Array<Record<string, unknown>> | undefined;
      return {
        id: String(q.id),
        template_id: String(notification?.id || ''),
        recipient_id: String(recipients?.[0]?.userId || ''),
        channel: (channels?.[0] || 'push') as 'email'|'sms'|'push'|'in_app',
        status: String(q.status),
        priority: 'normal' as const,
        scheduled_at: String(q.scheduledAt),
        sent_at: String(q.sentAt),
        delivered_at: undefined,
        failed_at: q.status === 'failed' ? String(q.sentAt) : undefined,
        retry_count: Number(q.attempts) || 0,
        max_retries: 3,
        error_message: String(q.error),
        template_variables: {},
        external_id: undefined,
        created_at: String(notification?.createdAt || new Date().toISOString()),
        updated_at: String(notification?.createdAt || new Date().toISOString())
      };
    });
  },
  async retryQueueItem(queueId: string): Promise<void> {
    if (apiServiceFactory.isUsingMockApi()) return; // mock handled elsewhere
    await baseApiService.post(`${apiConfig.endpoints.notifications.base}/queue/${queueId}/retry`);
  },
  async cancelQueueItem(queueId: string): Promise<void> {
    if (apiServiceFactory.isUsingMockApi()) return; // mock handled elsewhere
    await baseApiService.post(`${apiConfig.endpoints.notifications.base}/queue/${queueId}/cancel`);
  },
  async sendTemplateNotification(templateId: string, data: { recipients: string[]; channels: Array<'email'|'sms'|'push'|'in_app'>; variables?: Record<string, unknown>; scheduledAt?: string; }): Promise<Record<string, unknown>> {
    const base: INotificationService = getNotificationService();
    if (apiServiceFactory.isUsingMockApi()) {
      const mock = base as Record<string, unknown>;
      if (mock.sendTemplateNotification) return mock.sendTemplateNotification(templateId, data) as Promise<Record<string, unknown>>;
    }
    const resp = await baseApiService.post(`${apiConfig.endpoints.notifications.templates}/${templateId}/send`, data);
    return resp.data as Record<string, unknown>;
  },
  // passthrough common methods
  async getNotifications(filters?: Record<string, unknown>) { 
    const base: INotificationService = getNotificationService(); 
    return base.getNotifications(filters); 
  },
  async createNotification(data: Record<string, unknown>) { 
    const base: INotificationService = getNotificationService(); 
    return base.createNotification(data); 
  },
  async getTemplates() { 
    const base: INotificationService = getNotificationService(); 
    return base.getTemplates(); 
  }
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

// Named exports for individual services
// Export the UI notification service
export { uiNotificationService };
// Export the data notification service from factory
export { notificationService } from './serviceFactory';

// Default export for convenience
export default {
  auth: authService,
  customer: customerService,
  sales: salesService,
  ticket: ticketService,
  contract: contractService,
  productSale: productSaleService,
  user: userService,
  dashboard: dashboardService,
  notification: factoryNotificationService,  // Data notification service from factory
  uiNotification: uiNotificationService,      // UI notification (messages/alerts)
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
