/**
 * Ticket Comment Service (Supabase Implementation)
 * Handles ticket comment operations with PostgreSQL backend
 */

import { supabase } from '@/services/supabase/client';
import { TicketComment } from '@/types/crm';

export interface CreateCommentData {
  ticket_id: string;
  content: string;
  parent_id?: string;
}

export interface TicketCommentFilters {
  ticket_id?: string;
  author_id?: string;
  parent_id?: string;
  date_from?: string;
  date_to?: string;
}

export class TicketCommentService {
  /**
   * Get comments for a specific ticket
   */
  async getComments(ticketId: string, filters: TicketCommentFilters = {}): Promise<TicketComment[]> {
    let query = supabase
      .from('ticket_comments')
      .select(`
        id,
        ticket_id,
        content,
        author_id,
        author_name,
        author_role,
        parent_id,
        created_at,
        updated_at,
        users!ticket_comments_author_id_fkey (
          name,
          role
        )
      `)
      .eq('ticket_id', ticketId);

    // Apply filters
    if (filters.author_id) {
      query = query.eq('author_id', filters.author_id);
    }

    if (filters.parent_id !== undefined) {
      if (filters.parent_id === null) {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', filters.parent_id);
      }
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
      console.error('Error fetching ticket comments:', error);
      throw new Error(`Failed to fetch comments: ${error.message}`);
    }

    // Transform the data to match our interface
    return (data || []).map(comment => ({
      id: comment.id,
      ticket_id: comment.ticket_id,
      content: comment.content,
      author_id: comment.author_id,
      author_name: comment.author_name || comment.users?.[0]?.name || 'Unknown User',
      author_role: comment.author_role || comment.users?.[0]?.role || 'user',
      parent_id: comment.parent_id,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
    }));
  }

  /**
   * Get a single comment by ID
   */
  async getComment(commentId: string): Promise<TicketComment | null> {
    const { data, error } = await supabase
      .from('ticket_comments')
      .select(`
        id,
        ticket_id,
        content,
        author_id,
        author_name,
        author_role,
        parent_id,
        created_at,
        updated_at,
        users!ticket_comments_author_id_fkey (
          name,
          role
        )
      `)
      .eq('id', commentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Comment not found
      }
      console.error('Error fetching ticket comment:', error);
      throw new Error(`Failed to fetch comment: ${error.message}`);
    }

    return {
      id: data.id,
      ticket_id: data.ticket_id,
      content: data.content,
      author_id: data.author_id,
      author_name: data.author_name || data.users?.[0]?.name || 'Unknown User',
      author_role: data.author_role || data.users?.[0]?.role || 'user',
      parent_id: data.parent_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  /**
   * Create a new comment
   */
  async createComment(data: CreateCommentData): Promise<TicketComment> {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get user details
    const { data: userData, error: userFetchError } = await supabase
      .from('users')
      .select('name, role')
      .eq('id', user.id)
      .single();

    if (userFetchError) {
      console.error('Error fetching user details:', userFetchError);
    }

    const commentData = {
      ticket_id: data.ticket_id,
      content: data.content,
      parent_id: data.parent_id || null,
      author_id: user.id,
      author_name: userData?.name || user.email || 'Unknown User',
      author_role: userData?.role || 'user',
    };

    const { data: insertedComment, error } = await supabase
      .from('ticket_comments')
      .insert(commentData)
      .select(`
        id,
        ticket_id,
        content,
        author_id,
        author_name,
        author_role,
        parent_id,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error creating ticket comment:', error);
      throw new Error(`Failed to create comment: ${error.message}`);
    }

    return insertedComment;
  }

  /**
   * Update an existing comment
   */
  async updateComment(commentId: string, content: string): Promise<TicketComment> {
    // Get current user for authorization check
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: updatedComment, error } = await supabase
      .from('ticket_comments')
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .eq('author_id', user.id) // Only allow updating own comments
      .select(`
        id,
        ticket_id,
        content,
        author_id,
        author_name,
        author_role,
        parent_id,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error updating ticket comment:', error);
      throw new Error(`Failed to update comment: ${error.message}`);
    }

    if (!updatedComment) {
      throw new Error('Comment not found or you do not have permission to update it');
    }

    return updatedComment;
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    // Get current user for authorization check
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('ticket_comments')
      .delete()
      .eq('id', commentId)
      .eq('author_id', user.id); // Only allow deleting own comments

    if (error) {
      console.error('Error deleting ticket comment:', error);
      throw new Error(`Failed to delete comment: ${error.message}`);
    }
  }

  /**
   * Get threaded comments (with replies nested)
   */
  async getThreadedComments(ticketId: string): Promise<TicketComment[]> {
    const allComments = await this.getComments(ticketId);

    // Build threaded structure
    const topLevelComments = allComments.filter(comment => !comment.parent_id);
    const replies = allComments.filter(comment => comment.parent_id);

    // Attach replies to parent comments
    topLevelComments.forEach(comment => {
      comment.replies = replies.filter(reply => reply.parent_id === comment.id);
    });

    return topLevelComments;
  }

  /**
   * Add a reply to a comment
   */
  async addReply(parentCommentId: string, content: string): Promise<TicketComment> {
    const parentComment = await this.getComment(parentCommentId);
    if (!parentComment) {
      throw new Error('Parent comment not found');
    }

    return this.createComment({
      ticket_id: parentComment.ticket_id,
      content,
      parent_id: parentCommentId,
    });
  }
}

// Export singleton instance
export const ticketCommentService = new TicketCommentService();