/**
 * Complaint Repository
 * Layer 4: Database access layer using GenericRepository pattern
 * 
 * Extends GenericRepository to provide complaint-specific database operations
 * with built-in tenant isolation, filtering, and search capabilities.
 */

import { GenericRepository } from '@/services/core/GenericRepository';
import { Complaint } from '@/types/complaints';
import { RepositoryConfig } from '@/types/generic';

/**
 * Database row type for complaints table (snake_case from DB)
 */
export interface ComplaintRow {
  id: string;
  title: string;
  description: string;
  type: Complaint['type'];
  status: Complaint['status'];
  priority: Complaint['priority'];
  customer_id: string;
  assigned_engineer_id?: string;
  engineer_resolution?: string;
  created_at: string;
  updated_at?: string;
  closed_at?: string | null;
  deleted_at?: string | null;
  tenant_id: string;
}

/**
 * Mapper: Converts snake_case DB row to camelCase TypeScript type
 */
const mapComplaintRow = (row: ComplaintRow): Complaint => ({
  id: row.id,
  title: row.title,
  description: row.description,
  type: row.type,
  status: row.status,
  priority: row.priority,
  customerId: row.customer_id,
  assignedEngineerId: row.assigned_engineer_id,
  engineerResolution: row.engineer_resolution,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  closedAt: row.closed_at,
  tenantId: row.tenant_id,
  comments: []
});

/**
 * Reverse mapper: Converts camelCase type back to snake_case for DB insert/update
 */
const unmapComplaintRow = (complaint: Partial<Complaint>): Partial<ComplaintRow> => ({
  title: complaint.title,
  description: complaint.description,
  type: complaint.type,
  status: complaint.status,
  priority: complaint.priority,
  customer_id: complaint.customerId,
  assigned_engineer_id: complaint.assignedEngineerId,
  engineer_resolution: complaint.engineerResolution
});

/**
 * ComplaintRepository
 * 
 * Repository configuration:
 * - Table: complaints
 * - Search fields: title, description
 * - Soft delete: Yes (deleted_at)
 * - Mapper: mapComplaintRow
 */
export class ComplaintRepository extends GenericRepository<Complaint, Partial<Complaint>, Partial<Complaint>, ComplaintRow> {
  constructor() {
    const config: RepositoryConfig<Complaint, ComplaintRow> = {
      tableName: 'complaints',
      searchFields: ['title', 'description'],
      softDelete: {
        enabled: true,
        field: 'deleted_at'
      },
      mapper: mapComplaintRow,
      reverseMapper: unmapComplaintRow,
      selectFields: 'id,title,description,type,status,priority,customer_id,assigned_engineer_id,engineer_resolution,created_at,updated_at,closed_at,deleted_at,tenant_id',
      readOnlyFields: ['id', 'created_at', 'updated_at', 'closed_at', 'deleted_at', 'tenant_id']
    };
    
    super(config);
  }
}
