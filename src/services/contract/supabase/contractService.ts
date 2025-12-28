/**
 * Supabase Contract Service
 * Handles contract management, templates, versions, approvals
 * Extends BaseSupabaseService for common database operations
 */

import { supabase, getSupabaseClient } from '@/services/supabase/client';
import { authService } from '../../serviceFactory';

// Simple base service implementation since the import is missing
class BaseSupabaseService {
  constructor(private tableName: string, private useTenant: boolean) {}

  log(message: string, data?: any) {
    console.log(`[${this.constructor.name}] ${message}`, data);
  }

  logError(message: string, error: any) {
    console.error(`[${this.constructor.name}] ${message}`, error);
  }

  subscribeToChanges(options: any, callback: any) {
    // Stub implementation
    return () => {};
  }
}
import { Contract } from '@/types/contracts';

export interface ContractFilters {
  status?: string;
  type?: string;
  customer_id?: string;
  assigned_to?: string;
  priority?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  expiring_soon?: boolean;
  auto_renew?: boolean;
  tags?: string[];
  compliance_status?: string;
  value_min?: number;
  value_max?: number;
}

export class SupabaseContractService extends BaseSupabaseService {
  constructor() {
    super('contracts', true);
  }

  /**
    * Get all contracts with optional filtering and pagination
    * Returns paginated response with data array
    * ⭐ SECURITY: Enforces tenant isolation - only returns contracts from current user's tenant
    */
   async getContracts(filters?: ContractFilters & { page?: number; pageSize?: number }): Promise<any> {
     try {
       this.log('Fetching contracts', filters);

       // ⭐ SECURITY: Get current tenant for isolation
       const currentUser = authService.getCurrentUser();
       const currentTenantId = authService.getCurrentTenantId();

       if (!currentTenantId && currentUser?.role !== 'super_admin') {
         throw new Error('Access denied: No tenant context');
       }

       const page = filters?.page || 1;
       const pageSize = filters?.pageSize || 20;
       const offset = (page - 1) * pageSize;

       let query = getSupabaseClient()
         .from('contracts')
         .select(
           `*,
           customer:customers(*),
           template:contract_templates(*),
           parties:contract_parties(*),
           approval_history:contract_approval_records(*),
           attachments:contract_attachments(*)`
         );

       // ⭐ SECURITY: Apply tenant isolation - non-super-admins only see their tenant's contracts
       if (currentUser?.role !== 'super_admin') {
         query = query.eq('tenant_id', currentTenantId);
       }
       // Super admins can see all contracts (no tenant filter)

       // Apply filters
       if (filters?.status) {
         query = query.eq('status', filters.status);
       }
       if (filters?.type) {
         query = query.eq('type', filters.type);
       }
       if (filters?.customer_id) {
         query = query.eq('customer_id', filters.customer_id);
       }
       if (filters?.assigned_to) {
         query = query.eq('assigned_to', filters.assigned_to);
       }
       if (filters?.priority) {
         query = query.eq('priority', filters.priority);
       }
       if (filters?.compliance_status) {
         query = query.eq('compliance_status', filters.compliance_status);
       }
       if (filters?.auto_renew !== undefined) {
         query = query.eq('auto_renew', filters.auto_renew);
       }
       if (filters?.tags && filters.tags.length > 0) {
         query = query.contains('tags', filters.tags);
       }

       // Date range filters
       if (filters?.date_from) {
         query = query.gte('start_date', filters.date_from);
       }
       if (filters?.date_to) {
         query = query.lte('end_date', filters.date_to);
       }

       // Value range filters
       if (filters?.value_min !== undefined) {
         query = query.gte('value', filters.value_min);
       }
       if (filters?.value_max !== undefined) {
         query = query.lte('value', filters.value_max);
       }

       // Exclude deleted records
       query = query.is('deleted_at', null);

       // Get total count first for pagination
       const { count } = await query;

       // Apply ordering and pagination
       const { data, error } = await query
         .order('created_at', { ascending: false })
         .range(offset, offset + pageSize - 1);

       if (error) throw error;

       // Post-process for expiring_soon filter (30-day window)
       let results = data?.map((c) => this.mapContractResponse(c)) || [];
       if (filters?.expiring_soon) {
         const now = new Date();
         const threshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
         results = results.filter((c) => {
           if (!c.end_date) return false;
           const endDate = new Date(c.end_date);
           return endDate <= threshold && endDate >= now;
         });
       }

       // Search filter (full-text search)
       if (filters?.search) {
         const searchLower = filters.search.toLowerCase();
         results = results.filter((c) =>
           c.title.toLowerCase().includes(searchLower) ||
           c.description?.toLowerCase().includes(searchLower) ||
           c.contract_number?.toLowerCase().includes(searchLower)
         );
       }

       const total = count || 0;
       const totalPages = Math.ceil(total / pageSize);

       this.log('Contracts fetched', { count: results?.length, total, page, pageSize });

       // Return paginated response matching PaginatedResponse<Contract> interface
       return {
         data: results,
         page,
         pageSize,
         total,
         totalPages,
       };
     } catch (error) {
       this.logError('Error fetching contracts', error);
       throw error;
     }
   }

