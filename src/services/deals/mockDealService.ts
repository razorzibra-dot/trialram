import { Deal, DealItem } from '@/types/crm';
import { authService } from '../serviceFactory';

class MockDealService {
  private baseUrl = '/api/deals';

  // Mock data for demonstration
  private mockDeals: Deal[] = [
    {
      id: 'deal_1',
      deal_number: 'D-2024-0001',
      title: 'Enterprise Software License',
      description: 'Annual enterprise software license with premium support',
      customer_id: '1',
      customer_name: 'TechCorp Industries',
      value: 150000,
      currency: 'USD',
      status: 'won',
      source: 'direct_sales',
      campaign: 'Q1_Enterprise_Push',
      close_date: '2024-01-30',
      expected_close_date: '2024-02-15',
      assigned_to: '2',
      assigned_to_name: 'Sarah Johnson',
      notes: 'Successfully closed. Customer signed contract. Implementation starts Feb 5.',
      tags: ['enterprise', 'software', 'won', 'large_deal'],
      competitor_info: 'Competed with VendorX but won on integration capabilities',
      win_loss_reason: 'Superior integration capabilities and better pricing',
      items: [
        {
          id: 'deal_item_1_1',
          deal_id: 'deal_1',
          product_id: 'prod_1',
          product_name: 'Enterprise Software Suite - Annual License',
          product_description: 'Full enterprise software suite with all modules',
          quantity: 1,
          unit_price: 120000,
          discount: 10000,
          tax: 8000,
          line_total: 118000
        },
        {
          id: 'deal_item_1_2',
          deal_id: 'deal_1',
          product_id: 'prod_2',
          product_name: 'Premium Support Package',
          product_description: '24/7 technical support and maintenance',
          quantity: 1,
          unit_price: 30000,
          discount: 0,
          tax: 2000,
          line_total: 32000
        }
      ],
      opportunity_id: 'opp_1',
      tenant_id: 'tenant_1',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-30T17:00:00Z',
      created_by: '1'
    },
    {
      id: 'deal_2',
      deal_number: 'D-2024-0002',
      title: 'Cloud Migration Services',
      description: 'Complete cloud migration and optimization services',
      customer_id: '2',
      customer_name: 'Global Logistics Inc',
      value: 85000,
      currency: 'USD',
      status: 'won',
      source: 'existing_customer',
      campaign: 'Cloud_Migration_Q2',
      close_date: '2024-02-10',
      expected_close_date: '2024-02-28',
      assigned_to: '3',
      assigned_to_name: 'Mike Chen',
      notes: 'Successfully migrated all systems. Customer very satisfied with the process.',
      tags: ['cloud', 'migration', 'services', 'existing_customer'],
      competitor_info: 'No direct competition - customer chose us for reliability',
      win_loss_reason: 'Proven track record and comprehensive migration plan',
      items: [
        {
          id: 'deal_item_2_1',
          deal_id: 'deal_2',
          product_id: 'prod_3',
          product_name: 'Cloud Migration Assessment',
          product_description: 'Comprehensive cloud readiness assessment',
          quantity: 1,
          unit_price: 15000,
          discount: 0,
          tax: 1200,
          line_total: 16200
        },
        {
          id: 'deal_item_2_2',
          deal_id: 'deal_2',
          product_id: 'prod_4',
          product_name: 'Cloud Infrastructure Setup',
          product_description: 'Complete cloud infrastructure deployment',
          quantity: 1,
          unit_price: 50000,
          discount: 5000,
          tax: 3600,
          line_total: 48600
        },
        {
          id: 'deal_item_2_3',
          deal_id: 'deal_2',
          product_id: 'prod_5',
          product_name: 'Migration Execution Services',
          product_description: 'Data migration and application deployment',
          quantity: 1,
          unit_price: 20000,
          discount: 0,
          tax: 1600,
          line_total: 21600
        }
      ],
      opportunity_id: 'opp_2',
      tenant_id: 'tenant_1',
      created_at: '2024-01-10T09:15:00Z',
      updated_at: '2024-02-10T14:30:00Z',
      created_by: '1'
    },
    {
      id: 'deal_3',
      deal_number: 'D-2024-0003',
      title: 'Digital Transformation Package',
      description: 'Complete digital transformation for growing startup',
      customer_id: '3',
      customer_name: 'InnovateNow',
      value: 65000,
      currency: 'USD',
      status: 'lost',
      source: 'event',
      campaign: 'Startup_Acceleration_2024',
      close_date: '2024-02-20',
      expected_close_date: '2024-03-10',
      assigned_to: '2',
      assigned_to_name: 'Sarah Johnson',
      notes: 'Lost to competitor due to budget constraints. Customer chose a smaller vendor.',
      tags: ['startup', 'digital_transformation', 'lost'],
      competitor_info: 'Lost to CompetitorXYZ - smaller, more affordable solution',
      win_loss_reason: 'Budget constraints - customer needed more affordable solution',
      items: [],
      opportunity_id: 'opp_3',
      tenant_id: 'tenant_1',
      created_at: '2024-01-25T11:20:00Z',
      updated_at: '2024-02-20T16:45:00Z',
      created_by: '1'
    }
  ];

