import { Opportunity, OpportunityItem } from '@/types/crm';
import { authService } from '../serviceFactory';

class OpportunityService {
  private baseUrl = '/api/opportunities';

  // Mock data for demonstration
  private mockOpportunities: Opportunity[] = [
    {
      id: 'opp_1',
      title: 'Enterprise Software Implementation',
      description: 'Large-scale enterprise software deployment for manufacturing company',
      customer_id: '1',
      customer_name: 'TechCorp Industries',
      estimated_value: 250000,
      currency: 'USD',
      probability: 75,
      stage: 'proposal',
      status: 'open',
      source: 'inbound_lead',
      campaign: 'Enterprise_Q4_2024',
      expected_close_date: '2024-03-15',
      last_activity_date: '2024-01-28T14:30:00Z',
      next_activity_date: '2024-02-01T10:00:00Z',
      assigned_to: '2',
      assigned_to_name: 'Sarah Johnson',
      notes: 'High-value opportunity with strong technical fit. Decision maker meeting scheduled.',
      tags: ['enterprise', 'software', 'manufacturing'],
      competitor_info: 'Competing with VendorX, but we have better integration capabilities',
      pain_points: ['Inefficient manual processes', 'Data silos', 'Compliance reporting'],
      requirements: ['API integration', 'Custom reporting', '24/7 support'],
      proposed_items: [
        {
          id: 'opp_item_1_1',
          opportunity_id: 'opp_1',
          product_id: 'prod_1',
          product_name: 'Enterprise Software Suite',
          product_description: 'Complete enterprise software solution',
          quantity: 1,
          unit_price: 200000,
          discount: 20000,
          tax: 14400,
          line_total: 195600
        },
        {
          id: 'opp_item_1_2',
          opportunity_id: 'opp_1',
          product_id: 'prod_2',
          product_name: 'Implementation Services',
          product_description: 'Full implementation and training',
          quantity: 1,
          unit_price: 50000,
          discount: 0,
          tax: 3600,
          line_total: 53600
        }
      ],
      tenant_id: 'tenant_1',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-28T14:30:00Z',
      created_by: '1'
    },
    {
      id: 'opp_2',
      title: 'Cloud Migration Project',
      description: 'Complete cloud migration and modernization project',
      customer_id: '2',
      customer_name: 'Global Logistics Inc',
      estimated_value: 180000,
      currency: 'USD',
      probability: 60,
      stage: 'qualification',
      status: 'open',
      source: 'partner_referral',
      campaign: 'Cloud_Migration_2024',
      expected_close_date: '2024-04-30',
      last_activity_date: '2024-01-25T16:45:00Z',
      next_activity_date: '2024-02-05T14:00:00Z',
      assigned_to: '3',
      assigned_to_name: 'Mike Chen',
      notes: 'Customer interested in reducing infrastructure costs. Need to demonstrate ROI.',
      tags: ['cloud', 'migration', 'cost_savings'],
      competitor_info: 'AWS and Azure are primary competitors',
      pain_points: ['High infrastructure costs', 'Scalability issues', 'Maintenance overhead'],
      requirements: ['Zero downtime migration', 'Cost analysis', 'Performance monitoring'],
      proposed_items: [
        {
          id: 'opp_item_2_1',
          opportunity_id: 'opp_2',
          product_id: 'prod_3',
          product_name: 'Cloud Migration Assessment',
          product_description: 'Comprehensive cloud readiness assessment',
          quantity: 1,
          unit_price: 25000,
          discount: 0,
          tax: 1800,
          line_total: 26800
        },
        {
          id: 'opp_item_2_2',
          opportunity_id: 'opp_2',
          product_id: 'prod_4',
          product_name: 'Cloud Infrastructure Setup',
          product_description: 'Complete cloud infrastructure deployment',
          quantity: 1,
          unit_price: 120000,
          discount: 12000,
          tax: 8640,
          line_total: 116640
        },
        {
          id: 'opp_item_2_3',
          opportunity_id: 'opp_2',
          product_id: 'prod_5',
          product_name: 'Migration Services',
          product_description: 'Data migration and application modernization',
          quantity: 1,
          unit_price: 35000,
          discount: 0,
          tax: 2520,
          line_total: 37520
        }
      ],
      tenant_id: 'tenant_1',
      created_at: '2024-01-10T09:15:00Z',
      updated_at: '2024-01-25T16:45:00Z',
      created_by: '1'
    },
    {
      id: 'opp_3',
      title: 'Startup Digital Transformation',
      description: 'Complete digital transformation for growing startup',
      customer_id: '3',
      customer_name: 'InnovateNow',
      estimated_value: 75000,
      currency: 'USD',
      probability: 40,
      stage: 'prospecting',
      status: 'open',
      source: 'event',
      campaign: 'Startup_Acceleration_2024',
      expected_close_date: '2024-05-15',
      last_activity_date: '2024-01-26T09:30:00Z',
      next_activity_date: '2024-02-02T11:00:00Z',
      assigned_to: '2',
      assigned_to_name: 'Sarah Johnson',
      notes: 'Early-stage startup looking to scale. Met at industry conference.',
      tags: ['startup', 'digital_transformation', 'scaling'],
      competitor_info: 'Several smaller consulting firms',
      pain_points: ['Manual processes', 'Growth scaling issues', 'Technology gaps'],
      requirements: ['Scalable architecture', 'Automation tools', 'Growth planning'],
      proposed_items: [
        {
          id: 'opp_item_3_1',
          opportunity_id: 'opp_3',
          product_id: 'prod_6',
          product_name: 'Digital Strategy Consulting',
          product_description: 'Strategic digital transformation planning',
          quantity: 1,
          unit_price: 30000,
          discount: 3000,
          tax: 2160,
          line_total: 29160
        },
        {
          id: 'opp_item_3_2',
          opportunity_id: 'opp_3',
          product_id: 'prod_7',
          product_name: 'Technology Implementation',
          product_description: 'Core technology stack implementation',
          quantity: 1,
          unit_price: 45000,
          discount: 0,
          tax: 3240,
          line_total: 48240
        }
      ],
      tenant_id: 'tenant_1',
      created_at: '2024-01-25T11:20:00Z',
      updated_at: '2024-01-26T09:30:00Z',
      created_by: '1'
    }
  ];

