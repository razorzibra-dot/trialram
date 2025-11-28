/**
 * LAYER 3: MOCK SERVICE - Reference Data Mock Implementation
 * ============================================================================
 * Mock implementations for reference data services
 * Used when VITE_API_MODE=mock
 * Part of 8-layer sync pattern
 */

import {
  StatusOption,
  ReferenceData,
  ProductCategory,
  Supplier,
  AllReferenceData,
  CreateStatusOptionDTO,
  CreateReferenceDataDTO,
  CreateProductCategoryDTO,
  CreateSupplierDTO,
  UpdateStatusOptionDTO,
  UpdateReferenceDataDTO,
  UpdateProductCategoryDTO,
  UpdateSupplierDTO,
  ReferenceDataLoadResult,
} from '@/types/referenceData.types';

// ============================================================================
// 1. MOCK DATA - Static reference data for development
// ============================================================================

const MOCK_TENANT_ID = 'mock-tenant-001';
const NOW = new Date().toISOString();

const MOCK_STATUS_OPTIONS: StatusOption[] = [
  // Sales module statuses
  {
    id: 'so-1',
    tenantId: MOCK_TENANT_ID,
    module: 'sales',
    statusKey: 'pending',
    displayLabel: 'Pending',
    description: 'Sale is pending approval',
    colorCode: '#FFA500',
    sortOrder: 1,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'so-2',
    tenantId: MOCK_TENANT_ID,
    module: 'sales',
    statusKey: 'won',
    displayLabel: 'Won',
    description: 'Sale has been won',
    colorCode: '#4CAF50',
    sortOrder: 2,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'so-3',
    tenantId: MOCK_TENANT_ID,
    module: 'sales',
    statusKey: 'lost',
    displayLabel: 'Lost',
    description: 'Sale has been lost',
    colorCode: '#F44336',
    sortOrder: 3,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  // Tickets module statuses
  {
    id: 'so-4',
    tenantId: MOCK_TENANT_ID,
    module: 'tickets',
    statusKey: 'open',
    displayLabel: 'Open',
    description: 'Ticket is open',
    colorCode: '#2196F3',
    sortOrder: 1,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'so-5',
    tenantId: MOCK_TENANT_ID,
    module: 'tickets',
    statusKey: 'in_progress',
    displayLabel: 'In Progress',
    description: 'Ticket is being worked on',
    colorCode: '#FF9800',
    sortOrder: 2,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'so-6',
    tenantId: MOCK_TENANT_ID,
    module: 'tickets',
    statusKey: 'resolved',
    displayLabel: 'Resolved',
    description: 'Ticket has been resolved',
    colorCode: '#4CAF50',
    sortOrder: 3,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  // Contracts module statuses
  {
    id: 'so-7',
    tenantId: MOCK_TENANT_ID,
    module: 'contracts',
    statusKey: 'draft',
    displayLabel: 'Draft',
    description: 'Contract is in draft',
    colorCode: '#9E9E9E',
    sortOrder: 1,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'so-8',
    tenantId: MOCK_TENANT_ID,
    module: 'contracts',
    statusKey: 'active',
    displayLabel: 'Active',
    description: 'Contract is active',
    colorCode: '#4CAF50',
    sortOrder: 2,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const MOCK_REFERENCE_DATA: ReferenceData[] = [
  // Priorities
  {
    id: 'rd-1',
    tenantId: MOCK_TENANT_ID,
    category: 'priority',
    key: 'low',
    label: 'Low Priority',
    metadata: { color: '#4CAF50', weight: 1 },
    sortOrder: 1,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-2',
    tenantId: MOCK_TENANT_ID,
    category: 'priority',
    key: 'medium',
    label: 'Medium Priority',
    metadata: { color: '#FFA500', weight: 2 },
    sortOrder: 2,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-3',
    tenantId: MOCK_TENANT_ID,
    category: 'priority',
    key: 'high',
    label: 'High Priority',
    metadata: { color: '#F44336', weight: 3 },
    sortOrder: 3,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  // Severities
  {
    id: 'rd-4',
    tenantId: MOCK_TENANT_ID,
    category: 'severity',
    key: 'minor',
    label: 'Minor',
    metadata: { color: '#4CAF50' },
    sortOrder: 1,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-5',
    tenantId: MOCK_TENANT_ID,
    category: 'severity',
    key: 'major',
    label: 'Major',
    metadata: { color: '#FFA500' },
    sortOrder: 2,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-6',
    tenantId: MOCK_TENANT_ID,
    category: 'severity',
    key: 'critical',
    label: 'Critical',
    metadata: { color: '#F44336' },
    sortOrder: 3,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  // Industries
  {
    id: 'rd-7',
    tenantId: MOCK_TENANT_ID,
    category: 'industry',
    key: 'technology',
    label: 'Technology',
    description: 'Software, hardware, and IT services',
    metadata: { icon: '💻' },
    sortOrder: 1,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-8',
    tenantId: MOCK_TENANT_ID,
    category: 'industry',
    key: 'finance',
    label: 'Finance',
    description: 'Banking, insurance, and financial services',
    metadata: { icon: '💰' },
    sortOrder: 2,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-9',
    tenantId: MOCK_TENANT_ID,
    category: 'industry',
    key: 'healthcare',
    label: 'Healthcare',
    description: 'Medical, pharmaceutical, and healthcare services',
    metadata: { icon: '⚕️' },
    sortOrder: 3,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-10',
    tenantId: MOCK_TENANT_ID,
    category: 'industry',
    key: 'retail',
    label: 'Retail',
    description: 'E-commerce and physical retail',
    metadata: { icon: '🛍️' },
    sortOrder: 4,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-11',
    tenantId: MOCK_TENANT_ID,
    category: 'industry',
    key: 'manufacturing',
    label: 'Manufacturing',
    description: 'Industrial production and manufacturing',
    metadata: { icon: '🏭' },
    sortOrder: 5,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-12',
    tenantId: MOCK_TENANT_ID,
    category: 'industry',
    key: 'education',
    label: 'Education',
    description: 'Educational institutions and training',
    metadata: { icon: '🎓' },
    sortOrder: 6,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-13',
    tenantId: MOCK_TENANT_ID,
    category: 'industry',
    key: 'consulting',
    label: 'Consulting',
    description: 'Management and business consulting',
    metadata: { icon: '📊' },
    sortOrder: 7,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-14',
    tenantId: MOCK_TENANT_ID,
    category: 'industry',
    key: 'energy',
    label: 'Energy',
    description: 'Oil, gas, renewable energy, and utilities',
    metadata: { icon: '⚡' },
    sortOrder: 8,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-15',
    tenantId: MOCK_TENANT_ID,
    category: 'industry',
    key: 'transportation',
    label: 'Transportation & Logistics',
    description: 'Shipping, logistics, and transportation',
    metadata: { icon: '🚚' },
    sortOrder: 9,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  // Company Sizes
  {
    id: 'rd-16',
    tenantId: MOCK_TENANT_ID,
    category: 'company_size',
    key: 'startup',
    label: 'Startup (1-50 employees)',
    description: 'Small startup company',
    metadata: { minEmployees: 1, maxEmployees: 50 },
    sortOrder: 1,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-17',
    tenantId: MOCK_TENANT_ID,
    category: 'company_size',
    key: 'small',
    label: 'Small Business (51-200 employees)',
    description: 'Small business',
    metadata: { minEmployees: 51, maxEmployees: 200 },
    sortOrder: 2,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-18',
    tenantId: MOCK_TENANT_ID,
    category: 'company_size',
    key: 'medium',
    label: 'Medium Enterprise (201-1000 employees)',
    description: 'Mid-sized enterprise',
    metadata: { minEmployees: 201, maxEmployees: 1000 },
    sortOrder: 3,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-19',
    tenantId: MOCK_TENANT_ID,
    category: 'company_size',
    key: 'large',
    label: 'Large Enterprise (1001-5000 employees)',
    description: 'Large enterprise',
    metadata: { minEmployees: 1001, maxEmployees: 5000 },
    sortOrder: 4,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-20',
    tenantId: MOCK_TENANT_ID,
    category: 'company_size',
    key: 'enterprise',
    label: 'Enterprise (5000+ employees)',
    description: 'Large corporation',
    metadata: { minEmployees: 5001, maxEmployees: 999999 },
    sortOrder: 5,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  // Customer Statuses
  {
    id: 'rd-21',
    tenantId: MOCK_TENANT_ID,
    category: 'customer_status',
    key: 'active',
    label: 'Active',
    metadata: { icon: 'CheckCircle', color: '#4CAF50', emoji: '✅' },
    sortOrder: 1,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-22',
    tenantId: MOCK_TENANT_ID,
    category: 'customer_status',
    key: 'inactive',
    label: 'Inactive',
    metadata: { icon: 'X', color: '#9E9E9E', emoji: '❌' },
    sortOrder: 2,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-23',
    tenantId: MOCK_TENANT_ID,
    category: 'customer_status',
    key: 'prospect',
    label: 'Prospect',
    metadata: { icon: 'Clock', color: '#FFA500', emoji: '⏳' },
    sortOrder: 3,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-24',
    tenantId: MOCK_TENANT_ID,
    category: 'customer_status',
    key: 'suspended',
    label: 'Suspended',
    metadata: { icon: 'AlertCircle', color: '#F44336', emoji: '🛑' },
    sortOrder: 4,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  // Customer Types
  {
    id: 'rd-25',
    tenantId: MOCK_TENANT_ID,
    category: 'customer_type',
    key: 'business',
    label: 'Business',
    metadata: { icon: 'Building', emoji: '🏢' },
    sortOrder: 1,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-26',
    tenantId: MOCK_TENANT_ID,
    category: 'customer_type',
    key: 'individual',
    label: 'Individual',
    metadata: { icon: 'User', emoji: '👤' },
    sortOrder: 2,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-27',
    tenantId: MOCK_TENANT_ID,
    category: 'customer_type',
    key: 'corporate',
    label: 'Corporate',
    metadata: { icon: 'Building2', emoji: '🏛️' },
    sortOrder: 3,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-28',
    tenantId: MOCK_TENANT_ID,
    category: 'customer_type',
    key: 'government',
    label: 'Government',
    metadata: { icon: 'Building3', emoji: '🏛️' },
    sortOrder: 4,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  // Lead Sources
  {
    id: 'rd-29',
    tenantId: MOCK_TENANT_ID,
    category: 'lead_source',
    key: 'referral',
    label: 'Referral',
    metadata: { icon: 'Users', emoji: '👥' },
    sortOrder: 1,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-30',
    tenantId: MOCK_TENANT_ID,
    category: 'lead_source',
    key: 'website',
    label: 'Website',
    metadata: { icon: 'Globe', emoji: '🌐' },
    sortOrder: 2,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-31',
    tenantId: MOCK_TENANT_ID,
    category: 'lead_source',
    key: 'sales_team',
    label: 'Sales Team',
    metadata: { icon: 'Phone', emoji: '📞' },
    sortOrder: 3,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-32',
    tenantId: MOCK_TENANT_ID,
    category: 'lead_source',
    key: 'event',
    label: 'Event',
    metadata: { icon: 'Target', emoji: '🎯' },
    sortOrder: 4,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-33',
    tenantId: MOCK_TENANT_ID,
    category: 'lead_source',
    key: 'other',
    label: 'Other',
    metadata: { icon: 'MoreHorizontal', emoji: '📋' },
    sortOrder: 5,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  // Lead Ratings
  {
    id: 'rd-34',
    tenantId: MOCK_TENANT_ID,
    category: 'lead_rating',
    key: 'cold',
    label: 'Cold Lead',
    metadata: { icon: 'Snowflake', emoji: '❄️', weight: 1 },
    sortOrder: 1,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-35',
    tenantId: MOCK_TENANT_ID,
    category: 'lead_rating',
    key: 'warm',
    label: 'Warm Lead',
    metadata: { icon: 'Sun', emoji: '☀️', weight: 2 },
    sortOrder: 2,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'rd-36',
    tenantId: MOCK_TENANT_ID,
    category: 'lead_rating',
    key: 'hot',
    label: 'Hot Lead',
    metadata: { icon: 'Flame', emoji: '🔥', weight: 3 },
    sortOrder: 3,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const MOCK_CATEGORIES: ProductCategory[] = [
  {
    id: 'cat-1',
    tenantId: MOCK_TENANT_ID,
    name: 'Electronics',
    description: 'Electronic products and components',
    parentId: undefined, // Root category
    isActive: true,
    sortOrder: 1,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'cat-2',
    tenantId: MOCK_TENANT_ID,
    name: 'Software',
    description: 'Software solutions and licenses',
    parentId: undefined, // Root category
    isActive: true,
    sortOrder: 2,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'cat-3',
    tenantId: MOCK_TENANT_ID,
    name: 'Services',
    description: 'Professional services',
    parentId: undefined, // Root category
    isActive: true,
    sortOrder: 3,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'cat-4',
    tenantId: MOCK_TENANT_ID,
    name: 'Hardware Components',
    description: 'Physical hardware components',
    parentId: 'cat-1', // Child of Electronics
    isActive: true,
    sortOrder: 1,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'cat-5',
    tenantId: MOCK_TENANT_ID,
    name: 'Software Licenses',
    description: 'Software licensing and subscriptions',
    parentId: 'cat-2', // Child of Software
    isActive: true,
    sortOrder: 1,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    tenantId: MOCK_TENANT_ID,
    name: 'Tech Components Ltd',
    email: 'contact@techcomp.com',
    phone: '+1-555-0101',
    address: '123 Tech Street, Silicon Valley, CA',
    website: 'www.techcomp.com',
    contactPerson: 'John Smith',
    contactEmail: 'john@techcomp.com',
    industry: 'Electronics Manufacturing',
    country: 'USA',
    isActive: true,
    sortOrder: 1,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'sup-2',
    tenantId: MOCK_TENANT_ID,
    name: 'Global Software Solutions',
    email: 'sales@globalsoftware.com',
    phone: '+1-555-0102',
    address: '456 Software Ave, Seattle, WA',
    website: 'www.globalsoftware.com',
    contactPerson: 'Jane Doe',
    contactEmail: 'jane@globalsoftware.com',
    industry: 'Software Development',
    country: 'USA',
    isActive: true,
    sortOrder: 2,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'sup-3',
    tenantId: MOCK_TENANT_ID,
    name: 'Premium Parts Distributor',
    email: 'info@premiumparts.com',
    phone: '+1-555-0103',
    address: '789 Parts Plaza, Chicago, IL',
    website: 'www.premiumparts.com',
    contactPerson: 'Mike Johnson',
    contactEmail: 'mike@premiumparts.com',
    industry: 'Parts Distribution',
    country: 'USA',
    isActive: true,
    sortOrder: 3,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

// ============================================================================
// 2. MOCK SERVICE IMPLEMENTATION
// ============================================================================

class MockReferenceDataService {
  /**
   * Load all reference data at once
   */
  async loadAllReferenceData(tenantId?: string): Promise<AllReferenceData> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      statusOptions: MOCK_STATUS_OPTIONS.filter(s => !tenantId || s.tenantId === tenantId),
      referenceData: MOCK_REFERENCE_DATA.filter(r => !tenantId || r.tenantId === tenantId),
      categories: MOCK_CATEGORIES.filter(c => !tenantId || c.tenantId === tenantId),
      suppliers: MOCK_SUPPLIERS.filter(s => !tenantId || s.tenantId === tenantId),
    };
  }

  /**
   * Get status options - context calls without module, module calls with module
   */
  async getStatusOptions(module?: string, tenantId?: string): Promise<StatusOption[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return MOCK_STATUS_OPTIONS.filter(
      s => (!module || s.module === module) && (!tenantId || s.tenantId === tenantId) && s.isActive
    );
  }

  /**
   * Get reference data by category - context calls without category, module calls with category
   */
  async getReferenceData(category?: string, tenantId?: string): Promise<ReferenceData[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return MOCK_REFERENCE_DATA.filter(
      r => (!category || r.category === category) && (!tenantId || r.tenantId === tenantId) && r.isActive
    );
  }

  /**
   * Get all active categories
   */
  async getCategories(tenantId?: string): Promise<ProductCategory[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return MOCK_CATEGORIES.filter(c => (!tenantId || c.tenantId === tenantId) && c.isActive);
  }

  /**
   * Get all active suppliers
   */
  async getSuppliers(tenantId?: string): Promise<Supplier[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return MOCK_SUPPLIERS.filter(s => (!tenantId || s.tenantId === tenantId) && s.isActive);
  }

  /**
   * Create status option
   */
  async createStatusOption(dto: CreateStatusOptionDTO): Promise<StatusOption> {
    const newOption: StatusOption = {
      id: `so-${Math.random().toString(36).substr(2, 9)}`,
      ...dto,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
      createdAt: NOW,
      updatedAt: NOW,
    };
    MOCK_STATUS_OPTIONS.push(newOption);
    return newOption;
  }

  /**
   * Create reference data
   */
  async createReferenceData(dto: CreateReferenceDataDTO): Promise<ReferenceData> {
    const newData: ReferenceData = {
      id: `rd-${Math.random().toString(36).substr(2, 9)}`,
      ...dto,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
      metadata: dto.metadata ?? {},
      createdAt: NOW,
      updatedAt: NOW,
    };
    MOCK_REFERENCE_DATA.push(newData);
    return newData;
  }

  /**
   * Create category
   */
  async createCategory(dto: CreateProductCategoryDTO): Promise<ProductCategory> {
    const newCategory: ProductCategory = {
      id: `cat-${Math.random().toString(36).substr(2, 9)}`,
      ...dto,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
      createdAt: NOW,
      updatedAt: NOW,
    };
    MOCK_CATEGORIES.push(newCategory);
    return newCategory;
  }

  /**
   * Create supplier
   */
  async createSupplier(dto: CreateSupplierDTO): Promise<Supplier> {
    const newSupplier: Supplier = {
      id: `sup-${Math.random().toString(36).substr(2, 9)}`,
      ...dto,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
      createdAt: NOW,
      updatedAt: NOW,
    };
    MOCK_SUPPLIERS.push(newSupplier);
    return newSupplier;
  }

  /**
   * Update methods (mock implementation)
   */
  async updateStatusOption(id: string, dto: UpdateStatusOptionDTO): Promise<StatusOption> {
    const option = MOCK_STATUS_OPTIONS.find(o => o.id === id);
    if (!option) throw new Error(`Status option ${id} not found`);
    Object.assign(option, { ...dto, updatedAt: NOW });
    return option;
  }

  async updateReferenceData(id: string, dto: UpdateReferenceDataDTO): Promise<ReferenceData> {
    const data = MOCK_REFERENCE_DATA.find(d => d.id === id);
    if (!data) throw new Error(`Reference data ${id} not found`);
    Object.assign(data, { ...dto, updatedAt: NOW });
    return data;
  }

  async updateCategory(id: string, dto: UpdateProductCategoryDTO): Promise<ProductCategory> {
    const category = MOCK_CATEGORIES.find(c => c.id === id);
    if (!category) throw new Error(`Category ${id} not found`);
    Object.assign(category, { ...dto, updatedAt: NOW });
    return category;
  }

  async updateSupplier(id: string, dto: UpdateSupplierDTO): Promise<Supplier> {
    const supplier = MOCK_SUPPLIERS.find(s => s.id === id);
    if (!supplier) throw new Error(`Supplier ${id} not found`);
    Object.assign(supplier, { ...dto, updatedAt: NOW });
    return supplier;
  }

  /**
   * Delete methods (soft delete - set isActive to false)
   */
  async deleteStatusOption(id: string): Promise<void> {
    const option = MOCK_STATUS_OPTIONS.find(o => o.id === id);
    if (option) option.isActive = false;
  }

  async deleteReferenceData(id: string): Promise<void> {
    const data = MOCK_REFERENCE_DATA.find(d => d.id === id);
    if (data) data.isActive = false;
  }

  async deleteCategory(id: string): Promise<void> {
    const category = MOCK_CATEGORIES.find(c => c.id === id);
    if (category) category.isActive = false;
  }

  async deleteSupplier(id: string): Promise<void> {
    const supplier = MOCK_SUPPLIERS.find(s => s.id === id);
    if (supplier) supplier.isActive = false;
  }
}

// ============================================================================
// 3. EXPORT SINGLETON
// ============================================================================

export const mockReferenceDataService = new MockReferenceDataService();