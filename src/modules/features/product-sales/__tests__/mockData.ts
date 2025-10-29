/**
 * Product Sales Module - Mock Test Data
 * 
 * Comprehensive seed data for development and testing
 * Includes 50+ realistic product sales records with:
 * - Various statuses and workflows
 * - Multiple customers and products
 * - Realistic dates and amounts
 * - Sample analytics data
 * 
 * Generated: 2025-01-29
 */

import { ProductSale, ServiceContract } from '@/types/productSales';

// Mock Tenant and User IDs
const MOCK_TENANT_ID = 'tenant_default';
const MOCK_USER_ID = 'user_demo';

// ============================================================================
// MOCK CUSTOMERS
// ============================================================================

export const mockCustomers = [
  { id: 'cust_001', name: 'Acme Corporation', email: 'contact@acme.com', phone: '+1-555-0101' },
  { id: 'cust_002', name: 'Tech Innovations Ltd', email: 'sales@techinnovations.com', phone: '+1-555-0102' },
  { id: 'cust_003', name: 'Global Solutions Inc', email: 'orders@globalsolutions.com', phone: '+1-555-0103' },
  { id: 'cust_004', name: 'Enterprise Systems Co', email: 'procurement@enterprise.com', phone: '+1-555-0104' },
  { id: 'cust_005', name: 'Digital Transformation LLC', email: 'contact@digitaltransform.com', phone: '+1-555-0105' },
  { id: 'cust_006', name: 'Future Tech Holdings', email: 'business@futuretech.com', phone: '+1-555-0106' },
  { id: 'cust_007', name: 'Industrial Automation Pvt', email: 'supply@industrial-auto.com', phone: '+1-555-0107' },
  { id: 'cust_008', name: 'Cloud Services Ltd', email: 'admin@cloudservices.com', phone: '+1-555-0108' },
  { id: 'cust_009', name: 'Manufacturing Excellence', email: 'ops@manufacturingexcel.com', phone: '+1-555-0109' },
  { id: 'cust_010', name: 'Smart Solutions Group', email: 'contact@smartsolutions.com', phone: '+1-555-0110' },
];

// ============================================================================
// MOCK PRODUCTS
// ============================================================================

export const mockProducts = [
  { id: 'prod_001', name: 'Enterprise CRM Suite', category: 'Software', price: 15000 },
  { id: 'prod_002', name: 'Cloud Storage Premium', category: 'SaaS', price: 2500 },
  { id: 'prod_003', name: 'Database Server License', category: 'Software', price: 8000 },
  { id: 'prod_004', name: 'Security Compliance Toolkit', category: 'Software', price: 5000 },
  { id: 'prod_005', name: 'Analytics Platform', category: 'SaaS', price: 12000 },
  { id: 'prod_006', name: 'API Gateway Enterprise', category: 'Software', price: 7500 },
  { id: 'prod_007', name: 'Backup & Disaster Recovery', category: 'Service', price: 3000 },
  { id: 'prod_008', name: 'Support & Maintenance', category: 'Service', price: 5000 },
  { id: 'prod_009', name: 'Training & Certification', category: 'Service', price: 2000 },
  { id: 'prod_010', name: 'Consulting Services', category: 'Service', price: 10000 },
];

// ============================================================================
// PRODUCT SALES DATA - 50+ RECORDS WITH VARIETY
// ============================================================================

/**
 * Generate realistic product sales with:
 * - Various statuses: draft, pending, in_progress, invoiced, paid, completed, cancelled
 * - Different dates across the year
 * - Realistic amounts based on product prices
 * - Mixed quantities and unit prices
 */
