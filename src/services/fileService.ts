/**
 * Mock File Service
 * Provides file upload, download, and management functionality for development
 */

import { authService } from './authService';
import { FileMetadata } from '@/types';

class FileService {
  private baseUrl = '/api/files';
  
  // Mock file storage
  private mockFiles: FileMetadata[] = [
    {
      id: '1',
      filename: 'contract_template.pdf',
      originalName: 'Service Agreement Template.pdf',
      url: '/mock-files/contract_template.pdf',
      size: 245760,
      mimeType: 'application/pdf',
      category: 'contracts',
      description: 'Standard service agreement template',
      isPublic: false,
      uploadedBy: '1',
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      filename: 'customer_data.csv',
      originalName: 'Customer Export 2024.csv',
      url: '/mock-files/customer_data.csv',
      size: 15360,
      mimeType: 'text/csv',
      category: 'exports',
      description: 'Customer data export',
      isPublic: false,
      uploadedBy: '2',
      createdAt: '2024-01-20T14:30:00Z'
    },
    {
      id: '3',
      filename: 'company_logo.png',
      originalName: 'Company Logo.png',
      url: '/mock-files/company_logo.png',
      size: 8192,
      mimeType: 'image/png',
      category: 'branding',
      description: 'Company logo for documents',
      isPublic: true,
      uploadedBy: '1',
      createdAt: '2024-01-10T09:15:00Z'
    }
  ];

  async uploadFile(file: File, options?: {
    category?: string;
    description?: string;
    isPublic?: boolean;
  }): Promise<FileMetadata> {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions to upload files');
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not allowed');
    }

    const newFile: FileMetadata = {
      id: Date.now().toString(),
      filename: `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
      originalName: file.name,
      url: URL.createObjectURL(file), // In real implementation, this would be a server URL
      size: file.size,
      mimeType: file.type,
      category: options?.category || 'general',
      description: options?.description || '',
      isPublic: options?.isPublic || false,
      uploadedBy: user.id,
      createdAt: new Date().toISOString()
    };

    this.mockFiles.push(newFile);
    return newFile;
  }

  async downloadFile(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const file = this.mockFiles.find(f => f.id === id);
    if (!file) {
      throw new Error('File not found');
    }

    // Check permissions
    if (!file.isPublic && file.uploadedBy !== user.id && !authService.hasPermission('read')) {
      throw new Error('Insufficient permissions to download this file');
    }

    // In a real implementation, this would trigger a download
    // For mock, we'll just log the action
    console.log(`Mock download: ${file.originalName} (${file.url})`);
    
    // Simulate download by opening the URL
    if (typeof window !== 'undefined') {
      window.open(file.url, '_blank');
    }
  }

  async deleteFile(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('delete')) {
      throw new Error('Insufficient permissions to delete files');
    }

    const fileIndex = this.mockFiles.findIndex(f => f.id === id);
    if (fileIndex === -1) {
      throw new Error('File not found');
    }

    const file = this.mockFiles[fileIndex];
    
    // Check if user can delete this file
    if (file.uploadedBy !== user.id && user.role !== 'Admin') {
      throw new Error('You can only delete files you uploaded');
    }

    this.mockFiles.splice(fileIndex, 1);
  }

  async getFileMetadata(id: string): Promise<FileMetadata> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const file = this.mockFiles.find(f => f.id === id);
    if (!file) {
      throw new Error('File not found');
    }

    // Check permissions
    if (!file.isPublic && file.uploadedBy !== user.id && !authService.hasPermission('read')) {
      throw new Error('Insufficient permissions to access this file');
    }

    return file;
  }

  async getFiles(filters?: {
    category?: string;
    uploadedBy?: string;
    isPublic?: boolean;
    search?: string;
  }): Promise<FileMetadata[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let files = this.mockFiles.filter(f => 
      f.isPublic || f.uploadedBy === user.id || authService.hasPermission('read')
    );

    if (filters) {
      if (filters.category) {
        files = files.filter(f => f.category === filters.category);
      }
      if (filters.uploadedBy) {
        files = files.filter(f => f.uploadedBy === filters.uploadedBy);
      }
      if (filters.isPublic !== undefined) {
        files = files.filter(f => f.isPublic === filters.isPublic);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        files = files.filter(f => 
          f.originalName.toLowerCase().includes(search) ||
          f.description?.toLowerCase().includes(search) ||
          f.category?.toLowerCase().includes(search)
        );
      }
    }

    return files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getFileCategories(): Promise<string[]> {
    return ['general', 'contracts', 'exports', 'branding', 'documents', 'images', 'reports'];
  }

  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    usedSpace: string;
    filesByCategory: { category: string; count: number; size: number }[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const userFiles = this.mockFiles.filter(f => f.uploadedBy === user.id);
    const totalSize = userFiles.reduce((sum, file) => sum + file.size, 0);

    const categories = await this.getFileCategories();
    const filesByCategory = categories.map(category => {
      const categoryFiles = userFiles.filter(f => f.category === category);
      return {
        category,
        count: categoryFiles.length,
        size: categoryFiles.reduce((sum, file) => sum + file.size, 0)
      };
    }).filter(cat => cat.count > 0);

    return {
      totalFiles: userFiles.length,
      totalSize,
      usedSpace: this.formatFileSize(totalSize),
      filesByCategory
    };
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const fileService = new FileService();
