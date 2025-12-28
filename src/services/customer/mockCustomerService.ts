import { Customer, CustomerTag } from '@/types/crm';
import {
  CustomerInteractionDTO,
  CustomerPreferencesDTO,
  CustomerSegmentDTO,
  CustomerAnalyticsDTO,
  CustomerSegmentMembershipDTO
} from '@/types/dtos/customerDtos';
import { authService } from '../serviceFactory';

class MockCustomerService {
  private baseUrl = '/api/customers';

  // Mock tags data
  private mockTags: CustomerTag[] = [
    { id: '1', name: 'VIP', color: '#f59e0b' },
    { id: '2', name: 'High Value', color: '#10b981' },
    { id: '3', name: 'New Client', color: '#3b82f6' },
    { id: '4', name: 'At Risk', color: '#ef4444' },
    { id: '5', name: 'Potential Upsell', color: '#8b5cf6' },
    { id: '6', name: 'Long Term', color: '#06b6d4' },
    { id: '7', name: 'Referral Source', color: '#84cc16' },
    { id: '8', name: 'Support Priority', color: '#f97316' }
  ];

  // Mock data for demonstration
  private mockCustomers: Customer[] = [
    {
      id: '1',
      company_name: 'TechCorp Solutions',
      contact_name: 'Alice Johnson',
      email: 'alice@techcorp.com',
      phone: '+1-555-0123',
      address: '123 Tech Street',
      city: 'San Francisco',
      country: 'USA',
      industry: 'Technology',
      size: 'enterprise',
      status: 'active',
      tags: [this.mockTags[0], this.mockTags[1]], // VIP, High Value
      notes: 'Key enterprise client with multiple ongoing projects.',
      tenant_id: 'tenant_1',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-20T14:30:00Z',
      assigned_to: '2'
    },
    {
      id: '2',
      company_name: 'Global Manufacturing Inc',
      contact_name: 'Bob Smith',
      email: 'bob@globalmanuf.com',
      phone: '+1-555-0456',
      address: '456 Industrial Ave',
      city: 'Detroit',
      country: 'USA',
      industry: 'Manufacturing',
      size: 'medium',
      status: 'active',
      tags: [this.mockTags[5]], // Long Term
      notes: 'Reliable manufacturing partner for 3+ years.',
      tenant_id: 'tenant_1',
      created_at: '2024-01-10T09:15:00Z',
      updated_at: '2024-01-18T16:45:00Z',
      assigned_to: '3'
    },
    {
      id: '3',
      company_name: 'StartupXYZ',
      contact_name: 'Carol Davis',
      email: 'carol@startupxyz.com',
      phone: '+1-555-0789',
      address: '789 Innovation Blvd',
      city: 'Austin',
      country: 'USA',
      industry: 'Software',
      size: 'startup',
      status: 'prospect',
      tags: [this.mockTags[2], this.mockTags[4]], // New Client, Potential Upsell
      notes: 'Promising startup with growth potential.',
      tenant_id: 'tenant_1',
      created_at: '2024-01-25T11:20:00Z',
      updated_at: '2024-01-25T11:20:00Z',
      assigned_to: '2'
    },
    {
      id: '4',
      company_name: 'Retail Giants Ltd',
      contact_name: 'David Wilson',
      email: 'david@retailgiants.com',
      phone: '+1-555-0321',
      address: '321 Commerce St',
      city: 'New York',
      country: 'USA',
      industry: 'Retail',
      size: 'large',
      status: 'active',
      tags: [this.mockTags[6]], // Referral Source
      notes: 'Major retail client, excellent referral source.',
      tenant_id: 'tenant_1',
      created_at: '2024-01-05T08:30:00Z',
      updated_at: '2024-01-22T13:15:00Z',
      assigned_to: '1'
    }
  ];

  async getCustomers(filters?: {
    status?: string;
    industry?: string;
    size?: string;
    assigned_to?: string;
    search?: string;
    tags?: string[];
  }, page?: number, limit?: number, tenantId?: string): Promise<{
    data: Customer[];
    total: number;
    page: number;
    limit: number;
  } | Customer[]> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;
    const userId = user?.id;
    
