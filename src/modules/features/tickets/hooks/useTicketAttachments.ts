/**
 * Ticket Attachments Hooks
 * React hooks for ticket attachment operations using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TicketAttachment } from '@/types/crm';
import { ticketService } from '@/services/serviceFactory';
import { useNotification } from '@/hooks/useNotification';

// Query Keys
export const ticketAttachmentKeys = {
  all: ['ticket-attachments'] as const,
  attachments: (ticketId: string) => [...ticketAttachmentKeys.all, 'ticket', ticketId] as const,
  attachment: (attachmentId: string) => [...ticketAttachmentKeys.all, 'attachment', attachmentId] as const,
};

/**
 * Hook for fetching attachments for a specific ticket
 */
export const useTicketAttachments = (ticketId: string) => {
  return useQuery({
    queryKey: ticketAttachmentKeys.attachments(ticketId),
    queryFn: async () => {
      return await ticketService.getTicketAttachments(ticketId);
    },
    enabled: !!ticketId,
  });
};

/**
 * Hook for fetching a single attachment
 */
export const useTicketAttachment = (attachmentId: string) => {
  return useQuery({
    queryKey: ticketAttachmentKeys.attachment(attachmentId),
    queryFn: async () => {
      return await ticketService.getTicketAttachment(attachmentId);
    },
    enabled: !!attachmentId,
  });
};

/**
 * Hook for uploading a new attachment
 */
export const useUploadTicketAttachment = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async ({ ticketId, file }: { ticketId: string; file: File }) => {
      return await ticketService.uploadTicketAttachment(ticketId, file);
    },
    onSuccess: (newAttachment) => {
      // Invalidate and refetch attachments for this ticket
      queryClient.invalidateQueries({
        queryKey: ticketAttachmentKeys.attachments(newAttachment.ticket_id)
      });
      success('Attachment uploaded successfully');
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to upload attachment');
    },
  });
};

/**
 * Hook for deleting an attachment
 */
export const useDeleteTicketAttachment = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async (attachmentId: string) => {
      await ticketService.deleteTicketAttachment(attachmentId);
      return attachmentId;
    },
    onSuccess: (deletedAttachmentId, attachmentId) => {
      // Get the attachment to find the ticket ID for invalidation
      const attachment = queryClient.getQueryData<TicketAttachment>(
        ticketAttachmentKeys.attachment(attachmentId)
      );

      if (attachment) {
        queryClient.invalidateQueries({
          queryKey: ticketAttachmentKeys.attachments(attachment.ticket_id)
        });
      }

      // Remove the attachment from cache
      queryClient.removeQueries({
        queryKey: ticketAttachmentKeys.attachment(attachmentId)
      });

      success('Attachment deleted successfully');
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to delete attachment');
    },
  });
};

/**
 * Hook for downloading an attachment
 */
export const useDownloadTicketAttachment = () => {
  const { error } = useNotification();

  return useMutation({
    mutationFn: async (attachmentId: string) => {
      return await ticketService.downloadTicketAttachment(attachmentId);
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to download attachment');
    },
  });
};