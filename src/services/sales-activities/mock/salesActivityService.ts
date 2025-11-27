import { SalesActivityDTO, CreateSalesActivityDTO, UpdateSalesActivityDTO, SalesActivityFiltersDTO, SalesActivityListResponseDTO } from '@/types/dtos/salesDtos';
import { authService } from '../../serviceFactory';

class MockSalesActivityService {
  private baseUrl = '/api/sales-activities';

  // Mock data for demonstration
  private mockActivities: SalesActivityDTO[] = [
    {
      id: 'activity_1',
      activityType: 'call',
      subject: 'Initial sales call with TechCorp',
      description: 'Discussed requirements and scheduled demo',
      opportunityId: 'opp_1',
      customerId: '1',
      customerName: 'TechCorp Industries',
      startDate: '2024-01-15T10:00:00Z',
      endDate: '2024-01-15T10:30:00Z',
      durationMinutes: 30,
      performedBy: '2',
      performedByName: 'Sarah Johnson',
      participants: ['2', '3'],
      contactPerson: 'John Smith',
      outcome: 'successful',
      outcomeNotes: 'Customer showed strong interest',
      nextAction: 'Schedule product demo',
      nextActionDate: '2024-01-20T14:00:00Z',
      location: 'Phone call',
      attachments: [],
      tags: ['initial_call', 'positive'],
      tenantId: 'tenant_1',
      audit: {
        createdAt: '2024-01-15T10:35:00Z',
        updatedAt: '2024-01-15T10:35:00Z',
        createdBy: '2',
        updatedBy: '2',
        version: 1
      }
    },
    {
      id: 'activity_2',
      activityType: 'meeting',
      subject: 'Product demo for TechCorp',
      description: 'Comprehensive product demonstration',
      dealId: 'deal_1',
      customerId: '1',
      customerName: 'TechCorp Industries',
      startDate: '2024-01-20T14:00:00Z',
      endDate: '2024-01-20T15:30:00Z',
      durationMinutes: 90,
      performedBy: '2',
      performedByName: 'Sarah Johnson',
      participants: ['2', '3'],
      contactPerson: 'John Smith',
      outcome: 'successful',
      outcomeNotes: 'Demo went very well, customer impressed with features',
      nextAction: 'Send proposal',
      nextActionDate: '2024-01-22T10:00:00Z',
      location: 'TechCorp Office, Conference Room A',
      attachments: ['demo_slides.pdf', 'product_specs.pdf'],
      tags: ['demo', 'successful', 'follow_up_needed'],
      tenantId: 'tenant_1',
      audit: {
        createdAt: '2024-01-20T16:00:00Z',
        updatedAt: '2024-01-20T16:00:00Z',
        createdBy: '2',
        updatedBy: '2',
        version: 1
      }
    },
    {
      id: 'activity_3',
      activityType: 'email',
      subject: 'Proposal sent to TechCorp',
      description: 'Sent detailed proposal with pricing',
      dealId: 'deal_1',
      customerId: '1',
      customerName: 'TechCorp Industries',
      startDate: '2024-01-22T10:00:00Z',
      performedBy: '2',
      performedByName: 'Sarah Johnson',
      outcome: 'pending',
      outcomeNotes: 'Waiting for customer feedback',
      nextAction: 'Follow up on proposal',
      nextActionDate: '2024-01-25T10:00:00Z',
      attachments: ['proposal_v1.pdf', 'pricing_breakdown.xlsx'],
      tags: ['proposal', 'pending'],
      tenantId: 'tenant_1',
      audit: {
        createdAt: '2024-01-22T10:15:00Z',
        updatedAt: '2024-01-22T10:15:00Z',
        createdBy: '2',
        updatedBy: '2',
        version: 1
      }
    }
  ];

  async getSalesActivities(filters?: SalesActivityFiltersDTO): Promise<SalesActivityDTO[]> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let activities = this.mockActivities.filter(a => a.tenantId === user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      activities = activities.filter(a => a.performedBy === user.id);
    }

