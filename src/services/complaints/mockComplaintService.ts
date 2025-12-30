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
      customerId: '1',
      type: 'software_update',
      status: 'in_progress',
      priority: 'high',
      assignedEngineerId: '2',
      engineerResolution: null,
      comments: [
        {
          id: '1',
          complaintId: '1',
          userId: '1',
          content: 'Customer reported the issue at 9:00 AM. System went down immediately after update.',
          createdAt: '2024-01-15T09:00:00Z'
        },
        {
          id: '2',
          complaintId: '1',
          userId: '2',
          content: 'Investigating the update logs. Found corruption in update package.',
          createdAt: '2024-01-15T10:30:00Z'
        }
      ],
      tenantId: 'tenant_1',
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      title: 'Preventive Maintenance Required',
      description: 'Regular preventive maintenance check revealed several components need replacement.',
      customerId: '2',
      type: 'preventive',
      status: 'new',
      priority: 'medium',
      assignedEngineerId: null,
      engineerResolution: null,
      comments: [],
      tenantId: 'tenant_1',
      createdAt: '2024-01-14T14:00:00Z',
      updatedAt: '2024-01-14T14:00:00Z'
    },
    {
      id: '3',
      title: 'Equipment Breakdown',
      description: 'Critical manufacturing equipment broke down during peak production hours.',
      customerId: '3',
      type: 'breakdown',
      status: 'closed',
      priority: 'urgent',
      assignedEngineerId: '3',
      engineerResolution: 'Replaced faulty motor and recalibrated system. Equipment now operating normally.',
      comments: [
        {
          id: '3',
          complaintId: '3',
          userId: '1',
          content: 'Emergency breakdown reported. Production line stopped.',
          createdAt: '2024-01-13T08:00:00Z'
        },
        {
          id: '4',
          complaintId: '3',
          userId: '3',
          content: 'On-site diagnosis completed. Motor failure detected.',
          createdAt: '2024-01-13T09:15:00Z'
        },
        {
          id: '5',
          complaintId: '3',
          userId: '3',
          content: 'Repair completed. System tested and approved for production.',
          createdAt: '2024-01-13T16:30:00Z'
        }
      ],
      tenantId: 'tenant_1',
      createdAt: '2024-01-13T08:00:00Z',
      updatedAt: '2024-01-13T16:30:00Z',
      closedAt: '2024-01-13T16:30:00Z'
    }
  ];

  async getComplaints(filters?: ComplaintFilters): Promise<Complaint[]> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let complaints = this.mockComplaints.filter(c => c.tenantId === user.tenant_id);

    // Apply role-based filtering removed - RBAC handled at context/hook layer

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
      if (filters.assignedEngineerId) {
        complaints = complaints.filter(c => c.assignedEngineerId === filters.assignedEngineerId);
      }
      if (filters.customerId) {
        complaints = complaints.filter(c => c.customerId === filters.customerId);
      }
      if (filters.dateFrom) {
        complaints = complaints.filter(c => new Date(c.createdAt) >= new Date(filters.dateFrom!));
      }
      if (filters.dateTo) {
        complaints = complaints.filter(c => new Date(c.createdAt) <= new Date(filters.dateTo!));
      }
    }

    return complaints;
  }

  async getComplaint(id: string): Promise<Complaint> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const complaint = this.mockComplaints.find(c =>
      c.id === id && c.tenantId === user.tenant_id
    );

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // Removed role-based access check - RBAC handled at context/permission layer

    return complaint;
  }

  async createComplaint(complaintData: ComplaintFormData): Promise<Complaint> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('crm:support:complaint:update')) {
      throw new Error('Insufficient permissions');
    }

    const newComplaint: Complaint = {
      ...complaintData,
      id: Date.now().toString(),
      status: 'new',
      engineerResolution: null,
      comments: [],
      tenantId: user.tenant_id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.mockComplaints.push(newComplaint);
    return newComplaint;
  }

  async updateComplaint(id: string, updates: ComplaintUpdateData): Promise<Complaint> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('crm:support:complaint:update')) {
      throw new Error('Insufficient permissions');
    }

    const complaintIndex = this.mockComplaints.findIndex(c =>
      c.id === id && c.tenantId === user.tenant_id
    );

    if (complaintIndex === -1) {
      throw new Error('Complaint not found');
    }

    const complaint = this.mockComplaints[complaintIndex];

    // Removed role-based access check - RBAC handled at context/permission layer

    // Handle status changes
    const updatedComplaint = {
      ...complaint,
      ...updates,
      updatedAt: new Date().toISOString(),
      closedAt: updates.status === 'closed' ? new Date().toISOString() : complaint.closedAt
    };

    this.mockComplaints[complaintIndex] = updatedComplaint;
    return updatedComplaint;
  }

  async deleteComplaint(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('crm:support:complaint:update')) {
      throw new Error('Insufficient permissions');
    }

    const complaintIndex = this.mockComplaints.findIndex(c =>
      c.id === id && c.tenantId === user.tenant_id
    );

    if (complaintIndex === -1) {
      throw new Error('Complaint not found');
    }

    this.mockComplaints.splice(complaintIndex, 1);
  }

  async addComment(complaintId: string, commentData: { content: string; parentId?: string }): Promise<ComplaintComment> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const complaint = this.mockComplaints.find(c =>
      c.id === complaintId && c.tenantId === user.tenant_id
    );

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // Removed role-based access check

    const newComment: ComplaintComment = {
      id: Date.now().toString(),
      complaintId: complaintId,
      userId: user.id,
      content: commentData.content,
      parentId: commentData.parentId,
      createdAt: new Date().toISOString()
    };

    complaint.comments.push(newComment);
    return newComment;
  }

  async getComplaintStats(): Promise<ComplaintStats> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const complaints = this.mockComplaints.filter(c => c.tenantId === user.tenant_id);

    const stats: ComplaintStats = {
      total: complaints.length,
      new: complaints.filter(c => c.status === 'new').length,
      inProgress: complaints.filter(c => c.status === 'in_progress').length,
      closed: complaints.filter(c => c.status === 'closed').length,
      byType: {
        breakdown: complaints.filter(c => c.type === 'breakdown').length,
        preventive: complaints.filter(c => c.type === 'preventive').length,
        softwareUpdate: complaints.filter(c => c.type === 'software_update').length,
        optimize: complaints.filter(c => c.type === 'optimize').length
      },
      byPriority: {
        low: complaints.filter(c => c.priority === 'low').length,
        medium: complaints.filter(c => c.priority === 'medium').length,
        high: complaints.filter(c => c.priority === 'high').length,
        urgent: complaints.filter(c => c.priority === 'urgent').length
      },
      avgResolutionTime: this.calculateAverageResolutionTime(complaints)
    };

    return stats;
  }

  private calculateAverageResolutionTime(complaints: Complaint[]): number {
    const resolvedComplaints = complaints.filter(c => c.status === 'closed' && c.closedAt);

    if (resolvedComplaints.length === 0) return 0;

    const totalHours = resolvedComplaints.reduce((total, complaint) => {
      const created = new Date(complaint.createdAt);
      const closed = new Date(complaint.closedAt!);
      const hours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);

    return Math.round(totalHours / resolvedComplaints.length);
  }
}

export const mockComplaintService = new MockComplaintService();