  async getOpportunities(filters?: {
    stage?: string;
    status?: string;
    assigned_to?: string;
    customer_id?: string;
    search?: string;
    probability_min?: number;
    probability_max?: number;
  }): Promise<Opportunity[]> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let opportunities = this.mockOpportunities.filter(o => o.tenant_id === user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      opportunities = opportunities.filter(o => o.assigned_to === user.id);
    }

    // Apply filters
    if (filters) {
      if (filters.stage) {
        opportunities = opportunities.filter(o => o.stage === filters.stage);
      }
      if (filters.status) {
        opportunities = opportunities.filter(o => o.status === filters.status);
      }
      if (filters.assigned_to) {
        opportunities = opportunities.filter(o => o.assigned_to === filters.assigned_to);
      }
      if (filters.customer_id) {
        opportunities = opportunities.filter(o => o.customer_id === filters.customer_id);
      }
      if (filters.probability_min !== undefined) {
        opportunities = opportunities.filter(o => o.probability >= filters.probability_min!);
      }
      if (filters.probability_max !== undefined) {
        opportunities = opportunities.filter(o => o.probability <= filters.probability_max!);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        opportunities = opportunities.filter(o =>
          o.title.toLowerCase().includes(search) ||
          o.description?.toLowerCase().includes(search) ||
          o.customer_name?.toLowerCase().includes(search)
        );
      }
    }