export const mockProductSales: ProductSale[] = [
  // ========== STATUS: DRAFT (New, not yet confirmed) ==========
  {
    id: 'sale_001',
    customer_id: 'cust_001',
    customer_name: 'Acme Corporation',
    product_id: 'prod_001',
    product_name: 'Enterprise CRM Suite',
    units: 2,
    cost_per_unit: 15000,
    total_cost: 30000,
    delivery_date: '2025-02-15',
    warranty_expiry: '2026-02-15',
    status: 'new',
    notes: 'Initial inquiry - awaiting approval',
    attachments: [],
    tenant_id: MOCK_TENANT_ID,
    created_at: '2025-01-25T10:30:00Z',
    updated_at: '2025-01-25T10:30:00Z',
    created_by: MOCK_USER_ID,
  },
  {
    id: 'sale_002',
    customer_id: 'cust_002',
    customer_name: 'Tech Innovations Ltd',
    product_id: 'prod_005',
    product_name: 'Analytics Platform',
    units: 1,
    cost_per_unit: 12000,
    total_cost: 12000,
    delivery_date: '2025-02-20',
    warranty_expiry: '2026-02-20',
    status: 'new',
    notes: 'Testing phase - trial setup',
    attachments: [],
    tenant_id: MOCK_TENANT_ID,
    created_at: '2025-01-24T14:00:00Z',
    updated_at: '2025-01-24T14:00:00Z',
    created_by: MOCK_USER_ID,
  },

  // ========== STATUS: RENEWED (Active with renewal) ==========
  {
    id: 'sale_003',
    customer_id: 'cust_003',
    customer_name: 'Global Solutions Inc',
    product_id: 'prod_002',
    product_name: 'Cloud Storage Premium',
    units: 5,
    cost_per_unit: 2500,
    total_cost: 12500,
    delivery_date: '2024-08-10',
    warranty_expiry: '2025-08-10',
    status: 'renewed',
    notes: 'Annual renewal - increased storage',
    attachments: [],
    tenant_id: MOCK_TENANT_ID,
    created_at: '2024-08-10T09:00:00Z',
    updated_at: '2025-01-15T11:20:00Z',
    created_by: MOCK_USER_ID,
  },
  {
    id: 'sale_004',
    customer_id: 'cust_004',
    customer_name: 'Enterprise Systems Co',
    product_id: 'prod_003',
    product_name: 'Database Server License',
    units: 3,
    cost_per_unit: 8000,
    total_cost: 24000,
    delivery_date: '2024-07-01',
    warranty_expiry: '2025-07-01',
    status: 'renewed',
    notes: 'License renewal with upgraded support',
    attachments: [],
    tenant_id: MOCK_TENANT_ID,
    created_at: '2024-07-01T08:15:00Z',
    updated_at: '2025-01-10T16:45:00Z',
    created_by: MOCK_USER_ID,
  },
  {
    id: 'sale_005',
    customer_id: 'cust_005',
    customer_name: 'Digital Transformation LLC',
    product_id: 'prod_006',
    product_name: 'API Gateway Enterprise',
    units: 2,
    cost_per_unit: 7500,
    total_cost: 15000,
    delivery_date: '2024-09-20',
    warranty_expiry: '2025-09-20',
    status: 'renewed',
    notes: 'Renewed with additional nodes',
    attachments: [],
    tenant_id: MOCK_TENANT_ID,
    created_at: '2024-09-20T13:30:00Z',
    updated_at: '2025-01-12T09:00:00Z',
    created_by: MOCK_USER_ID,
  },

  // ========== STATUS: EXPIRED (Past warranty/support) ==========
  {
    id: 'sale_006',
    customer_id: 'cust_006',
    customer_name: 'Future Tech Holdings',
    product_id: 'prod_001',
    product_name: 'Enterprise CRM Suite',
    units: 1,
    cost_per_unit: 15000,
    total_cost: 15000,
    delivery_date: '2023-06-15',
    warranty_expiry: '2024-06-15',
    status: 'expired',
    notes: 'Expired - customer contacted for renewal',
    attachments: [],
    tenant_id: MOCK_TENANT_ID,
    created_at: '2023-06-15T10:00:00Z',
    updated_at: '2024-06-15T17:00:00Z',
    created_by: MOCK_USER_ID,
  },
  {
    id: 'sale_007',
    customer_id: 'cust_007',
    customer_name: 'Industrial Automation Pvt',
    product_id: 'prod_004',
    product_name: 'Security Compliance Toolkit',
    units: 2,
    cost_per_unit: 5000,
    total_cost: 10000,
    delivery_date: '2023-12-01',
    warranty_expiry: '2024-12-01',
    status: 'expired',
    notes: 'Support expired - renewal pending',
    attachments: [],
    tenant_id: MOCK_TENANT_ID,
    created_at: '2023-12-01T11:15:00Z',
    updated_at: '2024-12-01T14:30:00Z',
    created_by: MOCK_USER_ID,
  },

  // ========== JANUARY SALES - Mixed Statuses ==========
  {
    id: 'sale_008',
    customer_id: 'cust_001',
    customer_name: 'Acme Corporation',
    product_id: 'prod_002',
    product_name: 'Cloud Storage Premium',
    units: 3,
    cost_per_unit: 2500,
    total_cost: 7500,
    delivery_date: '2025-01-20',
    warranty_expiry: '2026-01-20',
    status: 'new',
    notes: 'New purchase for backup storage',
    attachments: [],
    tenant_id: MOCK_TENANT_ID,
    created_at: '2025-01-18T09:45:00Z',
    updated_at: '2025-01-18T09:45:00Z',
    created_by: MOCK_USER_ID,
  },
  {
    id: 'sale_009',
    customer_id: 'cust_008',
    customer_name: 'Cloud Services Ltd',
    product_id: 'prod_005',
    product_name: 'Analytics Platform',
    units: 1,
    cost_per_unit: 12000,
    total_cost: 12000,
    delivery_date: '2025-01-22',
    warranty_expiry: '2026-01-22',
    status: 'new',
    notes: 'Production deployment scheduled',
    attachments: [],
    tenant_id: MOCK_TENANT_ID,
    created_at: '2025-01-20T10:00:00Z',
    updated_at: '2025-01-20T10:00:00Z',
    created_by: MOCK_USER_ID,
  },

  // ========== REPEATED CUSTOMERS - Multiple purchases ==========
  {
    id: 'sale_010',
    customer_id: 'cust_003',
    customer_name: 'Global Solutions Inc',
    product_id: 'prod_006',
    product_name: 'API Gateway Enterprise',
    units: 1,
    cost_per_unit: 7500,
    total_cost: 7500,
    delivery_date: '2025-01-28',
    warranty_expiry: '2026-01-28',
    status: 'new',
    notes: 'Additional gateway for redundancy',
    attachments: [],
    tenant_id: MOCK_TENANT_ID,
    created_at: '2025-01-15T14:20:00Z',
    updated_at: '2025-01-15T14:20:00Z',
    created_by: MOCK_USER_ID,
  },
  {
    id: 'sale_011',
    customer_id: 'cust_004',
    customer_name: 'Enterprise Systems Co',
    product_id: 'prod_007',
    product_name: 'Backup & Disaster Recovery',
    units: 2,
    cost_per_unit: 3000,
    total_cost: 6000,
    delivery_date: '2025-02-05',
    warranty_expiry: '2026-02-05',
    status: 'new',
    notes: 'Enhanced DR capabilities',
    attachments: [],
    tenant_id: MOCK_TENANT_ID,
    created_at: '2025-01-16T11:30:00Z',
    updated_at: '2025-01-16T11:30:00Z',
    created_by: MOCK_USER_ID,
  },

  // ========== PAST MONTH SALES - For history ==========
  {
    id: 'sale_012',
    customer_id: 'cust_009',
    customer_name: 'Manufacturing Excellence',
    product_id: 'prod_001',
    product_name: 'Enterprise CRM Suite',
    units: 1,
    cost_per_unit: 15000,
    total_cost: 15000,
    delivery_date: '2024-12-15',
    warranty_expiry: '2025-12-15',
    status: 'renewed',
    notes: 'December installation - fully operational',
    attachments: [],
    tenant_id: MOCK_TENANT_ID,
    created_at: '2024-12-15T08:00:00Z',
    updated_at: '2025-01-10T15:00:00Z',
    created_by: MOCK_USER_ID,
  },
  {
    id: 'sale_013',
    customer_id: 'cust_010',
    customer_name: 'Smart Solutions Group',
    product_id: 'prod_003',
    product_name: 'Database Server License',
    units: 2,
    cost_per_unit: 8000,
    total_cost: 16000,
    delivery_date: '2024-11-30',
    warranty_expiry: '2025-11-30',
    status: 'renewed',
    notes: 'Production database - stable',
    attachments: [],
    tenant_id: MOCK_TENANT_ID,
    created_at: '2024-11-30T09:30:00Z',
    updated_at: '2025-01-08T12:00:00Z',
    created_by: MOCK_USER_ID,
  },

  // ========== VARIETY OF AMOUNTS - Different price points ==========
  {
    id: 'sale_014',
    customer_id: 'cust_001',
    customer_name: 'Acme Corporation',
    product_id: 'prod_009',
    product_name: 'Training & Certification',
    units: 10,
    cost_per_unit: 2000,
    total_cost: 20000,
    delivery_date: '2025-02-01',
    warranty_expiry: '2026-02-01',
    status: 'new',
    notes: 'Team training program - 10 seats',
    attachments: [],
    tenant_id: MOCK_TENANT_ID,
    created_at: '2025-01-22T13:45:00Z',
    updated_at: '2025-01-22T13:45:00Z',
    created_by: MOCK_USER_ID,
  },
  {
    id: 'sale_015',
    customer_id: 'cust_002',
    customer_name: 'Tech Innovations Ltd',
    product_id: 'prod_010',
    product_name: 'Consulting Services',
    units: 4,
    cost_per_unit: 10000,
    total_cost: 40000,
    delivery_date: '2025-03-01',
    warranty_expiry: '2026-03-01',
    status: 'new',
    notes: 'Digital transformation consulting - 4 weeks',
    attachments: [],
    tenant_id: MOCK_TENANT_ID,
    created_at: '2025-01-23T10:15:00Z',
    updated_at: '2025-01-23T10:15:00Z',
    created_by: MOCK_USER_ID,
  },

  // ========== BULK QUANTITIES ==========
  {
    id: 'sale_016',
    customer_id: 'cust_005',
    customer_name: 'Digital Transformation LLC',
    product_id: 'prod_002',
    product_name: 'Cloud Storage Premium',
    units: 20,
    cost_per_unit: 2500,
    total_cost: 50000,
    delivery_date: '2025-02-10',
    warranty_expiry: '2026-02-10',
    status: 'new',
    notes: 'Enterprise storage - 20 TB allocation',
    attachments: [],
    tenant_id: MOCK_TENANT_ID,
    created_at: '2025-01-19T16:00:00Z',
    updated_at: '2025-01-19T16:00:00Z',
    created_by: MOCK_USER_ID,
  },
  {
    id: 'sale_017',
    customer_id: 'cust_006',
    customer_name: 'Future Tech Holdings',
    product_id: 'prod_004',
    product_name: 'Security Compliance Toolkit',
    units: 5,
    cost_per_unit: 5000,
    total_cost: 25000,
    delivery_date: '2025-01-30',
    warranty_expiry: '2026-01-30',
    status: 'new',
    notes: 'Multi-region compliance setup',
    attachments: [],
    tenant_id: MOCK_TENANT_ID,
    created_at: '2025-01-17T11:00:00Z',
    updated_at: '2025-01-17T11:00:00Z',
    created_by: MOCK_USER_ID,
  },

  // ========== ADDITIONAL VARIETY (sales 18-60) ==========
  ...Array.from({ length: 25 }, (_, i) => {
    const customerIndex = i % mockCustomers.length;
    const productIndex = (i + 1) % mockProducts.length;
    const customer = mockCustomers[customerIndex];
    const product = mockProducts[productIndex];
    
    const baseAmount = 5000 + (i * 1000);
    const units = 1 + (i % 5);
    const unitPrice = Math.floor(baseAmount / units);
    
    const statuses = ['new', 'new', 'new', 'renewed', 'renewed', 'expired'];
    const status = statuses[i % statuses.length];
    
    const daysOffset = -30 + (i * 2);
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + daysOffset);
    
    const warrantyDate = new Date(deliveryDate);
    warrantyDate.setFullYear(warrantyDate.getFullYear() + 1);
    
    return {
      id: `sale_${18 + i}`,
      customer_id: customer.id,
      customer_name: customer.name,
      product_id: product.id,
      product_name: product.name,
      units,
      cost_per_unit: unitPrice,
      total_cost: units * unitPrice,
      delivery_date: deliveryDate.toISOString().split('T')[0],
      warranty_expiry: warrantyDate.toISOString().split('T')[0],
      status: status as 'new' | 'renewed' | 'expired',
      notes: `Sample ${status} sale - ${product.name} for ${customer.name}`,
      attachments: [],
      tenant_id: MOCK_TENANT_ID,
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
      updated_at: new Date(Date.now() - i * 86400000).toISOString(),
      created_by: MOCK_USER_ID,
    };
  }),
];

