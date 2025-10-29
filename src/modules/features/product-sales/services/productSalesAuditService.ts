/**
 * Product Sales Audit Service
 * Handles audit logging for all product sales operations
 * - CRUD operations (create, update, delete)
 * - Status changes
 * - User actions
 * - IP address and user agent tracking
 */

import { ProductSale } from '@/types/productSales';
import { auditService } from '@/services/auditService';

interface AuditLogParams {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'EXPORT' | 'BULK_DELETE' | 'APPROVE' | 'REJECT';
  resource: string;
  resourceId: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}

interface AuditTrailEntry {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  userId: string;
  userName: string;
  userEmail: string;
  changes?: {
    before: unknown;
    after: unknown;
  };
  metadata?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  tenantId: string;
}

class ProductSalesAuditService {
  /**
   * Log product sale creation
   */
  async logCreateProductSale(
    sale: ProductSale,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await auditService.logAction(
        'CREATE',
        'product_sale',
        sale.id,
        {
          before: {},
          after: {
            customer_id: sale.customer_id,
            customer_name: sale.customer_name,
            product_id: sale.product_id,
            product_name: sale.product_name,
            units: sale.units,
            cost_per_unit: sale.cost_per_unit,
            total_cost: sale.total_cost,
            delivery_date: sale.delivery_date,
            warranty_expiry: sale.warranty_expiry,
            status: sale.status,
            notes: sale.notes
          }
        },
        {
          source: 'product_sales_module',
          ...metadata
        }
      );
    } catch (error) {
      console.error('Failed to log product sale creation:', error);
      // Don't throw - audit failures should not block operations
    }
  }

  /**
   * Log product sale update
   */
  async logUpdateProductSale(
    oldSale: ProductSale,
    newSale: ProductSale,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      // Extract changed fields only
      const changes: Record<string, unknown> = {};
      const fields = [
        'customer_id',
        'customer_name',
        'product_id',
        'product_name',
        'units',
        'cost_per_unit',
        'delivery_date',
        'warranty_expiry',
        'notes'
      ];

      fields.forEach(field => {
        const oldValue = (oldSale as any)[field];
        const newValue = (newSale as any)[field];
        if (oldValue !== newValue) {
          changes[field] = {
            from: oldValue,
            to: newValue
          };
        }
      });

      if (Object.keys(changes).length === 0) {
        return; // No changes, don't log
      }

      await auditService.logAction(
        'UPDATE',
        'product_sale',
        newSale.id,
        {
          before: Object.fromEntries(
            Object.keys(changes).map(key => [key, (oldSale as any)[key]])
          ),
          after: Object.fromEntries(
            Object.keys(changes).map(key => [key, (newSale as any)[key]])
          )
        },
        {
          source: 'product_sales_module',
          changedFields: Object.keys(changes),
          ...metadata
        }
      );
    } catch (error) {
      console.error('Failed to log product sale update:', error);
    }
  }

  /**
   * Log product sale deletion
   */
  async logDeleteProductSale(
    sale: ProductSale,
    reason?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await auditService.logAction(
        'DELETE',
        'product_sale',
        sale.id,
        {
          before: {
            customer_id: sale.customer_id,
            customer_name: sale.customer_name,
            product_id: sale.product_id,
            product_name: sale.product_name,
            units: sale.units,
            total_cost: sale.total_cost,
            status: sale.status
          },
          after: {}
        },
        {
          source: 'product_sales_module',
          reason: reason || 'User initiated deletion',
          ...metadata
        }
      );
    } catch (error) {
      console.error('Failed to log product sale deletion:', error);
    }
  }

  /**
   * Log product sale status change
   */
  async logStatusChange(
    sale: ProductSale,
    oldStatus: string,
    newStatus: string,
    reason?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await auditService.logAction(
        'STATUS_CHANGE',
        'product_sale',
        sale.id,
        {
          before: { status: oldStatus },
          after: { status: newStatus }
        },
        {
          source: 'product_sales_module',
          oldStatus,
          newStatus,
          reason: reason || 'No reason provided',
          ...metadata
        }
      );
    } catch (error) {
      console.error('Failed to log status change:', error);
    }
  }

  /**
   * Log bulk deletion operation
   */
  async logBulkDelete(
    saleIds: string[],
    reason?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await auditService.logAction(
        'BULK_DELETE',
        'product_sale',
        'bulk',
        {
          before: { count: saleIds.length, ids: saleIds },
          after: {}
        },
        {
          source: 'product_sales_module',
          recordCount: saleIds.length,
          reason: reason || 'Bulk deletion initiated',
          ...metadata
        }
      );
    } catch (error) {
      console.error('Failed to log bulk deletion:', error);
    }
  }

  /**
   * Log bulk status change operation
   */
  async logBulkStatusChange(
    saleIds: string[],
    oldStatus: string,
    newStatus: string,
    reason?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await auditService.logAction(
        'STATUS_CHANGE',
        'product_sale_bulk',
        'bulk',
        {
          before: { status: oldStatus, count: saleIds.length },
          after: { status: newStatus, count: saleIds.length }
        },
        {
          source: 'product_sales_module',
          isBulkOperation: true,
          recordCount: saleIds.length,
          oldStatus,
          newStatus,
          reason: reason || 'Bulk status change initiated',
          ...metadata
        }
      );
    } catch (error) {
      console.error('Failed to log bulk status change:', error);
    }
  }

  /**
   * Log data export operation
   */
  async logExport(
    format: 'csv' | 'json' | 'excel',
    recordCount: number,
    filters?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await auditService.logAction(
        'EXPORT',
        'product_sale',
        'export',
        {
          before: {},
          after: { format, recordCount }
        },
        {
          source: 'product_sales_module',
          format,
          recordCount,
          filters: filters || {},
          ...metadata
        }
      );
    } catch (error) {
      console.error('Failed to log export:', error);
    }
  }

  /**
   * Log approval action
   */
  async logApproval(
    sale: ProductSale,
    approvalType: 'approved' | 'rejected',
    reason?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await auditService.logAction(
        approvalType === 'approved' ? 'APPROVE' : 'REJECT',
        'product_sale',
        sale.id,
        {
          before: { status: sale.status },
          after: { approvalType }
        },
        {
          source: 'product_sales_module',
          approvalType,
          reason: reason || 'No reason provided',
          saleName: `${sale.customer_name} - ${sale.product_name}`,
          ...metadata
        }
      );
    } catch (error) {
      console.error('Failed to log approval action:', error);
    }
  }

  /**
   * Get audit trail for a specific product sale
   * This delegates to the main audit service
   */
  async getAuditTrail(
    saleId: string,
    limit: number = 50
  ): Promise<AuditTrailEntry[]> {
    try {
      // Get all audit logs for this product sale
      const logs = await auditService.getAuditLogs({
        resource: 'product_sale',
        search: saleId,
        limit,
        page: 1
      });

      // Filter to only logs for this specific sale
      return logs
        .filter(log => log.resourceId === saleId)
        .map(log => ({
          id: log.id,
          action: log.action,
          resource: log.resource,
          resourceId: log.resourceId,
          userId: log.user.id,
          userName: log.user.name,
          userEmail: log.user.email,
          changes: log.changes,
          metadata: log.metadata,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          createdAt: log.createdAt,
          tenantId: log.tenantId
        }));
    } catch (error) {
      console.error('Failed to retrieve audit trail:', error);
      return [];
    }
  }

  /**
   * Get audit statistics for product sales
   */
  async getAuditStats(): Promise<{
    totalActions: number;
    actionBreakdown: Record<string, number>;
    recentActions: number;
  }> {
    try {
      const stats = await auditService.getAuditStats();
      
      return {
        totalActions: stats.totalLogs,
        actionBreakdown: stats.actionBreakdown.reduce((acc, item) => {
          acc[item.action] = item.count;
          return acc;
        }, {} as Record<string, number>),
        recentActions: stats.recentActivity
      };
    } catch (error) {
      console.error('Failed to retrieve audit statistics:', error);
      return {
        totalActions: 0,
        actionBreakdown: {},
        recentActions: 0
      };
    }
  }

  /**
   * Export audit trail for a product sale
   */
  async exportAuditTrail(
    saleId: string,
    format: 'csv' | 'json' = 'csv'
  ): Promise<string> {
    try {
      const trail = await this.getAuditTrail(saleId, 1000);

      if (format === 'json') {
        return JSON.stringify(trail, null, 2);
      }

      // CSV format
      const headers = [
        'Action',
        'Date',
        'User',
        'User Email',
        'Changes',
        'Reason',
        'IP Address'
      ];

      const rows = trail.map(entry => [
        entry.action,
        entry.createdAt,
        entry.userName,
        entry.userEmail,
        entry.changes ? JSON.stringify(entry.changes) : '-',
        (entry.metadata?.reason as string) || '-',
        entry.ipAddress
      ]);

      return [headers, ...rows]
        .map(row => 
          row
            .map(cell => `"${cell?.toString().replace(/"/g, '""') || ''}"`)
            .join(',')
        )
        .join('\r\n');
    } catch (error) {
      console.error('Failed to export audit trail:', error);
      return '';
    }
  }
}

export const productSalesAuditService = new ProductSalesAuditService();