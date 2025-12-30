export interface Complaint {
  id: string;
  title: string;
  description: string;
  customerId: string;
  type: 'breakdown' | 'preventive' | 'software_update' | 'optimize';
  status: 'new' | 'in_progress' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedEngineerId?: string;
  engineerResolution?: string;
  comments?: ComplaintComment[];
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface ComplaintComment {
  id: string;
  complaintId: string;
  userId: string;
  content: string;
  createdAt: string;
  parentId?: string;
  replies?: ComplaintComment[];
}

export interface ComplaintFilters {
  status?: string;
  type?: string;
  priority?: string;
  assignedEngineerId?: string;
  customerId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ComplaintStats {
  total: number;
  new: number;
  inProgress: number;
  closed: number;
  byType: {
    breakdown: number;
    preventive: number;
    softwareUpdate: number;
    optimize: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  avgResolutionTime: number;
}

export interface ComplaintFormData {
  title: string;
  description: string;
  customerId: string;
  type: 'breakdown' | 'preventive' | 'software_update' | 'optimize';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedEngineerId?: string;
}

export interface ComplaintUpdateData {
  status?: 'new' | 'in_progress' | 'closed';
  assignedEngineerId?: string;
  engineerResolution?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}