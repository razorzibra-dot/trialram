import React, { useState, useEffect } from 'react';
import { Contract, DigitalSignature, ContractParty } from '@/types/contracts';
import { contractService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  PenTool,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  User,
  AlertCircle,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';

interface DigitalSignatureWorkflowProps {
  contract: Contract;
  onSignatureUpdate?: () => void;
}

const DigitalSignatureWorkflow: React.FC<DigitalSignatureWorkflowProps> = ({
  contract,
  onSignatureUpdate
}) => {
  const { user, hasPermission } = useAuth();
  const [signatures, setSignatures] = useState<DigitalSignature[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [selectedParty, setSelectedParty] = useState<ContractParty | null>(null);
  const [requestForm, setRequestForm] = useState({
    signerEmail: '',
    signerName: '',
    message: '',
    deadline: ''
  });
  const [signatureData, setSignatureData] = useState({
    signature: '',
    comments: ''
  });

  useEffect(() => {
    loadSignatures();
  }, [contract.id]);

  const loadSignatures = async () => {
    try {
      setLoading(true);
      const data = await contractService.getSignatures(contract.id);
      setSignatures(data);
    } catch (error) {
      console.error('Failed to load signatures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSignature = async () => {
    try {
      await contractService.requestSignature(contract.id, requestForm.signerEmail);
      toast.success('Signature request sent successfully');
      setShowRequestModal(false);
      setRequestForm({ signerEmail: '', signerName: '', message: '', deadline: '' });
      loadSignatures();
      onSignatureUpdate?.();
    } catch (error) {
      toast.error('Failed to send signature request');
    }
  };

  const handleSign = async () => {
    try {
      await contractService.signContract(contract.id, {
        signature: signatureData.signature,
        comments: signatureData.comments
      });
      toast.success('Contract signed successfully');
      setShowSignModal(false);
      setSignatureData({ signature: '', comments: '' });
      loadSignatures();
      onSignatureUpdate?.();
    } catch (error) {
      toast.error('Failed to sign contract');
    }
  };

  const handleResendRequest = async (signature: DigitalSignature) => {
    try {
      await contractService.resendSignatureRequest(signature.id);
      toast.success('Signature request resent');
      loadSignatures();
    } catch (error) {
      toast.error('Failed to resend signature request');
    }
  };

  const handleCancelRequest = async (signature: DigitalSignature) => {
    if (!confirm('Are you sure you want to cancel this signature request?')) return;

    try {
      await contractService.cancelSignatureRequest(signature.id);
      toast.success('Signature request cancelled');
      loadSignatures();
      onSignatureUpdate?.();
    } catch (error) {
      toast.error('Failed to cancel signature request');
    }
  };

  const getSignatureProgress = () => {
    if (signatures.length === 0) return 0;
    const completed = signatures.filter(s => s.status === 'completed').length;
    return (completed / signatures.length) * 100;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      pending: 'secondary',
      declined: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const canRequestSignature = hasPermission('manage_contracts') && contract.status === 'active';
  const canSign = contract.parties.some(p => p.email === user?.email && p.signature_required);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Digital Signatures
          </CardTitle>
          <CardDescription>
            Manage digital signatures for this contract
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Signature Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Signature Progress</span>
              <span>{signatures.filter(s => s.status === 'completed').length} of {signatures.length} completed</span>
            </div>
            <Progress value={getSignatureProgress()} className="h-2" />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {canRequestSignature && (
              <Button onClick={() => setShowRequestModal(true)}>
                <Send className="h-4 w-4 mr-2" />
                Request Signature
              </Button>
            )}
            {canSign && (
              <Button variant="outline" onClick={() => setShowSignModal(true)}>
                <PenTool className="h-4 w-4 mr-2" />
                Sign Contract
              </Button>
            )}
            <Button variant="outline" onClick={loadSignatures}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Signatures List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : signatures.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No signature requests have been sent for this contract yet.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {signatures.map((signature) => (
                <Card key={signature.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(signature.status)}
                      <div>
                        <div className="font-medium">{signature.signerName}</div>
                        <div className="text-sm text-muted-foreground">{signature.signerEmail}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(signature.status)}
                      {signature.status === 'pending' && canRequestSignature && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResendRequest(signature)}
                          >
                            <Mail className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelRequest(signature)}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {signature.status === 'completed' && signature.signatureUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(signature.signatureUrl, '_blank')}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {signature.status === 'completed' && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Signed on {new Date(signature.timestamp).toLocaleDateString()} at {new Date(signature.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                  {signature.verificationCode && (
                    <div className="mt-2 text-xs">
                      <span className="font-medium">Verification Code:</span> {signature.verificationCode}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Contract Parties */}
          <div className="space-y-2">
            <h4 className="font-medium">Required Signers</h4>
            <div className="space-y-2">
              {contract.parties.filter(p => p.signature_required).map((party) => {
                const signature = signatures.find(s => s.signerEmail === party.email);
                return (
                  <div key={party.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{party.name}</div>
                        <div className="text-sm text-muted-foreground">{party.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {signature ? (
                        getStatusBadge(signature.status)
                      ) : (
                        <Badge variant="outline">Not Requested</Badge>
                      )}
                      {!signature && canRequestSignature && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedParty(party);
                            setRequestForm(prev => ({
                              ...prev,
                              signerEmail: party.email,
                              signerName: party.name
                            }));
                            setShowRequestModal(true);
                          }}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Request
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Signature Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Digital Signature</DialogTitle>
            <DialogDescription>
              Send a signature request to a party for this contract.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="signerName">Signer Name</Label>
              <Input
                id="signerName"
                value={requestForm.signerName}
                onChange={(e) => setRequestForm(prev => ({ ...prev, signerName: e.target.value }))}
                placeholder="Enter signer's full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signerEmail">Signer Email</Label>
              <Input
                id="signerEmail"
                type="email"
                value={requestForm.signerEmail}
                onChange={(e) => setRequestForm(prev => ({ ...prev, signerEmail: e.target.value }))}
                placeholder="Enter signer's email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline (Optional)</Label>
              <Input
                id="deadline"
                type="date"
                value={requestForm.deadline}
                onChange={(e) => setRequestForm(prev => ({ ...prev, deadline: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Custom Message (Optional)</Label>
              <Textarea
                id="message"
                value={requestForm.message}
                onChange={(e) => setRequestForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Add a custom message for the signer"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestSignature}>
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sign Contract Modal */}
      <Dialog open={showSignModal} onOpenChange={setShowSignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Contract</DialogTitle>
            <DialogDescription>
              Provide your digital signature for this contract.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="signature">Digital Signature</Label>
              <Input
                id="signature"
                value={signatureData.signature}
                onChange={(e) => setSignatureData(prev => ({ ...prev, signature: e.target.value }))}
                placeholder="Type your full name as your digital signature"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comments">Comments (Optional)</Label>
              <Textarea
                id="comments"
                value={signatureData.comments}
                onChange={(e) => setSignatureData(prev => ({ ...prev, comments: e.target.value }))}
                placeholder="Add any comments about your signature"
                rows={3}
              />
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                By signing this contract, you agree to all terms and conditions specified in the document.
                This action is legally binding and cannot be undone.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSignModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSign} disabled={!signatureData.signature.trim()}>
              <PenTool className="h-4 w-4 mr-2" />
              Sign Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DigitalSignatureWorkflow;
