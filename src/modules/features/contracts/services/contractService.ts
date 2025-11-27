/**
 * Contract Service (Module-level)
 * Business logic for contract management operations
 *
 * ARCHITECTURE:
 * This service delegates all core operations to the Service Factory pattern,
 * which provides automatic switching between mock (development) and Supabase
 * (production) backends based on VITE_API_MODE environment variable.
 */

import { BaseService } from '@/modules/core/services/BaseService';
import { Contract, ContractFormData, ContractFilters, ContractTemplate, ApprovalWorkflowStep, ApprovalData, RejectionData } from '@/types/contracts';
import { PaginatedResponse } from '@/modules/core/types';
import { contractService as factoryContractService } from '@/services/serviceFactory';

export interface ContractStats {
  total: number;
  active: number;
  pending_approval: number;
  expired: number;
  terminated: number;
  draft: number;
  renewed: number;
  totalValue: number;
  averageValue: number;
  expiringSoon: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface ContractValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ContractService extends BaseService {
  /**
   * Get contracts with filtering and pagination
   * Delegates to factory-routed backend service
   */
  async getContracts(filters: ContractFilters = {}): Promise<PaginatedResponse<Contract>> {
    try {
      return await factoryContractService.getContracts(filters);
    } catch (error) {
      this.handleError('Failed to fetch contracts', error);
      throw error;
    }
  }

  /**
   * Get a single contract by ID
   * Delegates to factory-routed backend service
   */
  async getContract(id: string): Promise<Contract> {
    try {
      return await factoryContractService.getContract(id);
    } catch (error) {
      this.handleError(`Failed to fetch contract ${id}`, error);
      throw error;
    }
  }

  /**
   * Create a new contract
   * Delegates to factory-routed backend service
   */
  async createContract(data: ContractFormData): Promise<Contract> {
    try {
      return await factoryContractService.createContract(data);
    } catch (error) {
      this.handleError('Failed to create contract', error);
      throw error;
    }
  }

  /**
   * Update an existing contract
   */
  async updateContract(id: string, data: Partial<ContractFormData>): Promise<Contract> {
    try {
      return await factoryContractService.updateContract(id, data);
    } catch (error) {
      this.handleError(`Failed to update contract ${id}`, error);
      throw error;
    }
  }

  /**
   * Delete a contract
   */
  async deleteContract(id: string): Promise<void> {
    try {
      await factoryContractService.deleteContract(id);
    } catch (error) {
      this.handleError(`Failed to delete contract ${id}`, error);
      throw error;
    }
  }

  /**
   * Get contracts by customer ID
   */
  async getContractsByCustomer(customerId: string, filters: ContractFilters = {}): Promise<PaginatedResponse<Contract>> {
    try {
      return await factoryContractService.getContractsByCustomer(customerId, filters);
    } catch (error) {
      this.handleError(`Failed to fetch contracts for customer ${customerId}`, error);
      throw error;
    }
  }

  /**
   * Get contract statistics
   */
  async getContractStats(): Promise<ContractStats> {
    try {
      return await factoryContractService.getContractStats();
    } catch (error) {
      this.handleError('Failed to fetch contract statistics', error);
      throw error;
    }
  }

  /**
   * Get expiring contracts
   */
  async getExpiringContracts(days: number = 30): Promise<PaginatedResponse<Contract>> {
    try {
      return await factoryContractService.getExpiringContracts(days);
    } catch (error) {
      this.handleError('Failed to fetch expiring contracts', error);
      throw error;
    }
  }

  /**
   * Get contracts due for renewal
   */
  async getContractsDueForRenewal(days: number = 30): Promise<PaginatedResponse<Contract>> {
    try {
      return await factoryContractService.getContractsDueForRenewal(days);
    } catch (error) {
      this.handleError('Failed to fetch contracts due for renewal', error);
      throw error;
    }
  }

  /**
   * Update contract status
   */
  async updateContractStatus(id: string, status: string): Promise<Contract> {
    try {
      return await factoryContractService.updateContractStatus(id, status);
    } catch (error) {
      this.handleError(`Failed to update contract status for ${id}`, error);
      throw error;
    }
  }

  /**
   * Approve contract
   */
  async approveContract(id: string, approvalData: { stage: string; comments?: string }): Promise<Contract> {
    try {
      const contract = await this.getContract(id);

      // Update approval history
      const approvalRecord = {
        id: Date.now().toString(),
        stage: approvalData.stage,
        approver: 'current_user', // Would get from auth context
        status: 'approved' as const,
        comments: approvalData.comments,
        timestamp: new Date().toISOString(),
      };

      const updatedContract = await this.updateContract(id, {
        approval_history: [...(contract.approval_history || []), approvalRecord],
        approval_stage: approvalData.stage,
      });

      // If final approval, activate the contract
      if (approvalData.stage === 'final_approval') {
        await this.updateContractStatus(id, 'active');
      }

      return updatedContract;
    } catch (error) {
      this.handleError(`Failed to approve contract ${id}`, error);
      throw error;
    }
  }

  /**
   * Export contracts
   */
  async exportContracts(format: 'csv' | 'json' = 'csv'): Promise<string> {
    try {
      return await factoryContractService.exportContracts(format);
    } catch (error) {
      this.handleError('Failed to export contracts', error);
      throw error;
    }
  }

  /**
   * Validate contract data
   */
  async validateContractData(data: ContractFormData): Promise<ContractValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!data.title?.trim()) errors.push('Title is required');
    if (!data.customer_id) errors.push('Customer is required');
    if (!data.type) errors.push('Contract type is required');
    if (!data.start_date) errors.push('Start date is required');
    if (!data.end_date) errors.push('End date is required');

