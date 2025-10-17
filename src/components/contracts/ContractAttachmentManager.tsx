import React, { useState, useEffect, useRef } from 'react';
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
  Paperclip,
  Upload,
  Download,
  Eye,
  Trash2,
  MoreHorizontal,
  FileText,
  Image,
  File,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Plus,
  Search
} from 'lucide-react';

interface ContractAttachment {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  category: 'contract_document' | 'supporting_document' | 'amendment' | 'signature' | 'other';
  description?: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  downloadUrl: string;
  previewUrl?: string;
  isPublic: boolean;
  version?: number;
}

interface ContractAttachmentManagerProps {
  contract: Contract;
  onAttachmentUpdate?: () => void;
}

const ContractAttachmentManager: React.FC<ContractAttachmentManagerProps> = ({
  contract,
  onAttachmentUpdate
}) => {
  const { user, hasPermission } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<ContractAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<ContractAttachment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [uploadForm, setUploadForm] = useState({
    files: [] as File[],
    category: 'supporting_document' as const,
    description: '',
    isPublic: false
  });

  useEffect(() => {
    loadAttachments();
  }, [contract.id]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const data = await contractService.getContractAttachments(contract.id);
      setAttachments(data);
    } catch (error) {
      toast.error('Failed to load attachments');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setUploadForm(prev => ({ ...prev, files }));
      setShowUploadModal(true);
    }
  };

  const handleUpload = async () => {
    if (uploadForm.files.length === 0) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      await contractService.uploadContractAttachment(contract.id, {
        files: uploadForm.files,
        category: uploadForm.category,
        description: uploadForm.description,
        isPublic: uploadForm.isPublic
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast.success(`${uploadForm.files.length} file(s) uploaded successfully`);
      setShowUploadModal(false);
      setUploadForm({ files: [], category: 'supporting_document', description: '', isPublic: false });
      loadAttachments();
      onAttachmentUpdate?.();
    } catch (error) {
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = (attachment: ContractAttachment) => {
    window.open(attachment.downloadUrl, '_blank');
  };

  const handlePreview = (attachment: ContractAttachment) => {
    if (attachment.previewUrl) {
      setSelectedAttachment(attachment);
      setShowPreviewModal(true);
    } else {
      toast.error('Preview not available for this file type');
    }
  };

  const handleDelete = async (attachment: ContractAttachment) => {
    if (!confirm(`Are you sure you want to delete "${attachment.originalName}"?`)) return;

    try {
      await contractService.deleteContractAttachment(attachment.id);
      toast.success('Attachment deleted successfully');
      loadAttachments();
      onAttachmentUpdate?.();
    } catch (error) {
      toast.error('Failed to delete attachment');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-600" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="h-4 w-4 text-red-600" />;
    } else {
      return <File className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      contract_document: 'bg-blue-100 text-blue-800',
      supporting_document: 'bg-green-100 text-green-800',
      amendment: 'bg-yellow-100 text-yellow-800',
      signature: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {category.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredAttachments = attachments.filter(attachment => {
    const matchesSearch = attachment.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         attachment.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || attachment.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const canUploadAttachments = hasPermission('manage_contracts');
  const canDeleteAttachments = hasPermission('manage_contracts');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Contract Attachments
          </CardTitle>
          <CardDescription>
            Manage documents and files related to this contract
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2">
              {canUploadAttachments && (
                <>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                  />
                </>
              )}
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search attachments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  <SelectItem value="contract_document">Contract Document</SelectItem>
                  <SelectItem value="supporting_document">Supporting Document</SelectItem>
                  <SelectItem value="amendment">Amendment</SelectItem>
                  <SelectItem value="signature">Signature</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Attachments Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{attachments.length}</div>
                <div className="text-sm text-muted-foreground">Total Files</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {attachments.filter(a => a.category === 'contract_document').length}
                </div>
                <div className="text-sm text-muted-foreground">Contract Docs</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {attachments.filter(a => a.category === 'signature').length}
                </div>
                <div className="text-sm text-muted-foreground">Signatures</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatFileSize(attachments.reduce((total, a) => total + a.fileSize, 0))}
                </div>
                <div className="text-sm text-muted-foreground">Total Size</div>
              </div>
            </Card>
          </div>

          {/* Attachments Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAttachments.length === 0 ? (
            <Alert>
              <Paperclip className="h-4 w-4" />
              <AlertDescription>
                {attachments.length === 0 
                  ? 'No attachments have been uploaded for this contract yet.'
                  : 'No attachments match your current filters.'
                }
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttachments.map((attachment) => (
                    <TableRow key={attachment.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getFileIcon(attachment.fileType)}
                          <div>
                            <div className="font-medium">{attachment.originalName}</div>
                            {attachment.description && (
                              <div className="text-sm text-muted-foreground">
                                {attachment.description}
                              </div>
                            )}
                            {attachment.version && (
                              <Badge variant="outline" className="text-xs mt-1">
                                v{attachment.version}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(attachment.category)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatFileSize(attachment.fileSize)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="text-sm">{attachment.uploadedByName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">
                            {new Date(attachment.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownload(attachment)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            {attachment.previewUrl && (
                              <DropdownMenuItem onClick={() => handlePreview(attachment)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                            )}
                            {canDeleteAttachments && (
                              <DropdownMenuItem 
                                onClick={() => handleDelete(attachment)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
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
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Attachments</DialogTitle>
            <DialogDescription>
              Upload files related to this contract
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Selected Files */}
            <div className="space-y-2">
              <Label>Selected Files</Label>
              <div className="border rounded p-3 max-h-32 overflow-y-auto">
                {uploadForm.files.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No files selected</div>
                ) : (
                  <div className="space-y-1">
                    {uploadForm.files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        {getFileIcon(file.type)}
                        <span>{file.name}</span>
                        <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={uploadForm.category} onValueChange={(value: string) => setUploadForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contract_document">Contract Document</SelectItem>
                    <SelectItem value="supporting_document">Supporting Document</SelectItem>
                    <SelectItem value="amendment">Amendment</SelectItem>
                    <SelectItem value="signature">Signature</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={uploadForm.isPublic}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                  />
                  <Label htmlFor="isPublic" className="text-sm">Make files public</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add a description for these files"
                rows={3}
              />
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Uploading files...</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadModal(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploadForm.files.length === 0 || uploading}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>File Preview</DialogTitle>
            <DialogDescription>
              {selectedAttachment?.originalName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedAttachment?.previewUrl && (
              <div className="border rounded p-4 bg-white">
                {selectedAttachment.fileType.startsWith('image/') ? (
                  <img 
                    src={selectedAttachment.previewUrl} 
                    alt={selectedAttachment.originalName}
                    className="max-w-full h-auto"
                  />
                ) : (
                  <iframe
                    src={selectedAttachment.previewUrl}
                    className="w-full h-96"
                    title={selectedAttachment.originalName}
                  />
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractAttachmentManager;
