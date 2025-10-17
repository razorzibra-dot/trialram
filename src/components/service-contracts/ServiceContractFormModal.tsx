import React, { useState, useEffect } from 'react';
import { ServiceContract, ServiceContractFormData } from '@/types/productSales';
import { Customer } from '@/types/crm';
import { Product } from '@/types/masters';
import { serviceContractService, customerService, productService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { FileText, Calendar, DollarSign, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ServiceContractFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceContract?: ServiceContract | null;
  productSaleId?: string;
  onSuccess: () => void;
}

const ServiceContractFormModal: React.FC<ServiceContractFormModalProps> = ({
  open,
  onOpenChange,
  serviceContract,
  productSaleId,
  onSuccess
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState('basic');
  
  const [formData, setFormData] = useState({
    product_sale_id: productSaleId || '',
    contract_number: '',
    customer_id: '',
    customer_name: '',
    product_id: '',
    product_name: '',
    start_date: '',
    end_date: '',
    status: 'active' as const,
    contract_value: 0,
    annual_value: 0,
    terms: '',
    warranty_period: 12,
    service_level: 'standard' as const,
    auto_renewal: true,
    renewal_notice_period: 60
  });

  useEffect(() => {
    if (open) {
      loadInitialData();
      if (serviceContract) {
        setFormData({
          product_sale_id: serviceContract.product_sale_id,
          contract_number: serviceContract.contract_number,
          customer_id: serviceContract.customer_id,
          customer_name: serviceContract.customer_name || '',
          product_id: serviceContract.product_id,
          product_name: serviceContract.product_name || '',
          start_date: serviceContract.start_date,
          end_date: serviceContract.end_date,
          status: serviceContract.status,
          contract_value: serviceContract.contract_value,
          annual_value: serviceContract.annual_value,
          terms: serviceContract.terms,
          warranty_period: serviceContract.warranty_period,
          service_level: serviceContract.service_level,
          auto_renewal: serviceContract.auto_renewal,
          renewal_notice_period: serviceContract.renewal_notice_period
        });
      } else {
        resetForm();
      }
    }
  }, [open, serviceContract, productSaleId]);

  const loadInitialData = async () => {
    try {
      const [customersData, productsResponse] = await Promise.all([
        customerService.getCustomers(),
        productService.getProducts()
      ]);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setProducts(Array.isArray(productsResponse?.data) ? productsResponse.data : []);
    } catch (error) {
      console.error('Error loading form data:', error);
      setCustomers([]);
      setProducts([]);
      toast({
        title: 'Error',
        description: 'Failed to load form data',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      product_sale_id: productSaleId || '',
      contract_number: '',
      customer_id: '',
      customer_name: '',
      product_id: '',
      product_name: '',
      start_date: '',
      end_date: '',
      status: 'active',
      contract_value: 0,
      annual_value: 0,
      terms: '',
      warranty_period: 12,
      service_level: 'standard',
      auto_renewal: true,
      renewal_notice_period: 60
    });
    setActiveTab('basic');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_id || !formData.product_id) {
      toast({
        title: 'Error',
        description: 'Please select both customer and product',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      
      const contractData: Partial<ServiceContractFormData> = {
        service_level: formData.service_level,
        auto_renewal: formData.auto_renewal,
        renewal_notice_period: formData.renewal_notice_period,
        terms: formData.terms
      };

      if (serviceContract) {
        await serviceContractService.updateServiceContract(serviceContract.id, contractData);
        toast({
          title: 'Success',
          description: 'Service contract updated successfully'
        });
      } else {
        // For new contracts, we need the product sale data
        const mockProductSale = {
          customer_id: formData.customer_id,
          customer_name: formData.customer_name,
          product_id: formData.product_id,
          product_name: formData.product_name,
          delivery_date: formData.start_date,
          total_cost: formData.contract_value
        };
        
        await serviceContractService.createServiceContract(
          formData.product_sale_id || 'new',
          mockProductSale,
          contractData
        );
        toast({
          title: 'Success',
          description: 'Service contract created successfully'
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save service contract',
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
            {serviceContract ? 'Edit Service Contract' : 'Create Service Contract'}
          </DialogTitle>
          <DialogDescription>
            {serviceContract 
              ? 'Update service contract details and terms' 
              : 'Create a new service contract for product support and maintenance'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="dates" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Dates
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financial
              </TabsTrigger>
              <TabsTrigger value="service" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Service
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
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
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: ServiceContract['status']) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="renewed">Renewed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_id">Customer *</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => {
                      const customer = customers.find(c => c.id === value);
                      setFormData(prev => ({ 
                        ...prev, 
                        customer_id: value,
                        customer_name: customer?.company_name || ''
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(customers) && customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.company_name} - {customer.contact_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product_id">Product *</Label>
                  <Select
                    value={formData.product_id}
                    onValueChange={(value) => {
                      const product = Array.isArray(products) ? products.find(p => p.id === value) : null;
                      setFormData(prev => ({
                        ...prev,
                        product_id: value,
                        product_name: product?.name || ''
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(products) && products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {product.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="dates" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="warranty_period">Warranty Period (Months)</Label>
                  <Input
                    id="warranty_period"
                    type="number"
                    min="1"
                    value={formData.warranty_period}
                    onChange={(e) => setFormData(prev => ({ ...prev, warranty_period: parseInt(e.target.value) || 12 }))}
                    placeholder="12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="renewal_notice_period">Renewal Notice Period (Days)</Label>
                  <Input
                    id="renewal_notice_period"
                    type="number"
                    min="1"
                    value={formData.renewal_notice_period}
                    onChange={(e) => setFormData(prev => ({ ...prev, renewal_notice_period: parseInt(e.target.value) || 60 }))}
                    placeholder="60"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto_renewal"
                  checked={formData.auto_renewal}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, auto_renewal: !!checked }))
                  }
                />
                <Label htmlFor="auto_renewal">Enable Auto-Renewal</Label>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contract_value">Contract Value</Label>
                  <Input
                    id="contract_value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.contract_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, contract_value: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annual_value">Annual Value</Label>
                  <Input
                    id="annual_value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.annual_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, annual_value: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="service" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="service_level">Service Level</Label>
                <Select
                  value={formData.service_level}
                  onValueChange={(value: ServiceContract['service_level']) => setFormData(prev => ({ ...prev, service_level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                  placeholder="Enter service contract terms and conditions"
                  rows={6}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : serviceContract ? 'Update Contract' : 'Create Contract'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceContractFormModal;
