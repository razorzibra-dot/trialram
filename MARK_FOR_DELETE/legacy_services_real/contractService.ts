/**
 * Real Contract Service
 * Enterprise contract management service for .NET Core backend
 */

import { baseApiService } from '../api/baseApiService';
import { apiConfig } from '@/config/apiConfig';
import { 
  ContractRequest, 
  ContractResponse, 
  PaginationParams,
  FilterParams,
  ApiResponse 
} from '../api/interfaces';
import { IContractService } from '../api/apiServiceFactory';

export class RealContractService implements IContractService {

  /**
   * Get contracts with filters and pagination
   */
  async getContracts(filters?: FilterParams & PaginationParams): Promise<ContractResponse[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              value.forEach(v => params.append(key, v.toString()));
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      const response = await baseApiService.get<Record<string, unknown>>(
        `${apiConfig.endpoints.contracts.base}?${params.toString()}`
      );

      const payload = response.data;
      const list: ContractResponse[] = Array.isArray(payload)
        ? payload
        : (payload?.items ?? []);
      return list;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch contracts';
      throw new Error(message);
    }
  }

  /**
   * Get single contract by ID
   */
  async getContract(id: string): Promise<ContractResponse> {
    try {
      const response = await baseApiService.get<ContractResponse>(
        `${apiConfig.endpoints.contracts.base}/${id}`
      );

      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch contract';
      throw new Error(message);
    }
  }

  /**
   * Create new contract
   */
  async createContract(contractData: ContractRequest): Promise<ContractResponse> {
    try {
      const response = await baseApiService.post<ContractResponse>(
        apiConfig.endpoints.contracts.base,
        contractData
      );

      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create contract';
      throw new Error(message);
    }
  }

  /**
   * Update existing contract
   */
  async updateContract(id: string, updates: Partial<ContractRequest>): Promise<ContractResponse> {
    try {
      const response = await baseApiService.put<ContractResponse>(
        `${apiConfig.endpoints.contracts.base}/${id}`,
        updates
      );

      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update contract';
      throw new Error(message);
    }
  }

  /**
   * Delete contract
   */
  async deleteContract(id: string): Promise<void> {
    try {
      await baseApiService.delete(
        `${apiConfig.endpoints.contracts.base}/${id}`
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete contract';
      throw new Error(message);
    }
  }

  /**
   * Get contract types
   */
  async getContractTypes(): Promise<Array<{ id: string; name: string; description?: string }>> {
    try {
      const response = await baseApiService.get<Array<{ id: string; name: string; description?: string }>>(
        `${apiConfig.endpoints.contracts.base}/types`
      );

      return response.data;
    } catch (error: unknown) {
      // Fallback to default types
      return [
        { id: 'service', name: 'Service Contract' },
        { id: 'product', name: 'Product Contract' },
        { id: 'maintenance', name: 'Maintenance Contract' },
        { id: 'support', name: 'Support Contract' },
      ];
    }
  }

  /**
   * Get contract analytics
   */
  async getContractAnalytics(): Promise<{
    totalValue: number;
    activeContracts: number;
    expiringContracts: number;
    renewalRate: number;
    averageContractValue: number;
    byType: Array<{ type: string; count: number; value: number }>;
    byStatus: Array<{ status: string; count: number; value: number }>;
    monthlyRevenue: Array<{ month: string; revenue: number }>;
  }> {
    try {
      const response = await baseApiService.get<{
        totalValue: number;
        activeContracts: number;
        expiringContracts: number;
        renewalRate: number;
        averageContractValue: number;
        byType: Array<{ type: string; count: number; value: number }>;
        byStatus: Array<{ status: string; count: number; value: number }>;
        monthlyRevenue: Array<{ month: string; revenue: number }>;
      }>(apiConfig.endpoints.contracts.analytics);

      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch contract analytics';
      throw new Error(message);
    }
  }

  /**
   * Get contract templates
   */
  async getContractTemplates(): Promise<Array<{
    id: string;
    name: string;
    type: string;
    content: string;
    variables: Array<{ name: string; type: string; required: boolean }>;
  }>> {
    try {
      const response = await baseApiService.get<Array<{
        id: string;
        name: string;
        type: string;
        content: string;
        variables: Array<{ name: string; type: string; required: boolean }>;
      }>>(apiConfig.endpoints.contracts.templates);

      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch contract templates';
      throw new Error(message);
    }
  }

  /**
   * Create contract from template
   */
  async createContractFromTemplate(templateId: string, variables: Record<string, unknown>): Promise<ContractResponse> {
    try {
      const response = await baseApiService.post<ContractResponse>(
        `${apiConfig.endpoints.contracts.templates}/${templateId}/create`,
        { variables }
      );

      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create contract from template';
      throw new Error(message);
    }
  }

  /**
   * Get contracts expiring soon
   */
  async getExpiringContracts(days: number = 30): Promise<ContractResponse[]> {
    try {
      const response = await baseApiService.get<ContractResponse[]>(
        `${apiConfig.endpoints.contracts.base}/expiring?days=${days}`
      );

      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch expiring contracts';
      throw new Error(message);
    }
  }

  /**
   * Get renewal opportunities
   */
  async getRenewalOpportunities(): Promise<Array<{
    contract: ContractResponse;
    renewalProbability: number;
    recommendedAction: string;
    estimatedValue: number;
  }>> {
    try {
      const response = await baseApiService.get<Array<{
        contract: ContractResponse;
        renewalProbability: number;
        recommendedAction: string;
        estimatedValue: number;
      }>>(apiConfig.endpoints.contracts.renewals);

      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch renewal opportunities';
      throw new Error(message);
    }
  }

  /**
   * Renew contract
   */
  async renewContract(contractId: string, renewalData: {
    newEndDate: string;
    newValue?: number;
    terms?: string;
  }): Promise<ContractResponse> {
    try {
      const response = await baseApiService.post<ContractResponse>(
        `${apiConfig.endpoints.contracts.base}/${contractId}/renew`,
        renewalData
      );

      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to renew contract';
      throw new Error(message);
    }
  }

  /**
   * Terminate contract
   */
  async terminateContract(contractId: string, reason: string): Promise<ContractResponse> {
    try {
      const response = await baseApiService.post<ContractResponse>(
        `${apiConfig.endpoints.contracts.base}/${contractId}/terminate`,
        { reason }
      );

      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to terminate contract';
      throw new Error(message);
    }
  }

  /**
   * Approve contract
   */
  async approveContract(contractId: string, stage: string, comments?: string): Promise<void> {
    await baseApiService.post(
      `${apiConfig.endpoints.contracts.base}/${contractId}/approve`,
      { stage, comments }
    );
  }

  /**
   * Toggle auto-renewal
   */
  async toggleAutoRenewal(contractId: string, enable: boolean, months?: number): Promise<void> {
    const qs = new URLSearchParams({ enable: String(enable) });
    if (months) qs.append('months', String(months));
    await baseApiService.post(
      `${apiConfig.endpoints.contracts.base}/${contractId}/auto-renewal?${qs.toString()}`
    );
  }

  /**
   * Upload contract document
   */
  async uploadContractDocument(contractId: string, file: File): Promise<{
    id: string;
    filename: string;
    url: string;
  }> {
    try {
      const response = await baseApiService.uploadFile<{
        id: string;
        filename: string;
        url: string;
      }>(`${apiConfig.endpoints.contracts.base}/${contractId}/documents`, file);

      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload contract document';
      throw new Error(message);
    }
  }

  /**
   * Generate contract PDF
   */
  async generateContractPDF(contractId: string): Promise<string> {
    try {
      const response = await baseApiService.get(
        `${apiConfig.endpoints.contracts.base}/${contractId}/pdf`,
        { responseType: 'blob' } as Record<string, unknown>
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to generate contract PDF';
      throw new Error(message);
    }
  }

  /**
   * Get contract history
   */
  async getContractHistory(contractId: string): Promise<Array<{
    id: string;
    action: string;
    description: string;
    user: { id: string; name: string };
    createdAt: string;
    changes?: Record<string, unknown>;
  }>> {
    try {
      const response = await baseApiService.get<Array<{
        id: string;
        action: string;
        description: string;
        user: { id: string; name: string };
        createdAt: string;
        changes?: Record<string, unknown>;
      }>>(`${apiConfig.endpoints.contracts.base}/${contractId}/history`);

      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch contract history';
      throw new Error(message);
    }
  }

  /**
   * Export contracts
   */
  async exportContracts(format: 'csv' | 'json' | 'xlsx' = 'csv', filters?: FilterParams): Promise<string> {
    try {
      const params = new URLSearchParams({ format });
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await baseApiService.get(
        `${apiConfig.endpoints.contracts.base}/export?${params.toString()}`,
        { responseType: 'blob' } as Record<string, unknown>
      );

      if (format === 'xlsx') {
        const blob = new Blob([response.data]);
        return URL.createObjectURL(blob);
      } else {
        return await response.data.text();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to export contracts';
      throw new Error(message);
    }
  }
}
