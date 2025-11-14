/**
 * Company Service
 * Business logic for company master data management
 */

import { BaseService } from '@/modules/core/services/BaseService';
import { PaginatedResponse } from '@/modules/core/types';
import { Company, CompanyFormData, CompanyFilters } from '@/types/masters';
import { companyService as factoryCompanyService } from '@/services/serviceFactory';

export interface CompanyStats {
  total: number;
  byStatus: Record<string, number>;
  bySize: Record<string, number>;
  byIndustry: Record<string, number>;
  activeCompanies: number;
  inactiveCompanies: number;
  prospectCompanies: number;
  recentlyAdded: number;
}

/**
 * Company Service Interface
 * All company operations must implement this interface
 */
export interface ICompanyService {
  getCompanies(filters?: CompanyFilters): Promise<PaginatedResponse<Company>>;
  getCompany(id: string): Promise<Company>;
  createCompany(data: CompanyFormData): Promise<Company>;
  updateCompany(id: string, data: Partial<CompanyFormData>): Promise<Company>;
  deleteCompany(id: string): Promise<void>;
  updateCompanyStatus(id: string, status: string): Promise<Company>;
  bulkUpdateCompanies(ids: string[], updates: Partial<CompanyFormData>): Promise<Company[]>;
  bulkDeleteCompanies(ids: string[]): Promise<void>;
  getCompanyStats(): Promise<CompanyStats>;
  searchCompanies(query: string): Promise<Company[]>;
  getCompanyStatuses(): Promise<string[]>;
  getCompanySizes(): Promise<string[]>;
  getIndustries(): Promise<string[]>;
  exportCompanies(format?: 'csv' | 'json'): Promise<string>;
  importCompanies(csv: string): Promise<{ success: number; errors: string[] }>;
}

export class CompanyService extends BaseService implements ICompanyService {
  /**
   * Get companies with filtering and pagination
   */
  async getCompanies(filters: CompanyFilters = {}): Promise<PaginatedResponse<Company>> {
    try {
      // Delegate to factory service
      const companies = await factoryCompanyService.getCompanies(filters);
      
      // Transform to paginated response format if needed
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const total = Array.isArray(companies) ? companies.length : companies.total || 0;
      const data = Array.isArray(companies) ? companies : companies.data || [];
      
      return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      // Graceful error handling for tenant context
      if (error instanceof Error && error.message.includes('Tenant context not initialized')) {
        return {
          data: [],
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0,
        };
      }
      this.handleError('Failed to fetch companies', error);
      throw error;
    }
  }

  /**
   * Get a single company by ID
   */
  async getCompany(id: string): Promise<Company> {
    try {
      const company = await factoryCompanyService.getCompany(id);
      if (!company) {
        throw new Error(`Company ${id} not found`);
      }
      return company;
    } catch (error) {
      this.handleError(`Failed to fetch company ${id}`, error);
      throw error;
    }
  }

  /**
   * Create a new company
   */
  async createCompany(data: CompanyFormData): Promise<Company> {
    try {
      return await factoryCompanyService.createCompany(data);
    } catch (error) {
      this.handleError('Failed to create company', error);
      throw error;
    }
  }

  /**
   * Update an existing company
   */
  async updateCompany(id: string, data: Partial<CompanyFormData>): Promise<Company> {
    try {
      return await factoryCompanyService.updateCompany(id, data);
    } catch (error) {
      this.handleError(`Failed to update company ${id}`, error);
      throw error;
    }
  }

  /**
   * Delete a company
   */
  async deleteCompany(id: string): Promise<void> {
    try {
      await factoryCompanyService.deleteCompany(id);
    } catch (error) {
      this.handleError(`Failed to delete company ${id}`, error);
      throw error;
    }
  }

  /**
   * Update company status
   */
  async updateCompanyStatus(id: string, status: string): Promise<Company> {
    try {
      const typedStatus = status as 'active' | 'inactive' | 'prospect';
      return await this.updateCompany(id, { status: typedStatus });
    } catch (error) {
      this.handleError(`Failed to update company status for ${id}`, error);
      throw error;
    }
  }

  /**
   * Bulk update companies
   */
  async bulkUpdateCompanies(ids: string[], updates: Partial<CompanyFormData>): Promise<Company[]> {
    try {
      const promises = ids.map(id => this.updateCompany(id, updates));
      return await Promise.all(promises);
    } catch (error) {
      this.handleError('Failed to bulk update companies', error);
      throw error;
    }
  }

