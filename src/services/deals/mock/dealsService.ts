import { DealDTO, CreateDealDTO, UpdateDealDTO, DealFiltersDTO, DealListResponseDTO, SalesStatsDTO } from '@/types/dtos/salesDtos';
import { authService } from '../../serviceFactory';

class MockDealsService {
  private baseUrl = '/api/deals';

  // Mock data for demonstration
  private mockDeals: DealDTO[] = [
    {
      id: 'deal_1',
      dealNumber: 'D-2024-001',
      title: 'Enterprise Software License Deal',
      description: 'Closed deal for enterprise software license with premium support',
      customerId: '1',
      customerName: 'TechCorp Industries',
      value: 150000,
      currency: 'USD',
      status: 'won',
      source: 'direct_sales',
      campaign: 'Q1_Enterprise_Push',
      closeDate: '2024-01-30',
      expectedCloseDate: '2024-02-15',
      assignedTo: '2',
      assignedToName: 'Sarah Johnson',
      notes: 'Successfully closed. Customer signed contract. Implementation starts Feb 5.',
      tags: ['enterprise', 'software', 'won', 'large_deal'],
      competitorInfo: 'Beat out VendorX with better integration capabilities',
      winLossReason: 'Superior product features and implementation timeline',
      opportunityId: 'opp_1',
      tenantId: 'tenant_1',
      audit: {
        createdAt: '2024-01-30T17:00:00Z',
        updatedAt: '2024-01-30T17:00:00Z',
        createdBy: '1',
        updatedBy: '1',
        version: 1
      }
    },
    {
      id: 'deal_2',
      dealNumber: 'D-2024-002',
      title: 'Manufacturing Equipment Lost Deal',
      description: 'Lost deal for manufacturing equipment due to budget constraints',
      customerId: '2',
      customerName: 'Global Logistics Inc',
      value: 75000,
      currency: 'USD',
      status: 'lost',
      source: 'partner_referral',
      campaign: 'Equipment_Sales_2024',
      closeDate: '2024-02-10',
      expectedCloseDate: '2024-02-28',
      assignedTo: '3',
      assignedToName: 'Mike Chen',
      notes: 'Customer decided to go with cheaper alternative due to budget cuts.',
      tags: ['equipment', 'manufacturing', 'lost', 'budget_constraints'],
      competitorInfo: 'Lost to local competitor with lower pricing',
      winLossReason: 'Budget constraints - customer chose lower cost option',
      opportunityId: 'opp_2',
      tenantId: 'tenant_1',
      audit: {
        createdAt: '2024-02-10T14:30:00Z',
        updatedAt: '2024-02-10T14:30:00Z',
        createdBy: '1',
        updatedBy: '1',
        version: 1
      }
    }
  ];

  async getDeals(filters?: DealFiltersDTO): Promise<DealDTO[]> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let deals = this.mockDeals.filter(d => d.tenantId === user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      deals = deals.filter(d => d.assignedTo === user.id);
    }

    // Apply filters
    if (filters) {
      if (filters.status) {
        const statusFilter = Array.isArray(filters.status) ? filters.status : [filters.status];
        deals = deals.filter(d => statusFilter.includes(d.status));
      }
      if (filters.assignedTo) {
        deals = deals.filter(d => d.assignedTo === filters.assignedTo);
      }
      if (filters.customerId) {
        deals = deals.filter(d => d.customerId === filters.customerId);
      }
      if (filters.minValue !== undefined) {
        deals = deals.filter(d => d.value >= filters.minValue!);
      }
      if (filters.maxValue !== undefined) {
        deals = deals.filter(d => d.value <= filters.maxValue!);
      }
      if (filters.source) {
        deals = deals.filter(d => d.source === filters.source);
      }
      if (filters.campaign) {
        deals = deals.filter(d => d.campaign === filters.campaign);
      }
      if (filters.dateRange) {
        const fromDate = new Date(filters.dateRange.from);
        const toDate = new Date(filters.dateRange.to);
        deals = deals.filter(d => {
          const closeDate = new Date(d.closeDate);
          return closeDate >= fromDate && closeDate <= toDate;
        });
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        deals = deals.filter(d =>
          d.title.toLowerCase().includes(search) ||
          d.description?.toLowerCase().includes(search) ||
          d.customerName?.toLowerCase().includes(search) ||
          d.dealNumber?.toLowerCase().includes(search)
        );
      }
    }

