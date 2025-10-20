/**
 * Service Contract Service - Supabase Implementation
 * All queries include tenant_id for multi-tenant isolation
 */

import { supabaseClient } from './client';
import { multiTenantService } from './multiTenantService';
import {
  addTenantFilter,
  applyPagination,
  buildServiceContractQuery,
  handleSupabaseError,
} from './queryBuilders';
import {
  ServiceContract,
  ServiceContractFormData,
  ServiceContractFilters,
  ServiceContractsResponse,
  ContractTemplate,
  ContractGenerationData,
} from '@/types/productSales';

class SupabaseServiceContractService {
  private baseUrl = 'https://api.supabase.io';

  /**
   * Get all service contracts with filtering and pagination
   */
  async getServiceContracts(
    filters: ServiceContractFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<ServiceContractsResponse> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();

      // Build query
      let query = supabaseClient
        .from('service_contracts')
        .select('*', { count: 'exact' });

      // Add tenant filter
      query = addTenantFilter(query, tenantId) as any;

      // Apply custom filters
      query = buildServiceContractQuery(query as any, {
        status: filters.status,
        customerName: filters.search,
        serviceLevel: filters.service_level,
        expiryFrom: filters.expiry_from,
        expiryTo: filters.expiry_to,
      }) as any;

      // Apply pagination
      query = applyPagination(query as any, page, limit) as any;

      // Sort by created_at descending
      query = query.order('created_at', { ascending: false });

      // Execute query
      const { data, count, error } = await query;

      if (error) {
        throw new Error(handleSupabaseError(error));
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: data?.map(row => this.mapToServiceContract(row)) || [],
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      console.error('Error fetching service contracts:', error);
      throw error;
    }
  }

  /**
   * Get single service contract by ID
   */
  async getServiceContractById(id: string): Promise<ServiceContract> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();

      const { data, error } = await supabaseClient
        .from('service_contracts')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

      if (error) {
        throw new Error('Service contract not found');
      }

      if (!data) {
        throw new Error('Service contract not found');
      }

