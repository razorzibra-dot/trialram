/**
 * Tickets Module Permission Constants
 * Use these instead of string literals throughout the module
 */

export const TICKETS_PERMISSIONS = {
  // Read permissions
  READ: 'tickets:read',
  LIST: 'tickets:list',
  VIEW: 'tickets:view',
  
  // Create permissions
  CREATE: 'tickets:create',
  IMPORT: 'tickets:import',
  
  // Update permissions
  UPDATE: 'tickets:update',
  EDIT: 'tickets:edit',
  
  // Delete permissions
  DELETE: 'tickets:delete',
  BULK_DELETE: 'tickets:bulk_delete',
  
  // Export permissions
  EXPORT: 'tickets:export',
  
  // Special permissions
  ASSIGN: 'tickets:assign',
  REASSIGN: 'tickets:reassign',
  CLOSE: 'tickets:close',
  REOPEN: 'tickets:reopen',
  VIEW_ANALYTICS: 'tickets:view_analytics',
  MANAGE_PRIORITIES: 'tickets:manage_priorities',
} as const;

export type TicketsPermission = typeof TICKETS_PERMISSIONS[keyof typeof TICKETS_PERMISSIONS];
