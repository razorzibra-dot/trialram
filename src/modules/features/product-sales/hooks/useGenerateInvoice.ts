/**
 * useGenerateInvoice Hook
 * Handles invoice generation mutation for product sales
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductSale, ProductSaleItem } from '@/types/productSales';
import { Customer } from '@/types/crm';
import { Product } from '@/types/masters';
import { invoiceService } from '../services/invoiceService';
import { useNotification } from '@/hooks/useNotification';

interface GenerateInvoiceParams {
  sale: ProductSale;
  saleItems: ProductSaleItem[];
  customers: Customer[];
  products: Product[];
  taxRate?: number;
  paymentTerms?: string;
  notes?: string;
  currency?: string;
}

export function useGenerateInvoice() {
  const queryClient = useQueryClient();
  const notification = useNotification();

  const mutation = useMutation({
    mutationFn: async (params: GenerateInvoiceParams) => {
      const { sale, saleItems, customers, products, ...options } = params;
      
      // Validate parameters
      if (!sale || !saleItems || saleItems.length === 0) {
        throw new Error('Invalid sale or sale items');
      }

      // Generate invoice with enriched data lookup
      const invoice = await invoiceService.generateInvoice(
        sale,
        saleItems,
        customers,
        products,
        options
      );

      return invoice;
    },
    onSuccess: (invoice) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['productSales'] });
      queryClient.invalidateQueries({ queryKey: ['productSale', invoice.sale_id] });

      notification.success({
        title: 'Invoice Generated',
        description: `Invoice ${invoice.invoice_number} has been generated successfully`,
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to generate invoice';
      
      notification.error({
        title: 'Invoice Generation Failed',
        description: errorMessage,
      });
    },
  });

  return mutation;
}