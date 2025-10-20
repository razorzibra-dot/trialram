# Complete Code Templates - Ready to Copy & Paste
## All Supabase Service Implementations

---

## 🎯 QUICK REFERENCE: FILE LOCATIONS & ORDER

### Create these files in this order:

```
src/
├── config/
│   └── backendConfig.ts                    ← CONFIG LAYER
├── services/
│   ├── supabase/
│   │   ├── client.ts                       ← SUPABASE CLIENT
│   │   ├── baseSupabaseService.ts          ← BASE SERVICE
│   │   ├── authService.ts                  ← AUTH SERVICE
│   │   ├── customerService.ts              ← CUSTOMER SERVICE (DONE ✅)
│   │   ├── salesService.ts                 ← SALES SERVICE
│   │   ├── ticketService.ts                ← TICKET SERVICE
│   │   ├── contractService.ts              ← CONTRACT SERVICE
│   │   ├── fileService.ts                  ← FILE SERVICE
│   │   ├── notificationService.ts          ← NOTIFICATION SERVICE
│   │   └── syncManager.ts                  ← SYNC MANAGER (OFFLINE)
│   ├── api/
│   │   └── apiServiceFactory.ts            ← FACTORY PATTERN (UPDATE)
│   └── index.ts                            ← SERVICE EXPORTS (UPDATE)
└── __tests__/
    └── services/
        └── multiBackendIntegration.test.ts ← TESTS
```

---

## TEMPLATE 1: Supabase Auth Service

**File: `src/services/supabase/authService.ts`**

