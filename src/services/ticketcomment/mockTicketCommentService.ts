/**
 * Ticket Comment Service (Mock Implementation)
 * Handles ticket comment operations with in-memory data
 */

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

class MockTicketCommentService {
  private mockComments: TicketComment[] = [
    {
      id: '1',
      ticket_id: '1',
      content: 'Initial investigation shows this is related to database connection pooling.',
      author_id: 'user_3',
      author_name: 'Mike Wilson',
      author_role: 'agent',
      parent_id: undefined,
      created_at: '2024-01-28T10:00:00Z',
      updated_at: '2024-01-28T10:00:00Z'
    },
    {
      id: '2',
      ticket_id: '1',
      content: 'Thanks for the update. Any ETA on the fix?',
      author_id: 'user_1',
      author_name: 'John Doe',
      author_role: 'admin',
      parent_id: '1',
      created_at: '2024-01-28T11:00:00Z',
      updated_at: '2024-01-28T11:00:00Z'
    }
  ];

  /**
   * Get comments for a specific ticket
   */
  async getComments(ticketId: string, filters: TicketCommentFilters = {}): Promise<TicketComment[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    let comments = this.mockComments.filter(c => c.ticket_id === ticketId);

    // Apply filters
    if (filters.author_id) {
      comments = comments.filter(c => c.author_id === filters.author_id);
    }

    if (filters.parent_id !== undefined) {
      if (filters.parent_id === null) {
        comments = comments.filter(c => !c.parent_id);
      } else {
        comments = comments.filter(c => c.parent_id === filters.parent_id);
      }
    }

    if (filters.date_from) {
      comments = comments.filter(c => c.created_at >= filters.date_from!);
    }

    if (filters.date_to) {
      comments = comments.filter(c => c.created_at <= filters.date_to!);
    }

    // Sort by creation date (newest first)
    return comments.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Get a single comment by ID
   */
  async getCommentById(id: string): Promise<TicketComment | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.mockComments.find(c => c.id === id) || null;
  }

  /**
   * Add a new comment to a ticket
   */
  async addComment(data: CreateCommentData): Promise<TicketComment> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const newComment: TicketComment = {
      id: `comment_${Date.now()}`,
      ticket_id: data.ticket_id,
      content: data.content,
      author_id: 'current_user_id', // Would come from auth context
      author_name: 'Current User',
      author_role: 'agent',
      parent_id: data.parent_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.mockComments.push(newComment);
    return newComment;
  }

  /**
   * Update an existing comment
   */
  async updateComment(id: string, content: string): Promise<TicketComment> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const comment = this.mockComments.find(c => c.id === id);
    if (!comment) {
      throw new Error('Comment not found');
    }

    comment.content = content;
    comment.updated_at = new Date().toISOString();
    
    return comment;
  }

  /**
   * Delete a comment
   */
  async deleteComment(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const index = this.mockComments.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Comment not found');
    }

    this.mockComments.splice(index, 1);
  }

  /**
   * Get comment count for a ticket
   */
  async getCommentCount(ticketId: string): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.mockComments.filter(c => c.ticket_id === ticketId).length;
  }
}

export const ticketCommentService = new MockTicketCommentService();