  async getDeals(filters?: {
    status?: string;
    assigned_to?: string;
    customer_id?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<Deal[]> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let deals = this.mockDeals.filter(d => d.tenant_id === user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      deals = deals.filter(d => d.assigned_to === user.id);
    }

    // Apply filters
    if (filters) {
      if (filters.status) {
        deals = deals.filter(d => d.status === filters.status);
      }
      if (filters.assigned_to) {
        deals = deals.filter(d => d.assigned_to === filters.assigned_to);
      }
      if (filters.customer_id) {
        deals = deals.filter(d => d.customer_id === filters.customer_id);
      }
      if (filters.date_from) {
        deals = deals.filter(d => d.close_date >= filters.date_from!);
      }
      if (filters.date_to) {
        deals = deals.filter(d => d.close_date <= filters.date_to!);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        deals = deals.filter(d =>
          d.title.toLowerCase().includes(search) ||
          d.description?.toLowerCase().includes(search) ||
          d.customer_name?.toLowerCase().includes(search) ||
          d.deal_number?.toLowerCase().includes(search)
        );
      }
    }

    return deals;
  }

  async getDeal(id: string): Promise<Deal> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const deal = this.mockDeals.find(d =>
      d.id === id && d.tenant_id === user.tenant_id
    );

    if (!deal) {
      throw new Error('Deal not found');
    }

    // Check permissions
    if (user.role === 'agent' && deal.assigned_to !== user.id) {
      throw new Error('Access denied');
    }

    return deal;
  }

  async createDeal(dealData: Omit<Deal, 'id' | 'deal_number' | 'tenant_id' | 'created_at' | 'updated_at'>): Promise<Deal> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const dealNumber = `D-${new Date().getFullYear()}-${String(this.mockDeals.length + 1).padStart(4, '0')}`;

    const newDeal: Deal = {
      ...dealData,
      id: `deal_${Date.now()}`,
      deal_number: dealNumber,
      tenant_id: user.tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.mockDeals.push(newDeal);
    return newDeal;
  }

  async updateDeal(id: string, updates: Partial<Deal>): Promise<Deal> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const dealIndex = this.mockDeals.findIndex(d =>
      d.id === id && d.tenant_id === user.tenant_id
    );

    if (dealIndex === -1) {
      throw new Error('Deal not found');
    }

    // Check permissions
    if (user.role === 'agent' && this.mockDeals[dealIndex].assigned_to !== user.id) {
      throw new Error('Access denied');
    }

    this.mockDeals[dealIndex] = {
      ...this.mockDeals[dealIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    return this.mockDeals[dealIndex];
  }

  async deleteDeal(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('delete')) {
      throw new Error('Insufficient permissions');
    }

    const dealIndex = this.mockDeals.findIndex(d =>
      d.id === id && d.tenant_id === user.tenant_id
    );

    if (dealIndex === -1) {
      throw new Error('Deal not found');
    }

    this.mockDeals.splice(dealIndex, 1);
  }

  async getDealStats(): Promise<{
    total: number;
    won: number;
    lost: number;
    cancelled: number;
    total_value: number;
    won_value: number;
    average_deal_size: number;
    win_rate: number;
  }> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let deals = this.mockDeals.filter(d => d.tenant_id === user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      deals = deals.filter(d => d.assigned_to === user.id);
    }

    const wonDeals = deals.filter(d => d.status === 'won');
    const lostDeals = deals.filter(d => d.status === 'lost');
    const cancelledDeals = deals.filter(d => d.status === 'cancelled');

    const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
    const wonValue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);
    const averageDealSize = wonDeals.length > 0 ? wonValue / wonDeals.length : 0;
    const winRate = deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0;

    return {
      total: deals.length,
      won: wonDeals.length,
      lost: lostDeals.length,
      cancelled: cancelledDeals.length,
      total_value: totalValue,
      won_value: wonValue,
      average_deal_size: averageDealSize,
      win_rate: winRate
    };
  }

  async getDealsByCustomer(customerId: string): Promise<Deal[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let deals = this.mockDeals.filter(d =>
      d.tenant_id === user.tenant_id && d.customer_id === customerId
    );

    // Apply role-based filtering
    if (user.role === 'agent') {
      deals = deals.filter(d => d.assigned_to === user.id);
    }

    return deals;
  }

  async getDealsByTimeframe(startDate: string, endDate: string): Promise<Deal[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let deals = this.mockDeals.filter(d =>
      d.tenant_id === user.tenant_id &&
      d.close_date >= startDate &&
      d.close_date <= endDate
    );

    // Apply role-based filtering
    if (user.role === 'agent') {
      deals = deals.filter(d => d.assigned_to === user.id);
    }

    return deals;
  }

  async bulkUpdateDeals(ids: string[], updates: Partial<Deal>): Promise<Deal[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const updatedDeals: Deal[] = [];

    for (const id of ids) {
      try {
        const updated = await this.updateDeal(id, updates);
        updatedDeals.push(updated);
      } catch (error) {
        // Skip deals that can't be updated
        console.warn(`Failed to update deal ${id}:`, error);
      }
    }

    return updatedDeals;
  }

  async searchDeals(query: string): Promise<Deal[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const searchLower = query.toLowerCase();

    let deals = this.mockDeals.filter(d => d.tenant_id === user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      deals = deals.filter(d => d.assigned_to === user.id);
    }

    return deals.filter(d =>
      d.title.toLowerCase().includes(searchLower) ||
      d.description?.toLowerCase().includes(searchLower) ||
      d.customer_name?.toLowerCase().includes(searchLower) ||
      d.deal_number?.toLowerCase().includes(searchLower) ||
      d.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  async exportDeals(format: 'csv' | 'json' = 'csv'): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let deals = this.mockDeals.filter(d => d.tenant_id === user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      deals = deals.filter(d => d.assigned_to === user.id);
    }

    if (format === 'csv') {
      const headers = ['Deal Number', 'Title', 'Customer', 'Value', 'Status', 'Close Date', 'Assigned To'];
      const rows = deals.map(d => [
        d.deal_number,
        d.title,
        d.customer_name,
        d.value,
        d.status,
        d.close_date,
        d.assigned_to_name
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      return csvContent;
    } else {
      return JSON.stringify(deals, null, 2);
    }
  }
}

export const mockDealService = new MockDealService();