  /**
   * Bulk delete companies
   */
  async bulkDeleteCompanies(ids: string[]): Promise<void> {
    try {
      const promises = ids.map(id => this.deleteCompany(id));
      await Promise.all(promises);
    } catch (error) {
      this.handleError('Failed to bulk delete companies', error);
      throw error;
    }
  }

  /**
   * Get company statistics
   */
  async getCompanyStats(): Promise<CompanyStats> {
    try {
      // Get all companies for stats calculation
      const response = await this.getCompanies({ pageSize: 1000 });
      const companies = response.data;

      const stats: CompanyStats = {
        total: companies.length,
        byStatus: {},
        bySize: {},
        byIndustry: {},
        activeCompanies: 0,
        inactiveCompanies: 0,
        prospectCompanies: 0,
        recentlyAdded: 0,
      };

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Calculate statistics
      companies.forEach(company => {
        // Status stats
        const status = company.status || 'active';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

        // Size stats
        const size = company.size || 'small';
        stats.bySize[size] = (stats.bySize[size] || 0) + 1;

        // Industry stats
        const industry = company.industry || 'Other';
        stats.byIndustry[industry] = (stats.byIndustry[industry] || 0) + 1;

        // Status counts
        if (status === 'active') stats.activeCompanies++;
        else if (status === 'inactive') stats.inactiveCompanies++;
        else if (status === 'prospect') stats.prospectCompanies++;

        // Recently added
        if (company.created_at && new Date(company.created_at) > oneWeekAgo) {
          stats.recentlyAdded++;
        }
      });

      return stats;
    } catch (error) {
      this.handleError('Failed to fetch company statistics', error);
      throw error;
    }
  }

  /**
   * Search companies
   */
  async searchCompanies(query: string): Promise<Company[]> {
    try {
      if (factoryCompanyService.searchCompanies) {
        return await factoryCompanyService.searchCompanies(query);
      }
      // Fallback to filter-based search
      const response = await this.getCompanies({ search: query });
      return response.data;
    } catch (error) {
      this.handleError('Failed to search companies', error);
      throw error;
    }
  }

  /**
   * Get company statuses
   */
  async getCompanyStatuses(): Promise<string[]> {
    return ['active', 'inactive', 'prospect'];
  }

  /**
   * Get company sizes
   */
  async getCompanySizes(): Promise<string[]> {
    return ['startup', 'small', 'medium', 'large', 'enterprise'];
  }

  /**
   * Get industries
   */
  async getIndustries(): Promise<string[]> {
    return [
      'Technology',
      'Healthcare',
      'Finance',
      'Manufacturing',
      'Retail',
      'Education',
      'Real Estate',
      'Construction',
      'Transportation',
      'Energy',
      'Media',
      'Government',
      'Non-profit',
      'Other'
    ];
  }

  /**
   * Export companies
   */
  async exportCompanies(format: 'csv' | 'json' = 'csv'): Promise<string> {
    try {
      const response = await this.getCompanies({ pageSize: 10000 });
      const companies = response.data;

      if (format === 'json') {
        return JSON.stringify(companies, null, 2);
      }

      // CSV format
      const headers = ['ID', 'Name', 'Industry', 'Size', 'Status', 'Phone', 'Email', 'Website', 'Address'];
      const rows = companies.map(company => [
        company.id,
        company.name,
        company.industry || '',
        company.size || '',
        company.status || '',
        company.phone || '',
        company.email || '',
        company.website || '',
        company.address || ''
      ]);

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\r\n');

      return csv;
    } catch (error) {
      this.handleError('Failed to export companies', error);
      throw error;
    }
  }

  /**
   * Import companies from CSV
   */
  async importCompanies(csv: string): Promise<{ success: number; errors: string[] }> {
    try {
      const lines = csv.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const errors: string[] = [];
      let success = 0;

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        try {
          const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
          const companyData: Record<string, string | undefined> = {};

          headers.forEach((header, index) => {
            companyData[header.toLowerCase().replace(' ', '_')] = values[index];
          });

          await this.createCompany(companyData);
          success++;
        } catch (error) {
          errors.push(`Line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { success, errors };
    } catch (error) {
      this.handleError('Failed to import companies', error);
      throw error;
    }
  }
}
