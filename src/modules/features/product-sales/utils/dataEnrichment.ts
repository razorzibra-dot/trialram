/**
 * Data Enrichment Utilities for Product Sales
 * 
 * After database normalization, ProductSale only contains customer_id and product_id.
 * These utilities enrich ProductSale objects with customer and product details for display.
 * 
 * This follows the 8-layer architecture:
 * - Layer 1 (DB): Normalized to only store IDs
 * - Layer 8 (UI): Enriches data with names/details for display
 */

import { ProductSale, ProductSaleWithDetails } from '@/types/productSales';
import { Customer } from '@/types/crm';
import { Product } from '@/types/masters';

/**
 * Enriched product sale with denormalized details for display
 * Created dynamically - never stored in database
 */
export interface EnrichedProductSale extends ProductSale {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  product_name?: string;
  product_sku?: string;
  product_price?: number;
}

/**
 * Enrich a single ProductSale with customer and product details
 * @param sale - Base ProductSale (only has IDs)
 * @param customers - Array of Customer objects for lookup
 * @param products - Array of Product objects for lookup
 * @returns Enriched ProductSale with display names
 */
export function enrichProductSale(
  sale: ProductSale,
  customers: Customer[],
  products: Product[]
): EnrichedProductSale {
  const customer = customers?.find(c => c.id === sale.customer_id);
  const product = products?.find(p => p.id === sale.product_id);

  return {
    ...sale,
    customer_name: customer?.name,
    customer_email: customer?.email,
    customer_phone: customer?.phone,
    product_name: product?.name,
    product_sku: product?.sku,
    product_price: product?.price,
  };
}

/**
 * Enrich multiple ProductSales with customer and product details
 * @param sales - Array of base ProductSales
 * @param customers - Array of Customer objects for lookup
 * @param products - Array of Product objects for lookup
 * @returns Array of enriched ProductSales
 */
export function enrichProductSales(
  sales: ProductSale[],
  customers: Customer[],
  products: Product[]
): EnrichedProductSale[] {
  if (!sales || !Array.isArray(sales)) return [];
  const safeCustomers = customers || [];
  const safeProducts = products || [];
  return sales.map(sale => enrichProductSale(sale, safeCustomers, safeProducts));
}

/**
 * Get customer name from ID (single lookup)
 * @param customerId - Customer ID
 * @param customers - Array of Customer objects
 * @returns Customer name or empty string if not found
 */
export function getCustomerName(customerId: string, customers: Customer[]): string {
  return customers?.find(c => c.id === customerId)?.name ?? '';
}

/**
 * Get product name from ID (single lookup)
 * @param productId - Product ID
 * @param products - Array of Product objects
 * @returns Product name or empty string if not found
 */
export function getProductName(productId: string, products: Product[]): string {
  return products?.find(p => p.id === productId)?.name ?? '';
}

/**
 * Get customer details from ID
 * @param customerId - Customer ID
 * @param customers - Array of Customer objects
 * @returns Customer object or undefined
 */
export function getCustomer(customerId: string, customers: Customer[]): Customer | undefined {
  return customers?.find(c => c.id === customerId);
}

/**
 * Get product details from ID
 * @param productId - Product ID
 * @param products - Array of Product objects
 * @returns Product object or undefined
 */
export function getProduct(productId: string, products: Product[]): Product | undefined {
  return products?.find(p => p.id === productId);
}

/**
 * Create a map of customer IDs to names for quick lookup
 * @param customers - Array of Customer objects
 * @returns Map of ID to name
 */
export function createCustomerNameMap(customers: Customer[]): Record<string, string> {
  if (!customers || !Array.isArray(customers)) return {};
  return customers.reduce((map, customer) => {
    map[customer.id] = customer.name;
    return map;
  }, {} as Record<string, string>);
}

/**
 * Create a map of product IDs to names for quick lookup
 * @param products - Array of Product objects
 * @returns Map of ID to name
 */
export function createProductNameMap(products: Product[]): Record<string, string> {
  if (!products || !Array.isArray(products)) return {};
  return products.reduce((map, product) => {
    map[product.id] = product.name;
    return map;
  }, {} as Record<string, string>);
}

/**
 * Format a ProductSale for display (human-readable)
 * @param sale - Enriched ProductSale
 * @returns Formatted string like "Acme Corporation - Enterprise CRM Suite"
 */
export function formatProductSaleForDisplay(sale: EnrichedProductSale): string {
  const customerName = sale.customer_name || 'Unknown Customer';
  const productName = sale.product_name || 'Unknown Product';
  return `${customerName} - ${productName}`;
}

/**
 * Convert enriched ProductSale to invoice-friendly format
 * Ensures all required fields for invoice generation are present
 */
export interface InvoiceData extends EnrichedProductSale {
  customer_name: string; // Guaranteed non-null for invoices
  product_name: string;  // Guaranteed non-null for invoices
}

/**
 * Prepare a ProductSale for invoice generation (ensures all fields present)
 * @param sale - Enriched ProductSale
 * @returns InvoiceData with guaranteed non-null display fields
 * @throws Error if customer or product not found
 */
export function prepareForInvoice(sale: EnrichedProductSale): InvoiceData {
  if (!sale.customer_name) {
    throw new Error(`Customer not found for sale ${sale.id}`);
  }
  if (!sale.product_name) {
    throw new Error(`Product not found for sale ${sale.id}`);
  }
  
  return {
    ...sale,
    customer_name: sale.customer_name,
    product_name: sale.product_name,
  };
}
