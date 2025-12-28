/**
 * Ticket Attachment Service (Mock Implementation)
 * Handles ticket file attachment operations with in-memory data
 */

import { TicketAttachment } from '@/types/crm';

export interface CreateAttachmentData {
  ticket_id: string;
  file: File;
  filename?: string;
}

export interface TicketAttachmentFilters {
  ticket_id?: string;
  uploaded_by?: string;
  content_type?: string;
  date_from?: string;
  date_to?: string;
}

class MockTicketAttachmentService {
  private mockAttachments: TicketAttachment[] = [
    {
      id: '1',
      ticket_id: '1',
      filename: 'error-log.txt',
      original_filename: 'error-log.txt',
      file_path: '/uploads/tickets/error-log.txt',
      file_url: 'https://example.com/uploads/tickets/error-log.txt',
      content_type: 'text/plain',
      file_size: 2048,
      uploaded_by: 'user_3',
      uploaded_by_name: 'Mike Wilson',
      created_at: '2024-01-28T10:15:00Z'
    },
    {
      id: '2',
      ticket_id: '1',
      filename: 'screenshot.png',
      original_filename: 'screenshot.png',
      file_path: '/uploads/tickets/screenshot.png',
      file_url: 'https://example.com/uploads/tickets/screenshot.png',
      content_type: 'image/png',
      file_size: 152400,
      uploaded_by: 'user_1',
      uploaded_by_name: 'John Doe',
      created_at: '2024-01-28T14:30:00Z'
    }
  ];

  /**
   * Get attachments for a specific ticket
   */
  async getAttachments(ticketId: string, filters: TicketAttachmentFilters = {}): Promise<TicketAttachment[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    let attachments = this.mockAttachments.filter(a => a.ticket_id === ticketId);

    // Apply filters
    if (filters.uploaded_by) {
      attachments = attachments.filter(a => a.uploaded_by === filters.uploaded_by);
    }

    if (filters.content_type) {
      attachments = attachments.filter(a => 
        a.content_type.startsWith(filters.content_type!)
      );
    }

    if (filters.date_from) {
      attachments = attachments.filter(a => a.created_at >= filters.date_from!);
    }

    if (filters.date_to) {
      attachments = attachments.filter(a => a.created_at <= filters.date_to!);
    }

    // Sort by creation date (newest first)
    return attachments.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Get a single attachment by ID
   */
  async getAttachmentById(id: string): Promise<TicketAttachment | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.mockAttachments.find(a => a.id === id) || null;
  }

  /**
   * Upload a new attachment to a ticket
   */
  async uploadAttachment(data: CreateAttachmentData): Promise<TicketAttachment> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const filename = data.filename || data.file.name;
    const newAttachment: TicketAttachment = {
      id: `attachment_${Date.now()}`,
      ticket_id: data.ticket_id,
      filename: filename,
      original_filename: data.file.name,
      file_path: `/uploads/tickets/${filename}`,
      file_url: `https://example.com/uploads/tickets/${filename}`,
      content_type: data.file.type,
      file_size: data.file.size,
      uploaded_by: 'current_user_id', // Would come from auth context
      uploaded_by_name: 'Current User',
      created_at: new Date().toISOString()
    };

    this.mockAttachments.push(newAttachment);
    return newAttachment;
  }

  /**
   * Delete an attachment
   */
  async deleteAttachment(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const index = this.mockAttachments.findIndex(a => a.id === id);
    if (index === -1) {
      throw new Error('Attachment not found');
    }

    this.mockAttachments.splice(index, 1);
  }

  /**
   * Get attachment count for a ticket
   */
  async getAttachmentCount(ticketId: string): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.mockAttachments.filter(a => a.ticket_id === ticketId).length;
  }

  /**
   * Download an attachment
   */
  async downloadAttachment(id: string): Promise<Blob> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const attachment = this.mockAttachments.find(a => a.id === id);
    if (!attachment) {
      throw new Error('Attachment not found');
    }

    // Return a mock blob
    return new Blob(['Mock file content'], { type: attachment.content_type });
  }
}

export const ticketAttachmentService = new MockTicketAttachmentService();