      return this.mapToServiceContract(data);
    } catch (error) {
      console.error('Error fetching service contract:', error);
      throw error;
    }
  }

  /**
   * Get service contract by product sale ID
   */
  async getServiceContractByProductSaleId(productSaleId: string): Promise<ServiceContract | null> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();

      const { data, error } = await supabaseClient
        .from('service_contracts')
        .select('*')
        .eq('product_sale_id', productSaleId)
        .eq('tenant_id', tenantId)
        .single();

      if (error && error.code === 'PGRST116') { // No rows found
        return null;
      }

      if (error) {
        throw error;
      }

      return data ? this.mapToServiceContract(data) : null;
    } catch (error) {
      console.error('Error fetching service contract by product sale ID:', error);
      return null;
    }
  }

  /**
   * Create new service contract
   */
  async createServiceContract(
    productSaleId: string,
    productSale: Record<string, unknown>,
    data: Partial<ServiceContractFormData> = {}
  ): Promise<ServiceContract> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();
      const userId = multiTenantService.getCurrentUserId();

      // Generate contract number
      const { count } = await supabaseClient
        .from('service_contracts')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      const contractNumber = `SC-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, '0')}`;

      // Calculate dates
      const startDate = new Date(productSale.delivery_date as string);
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

      const insertData = {
        product_sale_id: productSaleId,
        contract_number: contractNumber,
        customer_id: productSale.customer_id,
        customer_name: productSale.customer_name,
        product_id: productSale.product_id,
        product_name: productSale.product_name,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'active',
        contract_value: productSale.total_cost,
        annual_value: productSale.total_cost,
        terms: data.terms || 'Standard service contract terms and conditions apply.',
        warranty_period_months: 12,
        service_level: data.service_level || 'standard',
        auto_renewal: data.auto_renewal ?? true,
        renewal_notice_period_days: data.renewal_notice_period || 60,
        tenant_id: tenantId,
        created_by: userId,
      };

      const { data: newContract, error } = await supabaseClient
        .from('service_contracts')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        throw new Error(handleSupabaseError(error));
      }

      if (!newContract) {
        throw new Error('Failed to create service contract');
      }

      return this.mapToServiceContract(newContract);
    } catch (error) {
      console.error('Error creating service contract:', error);
      throw error;
    }
  }

  /**
   * Update existing service contract
   */
  async updateServiceContract(
    id: string,
    data: Partial<ServiceContractFormData>
  ): Promise<ServiceContract> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();

      const updateData: Record<string, unknown> = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedContract, error } = await supabaseClient
        .from('service_contracts')
        .update(updateData)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) {
        throw new Error(handleSupabaseError(error));
      }

      if (!updatedContract) {
        throw new Error('Service contract not found');
      }

      return this.mapToServiceContract(updatedContract);
    } catch (error) {
      console.error('Error updating service contract:', error);
      throw error;
    }
  }

  /**
   * Renew service contract
   */
  async renewServiceContract(
    id: string,
    renewalData: Partial<ServiceContractFormData>
  ): Promise<ServiceContract> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();
      const userId = multiTenantService.getCurrentUserId();

      // Get existing contract
      const existingContract = await this.getServiceContractById(id);

      // Generate new contract number
      const { count } = await supabaseClient
        .from('service_contracts')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      const contractNumber = `SC-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, '0')}`;

      // Calculate dates
      const startDate = new Date(existingContract.end_date);
      startDate.setDate(startDate.getDate() + 1); // Start day after previous contract ends

      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

      // Create new contract
      const newContractData = {
        ...existingContract,
        id: undefined, // Let Supabase generate new ID
        product_sale_id: existingContract.product_sale_id,
        contract_number: contractNumber,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'active', // New contract is active, original will be marked as renewed
        ...renewalData,
        tenant_id: tenantId,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: newContract, error: insertError } = await supabaseClient
        .from('service_contracts')
        .insert([newContractData])
        .select()
        .single();

      if (insertError) {
        throw new Error(handleSupabaseError(insertError));
      }

      // Update original contract status to 'renewed'
      await supabaseClient
        .from('service_contracts')
        .update({
          status: 'renewed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (!newContract) {
        throw new Error('Failed to renew service contract');
      }

      return this.mapToServiceContract(newContract);
    } catch (error) {
      console.error('Error renewing service contract:', error);
      throw error;
    }
  }

  /**
   * Cancel service contract
   */
  async cancelServiceContract(id: string, reason: string): Promise<ServiceContract> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();

      // Get existing contract to preserve terms
      const existing = await this.getServiceContractById(id);

      const cancellationNote = `\n\nContract cancelled on ${new Date().toISOString().split('T')[0]}. Reason: ${reason}`;

      const { data: updatedContract, error } = await supabaseClient
        .from('service_contracts')
        .update({
          status: 'cancelled',
          terms: existing.terms + cancellationNote,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) {
        throw new Error(handleSupabaseError(error));
      }

      if (!updatedContract) {
        throw new Error('Service contract not found');
      }

      return this.mapToServiceContract(updatedContract);
    } catch (error) {
      console.error('Error cancelling service contract:', error);
      throw error;
    }
  }

  /**
   * Get contract templates
   */
  async getContractTemplates(): Promise<ContractTemplate[]> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();

      const { data, error } = await supabaseClient
        .from('contract_templates')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (error) {
        throw new Error(handleSupabaseError(error));
      }

      return data?.map(template => ({
        id: template.id,
        name: template.name,
        content: template.content,
        variables: this.extractTemplateVariables(template.content),
        is_default: false,
        created_at: template.created_at,
        updated_at: template.updated_at,
      })) || [];
    } catch (error) {
      console.error('Error fetching contract templates:', error);
      return [];
    }
  }

  /**
   * Generate contract PDF (placeholder for real implementation)
   */
  async generateContractPDF(contract: ServiceContract): Promise<string> {
    try {
      // This is a placeholder. In production, you would:
      // 1. Use a library like jsPDF or PDFKit to generate the PDF
      // 2. Upload to Supabase Storage
      // 3. Return the signed URL

      // For now, we'll just return a placeholder URL
      const pdfUrl = `${this.baseUrl}/storage/v1/object/public/contracts/${contract.id}.pdf`;
      
      // Update contract with PDF URL
      const tenantId = multiTenantService.getCurrentTenantId();
      await supabaseClient
        .from('service_contracts')
        .update({ pdf_url: pdfUrl })
        .eq('id', contract.id)
        .eq('tenant_id', tenantId);

      return pdfUrl;
    } catch (error) {
      console.error('Error generating contract PDF:', error);
      throw error;
    }
  }

  /**
   * Get contracts expiring soon
   */
  async getExpiringContracts(days: number = 30): Promise<ServiceContract[]> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();

      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const { data, error } = await supabaseClient
        .from('service_contracts')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .gte('end_date', today)
        .lte('end_date', futureDateStr)
        .order('end_date', { ascending: true });

      if (error) {
        throw new Error(handleSupabaseError(error));
      }

      return data?.map(row => this.mapToServiceContract(row)) || [];
    } catch (error) {
      console.error('Error fetching expiring contracts:', error);
      return [];
    }
  }

  /**
   * Get contract statistics
   */
  async getContractStatistics() {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();

      // Get status counts
      const { data: statusData, error: statusError } = await supabaseClient
        .from('service_contracts')
        .select('status')
        .eq('tenant_id', tenantId);

      if (statusError) throw statusError;

      const statusCounts = {
        active: statusData?.filter(c => c.status === 'active').length || 0,
        expired: statusData?.filter(c => c.status === 'expired').length || 0,
        renewed: statusData?.filter(c => c.status === 'renewed').length || 0,
        cancelled: statusData?.filter(c => c.status === 'cancelled').length || 0,
      };

      // Get value total
      const { data: valueData, error: valueError } = await supabaseClient
        .from('service_contracts')
        .select('contract_value')
        .eq('tenant_id', tenantId)
        .eq('status', 'active');

      if (valueError) throw valueError;

      const totalValue = (valueData || []).reduce(
        (sum, c) => sum + (parseFloat(c.contract_value) || 0),
        0
      );

      return {
        ...statusCounts,
        totalValue,
      };
    } catch (error) {
      console.error('Error fetching contract statistics:', error);
      return {
        active: 0,
        expired: 0,
        renewed: 0,
        cancelled: 0,
        totalValue: 0,
      };
    }
  }

  /**
   * Map database row to ServiceContract type
   */
  private mapToServiceContract(row: any): ServiceContract {
    return {
      id: row.id,
      product_sale_id: row.product_sale_id,
      contract_number: row.contract_number,
      customer_id: row.customer_id,
      customer_name: row.customer_name,
      product_id: row.product_id,
      product_name: row.product_name,
      start_date: row.start_date,
      end_date: row.end_date,
      status: row.status,
      contract_value: row.contract_value,
      annual_value: row.annual_value,
      terms: row.terms,
      warranty_period: row.warranty_period_months,
      service_level: row.service_level,
      auto_renewal: row.auto_renewal,
      renewal_notice_period: row.renewal_notice_period_days,
      pdf_url: row.pdf_url,
      tenant_id: row.tenant_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by: row.created_by,
    };
  }

  /**
   * Extract template variables from content
   */
  private extractTemplateVariables(content: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = content.match(regex);
    return matches
      ? matches.map(m => m.replace(/\{\{|\}\}/g, ''))
      : [];
  }
}

export { SupabaseServiceContractService };
export const supabaseServiceContractService = new SupabaseServiceContractService();