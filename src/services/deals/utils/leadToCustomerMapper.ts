import type { LeadDTO } from '@/types/dtos';
import type { CreateCustomerData } from '@/modules/features/customers/services/customerService';

// Map lead fields to customer creation payload
export const mapLeadToCustomerCreateInput = (lead: LeadDTO): CreateCustomerData => {
  const contactName = [lead.firstName, lead.lastName].filter(Boolean).join(' ').trim();
  const companyName = lead.companyName || contactName || 'Customer';

  const sizeMap: Record<string, CreateCustomerData['size']> = {
    startup: 'startup',
    small: 'small',
    medium: 'medium',
    large: 'enterprise',
    enterprise: 'enterprise',
  };

  return {
    company_name: companyName,
    contact_name: contactName || companyName,
    email: lead.email || '',
    phone: lead.phone,
    mobile: lead.mobile,
    website: undefined,
    address: undefined,
    city: undefined,
    country: undefined,
    industry: lead.industry,
    size: lead.companySize ? sizeMap[lead.companySize] : undefined,
    status: 'prospect',
    customer_type: 'business',
    credit_limit: undefined,
    payment_terms: undefined,
    tax_id: undefined,
    notes: lead.notes,
    assigned_to: lead.assignedTo,
    source: lead.source,
    rating: undefined,
    tags: [],
  };
};