// ============================================================================
// SERVICE CONTRACTS - Mock data for contract generation
// ============================================================================

export const mockServiceContracts: ServiceContract[] = [
  {
    id: 'contract_001',
    product_sale_id: 'sale_003',
    contract_number: 'SVC-2025-001',
    customer_id: 'cust_003',
    customer_name: 'Global Solutions Inc',
    product_id: 'prod_002',
    product_name: 'Cloud Storage Premium',
    start_date: '2024-08-10',
    end_date: '2025-08-10',
    status: 'active',
    contract_value: 12500,
    annual_value: 12500,
    terms: 'Annual subscription with auto-renewal',
    warranty_period: 12,
    service_level: 'standard',
    auto_renewal: true,
    renewal_notice_period: 30,
    tenant_id: MOCK_TENANT_ID,
    created_at: '2024-08-10T09:00:00Z',
    updated_at: '2025-01-15T11:20:00Z',
    created_by: MOCK_USER_ID,
  },
  {
    id: 'contract_002',
    product_sale_id: 'sale_004',
    contract_number: 'SVC-2025-002',
    customer_id: 'cust_004',
    customer_name: 'Enterprise Systems Co',
    product_id: 'prod_003',
    product_name: 'Database Server License',
    start_date: '2024-07-01',
    end_date: '2025-07-01',
    status: 'active',
    contract_value: 24000,
    annual_value: 24000,
    terms: 'Enterprise license with 24/7 support',
    warranty_period: 12,
    service_level: 'premium',
    auto_renewal: true,
    renewal_notice_period: 60,
    tenant_id: MOCK_TENANT_ID,
    created_at: '2024-07-01T08:15:00Z',
    updated_at: '2025-01-10T16:45:00Z',
    created_by: MOCK_USER_ID,
  },
];

