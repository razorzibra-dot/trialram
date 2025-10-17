/**
 * JobWorks Service
 * Business logic for job work management
 */

import { BaseService } from '@/modules/core/services/BaseService';
import { PaginatedResponse } from '@/modules/core/types';

export interface JobWork {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customer_id: string;
  customer_name?: string;
  assigned_to?: string;
  assigned_to_name?: string;
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
      // Mock data for now - replace with actual API call
      const mockJobWorks: JobWork[] = [
        {
          id: '1',
          title: 'Website Maintenance',
          description: 'Regular maintenance and updates',
          status: 'in_progress',
          priority: 'medium',
          customer_id: '1',
          customer_name: 'Acme Corp',
          assigned_to: '1',
          assigned_to_name: 'John Doe',
          start_date: '2024-01-15',
          due_date: '2024-01-30',
          estimated_hours: 20,
          actual_hours: 15,
          cost: 2000,
          created_at: '2024-01-10',
          updated_at: '2024-01-20',
        },
        {
          id: '2',
          title: 'Database Migration',
          description: 'Migrate legacy database to new system',
          status: 'pending',
          priority: 'high',
          customer_id: '2',
          customer_name: 'Tech Solutions',
          assigned_to: '2',
          assigned_to_name: 'Jane Smith',
          start_date: '2024-02-01',
          due_date: '2024-02-15',
          estimated_hours: 40,
          cost: 5000,
          created_at: '2024-01-25',
          updated_at: '2024-01-25',
        },
      ];

      // Apply filters
      let filteredData = mockJobWorks;
      
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filteredData = filteredData.filter(job => 
          job.title.toLowerCase().includes(search) ||
          job.description?.toLowerCase().includes(search) ||
          job.customer_name?.toLowerCase().includes(search)
        );
      }

      if (filters.status && filters.status !== 'all') {
        filteredData = filteredData.filter(job => job.status === filters.status);
      }

      if (filters.priority && filters.priority !== 'all') {
        filteredData = filteredData.filter(job => job.priority === filters.priority);
      }

      // Pagination
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const total = filteredData.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const data = filteredData.slice(startIndex, endIndex);

      return {
        data,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      this.handleError('Failed to fetch job works', error);
      throw error;
    }
  }

  /**
   * Get a single job work by ID
   */
  async getJobWork(id: string): Promise<JobWork> {
    try {
      const response = await this.getJobWorks();
      const jobWork = response.data.find(job => job.id === id);
      if (!jobWork) {
        throw new Error('Job work not found');
      }
      return jobWork;
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
      // Mock implementation - replace with actual API call
      const newJobWork: JobWork = {
        id: Date.now().toString(),
        ...data,
        status: data.status || 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return newJobWork;
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
      const existing = await this.getJobWork(id);
      const updated: JobWork = {
        ...existing,
        ...data,
        updated_at: new Date().toISOString(),
      };
      return updated;
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
      // Mock implementation - replace with actual API call
      console.log(`Deleting job work ${id}`);
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
      this.handleError('Failed to fetch job work statistics', error);
      throw error;
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
      const headers = ['ID', 'Title', 'Status', 'Priority', 'Customer', 'Assigned To', 'Due Date', 'Cost'];
      const rows = jobWorks.map(job => [
        job.id,
        job.title,
        job.status,
        job.priority,
        job.customer_name || '',
        job.assigned_to_name || '',
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
