import { supabase } from '../../supabase/client';
import { Complaint, ComplaintComment, ComplaintFilters, ComplaintStats, ComplaintFormData, ComplaintUpdateData } from '@/types/complaints';
import { authService } from '../../serviceFactory';

class SupabaseComplaintService {
  private supabase = supabase;

  async getComplaints(filters?: ComplaintFilters): Promise<Complaint[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

      let query = this.supabase
        .from('complaints')
        .select('*')
      .eq('tenant_id', user.tenantId)
      .is('deleted_at', null);

    // Apply role-based filtering
    if (user.role === 'agent') {
      query = query.eq('assigned_to', user.id);
    }

    // Apply filters
    if (filters) {
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data to match TypeScript interface
    return data.map(row => this.mapComplaintRow(row));
  }

  async getComplaint(id: string): Promise<Complaint> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

      const { data, error } = await this.supabase
        .from('complaints')
        .select('*')
      .eq('id', id)
      .eq('tenant_id', user.tenantId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Complaint not found');

    // Check permissions
    if (user.role === 'agent' && data.assigned_to !== user.id) {
      throw new Error('Access denied');
    }

    // Load comments separately to avoid view dependency
    const { data: commentRows, error: commentsError } = await this.supabase
      .from('complaint_comments')
      .select('*')
      .eq('complaint_id', id)
      .eq('tenant_id', user.tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (commentsError) throw commentsError;

    const comments = (commentRows || []).map(c => this.mapCommentRow(c));

    return this.mapComplaintRow(data, comments);
  }

  async createComplaint(complaintData: ComplaintFormData): Promise<Complaint> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('crm:support:complaint:update')) {
      throw new Error('Insufficient permissions');
    }

    // ✅ Use correct database column names
    // DB has: category (not type), assigned_to (not assigned_engineer_id)
    const insertData: Record<string, unknown> = {
      title: complaintData.title,
      description: complaintData.description,
      customer_id: complaintData.customer_id,
      category: complaintData.category,
      priority: complaintData.priority,
      status: 'new',
      tenant_id: user.tenantId,
      created_by: user.id,
      assigned_to: complaintData.assigned_to,
    };

    const { data, error } = await this.supabase
      .from('complaints')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    // Get the full complaint with details
    return this.getComplaint(data.id);
  }

  async updateComplaint(id: string, updates: ComplaintUpdateData): Promise<Complaint> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('crm:support:complaint:update')) {
      throw new Error('Insufficient permissions');
    }

    // First check if complaint exists and user has access
    const existingComplaint = await this.getComplaint(id);

    // ✅ Explicit field mapping (DB columns: status, priority, assigned_to, resolution, resolved_at)
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    // Map fields to correct database column names
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.assigned_to !== undefined) updateData.assigned_to = updates.assigned_to;
    if (updates.resolution !== undefined) updateData.resolution = updates.resolution;

    // Handle status changes - DB column is resolved_at (not closed_at)
    if (updates.status === 'closed') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('complaints')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', user.tenantId)
      .select()
      .single();

    if (error) throw error;

    // Get the updated complaint with details
    return this.getComplaint(id);
  }

  async deleteComplaint(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('crm:support:complaint:update')) {
      throw new Error('Insufficient permissions');
    }

    const { error } = await this.supabase
      .from('complaints')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', user.tenantId);

    if (error) throw error;
  }

  async addComment(complaintId: string, commentData: { content: string; parent_id?: string }): Promise<ComplaintComment> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    // Verify complaint exists and user has access
    await this.getComplaint(complaintId);

    const { data, error } = await this.supabase
      .from('complaint_comments')
      .insert({
        complaint_id: complaintId,
        user_id: user.id,
        content: commentData.content,
        parent_id: commentData.parent_id,
        tenant_id: user.tenantId
      })
      .select()
      .single();

    if (error) throw error;

    return this.mapCommentRow(data);
  }

  async getComplaintStats(): Promise<ComplaintStats> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    // Get all complaints for the tenant
    const { data: complaints, error } = await this.supabase
      .from('complaints')
      .select('*')
      .eq('tenant_id', user.tenantId)
      .is('deleted_at', null);

    if (error) throw error;

    const stats: ComplaintStats = {
      total: complaints.length,
      new: complaints.filter((c: any) => c.status === 'new' || c.status === 'open').length,
      in_progress: complaints.filter((c: any) => c.status === 'in_progress').length,
      closed: complaints.filter((c: any) => c.status === 'closed' || c.status === 'resolved').length,
      by_type: {
        breakdown: complaints.filter((c: any) => c.category === 'breakdown').length,
        preventive: complaints.filter((c: any) => c.category === 'preventive').length,
        software_update: complaints.filter((c: any) => c.category === 'software_update').length,
        optimize: complaints.filter((c: any) => c.category === 'optimize').length
      },
      by_priority: {
        low: complaints.filter((c: any) => c.priority === 'low').length,
        medium: complaints.filter((c: any) => c.priority === 'medium').length,
        high: complaints.filter((c: any) => c.priority === 'high').length,
        urgent: complaints.filter((c: any) => c.priority === 'urgent').length
      },
      avg_resolution_time: this.calculateAverageResolutionTime(complaints as any[])
    };

    return stats;
  }

  private mapComplaintRow(row: any, commentsOverride?: ComplaintComment[]): Complaint {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      customer_id: row.customer_id,
      customer_name: row.customer_name,
      category: row.category,
      status: row.status,
      priority: row.priority,
      assigned_to: row.assigned_to,
      assigned_to_name: undefined,
      resolution: row.resolution,
      comments: commentsOverride
        ? commentsOverride
        : Array.isArray(row.comments) ? row.comments.map((c: any) => this.mapCommentRow(c)) : [],
      tenant_id: row.tenant_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      resolved_at: row.resolved_at
    };
  }

  private mapCommentRow(row: any): ComplaintComment {
    return {
      id: row.id,
      complaint_id: row.complaint_id,
      user_id: row.user_id,
      content: row.content,
      created_at: row.created_at,
      parent_id: row.parent_id
    };
  }

  private calculateAverageResolutionTime(complaints: any[]): number {
    const resolvedComplaints = complaints.filter(c => c.status === 'closed' && (c.resolved_at || c.closed_at));

    if (resolvedComplaints.length === 0) return 0;

    const totalHours = resolvedComplaints.reduce((total, complaint) => {
      const created = new Date(complaint.created_at);
      const closed = new Date(complaint.resolved_at || complaint.closed_at);
      const hours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);

    return Math.round(totalHours / resolvedComplaints.length);
  }
}

export const supabaseComplaintService = new SupabaseComplaintService();