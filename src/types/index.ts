/**
 * Centralized Type Exports
 * Re-exports all types from individual type definition files
 * 
 * Usage:
 * import { Customer, TenantDirectoryEntry } from '@/types';
 * 
 * This provides a unified namespace for all application types
 * and makes it easier to manage type imports across the application.
 */

// Auth types
export * from './auth';

// Core CRM types
export * from './crm';

// Module-specific types
export * from './contracts';
export * from './serviceContract';
export * from './jobWork';
export * from './productSales';
export * from './superAdmin';
export * from './superUserModule';

// Features types
export * from './complaints';
export * from './notifications';
export * from './logs';
export * from './rbac';

// UI/UX types
export * from './toast';
export * from './masters';
export * from './pdfTemplates';

// System & Infrastructure types (Phase 1 Centralization)
export * from './audit';
export * from './compliance';
export * from './service';
export * from './rateLimit';
export * from './configuration';
export * from './dashboard';
export * from './error';
export * from './file';
export * from './performance';
export * from './testing';
export * from './supabase';

// DTOs
export * from './dtos';

// Global type definitions are in global.d.ts