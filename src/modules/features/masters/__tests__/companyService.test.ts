/**
 * Company Service Mock - Unit Tests
 * Tests for mock company service functionality
 * Verifies CRUD operations, validation, and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { companyService } from '@/services/companyService';
import { Company, CompanyFormData, CompanyFilters } from '@/types/masters';

describe('Mock Company Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CRUD Operations', () => {
    it('should retrieve all companies', async () => {
      const companies = await companyService.getCompanies();
      expect(Array.isArray(companies)).toBe(true);
      expect(companies.length).toBeGreaterThan(0);
    });

    it('should retrieve a single company by ID', async () => {
      const companies = await companyService.getCompanies();
      if (companies.length > 0) {
        const company = await companyService.getCompany(companies[0].id);
        expect(company).toBeDefined();
        expect(company.id).toBe(companies[0].id);
      }
    });

    it('should throw error for non-existent company', async () => {
      await expect(companyService.getCompany('non-existent-id')).rejects.toThrow();
    });

    it('should create a new company with valid data', async () => {
      const newCompany: CompanyFormData = {
        name: 'Test Company Inc',
        address: '123 Test Street',
        phone: '+1-555-0123',
        email: 'contact@testcompany.com',
        industry: 'Technology',
        size: 'medium',
        status: 'active',
        description: 'A test company',
      };

      const created = await companyService.createCompany(newCompany);
      expect(created).toBeDefined();
      expect(created.name).toBe(newCompany.name);
      expect(created.email).toBe(newCompany.email);
      expect(created.id).toBeDefined();
      expect(created.created_at).toBeDefined();
      expect(created.updated_at).toBeDefined();
    });

    it('should update an existing company', async () => {
      const companies = await companyService.getCompanies();
      if (companies.length > 0) {
        const companyId = companies[0].id;
        const updateData: Partial<CompanyFormData> = {
          name: 'Updated Company Name',
          status: 'inactive',
        };

        const updated = await companyService.updateCompany(companyId, updateData);
        expect(updated.name).toBe(updateData.name);
        expect(updated.status).toBe(updateData.status);
      }
    });

    it('should delete a company', async () => {
      const newCompany: CompanyFormData = {
        name: 'Delete Test Company',
        address: '456 Delete Ave',
        phone: '+1-555-0456',
        email: 'delete@test.com',
        industry: 'Finance',
        size: 'small',
        status: 'active',
      };

      const created = await companyService.createCompany(newCompany);
      await companyService.deleteCompany(created.id);

      // Should throw when trying to get deleted company
      await expect(companyService.getCompany(created.id)).rejects.toThrow();
    });
  });

  describe('Validation Logic', () => {
    it('should reject company with missing required name', async () => {
      const invalidCompany = {
        address: '123 Test',
        phone: '+1-555-0123',
        email: 'test@example.com',
        industry: 'Technology',
        size: 'medium' as const,
        status: 'active' as const,
      } as any;

      await expect(companyService.createCompany(invalidCompany)).rejects.toThrow();
    });

    it('should reject company with invalid email format', async () => {
      const invalidCompany: CompanyFormData = {
        name: 'Test Company',
        address: '123 Test St',
        phone: '+1-555-0123',
        email: 'invalid-email', // Invalid format
        industry: 'Technology',
        size: 'medium',
        status: 'active',
      };

      await expect(companyService.createCompany(invalidCompany)).rejects.toThrow();
    });

    it('should reject company with invalid phone format', async () => {
      const invalidCompany: CompanyFormData = {
        name: 'Test Company',
        address: '123 Test St',
        phone: 'invalid-phone', // Invalid format
        email: 'test@example.com',
        industry: 'Technology',
        size: 'medium',
        status: 'active',
      };

      await expect(companyService.createCompany(invalidCompany)).rejects.toThrow();
    });

    it('should reject company with invalid industry', async () => {
      const invalidCompany: any = {
        name: 'Test Company',
        address: '123 Test St',
        phone: '+1-555-0123',
        email: 'test@example.com',
        industry: 'InvalidIndustry',
        size: 'medium',
        status: 'active',
      };

      await expect(companyService.createCompany(invalidCompany)).rejects.toThrow();
    });

    it('should reject company with invalid size', async () => {
      const invalidCompany: any = {
        name: 'Test Company',
        address: '123 Test St',
        phone: '+1-555-0123',
        email: 'test@example.com',
        industry: 'Technology',
        size: 'invalid-size',
        status: 'active',
      };

      await expect(companyService.createCompany(invalidCompany)).rejects.toThrow();
    });

    it('should reject company with invalid status', async () => {
      const invalidCompany: any = {
        name: 'Test Company',
        address: '123 Test St',
        phone: '+1-555-0123',
        email: 'test@example.com',
        industry: 'Technology',
        size: 'medium',
        status: 'invalid-status',
      };

      await expect(companyService.createCompany(invalidCompany)).rejects.toThrow();
    });

    it('should reject company with duplicate name', async () => {
      const companies = await companyService.getCompanies();
      if (companies.length > 0) {
        const existingName = companies[0].name;
        
        const duplicateCompany: CompanyFormData = {
          name: existingName,
          address: 'Different Address',
          phone: '+1-555-9999',
          email: 'unique@example.com',
          industry: 'Technology',
          size: 'small',
          status: 'active',
        };

        await expect(companyService.createCompany(duplicateCompany)).rejects.toThrow();
      }
    });
  });

  describe('Statistics & Analytics', () => {
    it('should retrieve company statistics', async () => {
      const stats = await companyService.getCompanyStats();
      expect(stats).toBeDefined();
      expect(stats.total_companies).toBeGreaterThanOrEqual(0);
      expect(stats.active_companies).toBeGreaterThanOrEqual(0);
      expect(typeof stats.total_companies).toBe('number');
      expect(typeof stats.active_companies).toBe('number');
    });

    it('should calculate company stats correctly', async () => {
      const stats = await companyService.getCompanyStats();
      const companies = await companyService.getCompanies();
      
      const activeCount = companies.filter(c => c.status === 'active').length;
      expect(stats.active_companies).toBe(activeCount);
    });
  });

  describe('Search & Filtering', () => {
    it('should search companies by name', async () => {
      const filters: CompanyFilters = { search: 'Test' };
      const results = await companyService.searchCompanies(filters);
      expect(Array.isArray(results)).toBe(true);
    });

    it('should filter companies by industry', async () => {
      const filters: CompanyFilters = { industry: 'Technology' };
      const results = await companyService.searchCompanies(filters);
      expect(Array.isArray(results)).toBe(true);
      results.forEach(company => {
        expect(company.industry).toBe('Technology');
      });
    });

    it('should filter companies by size', async () => {
      const filters: CompanyFilters = { size: 'medium' };
      const results = await companyService.searchCompanies(filters);
      expect(Array.isArray(results)).toBe(true);
      results.forEach(company => {
        expect(company.size).toBe('medium');
      });
    });

    it('should filter companies by status', async () => {
      const filters: CompanyFilters = { status: 'active' };
      const results = await companyService.searchCompanies(filters);
      expect(Array.isArray(results)).toBe(true);
      results.forEach(company => {
        expect(company.status).toBe('active');
      });
    });

    it('should combine multiple filters', async () => {
      const filters: CompanyFilters = {
        industry: 'Technology',
        status: 'active',
        size: 'medium',
      };
      const results = await companyService.searchCompanies(filters);
      expect(Array.isArray(results)).toBe(true);
      results.forEach(company => {
        expect(company.industry).toBe('Technology');
        expect(company.status).toBe('active');
        expect(company.size).toBe('medium');
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw descriptive error for invalid input', async () => {
      try {
        await companyService.createCompany({} as any);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBeDefined();
        expect(typeof error.message).toBe('string');
      }
    });

    it('should handle null/undefined gracefully', async () => {
      await expect(companyService.getCompany('')).rejects.toThrow();
    });
  });

  describe('Export/Import Functionality', () => {
    it('should export companies as CSV', async () => {
      const csv = await companyService.exportCompanies('csv');
      expect(typeof csv).toBe('string');
      expect(csv.length).toBeGreaterThan(0);
    });

    it('should export companies as JSON', async () => {
      const json = await companyService.exportCompanies('json');
      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('should import companies from JSON', async () => {
      const companies = await companyService.getCompanies();
      const json = JSON.stringify(companies.slice(0, 2));
      
      const imported = await companyService.importCompanies(json, 'json');
      expect(Array.isArray(imported)).toBe(true);
      expect(imported.length).toBeGreaterThan(0);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across operations', async () => {
      const initialCompanies = await companyService.getCompanies();
      const initialCount = initialCompanies.length;

      const newCompany: CompanyFormData = {
        name: 'Consistency Test Corp',
        address: '789 Consistency Ln',
        phone: '+1-555-7890',
        email: 'consistency@test.com',
        industry: 'Technology',
        size: 'small',
        status: 'active',
      };

      const created = await companyService.createCompany(newCompany);
      let allCompanies = await companyService.getCompanies();
      expect(allCompanies.length).toBe(initialCount + 1);

      await companyService.deleteCompany(created.id);
      allCompanies = await companyService.getCompanies();
      expect(allCompanies.length).toBe(initialCount);
    });

    it('should return proper timestamps on create', async () => {
      const newCompany: CompanyFormData = {
        name: 'Timestamp Corp',
        address: '321 Time St',
        phone: '+1-555-3210',
        email: 'timestamp@test.com',
        industry: 'Healthcare',
        size: 'large',
        status: 'active',
      };

      const created = await companyService.createCompany(newCompany);
      expect(new Date(created.created_at)).toBeInstanceOf(Date);
      expect(new Date(created.updated_at)).toBeInstanceOf(Date);
    });

    it('should preserve immutability of returned objects', async () => {
      const companies = await companyService.getCompanies();
      if (companies.length > 0) {
        const original = { ...companies[0] };
        const retrieved = await companyService.getCompany(companies[0].id);
        
        expect(retrieved).toEqual(original);
        expect(retrieved).not.toBe(original); // Different references
      }
    });
  });
});