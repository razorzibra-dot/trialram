/**
 * Canonical permission tokens used across the CRM application.
 * Each token follows the <app>:<domain>:<resource>[:<scope>]:<action> format
 * described in repo.md. Centralising the strings keeps every layer aligned.
 */
export const PermissionTokens = {
  auth: {
    session: {
      login: 'crm:auth:session:login',
      logout: 'crm:auth:session:logout',
    },
    profile: {
      read: 'crm:auth:profile:read',
      update: 'crm:auth:profile:update',
    },
  },
  customer: {
    record: {
      read: 'crm:customer:record:read',
      create: 'crm:customer:record:create',
      update: 'crm:customer:record:update',
      delete: 'crm:customer:record:delete',
      bulkUpdate: 'crm:customer:record:bulk:update',
      export: 'crm:customer:record:export',
    },
    contact: {
      add: 'crm:customer:contact:add',
      remove: 'crm:customer:contact:remove',
    },
    document: {
      upload: 'crm:customer:document:upload',
      download: 'crm:customer:document:download',
    },
  },
  company: {
    record: {
      read: 'crm:company:record:read',
      create: 'crm:company:record:create',
      update: 'crm:company:record:update',
      delete: 'crm:company:record:delete',
    },
  },
  sales: {
    deal: {
      read: 'crm:sales:deal:read',
      create: 'crm:sales:deal:create',
      update: 'crm:sales:deal:update',
      delete: 'crm:sales:deal:delete',
      close: 'crm:sales:deal:close',
    },
    pipeline: {
      view: 'crm:sales:pipeline:view',
      manage: 'crm:sales:pipeline:manage',
    },
    forecast: {
      view: 'crm:sales:forecast:view',
      create: 'crm:sales:forecast:create',
    },
    activity: {
      log: 'crm:sales:activity:log',
    },
  },
  lead: {
    record: {
      read: 'crm:lead:record:read',
      create: 'crm:lead:record:create',
      update: 'crm:lead:record:update',
      delete: 'crm:lead:record:delete',
    },
  },
  product: {
    record: {
      read: 'crm:product:record:read',
      create: 'crm:product:record:create',
      update: 'crm:product:record:update',
      delete: 'crm:product:record:delete',
    },
    inventory: {
      manage: 'crm:product:inventory:manage',
    },
    pricing: {
      manage: 'crm:product:pricing:manage',
    },
  },
  productSale: {
    record: {
      read: 'crm:product-sale:record:read',
      create: 'crm:product-sale:record:create',
      update: 'crm:product-sale:record:update',
      delete: 'crm:product-sale:record:delete',
    },
  },
  contract: {
    record: {
      read: 'crm:contract:record:read',
      create: 'crm:contract:record:create',
      update: 'crm:contract:record:update',
      delete: 'crm:contract:record:delete',
      approve: 'crm:contract:record:approve',
    },
    service: {
      read: 'crm:contract:service:read',
      create: 'crm:contract:service:create',
      update: 'crm:contract:service:update',
      delete: 'crm:contract:service:delete',
      approve: 'crm:contract:service:approve',
      renew: 'crm:contract:service:renew',
    },
  },
  project: {
    record: {
      read: 'crm:project:record:read',
      create: 'crm:project:record:create',
      update: 'crm:project:record:update',
      delete: 'crm:project:record:delete',
    },
    task: {
      assign: 'crm:project:task:assign',
    },
    resource: {
      allocate: 'crm:project:resource:allocate',
    },
    milestone: {
      manage: 'crm:project:milestone:manage',
    },
  },
  support: {
    ticket: {
      read: 'crm:support:ticket:read',
      create: 'crm:support:ticket:create',
      update: 'crm:support:ticket:update',
      assign: 'crm:support:ticket:assign',
      resolve: 'crm:support:ticket:resolve',
      close: 'crm:support:ticket:close',
      delete: 'crm:support:ticket:delete',
    },
    complaint: {
      read: 'crm:support:complaint:read',
      create: 'crm:support:complaint:create',
      update: 'crm:support:complaint:update',
      investigate: 'crm:support:complaint:investigate',
      resolve: 'crm:support:complaint:resolve',
      delete: 'crm:support:complaint:delete',
    },
  },
  report: {
    record: {
      view: 'crm:report:record:view',
      create: 'crm:report:record:create',
      export: 'crm:report:record:export',
    },
  },
  analytics: {
    insight: {
      view: 'crm:analytics:insight:view',
      create: 'crm:analytics:insight:create',
    },
  },
  dashboard: {
    panel: {
      view: 'crm:dashboard:panel:view',
      create: 'crm:dashboard:panel:create',
    },
  },
  audit: {
    log: {
      read: 'crm:audit:log:read',
      export: 'crm:audit:log:export',
    },
    report: {
      generate: 'crm:audit:report:generate',
    },
  },
  notification: {
    channel: {
      read: 'crm:notification:channel:read',
      manage: 'crm:notification:channel:manage',
    },
    template: {
      create: 'crm:notification:template:create',
    },
    campaign: {
      create: 'crm:notification:campaign:create',
    },
  },
  reference: {
    data: {
      read: 'crm:reference:data:read',
      manage: 'crm:reference:data:manage',
      import: 'crm:reference:data:import',
      export: 'crm:reference:data:export',
    },
  },
  permission: {
    record: {
      read: 'crm:permission:record:read',
      create: 'crm:permission:record:create',
      update: 'crm:permission:record:update',
      delete: 'crm:permission:record:delete',
    },
  },
  user: {
    record: {
      read: 'crm:user:record:read',
      create: 'crm:user:record:create',
      update: 'crm:user:record:update',
      delete: 'crm:user:record:delete',
    },
    role: {
      assign: 'crm:user:role:assign',
      revoke: 'crm:user:role:revoke',
    },
  },
  role: {
    record: {
      read: 'crm:role:record:read',
      create: 'crm:role:record:create',
      update: 'crm:role:record:update',
      delete: 'crm:role:record:delete',
    },
    permission: {
      assign: 'crm:role:permission:assign',
    },
  },
  system: {
    platform: {
      admin: 'crm:system:platform:admin',
    },
    config: {
      read: 'crm:system:config:read',
      manage: 'crm:system:config:manage',
    },
    backup: {
      create: 'crm:system:backup:create',
      restore: 'crm:system:backup:restore',
    },
  },
  platform: {
    control: {
      admin: 'crm:platform:control:admin',
    },
    tenant: {
      create: 'crm:platform:tenant:create',
      update: 'crm:platform:tenant:update',
      delete: 'crm:platform:tenant:delete',
      suspend: 'crm:platform:tenant:suspend',
      manage: 'crm:platform:tenant:manage',
    },
    user: {
      manage: 'crm:platform:user:manage',
    },
    audit: {
      view: 'crm:platform:audit:view',
    },
    analytics: {
      view: 'crm:platform:crm:analytics:insight:view',
    },
    config: {
      manage: 'crm:platform:config:manage',
    },
  },
  data: {
    export: 'crm:data:export',
    import: 'crm:data:import',
  },
} as const;

export type PermissionTokensTree = typeof PermissionTokens;

