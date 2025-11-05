/**
 * Invoice Email Hook
 * Manages invoice email sending mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductSale, ProductSaleItem } from '@/types/productSales';
import { Invoice, invoiceService } from '../services/invoiceService';
import { invoiceEmailService, InvoiceEmailConfig, InvoiceEmailResult } from '../services/invoiceEmailService';
import { uiNotificationService as factoryUINotificationService } from '@/services/serviceFactory';

interface SendInvoiceEmailParams {
  invoice: Invoice;
  sale: ProductSale;
  items: ProductSaleItem[];
  config: InvoiceEmailConfig;
  includeAttachment?: boolean;
  pdfBlob?: Blob;
}

/**
 * Hook for sending invoice emails
 * Handles email sending with optional PDF attachment and notifications
 */
export function useInvoiceEmail() {
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: async (params: SendInvoiceEmailParams): Promise<InvoiceEmailResult> => {
      const { invoice, sale, items, config, includeAttachment, pdfBlob } = params;

      // Send email with or without attachment
      let result: InvoiceEmailResult;

      if (includeAttachment && pdfBlob) {
        result = await invoiceEmailService.sendInvoiceWithAttachment(
          invoice,
          sale,
          items,
          pdfBlob,
          config
        );
      } else {
        result = await invoiceEmailService.sendInvoiceEmail(invoice, sale, items, config);
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to send invoice email');
      }

      return result;
    },
    onSuccess: (result, params) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ['productSales']
      });

      queryClient.invalidateQueries({
        queryKey: ['productSale', params.sale.id]
      });

      // Show success notification
      factoryUINotificationService.success({
        title: 'Invoice Sent Successfully',
        description: `Invoice ${params.invoice.invoice_number} has been sent to ${params.config.to}${
          params.config.cc && params.config.cc.length > 0
            ? ` (CC: ${params.config.cc.join(', ')})`
            : ''
        }`
      });
    },
    onError: (error) => {
      // Show error notification
      factoryUINotificationService.error({
        title: 'Failed to Send Invoice',
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  });

  const scheduleMutation = useMutation({
    mutationFn: async (
      params: SendInvoiceEmailParams & { scheduledFor: Date }
    ): Promise<InvoiceEmailResult> => {
      const { invoice, sale, items, config, scheduledFor } = params;

      const result = await invoiceEmailService.scheduleInvoiceEmail(
        invoice,
        sale,
        items,
        { ...config, scheduledFor }
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to schedule invoice email');
      }

      return result;
    },
    onSuccess: (result, params) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ['productSales']
      });

      queryClient.invalidateQueries({
        queryKey: ['productSale', params.sale.id]
      });

      // Show success notification
      factoryUINotificationService.success({
        title: 'Invoice Scheduled',
        description: `Invoice ${params.invoice.invoice_number} has been scheduled to send on ${
          params.scheduledFor.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        }`
      });
    },
    onError: (error) => {
      // Show error notification
      factoryUINotificationService.error({
        title: 'Failed to Schedule Invoice',
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  });

  return {
    // Send email mutation
    sendEmail: sendMutation.mutate,
    sendEmailAsync: sendMutation.mutateAsync,
    isSendingEmail: sendMutation.isPending,
    sendEmailError: sendMutation.error,

    // Schedule email mutation
    scheduleEmail: scheduleMutation.mutate,
    scheduleEmailAsync: scheduleMutation.mutateAsync,
    isSchedulingEmail: scheduleMutation.isPending,
    scheduleEmailError: scheduleMutation.error,

    // Reset functions
    resetSendError: () => {
      sendMutation.reset();
    },
    resetScheduleError: () => {
      scheduleMutation.reset();
    },
    resetAll: () => {
      sendMutation.reset();
      scheduleMutation.reset();
    }
  };
}

export type UseInvoiceEmailReturn = ReturnType<typeof useInvoiceEmail>;