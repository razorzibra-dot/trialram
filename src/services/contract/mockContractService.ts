import {
  Contract,
  ContractTemplate,
  ContractFormData,
  ContractFilters,
  ContractAnalytics,
  RenewalReminder,
  DigitalSignature,
  ApprovalRecord,
  ContractParty,
  ComplianceItem,
  ContractVersion,
  ApprovalData,
  RejectionData,
  AuditTrailEntry,
  AuditTrailFilters,
  ApprovalWorkflowStep,
  ContractAttachmentDetail,
  AttachmentUploadData
} from '@/types/contracts';
import { authService } from '../serviceFactory';

class MockContractService {
  private baseUrl = '/api/contracts';

  // Mock contract templates
  private mockTemplates: ContractTemplate[] = [
    {
      id: '1',
      name: 'Service Agreement Template',
      type: 'service_agreement',
      content: `SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into on {{startDate}} between {{clientName}} ("Client") and {{providerName}} ("Provider").

1. SERVICES
Provider agrees to provide the following services: {{serviceDescription}}

2. TERM
This agreement shall commence on {{startDate}} and continue until {{endDate}}.

3. COMPENSATION
Client agrees to pay Provider {{contractValue}} {{currency}} for the services described herein.

4. PAYMENT TERMS
{{paymentTerms}}

5. TERMINATION
Either party may terminate this agreement with {{terminationNotice}} days written notice.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

Client: _________________________ Date: _________
{{clientName}}

Provider: _________________________ Date: _________
{{providerName}}`,
      fields: [
        { id: '1', name: 'clientName', label: 'Client Name', type: 'text', required: true },
        { id: '2', name: 'providerName', label: 'Provider Name', type: 'text', required: true },
        { id: '3', name: 'serviceDescription', label: 'Service Description', type: 'textarea', required: true },
        { id: '4', name: 'contractValue', label: 'Contract Value', type: 'number', required: true },
        { id: '5', name: 'currency', label: 'Currency', type: 'select', required: true, options: ['USD', 'EUR', 'GBP'] },
        { id: '6', name: 'paymentTerms', label: 'Payment Terms', type: 'textarea', required: true },
        { id: '7', name: 'terminationNotice', label: 'Termination Notice (days)', type: 'number', required: true, defaultValue: '30' }
      ],
      is_active: true,
      category: 'Business',
      description: 'Standard service agreement template for professional services',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'Non-Disclosure Agreement',
      type: 'nda',
      content: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into on {{startDate}} between {{disclosingParty}} ("Disclosing Party") and {{receivingParty}} ("Receiving Party").

1. CONFIDENTIAL INFORMATION
For purposes of this Agreement, "Confidential Information" means {{confidentialDefinition}}

2. OBLIGATIONS
Receiving Party agrees to:
- Hold all Confidential Information in strict confidence
- Not disclose Confidential Information to third parties
- Use Confidential Information solely for {{purpose}}

3. TERM
This Agreement shall remain in effect for {{duration}} years from the date of execution.

4. RETURN OF INFORMATION
Upon termination, Receiving Party shall return or destroy all Confidential Information.

IN WITNESS WHEREOF, the parties have executed this Agreement.

Disclosing Party: _________________________ Date: _________
{{disclosingParty}}

Receiving Party: _________________________ Date: _________
{{receivingParty}}`,
      fields: [
        { id: '1', name: 'disclosingParty', label: 'Disclosing Party', type: 'text', required: true },
        { id: '2', name: 'receivingParty', label: 'Receiving Party', type: 'text', required: true },
        { id: '3', name: 'confidentialDefinition', label: 'Confidential Information Definition', type: 'textarea', required: true },
        { id: '4', name: 'purpose', label: 'Purpose of Disclosure', type: 'textarea', required: true },
        { id: '5', name: 'duration', label: 'Duration (years)', type: 'number', required: true, defaultValue: '2' }
      ],
      is_active: true,
      category: 'Legal',
      description: 'Standard non-disclosure agreement for confidential information protection',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '3',
      name: 'Purchase Order Agreement',
      type: 'purchase_order',
      content: `PURCHASE ORDER AGREEMENT

Purchase Order Number: {{poNumber}}
Date: {{startDate}}

Vendor: {{vendorName}}
Buyer: {{buyerName}}

1. PRODUCTS/SERVICES
{{itemDescription}}

2. PRICING
Total Amount: {{contractValue}} {{currency}}

3. DELIVERY
Delivery Date: {{deliveryDate}}
Delivery Address: {{deliveryAddress}}

4. PAYMENT TERMS
{{paymentTerms}}

5. WARRANTIES
{{warranties}}

Authorized Signature: _________________________ Date: _________
{{buyerName}}`,
      fields: [
        { id: '1', name: 'poNumber', label: 'PO Number', type: 'text', required: true },
        { id: '2', name: 'vendorName', label: 'Vendor Name', type: 'text', required: true },
        { id: '3', name: 'buyerName', label: 'Buyer Name', type: 'text', required: true },
        { id: '4', name: 'itemDescription', label: 'Items/Services Description', type: 'textarea', required: true },
        { id: '5', name: 'contractValue', label: 'Total Amount', type: 'number', required: true },
        { id: '6', name: 'currency', label: 'Currency', type: 'select', required: true, options: ['USD', 'EUR', 'GBP'] },
        { id: '7', name: 'deliveryDate', label: 'Delivery Date', type: 'date', required: true },
        { id: '8', name: 'deliveryAddress', label: 'Delivery Address', type: 'textarea', required: true },
        { id: '9', name: 'paymentTerms', label: 'Payment Terms', type: 'textarea', required: true },
        { id: '10', name: 'warranties', label: 'Warranties', type: 'textarea', required: false }
      ],
      is_active: true,
      category: 'Procurement',
      description: 'Standard purchase order agreement for goods and services',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  // Mock contracts data
  private mockContracts: Contract[] = [
    {
      id: '1',
      title: 'Enterprise Software License Agreement',
      type: 'service_agreement',
      status: 'active',
      parties: [
        {
          id: '1',
          name: 'TechCorp Solutions',
          email: 'legal@techcorp.com',
          role: 'client',
          signature_required: true,
          signed_at: '2024-01-15T10:00:00Z',
          signature_url: '/signatures/techcorp-signature.png'
        },
        {
          id: '2',
          name: 'Our Company',
          email: 'contracts@ourcompany.com',
          role: 'vendor',
          signature_required: true,
          signed_at: '2024-01-15T10:30:00Z',
          signature_url: '/signatures/ourcompany-signature.png'
        }
      ],
      value: 150000,
      total_value: 150000,
      currency: 'USD',
      start_date: '2024-01-15',
      end_date: '2025-01-15',
      auto_renew: true,
      renewal_terms: 'Automatic renewal for 1 year unless terminated with 60 days notice',
      approval_stage: 'approved',
      signed_date: '2024-01-15T10:30:00Z',
      created_by: '1',
      assigned_to: '2',
      tenant_id: 'tenant_1',
      content: 'Full enterprise software license agreement content...',
      template_id: '1',
      version: 1,
      tags: ['enterprise', 'software', 'annual'],
      priority: 'high',
      reminder_days: [90, 60, 30],
      next_reminder_date: '2024-10-15',
      compliance_status: 'compliant',
      attachments: [],
      approval_history: [
        {
          id: '1',
          stage: 'legal_review',
          approver: '3',
          approver_name: 'Legal Team',
          status: 'approved',
          comments: 'Terms reviewed and approved',
          timestamp: '2024-01-10T14:00:00Z'
        },
        {
          id: '2',
          stage: 'finance_review',
          approver: '4',
          approver_name: 'Finance Team',
          status: 'approved',
          comments: 'Budget approved',
          timestamp: '2024-01-12T16:00:00Z'
        }
      ],
      signature_status: {
        total_required: 2,
        completed: 2,
        pending: [],
        last_signed_at: '2024-01-15T10:30:00Z'
      },
      created_at: '2024-01-05T09:00:00Z',
      updated_at: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      title: 'Manufacturing Partnership NDA',
      type: 'nda',
      status: 'pending_approval',
      parties: [
        {
          id: '1',
          name: 'Global Manufacturing Inc',
          email: 'legal@globalmanuf.com',
          role: 'partner',
          signature_required: true
        },
        {
          id: '2',
          name: 'Our Company',
          email: 'contracts@ourcompany.com',
          role: 'internal',
          signature_required: true
        }
      ],
      value: 0,
      total_value: 0,
      currency: 'USD',
      start_date: '2024-02-01',
      end_date: '2026-02-01',
      auto_renew: false,
      renewal_terms: 'Manual renewal required',
      approval_stage: 'legal_review',
      created_by: '2',
      assigned_to: '3',
      tenant_id: 'tenant_1',
      content: 'Non-disclosure agreement for manufacturing partnership...',
      template_id: '2',
      version: 1,
      tags: ['nda', 'manufacturing', 'partnership'],
      priority: 'medium',
      reminder_days: [30, 7],
      compliance_status: 'pending_review',
      attachments: [],
      approval_history: [
        {
          id: '1',
          stage: 'legal_review',
          approver: '3',
          approver_name: 'Legal Team',
          status: 'pending',
          timestamp: '2024-01-25T10:00:00Z'
        }
      ],
      signature_status: {
        total_required: 2,
        completed: 0,
        pending: ['legal@globalmanuf.com', 'contracts@ourcompany.com']
      },
      created_at: '2024-01-25T09:00:00Z',
      updated_at: '2024-01-25T09:00:00Z'
    },
    {
      id: '3',
      title: 'Office Equipment Purchase Order',
      type: 'purchase_order',
      status: 'draft',
      parties: [
        {
          id: '1',
          name: 'Office Supplies Co',
          email: 'sales@officesupplies.com',
          role: 'vendor',
          signature_required: true
        }
      ],
      value: 25000,
      total_value: 25000,
      currency: 'USD',
      start_date: '2024-02-15',
      end_date: '2024-03-15',
      auto_renew: false,
      renewal_terms: 'One-time purchase',
      approval_stage: 'draft',
      created_by: '3',
      assigned_to: '3',
      tenant_id: 'tenant_1',
      content: 'Purchase order for office equipment and supplies...',
      template_id: '3',
      version: 1,
      tags: ['purchase', 'office', 'equipment'],
      priority: 'low',
      reminder_days: [7],
      compliance_status: 'pending_review',
      attachments: [],
      approval_history: [],
      signature_status: {
        total_required: 1,
        completed: 0,
        pending: ['sales@officesupplies.com']
      },
      created_at: '2024-01-28T14:00:00Z',
      updated_at: '2024-01-28T14:00:00Z'
    },
    {
      id: '4',
      title: 'Consulting Services Agreement',
      type: 'service_agreement',
      status: 'expired',
      parties: [
        {
          id: '1',
          name: 'StartupXYZ',
          email: 'legal@startupxyz.com',
          role: 'client',
          signature_required: true,
          signed_at: '2023-06-01T10:00:00Z',
          signature_url: '/signatures/startupxyz-signature.png'
        }
      ],
      value: 50000,
      total_value: 50000,
      currency: 'USD',
      start_date: '2023-06-01',
      end_date: '2024-01-01',
      auto_renew: false,
      renewal_terms: 'Manual renewal required',
      approval_stage: 'approved',
      signed_date: '2023-06-01T10:00:00Z',
      created_by: '2',
      assigned_to: '2',
      tenant_id: 'tenant_1',
      content: 'Consulting services agreement content...',
      template_id: '1',
      version: 1,
      tags: ['consulting', 'startup', 'expired'],
      priority: 'medium',
      reminder_days: [30, 7],
      compliance_status: 'compliant',
      attachments: [],
      approval_history: [
        {
          id: '1',
          stage: 'manager_review',
          approver: '2',
          approver_name: 'Project Manager',
          status: 'approved',
          timestamp: '2023-05-25T10:00:00Z'
        }
      ],
      signature_status: {
        total_required: 1,
        completed: 1,
        pending: [],
        last_signed_at: '2023-06-01T10:00:00Z'
      },
      created_at: '2023-05-20T09:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  async getContracts(filters?: ContractFilters & { page?: number; pageSize?: number }): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;

    let contracts = this.mockContracts.filter(c => c.tenant_id === user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      contracts = contracts.filter(c => c.assigned_to === user.id || c.created_by === user.id);
    }

    // Apply filters
    if (filters) {
      if (filters.status) {
        contracts = contracts.filter(c => c.status === filters.status);
      }
      if (filters.type) {
        contracts = contracts.filter(c => c.type === filters.type);
      }
      if (filters.customer_id) {
        contracts = contracts.filter(c => c.customer_id === filters.customer_id);
      }
      if (filters.assigned_to) {
        contracts = contracts.filter(c => c.assigned_to === filters.assigned_to);
      }
      if (filters.priority) {
        contracts = contracts.filter(c => c.priority === filters.priority);
      }
      if (filters.auto_renew !== undefined) {
        contracts = contracts.filter(c => c.auto_renew === filters.auto_renew);
      }
      if (filters.compliance_status) {
        contracts = contracts.filter(c => c.compliance_status === filters.compliance_status);
      }
      if (filters.date_from && filters.date_to) {
        contracts = contracts.filter(c => {
          const startDate = new Date(c.start_date);
          const filterStart = new Date(filters.date_from!);
          const filterEnd = new Date(filters.date_to!);
          return startDate >= filterStart && startDate <= filterEnd;
        });
      }
      if (filters.value_min !== undefined && filters.value_max !== undefined) {
        contracts = contracts.filter(c => 
          c.value >= filters.value_min! && c.value <= filters.value_max!
        );
      }
      if (filters.tags && filters.tags.length > 0) {
        contracts = contracts.filter(c => 
          filters.tags!.some(tag => c.tags.includes(tag))
        );
      }
      if (filters.expiring_soon) {
        const now = new Date();
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        contracts = contracts.filter(c => {
          const endDate = new Date(c.end_date);
          return endDate > now && endDate <= thirtyDaysLater;
        });
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        contracts = contracts.filter(c => 
          c.title.toLowerCase().includes(search) ||
          c.content?.toLowerCase().includes(search) ||
          c.parties.some(p => p.name.toLowerCase().includes(search)) ||
          c.tags.some(tag => tag.toLowerCase().includes(search))
        );
      }
    }

    // Apply pagination
    const total = contracts.length;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;
    const paginatedContracts = contracts.slice(offset, offset + pageSize);

    // Return paginated response
    return {
      data: paginatedContracts,
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  async getContract(id: string): Promise<Contract> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const contract = this.mockContracts.find(c => 
      c.id === id && c.tenant_id === user.tenant_id
    );

    if (!contract) {
      throw new Error('Contract not found');
    }

    // Check permissions
    if (user.role === 'agent' && contract.assigned_to !== user.id && contract.created_by !== user.id) {
      throw new Error('Access denied');
    }

    return contract;
  }

  async createContract(contractData: Omit<Contract, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'version' | 'approvalHistory' | 'signatureStatus'>): Promise<Contract> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const newContract: Contract = {
      ...contractData,
      id: Date.now().toString(),
      tenant_id: user.tenant_id,
      version: 1,
      approval_history: [],
      signature_status: {
        total_required: contractData.parties.filter(p => p.signature_required).length,
        completed: 0,
        pending: contractData.parties.filter(p => p.signature_required).map(p => p.email)
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.mockContracts.push(newContract);
    return newContract;
  }

  async updateContract(id: string, updates: Partial<Contract>): Promise<Contract> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const contractIndex = this.mockContracts.findIndex(c => 
      c.id === id && c.tenant_id === user.tenant_id
    );

    if (contractIndex === -1) {
      throw new Error('Contract not found');
    }

    // Check permissions
    if (user.role === 'agent' && 
        this.mockContracts[contractIndex].assigned_to !== user.id && 
        this.mockContracts[contractIndex].created_by !== user.id) {
      throw new Error('Access denied');
    }

    this.mockContracts[contractIndex] = {
      ...this.mockContracts[contractIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    return this.mockContracts[contractIndex];
  }

  async deleteContract(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('delete')) {
      throw new Error('Insufficient permissions');
    }

    const contractIndex = this.mockContracts.findIndex(c => 
      c.id === id && c.tenant_id === user.tenant_id
    );

    if (contractIndex === -1) {
      throw new Error('Contract not found');
    }

    this.mockContracts.splice(contractIndex, 1);
  }

  async getTemplates(): Promise<ContractTemplate[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.mockTemplates.filter(t => t.is_active);
  }

  async getTemplate(id: string): Promise<ContractTemplate> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const template = this.mockTemplates.find(t => t.id === id);
    if (!template) {
      throw new Error('Template not found');
    }
    
    return template;
  }

  async approveContract(id: string, stage: string, comments?: string): Promise<Contract> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const contract = await this.getContract(id);
    
    const approvalRecord: ApprovalRecord = {
      id: Date.now().toString(),
      stage,
      approver: user.id,
      approver_name: user.name,
      status: 'approved',
      comments,
      timestamp: new Date().toISOString()
    };

    const updatedContract = await this.updateContract(id, {
      approval_history: [...contract.approval_history, approvalRecord],
      approval_stage: stage === 'final_approval' ? 'approved' : 'pending_approval',
      status: stage === 'final_approval' ? 'active' : contract.status
    });

    return updatedContract;
  }

  async rejectContract(id: string, stage: string, comments: string): Promise<Contract> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const contract = await this.getContract(id);
    
    const approvalRecord: ApprovalRecord = {
      id: Date.now().toString(),
      stage,
      approver: user.id,
      approver_name: user.name,
      status: 'rejected',
      comments,
      timestamp: new Date().toISOString()
    };

    const updatedContract = await this.updateContract(id, {
      approval_history: [...contract.approval_history, approvalRecord],
      approval_stage: 'rejected',
      status: 'draft'
    });

    return updatedContract;
  }

  async requestSignature(contractId: string, signerEmail: string): Promise<DigitalSignature> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const signature: DigitalSignature = {
      id: Date.now().toString(),
      contract_id: contractId,
      signer_id: 'external',
      signer_name: 'External Signer',
      signer_email: signerEmail,
      signature_url: '',
      ip_address: '192.168.1.1',
      timestamp: new Date().toISOString(),
      status: 'pending',
      verification_code: Math.random().toString(36).substring(2, 8).toUpperCase()
    };

    return signature;
  }

  async getAnalytics(): Promise<ContractAnalytics> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let contracts = this.mockContracts.filter(c => c.tenant_id === user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      contracts = contracts.filter(c => c.assigned_to === user.id || c.created_by === user.id);
    }

    const total_contracts = contracts.length;
    const active_contracts = contracts.filter(c => c.status === 'active').length;
    const pending_approvals = contracts.filter(c => c.status === 'pending_approval').length;
    const expiring_contracts = contracts.filter(c => {
      const endDate = new Date(c.end_date);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30 && diffDays > 0;
    }).length;

    const total_value = contracts.reduce((sum, c) => sum + c.value, 0);
    const average_approval_time = 3.5; // Mock average in days
    const renewal_rate = 85; // Mock percentage
    const compliance_rate = 92; // Mock percentage

    const status_distribution = [
      { status: 'active', count: active_contracts, percentage: (active_contracts / total_contracts) * 100 },
      { status: 'draft', count: contracts.filter(c => c.status === 'draft').length, percentage: (contracts.filter(c => c.status === 'draft').length / total_contracts) * 100 },
      { status: 'pending_approval', count: pending_approvals, percentage: (pending_approvals / total_contracts) * 100 },
      { status: 'expired', count: contracts.filter(c => c.status === 'expired').length, percentage: (contracts.filter(c => c.status === 'expired').length / total_contracts) * 100 }
    ];

    const type_distribution = [
      { type: 'service_agreement', count: contracts.filter(c => c.type === 'service_agreement').length, value: contracts.filter(c => c.type === 'service_agreement').reduce((sum, c) => sum + c.value, 0) },
      { type: 'nda', count: contracts.filter(c => c.type === 'nda').length, value: contracts.filter(c => c.type === 'nda').reduce((sum, c) => sum + c.value, 0) },
      { type: 'purchase_order', count: contracts.filter(c => c.type === 'purchase_order').length, value: contracts.filter(c => c.type === 'purchase_order').reduce((sum, c) => sum + c.value, 0) }
    ];

    const monthly_stats = [
      { month: 'Jan 2024', created: 2, signed: 1, expired: 0, value: 175000 },
      { month: 'Feb 2024', created: 1, signed: 0, expired: 1, value: 25000 },
      { month: 'Mar 2024', created: 0, signed: 1, expired: 0, value: 0 }
    ];

    return {
      total_contracts,
      active_contracts,
      pending_approvals,
      expiring_contracts,
      total_value,
      average_approval_time,
      renewal_rate,
      compliance_rate,
      monthly_stats,
      status_distribution,
      type_distribution
    };
  }



  async toggleAutoRenewal(contractId: string, autoRenew: boolean): Promise<Contract> {
    return this.updateContract(contractId, { auto_renew: autoRenew });
  }

  async getContractTypes(): Promise<string[]> {
    return ['service_agreement', 'nda', 'purchase_order', 'employment', 'custom'];
  }

  async getContractStatuses(): Promise<string[]> {
    return ['draft', 'pending_approval', 'active', 'renewed', 'expired'];
  }

  async getPriorities(): Promise<string[]> {
    return ['low', 'medium', 'high', 'urgent'];
  }

  async getComplianceStatuses(): Promise<string[]> {
    return ['compliant', 'non_compliant', 'pending_review'];
  }

  // Interface compliance methods - aliases for existing methods
  async getContractAnalytics(): Promise<Record<string, unknown>> {
    return this.getAnalytics();
  }

  // Template Management Methods
  async createTemplate(templateData: Omit<ContractTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<ContractTemplate> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const newTemplate: ContractTemplate = {
      ...templateData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.mockTemplates.push(newTemplate);
    return newTemplate;
  }

  async updateTemplate(id: string, templateData: Partial<ContractTemplate>): Promise<ContractTemplate> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const index = this.mockTemplates.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Template not found');
    }

    this.mockTemplates[index] = {
      ...this.mockTemplates[index],
      ...templateData,
      updated_at: new Date().toISOString()
    };

    return this.mockTemplates[index];
  }

  async deleteTemplate(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const index = this.mockTemplates.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Template not found');
    }

    this.mockTemplates.splice(index, 1);
  }

  // Digital Signature Methods
  async getSignatures(contractId: string): Promise<DigitalSignature[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock signatures data
    return [
      {
        id: '1',
        contract_id: contractId,
        signer_id: 'user1',
        signer_name: 'John Doe',
        signer_email: 'john@example.com',
        signature_url: '/signatures/signature1.png',
        ip_address: '192.168.1.100',
        timestamp: new Date().toISOString(),
        status: 'completed',
        verification_code: 'ABC123'
      }
    ];
  }

  async signContract(contractId: string, signatureData: { signature: string; comments?: string }): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 800));
    // Mock implementation
  }

  async resendSignatureRequest(signatureId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Mock implementation
  }

  async cancelSignatureRequest(signatureId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Mock implementation
  }

  // Document Generation Methods
  async generateContractPreview(templateId: string, variables: Record<string, string>): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const template = await this.getTemplate(templateId);
    let content = template.content;

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    });

    return content;
  }

  async generateContractDocument(contractId: string, templateId: string, variables: Record<string, string>): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock PDF generation
    const documentUrl = `/api/contracts/${contractId}/document.pdf`;
    return documentUrl;
  }

  async getContractDocument(contractId: string): Promise<{ url: string } | null> {
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock existing document check
    return Math.random() > 0.5 ? { url: `/api/contracts/${contractId}/document.pdf` } : null;
  }

  // Contract Versioning Methods
  async getContractVersions(contractId: string): Promise<Record<string, unknown>[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock versions data
    return [
      {
        id: '1',
        version: 1,
        title: 'Initial Contract',
        description: 'First version of the contract',
        changes: 'Initial contract creation',
        created_by: 'user1',
        created_by_name: 'John Doe',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'archived',
        document_url: `/api/contracts/${contractId}/v1.pdf`,
        is_current_version: false
      },
      {
        id: '2',
        version: 2,
        title: 'Updated Terms',
        description: 'Updated payment terms and conditions',
        changes: 'Modified payment schedule and added new clauses',
        created_by: 'user2',
        created_by_name: 'Jane Smith',
        created_at: new Date().toISOString(),
        status: 'active',
        document_url: `/api/contracts/${contractId}/v2.pdf`,
        is_current_version: true
      }
    ];
  }

  async createContractVersion(versionData: Omit<ContractVersion, 'id' | 'created_at'>): Promise<ContractVersion> {
    await new Promise(resolve => setTimeout(resolve, 800));
    // Mock implementation
    return {
      id: Date.now().toString(),
      version: 3,
      ...versionData,
      created_at: new Date().toISOString(),
      status: 'draft',
      is_current_version: false
    };
  }

  async activateContractVersion(contractId: string, versionId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Mock implementation
  }

  async archiveContractVersion(versionId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Mock implementation
  }

  // Compliance Tracking Methods
  async getComplianceItems(contractId: string): Promise<ComplianceItem[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock compliance items
    return [
      {
        id: '1',
        title: 'GDPR Compliance Review',
        description: 'Ensure contract complies with GDPR requirements',
        category: 'regulatory',
        status: 'compliant',
        priority: 'high',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assigned_to: 'user1',
        assigned_to_name: 'Legal Team',
        evidence: 'GDPR compliance checklist completed',
        notes: 'All data processing clauses reviewed and approved',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'user2',
        created_by_name: 'Jane Smith'
      },
      {
        id: '2',
        title: 'Financial Audit Requirements',
        description: 'Verify financial terms meet audit standards',
        category: 'financial',
        status: 'pending_review',
        priority: 'medium',
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assigned_to: 'user3',
        assigned_to_name: 'Finance Team',
        evidence: '',
        notes: 'Waiting for finance team review',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'user1',
        created_by_name: 'John Doe'
      }
    ];
  }

  async createComplianceItem(itemData: Omit<ComplianceItem, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'created_by_name'>): Promise<ComplianceItem> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    return {
      id: Date.now().toString(),
      ...itemData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: user?.id || '',
      created_by_name: user?.name || ''
    };
  }

  async updateComplianceItem(itemId: string, itemData: Partial<Omit<ComplianceItem, 'id' | 'created_at' | 'created_by' | 'created_by_name'>>): Promise<ComplianceItem> {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Mock implementation
    return {
      id: itemId,
      title: itemData.title || '',
      description: itemData.description || '',
      category: itemData.category || 'other',
      status: itemData.status || 'pending_review',
      priority: itemData.priority || 'medium',
      due_date: itemData.due_date || new Date().toISOString(),
      assigned_to: itemData.assigned_to || '',
      assigned_to_name: itemData.assigned_to_name || '',
      evidence: itemData.evidence || '',
      notes: itemData.notes || '',
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      created_by: '',
      created_by_name: ''
    };
  }

  async deleteComplianceItem(itemId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Mock implementation
  }

  // Renewal Management Methods
  async getRenewalReminders(contractId: string): Promise<RenewalReminder[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock renewal reminders
    return [
      {
        id: '1',
        contract_id: contractId,
        contract_title: 'Sample Contract',
        reminder_date: new Date().toISOString(),
        days_until_expiry: 30,
        status: 'pending',
        recipients: ['manager@company.com', 'legal@company.com'],
        message: 'Contract renewal required in 30 days',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        contract_id: contractId,
        contract_title: 'Sample Contract',
        reminder_date: new Date().toISOString(),
        days_until_expiry: 7,
        status: 'sent',
        recipients: ['manager@company.com'],
        message: 'Urgent: Contract expires in 7 days',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  async createRenewalReminder(contractId: string, reminderData: Omit<RenewalReminder, 'id' | 'created_at'>): Promise<RenewalReminder> {
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      id: Date.now().toString(),
      contract_id: contractId,
      ...reminderData,
      created_at: new Date().toISOString()
    };
  }

  async deleteRenewalReminder(reminderId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Mock implementation
  }

  async renewContract(contractId: string, renewalData: Partial<Contract>): Promise<Contract> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock contract renewal
    return {
      id: Date.now().toString(),
      title: renewalData.title || '',
      description: renewalData.description,
      type: renewalData.type || 'service_agreement',
      status: 'active',
      customer_id: renewalData.customer_id || '',
      parties: renewalData.parties || [],
      value: renewalData.value || 0,
      total_value: renewalData.total_value || renewalData.value || 0,
      currency: renewalData.currency || 'USD',
      start_date: renewalData.start_date || new Date().toISOString().split('T')[0],
      end_date: renewalData.end_date || '',
      auto_renew: renewalData.auto_renew || false,
      approval_history: renewalData.approval_history || [],
      compliance_status: renewalData.compliance_status || 'pending_review',
      created_by: renewalData.created_by || '',
      tags: renewalData.tags || [],
      priority: renewalData.priority || 'medium',
      reminder_days: renewalData.reminder_days || [],
      signature_status: renewalData.signature_status || { total_required: 0, completed: 0, pending: [] },
      attachments: renewalData.attachments || [],
      tenant_id: renewalData.tenant_id || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: renewalData.version || 1
    };
  }

  // Audit Trail Methods
  async getAuditTrail(contractId: string, filters: AuditTrailFilters = {}): Promise<AuditTrailEntry[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock audit trail data
    const mockEntries: AuditTrailEntry[] = [
      {
        id: '1',
        action: 'Contract Created',
        action_type: 'create',
        description: 'Contract was created with initial terms',
        user_id: 'user1',
        user_name: 'John Doe',
        user_role: 'Contract Manager',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        changes: [
          { field: 'title', old_value: null, new_value: 'Service Agreement' },
          { field: 'value', old_value: null, new_value: 50000 }
        ]
      },
      {
        id: '2',
        action: 'Contract Updated',
        action_type: 'update',
        description: 'Payment terms were modified',
        user_id: 'user2',
        user_name: 'Jane Smith',
        user_role: 'Legal Advisor',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        ip_address: '192.168.1.101',
        changes: [
          { field: 'payment_terms', old_value: 'Net 30', new_value: 'Net 15' }
        ]
      },
      {
        id: '3',
        action: 'Contract Signed',
        action_type: 'sign',
        description: 'Contract was digitally signed by customer',
        user_id: 'customer1',
        user_name: 'Customer Rep',
        user_role: 'Customer',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        ip_address: '203.0.113.1'
      }
    ];

    // Apply filters
    let filteredEntries = mockEntries;

    if (filters.action_type) {
      filteredEntries = filteredEntries.filter(e => e.action_type === filters.action_type as AuditTrailEntry['action_type']);
    }

    if (filters.search_term) {
      filteredEntries = filteredEntries.filter(e =>
        e.action.toLowerCase().includes(filters.search_term!.toLowerCase()) ||
        e.description.toLowerCase().includes(filters.search_term!.toLowerCase())
      );
    }

    return filteredEntries;
  }

  async exportAuditTrail(contractId: string, filters: AuditTrailFilters = {}): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const entries = await this.getAuditTrail(contractId, filters);

    // Generate CSV content
    const headers = ['Timestamp', 'Action', 'User', 'Role', 'Description', 'IP Address'];
    const csvContent = [
      headers.join(','),
      ...entries.map(entry => [
        entry.timestamp,
        entry.action,
        entry.user_name,
        entry.user_role,
        `"${entry.description}"`,
        entry.ip_address || ''
      ].join(','))
    ].join('\r\n');

    return csvContent;
  }

  // Approval Workflow Methods
  async getApprovalWorkflow(contractId: string): Promise<ApprovalWorkflowStep[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock approval workflow
    return [
      {
        id: '1',
        stepNumber: 1,
        title: 'Legal Review',
        description: 'Review contract for legal compliance',
        approverRole: 'Legal Team',
        approverName: 'Legal Department',
        approverId: 'legal1',
        status: 'approved',
        isRequired: true,
        approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        comments: 'Legal terms reviewed and approved',
        canApprove: false
      },
      {
        id: '2',
        stepNumber: 2,
        title: 'Financial Approval',
        description: 'Approve contract value and payment terms',
        approverRole: 'Finance Manager',
        approverName: 'Finance Team',
        approverId: 'finance1',
        status: 'pending',
        isRequired: true,
        canApprove: true
      },
      {
        id: '3',
        stepNumber: 3,
        title: 'Executive Approval',
        description: 'Final executive approval for high-value contracts',
        approverRole: 'Executive',
        approverName: 'CEO',
        approverId: 'exec1',
        status: 'pending',
        isRequired: false,
        canApprove: false
      }
    ];
  }

  async getApprovalRecords(contractId: string): Promise<ApprovalRecord[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock approval records
    return [
      {
        id: '1',
        stage: 'Legal Review',
        approver: 'legal1',
        approverName: 'Legal Department',
        status: 'approved',
        comments: 'All legal requirements met. Contract approved.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  async approveContractStep(contractId: string, stepId: string, approvalData: ApprovalData): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Mock implementation
  }

  async rejectContractStep(contractId: string, stepId: string, rejectionData: RejectionData): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Mock implementation
  }

  async requestContractApproval(contractId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Mock implementation
  }

  // Attachment Management Methods
  async getContractAttachments(contractId: string): Promise<ContractAttachmentDetail[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock attachments
    return [
      {
        id: '1',
        fileName: 'contract_v1.pdf',
        originalName: 'Service Agreement v1.pdf',
        fileSize: 2048576, // 2MB
        fileType: 'application/pdf',
        category: 'contract_document',
        description: 'Main contract document',
        uploadedBy: 'user1',
        uploadedByName: 'John Doe',
        uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        downloadUrl: `/api/contracts/${contractId}/attachments/contract_v1.pdf`,
        previewUrl: `/api/contracts/${contractId}/attachments/contract_v1.pdf/preview`,
        isPublic: false,
        version: 1
      },
      {
        id: '2',
        fileName: 'supporting_docs.zip',
        originalName: 'Supporting Documents.zip',
        fileSize: 5242880, // 5MB
        fileType: 'application/zip',
        category: 'supporting_document',
        description: 'Additional supporting documentation',
        uploadedBy: 'user2',
        uploadedByName: 'Jane Smith',
        uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        downloadUrl: `/api/contracts/${contractId}/attachments/supporting_docs.zip`,
        isPublic: true
      }
    ];
  }

  async uploadContractAttachment(contractId: string, attachmentData: AttachmentUploadData): Promise<ContractAttachmentDetail[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock file upload
    return attachmentData.files.map((file: File) => ({
      id: Date.now().toString() + Math.random(),
      fileName: file.name.replace(/[^a-zA-Z0-9.-]/g, '_'),
      originalName: file.name,
      fileSize: file.size,
      fileType: file.type,
      category: attachmentData.category,
      description: attachmentData.description,
      uploadedBy: 'current_user',
      uploadedByName: 'Current User',
      uploadedAt: new Date().toISOString(),
      downloadUrl: `/api/contracts/${contractId}/attachments/${file.name}`,
      isPublic: attachmentData.isPublic
    }));
  }

  async deleteContractAttachment(attachmentId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Mock implementation
  }

  /**
   * Get contract statistics
   * Returns aggregated stats for dashboard/state card display
   */
  async getContractStats(filters?: ContractFilters): Promise<{
    total: number;
    active: number;
    expiring: number;
    totalValue: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  }> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    // Get contracts using the paginated getContracts method
    const contractsResponse = await this.getContracts(filters);
    const contracts = contractsResponse.data || [];
    
    // Get expiring contracts
    const expiringContracts = contracts.filter(c => {
      const endDate = new Date(c.end_date);
      const now = new Date();
      const threshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return endDate <= threshold && endDate >= now;
    });

    // Build statistics
    const stats = {
      total: contracts.length,
      active: contracts.filter((c) => c.status === 'active').length,
      expiring: expiringContracts.length,
      totalValue: contracts.reduce((sum, c) => sum + (c.value || 0), 0),
      byStatus: {} as Record<string, number>,
      byType: {} as Record<string, number>,
    };

    // Count by status and type
    contracts.forEach((c) => {
      stats.byStatus[c.status] = (stats.byStatus[c.status] || 0) + 1;
      stats.byType[c.type] = (stats.byType[c.type] || 0) + 1;
    });

    return stats;
  }
}

export const mockContractService = new MockContractService();