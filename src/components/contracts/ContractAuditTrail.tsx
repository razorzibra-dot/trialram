import React, { useState, useEffect } from 'react';
import { Contract } from '@/types/contracts';
import { contractService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  History,
  User,
  Calendar,
  Eye,
  Download,
  Filter,
  Search,
  FileText,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface AuditEntry {
  id: string;
  action: string;
  actionType: 'create' | 'update' | 'delete' | 'view' | 'sign' | 'approve' | 'reject';
  description: string;
  userId: string;
  userName: string;
  userRole: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
  metadata?: Record<string, unknown>;
}

interface ContractAuditTrailProps {
  contract: Contract;
}

const ContractAuditTrail: React.FC<ContractAuditTrailProps> = ({ contract }) => {
  const { hasPermission } = useAuth();
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    actionType: '',
    userId: '',
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  });

  useEffect(() => {
    loadAuditTrail();
  }, [contract.id, filters]);

  const loadAuditTrail = async () => {
    try {
      setLoading(true);
      const data = await contractService.getAuditTrail(contract.id, filters);
      setAuditEntries(data);
    } catch (error) {
      toast.error('Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  const handleExportAuditTrail = async () => {
    try {
      const exportData = await contractService.exportAuditTrail(contract.id, filters);
      // Create and download CSV file
      const blob = new Blob([exportData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${contract.contract_number}-audit-trail.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Audit trail exported successfully');
    } catch (error) {
      toast.error('Failed to export audit trail');
    }
  };

  const handleViewDetails = (entry: AuditEntry) => {
    setSelectedEntry(entry);
    setShowDetailsModal(true);
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'update':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'view':
        return <Eye className="h-4 w-4 text-gray-600" />;
      case 'sign':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'approve':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'reject':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionBadge = (actionType: string) => {
    const variants = {
      create: 'default',
      update: 'secondary',
      delete: 'destructive',
      view: 'outline',
      sign: 'default',
      approve: 'default',
      reject: 'destructive'
    } as const;

    return (
      <Badge variant={variants[actionType as keyof typeof variants] || 'outline'}>
        {actionType.toUpperCase()}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const clearFilters = () => {
    setFilters({
      actionType: '',
      userId: '',
      dateFrom: '',
      dateTo: '',
      searchTerm: ''
    });
  };

  const canViewAuditTrail = hasPermission('view_audit_logs');
  const canExportAuditTrail = hasPermission('export_data');

  if (!canViewAuditTrail) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to view the audit trail for this contract.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Contract Audit Trail
          </CardTitle>
          <CardDescription>
            Complete history of all actions performed on this contract
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="actionType">Action Type</Label>
              <Select value={filters.actionType} onValueChange={(value) => setFilters(prev => ({ ...prev, actionType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="sign">Sign</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="searchTerm">Search</Label>
              <Input
                id="searchTerm"
                placeholder="Search actions..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                {canExportAuditTrail && (
                  <Button variant="outline" size="sm" onClick={handleExportAuditTrail}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Audit Trail Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : auditEntries.length === 0 ? (
            <Alert>
              <History className="h-4 w-4" />
              <AlertDescription>
                No audit entries found for the selected filters.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditEntries.map((entry) => {
                    const timestamp = formatTimestamp(entry.timestamp);
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionIcon(entry.actionType)}
                            {getActionBadge(entry.actionType)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <div className="font-medium">{entry.action}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {entry.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{entry.userName}</div>
                              <div className="text-sm text-muted-foreground">{entry.userRole}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{timestamp.date}</div>
                              <div className="text-sm text-muted-foreground">{timestamp.time}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-mono">
                            {entry.ipAddress || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(entry)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
            <Card className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {auditEntries.filter(e => e.actionType === 'view').length}
                </div>
                <div className="text-sm text-muted-foreground">Views</div>
              </div>
            </Card>
            
            <Card className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {auditEntries.filter(e => e.actionType === 'update').length}
                </div>
                <div className="text-sm text-muted-foreground">Updates</div>
              </div>
            </Card>
            
            <Card className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {auditEntries.filter(e => e.actionType === 'sign').length}
                </div>
                <div className="text-sm text-muted-foreground">Signatures</div>
              </div>
            </Card>
            
            <Card className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {new Set(auditEntries.map(e => e.userId)).size}
                </div>
                <div className="text-sm text-muted-foreground">Unique Users</div>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Audit Entry Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Entry Details</DialogTitle>
            <DialogDescription>
              Detailed information about this audit entry
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Action</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getActionIcon(selectedEntry.actionType)}
                    {getActionBadge(selectedEntry.actionType)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Timestamp</Label>
                  <div className="mt-1">
                    {new Date(selectedEntry.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <div className="mt-1 p-2 bg-muted rounded">
                  {selectedEntry.description}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">User</Label>
                  <div className="mt-1">
                    <div className="font-medium">{selectedEntry.userName}</div>
                    <div className="text-sm text-muted-foreground">{selectedEntry.userRole}</div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">IP Address</Label>
                  <div className="mt-1 font-mono text-sm">
                    {selectedEntry.ipAddress || 'N/A'}
                  </div>
                </div>
              </div>
              
              {selectedEntry.changes && selectedEntry.changes.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Changes Made</Label>
                  <div className="mt-1 space-y-2">
                    {selectedEntry.changes.map((change, index) => (
                      <div key={index} className="p-2 border rounded">
                        <div className="font-medium text-sm">{change.field}</div>
                        <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                          <div>
                            <span className="text-muted-foreground">From:</span>
                            <div className="p-1 bg-red-50 rounded">{change.oldValue || 'Empty'}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">To:</span>
                            <div className="p-1 bg-green-50 rounded">{change.newValue || 'Empty'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedEntry.userAgent && (
                <div>
                  <Label className="text-sm font-medium">User Agent</Label>
                  <div className="mt-1 p-2 bg-muted rounded text-xs font-mono">
                    {selectedEntry.userAgent}
                  </div>
                </div>
              )}
              
              {selectedEntry.metadata && Object.keys(selectedEntry.metadata).length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Additional Metadata</Label>
                  <div className="mt-1 p-2 bg-muted rounded">
                    <pre className="text-xs">
                      {JSON.stringify(selectedEntry.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractAuditTrail;
