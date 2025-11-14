/**
 * Complaint Service Interface
 * Defines the contract for complaint management operations
 */

import { 
  Complaint, 
  ComplaintFilters, 
  ComplaintFormData, 
  ComplaintUpdateData,
  ComplaintComment,
  ComplaintStats
} from '@/types';

/**
 * Complaint Service Interface
 * All complaint operations must implement this interface
 */
export interface IComplaintService {
  getComplaints(filters?: ComplaintFilters): Promise<Complaint[]>;
  getComplaint(id: string): Promise<Complaint>;
  createComplaint(complaintData: ComplaintFormData): Promise<Complaint>;
  updateComplaint(id: string, updates: ComplaintUpdateData): Promise<Complaint>;
  deleteComplaint(id: string): Promise<void>;
  addComment(complaintId: string, content: string, parentId?: string): Promise<ComplaintComment>;
  getComplaintStats(): Promise<ComplaintStats>;
  getComplaintTypes(): Promise<string[]>;
  getComplaintStatuses(): Promise<string[]>;
  getPriorities(): Promise<string[]>;
  getEngineers(): Promise<Array<{ id: string; name: string }>>;
  reopenComplaint(id: string): Promise<Complaint>;
}