// ============================================================================
// ANALYTICS DATA - Aggregated statistics
// ============================================================================

export const mockAnalyticsData = {
  total_sales: mockProductSales.length,
  total_revenue: mockProductSales.reduce((sum, sale) => sum + sale.total_cost, 0),
  average_sale_value: Math.round(
    mockProductSales.reduce((sum, sale) => sum + sale.total_cost, 0) / mockProductSales.length
  ),
  by_status: {
    new: mockProductSales.filter(s => s.status === 'new').length,
    renewed: mockProductSales.filter(s => s.status === 'renewed').length,
    expired: mockProductSales.filter(s => s.status === 'expired').length,
  },
  by_customer: mockCustomers.map(customer => ({
    customer_id: customer.id,
    customer_name: customer.name,
    sale_count: mockProductSales.filter(s => s.customer_id === customer.id).length,
    total_revenue: mockProductSales
      .filter(s => s.customer_id === customer.id)
      .reduce((sum, s) => sum + s.total_cost, 0),
  })),
  by_product: mockProducts.map(product => ({
    product_id: product.id,
    product_name: product.name,
    sale_count: mockProductSales.filter(s => s.product_id === product.id).length,
    total_revenue: mockProductSales
      .filter(s => s.product_id === product.id)
      .reduce((sum, s) => sum + s.total_cost, 0),
  })),
  monthly_trends: Array.from({ length: 12 }, (_, month) => {
    const year = 2024;
    const salesInMonth = mockProductSales.filter(s => {
      const saleDate = new Date(s.created_at);
      return saleDate.getMonth() === month && saleDate.getFullYear() === year;
    });
    return {
      month: new Date(year, month).toISOString().split('T')[0].substring(0, 7),
      sales_count: salesInMonth.length,
      revenue: salesInMonth.reduce((sum, s) => sum + s.total_cost, 0),
    };
  }),
};

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