    // Apply filters
    if (filters) {
      if (filters.activityType) {
        const typeFilter = Array.isArray(filters.activityType) ? filters.activityType : [filters.activityType];
        activities = activities.filter(a => typeFilter.includes(a.activityType));
      }
      if (filters.opportunityId) {
        activities = activities.filter(a => a.opportunityId === filters.opportunityId);
      }
      if (filters.dealId) {
        activities = activities.filter(a => a.dealId === filters.dealId);
      }
      if (filters.customerId) {
        activities = activities.filter(a => a.customerId === filters.customerId);
      }
      if (filters.performedBy) {
        activities = activities.filter(a => a.performedBy === filters.performedBy);
      }
      if (filters.outcome) {
        const outcomeFilter = Array.isArray(filters.outcome) ? filters.outcome : [filters.outcome];
        activities = activities.filter(a => a.outcome && outcomeFilter.includes(a.outcome));
      }
      if (filters.dateRange) {
        const fromDate = new Date(filters.dateRange.from);
        const toDate = new Date(filters.dateRange.to);
        activities = activities.filter(a => {
          const startDate = new Date(a.startDate);
          return startDate >= fromDate && startDate <= toDate;
        });
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        activities = activities.filter(a =>
          a.subject.toLowerCase().includes(search) ||
          a.description?.toLowerCase().includes(search) ||
          a.customerName?.toLowerCase().includes(search)
        );
      }
    }

    return activities;
  }

  async getSalesActivity(id: string): Promise<SalesActivityDTO> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const activity = this.mockActivities.find(a =>
      a.id === id && a.tenantId === user.tenant_id
    );

    if (!activity) {
      throw new Error('Sales activity not found');
    }

    // Check permissions
    if (user.role === 'agent' && activity.performedBy !== user.id) {
      throw new Error('Access denied');
    }

    return activity;
  }

  async createSalesActivity(activityData: CreateSalesActivityDTO): Promise<SalesActivityDTO> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const newActivity: SalesActivityDTO = {
      id: `activity_${Date.now()}`,
      ...activityData,
      tenantId: user.tenant_id,
      audit: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user.id,
        updatedBy: user.id,
        version: 1
      }
    };

    this.mockActivities.push(newActivity);
    return newActivity;
  }

  async updateSalesActivity(id: string, updates: UpdateSalesActivityDTO): Promise<SalesActivityDTO> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const activityIndex = this.mockActivities.findIndex(a =>
      a.id === id && a.tenantId === user.tenant_id
    );

    if (activityIndex === -1) {
      throw new Error('Sales activity not found');
    }

    // Check permissions
    if (user.role === 'agent' && this.mockActivities[activityIndex].performedBy !== user.id) {
      throw new Error('Access denied');
    }

    this.mockActivities[activityIndex] = {
      ...this.mockActivities[activityIndex],
      ...updates,
      audit: {
        ...this.mockActivities[activityIndex].audit,
        updatedAt: new Date().toISOString(),
        updatedBy: user.id,
        version: this.mockActivities[activityIndex].audit.version + 1
      }
    };

    return this.mockActivities[activityIndex];
  }

  async deleteSalesActivity(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('delete')) {
      throw new Error('Insufficient permissions');
    }

    const activityIndex = this.mockActivities.findIndex(a =>
      a.id === id && a.tenantId === user.tenant_id
    );

    if (activityIndex === -1) {
      throw new Error('Sales activity not found');
    }

    this.mockActivities.splice(activityIndex, 1);
  }

  async getActivitiesByOpportunity(opportunityId: string): Promise<SalesActivityDTO[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let activities = this.mockActivities.filter(a =>
      a.tenantId === user.tenant_id && a.opportunityId === opportunityId
    );

    // Apply role-based filtering
    if (user.role === 'agent') {
      activities = activities.filter(a => a.performedBy === user.id);
    }

    return activities;
  }

  async getActivitiesByDeal(dealId: string): Promise<SalesActivityDTO[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let activities = this.mockActivities.filter(a =>
      a.tenantId === user.tenant_id && a.dealId === dealId
    );

    // Apply role-based filtering
    if (user.role === 'agent') {
      activities = activities.filter(a => a.performedBy === user.id);
    }

    return activities;
  }

  async getActivitiesByCustomer(customerId: string): Promise<SalesActivityDTO[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let activities = this.mockActivities.filter(a =>
      a.tenantId === user.tenant_id && a.customerId === customerId
    );

    // Apply role-based filtering
    if (user.role === 'agent') {
      activities = activities.filter(a => a.performedBy === user.id);
    }

    return activities;
  }
}

export const mockSalesActivityService = new MockSalesActivityService();