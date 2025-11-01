export interface Contract {
  id: string;
  contract_number?: string;
  title: string;
  description?: string;
  type: 'service_agreement' | 'nda' | 'purchase_order' | 'employment' | 'custom';
  status: 'draft' | 'pending_approval' | 'active' | 'renewed' | 'expired' | 'terminated';

  // Customer Relationship (Primary)
  customer_id: string;
  customer_name?: string;
  customer_contact?: string;

  // Phase 3.3: Deal Relationship (Link to Sales Deal)
  deal_id?: string;
  deal_title?: string;

  // Additional Parties (Secondary)
  parties: ContractParty[];

  // Financial Information
  value: number;
  total_value: number; // Alias for backend compatibility
  currency: string;
  payment_terms?: string;
  delivery_terms?: string;

  // Dates and Timeline
  start_date: string;
  end_date: string;
  signed_date?: string;
  next_renewal_date?: string;

  // Renewal and Terms
  auto_renew: boolean;
  renewal_period_months?: number;
  renewal_terms?: string;
  terms?: string;

  // Approval and Workflow
  approval_stage?: string;
  approval_history: ApprovalRecord[];
  compliance_status: 'compliant' | 'non_compliant' | 'pending_review';

  // Assignment and Management
  created_by: string;
  assigned_to?: string;
  assigned_to_name?: string;

  // Document Management
  content?: string;
  template_id?: string;
  document_path?: string;
  document_url?: string;
  version: number;

  // Organization and Tracking
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reminder_days: number[];
  next_reminder_date?: string;
  notes?: string;

  // Signatures and Attachments
  signature_status: SignatureStatus;
  signed_by_customer?: string;
  signed_by_company?: string;
  attachments: ContractAttachment[];

  // System Information
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface ContractParty {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role: 'client' | 'vendor' | 'partner' | 'internal' | 'customer';
  is_primary?: boolean; // Indicates if this is the primary customer
  customer_id?: string; // Link to Customer entity if applicable
  signature_required: boolean;
  signed_at?: string;
  signature_url?: string;
  signature_status?: 'pending' | 'signed' | 'declined';
}

export interface ContractAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
  uploaded_by: string;
}

export interface ApprovalRecord {
  id: string;
  stage: string;
  approver: string;
  approver_name: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  timestamp: string;
}

export interface SignatureStatus {
  total_required: number;
  completed: number;
  pending: string[];
  last_signed_at?: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  type: 'service_agreement' | 'nda' | 'purchase_order' | 'employment' | 'custom';
  content: string;
  fields: TemplateField[];
  is_active: boolean;
  category: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
}

// Contract form data interface
export interface ContractFormData {
  title: string;
  description?: string;
  type: 'service_agreement' | 'nda' | 'purchase_order' | 'employment' | 'custom';
  customer_id: string;
  value: number;
  currency: string;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  renewal_terms?: string;
  payment_terms?: string;
  delivery_terms?: string;
  template_id?: string;
  assigned_to?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reminder_days: number[];
  tags: string[];
  parties: Omit<ContractParty, 'id' | 'signed_at' | 'signature_url'>[];
  terms?: string;
  notes?: string;
  // Phase 3.3: Deal Relationship
  deal_id?: string;
  deal_title?: string;
}

// Contract filters interface - MERGED and standardized
export interface ContractFilters {
  status?: string;
  type?: string;
  customer_id?: string;
  assigned_to?: string;
  priority?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  expiring_soon?: boolean;
  auto_renew?: boolean;
  // Extended filtering
  tags?: string[];
  compliance_status?: string;
  value_min?: number;
  value_max?: number;
}

export interface ContractAnalytics {
  total_contracts: number;
  active_contracts: number;
  pending_approvals: number;
  expiring_contracts: number;
  total_value: number;
  average_approval_time: number;
  renewal_rate: number;
  compliance_rate: number;
  monthly_stats: MonthlyContractStats[];
  status_distribution: StatusDistribution[];
  type_distribution: TypeDistribution[];
}

export interface MonthlyContractStats {
  month: string;
  created: number;
  signed: number;
  expired: number;
  value: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface TypeDistribution {
  type: string;
  count: number;
  value: number;
}

export interface RenewalReminder {
  id: string;
  contract_id: string;
  contract_title: string;
  reminder_date: string;
  days_until_expiry: number;
  status: 'pending' | 'sent' | 'acknowledged';
  recipients: string[];
  message: string;
  created_at: string;
}

export interface DigitalSignature {
  id: string;
  contract_id: string;
  signer_id: string;
  signer_name: string;
  signer_email: string;
  signature_url: string;
  ip_address: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'declined';
  verification_code?: string;
}

export interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  category: 'regulatory' | 'financial' | 'legal' | 'operational' | 'other';
  status: 'compliant' | 'non_compliant' | 'pending_review';
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  assigned_to: string;
  assigned_to_name: string;
  evidence: string;
  notes: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_name: string;
}

export interface ContractVersion {
  id: string;
  contract_id?: string;
  version: number;
  title?: string;
  description?: string;
  status: 'draft' | 'active' | 'archived';
  document_url: string;
  is_current_version: boolean;
  created_at: string;
  created_by?: string;
  notes?: string;
}

export interface ApprovalData {
  approval_notes?: string;
  approval_date?: string;
  approval_status?: string;
}

export interface RejectionData {
  rejection_reason: string;
  rejection_date?: string;
}

export interface AuditTrailEntry {
  id: string;
  action: string;
  action_type: 'create' | 'update' | 'sign' | 'approve' | 'reject' | 'delete';
  description: string;
  user_id: string;
  user_name: string;
  user_role: string;
  timestamp: string;
  ip_address: string;
  user_agent?: string;
  changes?: Array<{ field: string; old_value: unknown; new_value: unknown }>;
}

export interface AuditTrailFilters {
  action_type?: string;
  search_term?: string;
  date_from?: string;
  date_to?: string;
  user_id?: string;
}

export interface ApprovalWorkflowStep {
  id: string;
  step_number: number;
  title: string;
  description: string;
  approver_role: string;
  approver_name: string;
  approver_id: string;
  status: 'pending' | 'approved' | 'rejected';
  is_required: boolean;
  approved_at?: string;
  comments?: string;
  can_approve: boolean;
}

export interface ContractAttachmentDetail {
  id: string;
  file_name: string;
  original_name: string;
  file_size: number;
  file_type: string;
  category?: string;
  description?: string;
  uploaded_by: string;
  uploaded_by_name: string;
  uploaded_at: string;
  download_url: string;
  preview_url?: string;
  is_public?: boolean;
  version?: number;
}

export interface AttachmentUploadData {
  files: File[];
  category?: string;
  description?: string;
  isPublic?: boolean;
}