    return deals;
  }

  async getDeal(id: string): Promise<DealDTO> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const deal = this.mockDeals.find(d =>
      d.id === id && d.tenantId === user.tenant_id
    );

    if (!deal) {
      throw new Error('Deal not found');
    }

    // Check permissions
    if (user.role === 'agent' && deal.assignedTo !== user.id) {
      throw new Error('Access denied');
    }

    return deal;
  }

  async createDeal(dealData: CreateDealDTO): Promise<DealDTO> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const dealNumber = `D-${new Date().getFullYear()}-${String(this.mockDeals.length + 1).padStart(4, '0')}`;

    const newDeal: DealDTO = {
      id: `deal_${Date.now()}`,
      dealNumber,
      ...dealData,
      currency: dealData.currency || 'USD',
      status: dealData.status || 'won',
      tenantId: user.tenant_id,
      audit: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user.id,
        updatedBy: user.id,
        version: 1
      }
    };

    this.mockDeals.push(newDeal);
    return newDeal;
  }

  async updateDeal(id: string, updates: UpdateDealDTO): Promise<DealDTO> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const dealIndex = this.mockDeals.findIndex(d =>
      d.id === id && d.tenantId === user.tenant_id
    );

    if (dealIndex === -1) {
      throw new Error('Deal not found');
    }

    // Check permissions
    if (user.role === 'agent' && this.mockDeals[dealIndex].assignedTo !== user.id) {
      throw new Error('Access denied');
    }

    this.mockDeals[dealIndex] = {
      ...this.mockDeals[dealIndex],
      ...updates,
      audit: {
        ...this.mockDeals[dealIndex].audit,
        updatedAt: new Date().toISOString(),
        updatedBy: user.id,
        version: this.mockDeals[dealIndex].audit.version + 1
      }
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
      d.id === id && d.tenantId === user.tenant_id
    );

    if (dealIndex === -1) {
      throw new Error('Deal not found');
    }

    this.mockDeals.splice(dealIndex, 1);
  }

  async getDealStats(): Promise<SalesStatsDTO> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let deals = this.mockDeals.filter(d => d.tenantId === user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      deals = deals.filter(d => d.assignedTo === user.id);
    }

    const wonDeals = deals.filter(d => d.status === 'won');
    const lostDeals = deals.filter(d => d.status === 'lost');
    const cancelledDeals = deals.filter(d => d.status === 'cancelled');

    const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
    const wonValue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);
    const averageDealSize = wonDeals.length > 0 ? wonValue / wonDeals.length : 0;
    const winRate = deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0;

    const byStage: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byAssignee: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    deals.forEach(deal => {
      byStatus[deal.status] = (byStatus[deal.status] || 0) + 1;
      if (deal.assignedTo) {
        byAssignee[deal.assignedTo] = (byAssignee[deal.assignedTo] || 0) + 1;
      }
      if (deal.source) {
        bySource[deal.source] = (bySource[deal.source] || 0) + 1;
      }
    });

    return {
      totalDeals: deals.length,
      openDeals: deals.filter(d => d.status !== 'won' && d.status !== 'lost' && d.status !== 'cancelled').length,
      closedWonDeals: wonDeals.length,
      closedLostDeals: lostDeals.length,
      totalPipelineValue: totalValue,
      totalWonValue: wonValue,
      averageDealSize,
      winRate,
      byStage,
      byStatus,
      byAssignee,
      bySource,
      lastUpdated: new Date().toISOString()
    };
  }
}

export const mockDealsService = new MockDealsService();