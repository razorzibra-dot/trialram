import { SalesActivity } from '@/types/crm';
import { authService } from '../serviceFactory';

class SalesActivityService {
  private baseUrl = '/api/sales-activities';

  // Mock data for demonstration
  private mockActivities: SalesActivity[] = [
    {
      id: 'activity_1',
      activity_type: 'meeting',
      subject: 'Initial Discovery Meeting',
      description: 'Discussed enterprise software requirements and pain points',
      opportunity_id: 'opp_1',
      customer_id: '1',
      start_date: '2024-01-28T14:30:00Z',
      end_date: '2024-01-28T15:30:00Z',
      duration_minutes: 60,
      performed_by: '2',
      performed_by_name: 'Sarah Johnson',
      participants: ['1', '3'],
      contact_person: 'John Smith',
      outcome: 'successful',
      outcome_notes: 'Customer showed strong interest. Next step: technical demo.',
      next_action: 'Schedule technical demonstration',
      next_action_date: '2024-02-01T10:00:00Z',
      location: 'Conference Room A',
      attachments: [],
      tags: ['discovery', 'meeting', 'positive'],
      tenant_id: 'tenant_1',
      created_at: '2024-01-28T14:30:00Z',
      updated_at: '2024-01-28T15:30:00Z',
      created_by: '2'
    },
    {
      id: 'activity_2',
      activity_type: 'email',
      subject: 'Proposal Follow-up',
      description: 'Sent detailed proposal with pricing and implementation timeline',
      opportunity_id: 'opp_1',
      customer_id: '1',
      start_date: '2024-01-25T09:00:00Z',
      performed_by: '2',
      performed_by_name: 'Sarah Johnson',
      contact_person: 'John Smith',
      outcome: 'pending',
      outcome_notes: 'Waiting for customer feedback on proposal',
      next_action: 'Follow up on proposal review',
      next_action_date: '2024-01-30T14:00:00Z',
      attachments: ['proposal_v1.pdf', 'pricing_breakdown.xlsx'],
      tags: ['proposal', 'email', 'follow_up'],
      tenant_id: 'tenant_1',
      created_at: '2024-01-25T09:00:00Z',
      updated_at: '2024-01-25T09:00:00Z',
      created_by: '2'
    },
    {
      id: 'activity_3',
      activity_type: 'call',
      subject: 'Cloud Migration Discussion',
      description: 'Discussed cloud migration requirements and timeline',
      opportunity_id: 'opp_2',
      customer_id: '2',
      start_date: '2024-01-25T16:45:00Z',
      end_date: '2024-01-25T17:15:00Z',
      duration_minutes: 30,
      performed_by: '3',
      performed_by_name: 'Mike Chen',
      contact_person: 'Jane Doe',
      outcome: 'successful',
      outcome_notes: 'Customer agreed to move forward with assessment phase',
      next_action: 'Send detailed assessment proposal',
      next_action_date: '2024-01-26T10:00:00Z',
      tags: ['call', 'cloud', 'assessment'],
      tenant_id: 'tenant_1',
      created_at: '2024-01-25T16:45:00Z',
      updated_at: '2024-01-25T17:15:00Z',
      created_by: '3'
    },
    {
      id: 'activity_4',
      activity_type: 'demo',
      subject: 'Product Demonstration',
      description: 'Live demonstration of core product features',
      deal_id: 'deal_1',
      customer_id: '1',
      start_date: '2024-01-20T11:00:00Z',
      end_date: '2024-01-20T12:30:00Z',
      duration_minutes: 90,
      performed_by: '2',
      performed_by_name: 'Sarah Johnson',
      participants: ['1', '4'],
      contact_person: 'John Smith',
      outcome: 'successful',
      outcome_notes: 'Customer was impressed with the product capabilities',
      next_action: 'Send formal proposal',
      next_action_date: '2024-01-22T09:00:00Z',
      location: 'Virtual Meeting',
      tags: ['demo', 'product', 'virtual'],
      tenant_id: 'tenant_1',
      created_at: '2024-01-20T11:00:00Z',
      updated_at: '2024-01-20T12:30:00Z',
      created_by: '2'
    },
    {
      id: 'activity_5',
      activity_type: 'follow_up',
      subject: 'Contract Signing Follow-up',
      description: 'Confirmed contract signing and implementation timeline',
      deal_id: 'deal_1',
      customer_id: '1',
      start_date: '2024-01-30T17:00:00Z',
      performed_by: '2',
      performed_by_name: 'Sarah Johnson',
      contact_person: 'John Smith',
      outcome: 'successful',
      outcome_notes: 'Contract signed successfully. Implementation scheduled for Feb 5.',
      tags: ['contract', 'signed', 'implementation'],
      tenant_id: 'tenant_1',
      created_at: '2024-01-30T17:00:00Z',
      updated_at: '2024-01-30T17:00:00Z',
      created_by: '2'
    }
  ];

