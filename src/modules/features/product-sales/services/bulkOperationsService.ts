/**
 * Bulk Operations Service for Product Sales
 * Handles bulk status updates, deletes, and exports
 */
import { ProductSale } from '@/types/productSales';
import { auditService } from '@/services';

interface BulkStatusUpdateRequest {
  saleIds: string[];
  newStatus: string;
  reason?: string;
}

interface BulkDeleteRequest {
  saleIds: string[];
  reason?: string;
}

interface BulkExportRequest {
  saleIds: string[];
  format: 'csv' | 'xlsx';
  includeColumns: string[];
}

interface BulkOperationResult {
  success: number;
  failed: number;
  total: number;
  errors: Array<{ id: string; error: string }>;
  message: string;
}

/**
 * Validate status transition for bulk operations
 */
const isValidStatusTransition = (currentStatus: string, newStatus: string): boolean => {
  const validTransitions: Record<string, string[]> = {
    'draft': ['pending', 'cancelled'],
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['shipped', 'cancelled'],
    'shipped': ['delivered', 'cancelled'],
    'delivered': ['invoiced', 'refunded'],
    'invoiced': ['paid', 'refunded'],
    'paid': [],
    'cancelled': ['draft'],
    'refunded': []
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

/**
 * Service for bulk operations on product sales
 */
export const bulkOperationsService = {
  /**
   * Bulk update status for multiple product sales
   */
  async bulkUpdateStatus(request: BulkStatusUpdateRequest): Promise<BulkOperationResult> {
    try {
      const results = {
        success: 0,
        failed: 0,
        errors: [] as Array<{ id: string; error: string }>,
      };

      // Simulate processing (in real app, this would be a batch API call)
      for (const saleId of request.saleIds) {
        try {
          // In real implementation, would call productSaleService.updateProductSale
          // For now, just validate the transition
          const isValid = isValidStatusTransition('pending', request.newStatus);
          
          if (!isValid) {
            results.failed++;
            results.errors.push({
              id: saleId,
              error: `Cannot transition to ${request.newStatus}`
            });
          } else {
            results.success++;
            
            // Log audit trail
            await auditService.logAction({
              action: 'bulk_status_update',
              resourceType: 'product_sale',
              resourceId: saleId,
              details: {
                newStatus: request.newStatus,
                reason: request.reason,
                bulkOperation: true
              }
            });
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            id: saleId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const message = `Bulk status update: ${results.success} succeeded, ${results.failed} failed`;
      
      return {
        ...results,
        total: request.saleIds.length,
        message
      };
    } catch (error) {
      throw new Error(
        `Bulk status update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Bulk delete product sales
   */
  async bulkDelete(request: BulkDeleteRequest): Promise<BulkOperationResult> {
    try {
      const results = {
        success: 0,
        failed: 0,
        errors: [] as Array<{ id: string; error: string }>,
      };

      // Simulate processing (in real app, would be batch API call)
      for (const saleId of request.saleIds) {
        try {
          // In real implementation, would call productSaleService.deleteProductSale
          results.success++;
          
          // Log audit trail
          await auditService.logAction({
            action: 'bulk_delete',
            resourceType: 'product_sale',
            resourceId: saleId,
            details: {
              reason: request.reason,
              bulkOperation: true
            }
          });
        } catch (error) {
          results.failed++;
          results.errors.push({
            id: saleId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const message = `Bulk delete: ${results.success} succeeded, ${results.failed} failed`;
      
      return {
        ...results,
        total: request.saleIds.length,
        message
      };
    } catch (error) {
      throw new Error(
        `Bulk delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Export selected product sales to CSV or XLSX
   */
  async bulkExport(sales: ProductSale[], format: 'csv' | 'xlsx', selectedColumns: string[]): Promise<string> {
    try {
      if (format === 'csv') {
        return this.exportToCSV(sales, selectedColumns);
      } else if (format === 'xlsx') {
        return this.exportToXLSX(sales, selectedColumns);
      } else {
        throw new Error('Unsupported export format');
      }
    } catch (error) {
      throw new Error(
        `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Export to CSV format
   */
  exportToCSV(sales: ProductSale[], selectedColumns: string[]): string {
    try {
      const columnMap: Record<string, string> = {
        'sale_number': 'Sale #',
        'customer_name': 'Customer',
        'product_name': 'Product',
        'quantity': 'Quantity',
        'unit_price': 'Unit Price',
        'total_value': 'Total Value',
        'status': 'Status',
        'sale_date': 'Sale Date',
        'delivery_address': 'Delivery Address',
        'warranty_period': 'Warranty (months)'
      };

      const columns = selectedColumns.length > 0 ? selectedColumns : Object.keys(columnMap);
      
      // Create header
      const header = columns.map(col => columnMap[col] || col).join(',');
      
      // Create rows
      const rows = sales.map(sale => {
        return columns.map(col => {
          const value = (sale as Record<string, unknown>)[col];
          
          // Handle special formatting
          if (col === 'total_value' || col === 'unit_price') {
            return typeof value === 'number' ? `$${value.toFixed(2)}` : '';
          }
          
          if (col === 'sale_date') {
            return value ? new Date(value as string).toLocaleDateString() : '';
          }
          
          // Escape quotes in string values
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          
          return value || '';
        }).join(',');
      });

      const csv = [header, ...rows].join('\n');
      
      // Log audit
      auditService.logAction({
        action: 'bulk_export',
        resourceType: 'product_sale',
        details: {
          format: 'csv',
          recordCount: sales.length,
          columns: selectedColumns
        }
      });

      return csv;
    } catch (error) {
      throw new Error(
        `CSV export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Export to XLSX format (returns CSV for now, real implementation would use xlsx library)
   */
  exportToXLSX(sales: ProductSale[], selectedColumns: string[]): string {
    try {
      // For now, we'll create a basic implementation
      // In production, you'd use a library like 'xlsx' or 'exceljs'
      const columnMap: Record<string, string> = {
        'sale_number': 'Sale #',
        'customer_name': 'Customer',
        'product_name': 'Product',
        'quantity': 'Quantity',
        'unit_price': 'Unit Price',
        'total_value': 'Total Value',
        'status': 'Status',
        'sale_date': 'Sale Date',
        'delivery_address': 'Delivery Address',
        'warranty_period': 'Warranty (months)'
      };

      const columns = selectedColumns.length > 0 ? selectedColumns : Object.keys(columnMap);
      
      // Create tab-separated data (can be opened in Excel)
      const header = columns.map(col => columnMap[col] || col).join('\t');
      
      const rows = sales.map(sale => {
        return columns.map(col => {
          const value = (sale as Record<string, unknown>)[col];
          
          if (col === 'total_value' || col === 'unit_price') {
            return typeof value === 'number' ? value.toFixed(2) : '';
          }
          
          if (col === 'sale_date') {
            return value ? new Date(value as string).toLocaleDateString() : '';
          }
          
          return value || '';
        }).join('\t');
      });

      const xlsx = [header, ...rows].join('\n');
      
      // Log audit
      auditService.logAction({
        action: 'bulk_export',
        resourceType: 'product_sale',
        details: {
          format: 'xlsx',
          recordCount: sales.length,
          columns: selectedColumns
        }
      });

      return xlsx;
    } catch (error) {
      throw new Error(
        `XLSX export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Trigger file download
   */
  downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      throw new Error('Failed to download file');
    }
  }
};

export type { BulkStatusUpdateRequest, BulkDeleteRequest, BulkExportRequest, BulkOperationResult };