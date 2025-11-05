/**
 * Application Configuration Types
 * Centralized types for system configuration management
 */

export interface ConfigurationSetting {
  key: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'json' | 'secret';
  description: string;
  default?: unknown;
  env?: string; // environment variable name
  updatedAt: Date;
  updatedBy: string;
  category: string;
}

export interface ConfigurationAudit {
  id: string;
  settingKey: string;
  oldValue: unknown;
  newValue: unknown;
  changedAt: Date;
  changedBy: string;
  reason?: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface ValidationSchema {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  minValue?: number;
  maxValue?: number;
  pattern?: string; // regex
  enum?: unknown[];
  customValidator?: (value: unknown) => boolean;
  errorMessage: string;
}