    if (!finalTenantId) throw new Error('Unauthorized');

    let customers = this.mockCustomers.filter(c => c.tenant_id === finalTenantId);

    // Apply role-based filtering
    if (user && user.role === 'agent') {
      customers = customers.filter(c => c.assigned_to === userId);
    }

    // Apply filters
    if (filters) {
      if (filters.status) {
        customers = customers.filter(c => c.status === filters.status);
      }
      if (filters.industry) {
        customers = customers.filter(c => c.industry === filters.industry);
      }
      if (filters.size) {
        customers = customers.filter(c => c.size === filters.size);
      }
      if (filters.assigned_to) {
        customers = customers.filter(c => c.assigned_to === filters.assigned_to);
      }
      if (filters.tags && filters.tags.length > 0) {
        customers = customers.filter(c => 
          filters.tags!.some(tagId => c.tags.some(tag => tag.id === tagId))
        );
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        customers = customers.filter(c => 
          c.company_name.toLowerCase().includes(search) ||
          c.contact_name.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search) ||
          c.phone.includes(search) ||
          c.industry.toLowerCase().includes(search) ||
          c.city.toLowerCase().includes(search) ||
          c.country.toLowerCase().includes(search) ||
          c.tags.some(tag => tag.name.toLowerCase().includes(search))
        );
      }
    }

    // Handle pagination
    if (page && limit) {
      const total = customers.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const data = customers.slice(startIndex, endIndex);
      
      return {
        data,
        total,
        page,
        limit
      };
    }

    return customers;
  }

  async getCustomer(id: string, tenantId?: string): Promise<Customer> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;
    
    if (!finalTenantId) throw new Error('Unauthorized');

    const customer = this.mockCustomers.find(c => 
      c.id === id && c.tenant_id === finalTenantId
    );

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Check permissions
    if (user.role === 'agent' && customer.assigned_to !== user.id) {
      throw new Error('Access denied');
    }

    return customer;
  }

  /**
   * Validate customer data according to business rules
   */
  private validateCustomerData(customerData: Omit<Customer, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>, tenantId: string): void {
    const errors: string[] = [];

    // Required field validations
    if (!customerData.company_name?.trim()) {
      errors.push('Company name is required');
    } else if (customerData.company_name.length > 255) {
      errors.push('Company name must be less than 255 characters');
    }

    if (!customerData.contact_name?.trim()) {
      errors.push('Contact name is required');
    } else if (customerData.contact_name.length > 255) {
      errors.push('Contact name must be less than 255 characters');
    }

    // Email validation
    if (!customerData.email?.trim()) {
      errors.push('Email is required');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerData.email)) {
        errors.push('Invalid email format');
      } else if (customerData.email.length > 255) {
        errors.push('Email must be less than 255 characters');
      } else {
        // Check email uniqueness within tenant
        const existingCustomer = this.mockCustomers.find(c =>
          c.email.toLowerCase() === customerData.email!.toLowerCase() &&
          c.tenant_id === tenantId
        );
        if (existingCustomer) {
          errors.push('Email address already exists for this tenant');
        }
      }
    }

    // Phone validation
    if (customerData.phone && customerData.phone.length > 50) {
      errors.push('Phone number must be less than 50 characters');
    }

    if (customerData.mobile && customerData.mobile.length > 50) {
      errors.push('Mobile number must be less than 50 characters');
    }

    // Website URL validation
    if (customerData.website) {
      try {
        new URL(customerData.website);
        if (customerData.website.length > 500) {
          errors.push('Website URL must be less than 500 characters');
        }
      } catch {
        errors.push('Invalid website URL format');
      }
    }

    // Address validation
    if (customerData.address && customerData.address.length > 500) {
      errors.push('Address must be less than 500 characters');
    }

    if (customerData.city && customerData.city.length > 100) {
      errors.push('City must be less than 100 characters');
    }

    if (customerData.country && customerData.country.length > 100) {
      errors.push('Country must be less than 100 characters');
    }

    // Industry validation
    if (customerData.industry && customerData.industry.length > 100) {
      errors.push('Industry must be less than 100 characters');
    }

    // Size enum validation
    if (customerData.size && !['startup', 'small', 'medium', 'enterprise'].includes(customerData.size)) {
      errors.push('Size must be one of: startup, small, medium, enterprise');
    }

    // Status enum validation
    if (customerData.status && !['active', 'inactive', 'prospect'].includes(customerData.status)) {
      errors.push('Status must be one of: active, inactive, prospect');
    }

    // Customer type enum validation
    if (customerData.customer_type && !['business', 'individual'].includes(customerData.customer_type)) {
      errors.push('Customer type must be one of: business, individual');
    }

    // Credit limit validation
    if (customerData.credit_limit !== undefined && customerData.credit_limit !== null && customerData.credit_limit !== '') {
      const creditLimit = Number(customerData.credit_limit);
      if (isNaN(creditLimit) || creditLimit < 0) {
        errors.push('Credit limit must be a positive number');
      } else if (creditLimit > 999999999.99) {
        errors.push('Credit limit cannot exceed 999,999,999.99');
      }
    }

    // Payment terms validation
    if (customerData.payment_terms && customerData.payment_terms.length > 100) {
      errors.push('Payment terms must be less than 100 characters');
    }

    // Tax ID validation
    if (customerData.tax_id && customerData.tax_id.length > 50) {
      errors.push('Tax ID must be less than 50 characters');
    }

    // Notes validation
    if (customerData.notes && customerData.notes.length > 2000) {
      errors.push('Notes must be less than 2000 characters');
    }

    // Source validation
    if (customerData.source && customerData.source.length > 100) {
      errors.push('Source must be less than 100 characters');
    }

    // Rating validation
    if (customerData.rating && customerData.rating.length > 50) {
      errors.push('Rating must be less than 50 characters');
    }

    // Tags validation
    if (customerData.tags && customerData.tags.length > 10) {
      errors.push('Cannot assign more than 10 tags to a customer');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  async createCustomer(customerData: Omit<Customer, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    // Validate customer data
    this.validateCustomerData(customerData, user.tenant_id);

    const newCustomer: Customer = {
      ...customerData,
      id: Date.now().toString(),
      tenant_id: user.tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.mockCustomers.push(newCustomer);
    return newCustomer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const customerIndex = this.mockCustomers.findIndex(c =>
      c.id === id && c.tenant_id === user.tenant_id
    );

    if (customerIndex === -1) {
      throw new Error('Customer not found');
    }

    // Check permissions
    if (user.role === 'agent' && this.mockCustomers[customerIndex].assigned_to !== user.id) {
      throw new Error('Access denied');
    }

    // Validate updates if they contain customer data fields
    const existingCustomer = this.mockCustomers[customerIndex];
    const updatedData = { ...existingCustomer, ...updates };

    // Only validate if email or other key fields are being updated
    if (updates.email || updates.company_name || updates.contact_name ||
        updates.phone || updates.website || updates.size || updates.status ||
        updates.customer_type || updates.credit_limit) {
      this.validateCustomerData(updatedData, user.tenant_id);
    }

    this.mockCustomers[customerIndex] = {
      ...this.mockCustomers[customerIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    return this.mockCustomers[customerIndex];
  }

  async deleteCustomer(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('delete')) {
      throw new Error('Insufficient permissions');
    }

    const customerIndex = this.mockCustomers.findIndex(c => 
      c.id === id && c.tenant_id === user.tenant_id
    );

    if (customerIndex === -1) {
      throw new Error('Customer not found');
    }

    this.mockCustomers.splice(customerIndex, 1);
  }

  async bulkDeleteCustomers(ids: string[]): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('delete')) {
      throw new Error('Insufficient permissions');
    }

    this.mockCustomers = this.mockCustomers.filter(c => 
      !ids.includes(c.id) || c.tenant_id !== user.tenant_id
    );
  }

  async bulkUpdateCustomers(ids: string[], updates: Partial<Customer>): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    this.mockCustomers = this.mockCustomers.map(c => {
      if (ids.includes(c.id) && c.tenant_id === user.tenant_id) {
        return { ...c, ...updates, updated_at: new Date().toISOString() };
      }
      return c;
    });
  }

  async getTags(): Promise<CustomerTag[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.mockTags;
  }

  async createTag(name: string, color: string): Promise<CustomerTag> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const newTag: CustomerTag = {
      id: Date.now().toString(),
      name,
      color
    };

    this.mockTags.push(newTag);
    return newTag;
  }

  async exportCustomers(format: 'csv' | 'json' = 'csv'): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const customers = await this.getCustomers() as Customer[];

    if (format === 'csv') {
      const headers = [
        'Company Name', 'Contact Name', 'Email', 'Phone', 'Address', 
        'City', 'Country', 'Industry', 'Size', 'Status', 'Tags', 'Notes', 'Created At'
      ];
      
      const csvData = customers.map(c => [
        c.company_name,
        c.contact_name,
        c.email,
        c.phone,
        c.address,
        c.city,
        c.country,
        c.industry,
        c.size,
        c.status,
        c.tags.map(t => t.name).join('; '),
        c.notes || '',
        new Date(c.created_at).toLocaleDateString()
      ]);

      return [headers, ...csvData].map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\r\n');
    } else {
      return JSON.stringify(customers, null, 2);
    }
  }

  async importCustomers(csvData: string): Promise<{ success: number; errors: string[] }> {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    // Mock import processing
    const lines = csvData.split('\r\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const dataLines = lines.slice(1);

    let success = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      try {
        const values = dataLines[i].split(',').map(v => v.replace(/"/g, '').trim());
        
        if (values.length !== headers.length) {
          errors.push(`Row ${i + 2}: Invalid number of columns`);
          continue;
        }

        // Basic validation
        const email = values[headers.indexOf('Email')] || values[2];
        if (!email || !email.includes('@')) {
          errors.push(`Row ${i + 2}: Invalid email address`);
          continue;
        }

        success++;
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error}`);
      }
    }

    return { success, errors };
  }

  async getCustomerStats(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    prospectCustomers: number;
    inactiveCustomers: number;
    byIndustry: Record<string, number>;
    bySize: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const customers = this.mockCustomers.filter(c => c.tenant_id === user.tenant_id);

    // Calculate statistics
    const byStatus: Record<string, number> = {};
    const byIndustry: Record<string, number> = {};
    const bySize: Record<string, number> = {};

    customers.forEach(customer => {
      byStatus[customer.status] = (byStatus[customer.status] || 0) + 1;
      byIndustry[customer.industry] = (byIndustry[customer.industry] || 0) + 1;
      bySize[customer.size] = (bySize[customer.size] || 0) + 1;
    });

    return {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.status === 'active').length,
      prospectCustomers: customers.filter(c => c.status === 'prospect').length,
      inactiveCustomers: customers.filter(c => c.status === 'inactive').length,
      byIndustry,
      bySize,
      byStatus
    };
  }

  /**
   * Get advanced customer analytics
   */
  async getAdvancedCustomerAnalytics(filters?: {
    dateRange?: { start: string; end: string };
    segment?: string;
    industry?: string;
  }): Promise<{
    totalRevenue: number;
    averageOrderValue: number;
    customerLifetimeValue: number;
    churnRate: number;
    retentionRate: number;
    acquisitionRate: number;
    customerSatisfaction: number;
    npsScore: number;
    topCustomers: Array<{ id: string; name: string; value: number }>;
    revenueByMonth: Record<string, number>;
    customerGrowth: Record<string, number>;
  }> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    // Mock advanced analytics data
    return {
      totalRevenue: 2500000,
      averageOrderValue: 12500,
      customerLifetimeValue: 75000,
      churnRate: 0.08,
      retentionRate: 0.92,
      acquisitionRate: 0.15,
      customerSatisfaction: 4.2,
      npsScore: 45,
      topCustomers: [
        { id: '1', name: 'TechCorp Solutions', value: 150000 },
        { id: '2', name: 'Global Manufacturing Inc', value: 120000 },
        { id: '3', name: 'StartupXYZ', value: 95000 }
      ],
      revenueByMonth: {
        '2024-01': 180000,
        '2024-02': 220000,
        '2024-03': 195000,
        '2024-04': 250000,
        '2024-05': 280000,
        '2024-06': 320000
      },
      customerGrowth: {
        '2024-01': 45,
        '2024-02': 52,
        '2024-03': 48,
        '2024-04': 61,
        '2024-05': 67,
        '2024-06': 72
      }
    };
  }

  /**
   * Get customer segmentation analytics
   */
  async getCustomerSegmentationAnalytics(): Promise<{
    segments: Array<{
      name: string;
      customerCount: number;
      averageValue: number;
      churnRisk: number;
      engagementScore: number;
    }>;
    segmentTrends: Record<string, Record<string, number>>;
    segmentPerformance: Record<string, {
      revenue: number;
      growth: number;
      satisfaction: number;
    }>;
  }> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    return {
      segments: [
        {
          name: 'High Value',
          customerCount: 15,
          averageValue: 85000,
          churnRisk: 0.05,
          engagementScore: 4.8
        },
        {
          name: 'Medium Value',
          customerCount: 35,
          averageValue: 35000,
          churnRisk: 0.12,
          engagementScore: 3.9
        },
        {
          name: 'Low Value',
          customerCount: 22,
          averageValue: 12000,
          churnRisk: 0.25,
          engagementScore: 2.8
        }
      ],
      segmentTrends: {
        'High Value': {
          '2024-01': 12,
          '2024-02': 14,
          '2024-03': 15
        },
        'Medium Value': {
          '2024-01': 28,
          '2024-02': 32,
          '2024-03': 35
        },
        'Low Value': {
          '2024-01': 18,
          '2024-02': 20,
          '2024-03': 22
        }
      },
      segmentPerformance: {
        'High Value': {
          revenue: 1275000,
          growth: 0.25,
          satisfaction: 4.8
        },
        'Medium Value': {
          revenue: 1225000,
          growth: 0.18,
          satisfaction: 3.9
        },
        'Low Value': {
          revenue: 264000,
          growth: 0.08,
          satisfaction: 2.8
        }
      }
    };
  }

  /**
   * Get customer lifecycle analytics
   */
  async getCustomerLifecycleAnalytics(): Promise<{
    lifecycleStages: Array<{
      stage: string;
      customerCount: number;
      averageDays: number;
      conversionRate: number;
      dropOffRate: number;
    }>;
    lifecycleTrends: Record<string, Record<string, number>>;
    stageTransitions: Record<string, Record<string, number>>;
  }> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    return {
      lifecycleStages: [
        {
          stage: 'Prospect',
          customerCount: 25,
          averageDays: 30,
          conversionRate: 0.4,
          dropOffRate: 0.6
        },
        {
          stage: 'New Customer',
          customerCount: 18,
          averageDays: 90,
          conversionRate: 0.8,
          dropOffRate: 0.2
        },
        {
          stage: 'Active Customer',
          customerCount: 45,
          averageDays: 365,
          conversionRate: 0.9,
          dropOffRate: 0.1
        },
        {
          stage: 'Loyal Customer',
          customerCount: 32,
          averageDays: 730,
          conversionRate: 0.95,
          dropOffRate: 0.05
        },
        {
          stage: 'At Risk',
          customerCount: 8,
          averageDays: 45,
          conversionRate: 0.3,
          dropOffRate: 0.7
        }
      ],
      lifecycleTrends: {
        'Prospect': {
          '2024-01': 20,
          '2024-02': 25,
          '2024-03': 22
        },
        'New Customer': {
          '2024-01': 15,
          '2024-02': 18,
          '2024-03': 20
        },
        'Active Customer': {
          '2024-01': 38,
          '2024-02': 42,
          '2024-03': 45
        }
      },
      stageTransitions: {
        'Prospect->New Customer': 10,
        'New Customer->Active Customer': 14,
        'Active Customer->Loyal Customer': 28,
        'Active Customer->At Risk': 6,
        'At Risk->Active Customer': 2
      }
    };
  }

  /**
   * Get customer behavior analytics
   */
  async getCustomerBehaviorAnalytics(): Promise<{
    engagementMetrics: {
      averageInteractionsPerCustomer: number;
      mostActiveTime: string;
      preferredChannels: Record<string, number>;
      responseTimes: {
        average: number;
        median: number;
        p95: number;
      };
    };
    purchasePatterns: {
      averageOrderFrequency: number;
      commonProductCategories: Record<string, number>;
      seasonalTrends: Record<string, number>;
      basketAnalysis: Array<{
        product: string;
        frequentlyBoughtWith: string[];
        confidence: number;
      }>;
    };
    churnIndicators: Array<{
      customerId: string;
      riskScore: number;
      indicators: string[];
      predictedChurnDate?: string;
    }>;
  }> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    return {
      engagementMetrics: {
        averageInteractionsPerCustomer: 12.5,
        mostActiveTime: '14:00-16:00',
        preferredChannels: {
          email: 0.45,
          phone: 0.30,
          chat: 0.15,
          in_person: 0.10
        },
        responseTimes: {
          average: 4.2,
          median: 3.8,
          p95: 12.5
        }
      },
      purchasePatterns: {
        averageOrderFrequency: 30, // days
        commonProductCategories: {
          'Software Licenses': 0.35,
          'Consulting Services': 0.28,
          'Hardware': 0.20,
          'Training': 0.12,
          'Support': 0.05
        },
        seasonalTrends: {
          'Q1': 0.22,
          'Q2': 0.28,
          'Q3': 0.25,
          'Q4': 0.25
        },
        basketAnalysis: [
          {
            product: 'Software License',
            frequentlyBoughtWith: ['Support Package', 'Training Course'],
            confidence: 0.75
          },
          {
            product: 'Hardware',
            frequentlyBoughtWith: ['Installation Service'],
            confidence: 0.82
          }
        ]
      },
      churnIndicators: [
        {
          customerId: '4',
          riskScore: 0.85,
          indicators: ['Low engagement', 'Payment delays', 'Reduced order volume'],
          predictedChurnDate: '2024-08-15'
        },
        {
          customerId: '7',
          riskScore: 0.72,
          indicators: ['Decreased interactions', 'Competitor mentions'],
          predictedChurnDate: '2024-09-30'
        }
      ]
    };
  }

  async getIndustries(): Promise<string[]> {
    return ['Technology', 'Manufacturing', 'Software', 'Retail', 'Healthcare', 'Finance', 'Education', 'Other'];
  }

  async getSizes(): Promise<string[]> {
    return ['startup', 'small', 'medium', 'enterprise'];
  }

  // ============================================================================
  // CUSTOMER INTERACTIONS
  // ============================================================================

  private mockInteractions: CustomerInteractionDTO[] = [
    {
      id: '1',
      customerId: '1',
      tenantId: 'tenant_1',
      interactionType: 'call',
      direction: 'outbound',
      subject: 'Follow-up on project requirements',
      description: 'Discussed project timeline and requirements',
      priority: 'medium',
      contactPerson: 'Alice Johnson',
      contactMethod: 'phone',
      interactionDate: '2024-01-20T10:00:00Z',
      durationMinutes: 15,
      status: 'completed',
      outcome: 'Requirements gathered',
      assignedTo: '2',
      createdBy: '2',
      createdAt: '2024-01-20T10:00:00Z',
      updatedAt: '2024-01-20T10:15:00Z'
    },
    {
      id: '2',
      customerId: '2',
      tenantId: 'tenant_1',
      interactionType: 'email',
      direction: 'inbound',
      subject: 'Order status inquiry',
      description: 'Customer inquired about order #12345 status',
      priority: 'low',
      contactPerson: 'Bob Smith',
      contactMethod: 'email',
      interactionDate: '2024-01-19T14:30:00Z',
      status: 'completed',
      outcome: 'Status provided',
      assignedTo: '3',
      createdBy: '3',
      createdAt: '2024-01-19T14:30:00Z'
    }
  ];

  async getCustomerInteractions(
    customerId?: string,
    filters?: {
      interactionType?: string[];
      status?: string[];
      assignedTo?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    page?: number,
    limit?: number
  ): Promise<{ data: CustomerInteractionDTO[]; total: number; page: number; limit: number }> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let interactions = this.mockInteractions.filter(i => i.tenantId === user.tenant_id);

    if (customerId) {
      interactions = interactions.filter(i => i.customerId === customerId);
    }

    if (filters) {
      if (filters.interactionType?.length) {
        interactions = interactions.filter(i => filters.interactionType!.includes(i.interactionType));
      }
      if (filters.status?.length) {
        interactions = interactions.filter(i => filters.status!.includes(i.status || ''));
      }
      if (filters.assignedTo) {
        interactions = interactions.filter(i => i.assignedTo === filters.assignedTo);
      }
      if (filters.dateFrom) {
        interactions = interactions.filter(i => i.interactionDate >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        interactions = interactions.filter(i => i.interactionDate <= filters.dateTo!);
      }
    }

    const total = interactions.length;
    if (page && limit) {
      const startIndex = (page - 1) * limit;
      interactions = interactions.slice(startIndex, startIndex + limit);
    }

    return {
      data: interactions,
      total,
      page: page || 1,
      limit: limit || total
    };
  }

  async createCustomerInteraction(
    interaction: Omit<CustomerInteractionDTO, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ): Promise<CustomerInteractionDTO> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const newInteraction: CustomerInteractionDTO = {
      ...interaction,
      id: Date.now().toString(),
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.mockInteractions.push(newInteraction);
    return newInteraction;
  }

  async updateCustomerInteraction(
    id: string,
    updates: Partial<CustomerInteractionDTO>
  ): Promise<CustomerInteractionDTO> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const index = this.mockInteractions.findIndex(i => i.id === id && i.tenantId === user.tenant_id);
    if (index === -1) throw new Error('Interaction not found');

    this.mockInteractions[index] = {
      ...this.mockInteractions[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return this.mockInteractions[index];
  }

  // ============================================================================
  // CUSTOMER PREFERENCES
  // ============================================================================

  private mockPreferences: CustomerPreferencesDTO[] = [
    {
      id: '1',
      customerId: '1',
      tenantId: 'tenant_1',
      emailNotifications: true,
      smsNotifications: false,
      phoneCalls: true,
      marketingEmails: true,
      newsletterSubscription: false,
      preferredContactMethod: 'email',
      preferredContactTime: 'morning',
      timezone: 'America/New_York',
      language: 'en',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    }
  ];

  async getCustomerPreferences(customerId: string): Promise<CustomerPreferencesDTO | null> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    return this.mockPreferences.find(p =>
      p.customerId === customerId && p.tenantId === user.tenant_id
    ) || null;
  }

  async updateCustomerPreferences(
    customerId: string,
    preferences: Partial<CustomerPreferencesDTO>
  ): Promise<CustomerPreferencesDTO> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let existing = this.mockPreferences.find(p =>
      p.customerId === customerId && p.tenantId === user.tenant_id
    );

    if (existing) {
      existing = {
        ...existing,
        ...preferences,
        updatedAt: new Date().toISOString()
      };
      const index = this.mockPreferences.findIndex(p => p.id === existing!.id);
      this.mockPreferences[index] = existing;
    } else {
      existing = {
        id: Date.now().toString(),
        customerId,
        tenantId: user.tenant_id,
        ...preferences,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as CustomerPreferencesDTO;
      this.mockPreferences.push(existing);
    }

    return existing;
  }

  // ============================================================================
  // CUSTOMER SEGMENTS
  // ============================================================================

  private mockSegments: CustomerSegmentDTO[] = [
    {
      id: '1',
      tenantId: 'tenant_1',
      name: 'High Value Customers',
      description: 'Customers with high lifetime value',
      segmentType: 'automatic',
      category: 'Value',
      color: '#10B981',
      customerCount: 5,
      isActive: true,
      isSystemSegment: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      tenantId: 'tenant_1',
      name: 'New Customers',
      description: 'Recently acquired customers',
      segmentType: 'automatic',
      category: 'Lifecycle',
      color: '#3B82F6',
      customerCount: 12,
      isActive: true,
      isSystemSegment: true,
      createdAt: '2024-01-01T00:00:00Z'
    }
  ];

  async getCustomerSegments(
    filters?: { category?: string; isActive?: boolean },
    page?: number,
    limit?: number
  ): Promise<{ data: CustomerSegmentDTO[]; total: number; page: number; limit: number }> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let segments = this.mockSegments.filter(s => s.tenantId === user.tenant_id);

    if (filters) {
      if (filters.category) {
        segments = segments.filter(s => s.category === filters.category);
      }
      if (filters.isActive !== undefined) {
        segments = segments.filter(s => s.isActive === filters.isActive);
      }
    }

    const total = segments.length;
    if (page && limit) {
      const startIndex = (page - 1) * limit;
      segments = segments.slice(startIndex, startIndex + limit);
    }

    return {
      data: segments,
      total,
      page: page || 1,
      limit: limit || total
    };
  }

  async createCustomerSegment(
    segment: Omit<CustomerSegmentDTO, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ): Promise<CustomerSegmentDTO> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const newSegment: CustomerSegmentDTO = {
      ...segment,
      id: Date.now().toString(),
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.mockSegments.push(newSegment);
    return newSegment;
  }

  // ============================================================================
  // CUSTOMER ANALYTICS
  // ============================================================================

  private mockAnalytics: CustomerAnalyticsDTO[] = [
    {
      id: '1',
      customerId: '1',
      tenantId: 'tenant_1',
      customerSince: '2024-01-15T00:00:00Z',
      totalInteractions: 5,
      lastInteractionDate: '2024-01-20T10:00:00Z',
      lifetimeValue: 50000,
      averageOrderValue: 10000,
      totalOrders: 5,
      totalRevenue: 50000,
      churnRiskScore: 0.1,
      lastCalculatedAt: '2024-01-20T15:00:00Z',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T15:00:00Z'
    }
  ];

  async getCustomerAnalytics(customerId: string): Promise<CustomerAnalyticsDTO | null> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    return this.mockAnalytics.find(a =>
      a.customerId === customerId && a.tenantId === user.tenant_id
    ) || null;
  }

  async calculateCustomerAnalytics(customerId: string): Promise<CustomerAnalyticsDTO> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    // Mock calculation logic
    const interactions = this.mockInteractions.filter(i => i.customerId === customerId);
    const analytics: CustomerAnalyticsDTO = {
      id: Date.now().toString(),
      customerId,
      tenantId: user.tenant_id,
      customerSince: '2024-01-15T00:00:00Z',
      totalInteractions: interactions.length,
      lastInteractionDate: interactions.length > 0 ?
        interactions.sort((a, b) => new Date(b.interactionDate).getTime() - new Date(a.interactionDate).getTime())[0].interactionDate :
        undefined,
      lifetimeValue: Math.random() * 100000,
      averageOrderValue: Math.random() * 20000,
      totalOrders: Math.floor(Math.random() * 10) + 1,
      totalRevenue: Math.random() * 100000,
      churnRiskScore: Math.random() * 0.5,
      lastCalculatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update or add to mock data
    const existingIndex = this.mockAnalytics.findIndex(a => a.customerId === customerId);
    if (existingIndex >= 0) {
      this.mockAnalytics[existingIndex] = analytics;
    } else {
      this.mockAnalytics.push(analytics);
    }

    return analytics;
  }
}

export const mockCustomerService = new MockCustomerService();