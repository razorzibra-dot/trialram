import { Deal, RevenueRecognitionSchedule } from '@/types/crm';
import { authService } from '../serviceFactory';
import { contractService } from '../contract/contractService';

class SalesService {
  private baseUrl = '/api/deals';

  // Mock data for demonstration - Closed Deals
  private mockDeals: Deal[] = [
    {
      id: '1',
      deal_number: 'DEAL-2024-001',
      title: 'Enterprise Software License',
      customer_id: '1',
      value: 150000,
      currency: 'USD',
      status: 'won',
      source: 'direct_sales',
      campaign: 'Q1_Enterprise_Push',
      close_date: '2024-01-30T17:00:00Z',
      expected_close_date: '2024-02-15',
      assigned_to: '2',
      tags: ['enterprise', 'software', 'annual'],
      notes: 'Successfully closed enterprise software license deal with premium support package',
      win_loss_reason: 'Strong technical alignment and competitive pricing',
      items: [
        {
          id: 'item_1_1',
          deal_id: '1',
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
          deal_id: '1',
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
      contract_id: 'contract_001',
      payment_terms: 'net_30',
      payment_status: 'paid',
      payment_due_date: '2024-03-01',
      paid_amount: 150000,
      outstanding_amount: 0,
      payment_method: 'bank_transfer',
      revenue_recognized: 150000,
      revenue_recognition_status: 'completed',
      revenue_recognition_method: 'immediate',
      tenant_id: 'tenant_1',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-30T17:00:00Z',
      created_by: '1'
    },
    {
      id: '2',
      deal_number: 'DEAL-2024-002',
      title: 'Manufacturing Equipment',
      customer_id: '2',
      value: 75000,
      currency: 'USD',
      status: 'won',
      source: 'partner_referral',
      campaign: 'Equipment_Sales_2024',
      close_date: '2024-02-15T14:00:00Z',
      expected_close_date: '2024-02-28',
      assigned_to: '3',
      tags: ['equipment', 'manufacturing', 'installation'],
      notes: 'Successfully closed manufacturing equipment deal with installation services',
      win_loss_reason: 'Competitive pricing and strong partnership relationship',
      items: [
        {
          id: 'item_2_1',
          deal_id: '2',
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
          deal_id: '2',
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
      contract_id: 'contract_002',
      payment_terms: 'net_60',
      payment_status: 'partial',
      payment_due_date: '2024-04-15',
      paid_amount: 37500,
      outstanding_amount: 37500,
      payment_method: 'bank_transfer',
      revenue_recognized: 37500,
      revenue_recognition_status: 'in_progress',
      revenue_recognition_method: 'installments',
      recognition_schedule: [
        {
          id: 'rec_2_1',
          deal_id: '2',
          installment_number: 1,
          amount: 37500,
          recognized_amount: 37500,
          recognition_date: '2024-02-15',
          actual_recognition_date: '2024-02-15',
          status: 'recognized',
          description: 'Initial payment and delivery',
          tenant_id: 'tenant_1',
          created_at: '2024-02-15T14:00:00Z',
          updated_at: '2024-02-15T14:00:00Z'
        },
        {
          id: 'rec_2_2',
          deal_id: '2',
          installment_number: 2,
          amount: 37500,
          recognized_amount: 0,
          recognition_date: '2024-04-15',
          status: 'pending',
          description: 'Final payment after installation completion',
          tenant_id: 'tenant_1',
          created_at: '2024-02-15T14:00:00Z',
          updated_at: '2024-02-15T14:00:00Z'
        }
      ],
      tenant_id: 'tenant_1',
      created_at: '2024-01-10T09:15:00Z',
      updated_at: '2024-02-15T14:00:00Z',
      created_by: '1'
    },
    {
      id: '3',
      deal_number: 'DEAL-2024-003',
      title: 'Startup Package',
      customer_id: '3',
      value: 25000,
      currency: 'USD',
      status: 'lost',
      source: 'event',
      campaign: 'Startup_Week_2024',
      close_date: '2024-02-20T10:00:00Z',
      expected_close_date: '2024-03-10',
      assigned_to: '2',
      tags: ['startup', 'consulting', 'small_deal'],
      notes: 'Lost deal - customer chose competitor with lower pricing',
      win_loss_reason: 'Pricing competition - customer selected lower-cost alternative',
      items: [],
      payment_terms: 'cod',
      payment_status: 'pending',
      revenue_recognized: 0,
      revenue_recognition_status: 'not_started',
      tenant_id: 'tenant_1',
      created_at: '2024-01-25T11:20:00Z',
      updated_at: '2024-02-20T10:00:00Z',
      created_by: '1'
    },
    {
      id: '4',
      deal_number: 'DEAL-2024-004',
      title: 'Retail Integration Platform',
      customer_id: '4',
      value: 200000,
      currency: 'USD',
      status: 'won',
      source: 'inbound_lead',
      campaign: 'Retail_Solutions',
      close_date: '2024-01-30T17:00:00Z',
      expected_close_date: '2024-01-30',
      assigned_to: '1',
      tags: ['retail', 'integration', 'won', 'large_deal'],
      notes: 'Successfully closed large retail integration platform deal',
      win_loss_reason: 'Superior technology and proven track record',
      items: [],
      contract_id: 'contract_003',
      payment_terms: 'net_30',
      payment_status: 'paid',
      payment_due_date: '2024-03-01',
      paid_amount: 200000,
      outstanding_amount: 0,
      payment_method: 'bank_transfer',
      revenue_recognized: 200000,
      revenue_recognition_status: 'completed',
      revenue_recognition_method: 'milestone',
      recognition_schedule: [
        {
          id: 'rec_4_1',
          deal_id: '4',
          installment_number: 1,
          amount: 50000,
          recognized_amount: 50000,
          recognition_date: '2024-01-30',
          actual_recognition_date: '2024-01-30',
          status: 'recognized',
          milestone: 'Contract signing',
          tenant_id: 'tenant_1',
          created_at: '2024-01-30T17:00:00Z',
          updated_at: '2024-01-30T17:00:00Z'
        },
        {
          id: 'rec_4_2',
          deal_id: '4',
          installment_number: 2,
          amount: 75000,
          recognized_amount: 75000,
          recognition_date: '2024-03-15',
          actual_recognition_date: '2024-03-15',
          status: 'recognized',
          milestone: 'Initial implementation complete',
          tenant_id: 'tenant_1',
          created_at: '2024-01-30T17:00:00Z',
          updated_at: '2024-03-15T10:00:00Z'
        },
        {
          id: 'rec_4_3',
          deal_id: '4',
          installment_number: 3,
          amount: 75000,
          recognized_amount: 75000,
          recognition_date: '2024-05-15',
          actual_recognition_date: '2024-05-15',
          status: 'recognized',
          milestone: 'Full deployment and training',
          tenant_id: 'tenant_1',
          created_at: '2024-01-30T17:00:00Z',
          updated_at: '2024-05-15T14:00:00Z'
        }
      ],
      tenant_id: 'tenant_1',
      created_at: '2024-01-05T08:30:00Z',
      updated_at: '2024-01-30T17:00:00Z',
      created_by: '1'
    },
    {
      id: '5',
      deal_number: 'DEAL-2024-005',
      title: 'Cloud Migration Services',
      customer_id: '1',
      value: 85000,
      currency: 'USD',
      status: 'cancelled',
      source: 'existing_customer',
      campaign: 'Cloud_Migration_Q2',
      close_date: '2024-02-10T11:00:00Z',
      expected_close_date: '2024-04-15',
      assigned_to: '3',
      tags: ['cloud', 'migration', 'services', 'existing_customer'],
      notes: 'Deal cancelled - customer decided to postpone cloud migration project',
      win_loss_reason: 'Project postponement due to internal budget constraints',
      items: [],
      payment_terms: 'net_45',
      payment_status: 'pending',
      revenue_recognized: 0,
      revenue_recognition_status: 'not_started',
      tenant_id: 'tenant_1',
      created_at: '2024-01-28T15:45:00Z',
      updated_at: '2024-02-10T11:00:00Z',
      created_by: '1'
    }
  ];

  async getDeals(filters?: {
    status?: string;
    assigned_to?: string;
    customer_id?: string;
    search?: string;
    payment_status?: string;
    revenue_status?: string;
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
      if (filters.payment_status) {
        deals = deals.filter(d => d.payment_status === filters.payment_status);
      }
      if (filters.revenue_status) {
        deals = deals.filter(d => d.revenue_recognition_status === filters.revenue_status);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        deals = deals.filter(d =>
          d.title.toLowerCase().includes(search) ||
          d.description?.toLowerCase().includes(search) ||
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

  async getStatuses(): Promise<string[]> {
    return ['won', 'lost', 'cancelled'];
  }

  async getDealStats(): Promise<{
    status: string;
    count: number;
    value: number;
    revenue: number;
  }[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let deals = this.mockDeals.filter(d => d.tenant_id === user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      deals = deals.filter(d => d.assigned_to === user.id);
    }

    const statuses = ['won', 'lost', 'cancelled'];

    return statuses.map(status => {
      const statusDeals = deals.filter(d => d.status === status);
      return {
        status,
        count: statusDeals.length,
        value: statusDeals.reduce((sum, deal) => sum + deal.value, 0),
        revenue: statusDeals.reduce((sum, deal) => sum + (deal.revenue_recognized || 0), 0)
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
    const dealData = data as Omit<Deal, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>;
    return this.createDeal(dealData);
  }

  async updateSale(id: string, data: Record<string, unknown>): Promise<Deal> {
    return this.updateDeal(id, data);
  }

  async deleteSale(id: string): Promise<void> {
    return this.deleteDeal(id);
  }

  async getDealStatuses(): Promise<Array<{ id: string; name: string; order: number }>> {
    const statuses = await this.getStatuses();
    return statuses.map(status => ({ id: status, name: status, order: statuses.indexOf(status) }));
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
    const wonDeals = deals.filter(d => d.status === 'won');
    const lostDeals = deals.filter(d => d.status === 'lost');
    const cancelledDeals = deals.filter(d => d.status === 'cancelled');

    const totalRevenue = deals.reduce((sum, deal) => sum + (deal.revenue_recognized || 0), 0);
    const paidAmount = deals.reduce((sum, deal) => sum + (deal.paid_amount || 0), 0);
    const outstandingAmount = deals.reduce((sum, deal) => sum + (deal.outstanding_amount || 0), 0);

    return {
      totalDeals: deals.length,
      totalValue,
      wonDeals: wonDeals.length,
      wonValue: wonDeals.reduce((sum, deal) => sum + deal.value, 0),
      lostDeals: lostDeals.length,
      lostValue: lostDeals.reduce((sum, deal) => sum + deal.value, 0),
      cancelledDeals: cancelledDeals.length,
      cancelledValue: cancelledDeals.reduce((sum, deal) => sum + deal.value, 0),
      totalRevenue,
      paidAmount,
      outstandingAmount,
      paymentCompletionRate: totalValue > 0 ? (paidAmount / totalValue) * 100 : 0,
      revenueCompletionRate: totalValue > 0 ? (totalRevenue / totalValue) * 100 : 0,
      averageDealSize: wonDeals.length > 0 ? wonDeals.reduce((sum, deal) => sum + deal.value, 0) / wonDeals.length : 0,
      averageRevenuePerDeal: deals.length > 0 ? totalRevenue / deals.length : 0
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

  async getDealStatuses(): Promise<string[]> {
    return this.getStatuses();
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

    // Search across title and description
    return deals.filter(d =>
      d.title.toLowerCase().includes(searchLower) ||
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
      const headers = ['ID', 'Title', 'Customer ID', 'Value', 'Stage', 'Status', 'Probability', 'Assigned To ID'];
      const rows = deals.map(d => [
        d.id,
        d.title,
        d.customer_id,
        d.value,
        d.stage,
        d.status,
        d.probability,
        d.assigned_to
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
        const [id, title, customerName, value, status, assignedToName] = values;

        if (!title || !customerName) {
          errors.push(`Row ${i + 2}: Missing required fields (title or customer)`);
          continue;
        }

        const newDeal: Deal = {
          id: Date.now().toString() + Math.random(),
          deal_number: `DEAL-${Date.now()}`,
          title,
          customer_id: 'imported',
          value: parseInt(value) || 0,
          currency: 'USD',
          status: (status as 'won' | 'lost' | 'cancelled') || 'won',
          close_date: new Date().toISOString(),
          expected_close_date: new Date().toISOString(),
          assigned_to: user.id,
          tags: ['imported'],
          notes: `Imported from CSV on ${new Date().toLocaleDateString()}`,
          payment_terms: 'net_30',
          payment_status: 'pending',
          revenue_recognized: 0,
          revenue_recognition_status: 'not_started',
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

  // Payment Processing Methods
  async processPayment(dealId: string, paymentData: {
    amount: number;
    payment_date: string;
    payment_method: string;
    reference_number?: string;
    notes?: string;
  }): Promise<Deal> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const dealIndex = this.mockDeals.findIndex(d =>
      d.id === dealId && d.tenant_id === user.tenant_id
    );

    if (dealIndex === -1) {
      throw new Error('Deal not found');
    }

    const deal = this.mockDeals[dealIndex];
    const newPaidAmount = (deal.paid_amount || 0) + paymentData.amount;
    const newOutstandingAmount = deal.value - newPaidAmount;

    this.mockDeals[dealIndex] = {
      ...deal,
      paid_amount: newPaidAmount,
      outstanding_amount: Math.max(0, newOutstandingAmount),
      payment_status: newOutstandingAmount <= 0 ? 'paid' : 'partial',
      payment_method: paymentData.payment_method,
      updated_at: new Date().toISOString()
    };

    return this.mockDeals[dealIndex];
  }

  async updatePaymentStatus(dealId: string, status: 'pending' | 'partial' | 'paid' | 'overdue'): Promise<Deal> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const dealIndex = this.mockDeals.findIndex(d =>
      d.id === dealId && d.tenant_id === user.tenant_id
    );

    if (dealIndex === -1) {
      throw new Error('Deal not found');
    }

    this.mockDeals[dealIndex] = {
      ...this.mockDeals[dealIndex],
      payment_status: status,
      updated_at: new Date().toISOString()
    };

    return this.mockDeals[dealIndex];
  }

  // Revenue Recognition Methods
  async recognizeRevenue(dealId: string, recognitionData: {
    amount: number;
    recognition_date: string;
    method: 'immediate' | 'installments' | 'milestone' | 'time_based';
    description?: string;
  }): Promise<Deal> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const dealIndex = this.mockDeals.findIndex(d =>
      d.id === dealId && d.tenant_id === user.tenant_id
    );

    if (dealIndex === -1) {
      throw new Error('Deal not found');
    }

    const deal = this.mockDeals[dealIndex];
    const newRecognizedAmount = (deal.revenue_recognized || 0) + recognitionData.amount;

    this.mockDeals[dealIndex] = {
      ...deal,
      revenue_recognized: newRecognizedAmount,
      revenue_recognition_status: newRecognizedAmount >= deal.value ? 'completed' : 'in_progress',
      revenue_recognition_method: recognitionData.method,
      updated_at: new Date().toISOString()
    };

    return this.mockDeals[dealIndex];
  }

  async createRevenueSchedule(dealId: string, scheduleData: {
    installments: Array<{
      amount: number;
      recognition_date: string;
      description?: string;
      milestone?: string;
    }>;
  }): Promise<RevenueRecognitionSchedule[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const dealIndex = this.mockDeals.findIndex(d =>
      d.id === dealId && d.tenant_id === user.tenant_id
    );

    if (dealIndex === -1) {
      throw new Error('Deal not found');
    }

    const schedules: RevenueRecognitionSchedule[] = scheduleData.installments.map((installment, index) => ({
      id: `rec_${dealId}_${index + 1}`,
      deal_id: dealId,
      installment_number: index + 1,
      amount: installment.amount,
      recognized_amount: 0,
      recognition_date: installment.recognition_date,
      status: 'pending',
      description: installment.description,
      milestone: installment.milestone,
      tenant_id: user.tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Update deal with recognition schedule
    this.mockDeals[dealIndex] = {
      ...this.mockDeals[dealIndex],
      recognition_schedule: schedules,
      revenue_recognition_method: 'installments',
      updated_at: new Date().toISOString()
    };

    return schedules;
  }

  async getRevenueSchedule(dealId: string): Promise<RevenueRecognitionSchedule[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const deal = this.mockDeals.find(d =>
      d.id === dealId && d.tenant_id === user.tenant_id
    );

    if (!deal) {
      throw new Error('Deal not found');
    }

    return deal.recognition_schedule || [];
  }

  // Contract Integration Methods
  async linkContract(dealId: string, contractId: string): Promise<Deal> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const dealIndex = this.mockDeals.findIndex(d =>
      d.id === dealId && d.tenant_id === user.tenant_id
    );

    if (dealIndex === -1) {
      throw new Error('Deal not found');
    }

    this.mockDeals[dealIndex] = {
      ...this.mockDeals[dealIndex],
      contract_id: contractId,
      updated_at: new Date().toISOString()
    };

    return this.mockDeals[dealIndex];
  }

  async getDealsByContract(contractId: string): Promise<Deal[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    return this.mockDeals.filter(d =>
      d.tenant_id === user.tenant_id && d.contract_id === contractId
    );
  }

  // Contract Integration Methods - Automatic contract creation from won deals
  async createContractFromDeal(dealId: string, contractData?: {
    template_id?: string;
    start_date?: string;
    end_date?: string;
    auto_renew?: boolean;
    renewal_terms?: string;
    notes?: string;
  }): Promise<{ deal: Deal; contract: any }> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    // Get the deal
    const deal = await this.getDeal(dealId);
    if (deal.status !== 'won') {
      throw new Error('Only won deals can be converted to contracts');
    }

    if (deal.contract_id) {
      throw new Error('Deal already has a contract linked');
    }

    // Create contract from deal data
    const contractTitle = `${deal.title} - Contract`;
    const contractStartDate = contractData?.start_date || deal.close_date?.split('T')[0] || new Date().toISOString().split('T')[0];
    const contractEndDate = contractData?.end_date || new Date(new Date(contractStartDate).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 1 year from start

    const contractPayload = {
      title: contractTitle,
      type: 'service_agreement' as const,
      status: 'draft' as const,
      customer_id: deal.customer_id,
      parties: [
        {
          id: 'party_customer',
          name: 'Customer', // This would be populated from customer data
          email: 'customer@example.com', // This would be populated from customer data
          role: 'client' as const,
          signature_required: true
        },
        {
          id: 'party_vendor',
          name: user.name,
          email: user.email,
          role: 'vendor' as const,
          signature_required: true
        }
      ],
      value: deal.value,
      total_value: deal.value,
      currency: deal.currency,
      start_date: contractStartDate,
      end_date: contractEndDate,
      auto_renew: contractData?.auto_renew || false,
      renewal_terms: contractData?.renewal_terms || 'Auto-renewal for 1 year unless terminated with 60 days notice',
      approval_stage: 'draft',
      created_by: user.id,
      assigned_to: deal.assigned_to,
      content: `Contract automatically generated from deal: ${deal.title}\n\nDeal Value: ${deal.value} ${deal.currency}\nClose Date: ${deal.close_date}\n\n${contractData?.notes || ''}`,
      template_id: contractData?.template_id || '1',
      tags: [...(deal.tags || []), 'auto-generated', 'from-deal'],
      priority: 'medium' as const,
      reminder_days: [90, 60, 30],
      approval_history: [],
      compliance_status: 'pending_review' as const,
      signature_status: {
        total_required: 2,
        completed: 0,
        pending: ['customer@example.com', user.email]
      },
      attachments: []
    };

    // Create the contract
    const newContract = await contractService.createContract(contractPayload);

    // Link the contract to the deal
    const updatedDeal = await this.linkContract(dealId, newContract.id);

    return {
      deal: updatedDeal,
      contract: newContract
    };
  }

  async convertDealToContract(dealId: string, options?: {
    createContract?: boolean;
    contractTemplate?: string;
    contractData?: any;
  }): Promise<{ deal: Deal; contract?: any }> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const deal = await this.getDeal(dealId);

    if (deal.status !== 'won') {
      throw new Error('Only won deals can be converted to contracts');
    }

    if (deal.contract_id && !options?.createContract) {
      throw new Error('Deal already has a contract linked');
    }

    if (options?.createContract !== false) {
      // Create new contract from deal
      const result = await this.createContractFromDeal(dealId, {
        template_id: options?.contractTemplate,
        ...options?.contractData
      });

      return result;
    } else {
      // Just update deal status without creating contract
      const updatedDeal = await this.updateDeal(dealId, {
        status: 'won' // Keep as won since contract creation was skipped
      });

      return { deal: updatedDeal };
    }
  }
}

export const salesService = new SalesService();