    return opportunities;
  }

  async getOpportunity(id: string): Promise<Opportunity> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const opportunity = this.mockOpportunities.find(o =>
      o.id === id && o.tenant_id === user.tenant_id
    );

    if (!opportunity) {
      throw new Error('Opportunity not found');
    }

    // Check permissions
    if (user.role === 'agent' && opportunity.assigned_to !== user.id) {
      throw new Error('Access denied');
    }

    return opportunity;
  }

  async createOpportunity(opportunityData: Omit<Opportunity, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Promise<Opportunity> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const newOpportunity: Opportunity = {
      ...opportunityData,
      id: `opp_${Date.now()}`,
      tenant_id: user.tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.mockOpportunities.push(newOpportunity);
    return newOpportunity;
  }

  async updateOpportunity(id: string, updates: Partial<Opportunity>): Promise<Opportunity> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const opportunityIndex = this.mockOpportunities.findIndex(o =>
      o.id === id && o.tenant_id === user.tenant_id
    );

    if (opportunityIndex === -1) {
      throw new Error('Opportunity not found');
    }

    // Check permissions
    if (user.role === 'agent' && this.mockOpportunities[opportunityIndex].assigned_to !== user.id) {
      throw new Error('Access denied');
    }

    this.mockOpportunities[opportunityIndex] = {
      ...this.mockOpportunities[opportunityIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    return this.mockOpportunities[opportunityIndex];
  }

  async deleteOpportunity(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('delete')) {
      throw new Error('Insufficient permissions');
    }

    const opportunityIndex = this.mockOpportunities.findIndex(o =>
      o.id === id && o.tenant_id === user.tenant_id
    );

    if (opportunityIndex === -1) {
      throw new Error('Opportunity not found');
    }

    this.mockOpportunities.splice(opportunityIndex, 1);
  }

  async getOpportunityStages(): Promise<string[]> {
    return ['prospecting', 'qualification', 'needs_analysis', 'proposal', 'negotiation', 'decision', 'contract'];
  }

  async getOpportunityStats(): Promise<{
    total: number;
    by_stage: Record<string, number>;
    by_status: Record<string, number>;
    total_value: number;
    average_probability: number;
  }> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let opportunities = this.mockOpportunities.filter(o => o.tenant_id === user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      opportunities = opportunities.filter(o => o.assigned_to === user.id);
    }

    const byStage: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalValue = 0;
    let totalProbability = 0;

    opportunities.forEach(opp => {
      byStage[opp.stage] = (byStage[opp.stage] || 0) + 1;
      byStatus[opp.status] = (byStatus[opp.status] || 0) + 1;
      totalValue += opp.estimated_value;
      totalProbability += opp.probability;
    });

    return {
      total: opportunities.length,
      by_stage: byStage,
      by_status: byStatus,
      total_value: totalValue,
      average_probability: opportunities.length > 0 ? totalProbability / opportunities.length : 0
    };
  }

  async convertToDeal(opportunityId: string, dealData: {
    close_date: string;
    win_loss_reason?: string;
    final_items?: OpportunityItem[];
  }): Promise<{ opportunity: Opportunity; deal: any }> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const opportunity = await this.getOpportunity(opportunityId);

    // Update opportunity status
    const updatedOpportunity = await this.updateOpportunity(opportunityId, {
      status: 'won',
      converted_to_deal_id: `deal_${Date.now()}`
    });

    // Create deal (this would normally call the deal service)
    const deal = {
      id: updatedOpportunity.converted_to_deal_id,
      title: opportunity.title,
      description: opportunity.description,
      customer_id: opportunity.customer_id,
      value: opportunity.estimated_value,
      currency: opportunity.currency,
      status: 'won' as const,
      source: opportunity.source,
      campaign: opportunity.campaign,
      close_date: dealData.close_date,
      expected_close_date: opportunity.expected_close_date,
      assigned_to: opportunity.assigned_to,
      notes: opportunity.notes,
      tags: opportunity.tags,
      competitor_info: opportunity.competitor_info,
      win_loss_reason: dealData.win_loss_reason,
      items: dealData.final_items || opportunity.proposed_items,
      opportunity_id: opportunityId,
      tenant_id: opportunity.tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: user.id
    };

    return { opportunity: updatedOpportunity, deal };
  }

  async updateStage(id: string, stage: string): Promise<Opportunity> {
    return this.updateOpportunity(id, { stage: stage as any });
  }

  async updateProbability(id: string, probability: number): Promise<Opportunity> {
    return this.updateOpportunity(id, { probability });
  }

  async bulkUpdateOpportunities(ids: string[], updates: Partial<Opportunity>): Promise<Opportunity[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const updatedOpportunities: Opportunity[] = [];

    for (const id of ids) {
      try {
        const updated = await this.updateOpportunity(id, updates);
        updatedOpportunities.push(updated);
      } catch (error) {
        // Skip opportunities that can't be updated
        console.warn(`Failed to update opportunity ${id}:`, error);
      }
    }

    return updatedOpportunities;
  }

  async searchOpportunities(query: string): Promise<Opportunity[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const searchLower = query.toLowerCase();

    let opportunities = this.mockOpportunities.filter(o => o.tenant_id === user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      opportunities = opportunities.filter(o => o.assigned_to === user.id);
    }

    return opportunities.filter(o =>
      o.title.toLowerCase().includes(searchLower) ||
      o.description?.toLowerCase().includes(searchLower) ||
      o.customer_name?.toLowerCase().includes(searchLower) ||
      o.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }
}

export const opportunityService = new OpportunityService();