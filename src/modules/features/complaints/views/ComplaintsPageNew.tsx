/**
 * Complaints Page - Modular Version
 * Enhanced complaint management with lifecycle tracking
 */
import React, { useEffect, useState } from 'react';
import { complaintService } from '@/services/complaintService';
import { Complaint, ComplaintFilters } from '@/types/complaints';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  AlertTriangle,
  Clock,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  Building2,
  User,
  Calendar,
  MessageSquare,
  Wrench,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { ComplaintsFormPanel } from '@/modules/features/complaints/components/ComplaintsFormPanel';
import ComplaintDetailModal from '@/components/complaints/ComplaintDetailModal';
import { toast } from 'sonner';

export const ComplaintsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFormPanel, setShowFormPanel] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    fetchComplaints();
  }, [searchTerm, statusFilter]);

  const fetchComplaints = async () => {
    try {
      setIsLoading(true);
      const filters: ComplaintFilters = {};
      
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter !== 'all') filters.status = statusFilter;

      const data = await complaintService.getComplaints(filters);
      setComplaints(data);
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
      toast.error('Failed to fetch complaints');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      new: 'outline',
      in_progress: 'default',
      closed: 'secondary'
    };
    
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const handleCreateComplaint = () => {
    setSelectedComplaint(null);
    setFormMode('create');
    setShowFormPanel(true);
  };

  const handleEditComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setFormMode('edit');
    setShowFormPanel(true);
  };

  const handleCloseFormPanel = () => {
    setShowFormPanel(false);
    setSelectedComplaint(null);
  };

  const handleViewDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailModal(true);
  };

  const handleSearch = () => {
    fetchComplaints();
  };

  if (!hasPermission('manage_complaints')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">You don't have permission to access complaint management.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = {
    total: complaints.length,
    new: complaints.filter(c => c.status === 'new').length,
    inProgress: complaints.filter(c => c.status === 'in_progress').length,
    closed: complaints.filter(c => c.status === 'closed').length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Wrench className="h-8 w-8" />
            Complaint Management
          </h1>
          <p className="text-muted-foreground">
            Manage customer complaints with enhanced lifecycle tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchComplaints}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {hasPermission('write') && (
            <Button onClick={handleCreateComplaint}>
              <Plus className="h-4 w-4 mr-2" />
              Create Complaint
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.new}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.closed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search complaints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Complaints Table */}
      <Card>
        <CardHeader>
          <CardTitle>Complaints ({complaints.length})</CardTitle>
          <CardDescription>
            Showing {complaints.length} complaint{complaints.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading complaints...</span>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No complaints found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first complaint
              </p>
              {hasPermission('write') && (
                <Button onClick={handleCreateComplaint}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Complaint
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Complaint</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned Engineer</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <div className="font-medium">{complaint.title}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {complaint.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{complaint.customer_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{complaint.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{complaint.assigned_engineer_name || 'Unassigned'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(complaint.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(complaint)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {hasPermission('write') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditComplaint(complaint)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Side Panel Forms */}
      <ComplaintsFormPanel
        complaint={selectedComplaint}
        mode={formMode}
        isOpen={showFormPanel}
        onClose={handleCloseFormPanel}
      />

      {selectedComplaint && (
        <ComplaintDetailModal
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
          complaint={selectedComplaint}
          onSuccess={fetchComplaints}
        />
      )}
    </div>
  );
};

export default ComplaintsPage;
