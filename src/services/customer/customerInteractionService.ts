/**
 * Customer Interaction Service - Mock Implementation
 * Handles customer interaction history and communication tracking
 */

import { CustomerInteraction, CustomerInteractionAttachment } from '@/types/crm';
import { FilterOptions, PaginatedResponse } from '@/modules/core/types';

export interface CreateCustomerInteractionData {
  customer_id: string;
  type: CustomerInteraction['type'];
  direction?: CustomerInteraction['direction'];
  subject: string;
  description?: string;
  interaction_date: string;
  duration_minutes?: number;
  outcome?: CustomerInteraction['outcome'];
  outcome_notes?: string;
  contact_person?: string;
  performed_by: string;
  participants?: string[];
  location?: string;
  attachments?: Omit<CustomerInteractionAttachment, 'id' | 'interaction_id' | 'created_at'>[];
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

export interface ICustomerInteractionService {
  getInteractions(filters?: CustomerInteractionFilters): Promise<PaginatedResponse<CustomerInteraction>>;
  getInteraction(id: string): Promise<CustomerInteraction | null>;
  createInteraction(data: CreateCustomerInteractionData): Promise<CustomerInteraction>;
  updateInteraction(id: string, data: Partial<CreateCustomerInteractionData>): Promise<CustomerInteraction>;
  deleteInteraction(id: string): Promise<void>;
  getInteractionAttachments(interactionId: string): Promise<CustomerInteractionAttachment[]>;
  addInteractionAttachment(interactionId: string, attachment: Omit<CustomerInteractionAttachment, 'id' | 'interaction_id' | 'created_at'>): Promise<CustomerInteractionAttachment>;
  removeInteractionAttachment(attachmentId: string): Promise<void>;
}

// Mock data
const mockInteractions: CustomerInteraction[] = [
  {
    id: '1',
    customer_id: '1',
    type: 'call',
    direction: 'outbound',
    subject: 'Follow-up on product inquiry',
    description: 'Called customer to follow up on their interest in our premium service package.',
    interaction_date: '2025-01-15T10:30:00Z',
    duration_minutes: 15,
    outcome: 'successful',
    outcome_notes: 'Customer requested a demo next week',
    contact_person: 'John Smith',
    performed_by: 'user-1',
    performed_by_name: 'Sarah Johnson',
    participants: ['user-1'],
    tags: ['follow-up', 'demo-requested'],
    follow_up_required: true,
    follow_up_date: '2025-01-22T10:00:00Z',
    next_action: 'Schedule product demo',
    tenant_id: 'tenant-1',
    created_at: '2025-01-15T10:35:00Z',
    updated_at: '2025-01-15T10:35:00Z',
    created_by: 'user-1',
  },
  {
    id: '2',
    customer_id: '1',
    type: 'email',
    direction: 'inbound',
    subject: 'Question about pricing',
    description: 'Customer emailed asking for detailed pricing information for our enterprise plan.',
    interaction_date: '2025-01-10T14:20:00Z',
    outcome: 'successful',
    outcome_notes: 'Sent pricing document and scheduled call',
    contact_person: 'Jane Doe',
    performed_by: 'user-2',
    performed_by_name: 'Mike Wilson',
    participants: ['user-2'],
    tags: ['pricing', 'enterprise'],
    follow_up_required: true,
    follow_up_date: '2025-01-12T15:00:00Z',
    next_action: 'Follow-up pricing discussion',
    tenant_id: 'tenant-1',
    created_at: '2025-01-10T14:25:00Z',
    updated_at: '2025-01-10T14:25:00Z',
    created_by: 'user-2',
  },
  {
    id: '3',
    customer_id: '2',
    type: 'meeting',
    subject: 'Product demonstration',
    description: 'Conducted product demo for the customer team. Showed key features and answered questions.',
    interaction_date: '2025-01-08T11:00:00Z',
    duration_minutes: 60,
    outcome: 'successful',
    outcome_notes: 'Customer very interested, will send proposal',
    contact_person: 'Bob Johnson',
    performed_by: 'user-1',
    performed_by_name: 'Sarah Johnson',
    participants: ['user-1', 'user-3'],
    location: 'Conference Room A',
    tags: ['demo', 'presentation'],
    follow_up_required: true,
    follow_up_date: '2025-01-15T09:00:00Z',
    next_action: 'Send formal proposal',
    tenant_id: 'tenant-1',
    created_at: '2025-01-08T12:00:00Z',
    updated_at: '2025-01-08T12:00:00Z',
    created_by: 'user-1',
  },
];

let mockAttachments: CustomerInteractionAttachment[] = [
  {
    id: '1',
    interaction_id: '2',
    filename: 'enterprise_pricing.pdf',
    original_filename: 'Enterprise Pricing Document.pdf',
    content_type: 'application/pdf',
    file_size: 245760,
    uploaded_by: 'user-2',
    uploaded_by_name: 'Mike Wilson',
    created_at: '2025-01-10T14:25:00Z',
  },
];

export class CustomerInteractionService implements ICustomerInteractionService {
  async getInteractions(filters: CustomerInteractionFilters = {}): Promise<PaginatedResponse<CustomerInteraction>> {
    try {
      let filtered = [...mockInteractions];

      // Apply filters
      if (filters.customer_id) {
        filtered = filtered.filter(i => i.customer_id === filters.customer_id);
      }
      if (filters.type) {
        filtered = filtered.filter(i => i.type === filters.type);
      }
      if (filters.performed_by) {
        filtered = filtered.filter(i => i.performed_by === filters.performed_by);
      }
      if (filters.date_from) {
        filtered = filtered.filter(i => new Date(i.interaction_date) >= new Date(filters.date_from!));
      }
      if (filters.date_to) {
        filtered = filtered.filter(i => new Date(i.interaction_date) <= new Date(filters.date_to!));
      }
      if (filters.outcome) {
        filtered = filtered.filter(i => i.outcome === filters.outcome);
      }
      if (filters.tags && filters.tags.length > 0) {
        filtered = filtered.filter(i => i.tags?.some(tag => filters.tags!.includes(tag)));
      }

      // Sort by interaction date (newest first)
      filtered.sort((a, b) => new Date(b.interaction_date).getTime() - new Date(a.interaction_date).getTime());

      // Pagination
      const { page = 1, pageSize = 20 } = filters;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = filtered.slice(startIndex, endIndex);

      return {
        data: paginatedData,
        total: filtered.length,
        page,
        pageSize,
        totalPages: Math.ceil(filtered.length / pageSize),
      };
    } catch (error) {
      console.error('Error fetching customer interactions:', error);
      throw error;
    }
  }

