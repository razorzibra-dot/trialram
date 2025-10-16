export interface JobWork {
  id: string;
  job_ref_id: string; // Format: CUSTSHORT-YYYYMMDD-XXXXXX

  // Customer Relationship (integrated with unified Customer model)
  customer_id: string;
  customer_name?: string;
  customer_short_name?: string;
  customer_contact?: string;
  customer_email?: string;
  customer_phone?: string;

  // Product Relationship (integrated with unified Product model)
  product_id: string;
  product_name?: string;
  product_sku?: string;
  product_category?: string;
  product_unit?: string;

  // Job Specifications
  pieces: number;
  size: string;
  specifications?: JobWorkSpecification[];

  // Pricing Information
  base_price: number; // From Product.price
  default_price: number; // Calculated with size/complexity multipliers
  manual_price?: number; // Override price if set
  final_price: number; // Final calculated price (pieces * effective_price)
  currency?: string;

  // Assignment and Engineering
  receiver_engineer_id: string;
  receiver_engineer_name?: string;
  receiver_engineer_email?: string;
  assigned_by?: string;
  assigned_by_name?: string;

  // Status and Workflow
  status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  // Dates and Timeline
  due_date?: string;
  started_at?: string;
  completed_at?: string;
  delivered_at?: string;
  estimated_completion?: string;

  // Additional Information
  comments?: string;
  internal_notes?: string;
  delivery_address?: string;
  delivery_instructions?: string;

  // Quality and Compliance
  quality_check_passed?: boolean;
  quality_notes?: string;
  compliance_requirements?: string[];

  // System Information
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Job Work Specification interface
export interface JobWorkSpecification {
  id: string;
  name: string;
  value: string;
  unit?: string;
  required: boolean;
}

export interface JobWorkFilters {
  status?: string;
  customer_id?: string;
  product_id?: string;
  receiver_engineer_id?: string;
  assigned_by?: string;
  priority?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  due_date_from?: string;
  due_date_to?: string;
  overdue?: boolean;
  quality_check_passed?: boolean;
}

export interface JobWorkStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  delivered: number;
  cancelled: number;
  total_value: number;
  avg_pieces_per_job: number;
  avg_job_value: number;
  overdue_count: number;
  quality_issues_count: number;
}

export interface JobWorkFormData {
  customer_id: string;
  product_id: string;
  pieces: number;
  size: string;
  specifications?: Omit<JobWorkSpecification, 'id'>[];
  manual_price?: number;
  receiver_engineer_id: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  delivery_address?: string;
  delivery_instructions?: string;
  comments?: string;
  internal_notes?: string;
  compliance_requirements?: string[];
}

export interface JobWorkUpdateData {
  status?: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';
  pieces?: number;
  size?: string;
  specifications?: JobWorkSpecification[];
  manual_price?: number;
  receiver_engineer_id?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  delivery_address?: string;
  delivery_instructions?: string;
  comments?: string;
  internal_notes?: string;
  quality_check_passed?: boolean;
  quality_notes?: string;
  compliance_requirements?: string[];
}

export interface JobWorkPriceCalculation {
  base_price: number; // From Product.price
  pieces_multiplier: number;
  size_multiplier: number;
  complexity_multiplier?: number;
  specification_adjustments?: number;
  calculated_price: number;
  total_price: number; // calculated_price * pieces
  currency: string;
}