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
  uploadedAt: string;
  uploadedBy: string;
}

export interface ApprovalRecord {
  id: string;
  stage: string;
  approver: string;
  approverName: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  timestamp: string;
}

export interface SignatureStatus {
  totalRequired: number;
  completed: number;
  pending: string[];
  lastSignedAt?: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  type: 'service_agreement' | 'nda' | 'purchase_order' | 'employment' | 'custom';
  content: string;
  fields: TemplateField[];
  isActive: boolean;
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
}

// Contract filters interface
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
}

export interface ContractAnalytics {
  totalContracts: number;
  activeContracts: number;
  pendingApprovals: number;
  expiringContracts: number;
  totalValue: number;
  averageApprovalTime: number;
  renewalRate: number;
  complianceRate: number;
  monthlyStats: MonthlyContractStats[];
  statusDistribution: StatusDistribution[];
  typeDistribution: TypeDistribution[];
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

export interface ContractFilters {
  status?: string;
  type?: string;
  assignedTo?: string;
  createdBy?: string;
  priority?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  valueRange?: {
    min: number;
    max: number;
  };
  search?: string;
  tags?: string[];
  autoRenew?: boolean;
  complianceStatus?: string;
}

export interface RenewalReminder {
  id: string;
  contractId: string;
  contractTitle: string;
  reminderDate: string;
  daysUntilExpiry: number;
  status: 'pending' | 'sent' | 'acknowledged';
  recipients: string[];
  message: string;
  created_at: string;
}

export interface DigitalSignature {
  id: string;
  contractId: string;
  signerId: string;
  signerName: string;
  signerEmail: string;
  signatureUrl: string;
  ipAddress: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'declined';
  verificationCode?: string;
}