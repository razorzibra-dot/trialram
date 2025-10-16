import React, { useState, useEffect } from 'react';
import { Contract, ApprovalRecord } from '@/types/contracts';
import { contractService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  GitBranch,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MessageSquare,
  Send,
  Eye,
  AlertTriangle,
  Calendar,
  ArrowRight,
  Plus,
  Edit
} from 'lucide-react';

interface ApprovalStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  approverRole: string;
  approverName?: string;
  approverId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  isRequired: boolean;
  approvedAt?: string;
  rejectedAt?: string;
  comments?: string;
  canApprove?: boolean;
}

interface ContractApprovalWorkflowProps {
  contract: Contract;
  onApprovalUpdate?: () => void;
}

const ContractApprovalWorkflow: React.FC<ContractApprovalWorkflowProps> = ({
  contract,
  onApprovalUpdate
}) => {
  const { user, hasPermission } = useAuth();
  const [approvalSteps, setApprovalSteps] = useState<ApprovalStep[]>([]);
  const [approvalRecords, setApprovalRecords] = useState<ApprovalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState<ApprovalStep | null>(null);
  const [approvalForm, setApprovalForm] = useState({
    comments: '',
    conditions: ''
  });
  const [rejectionForm, setRejectionForm] = useState({
    reason: '',
    comments: '',
    suggestions: ''
  });

  useEffect(() => {
    loadApprovalWorkflow();
    loadApprovalRecords();
  }, [contract.id]);

  const loadApprovalWorkflow = async () => {
    try {
      setLoading(true);
      const data = await contractService.getApprovalWorkflow(contract.id);
      setApprovalSteps(data);
    } catch (error) {
      toast.error('Failed to load approval workflow');
    } finally {
      setLoading(false);
    }
  };

  const loadApprovalRecords = async () => {
    try {
      const data = await contractService.getApprovalRecords(contract.id);
      setApprovalRecords(data);
    } catch (error) {
      console.error('Failed to load approval records:', error);
    }
  };

  const handleApprove = async () => {
    if (!selectedStep) return;

    try {
      await contractService.approveContractStep(contract.id, selectedStep.id, {
        comments: approvalForm.comments,
        conditions: approvalForm.conditions
      });
      toast.success('Contract step approved successfully');
      setShowApprovalModal(false);
      setApprovalForm({ comments: '', conditions: '' });
      loadApprovalWorkflow();
      loadApprovalRecords();
      onApprovalUpdate?.();
    } catch (error) {
      toast.error('Failed to approve contract step');
    }
  };

  const handleReject = async () => {
    if (!selectedStep) return;

    try {
      await contractService.rejectContractStep(contract.id, selectedStep.id, {
        reason: rejectionForm.reason,
        comments: rejectionForm.comments,
        suggestions: rejectionForm.suggestions
      });
      toast.success('Contract step rejected');
      setShowRejectModal(false);
      setRejectionForm({ reason: '', comments: '', suggestions: '' });
      loadApprovalWorkflow();
      loadApprovalRecords();
      onApprovalUpdate?.();
    } catch (error) {
      toast.error('Failed to reject contract step');
    }
  };

  const handleRequestApproval = async () => {
    try {
      await contractService.requestContractApproval(contract.id);
      toast.success('Approval request sent successfully');
      loadApprovalWorkflow();
      onApprovalUpdate?.();
    } catch (error) {
      toast.error('Failed to request approval');
    }
  };

  const openApprovalModal = (step: ApprovalStep) => {
    setSelectedStep(step);
    setShowApprovalModal(true);
  };

  const openRejectModal = (step: ApprovalStep) => {
    setSelectedStep(step);
    setShowRejectModal(true);
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'skipped':
        return <ArrowRight className="h-5 w-5 text-gray-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepBadge = (status: string) => {
    const variants = {
      approved: 'default',
      rejected: 'destructive',
      pending: 'secondary',
      skipped: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getApprovalProgress = () => {
    const totalSteps = approvalSteps.filter(step => step.isRequired).length;
    const approvedSteps = approvalSteps.filter(step => step.status === 'approved' && step.isRequired).length;
    return totalSteps > 0 ? (approvedSteps / totalSteps) * 100 : 0;
  };

  const getCurrentStep = () => {
    return approvalSteps.find(step => step.status === 'pending' && step.isRequired);
  };

  const canRequestApproval = hasPermission('manage_contracts') && contract.approval_stage === 'draft';
  const canManageWorkflow = hasPermission('manage_approval_workflows');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Approval Workflow
          </CardTitle>
          <CardDescription>
            Track and manage the contract approval process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Approval Progress */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Approval Progress</h4>
              <Badge variant={contract.approval_stage === 'approved' ? 'default' : 'secondary'}>
                {contract.approval_stage?.toUpperCase() || 'DRAFT'}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>
                  {approvalSteps.filter(s => s.status === 'approved' && s.isRequired).length} of{' '}
                  {approvalSteps.filter(s => s.isRequired).length} steps completed
                </span>
              </div>
              <Progress value={getApprovalProgress()} className="h-2" />
            </div>
          </div>

          {/* Current Step Alert */}
          {getCurrentStep() && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>
                    Waiting for approval from <strong>{getCurrentStep()?.approverRole}</strong>
                  </span>
                  {getCurrentStep()?.canApprove && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => openApprovalModal(getCurrentStep()!)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openRejectModal(getCurrentStep()!)}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {canRequestApproval && (
              <Button onClick={handleRequestApproval}>
                <Send className="h-4 w-4 mr-2" />
                Request Approval
              </Button>
            )}
          </div>

          {/* Approval Steps */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : approvalSteps.length === 0 ? (
            <Alert>
              <GitBranch className="h-4 w-4" />
              <AlertDescription>
                No approval workflow has been configured for this contract.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <h4 className="font-medium">Approval Steps</h4>
              <div className="space-y-3">
                {approvalSteps.map((step, index) => (
                  <Card key={step.id} className={`p-4 ${step.status === 'pending' ? 'border-yellow-200 bg-yellow-50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                          {step.stepNumber}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium">{step.title}</h5>
                            {step.isRequired && (
                              <Badge variant="outline" className="text-xs">Required</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4" />
                            <span>{step.approverRole}</span>
                            {step.approverName && (
                              <span className="text-muted-foreground">({step.approverName})</span>
                            )}
                          </div>
                          {step.comments && (
                            <div className="flex items-start gap-2 text-sm">
                              <MessageSquare className="h-4 w-4 mt-0.5" />
                              <span className="text-muted-foreground">{step.comments}</span>
                            </div>
                          )}
                          {(step.approvedAt || step.rejectedAt) && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {step.status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
                                {new Date(step.approvedAt || step.rejectedAt!).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStepIcon(step.status)}
                        {getStepBadge(step.status)}
                        {step.canApprove && step.status === 'pending' && (
                          <div className="flex gap-1 ml-2">
                            <Button size="sm" onClick={() => openApprovalModal(step)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openRejectModal(step)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Approval History */}
          {approvalRecords.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Approval History</h4>
              <div className="space-y-2">
                {approvalRecords.slice(0, 5).map((record) => (
                  <div key={record.id} className="flex items-center gap-3 p-3 border rounded">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={record.approverAvatar} />
                      <AvatarFallback>
                        {record.approverName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{record.approverName}</span>
                        <Badge variant={record.decision === 'approved' ? 'default' : 'destructive'}>
                          {record.decision.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {record.comments || `${record.decision === 'approved' ? 'Approved' : 'Rejected'} the contract`}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(record.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Modal */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Contract Step</DialogTitle>
            <DialogDescription>
              Approve "{selectedStep?.title}" for this contract.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                value={approvalForm.comments}
                onChange={(e) => setApprovalForm(prev => ({ ...prev, comments: e.target.value }))}
                placeholder="Add comments about your approval"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conditions">Conditions (Optional)</Label>
              <Textarea
                id="conditions"
                value={approvalForm.conditions}
                onChange={(e) => setApprovalForm(prev => ({ ...prev, conditions: e.target.value }))}
                placeholder="Any conditions or requirements for this approval"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Contract Step</DialogTitle>
            <DialogDescription>
              Reject "{selectedStep?.title}" and provide feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Rejection</Label>
              <Select value={rejectionForm.reason} onValueChange={(value) => setRejectionForm(prev => ({ ...prev, reason: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incomplete_information">Incomplete Information</SelectItem>
                  <SelectItem value="legal_concerns">Legal Concerns</SelectItem>
                  <SelectItem value="financial_terms">Financial Terms</SelectItem>
                  <SelectItem value="compliance_issues">Compliance Issues</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejectionComments">Comments</Label>
              <Textarea
                id="rejectionComments"
                value={rejectionForm.comments}
                onChange={(e) => setRejectionForm(prev => ({ ...prev, comments: e.target.value }))}
                placeholder="Explain why you're rejecting this step"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="suggestions">Suggestions for Improvement</Label>
              <Textarea
                id="suggestions"
                value={rejectionForm.suggestions}
                onChange={(e) => setRejectionForm(prev => ({ ...prev, suggestions: e.target.value }))}
                placeholder="Provide suggestions for addressing the issues"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionForm.reason}>
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractApprovalWorkflow;