  async getSalesActivities(filters?: {
    opportunity_id?: string;
    deal_id?: string;
    customer_id?: string;
    performed_by?: string;
    activity_type?: string;
    outcome?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
  }): Promise<SalesActivity[]> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let activities = this.mockActivities.filter(a => a.tenant_id === user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      activities = activities.filter(a => a.performed_by === user.id);
    }

    // Apply filters
    if (filters) {
      if (filters.opportunity_id) {
        activities = activities.filter(a => a.opportunity_id === filters.opportunity_id);
      }
      if (filters.deal_id) {
        activities = activities.filter(a => a.deal_id === filters.deal_id);
      }
      if (filters.customer_id) {
        activities = activities.filter(a => a.customer_id === filters.customer_id);
      }
      if (filters.performed_by) {
        activities = activities.filter(a => a.performed_by === filters.performed_by);
      }
      if (filters.activity_type) {
        activities = activities.filter(a => a.activity_type === filters.activity_type);
      }
      if (filters.outcome) {
        activities = activities.filter(a => a.outcome === filters.outcome);
      }
      if (filters.date_from) {
        activities = activities.filter(a => a.start_date >= filters.date_from!);
      }
      if (filters.date_to) {
        activities = activities.filter(a => a.start_date <= filters.date_to!);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        activities = activities.filter(a =>
          a.subject.toLowerCase().includes(search) ||
          a.description?.toLowerCase().includes(search) ||
          a.outcome_notes?.toLowerCase().includes(search)
        );
      }
    }

