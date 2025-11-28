/**
 * Ticket Comment Service (Mock Implementation)
 * Handles ticket comment operations for development and testing
 */

import { TicketComment } from '@/types/crm';

// Mock data for ticket comments
let mockComments: TicketComment[] = [
  {
    id: 'comment-1',
    ticket_id: 'ticket-1',
    content: 'Initial investigation shows this is a configuration issue.',
    author_id: 'user-1',
    author_name: 'John Smith',
    author_role: 'engineer',
    created_at: '2025-01-15T10:30:00Z',
    updated_at: '2025-01-15T10:30:00Z',
  },
  {
    id: 'comment-2',
    ticket_id: 'ticket-1',
    content: 'Customer confirmed they can now access the system. Issue resolved.',
    author_id: 'user-2',
    author_name: 'Sarah Johnson',
    author_role: 'agent',
    created_at: '2025-01-15T14:45:00Z',
    updated_at: '2025-01-15T14:45:00Z',
  },
];

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

export class MockTicketCommentService {
  /**
   * Get comments for a specific ticket
   */
  async getComments(ticketId: string, filters: TicketCommentFilters = {}): Promise<TicketComment[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    let comments = mockComments.filter(comment => comment.ticket_id === ticketId);

    // Apply filters
    if (filters.author_id) {
      comments = comments.filter(comment => comment.author_id === filters.author_id);
    }

    if (filters.parent_id !== undefined) {
      comments = comments.filter(comment => comment.parent_id === filters.parent_id);
    }

    if (filters.date_from) {
      comments = comments.filter(comment => comment.created_at >= filters.date_from!);
    }

    if (filters.date_to) {
      comments = comments.filter(comment => comment.created_at <= filters.date_to!);
    }

    // Sort by creation date (newest first)
    return comments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Get a single comment by ID
   */
  async getComment(commentId: string): Promise<TicketComment | null> {
    await new Promise(resolve => setTimeout(resolve, 200));

    return mockComments.find(comment => comment.id === commentId) || null;
  }

  /**
   * Create a new comment
   */
  async createComment(data: CreateCommentData): Promise<TicketComment> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const newComment: TicketComment = {
      id: `comment-${Date.now()}`,
      ticket_id: data.ticket_id,
      content: data.content,
      parent_id: data.parent_id,
      author_id: 'current-user', // In real app, this would come from auth context
      author_name: 'Current User',
      author_role: 'agent',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockComments.push(newComment);
    return newComment;
  }

  /**
   * Update an existing comment
   */
  async updateComment(commentId: string, content: string): Promise<TicketComment> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const commentIndex = mockComments.findIndex(comment => comment.id === commentId);
    if (commentIndex === -1) {
      throw new Error('Comment not found');
    }

    mockComments[commentIndex] = {
      ...mockComments[commentIndex],
      content,
      updated_at: new Date().toISOString(),
    };

    return mockComments[commentIndex];
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const commentIndex = mockComments.findIndex(comment => comment.id === commentId);
    if (commentIndex === -1) {
      throw new Error('Comment not found');
    }

    // Remove the comment and all its replies
    mockComments = mockComments.filter(comment =>
      comment.id !== commentId && comment.parent_id !== commentId
    );
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
export const mockTicketCommentService = new MockTicketCommentService();