  /**
    * Get contract by ID
    * ⭐ SECURITY: Enforces tenant isolation - can only access contracts from own tenant
    */
   async getContract(id: string): Promise<Contract | null> {
     try {
       this.log('Fetching contract', { id });

       // ⭐ SECURITY: Get current tenant for isolation
       const currentUser = authService.getCurrentUser();
       const currentTenantId = authService.getCurrentTenantId();

       if (!currentTenantId && currentUser?.role !== 'super_admin') {
         throw new Error('Access denied: No tenant context');
       }

       let query = getSupabaseClient()
         .from('contracts')
         .select(
           `*,
           customer:customers(*),
           template:contract_templates(*),
           parties:contract_parties(*),
           approvals:contract_approval_records(*)`
         )
         .eq('id', id);

       // ⭐ SECURITY: Apply tenant isolation - non-super-admins only see their tenant's contracts
       if (currentUser?.role !== 'super_admin') {
         query = query.eq('tenant_id', currentTenantId);
       }
       // Super admins can access any contract (no tenant filter)

       const { data, error } = await query.single();

       if (error && error.code !== 'PGRST116') throw error;

       return data ? this.mapContractResponse(data) : null;
     } catch (error) {
       this.logError('Error fetching contract', error);
       throw error;
     }
   }

  /**
    * Create new contract
    * ⭐ SECURITY: Enforces tenant isolation - contracts are created in current user's tenant
    */
   async createContract(data: Partial<Contract>): Promise<Contract> {
     try {
       this.log('Creating contract', { customer_id: data.customer_id });

       // ⭐ SECURITY: Get current tenant and validate access
       const currentUser = authService.getCurrentUser();
       const currentTenantId = authService.getCurrentTenantId();

       if (!currentTenantId && currentUser?.role !== 'super_admin') {
         throw new Error('Access denied: No tenant context');
       }

       // ⭐ SECURITY: For super admins, use provided tenant_id or default to their current context
       // For regular users, force their tenant_id
       const assignedTenantId = currentUser?.role === 'super_admin'
         ? (data.tenant_id || currentTenantId)
         : currentTenantId;

       // ⭐ SECURITY: Validate tenant access if assigning to specific tenant
       if (assignedTenantId) {
         authService.assertTenantAccess(assignedTenantId);
       }

       const { data: created, error } = await getSupabaseClient()
         .from('contracts')
         .insert([
           {
             contract_number: data.contract_number,
             title: data.title,
             description: data.description,
             customer_id: data.customer_id,
             // ❌ REMOVED: deal_id - NOT a column in contracts table
             type: data.type || 'service_agreement',
             status: data.status || 'draft',
             start_date: data.start_date,
             end_date: data.end_date,
             signed_date: data.signed_date,
             next_renewal_date: data.next_renewal_date,
             auto_renew: data.auto_renew ?? false,
             renewal_period_months: data.renewal_period_months,
             renewal_terms: data.renewal_terms,
             terms: data.terms,
             value: data.value || 0,
             total_value: data.value || 0, // ✅ Added: total_value exists in DB
             currency: data.currency || 'USD',
             payment_terms: data.payment_terms,
             delivery_terms: data.delivery_terms,
             template_id: data.template_id,
             content: data.content,
             document_path: data.document_path,
             document_url: data.document_url,
             version: data.version || 1,
             approval_stage: data.approval_stage,
             compliance_status: data.compliance_status || 'pending_review',
             created_by: data.created_by,
             assigned_to: data.assigned_to,
             tags: data.tags || [],
             priority: data.priority || 'medium',
             reminder_days: data.reminder_days || [],
             next_reminder_date: data.next_reminder_date,
             notes: data.notes,
             signed_by_customer: data.signed_by_customer,
             signed_by_company: data.signed_by_company,
             tenant_id: assignedTenantId, // ⭐ SECURITY: Use validated tenant_id
             created_at: new Date().toISOString(),
             updated_at: new Date().toISOString(),
           },
         ])
         .select(
           `*,
           customer:customers(*),
           template:contract_templates(*),
           parties:contract_parties(*),
           approval_history:contract_approval_records(*),
           attachments:contract_attachments(*)`
         )
         .single();

       if (error) throw error;

       this.log('Contract created successfully', { id: created.id });
       return this.mapContractResponse(created);
     } catch (error) {
       this.logError('Error creating contract', error);
       throw error;
     }
   }

