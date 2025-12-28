export interface Complaint {
  id: string;
  title: string;
  description: string;
  customer_id: string;
  customer_name?: string;
  category: 'breakdown' | 'preventive' | 'software_update' | 'optimize';
  status: 'new' | 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  assigned_to_name?: string;
  resolution?: string;
  comments: ComplaintComment[];
  tenant_id: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface ComplaintComment {
  id: string;
  complaint_id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_id?: string; // For threaded comments
  replies?: ComplaintComment[];
}

export interface ComplaintFilters {
  status?: string;
  category?: string;
  priority?: string;
  assigned_to?: string;
  customer_id?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface ComplaintStats {
  total: number;
  new: number;
  in_progress: number;
  closed: number;
  by_type: {
    breakdown: number;
    preventive: number;
    software_update: number;
    optimize: number;
  };
  by_priority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  avg_resolution_time: number; // in hours
}

export interface ComplaintFormData {
  title: string;
  description: string;
  customer_id: string;
  category: 'breakdown' | 'preventive' | 'software_update' | 'optimize';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
}

export interface ComplaintUpdateData {
  status?: 'new' | 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string;
  resolution?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}