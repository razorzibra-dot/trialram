import React, { useState, useEffect } from 'react';
import { Contract, ContractTemplate } from '@/types/contracts';
import { contractService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  FileText,
  Download,
  Eye,
  RefreshCw,
  Settings,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface ContractDocumentGeneratorProps {
  contract: Contract;
  onDocumentGenerated?: (documentUrl: string) => void;
}

const ContractDocumentGenerator: React.FC<ContractDocumentGeneratorProps> = ({
  contract,
  onDocumentGenerated
}) => {
  const { hasPermission } = useAuth();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [showVariablesModal, setShowVariablesModal] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadExistingDocument();
  }, [contract.id]);

  useEffect(() => {
    if (selectedTemplate) {
      initializeVariables();
    }
  }, [selectedTemplate]);

  const loadTemplates = async () => {
    try {
      const data = await contractService.getTemplates();
      const filteredTemplates = data.filter(t => 
        t.isActive && (t.type === contract.type || t.type === 'custom')
      );
      setTemplates(filteredTemplates);
      
      // Auto-select default template
      const defaultTemplate = filteredTemplates.find(t => t.isDefault);
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate);
      }
    } catch (error) {
      toast.error('Failed to load templates');
    }
  };

  const loadExistingDocument = async () => {
    try {
      const existingDoc = await contractService.getContractDocument(contract.id);
      if (existingDoc) {
        setDocumentUrl(existingDoc.url);
      }
    } catch (error) {
      // No existing document, which is fine
    }
  };

  const initializeVariables = () => {
    if (!selectedTemplate) return;

    const initialVariables: Record<string, string> = {};
    
    // Pre-populate with contract data
    selectedTemplate.variables.forEach(variable => {
      switch (variable) {
        case 'contract_number':
          initialVariables[variable] = contract.contract_number || '';
          break;
        case 'contract_title':
          initialVariables[variable] = contract.title || '';
          break;
        case 'customer_name':
          initialVariables[variable] = contract.customer_name || '';
          break;
        case 'contract_value':
          initialVariables[variable] = contract.value?.toString() || '';
          break;
        case 'currency':
          initialVariables[variable] = contract.currency || 'USD';
          break;
        case 'start_date':
          initialVariables[variable] = contract.start_date || '';
          break;
        case 'end_date':
          initialVariables[variable] = contract.end_date || '';
          break;
        case 'payment_terms':
          initialVariables[variable] = contract.payment_terms || '';
          break;
        case 'delivery_terms':
          initialVariables[variable] = contract.delivery_terms || '';
          break;
        case 'current_date':
          initialVariables[variable] = new Date().toLocaleDateString();
          break;
        default:
          initialVariables[variable] = '';
      }
    });

    setVariables(initialVariables);
  };

  const handleGeneratePreview = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template first');
      return;
    }

    try {
      const preview = await contractService.generateContractPreview(
        selectedTemplate.id,
        variables
      );
      setPreviewContent(preview);
      setShowPreview(true);
    } catch (error) {
      toast.error('Failed to generate preview');
    }
  };

  const handleGenerateDocument = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template first');
      return;
    }

    try {
      setGenerating(true);
      setGenerationProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const documentUrl = await contractService.generateContractDocument(
        contract.id,
        selectedTemplate.id,
        variables
      );

      clearInterval(progressInterval);
      setGenerationProgress(100);
      setDocumentUrl(documentUrl);
      
      toast.success('Contract document generated successfully');
      onDocumentGenerated?.(documentUrl);
    } catch (error) {
      toast.error('Failed to generate contract document');
    } finally {
      setGenerating(false);
      setGenerationProgress(0);
    }
  };

  const handleDownloadDocument = () => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
  };

  const handleVariableChange = (variable: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const areVariablesComplete = () => {
    if (!selectedTemplate) return false;
    return selectedTemplate.variables.every(variable => 
      variables[variable] && variables[variable].trim() !== ''
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Generation
          </CardTitle>
          <CardDescription>
            Generate contract documents from templates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Contract Template</Label>
            <Select 
              value={selectedTemplate?.id || ''} 
              onValueChange={(value) => {
                const template = templates.find(t => t.id === value);
                setSelectedTemplate(template || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      {template.name}
                      {template.isDefault && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Info */}
          {selectedTemplate && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div><strong>Template:</strong> {selectedTemplate.name}</div>
                  <div><strong>Type:</strong> {selectedTemplate.type}</div>
                  <div><strong>Variables:</strong> {selectedTemplate.variables.length} required</div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Variables Configuration */}
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Template Variables</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVariablesModal(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configure All
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {selectedTemplate.variables.slice(0, 6).map((variable) => (
                  <div key={variable} className="space-y-1">
                    <Label className="text-xs">{variable.replace(/_/g, ' ').toUpperCase()}</Label>
                    <Input
                      value={variables[variable] || ''}
                      onChange={(e) => handleVariableChange(variable, e.target.value)}
                      placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
              
              {selectedTemplate.variables.length > 6 && (
                <div className="text-sm text-muted-foreground">
                  +{selectedTemplate.variables.length - 6} more variables. Click "Configure All" to set them.
                </div>
              )}
            </div>
          )}

          {/* Generation Progress */}
          {generating && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Generating document...</span>
              </div>
              <Progress value={generationProgress} className="h-2" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleGeneratePreview}
              variant="outline"
              disabled={!selectedTemplate || generating}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handleGenerateDocument}
              disabled={!selectedTemplate || !areVariablesComplete() || generating}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Document
            </Button>
            {documentUrl && (
              <Button
                onClick={handleDownloadDocument}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>

          {/* Existing Document */}
          {documentUrl && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>Contract document has been generated and is ready for download.</span>
                  <Button size="sm" variant="outline" onClick={handleDownloadDocument}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Variables Configuration Modal */}
      <Dialog open={showVariablesModal} onOpenChange={setShowVariablesModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Template Variables</DialogTitle>
            <DialogDescription>
              Set values for all template variables to generate the contract document.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedTemplate?.variables.map((variable) => (
              <div key={variable} className="space-y-2">
                <Label htmlFor={variable}>
                  {variable.replace(/_/g, ' ').toUpperCase()}
                </Label>
                <Input
                  id={variable}
                  value={variables[variable] || ''}
                  onChange={(e) => handleVariableChange(variable, e.target.value)}
                  placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVariablesModal(false)}>
              Close
            </Button>
            <Button onClick={() => setShowVariablesModal(false)}>
              Save Variables
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contract Preview</DialogTitle>
            <DialogDescription>
              Preview of the generated contract document
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div 
              className="prose max-w-none p-6 border rounded-lg bg-white"
              dangerouslySetInnerHTML={{ __html: previewContent }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button onClick={handleGenerateDocument} disabled={!areVariablesComplete()}>
              Generate Final Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractDocumentGenerator;