  /**
    * Update contract
    * ⭐ SECURITY: Enforces tenant isolation - can only update contracts from own tenant
    */
   async updateContract(id: string, updates: Partial<Contract>): Promise<Contract> {
     try {
       this.log('Updating contract', { id });

       // ⭐ SECURITY: Get current tenant and validate access to the contract
       const currentUser = authService.getCurrentUser();
       const currentTenantId = authService.getCurrentTenantId();

       if (!currentTenantId && currentUser?.role !== 'super_admin') {
         throw new Error('Access denied: No tenant context');
       }

       // ⭐ SECURITY: First verify the contract exists and belongs to accessible tenant
       let verifyQuery = getSupabaseClient()
         .from('contracts')
         .select('tenant_id')
         .eq('id', id)
         .is('deleted_at', null);

       // Apply tenant filter for non-super-admins
       if (currentUser?.role !== 'super_admin') {
         verifyQuery = verifyQuery.eq('tenant_id', currentTenantId);
       }

       const { data: existingContract, error: verifyError } = await verifyQuery.single();

       if (verifyError || !existingContract) {
         throw new Error('Contract not found or access denied');
       }

       // ⭐ SECURITY: Validate tenant access
       authService.assertTenantAccess(existingContract.tenant_id);

       let updateQuery = getSupabaseClient()
         .from('contracts')
         .update({
           title: updates.title,
           description: updates.description,
           // ❌ REMOVED: deal_id - NOT a column in contracts table
           type: updates.type,
           status: updates.status,
           start_date: updates.start_date,
           end_date: updates.end_date,
           signed_date: updates.signed_date,
           next_renewal_date: updates.next_renewal_date,
           auto_renew: updates.auto_renew,
           renewal_period_months: updates.renewal_period_months,
           renewal_terms: updates.renewal_terms,
           terms: updates.terms,
           value: updates.value,
           total_value: updates.value, // ✅ Added: total_value exists in DB
           currency: updates.currency,
           payment_terms: updates.payment_terms,
           delivery_terms: updates.delivery_terms,
           content: updates.content,
           document_path: updates.document_path,
           document_url: updates.document_url,
           version: updates.version,
           approval_stage: updates.approval_stage,
           compliance_status: updates.compliance_status,
           assigned_to: updates.assigned_to,
           tags: updates.tags,
           priority: updates.priority,
           reminder_days: updates.reminder_days,
           next_reminder_date: updates.next_reminder_date,
           notes: updates.notes,
           signed_by_customer: updates.signed_by_customer,
           signed_by_company: updates.signed_by_company,
           updated_at: new Date().toISOString(),
         })
         .eq('id', id);

       // Apply tenant filter for non-super-admins
       if (currentUser?.role !== 'super_admin') {
         updateQuery = updateQuery.eq('tenant_id', currentTenantId);
       }

       const { data, error } = await updateQuery
         .select(
           `*,
           customer:customers(*),
           template:contract_templates(*),
           parties:contract_parties(*),
           approval_history:contract_approval_records(*),
           attachments:contract_attachments(*)`
         )
         .single();

       if (error) throw error;

       this.log('Contract updated successfully', { id });
       return this.mapContractResponse(data);
     } catch (error) {
       this.logError('Error updating contract', error);
       throw error;
     }
   }