```typescript
/**
 * Supabase Authentication Service
 * Implements IAuthService using Supabase Auth
 */

import { SupabaseClient, AuthError } from '@supabase/supabase-js';
import { IAuthService } from '../api/apiServiceFactory';
import { User } from '@/types/auth';
import { BaseSupabaseService, ServiceLogger } from './baseSupabaseService';

export class SupabaseAuthService extends BaseSupabaseService implements IAuthService {
  private tokenKey = 'supabase_auth_token';
  private userKey = 'supabase_user';

  constructor(supabase: SupabaseClient, logger?: ServiceLogger) {
    super(supabase, logger);
  }

  /**
   * Login with email and password
   */
  async login(credentials: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const { email, password } = credentials as { email: string; password: string };

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { session, user } = data;

      // Store session
      if (session) {
        localStorage.setItem(this.tokenKey, session.access_token);
        this.userId = user.id;
        
        // Extract tenant from metadata
        const tenantId = user.user_metadata?.tenant_id;
        if (tenantId) {
          this.tenantId = tenantId;
        }
      }

      this.logger.info('✅ User logged in successfully');

      return {
        user: this.mapUser(user),
        token: session?.access_token,
        refreshToken: session?.refresh_token,
        expiresIn: session?.expires_in,
      };
    } catch (error) {
      this.logger.error('Login failed', error);
      throw new Error(`Login failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Register new user
   */
  async register(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const { email, password, firstName, lastName } = data;

      const { data: authData, error } = await this.supabase.auth.signUp({
        email: email as string,
        password: password as string,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) throw error;

      this.logger.info('✅ User registered successfully');

      return {
        user: this.mapUser(authData.user!),
        message: 'Please check your email to confirm registration',
      };
    } catch (error) {
      this.logger.error('Registration failed', error);
      throw new Error(`Registration failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) throw error;

      // Clear local storage
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);

      this.userId = null;
      this.tenantId = null;

      this.logger.info('✅ User logged out successfully');
    } catch (error) {
      this.logger.error('Logout failed', error);
      throw new Error(`Logout failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data, error } = await this.supabase.auth.getUser();

      if (error || !data.user) {
        return null;
      }

      this.userId = data.user.id;
      this.tenantId = data.user.user_metadata?.tenant_id;

      return this.mapUser(data.user);
    } catch (error) {
      this.logger.error('Failed to get current user', error);
      return null;
    }
  }

  /**
   * Get authentication token
   */
  async getToken(): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.auth.getSession();

      if (error || !data.session) {
        return null;
      }

      return data.session.access_token;
    } catch (error) {
      this.logger.error('Failed to get token', error);
      return null;
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(): Promise<string> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();

      if (error || !data.session) {
        throw new Error('Failed to refresh token');
      }

      localStorage.setItem(this.tokenKey, data.session.access_token);

      this.logger.info('✅ Token refreshed successfully');

      return data.session.access_token;
    } catch (error) {
      this.logger.error('Token refresh failed', error);
      throw new Error(`Token refresh failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.auth.getSession();
      return !error && !!data.session;
    } catch {
      return false;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      this.logger.info('✅ Password reset email sent');
    } catch (error) {
      this.logger.error('Password reset failed', error);
      throw new Error(`Password reset failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      this.logger.info('✅ Password updated successfully');
    } catch (error) {
      this.logger.error('Password update failed', error);
      throw new Error(`Password update failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Check if user has role
   */
  async hasRole(role: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user?.role === role;
    } catch {
      return false;
    }
  }

  /**
   * Check if user has permission
   */
  async hasPermission(permission: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user?.permissions?.includes(permission) || false;
    } catch {
      return false;
    }
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<User> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      return user;
    } catch (error) {
      this.logger.error('Failed to get profile', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: Partial<Omit<User, 'id'>>): Promise<User> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        data: {
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          avatar: profileData.avatar,
        },
      });

      if (error) throw error;

      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('Failed to update profile');
      }

      this.logger.info('✅ Profile updated successfully');
      return user;
    } catch (error) {
      this.logger.error('Profile update failed', error);
      throw error;
    }
  }

  /**
   * Map Supabase user to UI User type
   */
  private mapUser(user: any): User {
    const [firstName = '', ...lastNameParts] = (
      user.user_metadata?.first_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      ''
    ).split(' ');

    return {
      id: user.id,
      email: user.email || '',
      firstName,
      lastName: (user.user_metadata?.last_name || lastNameParts.join(' ') || ''),
      role: (user.user_metadata?.role || 'Viewer') as User['role'],
      status: user.user_metadata?.status || 'active',
      tenantId: user.user_metadata?.tenant_id || '',
      tenantName: user.user_metadata?.tenant_name || '',
      lastLogin: user.last_sign_in_at || '',
      createdAt: user.created_at || '',
      avatar: user.user_metadata?.avatar || '',
      phone: user.user_metadata?.phone || '',
      permissions: user.user_metadata?.permissions || [],
    };
  }

  /**
   * Extract error message
   */
  private getErrorMessage(error: any): string {
    if (error instanceof AuthError) {
      return error.message;
    }
    return error?.message || 'Unknown error occurred';
  }
}
```

**✅ Checklist:**
- [ ] File created at `src/services/supabase/authService.ts`
- [ ] All methods implemented
- [ ] Error handling added
- [ ] User mapping implemented

---

## TEMPLATE 2: Supabase Sales Service

**File: `src/services/supabase/salesService.ts`**

```typescript
/**
 * Supabase Sales Service
 * Implements ISalesService for Supabase
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ISalesService } from '../api/apiServiceFactory';
import { BaseSupabaseService } from './baseSupabaseService';

export class SupabaseSalesService extends BaseSupabaseService implements ISalesService {
  private tableName = 'sales';

  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  async getSales(filters?: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select(`
          *,
          customer:customers(id, company_name, contact_name),
          assigned_user:users(id, name)
        `)
        .eq('tenant_id', this.getTenantId());

      // Apply filters
      if (filters?.stage) {
        query = query.eq('stage', filters.stage);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      this.logger.info(`✅ Fetched ${data?.length || 0} sales`);
      return data || [];
    } catch (error) {
      this.logger.error('Failed to fetch sales', error);
      throw error;
    }
  }

  async getSale(id: string): Promise<Record<string, unknown>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(`
          *,
          customer:customers(*),
          assigned_user:users(*),
          products:sale_products(*)
        `)
        .eq('id', id)
        .eq('tenant_id', this.getTenantId())
        .single();

      if (error) throw error;
      this.logger.info(`✅ Fetched sale ${id}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to fetch sale ${id}`, error);
      throw error;
    }
  }

  async createSale(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const payload = {
        title: data.title,
        description: data.description,
        value: data.value,
        probability: data.probability || 50,
        stage: data.stage || 'prospect',
        status: data.status || 'open',
        customer_id: data.customerId,
        assigned_to: data.assignedTo,
        expected_close_date: data.expectedCloseDate,
        tenant_id: this.getTenantId(),
        created_by: this.getCurrentUserId(),
        created_at: new Date().toISOString(),
      };

      const { data: newSale, error } = await this.supabase
        .from(this.tableName)
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // Add products if provided
      if (Array.isArray(data.products)) {
        await this.addSaleProducts(newSale.id, data.products as any[]);
      }

      this.logger.info(`✅ Created sale: ${newSale.id}`);
      return newSale;
    } catch (error) {
      this.logger.error('Failed to create sale', error);
      throw error;
    }
  }

  async updateSale(id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const payload: Record<string, unknown> = {
        title: data.title,
        description: data.description,
        value: data.value,
        probability: data.probability,
        stage: data.stage,
        status: data.status,
        customer_id: data.customerId,
        assigned_to: data.assignedTo,
        expected_close_date: data.expectedCloseDate,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      const { data: updatedSale, error } = await this.supabase
        .from(this.tableName)
        .update(payload)
        .eq('id', id)
        .eq('tenant_id', this.getTenantId())
        .select()
        .single();

      if (error) throw error;
      this.logger.info(`✅ Updated sale ${id}`);
      return updatedSale;
    } catch (error) {
      this.logger.error(`Failed to update sale ${id}`, error);
      throw error;
    }
  }

  async deleteSale(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .eq('tenant_id', this.getTenantId());

      if (error) throw error;
      this.logger.info(`✅ Deleted sale ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete sale ${id}`, error);
      throw error;
    }
  }

  async getPipelineStages(): Promise<Record<string, unknown>[]> {
    try {
      const stages = [
        { id: 'prospect', name: 'Prospect', order: 1 },
        { id: 'qualified', name: 'Qualified', order: 2 },
        { id: 'proposal', name: 'Proposal', order: 3 },
        { id: 'negotiation', name: 'Negotiation', order: 4 },
        { id: 'won', name: 'Won', order: 5 },
        { id: 'lost', name: 'Lost', order: 6 },
      ];

      return stages;
    } catch (error) {
      this.logger.error('Failed to fetch pipeline stages', error);
      return [];
    }
  }

  async getSalesAnalytics(period?: string): Promise<Record<string, unknown>> {
    try {
      const dateFrom = this.getDateFrom(period || 'month');

      // Get all sales
      const { data: sales, error: salesError } = await this.supabase
        .from(this.tableName)
        .select('value, probability, stage, created_at')
        .eq('tenant_id', this.getTenantId())
        .gte('created_at', dateFrom);

      if (salesError) throw salesError;

      // Calculate analytics
      const analytics = {
        totalValue: (sales || []).reduce((sum: number, s: any) => sum + (s.value || 0), 0),
        totalCount: (sales || []).length,
        averageValue: (sales || []).length > 0 
          ? (sales || []).reduce((sum: number, s: any) => sum + (s.value || 0), 0) / (sales || []).length 
          : 0,
        byStage: this.groupByStage(sales || []),
        trend: this.calculateTrend(sales || []),
      };

      return analytics;
    } catch (error) {
      this.logger.error('Failed to fetch sales analytics', error);
      return { totalValue: 0, totalCount: 0, averageValue: 0 };
    }
  }

  /**
   * Helper: Add products to sale
   */
  private async addSaleProducts(saleId: string, products: any[]): Promise<void> {
    try {
      const payload = products.map(p => ({
        sale_id: saleId,
        product_id: p.productId,
        product_name: p.productName,
        quantity: p.quantity,
        unit_price: p.unitPrice,
        total_price: p.quantity * p.unitPrice,
        tenant_id: this.getTenantId(),
      }));

      const { error } = await this.supabase
        .from('sale_products')
        .insert(payload);

      if (error) throw error;
      this.logger.info(`✅ Added ${products.length} products to sale`);
    } catch (error) {
      this.logger.error('Failed to add sale products', error);
    }
  }

  /**
   * Helper: Group sales by stage
   */
  private groupByStage(sales: any[]): Record<string, number> {
    return sales.reduce((acc: Record<string, number>, s: any) => {
      const stage = s.stage || 'unknown';
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Helper: Calculate trend
   */
  private calculateTrend(sales: any[]): { current: number; previous: number; change: number } {
    const now = Date.now();
    const twoPeriodsAgo = now - (7 * 24 * 60 * 60 * 1000); // 2 weeks
    const oneWeekAgo = now - (3.5 * 24 * 60 * 60 * 1000);

    const current = sales.filter((s: any) => new Date(s.created_at).getTime() > oneWeekAgo);
    const previous = sales.filter((s: any) => {
      const t = new Date(s.created_at).getTime();
      return t > twoPeriodsAgo && t <= oneWeekAgo;
    });

    const change = current.length - previous.length;

    return { current: current.length, previous: previous.length, change };
  }

  /**
   * Helper: Get date filter
   */
  private getDateFrom(period: string): string {
    const now = new Date();
    let dateFrom: Date;

    switch (period) {
      case 'week':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        dateFrom = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        dateFrom = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return dateFrom.toISOString();
  }
}
```

**✅ Checklist:**
- [ ] File created at `src/services/supabase/salesService.ts`
- [ ] All methods implemented
- [ ] Analytics calculation added
- [ ] Product handling implemented

---

## TEMPLATE 3: Supabase Ticket Service

**File: `src/services/supabase/ticketService.ts`**

```typescript
/**
 * Supabase Ticket Service
 * Implements ITicketService for Supabase
 */

import { SupabaseClient, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { ITicketService } from '../api/apiServiceFactory';
import { BaseSupabaseService } from './baseSupabaseService';

export class SupabaseTicketService extends BaseSupabaseService implements ITicketService {
  private tableName = 'tickets';
  private realTimeUnsubscribe: (() => void) | null = null;

  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  /**
   * Setup real-time ticket updates
   */
  public setupRealTimeUpdates(callback: (payload: RealtimePostgresChangesPayload<any>) => void): void {
    this.realTimeUnsubscribe = this.subscribeToTable(this.tableName, callback);
  }

  /**
   * Stop real-time updates
   */
  public stopRealTimeUpdates(): void {
    if (this.realTimeUnsubscribe) {
      this.realTimeUnsubscribe();
      this.realTimeUnsubscribe = null;
    }
  }

  async getTickets(filters?: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select(`
          *,
          customer:customers(id, company_name, contact_name),
          assigned_user:users(id, name),
          comments:ticket_comments(*),
          attachments:ticket_attachments(*)
        `)
        .eq('tenant_id', this.getTenantId());

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }
      if (filters?.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      this.logger.info(`✅ Fetched ${data?.length || 0} tickets`);
      return data || [];
    } catch (error) {
      this.logger.error('Failed to fetch tickets', error);
      throw error;
    }
  }

  async getTicket(id: string): Promise<Record<string, unknown>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(`
          *,
          customer:customers(*),
          assigned_user:users(*),
          comments:ticket_comments(
            *,
            author:users(*)
          ),
          attachments:ticket_attachments(*)
        `)
        .eq('id', id)
        .eq('tenant_id', this.getTenantId())
        .single();

      if (error) throw error;
      this.logger.info(`✅ Fetched ticket ${id}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to fetch ticket ${id}`, error);
      throw error;
    }
  }

  async createTicket(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const payload = {
        title: data.title,
        description: data.description,
        priority: data.priority || 'medium',
        status: data.status || 'open',
        category: data.category || 'general',
        customer_id: data.customerId,
        assigned_to: data.assignedTo,
        due_date: data.dueDate,
        tenant_id: this.getTenantId(),
        created_by: this.getCurrentUserId(),
        created_at: new Date().toISOString(),
      };

      const { data: newTicket, error } = await this.supabase
        .from(this.tableName)
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      this.logger.info(`✅ Created ticket: ${newTicket.id}`);
      return newTicket;
    } catch (error) {
      this.logger.error('Failed to create ticket', error);
      throw error;
    }
  }

  async updateTicket(id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const payload: Record<string, unknown> = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        category: data.category,
        assigned_to: data.assignedTo,
        due_date: data.dueDate,
        resolved_at: data.status === 'resolved' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      const { data: updatedTicket, error } = await this.supabase
        .from(this.tableName)
        .update(payload)
        .eq('id', id)
        .eq('tenant_id', this.getTenantId())
        .select()
        .single();

      if (error) throw error;
      this.logger.info(`✅ Updated ticket ${id}`);
      return updatedTicket;
    } catch (error) {
      this.logger.error(`Failed to update ticket ${id}`, error);
      throw error;
    }
  }

  async deleteTicket(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .eq('tenant_id', this.getTenantId());

      if (error) throw error;
      this.logger.info(`✅ Deleted ticket ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete ticket ${id}`, error);
      throw error;
    }
  }

  async getTicketCategories(): Promise<Record<string, unknown>[]> {
    try {
      const categories = [
        { id: 'general', name: 'General' },
        { id: 'bug', name: 'Bug Report' },
        { id: 'feature', name: 'Feature Request' },
        { id: 'support', name: 'Support' },
        { id: 'billing', name: 'Billing' },
        { id: 'other', name: 'Other' },
      ];
      return categories;
    } catch (error) {
      this.logger.error('Failed to fetch ticket categories', error);
      return [];
    }
  }

  async getTicketPriorities(): Promise<Record<string, unknown>[]> {
    try {
      const priorities = [
        { id: 'low', name: 'Low', order: 1 },
        { id: 'medium', name: 'Medium', order: 2 },
        { id: 'high', name: 'High', order: 3 },
        { id: 'urgent', name: 'Urgent', order: 4 },
      ];
      return priorities;
    } catch (error) {
      this.logger.error('Failed to fetch ticket priorities', error);
      return [];
    }
  }

  /**
   * Add comment to ticket
   */
  async addComment(ticketId: string, content: string): Promise<Record<string, unknown>> {
    try {
      const { data, error } = await this.supabase
        .from('ticket_comments')
        .insert([{
          ticket_id: ticketId,
          content,
          author_id: this.getCurrentUserId(),
          tenant_id: this.getTenantId(),
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      this.logger.info(`✅ Added comment to ticket ${ticketId}`);
      return data;
    } catch (error) {
      this.logger.error('Failed to add comment', error);
      throw error;
    }
  }

  /**
   * Attach file to ticket
   */
  async attachFile(
    ticketId: string,
    file: File
  ): Promise<Record<string, unknown>> {
    try {
      const fileName = `tickets/${ticketId}/${Date.now()}-${file.name}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await this.supabase.storage
        .from('ticket-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { data: attachment, error: dbError } = await this.supabase
        .from('ticket_attachments')
        .insert([{
          ticket_id: ticketId,
          filename: file.name,
          size: file.size,
          url: `${data.path}`,
          tenant_id: this.getTenantId(),
          created_by: this.getCurrentUserId(),
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (dbError) throw dbError;
      this.logger.info(`✅ Attached file to ticket ${ticketId}`);
      return attachment;
    } catch (error) {
      this.logger.error('Failed to attach file', error);
      throw error;
    }
  }

  /**
   * Get ticket SLA status
   */
  async getTicketSLA(ticketId: string): Promise<Record<string, unknown>> {
    try {
      const ticket = await this.getTicket(ticketId);
      const now = new Date();
      const createdAt = new Date(ticket.created_at as string);
      const resolutionTime = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60); // hours

      // SLA based on priority
      const slaHours = {
        urgent: 1,
        high: 4,
        medium: 8,
        low: 24,
      }[(ticket.priority as string) || 'medium'] || 8;

      const isBreach = resolutionTime > slaHours;

      return {
        ticketId,
        slaHours,
        resolutionTime: resolutionTime.toFixed(2),
        isBreach,
        remaining: Math.max(0, slaHours - resolutionTime).toFixed(2),
      };
    } catch (error) {
      this.logger.error('Failed to get SLA status', error);
      throw error;
    }
  }
}
```

**✅ Checklist:**
- [ ] File created at `src/services/supabase/ticketService.ts`
- [ ] Real-time support implemented
- [ ] Comments and attachments added
- [ ] SLA tracking implemented

---

## TEMPLATE 4: Supabase File Service

**File: `src/services/supabase/fileService.ts`**

```typescript
/**
 * Supabase File Service
 * Handles file uploads, downloads, and storage using Supabase Storage
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { IFileService } from '../api/apiServiceFactory';
import { BaseSupabaseService } from './baseSupabaseService';

export class SupabaseFileService extends BaseSupabaseService implements IFileService {
  private storageBucket = 'crm-files';
  private maxFileSize = 10 * 1024 * 1024; // 10MB

  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  /**
   * Upload file to Supabase Storage
   */
  async uploadFile(
    file: File,
    options?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    try {
      // Validate file
      if (file.size > this.maxFileSize) {
        throw new Error(`File size exceeds maximum limit of ${this.maxFileSize / 1024 / 1024}MB`);
      }

      const allowedTypes = options?.allowedTypes as string[] || [
        'application/pdf',
        'application/msword',
        'text/plain',
        'image/jpeg',
        'image/png',
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} not allowed`);
      }

      // Generate unique file path
      const fileName = `${this.getTenantId()}/${Date.now()}-${file.name}`;

      // Upload to storage
      const { data, error } = await this.supabase.storage
        .from(this.storageBucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.storageBucket)
        .getPublicUrl(data.path);

      // Store metadata in database
      const { data: metadata, error: metaError } = await this.supabase
        .from('file_metadata')
        .insert([{
          file_path: data.path,
          original_filename: file.name,
          file_size: file.size,
          file_type: file.type,
          public_url: urlData.publicUrl,
          tenant_id: this.getTenantId(),
          uploaded_by: this.getCurrentUserId(),
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (metaError) throw metaError;

      this.logger.info(`✅ Uploaded file: ${file.name}`);

      return {
        id: metadata.id,
        filename: file.name,
        size: file.size,
        url: urlData.publicUrl,
        path: data.path,
        uploadedAt: metadata.created_at,
      };
    } catch (error) {
      this.logger.error('Failed to upload file', error);
      throw error;
    }
  }

  /**
   * Download file
   */
  async downloadFile(fileId: string): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('file_metadata')
        .select('file_path, original_filename')
        .eq('id', fileId)
        .eq('tenant_id', this.getTenantId())
        .single();

      if (error) throw error;

      // Download from storage
      const { data: fileData, error: downloadError } = await this.supabase.storage
        .from(this.storageBucket)
        .download(data.file_path);

      if (downloadError) throw downloadError;

      // Trigger download
      const url = URL.createObjectURL(fileData);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.original_filename;
      link.click();
      URL.revokeObjectURL(url);

      this.logger.info(`✅ Downloaded file: ${fileId}`);
    } catch (error) {
      this.logger.error('Failed to download file', error);
      throw error;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      // Get file path
      const { data, error: getError } = await this.supabase
        .from('file_metadata')
        .select('file_path')
        .eq('id', fileId)
        .eq('tenant_id', this.getTenantId())
        .single();

      if (getError) throw getError;

      // Delete from storage
      const { error: deleteError } = await this.supabase.storage
        .from(this.storageBucket)
        .remove([data.file_path]);

      if (deleteError) throw deleteError;

      // Delete from database
      const { error: dbError } = await this.supabase
        .from('file_metadata')
        .delete()
        .eq('id', fileId)
        .eq('tenant_id', this.getTenantId());

      if (dbError) throw dbError;

      this.logger.info(`✅ Deleted file: ${fileId}`);
    } catch (error) {
      this.logger.error('Failed to delete file', error);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<Record<string, unknown>> {
    try {
      const { data, error } = await this.supabase
        .from('file_metadata')
        .select('*')
        .eq('id', fileId)
        .eq('tenant_id', this.getTenantId())
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error('Failed to get file metadata', error);
      throw error;
    }
  }

  /**
   * Get user files
   */
  async getUserFiles(): Promise<Record<string, unknown>[]> {
    try {
      const { data, error } = await this.supabase
        .from('file_metadata')
        .select('*')
        .eq('tenant_id', this.getTenantId())
        .eq('uploaded_by', this.getCurrentUserId())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.logger.error('Failed to get user files', error);
      return [];
    }
  }

  /**
   * Get tenant files
   */
  async getTenantFiles(): Promise<Record<string, unknown>[]> {
    try {
      const { data, error } = await this.supabase
        .from('file_metadata')
        .select('*')
        .eq('tenant_id', this.getTenantId())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.logger.error('Failed to get tenant files', error);
      return [];
    }
  }
}
```

**✅ Checklist:**
- [ ] File created at `src/services/supabase/fileService.ts`
- [ ] Upload/download/delete implemented
- [ ] Storage integration complete
- [ ] Metadata tracking added

---

## TEMPLATE 5: Factory Pattern Update

**File: `src/services/api/apiServiceFactory.ts`** (Update this section)

Replace your existing `getCustomerService()` method with this template:

```typescript
/**
 * MULTI-BACKEND FACTORY PATTERN
 * Updated to support Mock, Real API, and Supabase
 */

import { backendConfig, getServiceBackend, isSupabaseConfigured } from '@/config/backendConfig';
import { getSupabaseClient } from '../supabase/client';
import { SupabaseCustomerService } from '../supabase/customerService';
import { SupabaseSalesService } from '../supabase/salesService';
import { SupabaseTicketService } from '../supabase/ticketService';
import { SupabaseFileService } from '../supabase/fileService';
// Add other Supabase services as created

class ApiServiceFactory {
  private static instance: ApiServiceFactory;
  private useMockApi: boolean;
  private supabaseClient: any = null;

  // Track which backend each service is using
  private serviceBackends: Map<string, string> = new Map();

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
    this.setupEnvironmentListener();
    this.logConfiguration();
  }

  public static getInstance(): ApiServiceFactory {
    if (!ApiServiceFactory.instance) {
      ApiServiceFactory.instance = new ApiServiceFactory();
    }
    return ApiServiceFactory.instance;
  }

  /**
   * Get Customer Service with 3-backend support
   */
  public getCustomerService(): ICustomerService {
    const serviceKey = 'customer';
    const cacheKey = `${serviceKey}_${backendConfig.mode}`;

    if (this.customerServiceInstance && this.serviceBackends.get(serviceKey) === backendConfig.mode) {
      return this.customerServiceInstance;
    }

    const backend = getServiceBackend(serviceKey as any);

    try {
      if (backend === 'supabase' && isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        this.customerServiceInstance = new SupabaseCustomerService(supabase) as any;
        console.log('✅ Using Supabase Customer Service');
      } else if (backend === 'real') {
        this.customerServiceInstance = new RealCustomerService();
        console.log('✅ Using Real Customer Service');
      } else {
        this.customerServiceInstance = mockCustomerService as ICustomerService;
        console.log('✅ Using Mock Customer Service');
      }

      this.serviceBackends.set(serviceKey, backend);
    } catch (error) {
      console.error(`Failed to initialize ${backend} customer service:`, error);
      this.customerServiceInstance = mockCustomerService as ICustomerService;
      console.log('⚠️ Falling back to Mock Customer Service');
    }

    return this.customerServiceInstance;
  }

  /**
   * Get Sales Service with 3-backend support
   */
  public getSalesService(): ISalesService {
    const serviceKey = 'sales';

    if (this.salesServiceInstance && this.serviceBackends.get(serviceKey) === backendConfig.mode) {
      return this.salesServiceInstance;
    }

    const backend = getServiceBackend(serviceKey as any);

    try {
      if (backend === 'supabase' && isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        this.salesServiceInstance = new SupabaseSalesService(supabase) as any;
        console.log('✅ Using Supabase Sales Service');
      } else if (backend === 'real') {
        this.salesServiceInstance = new RealSalesService();
        console.log('✅ Using Real Sales Service');
      } else {
        this.salesServiceInstance = mockSalesService as ISalesService;
        console.log('✅ Using Mock Sales Service');
      }

      this.serviceBackends.set(serviceKey, backend);
    } catch (error) {
      console.error(`Failed to initialize ${backend} sales service:`, error);
      this.salesServiceInstance = mockSalesService as ISalesService;
    }

    return this.salesServiceInstance;
  }

  /**
   * Get Ticket Service with 3-backend support
   */
  public getTicketService(): ITicketService {
    const serviceKey = 'ticket';

    if (this.ticketServiceInstance && this.serviceBackends.get(serviceKey) === backendConfig.mode) {
      return this.ticketServiceInstance;
    }

    const backend = getServiceBackend(serviceKey as any);

    try {
      if (backend === 'supabase' && isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        this.ticketServiceInstance = new SupabaseTicketService(supabase) as any;
        console.log('✅ Using Supabase Ticket Service');
      } else if (backend === 'real') {
        this.ticketServiceInstance = new RealTicketService();
        console.log('✅ Using Real Ticket Service');
      } else {
        this.ticketServiceInstance = mockTicketService as ITicketService;
        console.log('✅ Using Mock Ticket Service');
      }

      this.serviceBackends.set(serviceKey, backend);
    } catch (error) {
      console.error(`Failed to initialize ${backend} ticket service:`, error);
      this.ticketServiceInstance = mockTicketService as ITicketService;
    }

    return this.ticketServiceInstance;
  }

  /**
   * Get File Service with 3-backend support
   */
  public getFileService(): IFileService {
    const serviceKey = 'file';

    if (this.fileServiceInstance && this.serviceBackends.get(serviceKey) === backendConfig.mode) {
      return this.fileServiceInstance;
    }

    const backend = getServiceBackend(serviceKey as any);

    try {
      if (backend === 'supabase' && isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        this.fileServiceInstance = new SupabaseFileService(supabase) as any;
        console.log('✅ Using Supabase File Service');
      } else if (backend === 'real') {
        this.fileServiceInstance = new RealFileService();
        console.log('✅ Using Real File Service');
      } else {
        this.fileServiceInstance = mockFileService as IFileService;
        console.log('✅ Using Mock File Service');
      }

      this.serviceBackends.set(serviceKey, backend);
    } catch (error) {
      console.error(`Failed to initialize ${backend} file service:`, error);
      this.fileServiceInstance = mockFileService as IFileService;
    }

    return this.fileServiceInstance;
  }

  /**
   * Log configuration on startup
   */
  private logConfiguration(): void {
    if (backendConfig.monitoring?.debugFactory) {
      console.group('🔧 Service Factory Configuration');
      console.log('API Mode:', backendConfig.mode);
      console.log('Feature Flags:', backendConfig.featureFlags);
      console.log('Supabase Enabled:', isSupabaseConfigured());
      console.groupEnd();
    }
  }

  /**
   * Setup environment listener
   */
  private setupEnvironmentListener(): void {
    const originalEnv = import.meta.env.VITE_API_MODE;

    setInterval(() => {
      const currentEnv = import.meta.env.VITE_API_MODE;
      if (currentEnv !== originalEnv) {
        this.switchApiMode(currentEnv === 'true');
      }
    }, 1000);
  }

  /**
   * Switch API mode
   */
  public switchApiMode(useMock: boolean): void {
    if (this.useMockApi !== useMock) {
      this.useMockApi = useMock;
      this.clearServiceInstances();
      console.log(`🔄 Switched to ${useMock ? 'Mock' : 'Real'} API mode`);
    }
  }

  /**
   * Clear all service instances
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
    this.serviceBackends.clear();
  }

  /**
   * Get current API mode
   */
  public isUsingMockApi(): boolean {
    return this.useMockApi;
  }

  /**
   * Get service backend information
   */
  public getServiceBackends(): Map<string, string> {
    return this.serviceBackends;
  }
}

export const apiServiceFactory = ApiServiceFactory.getInstance();
```

**✅ Checklist:**
- [ ] Factory pattern updated
- [ ] All service methods updated
- [ ] Supabase support added
- [ ] Fallback logic implemented
- [ ] Service tracking added

---

## FINAL INTEGRATION CHECKLIST

### ✅ Complete Implementation Steps:

1. **Environment Setup** (30 minutes)
   - [ ] Create Supabase project
   - [ ] Copy credentials to `.env`
   - [ ] Install dependencies
   - [ ] Run: `npm install @supabase/supabase-js`

2. **Configuration** (20 minutes)
   - [ ] Create `src/config/backendConfig.ts`
   - [ ] Update `.env.example`
   - [ ] Create `.env` with credentials

3. **Core Services** (2 hours)
   - [ ] Create `src/services/supabase/client.ts`
   - [ ] Create `src/services/supabase/baseSupabaseService.ts`
   - [ ] Create `src/services/supabase/authService.ts`
   - [ ] Create `src/services/supabase/customerService.ts`
   - [ ] Create `src/services/supabase/salesService.ts`
   - [ ] Create `src/services/supabase/ticketService.ts`
   - [ ] Create `src/services/supabase/fileService.ts`

4. **Factory Pattern** (45 minutes)
   - [ ] Update `src/services/api/apiServiceFactory.ts`
   - [ ] Add Supabase imports
   - [ ] Update service getter methods
   - [ ] Add fallback logic

5. **Testing** (1 hour)
   - [ ] Create test file
   - [ ] Test all three backends
   - [ ] Test switching
   - [ ] Verify data flow

6. **Documentation** (30 minutes)
   - [ ] Document configuration
   - [ ] Create troubleshooting guide
   - [ ] Train team

**Total Time: ~6 hours**

---

## 🎯 QUICK VALIDATION COMMANDS

```bash
# 1. Verify environment
echo $VITE_API_MODE
echo $VITE_SUPABASE_URL

# 2. Test connection (in browser console)
import { checkSupabaseConnection } from '@/services/supabase/client'
await checkSupabaseConnection()

# 3. Run diagnostics
import { printDiagnostics } from '@/services/api/factoryDiagnostics'
printDiagnostics()

# 4. Test services
const { customerService } = await import('@/services')
await customerService.getCustomers()

# 5. Switch backends (reload page after changing .env)
# Change VITE_API_MODE=mock|real|supabase
```

---

**🚀 Ready to implement! Good luck!**
