/**
 * Ticket Comments Hooks
 * React hooks for ticket comment operations using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TicketComment } from '@/types/crm';
import { ticketCommentService } from '@/services/serviceFactory';
import { createEntityHooks } from '@/hooks/factories/createEntityHooks';
import { useNotification } from '@/hooks/useNotification';

// Query Keys
export const ticketCommentKeys = {
  all: ['ticket-comments'] as const,
  comments: (ticketId: string) => [...ticketCommentKeys.all, 'ticket', ticketId] as const,
  comment: (commentId: string) => [...ticketCommentKeys.all, 'comment', commentId] as const,
  threaded: (ticketId: string) => [...ticketCommentKeys.all, 'threaded', ticketId] as const,
};

// Factory-based CRUD keys (distinct namespace to avoid collisions)
const ticketCommentCrudKeys = {
  all: ['ticket-comments', 'crud'] as const,
  list: (filters: unknown) => [...ticketCommentCrudKeys.all, 'list', filters] as const,
  detail: (id: string) => [...ticketCommentCrudKeys.all, 'detail', id] as const,
};

// Adapter to fit GenericCrudService contract for factory hooks
const ticketCommentCrudAdapter = {
  async getAll(filters: Record<string, any> = {}) {
    const ticketId = filters.ticketId || filters?.customFilters?.ticketId;
    if (!ticketId) {
      return { data: [], total: 0 };
    }
    const data = await ticketCommentService.getComments(ticketId, filters);
    return { data, total: data.length };
  },
  async getById(id: string) {
    const comment = await ticketCommentService.getComment(id);
    if (!comment) throw new Error('Comment not found');
    return comment;
  },
  async create(data: Partial<TicketComment>) {
    if (!data.ticket_id || !data.content) {
      throw new Error('ticket_id and content are required');
    }
    return ticketCommentService.createComment({
      ticket_id: data.ticket_id,
      content: String(data.content),
      parent_id: data.parent_id,
    });
  },
  async update(id: string, data: Partial<TicketComment>) {
    if (data.content === undefined || data.content === null) {
      throw new Error('content is required');
    }
    return ticketCommentService.updateComment(id, String(data.content));
  },
  async delete(id: string) {
    await ticketCommentService.deleteComment(id);
  },
};

// Factory-generated CRUD hooks (in addition to specialized ones)
const commentCrudHooks = createEntityHooks<TicketComment>({
  entityName: 'Ticket Comment',
  service: ticketCommentCrudAdapter as any,
  queryKeys: {
    all: ticketCommentCrudKeys.all as unknown as string[],
    list: (filters: unknown) => ticketCommentCrudKeys.list(filters) as unknown as string[],
    detail: (id: string) => ticketCommentCrudKeys.detail(id) as unknown as string[],
  },
});

export const useTicketCommentsCrud = commentCrudHooks.useEntities;
export const useTicketCommentCrud = commentCrudHooks.useEntity;
export const useCreateTicketCommentCrud = commentCrudHooks.useCreateEntity;
export const useUpdateTicketCommentCrud = commentCrudHooks.useUpdateEntity;
export const useDeleteTicketCommentCrud = commentCrudHooks.useDeleteEntity;

/**
 * Hook for fetching comments for a specific ticket
 */
export const useTicketComments = (ticketId: string) => {
  return useQuery({
    queryKey: ticketCommentKeys.comments(ticketId),
    queryFn: async () => {
      return await ticketCommentService.getComments(ticketId);
    },
    enabled: !!ticketId,
  });
};

/**
 * Hook for fetching threaded comments (with replies nested)
 */
export const useThreadedTicketComments = (ticketId: string) => {
  return useQuery({
    queryKey: ticketCommentKeys.threaded(ticketId),
    queryFn: async () => {
      return await ticketCommentService.getThreadedComments(ticketId);
    },
    enabled: !!ticketId,
  });
};

/**
 * Hook for fetching a single comment
 */
export const useTicketComment = (commentId: string) => {
  return useQuery({
    queryKey: ticketCommentKeys.comment(commentId),
    queryFn: async () => {
      return await ticketCommentService.getComment(commentId);
    },
    enabled: !!commentId,
  });
};

/**
 * Hook for creating a new comment
 */
export const useCreateTicketComment = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async ({ ticketId, content, parentId }: {
      ticketId: string;
      content: string;
      parentId?: string;
    }) => {
      return await ticketCommentService.createComment({
        ticket_id: ticketId,
        content,
        parent_id: parentId,
      });
    },
    onSuccess: (newComment) => {
      // Invalidate and refetch comments for this ticket
      queryClient.invalidateQueries({
        queryKey: ticketCommentKeys.comments(newComment.ticket_id)
      });
      queryClient.invalidateQueries({
        queryKey: ticketCommentKeys.threaded(newComment.ticket_id)
      });
      success('Comment added successfully');
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to add comment');
    },
  });
};

/**
 * Hook for updating a comment
 */
export const useUpdateTicketComment = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      return await ticketCommentService.updateComment(commentId, content);
    },
    onSuccess: (updatedComment) => {
      // Invalidate and refetch comments for this ticket
      queryClient.invalidateQueries({
        queryKey: ticketCommentKeys.comments(updatedComment.ticket_id)
      });
      queryClient.invalidateQueries({
        queryKey: ticketCommentKeys.threaded(updatedComment.ticket_id)
      });
      queryClient.invalidateQueries({
        queryKey: ticketCommentKeys.comment(updatedComment.id)
      });
      success('Comment updated successfully');
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to update comment');
    },
  });
};

/**
 * Hook for deleting a comment
 */
export const useDeleteTicketComment = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async (commentId: string) => {
      await ticketCommentService.deleteComment(commentId);
      return commentId;
    },
    onSuccess: (deletedCommentId, commentId) => {
      // Get the comment to find the ticket ID for invalidation
      const comment = queryClient.getQueryData<TicketComment>(
        ticketCommentKeys.comment(commentId)
      );

      if (comment) {
        queryClient.invalidateQueries({
          queryKey: ticketCommentKeys.comments(comment.ticket_id)
        });
        queryClient.invalidateQueries({
          queryKey: ticketCommentKeys.threaded(comment.ticket_id)
        });
      }

      // Remove the comment from cache
      queryClient.removeQueries({
        queryKey: ticketCommentKeys.comment(commentId)
      });

      success('Comment deleted successfully');
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to delete comment');
    },
  });
};

/**
 * Hook for adding a reply to a comment
 */
export const useAddCommentReply = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async ({ parentCommentId, content }: {
      parentCommentId: string;
      content: string;
    }) => {
      return await ticketCommentService.addReply(parentCommentId, content);
    },
    onSuccess: (newReply) => {
      // Invalidate and refetch comments for this ticket
      queryClient.invalidateQueries({
        queryKey: ticketCommentKeys.comments(newReply.ticket_id)
      });
      queryClient.invalidateQueries({
        queryKey: ticketCommentKeys.threaded(newReply.ticket_id)
      });
      success('Reply added successfully');
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to add reply');
    },
  });
};