  /**
    * Delete contract (soft delete)
    * ⭐ SECURITY: Enforces tenant isolation - can only delete contracts from own tenant
    */
   async deleteContract(id: string): Promise<void> {
     try {
       this.log('Deleting contract', { id });

       // ⭐ SECURITY: Get current tenant and validate access to the contract
       const currentUser = authService.getCurrentUser();
       const currentTenantId = authService.getCurrentTenantId();

       if (!currentTenantId && currentUser?.role !== 'super_admin') {
         throw new Error('Access denied: No tenant context');
       }

       // ⭐ SECURITY: First verify the contract exists and belongs to accessible tenant
       let verifyQuery = getSupabaseClient()
         .from('contracts')
         .select('tenant_id')
         .eq('id', id)
         .is('deleted_at', null);

       // Apply tenant filter for non-super-admins
       if (currentUser?.role !== 'super_admin') {
         verifyQuery = verifyQuery.eq('tenant_id', currentTenantId);
       }

       const { data: existingContract, error: verifyError } = await verifyQuery.single();

       if (verifyError || !existingContract) {
         throw new Error('Contract not found or access denied');
       }

       // ⭐ SECURITY: Validate tenant access
       authService.assertTenantAccess(existingContract.tenant_id);

       let deleteQuery = getSupabaseClient()
         .from('contracts')
         .update({ deleted_at: new Date().toISOString() })
         .eq('id', id);

       // Apply tenant filter for non-super-admins
       if (currentUser?.role !== 'super_admin') {
         deleteQuery = deleteQuery.eq('tenant_id', currentTenantId);
       }

       const { error } = await deleteQuery;

       if (error) throw error;

       this.log('Contract deleted successfully', { id });
     } catch (error) {
       this.logError('Error deleting contract', error);
       throw error;
     }
   }

  /**
   * Get contracts by customer ID
   */
  async getContractsByCustomer(customerId: string, filters?: ContractFilters): Promise<any> {
    try {
      this.log('Fetching contracts by customer', { customerId, filters });

      const customerFilters: ContractFilters = {
        ...filters,
        customer_id: customerId,
      };

      return await this.getContracts(customerFilters);
    } catch (error) {
      this.logError('Error fetching contracts by customer', error);
      throw error;
    }
  }

  /**
   * Update contract status
   */
  async updateContractStatus(id: string, status: string): Promise<Contract> {
    try {
      this.log('Updating contract status', { id, status });

      const { data, error } = await getSupabaseClient()
        .from('contracts')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(
          `*,
          customer:customers(*),
          template:contract_templates(*),
          parties:contract_parties(*),
          approval_history:contract_approval_records(*),
          attachments:contract_attachments(*)`
        )
        .single();

      if (error) throw error;

      this.log('Contract status updated successfully', { id, status });
      return this.mapContractResponse(data);
    } catch (error) {
      this.logError('Error updating contract status', error);
      throw error;
    }
  }

  /**
   * Get contracts expiring soon
   */
  async getExpiringContracts(filters?: ContractFilters, daysThreshold: number = 30): Promise<Contract[]> {
    try {
      this.log('Fetching expiring contracts', { filters, daysThreshold });

      const now = new Date();
      const threshold = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

      // Use expiring_soon filter
      const expiringFilters: ContractFilters = {
        ...filters,
        expiring_soon: true,
      };

      const contracts = await this.getContracts(expiringFilters);

      return contracts;
    } catch (error) {
      this.logError('Error fetching expiring contracts', error);
      throw error;
    }
  }

