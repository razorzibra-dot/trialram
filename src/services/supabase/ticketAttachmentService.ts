/**
 * Ticket Attachment Service (Supabase Implementation)
 * Handles ticket file attachment operations with PostgreSQL backend
 */

import { supabase, getSupabaseClient } from '@/services/supabase/client';
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

export class TicketAttachmentService {
  /**
   * Get attachments for a specific ticket
   */
  async getAttachments(ticketId: string, filters: TicketAttachmentFilters = {}): Promise<TicketAttachment[]> {
    let query = getSupabaseClient()
      .from('ticket_attachments')
      .select(`
        id,
        ticket_id,
        filename,
        original_filename,
        file_path,
        file_url,
        content_type,
        file_size,
        uploaded_by,
        uploaded_by_name,
        created_at,
        users!ticket_attachments_uploaded_by_fkey (
          name
        )
      `)
      .eq('ticket_id', ticketId);

    // Apply filters
    if (filters.uploaded_by) {
      query = query.eq('uploaded_by', filters.uploaded_by);
    }

    if (filters.content_type) {
      query = query.like('content_type', `${filters.content_type}%`);
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    // Sort by creation date (newest first)
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching ticket attachments:', error);
      throw new Error(`Failed to fetch attachments: ${error.message}`);
    }

    // Transform the data to match our interface
    return (data || []).map(attachment => ({
      id: attachment.id,
      ticket_id: attachment.ticket_id,
      filename: attachment.filename,
      original_filename: attachment.original_filename,
      file_path: attachment.file_path,
      file_url: attachment.file_url,
      content_type: attachment.content_type,
      file_size: attachment.file_size,
      uploaded_by: attachment.uploaded_by,
      uploaded_by_name: attachment.uploaded_by_name || attachment.users?.name || 'Unknown User',
      created_at: attachment.created_at,
    }));
  }

  /**
   * Get a single attachment by ID
   */
  async getAttachment(attachmentId: string): Promise<TicketAttachment | null> {
    const { data, error } = await getSupabaseClient()
      .from('ticket_attachments')
      .select(`
        id,
        ticket_id,
        filename,
        original_filename,
        file_path,
        file_url,
        content_type,
        file_size,
        uploaded_by,
        uploaded_by_name,
        created_at,
        users!ticket_attachments_uploaded_by_fkey (
          name
        )
      `)
      .eq('id', attachmentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Attachment not found
      }
      console.error('Error fetching ticket attachment:', error);
      throw new Error(`Failed to fetch attachment: ${error.message}`);
    }

    return {
      id: data.id,
      ticket_id: data.ticket_id,
      filename: data.filename,
      original_filename: data.original_filename,
      file_path: data.file_path,
      file_url: data.file_url,
      content_type: data.content_type,
      file_size: data.file_size,
      uploaded_by: data.uploaded_by,
      uploaded_by_name: data.uploaded_by_name || data.users?.name || 'Unknown User',
      created_at: data.created_at,
    };
  }

  /**
   * Upload a new attachment
   */
  async uploadAttachment(data: CreateAttachmentData): Promise<TicketAttachment> {
    // Get current user
    const { data: { user }, error: userError } = await getSupabaseClient().auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get user details
    const { data: userData, error: userFetchError } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single();

    if (userFetchError) {
      console.error('Error fetching user details:', userFetchError);
    }

    // Upload file to Supabase Storage
    const fileName = `${data.ticket_id}/${Date.now()}_${data.file.name}`;
    const { data: uploadData, error: uploadError } = await getSupabaseClient().storage
      .from('ticket-attachments')
      .upload(fileName, data.file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = getSupabaseClient().storage
      .from('ticket-attachments')
      .getPublicUrl(fileName);

    // Create attachment record
    const attachmentData = {
      ticket_id: data.ticket_id,
      filename: data.filename || data.file.name,
      original_filename: data.file.name,
      file_path: uploadData.path,
      file_url: urlData.publicUrl,
      content_type: data.file.type || 'application/octet-stream',
      file_size: data.file.size,
      uploaded_by: user.id,
      uploaded_by_name: userData?.name || user.email || 'Unknown User',
    };

    const { data: insertedAttachment, error } = await supabase
      .from('ticket_attachments')
      .insert(attachmentData)
      .select(`
        id,
        ticket_id,
        filename,
        original_filename,
        file_path,
        file_url,
        content_type,
        file_size,
        uploaded_by,
        uploaded_by_name,
        created_at
      `)
      .single();

    if (error) {
      console.error('Error creating ticket attachment:', error);
      // Try to clean up uploaded file if database insert failed
      await getSupabaseClient().storage
        .from('ticket-attachments')
        .remove([uploadData.path]);
      throw new Error(`Failed to create attachment: ${error.message}`);
    }

    return insertedAttachment;
  }

  /**
   * Delete an attachment
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    // Get current user for authorization check
    const { data: { user }, error: userError } = await getSupabaseClient().auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get attachment details first
    const attachment = await this.getAttachment(attachmentId);
    if (!attachment) {
      throw new Error('Attachment not found');
    }

    // Delete from database
    const { error } = await supabase
      .from('ticket_attachments')
      .delete()
      .eq('id', attachmentId)
      .eq('uploaded_by', user.id); // Only allow deleting own attachments

    if (error) {
      console.error('Error deleting ticket attachment:', error);
      throw new Error(`Failed to delete attachment: ${error.message}`);
    }

    // Delete file from storage
    if (attachment.file_path) {
      await getSupabaseClient().storage
        .from('ticket-attachments')
        .remove([attachment.file_path]);
    }
  }

  /**
   * Download attachment file
   */
  async downloadAttachment(attachmentId: string): Promise<Blob> {
    const attachment = await this.getAttachment(attachmentId);
    if (!attachment) {
      throw new Error('Attachment not found');
    }

    if (!attachment.file_path) {
      throw new Error('File path not available');
    }

    const { data, error } = await getSupabaseClient().storage
      .from('ticket-attachments')
      .download(attachment.file_path);

    if (error) {
      console.error('Error downloading attachment:', error);
      throw new Error(`Failed to download attachment: ${error.message}`);
    }

    return data;
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
