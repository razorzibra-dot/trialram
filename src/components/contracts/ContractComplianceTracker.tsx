import React, { useState, useEffect } from 'react';
import { Contract } from '@/types/contracts';
import { contractService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Shield,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  MoreHorizontal,
  FileText,
  Calendar,
  User
} from 'lucide-react';

interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  category: 'legal' | 'regulatory' | 'internal' | 'security' | 'financial';
  status: 'compliant' | 'non_compliant' | 'pending_review' | 'in_progress';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  assignedTo?: string;
  assignedToName?: string;
  evidence?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByName: string;
}

interface ContractComplianceTrackerProps {
  contract: Contract;
  onComplianceUpdate?: () => void;
}

const ContractComplianceTracker: React.FC<ContractComplianceTrackerProps> = ({
  contract,
  onComplianceUpdate
}) => {
  const { user, hasPermission } = useAuth();
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ComplianceItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'legal' as const,
    priority: 'medium' as const,
    dueDate: '',
    assignedTo: '',
    evidence: '',
    notes: ''
  });

  useEffect(() => {
    loadComplianceItems();
  }, [contract.id]);

  const loadComplianceItems = async () => {
    try {
      setLoading(true);
      const data = await contractService.getComplianceItems(contract.id);
      setComplianceItems(data);
    } catch (error) {
      toast.error('Failed to load compliance items');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async () => {
    try {
      const itemData = {
        ...formData,
        contractId: contract.id,
        status: 'pending_review' as const
      };

      await contractService.createComplianceItem(itemData);
      toast.success('Compliance item created successfully');
      setShowCreateModal(false);
      resetForm();
      loadComplianceItems();
      onComplianceUpdate?.();
    } catch (error) {
      toast.error('Failed to create compliance item');
    }
  };

  const handleUpdateItem = async () => {
    if (!selectedItem) return;

    try {
      await contractService.updateComplianceItem(selectedItem.id, formData);
      toast.success('Compliance item updated successfully');
      setShowEditModal(false);
      resetForm();
      loadComplianceItems();
      onComplianceUpdate?.();
    } catch (error) {
      toast.error('Failed to update compliance item');
    }
  };

  const handleUpdateStatus = async (item: ComplianceItem, status: ComplianceItem['status']) => {
    try {
      await contractService.updateComplianceItem(item.id, { status });
      toast.success('Compliance status updated');
      loadComplianceItems();
      onComplianceUpdate?.();
    } catch (error) {
      toast.error('Failed to update compliance status');
    }
  };

  const handleDeleteItem = async (item: ComplianceItem) => {
    if (!confirm('Are you sure you want to delete this compliance item?')) return;

    try {
      await contractService.deleteComplianceItem(item.id);
      toast.success('Compliance item deleted');
      loadComplianceItems();
      onComplianceUpdate?.();
    } catch (error) {
      toast.error('Failed to delete compliance item');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'legal',
      priority: 'medium',
      dueDate: '',
      assignedTo: '',
      evidence: '',
      notes: ''
    });
    setSelectedItem(null);
  };

  const openEditModal = (item: ComplianceItem) => {
    setSelectedItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      category: item.category,
      priority: item.priority,
      dueDate: item.dueDate || '',
      assignedTo: item.assignedTo || '',
      evidence: item.evidence || '',
      notes: item.notes || ''
    });
    setShowEditModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'non_compliant':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending_review':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      compliant: 'default',
      non_compliant: 'destructive',
      in_progress: 'secondary',
      pending_review: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'secondary',
      low: 'outline'
    } as const;

    return (
      <Badge variant={variants[priority as keyof typeof variants] || 'outline'}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      legal: 'bg-blue-100 text-blue-800',
      regulatory: 'bg-purple-100 text-purple-800',
      internal: 'bg-green-100 text-green-800',
      security: 'bg-red-100 text-red-800',
      financial: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <Badge className={colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {category.toUpperCase()}
      </Badge>
    );
  };

  const getComplianceScore = () => {
    if (complianceItems.length === 0) return 0;
    const compliant = complianceItems.filter(item => item.status === 'compliant').length;
    return Math.round((compliant / complianceItems.length) * 100);
  };

  const getOverdueItems = () => {
    return complianceItems.filter(item => 
      item.dueDate && 
      new Date(item.dueDate) < new Date() && 
      item.status !== 'compliant'
    );
  };

  const canManageCompliance = hasPermission('manage_contracts');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance Tracking
          </CardTitle>
          <CardDescription>
            Monitor and manage compliance requirements for this contract
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Compliance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                  <p className="text-2xl font-bold">{getComplianceScore()}%</p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <Progress value={getComplianceScore()} className="mt-2" />
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold">{complianceItems.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{getOverdueItems().length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </Card>
          </div>

          {/* Overdue Alert */}
          {getOverdueItems().length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have {getOverdueItems().length} overdue compliance item(s) that require immediate attention.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {canManageCompliance && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Compliance Item
              </Button>
            )}
          </div>

          {/* Compliance Items Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : complianceItems.length === 0 ? (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                No compliance items have been added for this contract yet.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complianceItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{item.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(item.category)}
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(item.priority)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          {getStatusBadge(item.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.dueDate ? (
                          <div className={`flex items-center gap-2 ${
                            new Date(item.dueDate) < new Date() && item.status !== 'compliant' 
                              ? 'text-red-600' 
                              : ''
                          }`}>
                            <Calendar className="h-4 w-4" />
                            {new Date(item.dueDate).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No due date</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.assignedToName ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {item.assignedToName}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canManageCompliance && (
                              <>
                                <DropdownMenuItem onClick={() => openEditModal(item)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(item, 'compliant')}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark Compliant
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(item, 'non_compliant')}>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Mark Non-Compliant
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(item, 'in_progress')}>
                                  <Clock className="h-4 w-4 mr-2" />
                                  Mark In Progress
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteItem(item)}
                                  className="text-destructive"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Compliance Item Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Compliance Item</DialogTitle>
            <DialogDescription>
              Add a new compliance requirement for this contract.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter compliance item title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="regulatory">Regulatory</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
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
                placeholder="Describe the compliance requirement"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes or requirements"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateItem} disabled={!formData.title.trim()}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Compliance Item Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Compliance Item</DialogTitle>
            <DialogDescription>
              Update the compliance requirement details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter compliance item title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select value={formData.category} onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="regulatory">Regulatory</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the compliance requirement"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dueDate">Due Date</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-evidence">Evidence/Documentation</Label>
              <Textarea
                id="edit-evidence"
                value={formData.evidence}
                onChange={(e) => setFormData(prev => ({ ...prev, evidence: e.target.value }))}
                placeholder="Evidence or documentation of compliance"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes or requirements"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateItem} disabled={!formData.title.trim()}>
              Update Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractComplianceTracker;
