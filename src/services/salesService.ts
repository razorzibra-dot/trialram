import { Deal } from '@/types/crm';
import { authService } from './authService';

class SalesService {
  private baseUrl = '/api/deals';

  // Mock data for demonstration
  private mockDeals: Deal[] = [
    {
      id: '1',
      title: 'Enterprise Software License',
      customer_id: '1',
      customer_name: 'TechCorp Solutions',
      value: 150000,
      amount: 150000,
      currency: 'USD',
      stage: 'negotiation',
      status: 'open',
      probability: 75,
      expected_close_date: '2024-02-15',
      actual_close_date: '',
      last_activity_date: '2024-01-28T14:30:00Z',
      next_activity_date: '2024-02-01T10:00:00Z',
      description: 'Annual enterprise software license with premium support',
      source: 'direct_sales',
      campaign: 'Q1_Enterprise_Push',
      notes: 'High-value prospect with strong technical alignment. Decision maker meeting scheduled.',
      assigned_to: '2',
      assigned_to_name: 'Sarah Manager',
      tags: ['enterprise', 'software', 'annual'],
      items: [
        {
          id: 'item_1_1',
          sale_id: '1',
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
          id: 'item_1_2',
          sale_id: '1',
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
      tenant_id: 'tenant_1',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-28T14:30:00Z',
      created_by: '1'
    },
    {
      id: '2',
      title: 'Manufacturing Equipment',
      customer_id: '2',
      customer_name: 'Global Manufacturing Inc',
      value: 75000,
      amount: 75000,
      currency: 'USD',
      stage: 'proposal',
      status: 'open',
      probability: 60,
      expected_close_date: '2024-02-28',
      actual_close_date: '',
      last_activity_date: '2024-01-25T16:45:00Z',
      next_activity_date: '2024-02-05T14:00:00Z',
      description: 'Custom manufacturing equipment with installation',
      source: 'partner_referral',
      campaign: 'Equipment_Sales_2024',
      notes: 'Waiting for technical specifications approval from engineering team.',
      assigned_to: '3',
      assigned_to_name: 'Mike Agent',
      tags: ['equipment', 'manufacturing', 'installation'],
      items: [
        {
          id: 'item_2_1',
          sale_id: '2',
          product_id: 'prod_3',
          product_name: 'CNC Precision Lathe',
          product_description: 'High-precision CNC turning center for manufacturing',
          quantity: 1,
          unit_price: 50000,
          discount: 5000,
          tax: 3000,
          line_total: 48000
        },
        {
          id: 'item_2_2',
          sale_id: '2',
          product_id: 'prod_4',
          product_name: 'Installation and Training Service',
          product_description: 'Complete installation, calibration, and operator training',
          quantity: 1,
          unit_price: 25000,
          discount: 0,
          tax: 2000,
          line_total: 27000
        }
      ],
      tenant_id: 'tenant_1',
      created_at: '2024-01-10T09:15:00Z',
      updated_at: '2024-01-25T16:45:00Z',
      created_by: '1'
    },
    {
      id: '3',
      title: 'Startup Package',
      customer_id: '3',
      customer_name: 'StartupXYZ',
      value: 25000,
      amount: 25000,
      currency: 'USD',
      stage: 'qualified',
      status: 'open',
      probability: 40,
      expected_close_date: '2024-03-10',
      actual_close_date: '',
      last_activity_date: '2024-01-26T09:30:00Z',
      next_activity_date: '2024-02-02T11:00:00Z',
      description: 'Startup package with consulting services',
      source: 'event',
      campaign: 'Startup_Week_2024',
      notes: 'Met at startup conference. Founder very interested in our services.',
      assigned_to: '2',
      assigned_to_name: 'Sarah Manager',
      tags: ['startup', 'consulting', 'small_deal'],
      items: [],
      tenant_id: 'tenant_1',
      created_at: '2024-01-25T11:20:00Z',
      updated_at: '2024-01-26T09:30:00Z',
      created_by: '1'
    },
    {
      id: '4',
      title: 'Retail Integration Platform',
      customer_id: '4',
      customer_name: 'Retail Giants Ltd',
      value: 200000,
      amount: 200000,
      currency: 'USD',
      stage: 'closed_won',
      status: 'won',
      probability: 100,
      expected_close_date: '2024-01-30',
      actual_close_date: '2024-01-30T17:00:00Z',
      last_activity_date: '2024-01-30T17:00:00Z',
      next_activity_date: '',
      description: 'Complete retail integration platform with analytics',
      source: 'inbound_lead',
      campaign: 'Retail_Solutions',
      notes: 'Successfully closed. Customer signed contract. Implementation starts Feb 5.',
      assigned_to: '1',
      assigned_to_name: 'John Admin',
      tags: ['retail', 'integration', 'won', 'large_deal'],
      items: [],
      tenant_id: 'tenant_1',
      created_at: '2024-01-05T08:30:00Z',
      updated_at: '2024-01-30T17:00:00Z',
      created_by: '1'
    },
    {
      id: '5',
      title: 'Cloud Migration Services',
      customer_id: '1',
      customer_name: 'TechCorp Solutions',
      value: 85000,
      amount: 85000,
      currency: 'USD',
      stage: 'lead',
      status: 'open',
      probability: 20,
      expected_close_date: '2024-04-15',
      actual_close_date: '',
      last_activity_date: '2024-01-28T15:45:00Z',
      next_activity_date: '2024-02-10T09:00:00Z',
      description: 'Complete cloud migration and optimization services',
      source: 'existing_customer',
      campaign: 'Cloud_Migration_Q2',
      notes: 'Initial discovery call completed. Waiting for IT director availability for technical discussion.',
      assigned_to: '3',
      assigned_to_name: 'Mike Agent',
      tags: ['cloud', 'migration', 'services', 'existing_customer'],
      items: [],
      tenant_id: 'tenant_1',
      created_at: '2024-01-28T15:45:00Z',
      updated_at: '2024-01-28T15:45:00Z',
      created_by: '1'
    }
  ];

  async getDeals(filters?: {
    stage?: string;
    assigned_to?: string;
    customer_id?: string;
    search?: string;
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
      if (filters.stage) {
        deals = deals.filter(d => d.stage === filters.stage);
      }
      if (filters.assigned_to) {
        deals = deals.filter(d => d.assigned_to === filters.assigned_to);
      }
      if (filters.customer_id) {
        deals = deals.filter(d => d.customer_id === filters.customer_id);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        deals = deals.filter(d => 
          d.title.toLowerCase().includes(search) ||
          d.customer_name?.toLowerCase().includes(search) ||
          d.description.toLowerCase().includes(search)
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

  async createDeal(dealData: Omit<Deal, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Promise<Deal> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const newDeal: Deal = {
      ...dealData,
      id: Date.now().toString(),
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

  async getStages(): Promise<string[]> {
    return ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
  }

  async getPipelineStats(): Promise<{
    stage: string;
    count: number;
    value: number;
  }[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let deals = this.mockDeals.filter(d => d.tenant_id === user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      deals = deals.filter(d => d.assigned_to === user.id);
    }

    const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    
    return stages.map(stage => {
      const stageDeals = deals.filter(d => d.stage === stage);
      return {
        stage,
        count: stageDeals.length,
        value: stageDeals.reduce((sum, deal) => sum + deal.value, 0)
      };
    });
  }

  // Interface compliance methods - aliases for existing methods
  async getSales(filters?: Record<string, unknown>): Promise<Deal[]> {
    return this.getDeals(filters);
  }

  async getSale(id: string): Promise<Deal> {
    return this.getDeal(id);
  }

  async createSale(data: Record<string, unknown>): Promise<Deal> {
    return this.createDeal(data);
  }

  async updateSale(id: string, data: Record<string, unknown>): Promise<Deal> {
    return this.updateDeal(id, data);
  }

  async deleteSale(id: string): Promise<void> {
    return this.deleteDeal(id);
  }

  async getPipelineStages(): Promise<Array<{ id: string; name: string; order: number }>> {
    const stages = await this.getStages();
    return stages.map(stage => ({ id: stage, name: stage, order: stages.indexOf(stage) }));
  }

  async getSalesAnalytics(period?: string): Promise<Record<string, unknown>> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let deals = this.mockDeals.filter(d => d.tenant_id === user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      deals = deals.filter(d => d.assigned_to === user.id);
    }

    const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
    const wonDeals = deals.filter(d => d.stage === 'closed_won');
    const lostDeals = deals.filter(d => d.stage === 'closed_lost');
    const activeDeals = deals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage));

    return {
      totalDeals: deals.length,
      totalValue,
      wonDeals: wonDeals.length,
      wonValue: wonDeals.reduce((sum, deal) => sum + deal.value, 0),
      lostDeals: lostDeals.length,
      lostValue: lostDeals.reduce((sum, deal) => sum + deal.value, 0),
      activeDeals: activeDeals.length,
      activeValue: activeDeals.reduce((sum, deal) => sum + deal.value, 0),
      conversionRate: deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0,
      averageDealSize: wonDeals.length > 0 ? wonDeals.reduce((sum, deal) => sum + deal.value, 0) / wonDeals.length : 0
    };
  }

  // ============================================================
  // Missing methods for hook compliance
  // ============================================================

  async getDealsByCustomer(customerId: string, filters?: Record<string, unknown>): Promise<{ data: Deal[], page: number, pageSize: number, total: number, totalPages: number }> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let deals = this.mockDeals.filter(d => 
      d.tenant_id === user.tenant_id && d.customer_id === customerId
    );

    // Apply role-based filtering
    if (user.role === 'agent') {
      deals = deals.filter(d => d.assigned_to === user.id);
    }

    return {
      data: deals,
      page: 1,
      pageSize: deals.length,
      total: deals.length,
      totalPages: 1
    };
  }

  async getSalesStats(): Promise<Record<string, unknown>> {
    return this.getSalesAnalytics();
  }

  async getDealStages(): Promise<string[]> {
    return this.getStages();
  }

  async updateDealStage(id: string, stage: string): Promise<Deal> {
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

    this.mockDeals[dealIndex] = {
      ...this.mockDeals[dealIndex],
      stage,
      updated_at: new Date().toISOString()
    };

    return this.mockDeals[dealIndex];
  }

  async bulkUpdateDeals(ids: string[], updates: Record<string, unknown>): Promise<Deal[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const updatedDeals: Deal[] = [];
    
    for (const id of ids) {
      const dealIndex = this.mockDeals.findIndex(d => 
        d.id === id && d.tenant_id === user.tenant_id
      );

      if (dealIndex !== -1) {
        this.mockDeals[dealIndex] = {
          ...this.mockDeals[dealIndex],
          ...updates,
          updated_at: new Date().toISOString()
        };
        updatedDeals.push(this.mockDeals[dealIndex]);
      }
    }

    return updatedDeals;
  }

  async bulkDeleteDeals(ids: string[]): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('delete')) {
      throw new Error('Insufficient permissions');
    }

    for (const id of ids) {
      const dealIndex = this.mockDeals.findIndex(d => 
        d.id === id && d.tenant_id === user.tenant_id
      );

      if (dealIndex !== -1) {
        this.mockDeals.splice(dealIndex, 1);
      }
    }
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

    // Search across title, customer_name, and description
    return deals.filter(d =>
      d.title.toLowerCase().includes(searchLower) ||
      d.customer_name?.toLowerCase().includes(searchLower) ||
      d.description.toLowerCase().includes(searchLower)
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
      // CSV format
      const headers = ['ID', 'Title', 'Customer', 'Value', 'Stage', 'Status', 'Probability', 'Assigned To'];
      const rows = deals.map(d => [
        d.id,
        d.title,
        d.customer_name,
        d.value,
        d.stage,
        d.status,
        d.probability,
        d.assigned_to_name
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      return csvContent;
    } else {
      // JSON format
      return JSON.stringify(deals, null, 2);
    }
  }

  async importDeals(csv: string): Promise<{ success: number; errors: string[] }> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const errors: string[] = [];
    let success = 0;
    const lines = csv.trim().split('\n');
    
    // Skip header
    const dataLines = lines.slice(1);

    for (let i = 0; i < dataLines.length; i++) {
      try {
        const values = dataLines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const [id, title, customerName, value, stage, status, probability, assignedToName] = values;

        if (!title || !customerName) {
          errors.push(`Row ${i + 2}: Missing required fields (title or customer)`);
          continue;
        }

        const newDeal: Deal = {
          id: Date.now().toString() + Math.random(),
          title,
          customer_id: 'imported',
          customer_name: customerName,
          value: parseInt(value) || 0,
          amount: parseInt(value) || 0,
          currency: 'USD',
          stage: stage || 'lead',
          status: status || 'open',
          probability: parseInt(probability) || 50,
          expected_close_date: '',
          actual_close_date: '',
          last_activity_date: new Date().toISOString(),
          next_activity_date: '',
          description: '',
          source: 'import',
          campaign: '',
          notes: `Imported from CSV on ${new Date().toLocaleDateString()}`,
          assigned_to: user.id,
          assigned_to_name: assignedToName || 'Unassigned',
          tags: ['imported'],
          items: [],
          tenant_id: user.tenant_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: user.id
        };

        this.mockDeals.push(newDeal);
        success++;
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { success, errors };
  }
}

export const salesService = new SalesService();