    return activities;
  }

  async getSalesActivity(id: string): Promise<SalesActivity> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const activity = this.mockActivities.find(a =>
      a.id === id && a.tenant_id === user.tenant_id
    );

    if (!activity) {
      throw new Error('Sales activity not found');
    }

    // Check permissions
    if (user.role === 'agent' && activity.performed_by !== user.id) {
      throw new Error('Access denied');
    }

    return activity;
  }

  async createSalesActivity(activityData: Omit<SalesActivity, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Promise<SalesActivity> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const newActivity: SalesActivity = {
      ...activityData,
      id: `activity_${Date.now()}`,
      tenant_id: user.tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.mockActivities.push(newActivity);
    return newActivity;
  }

  async updateSalesActivity(id: string, updates: Partial<SalesActivity>): Promise<SalesActivity> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const activityIndex = this.mockActivities.findIndex(a =>
      a.id === id && a.tenant_id === user.tenant_id
    );

    if (activityIndex === -1) {
      throw new Error('Sales activity not found');
    }

    // Check permissions
    if (user.role === 'agent' && this.mockActivities[activityIndex].performed_by !== user.id) {
      throw new Error('Access denied');
    }

    this.mockActivities[activityIndex] = {
      ...this.mockActivities[activityIndex],
      ...updates,
      updated_at: new Date().toISOString()
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
      a.id === id && a.tenant_id === user.tenant_id
    );

    if (activityIndex === -1) {
      throw new Error('Sales activity not found');
    }

    this.mockActivities.splice(activityIndex, 1);
  }

  async getActivityTypes(): Promise<string[]> {
    return ['call', 'meeting', 'email', 'demo', 'proposal', 'follow_up', 'negotiation', 'presentation', 'site_visit', 'other'];
  }

  async getActivityStats(filters?: {
    opportunity_id?: string;
    deal_id?: string;
    customer_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<{
    total: number;
    by_type: Record<string, number>;
    by_outcome: Record<string, number>;
    total_duration: number;
    average_duration: number;
  }> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let activities = this.mockActivities.filter(a => a.tenant_id === user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      activities = activities.filter(a => a.performed_by === user.id);
    }

    // Apply filters
    if (filters) {
      if (filters.opportunity_id) {
        activities = activities.filter(a => a.opportunity_id === filters.opportunity_id);
      }
      if (filters.deal_id) {
        activities = activities.filter(a => a.deal_id === filters.deal_id);
      }
      if (filters.customer_id) {
        activities = activities.filter(a => a.customer_id === filters.customer_id);
      }
      if (filters.date_from) {
        activities = activities.filter(a => a.start_date >= filters.date_from!);
      }
      if (filters.date_to) {
        activities = activities.filter(a => a.start_date <= filters.date_to!);
      }
    }

    const byType: Record<string, number> = {};
    const byOutcome: Record<string, number> = {};
    let totalDuration = 0;

    activities.forEach(activity => {
      byType[activity.activity_type] = (byType[activity.activity_type] || 0) + 1;
      if (activity.outcome) {
        byOutcome[activity.outcome] = (byOutcome[activity.outcome] || 0) + 1;
      }
      if (activity.duration_minutes) {
        totalDuration += activity.duration_minutes;
      }
    });

    const averageDuration = activities.length > 0 ? totalDuration / activities.length : 0;

    return {
      total: activities.length,
      by_type: byType,
      by_outcome: byOutcome,
      total_duration: totalDuration,
      average_duration: averageDuration
    };
  }

  async getActivitiesByOpportunity(opportunityId: string): Promise<SalesActivity[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let activities = this.mockActivities.filter(a =>
      a.tenant_id === user.tenant_id && a.opportunity_id === opportunityId
    );

    // Apply role-based filtering
    if (user.role === 'agent') {
      activities = activities.filter(a => a.performed_by === user.id);
    }

    return activities;
  }

  async getActivitiesByDeal(dealId: string): Promise<SalesActivity[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let activities = this.mockActivities.filter(a =>
      a.tenant_id === user.tenant_id && a.deal_id === dealId
    );

    // Apply role-based filtering
    if (user.role === 'agent') {
      activities = activities.filter(a => a.performed_by === user.id);
    }

    return activities;
  }

  async getActivitiesByCustomer(customerId: string): Promise<SalesActivity[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let activities = this.mockActivities.filter(a =>
      a.tenant_id === user.tenant_id && a.customer_id === customerId
    );

    // Apply role-based filtering
    if (user.role === 'agent') {
      activities = activities.filter(a => a.performed_by === user.id);
    }

    return activities;
  }

  async bulkUpdateActivities(ids: string[], updates: Partial<SalesActivity>): Promise<SalesActivity[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const updatedActivities: SalesActivity[] = [];

    for (const id of ids) {
      try {
        const updated = await this.updateSalesActivity(id, updates);
        updatedActivities.push(updated);
      } catch (error) {
        // Skip activities that can't be updated
        console.warn(`Failed to update activity ${id}:`, error);
      }
    }

    return updatedActivities;
  }

  async searchActivities(query: string): Promise<SalesActivity[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const searchLower = query.toLowerCase();

    let activities = this.mockActivities.filter(a => a.tenant_id === user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      activities = activities.filter(a => a.performed_by === user.id);
    }

    return activities.filter(a =>
      a.subject.toLowerCase().includes(searchLower) ||
      a.description?.toLowerCase().includes(searchLower) ||
      a.outcome_notes?.toLowerCase().includes(searchLower) ||
      a.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  async logActivity(activityData: {
    opportunity_id?: string;
    deal_id?: string;
    customer_id: string;
    activity_type: SalesActivity['activity_type'];
    subject: string;
    description?: string;
    outcome?: SalesActivity['outcome'];
    duration_minutes?: number;
  }): Promise<SalesActivity> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const newActivity: Omit<SalesActivity, 'id' | 'tenant_id' | 'created_at' | 'updated_at'> = {
      ...activityData,
      start_date: new Date().toISOString(),
      performed_by: user.id,
      performed_by_name: user.name,
      attachments: [],
      tags: [],
      created_by: user.id
    };

    return this.createSalesActivity(newActivity);
  }
}

export const salesActivityService = new SalesActivityService();