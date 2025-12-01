/**
 * Tickets Module Permission Constants
 * Use these instead of string literals throughout the module
 */

export const TICKETS_PERMISSIONS = {
  // Read permissions
  READ: 'crm:support:ticket:read',
  LIST: 'tickets:list',
  VIEW: 'tickets:view',
  
  // Create permissions
  CREATE: 'crm:support:ticket:create',
  IMPORT: 'tickets:import',
  
  // Update permissions
  UPDATE: 'crm:support:ticket:update',
  EDIT: 'tickets:edit',
  
  // Delete permissions
  DELETE: 'crm:support:ticket:delete',
  BULK_DELETE: 'tickets:bulk_delete',
  
  // Export permissions
  EXPORT: 'tickets:export',
  
  // Special permissions
  ASSIGN: 'tickets:assign',
  REASSIGN: 'tickets:reassign',
  CLOSE: 'tickets:close',
  REOPEN: 'tickets:reopen',
  VIEW_ANALYTICS: 'tickets:crm:analytics:insight:view',
  MANAGE_PRIORITIES: 'tickets:manage_priorities',
} as const;

export type TicketsPermission = typeof TICKETS_PERMISSIONS[keyof typeof TICKETS_PERMISSIONS];
