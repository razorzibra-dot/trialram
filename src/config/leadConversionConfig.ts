// Lead conversion configuration and helpers
// Enterprise-level: centralize threshold and gating logic

export const LEAD_CONVERSION_MIN_SCORE = 55;

export function canShowConvertAction(options: {
  leadScore: number;
  convertedToCustomer?: boolean;
  hasOverridePermission?: boolean;
}): boolean {
  const { leadScore, convertedToCustomer, hasOverridePermission } = options;
  if (convertedToCustomer) return false;
  if (hasOverridePermission) return true;
  return leadScore >= LEAD_CONVERSION_MIN_SCORE;
}

export function canConvertServer(options: {
  leadScore: number;
  hasOverridePermission?: boolean;
}): boolean {
  const { leadScore, hasOverridePermission } = options;
  if (hasOverridePermission) return true;
  return leadScore >= LEAD_CONVERSION_MIN_SCORE;
}
