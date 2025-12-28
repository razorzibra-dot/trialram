import { PermissionTokens } from './permissionTokens';

/**
 * Maps module route keys to the minimum permission required to view the module.
 * Shared between useModuleAccess and ModuleRegistry to keep behaviour consistent.
 */
export const MODULE_PERMISSION_MAP: Record<string, string> = {
  dashboard: PermissionTokens.dashboard.panel.view,
  customers: PermissionTokens.customer.record.read,
  deals: PermissionTokens.sales.deal.read,
  leads: PermissionTokens.lead.record.read,
  contracts: PermissionTokens.contract.record.read,
  'service-contracts': PermissionTokens.contract.service.read,
  products: PermissionTokens.product.record.read,
  'product-sales': PermissionTokens.productSale.record.read,
  tickets: PermissionTokens.support.ticket.read,
  complaints: PermissionTokens.support.complaint.read,
  'job-works': PermissionTokens.project.record.read,
  notifications: PermissionTokens.notification.channel.read,
  reports: PermissionTokens.report.record.view,
  settings: PermissionTokens.system.config.read,
  masters: PermissionTokens.reference.data.read,
  'user-management': PermissionTokens.user.record.read,
};

