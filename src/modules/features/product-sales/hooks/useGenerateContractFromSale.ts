/**
 * useGenerateContractFromSale Hook
 * Handles generating a service contract from a product sale
 * Pre-fills contract data from the sale
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { ProductSale } from '@/types/productSales';

interface ContractPreFill {
  productSaleId: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  warrantyPeriod: number;
  warrantyStartDate: string;
  warrantyEndDate: string;
  totalValue: number;
  notes?: string;
}

export const useGenerateContractFromSale = () => {
  const navigate = useNavigate();

  const generateContract = useCallback(
    (productSale: ProductSale) => {
      try {
        if (!productSale) {
          message.error('No product sale selected');
          return;
        }

        // Prepare pre-fill data
        const preFillData: ContractPreFill = {
          productSaleId: productSale.id,
          customerId: productSale.customer_id,
          customerName: productSale.customer_name,
          productId: productSale.product_id,
          productName: productSale.product_name,
          warrantyPeriod: productSale.warranty_period || 12,
          warrantyStartDate: productSale.sale_date,
          warrantyEndDate: productSale.warranty_expiry_date || new Date(
            new Date(productSale.sale_date).getTime() + 
            (productSale.warranty_period || 12) * 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          totalValue: productSale.total_value || 0,
          notes: productSale.notes,
        };

        // Encode and navigate with query parameters
        const queryParams = new URLSearchParams({
          source: 'product_sale',
          productSaleId: preFillData.productSaleId,
          customerId: preFillData.customerId,
          customerName: preFillData.customerName,
          productId: preFillData.productId,
          productName: preFillData.productName,
          warrantyPeriod: preFillData.warrantyPeriod.toString(),
          warrantyStartDate: preFillData.warrantyStartDate,
          warrantyEndDate: preFillData.warrantyEndDate,
          totalValue: preFillData.totalValue.toString(),
          ...(preFillData.notes && { notes: preFillData.notes }),
        });

        navigate(`/app/service-contracts/create?${queryParams.toString()}`);
        message.success('Opening contract generation form with pre-filled data...');
      } catch (error) {
        console.error('Error generating contract:', error);
        message.error('Failed to generate contract. Please try again.');
      }
    },
    [navigate]
  );

  return { generateContract };
};