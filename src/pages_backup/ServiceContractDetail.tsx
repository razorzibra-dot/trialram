import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ServiceContract } from '@/types/productSales';
import { Contract } from '@/types/contracts';
import { serviceContractService } from '@/services/serviceContractService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  ArrowLeft,
  FileText,
  Settings,
  History,
  Shield,
  RefreshCw,
  PenTool,
  Paperclip,
  GitBranch,
  BarChart3,
  AlertCircle,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  ExternalLink,
  Edit,
  Package
} from 'lucide-react';

// Import contract management components
import ContractTemplateManager from '@/components/contracts/ContractTemplateManager';
import DigitalSignatureWorkflow from '@/components/contracts/DigitalSignatureWorkflow';
import ContractDocumentGenerator from '@/components/contracts/ContractDocumentGenerator';
import ContractVersioning from '@/components/contracts/ContractVersioning';
import ContractComplianceTracker from '@/components/contracts/ContractComplianceTracker';
import ContractRenewalManager from '@/components/contracts/ContractRenewalManager';
import ContractAuditTrail from '@/components/contracts/ContractAuditTrail';
import ContractApprovalWorkflow from '@/components/contracts/ContractApprovalWorkflow';
import ContractAttachmentManager from '@/components/contracts/ContractAttachmentManager';
import ContractAnalytics from '@/components/contracts/ContractAnalytics';

// Helper function to convert ServiceContract to Contract format for compatibility
const mapServiceContractToContract = (serviceContract: ServiceContract): Contract => {
  return {
    id: serviceContract.id,
    contract_number: serviceContract.contract_number,
    title: `Service Contract - ${serviceContract.product_name}`,
    description: `Service contract for ${serviceContract.product_name} sold to ${serviceContract.customer_name}`,
    type: 'service_agreement' as const,
    status: serviceContract.status === 'cancelled' ? 'terminated' :
            serviceContract.status === 'renewed' ? 'renewed' :
            serviceContract.status === 'expired' ? 'expired' : 'active',

    // Customer information
    customer_id: serviceContract.customer_id,
    customer_name: serviceContract.customer_name,
    customer_contact: '',

    // Parties (empty for service contracts)
    parties: [],

    // Financial information
    value: serviceContract.contract_value,
    total_value: serviceContract.contract_value,
    currency: 'USD',
    payment_terms: '',
    delivery_terms: '',

    // Dates
    start_date: serviceContract.start_date,
    end_date: serviceContract.end_date,
    signed_date: serviceContract.created_at,
    next_renewal_date: serviceContract.end_date,

    // Renewal and terms
    auto_renew: serviceContract.auto_renewal,
    renewal_period_months: 12,
    renewal_terms: `Auto-renewal ${serviceContract.auto_renewal ? 'enabled' : 'disabled'} with ${serviceContract.renewal_notice_period} days notice`,
    terms: serviceContract.terms,

    // Approval and workflow
    approval_stage: 'approved',
    approval_history: [],
    compliance_status: 'compliant' as const,

    // Assignment
    created_by: serviceContract.created_by,
    assigned_to: serviceContract.created_by,
    assigned_to_name: '',

    // Document management
    content: serviceContract.terms,
    template_id: '',
    document_path: serviceContract.pdf_url,
    document_url: serviceContract.pdf_url,

    // Metadata
    tenant_id: serviceContract.tenant_id,
    created_at: serviceContract.created_at,
    updated_at: serviceContract.updated_at,

    // Additional fields
    priority: 'medium' as const,
    tags: [`service-level-${serviceContract.service_level}`, 'auto-generated'],
    notes: `Service contract auto-generated from product sale ${serviceContract.product_sale_id}`,
    version: '1.0',
    signature_status: 'signed',
    attachments: []
  };
};

const ServiceContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [serviceContract, setServiceContract] = useState<ServiceContract | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      loadContract();
    }
  }, [id]);

  const loadContract = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await serviceContractService.getServiceContractById(id);
      setServiceContract(data);
      setContract(mapServiceContractToContract(data));
    } catch (error) {
      toast.error('Failed to load service contract details');
      navigate('/tenant/service-contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleContractUpdate = () => {
    loadContract();
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      pending: 'secondary',
      expired: 'destructive',
      cancelled: 'outline',
      renewed: 'default'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getServiceLevelBadge = (level: string) => {
    const colors = {
      basic: 'bg-gray-100 text-gray-800',
      standard: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-green-100 text-green-800'
    };
    
    return (
      <Badge className={colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </Badge>
    );
  };

  const getExpiryStatus = (endDate: string) => {
    const expiry = new Date(endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'text-red-600', icon: XCircle, message: 'Expired' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', color: 'text-yellow-600', icon: AlertCircle, message: `Expires in ${daysUntilExpiry} days` };
    } else {
      return { status: 'active', color: 'text-green-600', icon: CheckCircle, message: `${daysUntilExpiry} days remaining` };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!serviceContract || !contract) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Service contract not found or you don't have permission to view it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const expiryStatus = getExpiryStatus(serviceContract.end_date);
  const ExpiryIcon = expiryStatus.icon;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/tenant/service-contracts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Service Contracts
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Service Contract #{serviceContract.contract_number}</h1>
            <p className="text-muted-foreground">{serviceContract.customer_name} - {serviceContract.product_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(serviceContract.status)}
          {getServiceLevelBadge(serviceContract.service_level)}
        </div>
      </div>

      {/* Contract Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contract Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(serviceContract.contract_value)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contract Period</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div className="font-medium">{formatDate(serviceContract.start_date)}</div>
              <div className="text-muted-foreground">to {formatDate(serviceContract.end_date)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warranty</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serviceContract.warranty_period}
            </div>
            <p className="text-xs text-muted-foreground">months coverage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiry Status</CardTitle>
            <ExpiryIcon className={`h-4 w-4 ${expiryStatus.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-sm font-medium ${expiryStatus.color}`}>
              {expiryStatus.message}
            </div>
            {serviceContract.auto_renewal && (
              <Badge variant="secondary" className="text-xs mt-1">
                Auto-renew enabled
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Service Contract Management Features */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="product" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Product</span>
          </TabsTrigger>
          <TabsTrigger value="renewal" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Renewal</span>
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Compliance</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="signatures" className="flex items-center gap-2">
            <PenTool className="h-4 w-4" />
            <span className="hidden sm:inline">Signatures</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Audit</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contract Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Contract Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Customer</label>
                    <p className="font-medium">{serviceContract.customer_name}</p>
                    <p className="text-sm text-muted-foreground">ID: {serviceContract.customer_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Product</label>
                    <p className="font-medium">{serviceContract.product_name}</p>
                    <p className="text-sm text-muted-foreground">Sale ID: {serviceContract.product_sale_id}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Service Level</label>
                    <div className="mt-1">{getServiceLevelBadge(serviceContract.service_level)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Auto Renewal</label>
                    <div className="flex items-center gap-2 mt-1">
                      {serviceContract.auto_renewal ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span>{serviceContract.auto_renewal ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Renewal Notice Period</label>
                  <p className="font-medium">{serviceContract.renewal_notice_period} days</p>
                </div>
              </CardContent>
            </Card>

            {/* Terms & Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Terms & Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {serviceContract.terms || 'No terms specified'}
                  </pre>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => window.open(serviceContract.pdf_url, '_blank')}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(serviceContract.pdf_url, '_blank')}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Full Contract
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="product" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Information
              </CardTitle>
              <CardDescription>
                Details about the product covered by this service contract
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Product Name</label>
                    <p className="text-lg font-medium">{serviceContract.product_name}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Product Sale ID</label>
                    <p className="font-medium">{serviceContract.product_sale_id}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Warranty Period</label>
                    <p className="font-medium">{serviceContract.warranty_period} months</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contract Value</label>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(serviceContract.contract_value)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Service Level</label>
                    <div className="mt-1">{getServiceLevelBadge(serviceContract.service_level)}</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                    <p className="font-medium">{formatDate(serviceContract.created_at)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate(`/tenant/product-sales`)}>
                  <Package className="h-4 w-4 mr-2" />
                  View Product Sale
                </Button>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Product Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="renewal" className="space-y-6">
          <ContractRenewalManager
            contract={contract}
            onRenewalUpdate={handleContractUpdate}
          />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <ContractComplianceTracker
            contract={contract}
            onComplianceUpdate={handleContractUpdate}
          />
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ContractTemplateManager />
            <ContractDocumentGenerator
              contract={contract}
              onDocumentGenerated={handleContractUpdate}
            />
          </div>
          <ContractVersioning
            contract={contract}
            onVersionChange={handleContractUpdate}
          />
        </TabsContent>

        <TabsContent value="signatures" className="space-y-6">
          <DigitalSignatureWorkflow
            contract={contract}
            onSignatureUpdate={handleContractUpdate}
          />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <ContractAuditTrail contract={contract} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <ContractAnalytics contractId={contract.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceContractDetail;