    // Date validation
    if (data.start_date && data.end_date) {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      if (endDate <= startDate) {
        errors.push('End date must be after start date');
      }
    }

    // Value validation
    if (data.value !== undefined && data.value < 0) {
      errors.push('Contract value cannot be negative');
    }

    // Priority validation
    if (!['low', 'medium', 'high', 'urgent'].includes(data.priority)) {
      errors.push('Invalid priority level');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get contract analytics
   */
  async getContractAnalytics(contractId: string): Promise<any> {
    try {
      const contract = await this.getContract(contractId);

      // Calculate basic metrics
      const startDate = new Date(contract.start_date);
      const endDate = new Date(contract.end_date);
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Mock analytics data
      return {
        contractId,
        metrics: {
          duration,
          valueUtilization: 85,
          renewalRate: contract.auto_renew ? 95 : 0,
          complianceScore: 92,
        },
        trends: {
          value: [contract.value * 0.2, contract.value * 0.4, contract.value * 0.7, contract.value],
          duration: [30, 60, 90, duration],
          dates: [
            startDate.toISOString().split('T')[0],
            new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000 * 0.25).toISOString().split('T')[0],
            new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000 * 0.5).toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
          ],
        },
      };
    } catch (error) {
      this.handleError(`Failed to get analytics for contract ${contractId}`, error);
      throw error;
    }
  }

  /**
   * Bulk operations
   */
  async bulkUpdateContracts(ids: string[], updates: Partial<ContractFormData>): Promise<Contract[]> {
    try {
      return await factoryContractService.bulkUpdateContracts(ids, updates);
    } catch (error) {
      this.handleError('Failed to bulk update contracts', error);
      throw error;
    }
  }

  async bulkDeleteContracts(ids: string[]): Promise<void> {
    try {
      await factoryContractService.bulkDeleteContracts(ids);
    } catch (error) {
      this.handleError('Failed to bulk delete contracts', error);
      throw error;
    }
  }

  /**
   * Get contract types
   */
  async getContractTypes(): Promise<string[]> {
    return ['service_agreement', 'nda', 'purchase_order', 'employment', 'custom'];
  }

  /**
   * Get contract statuses
   */
  async getContractStatuses(): Promise<string[]> {
    return ['draft', 'pending_approval', 'active', 'renewed', 'expired', 'terminated'];
  }

  /**
   * Get contract priorities
   */
  async getContractPriorities(): Promise<string[]> {
    return ['low', 'medium', 'high', 'urgent'];
  }

  /**
   * Template Management Methods
   */

  /**
   * Get all contract templates
   */
  async getTemplates(): Promise<ContractTemplate[]> {
    try {
      // Mock implementation - in real app would fetch from database
      return [
        {
          id: 'template-1',
          name: 'Service Agreement',
          type: 'service_agreement',
          description: 'Standard service delivery contract template',
          content: 'Service Agreement Template Content...',
          fields: [
            { id: 'field-1', name: 'customer_name', label: 'Customer Name', type: 'text', required: true },
            { id: 'field-2', name: 'service_description', label: 'Service Description', type: 'textarea', required: true },
            { id: 'field-3', name: 'start_date', label: 'Start Date', type: 'date', required: true },
            { id: 'field-4', name: 'end_date', label: 'End Date', type: 'date', required: true },
            { id: 'field-5', name: 'value', label: 'Contract Value', type: 'number', required: true },
          ],
          is_active: true,
          category: 'service',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'template-2',
          name: 'Non-Disclosure Agreement',
          type: 'nda',
          description: 'Confidentiality and non-disclosure template',
          content: 'NDA Template Content...',
          fields: [
            { id: 'field-1', name: 'party_1', label: 'Party 1', type: 'text', required: true },
            { id: 'field-2', name: 'party_2', label: 'Party 2', type: 'text', required: true },
            { id: 'field-3', name: 'effective_date', label: 'Effective Date', type: 'date', required: true },
            { id: 'field-4', name: 'duration', label: 'Duration (months)', type: 'number', required: true },
          ],
          is_active: true,
          category: 'legal',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'template-3',
          name: 'Purchase Order',
          type: 'purchase_order',
          description: 'Goods and services procurement template',
          content: 'Purchase Order Template Content...',
          fields: [
            { id: 'field-1', name: 'supplier_name', label: 'Supplier Name', type: 'text', required: true },
            { id: 'field-2', name: 'items', label: 'Items', type: 'textarea', required: true },
            { id: 'field-3', name: 'total_amount', label: 'Total Amount', type: 'number', required: true },
            { id: 'field-4', name: 'delivery_date', label: 'Delivery Date', type: 'date', required: true },
          ],
          is_active: true,
          category: 'procurement',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'template-4',
          name: 'Employment Contract',
          type: 'employment',
          description: 'Staff hiring and employment template',
          content: 'Employment Contract Template Content...',
          fields: [
            { id: 'field-1', name: 'employee_name', label: 'Employee Name', type: 'text', required: true },
            { id: 'field-2', name: 'position', label: 'Position', type: 'text', required: true },
            { id: 'field-3', name: 'salary', label: 'Salary', type: 'number', required: true },
            { id: 'field-4', name: 'start_date', label: 'Start Date', type: 'date', required: true },
            { id: 'field-5', name: 'benefits', label: 'Benefits', type: 'textarea', required: false },
          ],
          is_active: true,
          category: 'hr',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'template-5',
          name: 'Custom Contract',
          type: 'custom',
          description: 'Custom contract template',
          content: 'Custom Contract Template Content...',
          fields: [
            { id: 'field-1', name: 'party_name', label: 'Party Name', type: 'text', required: true },
            { id: 'field-2', name: 'contract_details', label: 'Contract Details', type: 'textarea', required: true },
          ],
          is_active: true,
          category: 'custom',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    } catch (error) {
      this.handleError('Failed to fetch contract templates', error);
      throw error;
    }
  }

  /**
   * Get a single contract template
   */
  async getTemplate(id: string): Promise<ContractTemplate> {
    try {
      const templates = await this.getTemplates();
      const template = templates.find(t => t.id === id);
      if (!template) {
        throw new Error(`Template with id ${id} not found`);
      }
      return template;
    } catch (error) {
      this.handleError(`Failed to fetch template ${id}`, error);
      throw error;
    }
  }

  /**
   * Create a new contract template
   */
  async createTemplate(data: Omit<ContractTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<ContractTemplate> {
    try {
      const template: ContractTemplate = {
        ...data,
        id: `template-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return template;
    } catch (error) {
      this.handleError('Failed to create contract template', error);
      throw error;
    }
  }

  /**
   * Update an existing contract template
   */
  async updateTemplate(id: string, data: Partial<ContractTemplate>): Promise<ContractTemplate> {
    try {
      const existingTemplate = await this.getTemplate(id);
      
      const updatedTemplate: ContractTemplate = {
        ...existingTemplate,
        ...data,
        updated_at: new Date().toISOString(),
      };

      return updatedTemplate;
    } catch (error) {
      this.handleError(`Failed to update template ${id}`, error);
      throw error;
    }
  }

  /**
   * Delete a contract template
   */
  async deleteTemplate(id: string): Promise<void> {
    try {
      const template = await this.getTemplate(id);
      // In a real implementation, this would delete from database
      console.log(`Template deleted: ${template.name}`);
    } catch (error) {
      this.handleError(`Failed to delete template ${id}`, error);
      throw error;
    }
  }

  /**
   * Approval Workflow Methods
   */

  /**
   * Get contract approval workflow
   */
  async getApprovalWorkflow(contractId: string): Promise<ApprovalWorkflowStep[]> {
    try {
      const contract = await this.getContract(contractId);
      
      // Define standard approval workflow
      const workflow: ApprovalWorkflowStep[] = [
        {
          id: 'step-1',
          step_number: 1,
          title: 'Legal Review',
          description: 'Legal team review of contract terms',
          approver_role: 'legal',
          approver_name: 'Legal Team',
          approver_id: 'legal-team',
          status: 'pending',
          is_required: true,
          can_approve: true,
        },
        {
          id: 'step-2',
          step_number: 2,
          title: 'Management Approval',
          description: 'Department manager approval',
          approver_role: 'manager',
          approver_name: 'Department Manager',
          approver_id: 'manager',
          status: 'pending',
          is_required: true,
          can_approve: true,
        },
        {
          id: 'step-3',
          step_number: 3,
          title: 'Executive Approval',
          description: 'Executive approval for high-value contracts',
          approver_role: 'executive',
          approver_name: 'Executive Team',
          approver_id: 'executive',
          status: 'pending',
          is_required: contract.value > 50000,
          can_approve: true,
        },
        {
          id: 'step-4',
          step_number: 4,
          title: 'Final Approval',
          description: 'Final sign-off and activation',
          approver_role: 'admin',
          approver_name: 'Administrator',
          approver_id: 'admin',
          status: 'pending',
          is_required: true,
          can_approve: true,
        },
      ];

      // Update status based on contract's current approval stage
      const currentStage = contract.approval_stage;
      if (currentStage) {
        workflow.forEach(step => {
          const stepKey = step.title.toLowerCase().replace(' ', '_');
          if (stepKey === currentStage) {
            step.status = 'pending';
          } else if (this.isStepCompleted(workflow, step.step_number, currentStage)) {
            step.status = 'approved';
          }
        });
      }

      return workflow;
    } catch (error) {
      this.handleError(`Failed to fetch approval workflow for contract ${contractId}`, error);
      throw error;
    }
  }

  /**
   * Get contract approval records
   */
  async getApprovalRecords(contractId: string): Promise<any[]> {
    try {
      const contract = await this.getContract(contractId);
      return contract.approval_history || [];
    } catch (error) {
      this.handleError(`Failed to fetch approval records for contract ${contractId}`, error);
      throw error;
    }
  }

  /**
   * Approve a contract at a specific step
   */
  async approveContractStep(contractId: string, stepId: string, approvalData: ApprovalData): Promise<Contract> {
    try {
      const contract = await this.getContract(contractId);
      const workflow = await this.getApprovalWorkflow(contractId);
      const step = workflow.find(w => w.id === stepId);

      if (!step) {
        throw new Error(`Approval step ${stepId} not found`);
      }

      // Create approval record
      const approvalRecord = {
        id: `approval-${Date.now()}`,
        stage: step.title,
        status: 'approved' as const,
        approver: approvalData.approval_notes || 'Current User',
        comments: approvalData.approval_notes,
        timestamp: new Date().toISOString(),
      };

      // Update contract approval history
      const updatedContract = await this.updateContract(contractId, {
        approval_history: [...(contract.approval_history || []), approvalRecord],
        approval_stage: step.title.toLowerCase().replace(' ', '_'),
      });

      // Check if workflow is complete
      const isWorkflowComplete = await this.isApprovalWorkflowComplete(contractId);
      if (isWorkflowComplete) {
        await this.updateContractStatus(contractId, 'active');
      }

      return updatedContract;
    } catch (error) {
      this.handleError(`Failed to approve contract step ${stepId}`, error);
      throw error;
    }
  }

  /**
   * Reject a contract at a specific step
   */
  async rejectContractStep(contractId: string, stepId: string, rejectionData: RejectionData): Promise<Contract> {
    try {
      const contract = await this.getContract(contractId);
      const workflow = await this.getApprovalWorkflow(contractId);
      const step = workflow.find(w => w.id === stepId);

      if (!step) {
        throw new Error(`Approval step ${stepId} not found`);
      }

      // Create rejection record
      const rejectionRecord = {
        id: `rejection-${Date.now()}`,
        stage: step.title,
        status: 'rejected' as const,
        approver: rejectionData.rejection_reason || 'Current User',
        comments: rejectionData.rejection_reason,
        timestamp: new Date().toISOString(),
      };

      // Update contract approval history
      const updatedContract = await this.updateContract(contractId, {
        approval_history: [...(contract.approval_history || []), rejectionRecord],
        approval_stage: 'draft', // Reset to draft for modifications
      });

      return updatedContract;
    } catch (error) {
      this.handleError(`Failed to reject contract step ${stepId}`, error);
      throw error;
    }
  }

  /**
   * Request contract approval (move to pending approval status)
   */
  async requestContractApproval(contractId: string): Promise<Contract> {
    try {
      const contract = await this.getContract(contractId);

      // Business rule: only draft contracts can be submitted for approval
      if (contract.status !== 'draft') {
        throw new Error('Only draft contracts can be submitted for approval');
      }

      // Validate contract data before submission
      const validation = await this.validateContractData(contract);
      if (!validation.isValid) {
        throw new Error(`Contract validation failed: ${validation.errors.join(', ')}`);
      }

      const updatedContract = await this.updateContractStatus(contractId, 'pending_approval');

      return updatedContract;
    } catch (error) {
      this.handleError(`Failed to request contract approval for ${contractId}`, error);
      throw error;
    }
  }

  // Private helper methods

  private isStepCompleted(workflow: ApprovalWorkflowStep[], stepOrder: number, currentStage: string): boolean {
    const stepNames = ['legal_review', 'management_approval', 'executive_approval', 'final_approval'];
    const currentIndex = stepNames.indexOf(currentStage);
    const stepIndex = stepOrder - 1;
    return currentIndex > stepIndex;
  }

  private async isApprovalWorkflowComplete(contractId: string): Promise<boolean> {
    try {
      const workflow = await this.getApprovalWorkflow(contractId);
      const requiredSteps = workflow.filter(step => step.is_required);
      const completedSteps = workflow.filter(step => step.status === 'approved');
      return completedSteps.length >= requiredSteps.length;
    } catch (error) {
      this.handleError('Failed to check workflow completion', error);
      return false;
    }
  }
}