/**
 * File Management Types
 * Centralized types for file handling and metadata
 */

export interface FileMetadata {
  id: string;
  name: string;
  size: number; // bytes
  mimeType: string;
  uploadedAt: Date;
  uploadedBy: string;
  url?: string;
  tenantId: string;
  metadata?: Record<string, unknown>;
}