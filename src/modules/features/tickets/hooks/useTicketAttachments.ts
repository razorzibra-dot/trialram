/**
 * Ticket Attachments Hooks
 * React hooks for ticket attachment operations using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createEntityHooks } from '@/hooks/factories/createEntityHooks';
import { TicketAttachment } from '@/types/crm';
import { ticketAttachmentService } from '@/services/serviceFactory';
import { useNotification } from '@/hooks/useNotification';

// Query Keys
export const ticketAttachmentKeys = {
  all: ['ticket-attachments'] as const,
  attachments: (ticketId: string) => [...ticketAttachmentKeys.all, 'ticket', ticketId] as const,
  attachment: (attachmentId: string) => [...ticketAttachmentKeys.all, 'attachment', attachmentId] as const,
};

// Factory-based CRUD keys (distinct namespace)
const ticketAttachmentCrudKeys = {
  all: ['ticket-attachments', 'crud'] as const,
  list: (filters: unknown) => [...ticketAttachmentCrudKeys.all, 'list', filters] as const,
  detail: (id: string) => [...ticketAttachmentCrudKeys.all, 'detail', id] as const,
};

// Adapter to fit GenericCrudService contract for factory hooks
const ticketAttachmentCrudAdapter = {
  async getAll(filters: Record<string, any> = {}) {
    const ticketId = filters.ticketId || filters?.customFilters?.ticketId;
    if (!ticketId) {
      return { data: [], total: 0 };
    }
    const data = await ticketAttachmentService.getAttachments(ticketId, filters);
    return { data, total: data.length };
  },
  async getById(id: string) {
    const att = await ticketAttachmentService.getAttachment(id);
    if (!att) throw new Error('Attachment not found');
    return att;
  },
  async create(data: Partial<TicketAttachment> & { file?: File; filename?: string }) {
    if (!data.ticket_id || !data.file) {
      throw new Error('ticket_id and file are required');
    }
    return ticketAttachmentService.uploadAttachment({
      ticket_id: data.ticket_id,
      file: data.file,
      filename: data.filename,
    });
  },
  async update() {
    // Attachments are immutable aside from replacement; use specialized hooks for replace if needed
    throw new Error('Update not supported for attachments');
  },
  async delete(id: string) {
    await ticketAttachmentService.deleteAttachment(id);
  },
};

// Factory-generated CRUD hooks (in addition to specialized ones)
const attachmentCrudHooks = createEntityHooks<TicketAttachment>({
  entityName: 'Ticket Attachment',
  service: ticketAttachmentCrudAdapter as any,
  queryKeys: {
    all: ticketAttachmentCrudKeys.all as unknown as string[],
    list: (filters: unknown) => ticketAttachmentCrudKeys.list(filters) as unknown as string[],
    detail: (id: string) => ticketAttachmentCrudKeys.detail(id) as unknown as string[],
  },
});

export const useTicketAttachmentsCrud = attachmentCrudHooks.useEntities;
export const useTicketAttachmentCrud = attachmentCrudHooks.useEntity;
export const useCreateTicketAttachmentCrud = attachmentCrudHooks.useCreateEntity;
export const useDeleteTicketAttachmentCrud = attachmentCrudHooks.useDeleteEntity;

/**
 * Hook for fetching attachments for a specific ticket
 */
export const useTicketAttachments = (ticketId: string) => {
  return useQuery({
    queryKey: ticketAttachmentKeys.attachments(ticketId),
    queryFn: async () => {
      return await ticketAttachmentService.getAttachments(ticketId);
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
      return await ticketAttachmentService.getAttachment(attachmentId);
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
      return await ticketAttachmentService.uploadAttachment({ ticket_id: ticketId, file });
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
      await ticketAttachmentService.deleteAttachment(attachmentId);
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
      return await ticketAttachmentService.downloadAttachment(attachmentId);
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to download attachment');
    },
  });
};

/**
 * Hook for attachment statistics for a ticket
 */
export const useTicketAttachmentStats = (ticketId: string) => {
  return useQuery({
    queryKey: [...ticketAttachmentKeys.attachments(ticketId), 'stats'],
    queryFn: async () => {
      return await ticketAttachmentService.getAttachmentStats(ticketId);
    },
    enabled: !!ticketId,
  });
};