import { Complaint, ComplaintComment, ComplaintFilters, ComplaintStats, ComplaintFormData, ComplaintUpdateData } from '@/types/complaints';
import { authService } from '../serviceFactory';

class MockComplaintService {
  private baseUrl = '/api/complaints';

  // Mock data for demonstration
  private mockComplaints: Complaint[] = [
    {
      id: '1',
      title: 'Software Update Failed',
      description: 'The latest software update failed to install on the production server, causing system downtime.',
      customer_id: '1',
      type: 'software_update',
      status: 'in_progress',
      priority: 'high',
      assigned_engineer_id: '2',
      engineer_resolution: null,
      comments: [
        {
          id: '1',
          complaint_id: '1',
          user_id: '1',
          content: 'Customer reported the issue at 9:00 AM. System went down immediately after update.',
          created_at: '2024-01-15T09:00:00Z'
        },
        {
          id: '2',
          complaint_id: '1',
          user_id: '2',
          content: 'Investigating the update logs. Found corruption in update package.',
          created_at: '2024-01-15T10:30:00Z'
        }
      ],
      tenant_id: 'tenant_1',
      created_at: '2024-01-15T09:00:00Z',
      updated_at: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      title: 'Preventive Maintenance Required',
      description: 'Regular preventive maintenance check revealed several components need replacement.',
      customer_id: '2',
      type: 'preventive',
      status: 'new',
      priority: 'medium',
      assigned_engineer_id: null,
      engineer_resolution: null,
      comments: [],
      tenant_id: 'tenant_1',
      created_at: '2024-01-14T14:00:00Z',
      updated_at: '2024-01-14T14:00:00Z'
    },
    {
      id: '3',
      title: 'Equipment Breakdown',
      description: 'Critical manufacturing equipment broke down during peak production hours.',
      customer_id: '3',
      type: 'breakdown',
      status: 'closed',
      priority: 'urgent',
      assigned_engineer_id: '3',
      engineer_resolution: 'Replaced faulty motor and recalibrated system. Equipment now operating normally.',
      comments: [
        {
          id: '3',
          complaint_id: '3',
          user_id: '1',
          content: 'Emergency breakdown reported. Production line stopped.',
          created_at: '2024-01-13T08:00:00Z'
        },
        {
          id: '4',
          complaint_id: '3',
          user_id: '3',
          content: 'On-site diagnosis completed. Motor failure detected.',
          created_at: '2024-01-13T09:15:00Z'
        },
        {
          id: '5',
          complaint_id: '3',
          user_id: '3',
          content: 'Repair completed. System tested and approved for production.',
          created_at: '2024-01-13T16:30:00Z'
        }
      ],
      tenant_id: 'tenant_1',
      created_at: '2024-01-13T08:00:00Z',
      updated_at: '2024-01-13T16:30:00Z',
      closed_at: '2024-01-13T16:30:00Z'
    }
  ];

  async getComplaints(filters?: ComplaintFilters): Promise<Complaint[]> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let complaints = this.mockComplaints.filter(c => c.tenant_id === user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      complaints = complaints.filter(c => c.assigned_engineer_id === user.id);
    }

    // Apply filters
    if (filters) {
      if (filters.status) {
        complaints = complaints.filter(c => c.status === filters.status);
      }
      if (filters.type) {
        complaints = complaints.filter(c => c.type === filters.type);
      }
      if (filters.priority) {
        complaints = complaints.filter(c => c.priority === filters.priority);
      }
      if (filters.assigned_engineer) {
        complaints = complaints.filter(c => c.assigned_engineer_id === filters.assigned_engineer);
      }
      if (filters.customer_id) {
        complaints = complaints.filter(c => c.customer_id === filters.customer_id);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        complaints = complaints.filter(c =>
          c.title.toLowerCase().includes(search) ||
          c.description.toLowerCase().includes(search) ||
          c.comments.some(comment => comment.content.toLowerCase().includes(search))
        );
      }
      if (filters.date_from) {
        complaints = complaints.filter(c => new Date(c.created_at) >= new Date(filters.date_from!));
      }
      if (filters.date_to) {
        complaints = complaints.filter(c => new Date(c.created_at) <= new Date(filters.date_to!));
      }
    }

    return complaints;
  }

  async getComplaint(id: string): Promise<Complaint> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const complaint = this.mockComplaints.find(c =>
      c.id === id && c.tenant_id === user.tenant_id
    );

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // Check permissions
    if (user.role === 'agent' && complaint.assigned_engineer_id !== user.id) {
      throw new Error('Access denied');
    }

    return complaint;
  }

  async createComplaint(complaintData: ComplaintFormData): Promise<Complaint> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('manage_complaints')) {
      throw new Error('Insufficient permissions');
    }

    const newComplaint: Complaint = {
      ...complaintData,
      id: Date.now().toString(),
      status: 'new',
      engineer_resolution: null,
      comments: [],
      tenant_id: user.tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.mockComplaints.push(newComplaint);
    return newComplaint;
  }

  async updateComplaint(id: string, updates: ComplaintUpdateData): Promise<Complaint> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('manage_complaints')) {
      throw new Error('Insufficient permissions');
    }

    const complaintIndex = this.mockComplaints.findIndex(c =>
      c.id === id && c.tenant_id === user.tenant_id
    );

    if (complaintIndex === -1) {
      throw new Error('Complaint not found');
    }

    const complaint = this.mockComplaints[complaintIndex];

    // Check permissions
    if (user.role === 'agent' && complaint.assigned_engineer_id !== user.id) {
      throw new Error('Access denied');
    }

    // Handle status changes
    const updatedComplaint = {
      ...complaint,
      ...updates,
      updated_at: new Date().toISOString(),
      closed_at: updates.status === 'closed' ? new Date().toISOString() : complaint.closed_at
    };

    this.mockComplaints[complaintIndex] = updatedComplaint;
    return updatedComplaint;
  }

  async deleteComplaint(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('manage_complaints')) {
      throw new Error('Insufficient permissions');
    }

    const complaintIndex = this.mockComplaints.findIndex(c =>
      c.id === id && c.tenant_id === user.tenant_id
    );

    if (complaintIndex === -1) {
      throw new Error('Complaint not found');
    }

    this.mockComplaints.splice(complaintIndex, 1);
  }

  async addComment(complaintId: string, commentData: { content: string; parent_id?: string }): Promise<ComplaintComment> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const complaint = this.mockComplaints.find(c =>
      c.id === complaintId && c.tenant_id === user.tenant_id
    );

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // Check permissions
    if (user.role === 'agent' && complaint.assigned_engineer_id !== user.id) {
      throw new Error('Access denied');
    }

    const newComment: ComplaintComment = {
      id: Date.now().toString(),
      complaint_id: complaintId,
      user_id: user.id,
      content: commentData.content,
      parent_id: commentData.parent_id,
      created_at: new Date().toISOString()
    };

    complaint.comments.push(newComment);
    return newComment;
  }

  async getComplaintStats(): Promise<ComplaintStats> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const complaints = this.mockComplaints.filter(c => c.tenant_id === user.tenant_id);

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

  private calculateAverageResolutionTime(complaints: Complaint[]): number {
    const resolvedComplaints = complaints.filter(c => c.status === 'closed' && c.closed_at);

    if (resolvedComplaints.length === 0) return 0;

    const totalHours = resolvedComplaints.reduce((total, complaint) => {
      const created = new Date(complaint.created_at);
      const closed = new Date(complaint.closed_at!);
      const hours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);

    return Math.round(totalHours / resolvedComplaints.length);
  }
}

export const mockComplaintService = new MockComplaintService();