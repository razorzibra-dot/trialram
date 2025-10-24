import React, { useState, useEffect, useCallback } from 'react';
import { Contract, ContractTemplate, ContractFormData, ContractParty } from '@/types/contracts';
import { Customer } from '@/types/crm';
import { User } from '@/types/auth';
import { contractService, customerService, userService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { notificationService } from '@/services/uiNotificationService';
import { Plus, X, FileText, Users, Calendar, DollarSign, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContractFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: Contract | null;
  onSuccess: () => void;
}

const ContractFormModal: React.FC<ContractFormModalProps> = ({
  open,
  onOpenChange,
  contract,
  onSuccess
}) => {
  const { user, tenant } = useAuth();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contract_number: '',
    type: 'service_agreement' as const,
    customer_id: '',
    customer_name: '',
    customer_contact: '',
    templateId: '',
    value: 0,
    total_value: 0,
    currency: 'USD',
    payment_terms: '',
    delivery_terms: '',
    startDate: '',
    endDate: '',
    signed_date: '',
    next_renewal_date: '',
    autoRenew: false,
    renewal_period_months: 12,
    renewalTerms: '',
    terms: '',
    approval_stage: 'draft',
    compliance_status: 'pending_review' as const,
    priority: 'medium' as const,
    reminderDays: [30, 7],
    next_reminder_date: '',
    assignedTo: '',
    content: '',
    document_path: '',
    document_url: '',
    version: 1,
    tags: [] as string[],
    parties: [] as ContractParty[],
    notes: '',
    signed_by_customer: '',
    signed_by_company: ''
  });

  const [newTag, setNewTag] = useState('');
  const [newParty, setNewParty] = useState({
    name: '',
    email: '',
    role: 'client' as const,
    signatureRequired: true
  });

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      contract_number: '',
      type: 'service_agreement',
      customer_id: '',
      customer_name: '',
      customer_contact: '',
      templateId: '',
      value: 0,
      total_value: 0,
      currency: 'USD',
      payment_terms: '',
      delivery_terms: '',
      startDate: '',
      endDate: '',
      signed_date: '',
      next_renewal_date: '',
      autoRenew: false,
      renewal_period_months: 12,
      renewalTerms: '',
      terms: '',
      approval_stage: 'draft',
      compliance_status: 'pending_review',
      priority: 'medium',
      reminderDays: [30, 7],
      next_reminder_date: '',
      assignedTo: '',
      content: '',
      document_path: '',
      document_url: '',
      version: 1,
      tags: [],
      parties: [],
      notes: '',
      signed_by_customer: '',
      signed_by_company: ''
    });
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      const [customersData, usersData] = await Promise.all([
        customerService.getCustomers(),
        userService.getUsers()
      ]);
      // Mock templates for now
      setTemplates([]);
      setCustomers(customersData);
      setUsers(usersData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load form data',
        variant: 'destructive'
      });
    }
  }, []);

  useEffect(() => {
    if (open && tenant?.tenantId) {
      loadInitialData();
      if (contract) {
        setFormData({
          title: contract.title,
          description: contract.description || '',
          contract_number: contract.contract_number || '',
          type: contract.type as Contract['type'],
          customer_id: contract.customer_id,
          customer_name: contract.customer_name || '',
          customer_contact: contract.customer_contact || '',
          templateId: contract.template_id || '',
          value: contract.value,
          total_value: contract.total_value,
          currency: contract.currency,
          payment_terms: contract.payment_terms || '',
          delivery_terms: contract.delivery_terms || '',
          startDate: contract.start_date,
          endDate: contract.end_date,
          signed_date: contract.signed_date || '',
          next_renewal_date: contract.next_renewal_date || '',
          autoRenew: contract.auto_renew,
          renewal_period_months: contract.renewal_period_months || 12,
          renewalTerms: contract.renewal_terms || '',
          terms: contract.terms || '',
          approval_stage: contract.approval_stage || 'draft',
          compliance_status: contract.compliance_status as Contract['compliance_status'],
          priority: contract.priority as Contract['priority'],
          reminderDays: contract.reminder_days,
          next_reminder_date: contract.next_reminder_date || '',
          assignedTo: contract.assigned_to || '',
          content: contract.content || '',
          document_path: contract.document_path || '',
          document_url: contract.document_url || '',
          version: contract.version,
          tags: contract.tags,
          parties: contract.parties,
          notes: contract.notes || '',
          signed_by_customer: contract.signed_by_customer || '',
          signed_by_company: contract.signed_by_company || ''
        });
      } else {
        resetForm();
      }
    }
  }, [open, contract, tenant?.tenantId, resetForm, loadInitialData]);

  const handleTemplateSelect = async (templateId: string) => {
    if (!templateId || templateId === 'none') {
      setSelectedTemplate(null);
      setFormData(prev => ({ ...prev, templateId: '', content: '' }));
      return;
    }

    try {
      // Mock template loading for now
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setSelectedTemplate(template);
        setFormData(prev => ({
          ...prev,
          templateId,
          type: template.type as Contract['type'],
          content: template.content,
          title: prev.title || template.name
        }));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load template',
        variant: 'destructive'
      });
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleAddParty = () => {
    if (newParty.name.trim() && newParty.email.trim()) {
      const party: ContractParty = {
        id: Date.now().toString(),
        name: newParty.name,
        email: newParty.email,
        role: newParty.role,
        signature_required: newParty.signatureRequired
      };
      setFormData(prev => ({
        ...prev,
        parties: [...prev.parties, party]
      }));
      setNewParty({
        name: '',
        email: '',
        role: 'client',
        signatureRequired: true
      });
    }
  };

  const handleRemoveParty = (id: string) => {
    setFormData(prev => ({
      ...prev,
      parties: prev.parties.filter(p => p.id !== id)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Contract title is required',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast({
        title: 'Error',
        description: 'Start and end dates are required',
        variant: 'destructive'
      });
      return;
    }

    if (formData.parties.length === 0) {
      toast({
        title: 'Error',
        description: 'At least one party is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      
      const contractData = {
        ...formData,
        createdBy: user?.id || '',
        assignedTo: formData.assignedTo || user?.id || '',
        status: 'draft' as const,
        approvalStage: 'draft',
        complianceStatus: 'pending_review' as const,
        attachments: [],
        nextReminderDate: formData.reminderDays.length > 0 ? 
          new Date(new Date(formData.endDate).getTime() - formData.reminderDays[0] * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
          undefined
      };

      if (contract) {
        await contractService.updateContract(contract.id, contractData);
        toast({
          title: 'Success',
          description: 'Contract updated successfully'
        });
      } else {
        await contractService.createContract(contractData);
        toast({
          title: 'Success',
          description: 'Contract created successfully'
        });
      }
      
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: contract ? 'Failed to update contract' : 'Failed to create contract',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contract ? 'Edit Contract' : 'Create New Contract'}
          </DialogTitle>
          <DialogDescription>
            {contract ? 'Update contract details and terms' : 'Create a new contract using templates or custom content'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="parties" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Parties
              </TabsTrigger>
              <TabsTrigger value="terms" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Terms
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financial
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Contract Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter contract title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Contract Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: Contract['type']) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service_agreement">Service Agreement</SelectItem>
                      <SelectItem value="nda">Non-Disclosure Agreement</SelectItem>
                      <SelectItem value="purchase_order">Purchase Order</SelectItem>
                      <SelectItem value="employment">Employment Contract</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contract_number">Contract Number</Label>
                  <Input
                    id="contract_number"
                    value={formData.contract_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, contract_number: e.target.value }))}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_id">Customer *</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => {
                      const customer = customers.find(c => c.id === value);
                      setFormData(prev => ({
                        ...prev,
                        customer_id: value,
                        customer_name: customer?.company_name || '',
                        customer_contact: customer?.contact_name || ''
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.company_name} - {customer.contact_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the contract"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template">Template (Optional)</Label>
                <Select
                  value={formData.templateId}
                  onValueChange={handleTemplateSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Template</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplate && (
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Contract Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter contract content or select a template"
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>

            <TabsContent value="parties" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contract Parties</CardTitle>
                  <CardDescription>
                    Add all parties involved in this contract
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Existing Parties */}
                  {formData.parties.map((party) => (
                    <div key={party.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{party.name}</div>
                        <div className="text-sm text-muted-foreground">{party.email}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{party.role}</Badge>
                          {party.signature_required && (
                            <Badge variant="secondary">Signature Required</Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveParty(party.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Add New Party */}
                  <div className="grid grid-cols-2 gap-4 p-4 border-2 border-dashed rounded-lg">
                    <div className="space-y-2">
                      <Label>Party Name</Label>
                      <Input
                        value={newParty.name}
                        onChange={(e) => setNewParty(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter party name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newParty.email}
                        onChange={(e) => setNewParty(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select
                        value={newParty.role}
                        onValueChange={(value: ContractParty['role']) => setNewParty(prev => ({ ...prev, role: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="vendor">Vendor</SelectItem>
                          <SelectItem value="partner">Partner</SelectItem>
                          <SelectItem value="internal">Internal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="signatureRequired"
                        checked={newParty.signatureRequired}
                        onCheckedChange={(checked) => 
                          setNewParty(prev => ({ ...prev, signatureRequired: !!checked }))
                        }
                      />
                      <Label htmlFor="signatureRequired">Signature Required</Label>
                    </div>
                    <div className="col-span-2">
                      <Button
                        type="button"
                        onClick={handleAddParty}
                        className="w-full"
                        disabled={!newParty.name.trim() || !newParty.email.trim()}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Party
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="terms" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoRenew"
                  checked={formData.autoRenew}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, autoRenew: !!checked }))
                  }
                />
                <Label htmlFor="autoRenew">Enable Auto-Renewal</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signed_date">Signed Date</Label>
                  <Input
                    id="signed_date"
                    type="date"
                    value={formData.signed_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, signed_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="renewal_period_months">Renewal Period (Months)</Label>
                  <Input
                    id="renewal_period_months"
                    type="number"
                    min="1"
                    value={formData.renewal_period_months}
                    onChange={(e) => setFormData(prev => ({ ...prev, renewal_period_months: parseInt(e.target.value) || 12 }))}
                    placeholder="12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="renewalTerms">Renewal Terms</Label>
                <Textarea
                  id="renewalTerms"
                  value={formData.renewalTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, renewalTerms: e.target.value }))}
                  placeholder="Describe renewal terms and conditions"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms">Contract Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                  placeholder="Enter detailed terms and conditions"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signed_by_customer">Signed by Customer</Label>
                  <Input
                    id="signed_by_customer"
                    value={formData.signed_by_customer}
                    onChange={(e) => setFormData(prev => ({ ...prev, signed_by_customer: e.target.value }))}
                    placeholder="Customer signatory name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signed_by_company">Signed by Company</Label>
                  <Input
                    id="signed_by_company"
                    value={formData.signed_by_company}
                    onChange={(e) => setFormData(prev => ({ ...prev, signed_by_company: e.target.value }))}
                    placeholder="Company signatory name"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Contract Value</Label>
                  <Input
                    id="value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      value: parseFloat(e.target.value) || 0,
                      total_value: parseFloat(e.target.value) || 0
                    }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_terms">Payment Terms</Label>
                  <Input
                    id="payment_terms"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
                    placeholder="Net 30, Net 60, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_terms">Delivery Terms</Label>
                  <Input
                    id="delivery_terms"
                    value={formData.delivery_terms}
                    onChange={(e) => setFormData(prev => ({ ...prev, delivery_terms: e.target.value }))}
                    placeholder="FOB, CIF, etc."
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: Contract['priority']) => setFormData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Select
                    value={formData.assignedTo}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, assignedTo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="approval_stage">Approval Stage</Label>
                  <Select
                    value={formData.approval_stage}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, approval_stage: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compliance_status">Compliance Status</Label>
                  <Select
                    value={formData.compliance_status}
                    onValueChange={(value: string) => setFormData(prev => ({ ...prev, compliance_status: value as 'pending_review' | 'compliant' | 'non_compliant' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending_review">Pending Review</SelectItem>
                      <SelectItem value="compliant">Compliant</SelectItem>
                      <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="document_path">Document Path</Label>
                  <Input
                    id="document_path"
                    value={formData.document_path}
                    onChange={(e) => setFormData(prev => ({ ...prev, document_path: e.target.value }))}
                    placeholder="Path to contract document"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    type="number"
                    min="1"
                    value={formData.version}
                    onChange={(e) => setFormData(prev => ({ ...prev, version: parseInt(e.target.value) || 1 }))}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this contract"
                  rows={3}
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" onClick={handleAddTag} disabled={!newTag.trim()}>
                    Add
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : contract ? 'Update Contract' : 'Create Contract'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContractFormModal;

