/**
 * JobWorks Service
 * Business logic for job work management
 * ⚠️ CRITICAL: Uses Service Factory Pattern for multi-backend routing
 * 
 * This module delegates all job work operations through the centralized Service Factory
 * which routes requests to mock (development) or Supabase (production) based on VITE_API_MODE.
 * 
 * See: /src/services/serviceFactory.ts for factory routing logic
 * 
 * Module Distinction:
 * - This module manages JOB WORK entity and business logic
 * - NOT to be confused with other modules
 */

import { BaseService } from '@/modules/core/services/BaseService';
import { PaginatedResponse } from '@/modules/core/types';
import { jobWorkService as factoryJobWorkService } from '@/services/serviceFactory';

export interface JobWork {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customer_id: string;
  assigned_to?: string;
  start_date?: string;
  due_date?: string;
  completion_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  cost?: number;
  created_at?: string;
  updated_at?: string;
}

export interface JobWorksFilters {
  search?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  customer?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  page?: number;
  pageSize?: number;
}

export interface CreateJobWorkData {
  title: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customer_id: string;
  assigned_to?: string;
  start_date?: string;
  due_date?: string;
  estimated_hours?: number;
  cost?: number;
}

export class JobWorksService extends BaseService {
  /**
   * Get job works with filtering and pagination
   */
  async getJobWorks(filters: JobWorksFilters = {}): Promise<PaginatedResponse<JobWork>> {
    try {
      try {
        // Use the legacy service to fetch real data
        const jobWorks = await factoryJobWorkService.getJobWorks(filters as any);
        
        // Transform to paginated response
        const { page = 1, pageSize = 20 } = filters;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = (Array.isArray(jobWorks) ? jobWorks : []).slice(startIndex, endIndex);
        
        return {
          data: paginatedData,
          total: Array.isArray(jobWorks) ? jobWorks.length : 0,
          page,
          pageSize,
          totalPages: Math.ceil((Array.isArray(jobWorks) ? jobWorks.length : 0) / pageSize),
        };
      } catch (error) {
        // Handle authentication/authorization errors gracefully
        if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Tenant context not initialized'))) {
          // Return empty response instead of throwing
          const { page = 1, pageSize = 20 } = filters;
          console.warn('[JobWorksService] Auth error, returning empty response:', error.message);
          return {
            data: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0,
          };
        }
        throw error;
      }
    } catch (error) {
      console.error('Error fetching job works:', error);
      throw error;
    }
  }

  /**
   * Get a single job work by ID
   */
  async getJobWork(id: string): Promise<JobWork> {
    try {
      return await factoryJobWorkService.getJobWork(id);
    } catch (error) {
      this.handleError(`Failed to fetch job work ${id}`, error);
      throw error;
    }
  }

  /**
   * Create a new job work
   */
  async createJobWork(data: CreateJobWorkData): Promise<JobWork> {
    try {
      return await factoryJobWorkService.createJobWork(data as any);
    } catch (error) {
      this.handleError('Failed to create job work', error);
      throw error;
    }
  }

  /**
   * Update an existing job work
   */
  async updateJobWork(id: string, data: Partial<CreateJobWorkData>): Promise<JobWork> {
    try {
      return await factoryJobWorkService.updateJobWork(id, data as any);
    } catch (error) {
      this.handleError(`Failed to update job work ${id}`, error);
      throw error;
    }
  }

  /**
   * Delete a job work
   */
  async deleteJobWork(id: string): Promise<void> {
    try {
      await factoryJobWorkService.deleteJobWork(id);
    } catch (error) {
      this.handleError(`Failed to delete job work ${id}`, error);
      throw error;
    }
  }

  /**
   * Update job work status
   */
  async updateJobWorkStatus(id: string, status: string): Promise<JobWork> {
    try {
      const typedStatus = status as 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';
      return await this.updateJobWork(id, { status: typedStatus });
    } catch (error) {
      this.handleError(`Failed to update job work status for ${id}`, error);
      throw error;
    }
  }

  /**
   * Get job work statistics
   */
  async getJobWorkStats(): Promise<unknown> {
    try {
      const response = await this.getJobWorks({ pageSize: 1000 });
      const jobWorks = response.data;

      const stats = {
        total: jobWorks.length,
        byStatus: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        totalCost: 0,
        totalHours: 0,
        completedThisMonth: 0,
        overdueJobs: 0,
      };

      // If no job works returned (e.g., auth error), return empty stats
      if (!jobWorks || jobWorks.length === 0) {
        console.warn('[JobWorksService] No job works available for statistics calculation');
        return stats;
      }

      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      jobWorks.forEach(job => {
        // Status stats
        stats.byStatus[job.status] = (stats.byStatus[job.status] || 0) + 1;
        
        // Priority stats
        stats.byPriority[job.priority] = (stats.byPriority[job.priority] || 0) + 1;
        
        // Cost and hours
        stats.totalCost += job.cost || 0;
        stats.totalHours += job.actual_hours || job.estimated_hours || 0;
        
        // Completed this month
        if (job.status === 'completed' && job.completion_date) {
          const completionDate = new Date(job.completion_date);
          if (completionDate.getMonth() === thisMonth && completionDate.getFullYear() === thisYear) {
            stats.completedThisMonth++;
          }
        }
        
        // Overdue jobs
        if (job.due_date && new Date(job.due_date) < now && job.status !== 'completed' && job.status !== 'cancelled') {
          stats.overdueJobs++;
        }
      });

      return stats;
    } catch (error) {
      console.warn('[JobWorksService] Error fetching job work statistics, returning empty stats:', error);
      // Return empty stats instead of throwing
      return {
        total: 0,
        byStatus: {},
        byPriority: {},
        totalCost: 0,
        totalHours: 0,
        completedThisMonth: 0,
        overdueJobs: 0,
      };
    }
  }

  /**
   * Get job work statuses
   */
  async getJobWorkStatuses(): Promise<string[]> {
    return ['pending', 'in_progress', 'completed', 'cancelled'];
  }

  /**
   * Get job work priorities
   */
  async getJobWorkPriorities(): Promise<string[]> {
    return ['low', 'medium', 'high', 'urgent'];
  }

  /**
   * Export job works
   */
  async exportJobWorks(format: 'csv' | 'json' = 'csv'): Promise<string> {
    try {
      const response = await this.getJobWorks({ pageSize: 10000 });
      const jobWorks = response.data;

      if (format === 'json') {
        return JSON.stringify(jobWorks, null, 2);
      }

      // CSV format
      const headers = ['ID', 'Title', 'Status', 'Priority', 'Customer ID', 'Assigned To', 'Due Date', 'Cost'];
      const rows = jobWorks.map(job => [
        job.id,
        job.title,
        job.status,
        job.priority,
        job.customer_id || '',
        job.assigned_to || '',
        job.due_date || '',
        job.cost || 0
      ]);

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\r\n');

      return csv;
    } catch (error) {
      this.handleError('Failed to export job works', error);
      throw error;
    }
  }
}
