/**
 * Supabase Contract Service
 * Handles contract management, templates, versions, approvals
 * Extends BaseSupabaseService for common database operations
 */

import { BaseSupabaseService } from './baseService';
import { getSupabaseClient } from './client';
import { Contract } from '@/types/contracts';

export interface ContractFilters {
  status?: string;
  type?: string;
  tenantId?: string;
  customerId?: string;
  search?: string;
}

export class SupabaseContractService extends BaseSupabaseService {
  constructor() {
    super('contracts', true);
  }

  /**
   * Get all contracts with optional filtering
   */
  async getContracts(filters?: ContractFilters): Promise<Contract[]> {
    try {
      this.log('Fetching contracts', filters);

      let query = getSupabaseClient()
        .from('contracts')
        .select(
          `*,
          customer:customers(*),
          template:contract_templates(*),
          parties:contract_parties(*),
          approvals:contract_approvals(*)`
        );

      // Apply filters
      if (filters?.tenantId) {
        query = query.eq('tenant_id', filters.tenantId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }

      // Exclude deleted records
      query = query.is('deleted_at', null);

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) throw error;

      this.log('Contracts fetched', { count: data?.length });
      return data?.map((c) => this.mapContractResponse(c)) || [];
    } catch (error) {
      this.logError('Error fetching contracts', error);
      throw error;
    }
  }

  /**
   * Get contract by ID
   */
  async getContract(id: string): Promise<Contract | null> {
    try {
      this.log('Fetching contract', { id });

      const { data, error } = await getSupabaseClient()
        .from('contracts')
        .select(
          `*,
          customer:customers(*),
          template:contract_templates(*),
          parties:contract_parties(*),
          approvals:contract_approvals(*)`
        )
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data ? this.mapContractResponse(data) : null;
    } catch (error) {
      this.logError('Error fetching contract', error);
      throw error;
    }
  }

  /**
   * Create new contract
   */
  async createContract(data: Partial<Contract>): Promise<Contract> {
    try {
      this.log('Creating contract', { customer_id: data.customer_id });

      const { data: created, error } = await getSupabaseClient()
        .from('contracts')
        .insert([
          {
            contract_number: data.contract_number,
            title: data.title,
            description: data.description,
            customer_id: data.customer_id,
            type: data.type || 'standard',
            status: data.status || 'draft',
            start_date: data.start_date,
            end_date: data.end_date,
            renewal_date: data.renewal_date,
            value: data.value || 0,
            currency: data.currency || 'USD',
            template_id: data.template_id,
            content: data.content,
            terms_and_conditions: data.terms_and_conditions,
            created_by: data.created_by,
            tenant_id: data.tenant_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select(
          `*,
          customer:customers(*),
          template:contract_templates(*),
          parties:contract_parties(*),
          approvals:contract_approvals(*)`
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
   */
  async updateContract(id: string, updates: Partial<Contract>): Promise<Contract> {
    try {
      this.log('Updating contract', { id });

      const { data, error } = await getSupabaseClient()
        .from('contracts')
        .update({
          title: updates.title,
          description: updates.description,
          type: updates.type,
          status: updates.status,
          start_date: updates.start_date,
          end_date: updates.end_date,
          renewal_date: updates.renewal_date,
          value: updates.value,
          currency: updates.currency,
          content: updates.content,
          terms_and_conditions: updates.terms_and_conditions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(
          `*,
          customer:customers(*),
          template:contract_templates(*),
          parties:contract_parties(*),
          approvals:contract_approvals(*)`
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
   */
  async deleteContract(id: string): Promise<void> {
    try {
      this.log('Deleting contract', { id });

      const { error } = await getSupabaseClient()
        .from('contracts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      this.log('Contract deleted successfully', { id });
    } catch (error) {
      this.logError('Error deleting contract', error);
      throw error;
    }
  }

  /**
   * Get contracts expiring soon
   */
  async getExpiringContracts(tenantId: string, daysThreshold: number = 30): Promise<Contract[]> {
    try {
      this.log('Fetching expiring contracts', { tenantId, daysThreshold });

      const now = new Date();
      const threshold = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

      const contracts = await this.getContracts({ tenantId });

      return contracts.filter((c) => {
        if (!c.end_date) return false;
        const endDate = new Date(c.end_date);
        return endDate <= threshold && endDate >= now;
      });
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
  async getContractStats(tenantId: string): Promise<{
    total: number;
    active: number;
    expiring: number;
    totalValue: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  }> {
    try {
      this.log('Fetching contract statistics', { tenantId });

      const contracts = await this.getContracts({ tenantId });
      const expiringContracts = await this.getExpiringContracts(tenantId);

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
      customer_id: dbContract.customer_id,
      customer_name: dbContract.customer?.company_name || '',
      type: (dbContract.type || 'standard') as Contract['type'],
      status: (dbContract.status || 'draft') as Contract['status'],
      start_date: dbContract.start_date,
      end_date: dbContract.end_date,
      renewal_date: dbContract.renewal_date,
      value: dbContract.value || 0,
      currency: dbContract.currency || 'USD',
      template_id: dbContract.template_id,
      content: dbContract.content || '',
      terms_and_conditions: dbContract.terms_and_conditions || '',
      created_by: dbContract.created_by || '',
      approvals: dbContract.approvals || [],
      parties: dbContract.parties || [],
      tenant_id: dbContract.tenant_id,
      created_at: dbContract.created_at,
      updated_at: dbContract.updated_at,
    };
  }
}

// Export singleton instance
export const supabaseContractService = new SupabaseContractService();