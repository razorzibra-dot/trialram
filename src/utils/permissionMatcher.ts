import { CUSTOMER_PERMISSIONS } from '@/modules/features/customers/constants/permissions';

type ParsedToken = {
  original: string;
  app?: string;
  domain?: string;
  resource?: string;
  scope?: string;
  action?: string;
  short?: string;
};

const SCOPE_RANK: Record<string, number> = {
  own: 0,
  team: 1,
  org: 2,
  tenant: 3,
  global: 4,
};

const ACTION_IMPLICATIONS: Record<string, string[]> = {
  manage: ['read', 'view', 'create', 'update', 'delete', 'assign', 'approve', 'export', 'import', 'share', 'move'],
  admin: ['read', 'view', 'create', 'update', 'delete', 'assign', 'approve', 'export', 'import', 'share', 'move'],
  control: ['read', 'view', 'create', 'update', 'delete', 'assign', 'approve', 'export', 'import', 'share', 'move'],
  write: ['create', 'update'],
  view: ['read'],
};

const ACTION_SYNONYMS: Record<string, string[]> = {
  read: ['view'],
  view: ['read'],
  create: ['write'],
  update: ['write', 'edit'],
  edit: ['update'],
  remove: ['delete'],
  delete: ['remove'],
  access: ['read', 'view'],
};

const LEGACY_TOKEN_MAP: Record<string, string> = {
  'dashboard:view': 'crm:dashboard:panel:view',
  'crm:dashboard:view': 'crm:dashboard:panel:view',
  'crm:dashboard:create': 'crm:dashboard:panel:create',
  'crm:report:view': 'crm:report:record:view',
  'crm:report:create': 'crm:report:record:create',
  'crm:report:export': 'crm:report:record:export',
  'crm:analytics:view': 'crm:analytics:insight:view',
  'crm:analytics:create': 'crm:analytics:insight:create',
  'crm:notification:manage': 'crm:notification:channel:manage',
  'crm:notification:read': 'crm:notification:channel:read',
  'crm:system:admin': 'crm:system:platform:admin',
  'crm:platform:admin': 'crm:platform:control:admin',
  'crm:product:sales:read': 'crm:product-sale:record:read',
  'crm:product:sales:create': 'crm:product-sale:record:create',
  'crm:product:sales:update': 'crm:product-sale:record:update',
  'crm:product:sales:delete': 'crm:product-sale:record:delete',
  'crm:contact:record:read': CUSTOMER_PERMISSIONS.READ,
  'crm:contact:record:create': CUSTOMER_PERMISSIONS.CREATE,
  'crm:contact:record:update': CUSTOMER_PERMISSIONS.UPDATE,
  'crm:contact:record:delete': CUSTOMER_PERMISSIONS.DELETE,
  'crm:deal:pipeline:move': 'crm:sales:pipeline:move',
};

export function normalizePermissionToken(token: string): string {
  const trimmed = (token || '').trim();
  if (!trimmed) return '';
  const normalized = trimmed.replace(/-/g, '_');
  return LEGACY_TOKEN_MAP[normalized] || normalized;
}

const buildSingleToken = (normalized: string, parts: string[]): ParsedToken => ({
  original: normalized,
  short: parts[0],
});

const buildDoubleToken = (normalized: string, parts: string[]): ParsedToken => ({
  original: normalized,
  domain: parts[0],
  action: parts[1],
});

const buildTripleToken = (normalized: string, parts: string[]): ParsedToken => ({
  original: normalized,
  app: parts[0],
  domain: parts[1],
  action: parts[2],
});

const buildExtendedToken = (normalized: string, parts: string[]): ParsedToken => {
  const [app, domain, resource, ...rest] = parts;
  const action = rest.at(-1);
  const scope = rest.length > 1 ? rest.slice(0, rest.length - 1).join(':') : undefined;
  return { original: normalized, app, domain, resource, scope, action };
};

const PARSER_BY_LENGTH: Record<number, (normalized: string, parts: string[]) => ParsedToken> = {
  1: buildSingleToken,
  2: buildDoubleToken,
  3: buildTripleToken,
};

export function parsePermissionToken(token: string): ParsedToken | null {
  const normalized = normalizePermissionToken(token);
  if (!normalized) return null;

  const parts = normalized.split(':').filter(Boolean);
  if (parts.length === 0) return null;

  const handler = PARSER_BY_LENGTH[parts.length];
  if (handler) return handler(normalized, parts);

  return buildExtendedToken(normalized, parts);
}

function scopeMatches(userScope?: string, requestedScope?: string): boolean {
  if (!requestedScope || !userScope) return true;
  if (userScope === requestedScope) return true;

  const userRank = SCOPE_RANK[userScope];
  const requestedRank = SCOPE_RANK[requestedScope];
  if (userRank === undefined || requestedRank === undefined) return false;

  return userRank >= requestedRank;
}

function actionMatches(userAction?: string, requestedAction?: string): boolean {
  if (!requestedAction) return true;
  if (!userAction) return false;
  if (userAction === requestedAction) return true;

  const synonyms = ACTION_SYNONYMS[userAction];
  if (synonyms?.includes(requestedAction)) return true;

  const reverseSynonyms = ACTION_SYNONYMS[requestedAction];
  if (reverseSynonyms?.includes(userAction)) return true;

  const implied = ACTION_IMPLICATIONS[userAction];
  if (implied?.includes(requestedAction)) return true;

  return false;
}

function matchShortForm(userToken: string, short?: string): boolean {
  if (!short) return false;

  switch (short) {
    case 'read':
      return /:(read|view)$/.test(userToken) || userToken.endsWith(':manage');
    case 'write':
      return /:(create|update)$/.test(userToken) || userToken.endsWith(':write') || userToken.endsWith(':manage');
    case 'delete':
      return userToken.endsWith(':delete') || userToken.endsWith(':manage');
    default:
      return userToken.endsWith(`:${short}`);
  }
}

const fieldsMatch = (userField?: string, requestedField?: string) =>
  !requestedField || !userField || requestedField === userField;

const hasFieldMismatch = (userField?: string, requestedField?: string) =>
  requestedField !== undefined &&
  userField !== undefined &&
  requestedField !== userField;

const matchShortTokens = (userParsed: ParsedToken, requestedParsed: ParsedToken) =>
  (requestedParsed.short && matchShortForm(userParsed.original, requestedParsed.short)) ||
  (userParsed.short && matchShortForm(requestedParsed.original, userParsed.short));

export function doesPermissionGrant(userToken: string, requestedToken: string): boolean {
  const userParsed = parsePermissionToken(userToken);
  const requestedParsed = parsePermissionToken(requestedToken);

  if (!userParsed || !requestedParsed) {
    return userToken === requestedToken;
  }

  if (userParsed.original === requestedParsed.original) {
    return true;
  }

  if (matchShortTokens(userParsed, requestedParsed)) {
    return true;
  }

  if (
    hasFieldMismatch(userParsed.app, requestedParsed.app) ||
    hasFieldMismatch(userParsed.domain, requestedParsed.domain) ||
    hasFieldMismatch(userParsed.resource, requestedParsed.resource)
  ) {
    return false;
  }

  if (!scopeMatches(userParsed.scope, requestedParsed.scope)) {
    return false;
  }

  return actionMatches(userParsed.action, requestedParsed.action);
}

