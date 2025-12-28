/**
 * Supabase Job Work Service
 * Handles job work management - engineering/service job assignments
 * Integrates with tenant context for multi-tenant support
 */

import { supabase as supabaseClient } from '@/services/supabase/client';

const getSupabaseClient = () => supabaseClient;

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
import { JobWork, JobWorkFilters, JobWorkStats, JobWorkFormData, JobWorkUpdateData } from '@/types/jobWork';
import { multiTenantService } from '../../multitenant/supabase/multiTenantService';

export class SupabaseJobWorkService extends BaseSupabaseService {
  constructor() {
    super('job_works', true);
  }

  /**
   * Get all job works with optional filtering and tenant context
   */
  async getJobWorks(filters?: JobWorkFilters): Promise<JobWork[]> {
    try {
      this.log('Fetching job works', filters);

      const tenant = multiTenantService.getCurrentTenant();
      if (!tenant?.tenantId) {
        this.logError('No tenant context available');
        throw new Error('Unauthorized');
      }

      let query = getSupabaseClient()
        .from('job_works')
        .select(`
          *,
          customer:customers(id, company_name, contact_name, email, phone),
          assigned_user:users!job_works_receiver_engineer_id_fkey(id, name, email),
          product:products(id, name, sku)
        `)
        .eq('tenant_id', tenant.tenantId)
        .is('deleted_at', null);

      // Apply role-based filtering
      if (tenant?.role === 'engineer') {
        query = query.eq('receiver_engineer_id', tenant.userId);
      }

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }
      if (filters?.product_id) {
        query = query.eq('product_id', filters.product_id);
      }
      if (filters?.receiver_engineer) {
        query = query.eq('receiver_engineer_id', filters.receiver_engineer);
      }
      if (filters?.search) {
        const search = `%${filters.search}%`;
        query = query.or(
          `job_ref_id.ilike.${search},customer_id.ilike.${search},product_id.ilike.${search},comments.ilike.${search}`
        );
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) throw error;

      this.log('Job works fetched', { count: data?.length });
      return (data || []).map(jw => this.mapJobWorkResponse(jw));
    } catch (error) {
      this.logError('Error fetching job works', error);
      throw error;
    }
  }

  /**
   * Get single job work by ID with tenant context
   */
  async getJobWork(id: string): Promise<JobWork> {
    try {
      this.log('Fetching job work', { id });

      const tenant = multiTenantService.getCurrentTenant();
      if (!tenant?.tenantId) {
        throw new Error('Unauthorized');
      }

      const { data, error } = await getSupabaseClient()
        .from('job_works')
        .select(`
          *,
          customer:customers(id, company_name, contact_name, email, phone),
          assigned_user:users!job_works_receiver_engineer_id_fkey(id, name, email),
          product:products(id, name, sku)
        `)
        .eq('id', id)
        .eq('tenant_id', tenant.tenantId)
        .is('deleted_at', null)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) throw new Error('Job work not found');

      // Check permissions for engineers
      if (tenant?.role === 'engineer' && data.receiver_engineer_id !== tenant.userId) {
        throw new Error('Access denied');
      }

      return this.mapJobWorkResponse(data);
    } catch (error) {
      this.logError('Error fetching job work', error);
      throw error;
    }
  }

  /**
   * Create new job work with tenant context
   */
  async createJobWork(jobWorkData: JobWorkFormData): Promise<JobWork> {
    try {
      this.log('Creating job work', jobWorkData);

      const tenant = multiTenantService.getCurrentTenant();
      if (!tenant?.tenantId) {
        throw new Error('Unauthorized');
      }

      // Generate unique job_ref_id (in production, this would use a sequence or trigger)
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      const job_ref_id = `JW-${dateStr}-${randomPart}`;

      const newJobWork = {
        job_ref_id,
        customer_id: jobWorkData.customer_id,
        product_id: jobWorkData.product_id,
        pieces: jobWorkData.pieces,
        size: jobWorkData.size,
        default_price: jobWorkData.default_price || 0,
        manual_price: jobWorkData.manual_price,
        final_price: jobWorkData.final_price || 0,
        receiver_engineer_id: jobWorkData.receiver_engineer_id,
        priority: jobWorkData.priority || 'medium',
        due_date: jobWorkData.due_date,
        delivery_address: jobWorkData.delivery_address,
        delivery_instructions: jobWorkData.delivery_instructions,
        comments: jobWorkData.comments,
        internal_notes: jobWorkData.internal_notes,
        compliance_requirements: jobWorkData.compliance_requirements,
        status: 'pending',
        tenant_id: tenant.tenantId,
        created_by: tenant.userId,
      };

      const { data, error } = await getSupabaseClient()
        .from('job_works')
        .insert([newJobWork])
        .select('*')
        .single();

      if (error) throw error;

      this.log('Job work created', { id: data?.id });
      return this.mapJobWorkResponse(data);
    } catch (error) {
      this.logError('Error creating job work', error);
      throw error;
    }
  }

  /**
   * Update job work with tenant context
   */
  async updateJobWork(id: string, updates: JobWorkUpdateData): Promise<JobWork> {
    try {
      this.log('Updating job work', { id, updates });

      const tenant = multiTenantService.getCurrentTenant();
      if (!tenant?.tenantId) {
        throw new Error('Unauthorized');
      }

      // Get current job work to check permissions
      const { data: currentJobWork, error: fetchError } = await getSupabaseClient()
        .from('job_works')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenant.tenantId)
        .is('deleted_at', null)
        .single();

      if (fetchError) throw fetchError;
      if (!currentJobWork) throw new Error('Job work not found');

      // Check permissions for engineers
      if (tenant?.role === 'engineer' && currentJobWork.receiver_engineer_id !== tenant.userId) {
        throw new Error('Access denied');
      }

      // Map only valid database columns (specifications is in separate job_work_specifications table)
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      // Only include fields that exist in job_works table
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.pieces !== undefined) updateData.pieces = updates.pieces;
      if (updates.size !== undefined) updateData.size = updates.size;
      if (updates.manual_price !== undefined) updateData.manual_price = updates.manual_price;
      if (updates.receiver_engineer_id !== undefined) updateData.receiver_engineer_id = updates.receiver_engineer_id;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.due_date !== undefined) updateData.due_date = updates.due_date;
      if (updates.delivery_address !== undefined) updateData.delivery_address = updates.delivery_address;
      if (updates.delivery_instructions !== undefined) updateData.delivery_instructions = updates.delivery_instructions;
      if (updates.comments !== undefined) updateData.comments = updates.comments;
      if (updates.internal_notes !== undefined) updateData.internal_notes = updates.internal_notes;
      if (updates.quality_check_passed !== undefined) updateData.quality_check_passed = updates.quality_check_passed;
      if (updates.quality_notes !== undefined) updateData.quality_notes = updates.quality_notes;
      if (updates.compliance_requirements !== undefined) updateData.compliance_requirements = updates.compliance_requirements;
      // Note: specifications is NOT a column in job_works table - it's in job_work_specifications table

      // Auto-set completion/delivery timestamps
      if (updates.status === 'completed' && currentJobWork.status !== 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      if (updates.status === 'delivered' && currentJobWork.status !== 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { data, error } = await getSupabaseClient()
        .from('job_works')
        .update(updateData)
        .eq('id', id)
        .eq('tenant_id', tenant.tenantId)
        .select('*')
        .single();

      if (error) throw error;

      this.log('Job work updated', { id });
      return this.mapJobWorkResponse(data);
    } catch (error) {
      this.logError('Error updating job work', error);
      throw error;
    }
  }

  /**
   * Delete job work with soft delete (tenant context)
   */
  async deleteJobWork(id: string): Promise<void> {
    try {
      this.log('Deleting job work', { id });

      const tenant = multiTenantService.getCurrentTenant();
      if (!tenant?.tenantId) {
        throw new Error('Unauthorized');
      }

      // Get current job work to check permissions
      const { data: currentJobWork, error: fetchError } = await getSupabaseClient()
        .from('job_works')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenant.tenantId)
        .is('deleted_at', null)
        .single();

      if (fetchError) throw fetchError;
      if (!currentJobWork) throw new Error('Job work not found');

      // Check permissions for engineers
      if (tenant?.role === 'engineer' && currentJobWork.receiver_engineer_id !== tenant.userId) {
        throw new Error('Access denied');
      }

      // Soft delete
      const { error } = await getSupabaseClient()
        .from('job_works')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('tenant_id', tenant.tenantId);

      if (error) throw error;

      this.log('Job work deleted', { id });
    } catch (error) {
      this.logError('Error deleting job work', error);
      throw error;
    }
  }

  /**
   * Get job work statistics with tenant context
   */
  async getJobWorkStats(): Promise<JobWorkStats> {
    try {
      this.log('Fetching job work statistics');

      const tenant = multiTenantService.getCurrentTenant();
      if (!tenant?.tenantId) {
        throw new Error('Unauthorized');
      }

      let query = getSupabaseClient()
        .from('job_works')
        .select('*')
        .eq('tenant_id', tenant.tenantId)
        .is('deleted_at', null);

      // Apply role-based filtering
      if (tenant?.role === 'engineer') {
        query = query.eq('receiver_engineer_id', tenant.userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const jobWorks = data || [];
      const stats: JobWorkStats = {
        total: jobWorks.length,
        pending: jobWorks.filter(jw => jw.status === 'pending').length,
        in_progress: jobWorks.filter(jw => jw.status === 'in_progress').length,
        completed: jobWorks.filter(jw => jw.status === 'completed').length,
        delivered: jobWorks.filter(jw => jw.status === 'delivered').length,
        total_value: jobWorks.reduce((sum, jw) => sum + (parseFloat(jw.final_price) || 0), 0),
        avg_pieces_per_job: jobWorks.length > 0 
          ? Math.round(jobWorks.reduce((sum, jw) => sum + (parseFloat(jw.pieces) || 0), 0) / jobWorks.length) 
          : 0,
        avg_job_value: jobWorks.length > 0 
          ? Math.round(jobWorks.reduce((sum, jw) => sum + (parseFloat(jw.final_price) || 0), 0) / jobWorks.length) 
          : 0
      };

      this.log('Job work statistics calculated', stats);
      return stats;
    } catch (error) {
      this.logError('Error fetching job work statistics', error);
      throw error;
    }
  }

  /**
   * Map Supabase response to JobWork type
   * Extracts customer_name, assigned_to_name, and product_name from JOINed data
   */
  private mapJobWorkResponse(data: any): JobWork {
    // Extract customer name from joined customer data
    const customerName = data.customer?.company_name || data.customer?.contact_name || undefined;
    
    // Extract assigned user name from joined user data  
    const assignedToName = data.assigned_user?.name || undefined;
    
    // Extract product name from joined product data
    const productName = data.product?.name || undefined;

    return {
      id: data.id,
      job_ref_id: data.job_ref_id,
      customer_id: data.customer_id,
      customer_name: customerName,
      product_id: data.product_id,
      product_name: productName,
      pieces: parseFloat(data.pieces),
      size: data.size,
      default_price: parseFloat(data.default_price),
      manual_price: data.manual_price ? parseFloat(data.manual_price) : undefined,
      final_price: parseFloat(data.final_price),
      base_price: data.base_price ? parseFloat(data.base_price) : parseFloat(data.default_price),
      receiver_engineer_id: data.receiver_engineer_id,
      assigned_to: data.receiver_engineer_id,
      assigned_to_name: assignedToName,
      comments: data.comments,
      status: data.status,
      tenant_id: data.tenant_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      completed_at: data.completed_at,
      delivered_at: data.delivered_at,
    };
  }
}

// Export singleton instance
export const supabaseJobWorkService = new SupabaseJobWorkService();