  /**
   * Request contract approval
   */
  async requestApproval(
    contractId: string,
    approverId: string,
    comments?: string
  ): Promise<any> {
    try {
      this.log('Requesting contract approval', { contractId, approverId });

      const { data, error } = await getSupabaseClient()
        .from('contract_approvals')
        .insert([
          {
            contract_id: contractId,
            approver_id: approverId,
            status: 'pending',
            comments,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      this.log('Approval requested successfully');
      return data;
    } catch (error) {
      this.logError('Error requesting approval', error);
      throw error;
    }
  }

  /**
   * Approve contract
   */
  async approveContract(
    approvalId: string,
    comments?: string
  ): Promise<any> {
    try {
      this.log('Approving contract', { approvalId });

      const { data, error } = await getSupabaseClient()
        .from('contract_approvals')
        .update({
          status: 'approved',
          comments,
          approved_at: new Date().toISOString(),
        })
        .eq('id', approvalId)
        .select()
        .single();

      if (error) throw error;

      this.log('Contract approved successfully');
      return data;
    } catch (error) {
      this.logError('Error approving contract', error);
      throw error;
    }
  }

  /**
   * Reject contract
   */
  async rejectContract(
    approvalId: string,
    comments?: string
  ): Promise<any> {
    try {
      this.log('Rejecting contract', { approvalId });

      const { data, error } = await getSupabaseClient()
        .from('contract_approvals')
        .update({
          status: 'rejected',
          comments,
          rejected_at: new Date().toISOString(),
        })
        .eq('id', approvalId)
        .select()
        .single();

      if (error) throw error;

      this.log('Contract rejected successfully');
      return data;
    } catch (error) {
      this.logError('Error rejecting contract', error);
      throw error;
    }
  }

  /**
   * Get contract statistics
   */
  async getContractStats(filters?: ContractFilters): Promise<{
    total: number;
    active: number;
    expiring: number;
    totalValue: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  }> {
    try {
      this.log('Fetching contract statistics', { filters });

      const contractsResponse = await this.getContracts(filters);
      const contracts = contractsResponse.data || [];
      const expiringContracts = await this.getExpiringContracts(filters);

      const stats = {
        total: contracts.length,
        active: contracts.filter((c) => c.status === 'active').length,
        expiring: expiringContracts.length,
        totalValue: contracts.reduce((sum, c) => sum + (c.value || 0), 0),
        byStatus: {} as Record<string, number>,
        byType: {} as Record<string, number>,
      };

      contracts.forEach((c) => {
        stats.byStatus[c.status] = (stats.byStatus[c.status] || 0) + 1;
        stats.byType[c.type] = (stats.byType[c.type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      this.logError('Error fetching contract statistics', error);
      throw error;
    }
  }

  /**
   * Bulk update contracts
   */
  async bulkUpdateContracts(ids: string[], updates: Partial<Contract>): Promise<Contract[]> {
    try {
      this.log('Bulk updating contracts', { ids, updates });

      const { data, error } = await getSupabaseClient()
        .from('contracts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .in('id', ids)
        .select(
          `*,
          customer:customers(*),
          template:contract_templates(*),
          parties:contract_parties(*),
          approval_history:contract_approval_records(*),
          attachments:contract_attachments(*)`
        );

      if (error) throw error;

      this.log('Contracts bulk updated successfully', { count: data?.length });
      return (data || []).map(d => this.mapContractResponse(d));
    } catch (error) {
      this.logError('Error bulk updating contracts', error);
      throw error;
    }
  }

  /**
   * Bulk delete contracts
   */
  async bulkDeleteContracts(ids: string[]): Promise<void> {
    try {
      this.log('Bulk deleting contracts', { ids });

      const { error } = await getSupabaseClient()
        .from('contracts')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', ids);

      if (error) throw error;

      this.log('Contracts bulk deleted successfully', { count: ids.length });
    } catch (error) {
      this.logError('Error bulk deleting contracts', error);
      throw error;
    }
  }

  /**
   * Export contracts
   */
  async exportContracts(format: 'csv' | 'json' = 'csv'): Promise<string> {
    try {
      this.log('Exporting contracts', { format });

      const contractsResponse = await this.getContracts({ pageSize: 10000 });
      const contracts = contractsResponse.data || [];

      if (format === 'csv') {
        const headers = [
          'ID', 'Contract Number', 'Title', 'Customer ID', 'Type', 'Status',
          'Value', 'Currency', 'Start Date', 'End Date', 'Priority', 'Created At'
        ];
        const rows = contracts.map(c => [
          c.id,
          c.contract_number || '',
          c.title,
          c.customer_id,
          c.type,
          c.status,
          c.value.toString(),
          c.currency,
          c.start_date,
          c.end_date,
          c.priority,
          c.created_at
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return csvContent;
      } else {
        return JSON.stringify(contracts, null, 2);
      }
    } catch (error) {
      this.logError('Error exporting contracts', error);
      throw error;
    }
  }

  /**
   * Subscribe to contract changes
   */
  subscribeToContracts(
    tenantId: string,
    callback: (payload: any) => void
  ): () => void {
    return this.subscribeToChanges(
      {
        event: '*',
        table: 'contracts',
        filter: `tenant_id=eq.${tenantId}`,
      },
      callback
    );
  }

  /**
   * Map database contract response to UI Contract type
   */
  private mapContractResponse(dbContract: any): Contract {
    return {
      id: dbContract.id,
      contract_number: dbContract.contract_number,
      title: dbContract.title,
      description: dbContract.description || '',
      type: (dbContract.type || 'service_agreement') as Contract['type'],
      status: (dbContract.status || 'draft') as Contract['status'],

      // Customer Relationship
      customer_id: dbContract.customer_id,

      // Deal Relationship
      deal_id: dbContract.deal_id,

      // Parties
      parties: (dbContract.parties || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        company: p.company,
        role: p.role,
        is_primary: p.is_primary,
        customer_id: p.customer_id,
        signature_required: p.signature_required,
        signed_at: p.signed_at,
        signature_url: p.signature_url,
        signature_status: p.signature_status,
      })),

      // Financial
      value: dbContract.value || 0,
      currency: dbContract.currency || 'USD',
      payment_terms: dbContract.payment_terms,
      delivery_terms: dbContract.delivery_terms,

      // Dates and Timeline
      start_date: dbContract.start_date,
      end_date: dbContract.end_date,
      signed_date: dbContract.signed_date,
      next_renewal_date: dbContract.next_renewal_date,

      // Renewal and Terms
      auto_renew: dbContract.auto_renew ?? false,
      renewal_period_months: dbContract.renewal_period_months,
      renewal_terms: dbContract.renewal_terms,
      terms: dbContract.terms,

      // Approval and Workflow
      approval_stage: dbContract.approval_stage,
      approval_history: (dbContract.approval_history || []).map((record: any) => ({
        id: record.id,
        stage: record.stage,
        approver: record.approver,
        status: record.status,
        comments: record.comments,
        timestamp: record.timestamp,
      })),
      compliance_status: (dbContract.compliance_status || 'pending_review') as Contract['compliance_status'],

      // Assignment and Management
      created_by: dbContract.created_by || '',
      assigned_to: dbContract.assigned_to,

      // Document Management
      content: dbContract.content || '',
      template_id: dbContract.template_id,
      document_path: dbContract.document_path,
      document_url: dbContract.document_url,
      version: dbContract.version || 1,

      // Organization and Tracking
      tags: dbContract.tags || [],
      priority: (dbContract.priority || 'medium') as Contract['priority'],
      reminder_days: dbContract.reminder_days || [],
      next_reminder_date: dbContract.next_reminder_date,
      notes: dbContract.notes,

      // Signatures and Attachments
      signature_status: {
        total_required: dbContract.signature_status?.total_required || 0,
        completed: dbContract.signature_status?.completed || 0,
        pending: dbContract.signature_status?.pending || [],
        last_signed_at: dbContract.signature_status?.last_signed_at,
      },
      signed_by_customer: dbContract.signed_by_customer,
      signed_by_company: dbContract.signed_by_company,
      attachments: (dbContract.attachments || []).map((att: any) => ({
        id: att.id,
        name: att.name,
        url: att.url,
        type: att.type,
        size: att.size,
        uploaded_at: att.uploaded_at,
        uploaded_by: att.uploaded_by,
      })),

      // System Information
      tenant_id: dbContract.tenant_id,
      created_at: dbContract.created_at,
      updated_at: dbContract.updated_at,
    };
  }
}

// Export singleton instance
export const supabaseContractService = new SupabaseContractService();