  async getInteraction(id: string): Promise<CustomerInteraction | null> {
    try {
      return mockInteractions.find(i => i.id === id) || null;
    } catch (error) {
      console.error('Error fetching customer interaction:', error);
      throw error;
    }
  }

  async createInteraction(data: CreateCustomerInteractionData): Promise<CustomerInteraction> {
    try {
      const newInteraction: CustomerInteraction = {
        id: String(mockInteractions.length + 1),
        ...data,
        tenant_id: 'tenant-1', // Mock tenant
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: data.performed_by,
      };

      mockInteractions.unshift(newInteraction); // Add to beginning for newest first
      return newInteraction;
    } catch (error) {
      console.error('Error creating customer interaction:', error);
      throw error;
    }
  }

  async updateInteraction(id: string, data: Partial<CreateCustomerInteractionData>): Promise<CustomerInteraction> {
    try {
      const index = mockInteractions.findIndex(i => i.id === id);
      if (index === -1) {
        throw new Error('Interaction not found');
      }

      mockInteractions[index] = {
        ...mockInteractions[index],
        ...data,
        updated_at: new Date().toISOString(),
      };

      return mockInteractions[index];
    } catch (error) {
      console.error('Error updating customer interaction:', error);
      throw error;
    }
  }

  async deleteInteraction(id: string): Promise<void> {
    try {
      const index = mockInteractions.findIndex(i => i.id === id);
      if (index === -1) {
        throw new Error('Interaction not found');
      }

      mockInteractions.splice(index, 1);

      // Also remove related attachments
      mockAttachments = mockAttachments.filter(a => a.interaction_id !== id);
    } catch (error) {
      console.error('Error deleting customer interaction:', error);
      throw error;
    }
  }

  async getInteractionAttachments(interactionId: string): Promise<CustomerInteractionAttachment[]> {
    try {
      return mockAttachments.filter(a => a.interaction_id === interactionId);
    } catch (error) {
      console.error('Error fetching interaction attachments:', error);
      throw error;
    }
  }

  async addInteractionAttachment(
    interactionId: string,
    attachment: Omit<CustomerInteractionAttachment, 'id' | 'interaction_id' | 'created_at'>
  ): Promise<CustomerInteractionAttachment> {
    try {
      const newAttachment: CustomerInteractionAttachment = {
        id: String(mockAttachments.length + 1),
        interaction_id: interactionId,
        ...attachment,
        created_at: new Date().toISOString(),
      };

      mockAttachments.push(newAttachment);
      return newAttachment;
    } catch (error) {
      console.error('Error adding interaction attachment:', error);
      throw error;
    }
  }

  async removeInteractionAttachment(attachmentId: string): Promise<void> {
    try {
      const index = mockAttachments.findIndex(a => a.id === attachmentId);
      if (index === -1) {
        throw new Error('Attachment not found');
      }

      mockAttachments.splice(index, 1);
    } catch (error) {
      console.error('Error removing interaction attachment:', error);
      throw error;
    }
  }
}

export const customerInteractionService = new CustomerInteractionService();