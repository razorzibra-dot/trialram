/**
 * LAYER 3: MOCK SERVICE - Reference Data Loader
 * ============================================================================
 * Mock implementation for reference data loading - used when VITE_API_MODE=mock
 * Part of 8-layer sync pattern for dynamic data loading architecture
 * 
 * ✅ SYNCHRONIZATION:
 * - Field names: exactly match database (camelCase conversion already done in types)
 * - Types: match referenceData.types.ts exactly
 * - Validation: same as Supabase service
 * - Error handling: consistent with Supabase service
 */

import {
  StatusOption,
  ReferenceData,
  ProductCategory,
  Supplier,
  AllReferenceData,
  ReferenceDataLoadResult,
  CreateStatusOptionDTO,
  UpdateStatusOptionDTO,
  CreateReferenceDataDTO,
  UpdateReferenceDataDTO,
  CreateProductCategoryDTO,
  UpdateProductCategoryDTO,
  CreateSupplierDTO,
  UpdateSupplierDTO,
} from '@/types/referenceData.types';

/**
 * Mock status options data
 * Structure matches: status_options table in database
 */
const mockStatusOptions: StatusOption[] = [
  // Sales module statuses
  {
    id: 'status-sales-pending',
    tenantId: 'tenant-1',
    module: 'sales',
    statusKey: 'pending',
    displayLabel: 'Pending',
    colorCode: '#FFA500',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'status-sales-in-progress',
    tenantId: 'tenant-1',
    module: 'sales',
    statusKey: 'in_progress',
    displayLabel: 'In Progress',
    colorCode: '#4A90E2',
    sortOrder: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'status-sales-completed',
    tenantId: 'tenant-1',
    module: 'sales',
    statusKey: 'completed',
    displayLabel: 'Completed',
    colorCode: '#50C878',
    sortOrder: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Tickets module statuses
  {
    id: 'status-tickets-open',
    tenantId: 'tenant-1',
    module: 'tickets',
    statusKey: 'open',
    displayLabel: 'Open',
    colorCode: '#FF6B6B',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'status-tickets-in-progress',
    tenantId: 'tenant-1',
    module: 'tickets',
    statusKey: 'in_progress',
    displayLabel: 'In Progress',
    colorCode: '#4A90E2',
    sortOrder: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'status-tickets-closed',
    tenantId: 'tenant-1',
    module: 'tickets',
    statusKey: 'closed',
    displayLabel: 'Closed',
    colorCode: '#50C878',
    sortOrder: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Contracts module statuses
  {
    id: 'status-contracts-draft',
    tenantId: 'tenant-1',
    module: 'contracts',
    statusKey: 'draft',
    displayLabel: 'Draft',
    colorCode: '#95A5A6',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'status-contracts-active',
    tenantId: 'tenant-1',
    module: 'contracts',
    statusKey: 'active',
    displayLabel: 'Active',
    colorCode: '#50C878',
    sortOrder: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'status-contracts-expired',
    tenantId: 'tenant-1',
    module: 'contracts',
    statusKey: 'expired',
    displayLabel: 'Expired',
    colorCode: '#E74C3C',
    sortOrder: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Job Work module statuses
  {
    id: 'status-jobwork-scheduled',
    tenantId: 'tenant-1',
    module: 'jobwork',
    statusKey: 'scheduled',
    displayLabel: 'Scheduled',
    colorCode: '#3498DB',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'status-jobwork-in-progress',
    tenantId: 'tenant-1',
    module: 'jobwork',
    statusKey: 'in_progress',
    displayLabel: 'In Progress',
    colorCode: '#FFA500',
    sortOrder: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'status-jobwork-completed',
    tenantId: 'tenant-1',
    module: 'jobwork',
    statusKey: 'completed',
    displayLabel: 'Completed',
    colorCode: '#50C878',
    sortOrder: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Mock reference data
 * Structure matches: reference_data table in database
 */
const mockReferenceData: ReferenceData[] = [
  // Priorities
  {
    id: 'ref-priority-high',
    tenantId: 'tenant-1',
    category: 'priority',
    key: 'high',
    label: 'High Priority',
    metadata: { color: '#FF5733', weight: 100 },
    sortOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ref-priority-medium',
    tenantId: 'tenant-1',
    category: 'priority',
    key: 'medium',
    label: 'Medium Priority',
    metadata: { color: '#FFA500', weight: 50 },
    sortOrder: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ref-priority-low',
    tenantId: 'tenant-1',
    category: 'priority',
    key: 'low',
    label: 'Low Priority',
    metadata: { color: '#90EE90', weight: 10 },
    sortOrder: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Severities
  {
    id: 'ref-severity-critical',
    tenantId: 'tenant-1',
    category: 'severity',
    key: 'critical',
    label: 'Critical',
    metadata: { color: '#FF0000', icon: 'AlertCircle' },
    sortOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ref-severity-high',
    tenantId: 'tenant-1',
    category: 'severity',
    key: 'high',
    label: 'High',
    metadata: { color: '#FF6B6B', icon: 'AlertTriangle' },
    sortOrder: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ref-severity-medium',
    tenantId: 'tenant-1',
    category: 'severity',
    key: 'medium',
    label: 'Medium',
    metadata: { color: '#FFA500', icon: 'AlertCircle' },
    sortOrder: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ref-severity-low',
    tenantId: 'tenant-1',
    category: 'severity',
    key: 'low',
    label: 'Low',
    metadata: { color: '#90EE90', icon: 'Info' },
    sortOrder: 4,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Departments
  {
    id: 'ref-department-sales',
    tenantId: 'tenant-1',
    category: 'department',
    key: 'sales',
    label: 'Sales',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ref-department-support',
    tenantId: 'tenant-1',
    category: 'department',
    key: 'support',
    label: 'Support',
    sortOrder: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ref-department-engineering',
    tenantId: 'tenant-1',
    category: 'department',
    key: 'engineering',
    label: 'Engineering',
    sortOrder: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Mock product categories
 * Structure matches: product_categories table in database
 */
const mockCategories: ProductCategory[] = [
  {
    id: 'cat-electronics',
    tenantId: 'tenant-1',
    name: 'Electronics',
    description: 'Electronic products and devices',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-software',
    tenantId: 'tenant-1',
    name: 'Software',
    description: 'Software solutions and licenses',
    sortOrder: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-services',
    tenantId: 'tenant-1',
    name: 'Services',
    description: 'Professional services',
    sortOrder: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Mock suppliers
 * Structure matches: suppliers table in database
 */
const mockSuppliers: Supplier[] = [
  {
    id: 'supplier-1',
    tenantId: 'tenant-1',
    name: 'Tech Supplies Inc.',
    email: 'sales@techsupplies.com',
    phone: '+1-555-0101',
    website: 'https://techsupplies.com',
    contactPerson: 'John Smith',
    contactEmail: 'john@techsupplies.com',
    contactPhone: '+1-555-0102',
    industry: 'Technology',
    country: 'USA',
    sortOrder: 1,
    isActive: true,
    notes: 'Primary supplier for electronics',
    taxId: 'TAX-001',
    paymentTerms: 'Net 30',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'supplier-2',
    tenantId: 'tenant-1',
    name: 'Global Components Ltd.',
    email: 'info@globalcomponents.com',
    phone: '+44-20-7946-0958',
    website: 'https://globalcomponents.com',
    contactPerson: 'Jane Doe',
    contactEmail: 'jane@globalcomponents.com',
    contactPhone: '+44-20-7946-0959',
    industry: 'Manufacturing',
    country: 'UK',
    sortOrder: 2,
    isActive: true,
    notes: 'Secondary supplier for components',
    taxId: 'TAX-002',
    paymentTerms: 'Net 45',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Mock Reference Data Loader Service
 * 
 * Methods:
 * - loadAllReferenceData(): Load all reference data at once
 * - loadStatusOptions(): Load status options for all modules
 * - loadReferenceData(): Load generic reference data
 * - loadCategories(): Load product categories
 * - loadSuppliers(): Load suppliers
 * 
 * ✅ SYNC RULES:
 * 1. Field names exactly match types (camelCase)
 * 2. Validation identical to Supabase service
 * 3. Error handling consistent
 * 4. Returns exact same types as Supabase
 */
export const mockReferenceDataLoader = {
  /**
   * Load all reference data at once
   * Used by context provider on app initialization
   */
  async loadAllReferenceData(tenantId: string): Promise<AllReferenceData> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Filter by tenant
      const statusOptions = mockStatusOptions.filter(
        s => s.tenantId === tenantId && s.isActive
      );
      const referenceData = mockReferenceData.filter(
        r => r.tenantId === tenantId && r.isActive
      );
      const categories = mockCategories.filter(
        c => c.tenantId === tenantId && c.isActive
      );
      const suppliers = mockSuppliers.filter(
        s => s.tenantId === tenantId && s.isActive
      );

      return {
        statusOptions,
        referenceData,
        categories,
        suppliers,
      };
    } catch (error) {
      throw new Error(`Failed to load reference data: ${error}`);
    }
  },

  /**
   * Load status options for specific module(s)
   */
  async loadStatusOptions(
    tenantId: string,
    module?: string
  ): Promise<StatusOption[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 50));

      let statuses = mockStatusOptions.filter(
        s => s.tenantId === tenantId && s.isActive
      );

      if (module) {
        statuses = statuses.filter(s => s.module === module);
      }

      return statuses.sort((a, b) => a.sortOrder - b.sortOrder);
    } catch (error) {
      throw new Error(`Failed to load status options: ${error}`);
    }
  },

  /**
   * Load generic reference data by category
   */
  async loadReferenceData(
    tenantId: string,
    category?: string
  ): Promise<ReferenceData[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 50));

      let refData = mockReferenceData.filter(
        r => r.tenantId === tenantId && r.isActive
      );

      if (category) {
        refData = refData.filter(r => r.category === category);
      }

      return refData.sort((a, b) => a.sortOrder - b.sortOrder);
    } catch (error) {
      throw new Error(`Failed to load reference data: ${error}`);
    }
  },

  /**
   * Load product categories
   */
  async loadCategories(tenantId: string): Promise<ProductCategory[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 50));

      const categories = mockCategories.filter(
        c => c.tenantId === tenantId && c.isActive
      );

      return categories.sort((a, b) => a.sortOrder - b.sortOrder);
    } catch (error) {
      throw new Error(`Failed to load product categories: ${error}`);
    }
  },

  /**
   * Load suppliers
   */
  async loadSuppliers(tenantId: string): Promise<Supplier[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 50));

      const suppliers = mockSuppliers.filter(
        s => s.tenantId === tenantId && s.isActive
      );

      return suppliers.sort((a, b) => a.sortOrder - b.sortOrder);
    } catch (error) {
      throw new Error(`Failed to load suppliers: ${error}`);
    }
  },

  /**
   * Create status option (mock only)
   */
  async createStatusOption(
    data: CreateStatusOptionDTO
  ): Promise<StatusOption> {
    if (!data.module || !data.statusKey || !data.displayLabel) {
      throw new Error('Required fields missing');
    }

    const newStatus: StatusOption = {
      id: `status-${Date.now()}`,
      tenantId: data.tenantId,
      module: data.module,
      statusKey: data.statusKey,
      displayLabel: data.displayLabel,
      description: data.description,
      colorCode: data.colorCode,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockStatusOptions.push(newStatus);
    return newStatus;
  },

  /**
   * Create reference data (mock only)
   */
  async createReferenceData(data: CreateReferenceDataDTO): Promise<ReferenceData> {
    if (!data.category || !data.key || !data.label) {
      throw new Error('Required fields missing');
    }

    const newRefData: ReferenceData = {
      id: `ref-${Date.now()}`,
      tenantId: data.tenantId,
      category: data.category,
      key: data.key,
      label: data.label,
      description: data.description,
      metadata: data.metadata,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockReferenceData.push(newRefData);
    return newRefData;
  },

  /**
   * Create product category (mock only)
   */
  async createCategory(data: CreateProductCategoryDTO): Promise<ProductCategory> {
    if (!data.name) {
      throw new Error('Category name is required');
    }

    const newCategory: ProductCategory = {
      id: `cat-${Date.now()}`,
      tenantId: data.tenantId,
      name: data.name,
      description: data.description,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockCategories.push(newCategory);
    return newCategory;
  },

  /**
   * Create supplier (mock only)
   */
  async createSupplier(data: CreateSupplierDTO): Promise<Supplier> {
    if (!data.name) {
      throw new Error('Supplier name is required');
    }

    const newSupplier: Supplier = {
      id: `supplier-${Date.now()}`,
      tenantId: data.tenantId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      website: data.website,
      contactPerson: data.contactPerson,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      industry: data.industry,
      country: data.country,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
      notes: data.notes,
      taxId: data.taxId,
      creditLimit: data.creditLimit,
      paymentTerms: data.paymentTerms,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockSuppliers.push(newSupplier);
    return newSupplier;
  },
};

export default mockReferenceDataLoader;