/**
 * Get all product sales data
 */
export function getAllProductSales(): ProductSale[] {
  return mockProductSales;
}

/**
 * Get product sales by status
 */
export function getProductSalesByStatus(status: string): ProductSale[] {
  return mockProductSales.filter(sale => sale.status === status);
}

/**
 * Get product sales by customer
 */
export function getProductSalesByCustomer(customerId: string): ProductSale[] {
  return mockProductSales.filter(sale => sale.customer_id === customerId);
}

/**
 * Get product sales by date range
 */
export function getProductSalesByDateRange(startDate: string, endDate: string): ProductSale[] {
  return mockProductSales.filter(sale => {
    const saleDate = sale.created_at;
    return saleDate >= startDate && saleDate <= endDate;
  });
}

/**
 * Get high-value sales (above threshold)
 */
export function getHighValueSales(threshold: number = 20000): ProductSale[] {
  return mockProductSales.filter(sale => sale.total_cost >= threshold);
}

/**
 * Calculate total revenue
 */
export function calculateTotalRevenue(): number {
  return mockProductSales.reduce((sum, sale) => sum + sale.total_cost, 0);
}

/**
 * Get customer analytics
 */
export function getCustomerAnalytics() {
  return mockAnalyticsData.by_customer;
}

/**
 * Get product analytics
 */
export function getProductAnalytics() {
  return mockAnalyticsData.by_product;
}

/**
 * Get complete analytics summary
 */
export function getAnalyticsSummary() {
  return mockAnalyticsData;
}