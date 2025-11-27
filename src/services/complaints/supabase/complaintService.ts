import { supabase } from '../../supabase/client';
import { Complaint, ComplaintComment, ComplaintFilters, ComplaintStats, ComplaintFormData, ComplaintUpdateData } from '@/types/complaints';
import { authService } from '../../serviceFactory';

class SupabaseComplaintService {
  private supabase = supabase;

  async getComplaints(filters?: ComplaintFilters): Promise<Complaint[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let query = this.supabase
      .from('complaints_with_details')
      .select('*')
      .eq('tenant_id', user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      query = query.eq('assigned_engineer_id', user.id);
    }

    // Apply filters
    if (filters) {
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.assigned_engineer) {
        query = query.eq('assigned_engineer_id', filters.assigned_engineer);
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
      .from('complaints_with_details')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Complaint not found');

    // Check permissions
    if (user.role === 'agent' && data.assigned_engineer_id !== user.id) {
      throw new Error('Access denied');
    }

    return this.mapComplaintRow(data);
  }

  async createComplaint(complaintData: ComplaintFormData): Promise<Complaint> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('manage_complaints')) {
      throw new Error('Insufficient permissions');
    }

    const { data, error } = await this.supabase
      .from('complaints')
      .insert({
        title: complaintData.title,
        description: complaintData.description,
        customer_id: complaintData.customer_id,
        type: complaintData.type,
        priority: complaintData.priority,
        assigned_engineer_id: complaintData.assigned_engineer_id,
        tenant_id: user.tenant_id
      })
      .select()
      .single();

    if (error) throw error;

    // Get the full complaint with details
    return this.getComplaint(data.id);
  }

  async updateComplaint(id: string, updates: ComplaintUpdateData): Promise<Complaint> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('manage_complaints')) {
      throw new Error('Insufficient permissions');
    }

    // First check if complaint exists and user has access
    const existingComplaint = await this.getComplaint(id);

    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Handle status changes
    if (updates.status === 'closed') {
      updateData.closed_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('complaints')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .select()
      .single();

    if (error) throw error;

    // Get the updated complaint with details
    return this.getComplaint(id);
  }

  async deleteComplaint(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('manage_complaints')) {
      throw new Error('Insufficient permissions');
    }

    const { error } = await this.supabase
      .from('complaints')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', user.tenant_id);

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
        tenant_id: user.tenant_id
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
      .select('status, type, priority, created_at, closed_at')
      .eq('tenant_id', user.tenant_id)
      .is('deleted_at', null);

    if (error) throw error;

    const stats: ComplaintStats = {
      total: complaints.length,
      new: complaints.filter(c => c.status === 'new').length,
      in_progress: complaints.filter(c => c.status === 'in_progress').length,
      closed: complaints.filter(c => c.status === 'closed').length,
      by_type: {
        breakdown: complaints.filter(c => c.type === 'breakdown').length,
        preventive: complaints.filter(c => c.type === 'preventive').length,
        software_update: complaints.filter(c => c.type === 'software_update').length,
        optimize: complaints.filter(c => c.type === 'optimize').length
      },
      by_priority: {
        low: complaints.filter(c => c.priority === 'low').length,
        medium: complaints.filter(c => c.priority === 'medium').length,
        high: complaints.filter(c => c.priority === 'high').length,
        urgent: complaints.filter(c => c.priority === 'urgent').length
      },
      avg_resolution_time: this.calculateAverageResolutionTime(complaints)
    };

    return stats;
  }

  private mapComplaintRow(row: any): Complaint {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      customer_id: row.customer_id,
      type: row.type,
      status: row.status,
      priority: row.priority,
      assigned_engineer_id: row.assigned_engineer_id,
      engineer_resolution: row.engineer_resolution,
      comments: Array.isArray(row.comments) ? row.comments.map((c: any) => this.mapCommentRow(c)) : [],
      tenant_id: row.tenant_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      closed_at: row.closed_at
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
    const resolvedComplaints = complaints.filter(c => c.status === 'closed' && c.closed_at);

    if (resolvedComplaints.length === 0) return 0;

    const totalHours = resolvedComplaints.reduce((total, complaint) => {
      const created = new Date(complaint.created_at);
      const closed = new Date(complaint.closed_at);
      const hours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);

    return Math.round(totalHours / resolvedComplaints.length);
  }
}

export const supabaseComplaintService = new SupabaseComplaintService();