import React, { useState, useEffect } from 'react';
import { Contract } from '@/types/contracts';
import { contractService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  GitBranch,
  Plus,
  Eye,
  Download,
  MoreHorizontal,
  History,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Calendar
} from 'lucide-react';

interface ContractVersion {
  id: string;
  version: number;
  title: string;
  description?: string;
  changes: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  status: 'draft' | 'active' | 'archived';
  documentUrl?: string;
  isCurrentVersion: boolean;
}

interface ContractVersioningProps {
  contract: Contract;
  onVersionChange?: (version: ContractVersion) => void;
}

const ContractVersioning: React.FC<ContractVersioningProps> = ({
  contract,
  onVersionChange
}) => {
  const { user, hasPermission } = useAuth();
  const [versions, setVersions] = useState<ContractVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<ContractVersion[]>([]);
  const [versionForm, setVersionForm] = useState({
    title: '',
    description: '',
    changes: ''
  });

  useEffect(() => {
    loadVersions();
  }, [contract.id]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const data = await contractService.getContractVersions(contract.id);
      setVersions(data);
    } catch (error) {
      toast.error('Failed to load contract versions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    try {
      const versionData = {
        contractId: contract.id,
        title: versionForm.title,
        description: versionForm.description,
        changes: versionForm.changes
      };

      await contractService.createContractVersion(versionData);
      toast.success('New contract version created successfully');
      setShowCreateModal(false);
      setVersionForm({ title: '', description: '', changes: '' });
      loadVersions();
    } catch (error) {
      toast.error('Failed to create contract version');
    }
  };

  const handleActivateVersion = async (version: ContractVersion) => {
    if (!confirm(`Are you sure you want to activate version ${version.version}? This will make it the current active version.`)) {
      return;
    }

    try {
      await contractService.activateContractVersion(contract.id, version.id);
      toast.success(`Version ${version.version} activated successfully`);
      loadVersions();
      onVersionChange?.(version);
    } catch (error) {
      toast.error('Failed to activate version');
    }
  };

  const handleArchiveVersion = async (version: ContractVersion) => {
    if (!confirm(`Are you sure you want to archive version ${version.version}?`)) {
      return;
    }

    try {
      await contractService.archiveContractVersion(version.id);
      toast.success(`Version ${version.version} archived successfully`);
      loadVersions();
    } catch (error) {
      toast.error('Failed to archive version');
    }
  };

  const handleDownloadVersion = (version: ContractVersion) => {
    if (version.documentUrl) {
      window.open(version.documentUrl, '_blank');
    } else {
      toast.error('Document not available for this version');
    }
  };

  const handleCompareVersions = () => {
    if (selectedVersions.length !== 2) {
      toast.error('Please select exactly 2 versions to compare');
      return;
    }
    setShowCompareModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'draft':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'archived':
        return <FileText className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string, isCurrentVersion: boolean) => {
    if (isCurrentVersion) {
      return <Badge variant="default">Current</Badge>;
    }

    const variants = {
      active: 'default',
      draft: 'secondary',
      archived: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const canCreateVersion = hasPermission('manage_contracts');
  const canActivateVersion = hasPermission('manage_contracts');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Contract Versions
          </CardTitle>
          <CardDescription>
            Manage different versions of this contract
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Action Buttons */}
          <div className="flex gap-2">
            {canCreateVersion && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Version
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleCompareVersions}
              disabled={selectedVersions.length !== 2}
            >
              <History className="h-4 w-4 mr-2" />
              Compare Versions
            </Button>
          </div>

          {/* Versions Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : versions.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No versions found for this contract. Create the first version to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVersions(versions.slice(0, 2));
                          } else {
                            setSelectedVersions([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedVersions.some(v => v.id === version.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (selectedVersions.length < 2) {
                                setSelectedVersions(prev => [...prev, version]);
                              }
                            } else {
                              setSelectedVersions(prev => prev.filter(v => v.id !== version.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(version.status)}
                          <span className="font-medium">v{version.version}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{version.title}</div>
                          {version.description && (
                            <div className="text-sm text-muted-foreground">
                              {version.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {version.createdByName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(version.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(version.status, version.isCurrentVersion)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownloadVersion(version)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            {canActivateVersion && version.status !== 'active' && !version.isCurrentVersion && (
                              <DropdownMenuItem onClick={() => handleActivateVersion(version)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            {canActivateVersion && version.status === 'active' && !version.isCurrentVersion && (
                              <DropdownMenuItem onClick={() => handleArchiveVersion(version)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
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

          {/* Version Changes */}
          {versions.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Recent Changes</h4>
              <div className="space-y-2">
                {versions.slice(0, 3).map((version) => (
                  <Card key={version.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">v{version.version}</span>
                          {version.isCurrentVersion && (
                            <Badge variant="default" className="text-xs">Current</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {version.changes || 'No changes documented'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          by {version.createdByName} on {new Date(version.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Version Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Version</DialogTitle>
            <DialogDescription>
              Create a new version of this contract with your changes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Version Title</Label>
              <Input
                id="title"
                value={versionForm.title}
                onChange={(e) => setVersionForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter version title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={versionForm.description}
                onChange={(e) => setVersionForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this version"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="changes">Changes Made</Label>
              <Textarea
                id="changes"
                value={versionForm.changes}
                onChange={(e) => setVersionForm(prev => ({ ...prev, changes: e.target.value }))}
                placeholder="Describe the changes made in this version"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateVersion} disabled={!versionForm.title.trim()}>
              Create Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compare Versions Modal */}
      <Dialog open={showCompareModal} onOpenChange={setShowCompareModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compare Versions</DialogTitle>
            <DialogDescription>
              Comparing version {selectedVersions[0]?.version} with version {selectedVersions[1]?.version}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedVersions.length === 2 && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Version {selectedVersions[0].version}</h4>
                  <Card className="p-4">
                    <div className="space-y-2">
                      <div><strong>Title:</strong> {selectedVersions[0].title}</div>
                      <div><strong>Created:</strong> {new Date(selectedVersions[0].createdAt).toLocaleDateString()}</div>
                      <div><strong>Changes:</strong> {selectedVersions[0].changes || 'No changes documented'}</div>
                    </div>
                  </Card>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Version {selectedVersions[1].version}</h4>
                  <Card className="p-4">
                    <div className="space-y-2">
                      <div><strong>Title:</strong> {selectedVersions[1].title}</div>
                      <div><strong>Created:</strong> {new Date(selectedVersions[1].createdAt).toLocaleDateString()}</div>
                      <div><strong>Changes:</strong> {selectedVersions[1].changes || 'No changes documented'}</div>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompareModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractVersioning;
