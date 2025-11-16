/**
 * Company Hooks
 * React hooks for company operations using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CompanyService } from '../services/companyService';
import { useService } from '@/modules/core/hooks/useService';
import { Company, CompanyFormData, CompanyFilters } from '@/types/masters';
import { LISTS_QUERY_CONFIG, DETAIL_QUERY_CONFIG, STATS_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';

// Query Keys
export const companyKeys = {
  all: ['companies'] as const,
  lists: () => [...companyKeys.all, 'list'] as const,
  list: (filters: CompanyFilters) => [...companyKeys.lists(), filters] as const,
  details: () => [...companyKeys.all, 'detail'] as const,
  detail: (id: string) => [...companyKeys.details(), id] as const,
  stats: () => [...companyKeys.all, 'stats'] as const,
  statuses: () => [...companyKeys.all, 'statuses'] as const,
  sizes: () => [...companyKeys.all, 'sizes'] as const,
  industries: () => [...companyKeys.all, 'industries'] as const,
};

/**
 * Hook for fetching companies with filters
 */
export const useCompanies = (filters: CompanyFilters = {}) => {
  const companyService = useService<CompanyService>('companyService');

  return useQuery({
    queryKey: companyKeys.list(filters),
    queryFn: () => companyService.getCompanies(filters),
    ...LISTS_QUERY_CONFIG,
  });
};

/**
 * Hook for fetching a single company
 */
export const useCompany = (id: string) => {
  const companyService = useService<CompanyService>('companyService');

  return useQuery({
    queryKey: companyKeys.detail(id),
    queryFn: () => companyService.getCompany(id),
    ...DETAIL_QUERY_CONFIG,
    enabled: !!id,
  });
};

/**
 * Hook for fetching company statistics
 */
export const useCompanyStats = () => {
  const companyService = useService<CompanyService>('companyService');

  return useQuery({
    queryKey: companyKeys.stats(),
    queryFn: () => companyService.getCompanyStats(),
    ...STATS_QUERY_CONFIG,
  });
};

/**
 * Hook for fetching company statuses
 */
export const useCompanyStatuses = () => {
  const companyService = useService<CompanyService>('companyService');

  return useQuery({
    queryKey: companyKeys.statuses(),
    queryFn: () => companyService.getCompanyStatuses(),
    staleTime: 60 * 60 * 1000,
  });
};

/**
 * Hook for fetching company sizes
 */
export const useCompanySizes = () => {
  const companyService = useService<CompanyService>('companyService');

  return useQuery({
    queryKey: companyKeys.sizes(),
    queryFn: () => companyService.getCompanySizes(),
    staleTime: 60 * 60 * 1000,
  });
};

/**
 * Hook for fetching industries
 */
export const useIndustries = () => {
  const companyService = useService<CompanyService>('companyService');

  return useQuery({
    queryKey: companyKeys.industries(),
    queryFn: () => companyService.getIndustries(),
    staleTime: 60 * 60 * 1000,
  });
};

/**
 * Hook for creating a company
 */
export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  const companyService = useService<CompanyService>('companyService');

  return useMutation({
    mutationFn: (data: CompanyFormData) => companyService.createCompany(data),
    onSuccess: (newCompany) => {
      // Invalidate and refetch companies list
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: companyKeys.stats() });
      
      toast.success('Company created successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create company');
    },
  });
};

/**
 * Hook for updating a company
 */
export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  const companyService = useService<CompanyService>('companyService');

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CompanyFormData> }) =>
      companyService.updateCompany(id, data),
    onSuccess: (updatedCompany) => {
      // Update the specific company in cache
      queryClient.setQueryData(
        companyKeys.detail(updatedCompany.id),
        updatedCompany
      );
      
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: companyKeys.stats() });
      
      toast.success('Company updated successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update company');
    },
  });
};

/**
 * Hook for deleting a company
 */
export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  const companyService = useService<CompanyService>('companyService');

  return useMutation({
    mutationFn: (id: string) => companyService.deleteCompany(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: companyKeys.detail(deletedId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: companyKeys.stats() });
      
      toast.success('Company deleted successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete company');
    },
  });
};

/**
 * Hook for updating company status
 */
export const useUpdateCompanyStatus = () => {
  const queryClient = useQueryClient();
  const companyService = useService<CompanyService>('companyService');

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      companyService.updateCompanyStatus(id, status),
    onSuccess: (updatedCompany) => {
      // Update the specific company in cache
      queryClient.setQueryData(
        companyKeys.detail(updatedCompany.id),
        updatedCompany
      );
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: companyKeys.stats() });
      
      toast.success('Company status updated successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update company status');
    },
  });
};

/**
 * Hook for bulk operations on companies
 */
export const useBulkCompanyOperations = () => {
  const queryClient = useQueryClient();
  const companyService = useService<CompanyService>('companyService');

  const bulkUpdate = useMutation({
    mutationFn: ({ ids, updates }: { ids: string[]; updates: Partial<CompanyFormData> }) =>
      companyService.bulkUpdateCompanies(ids, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: companyKeys.stats() });
      toast.success('Companies updated successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update companies');
    },
  });

  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) => companyService.bulkDeleteCompanies(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: companyKeys.stats() });
      toast.success('Companies deleted successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete companies');
    },
  });

  return { bulkUpdate, bulkDelete };
};

/**
 * Hook for exporting companies
 */
export const useExportCompanies = () => {
  const companyService = useService<CompanyService>('companyService');

  return useMutation({
    mutationFn: (format: 'csv' | 'json' = 'csv') => companyService.exportCompanies(format),
    onSuccess: (data, format) => {
      // Create and download file
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `companies.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Companies exported successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to export companies');
    },
  });
};

/**
 * Hook for importing companies
 */
export const useImportCompanies = () => {
  const queryClient = useQueryClient();
  const companyService = useService<CompanyService>('companyService');

  return useMutation({
    mutationFn: (csv: string) => companyService.importCompanies(csv),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: companyKeys.stats() });
      
      if (result.errors.length > 0) {
        toast.warning(`Imported ${result.success} companies with ${result.errors.length} errors`);
      } else {
        toast.success(`Successfully imported ${result.success} companies`);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to import companies');
    },
  });
};
