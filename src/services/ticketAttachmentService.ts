/**
 * Ticket Attachment Service (Mock Implementation)
 * Handles ticket file attachment operations for development and testing
 */

import { TicketAttachment } from '@/types/crm';

// Mock data for ticket attachments
const mockAttachments: TicketAttachment[] = [
  {
    id: 'attachment-1',
    ticket_id: 'ticket-1',
    filename: 'error_log.txt',
    original_filename: 'error_log_2025_01_15.txt',
    file_path: '/uploads/tickets/ticket-1/error_log.txt',
    file_url: 'https://example.com/uploads/tickets/ticket-1/error_log.txt',
    content_type: 'text/plain',
    file_size: 2048,
    uploaded_by: 'user-1',
    uploaded_by_name: 'John Smith',
    created_at: '2025-01-15T10:30:00Z',
  },
];

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

export class TicketAttachmentService {
  /**
   * Get attachments for a specific ticket
   */
  async getAttachments(ticketId: string, filters: TicketAttachmentFilters = {}): Promise<TicketAttachment[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    let attachments = mockAttachments.filter(attachment => attachment.ticket_id === ticketId);

    // Apply filters
    if (filters.uploaded_by) {
      attachments = attachments.filter(attachment => attachment.uploaded_by === filters.uploaded_by);
    }

    if (filters.content_type) {
      attachments = attachments.filter(attachment => attachment.content_type.startsWith(filters.content_type!));
    }

    if (filters.date_from) {
      attachments = attachments.filter(attachment => attachment.created_at >= filters.date_from!);
    }

    if (filters.date_to) {
      attachments = attachments.filter(attachment => attachment.created_at <= filters.date_to!);
    }

    // Sort by creation date (newest first)
    return attachments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Get a single attachment by ID
   */
  async getAttachment(attachmentId: string): Promise<TicketAttachment | null> {
    await new Promise(resolve => setTimeout(resolve, 200));

    return mockAttachments.find(attachment => attachment.id === attachmentId) || null;
  }

  /**
   * Upload a new attachment
   */
  async uploadAttachment(data: CreateAttachmentData): Promise<TicketAttachment> {
    // Simulate file upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newAttachment: TicketAttachment = {
      id: `attachment-${Date.now()}`,
      ticket_id: data.ticket_id,
      filename: data.filename || data.file.name,
      original_filename: data.file.name,
      file_path: `/uploads/tickets/${data.ticket_id}/${data.file.name}`,
      file_url: `https://example.com/uploads/tickets/${data.ticket_id}/${data.file.name}`,
      content_type: data.file.type || 'application/octet-stream',
      file_size: data.file.size,
      uploaded_by: 'current-user', // In real app, this would come from auth context
      uploaded_by_name: 'Current User',
      created_at: new Date().toISOString(),
    };

    mockAttachments.push(newAttachment);
    return newAttachment;
  }

  /**
   * Delete an attachment
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const attachmentIndex = mockAttachments.findIndex(attachment => attachment.id === attachmentId);
    if (attachmentIndex === -1) {
      throw new Error('Attachment not found');
    }

    mockAttachments.splice(attachmentIndex, 1);
  }

  /**
   * Download attachment file
   */
  async downloadAttachment(attachmentId: string): Promise<Blob> {
    const attachment = await this.getAttachment(attachmentId);
    if (!attachment) {
      throw new Error('Attachment not found');
    }

    // In a real implementation, this would fetch the file from the server
    // For mock purposes, we'll create a simple text blob
    const content = `Mock file content for ${attachment.filename}`;
    return new Blob([content], { type: attachment.content_type });
  }

  /**
   * Get attachment statistics for a ticket
   */
  async getAttachmentStats(ticketId: string): Promise<{
    totalCount: number;
    totalSize: number;
    contentTypeBreakdown: Record<string, number>;
  }> {
    const attachments = await this.getAttachments(ticketId);

    const stats = {
      totalCount: attachments.length,
      totalSize: attachments.reduce((sum, att) => sum + att.file_size, 0),
      contentTypeBreakdown: {} as Record<string, number>,
    };

    attachments.forEach(attachment => {
      const type = attachment.content_type.split('/')[0] || 'unknown';
      stats.contentTypeBreakdown[type] = (stats.contentTypeBreakdown[type] || 0) + 1;
    });

    return stats;
  }
}

// Export singleton instance
export const ticketAttachmentService = new TicketAttachmentService();