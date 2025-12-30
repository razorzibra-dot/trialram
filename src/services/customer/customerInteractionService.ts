/**
 * Customer Interaction Service - DEPRECATED
 * 
 * This service was a legacy feature for tracking customer interactions.
 * It has been removed to clean up the codebase.
 * 
 * If customer interaction tracking is needed in the future:
 * 1. Create a new service with proper Supabase integration
 * 2. Define types in src/types/
 * 3. Use the serviceFactory pattern for creation
 * 4. Follow the CRUD service implementation pattern from the copilot-instructions.md
 */

import { FilterOptions, PaginatedResponse } from '@/modules/core/types';

/**
 * Legacy interfaces - kept for reference only
 * DO NOT USE IN NEW CODE
 */
export interface CreateCustomerInteractionData {
  customer_id: string;
  type: string;
  direction?: string;
  subject: string;
  description?: string;
  interaction_date: string;
  duration_minutes?: number;
  outcome?: string;
  outcome_notes?: string;
  contact_person?: string;
  performed_by: string;
  participants?: string[];
  location?: string;
  tags?: string[];
  follow_up_required?: boolean;
  follow_up_date?: string;
  next_action?: string;
}

export interface UpdateCustomerInteractionData extends Partial<CreateCustomerInteractionData> {
  id: string;
}

export interface CustomerInteractionFilters extends FilterOptions {
  customer_id?: string;
  type?: string;
  performed_by?: string;
  date_from?: string;
  date_to?: string;
  outcome?: string;
  tags?: string[];
}

/**
 * DEPRECATED: This service is no longer used.
 * Kept as a placeholder to prevent import errors.
 */
export const customerInteractionService = {
  async getInteractions() {
    throw new Error('Customer interaction service has been deprecated. Please implement a new service if this feature is needed.');
  },
};

export {};