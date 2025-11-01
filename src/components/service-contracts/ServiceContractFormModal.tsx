import React, { useState, useEffect, useCallback } from 'react';
import { Drawer } from 'antd';
import { ServiceContractType, ServiceContractCreateInput, ServiceContractUpdateInput } from '@/types/serviceContract';
import { Customer } from '@/types/crm';
import { Product } from '@/types/masters';
import { customerService, productService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { moduleServiceContractService } from '@/modules/features/serviceContract/services/serviceContractService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { FileText, Calendar, DollarSign, Settings } from 'lucide-react';

type FormState = {
  title: string;
  status: ServiceContractType['status'];
  serviceType: ServiceContractType['serviceType'];
  priority: ServiceContractType['priority'];
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  startDate: string;
  endDate: string;
  value: number;
  currency: string;
  autoRenew: boolean;
  renewalPeriodMonths: number;
  slaTerms: string;
  renewalTerms: string;
  serviceScope: string;
  description: string;
};

const statusOptions: ServiceContractType['status'][] = ['draft', 'pending_approval', 'active', 'on_hold', 'completed', 'cancelled', 'expired'];
const serviceTypeOptions: ServiceContractType['serviceType'][] = ['support', 'maintenance', 'consulting', 'training', 'hosting', 'custom'];
const priorityOptions: ServiceContractType['priority'][] = ['low', 'medium', 'high', 'urgent'];
const currencyOptions = ['USD', 'EUR', 'GBP', 'INR'];

interface ServiceContractFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceContract?: ServiceContractType | null;
  onSuccess: () => void;
}

const formatDateInput = (value?: string) => {
  if (!value) return '';
  if (value.includes('T')) return value.split('T')[0];
  return value;
};

const ServiceContractFormModal: React.FC<ServiceContractFormModalProps> = ({
  open,
  onOpenChange,
  serviceContract,
  onSuccess
}) => {
  const { tenant } = useAuth();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState('basic');

  const defaultFormState = useCallback((): FormState => ({
    title: '',
    status: 'draft',
    serviceType: 'support',
    priority: 'medium',
    customerId: '',
    customerName: '',
    productId: '',
    productName: '',
    startDate: '',
    endDate: '',
    value: 0,
    currency: 'USD',
    autoRenew: true,
    renewalPeriodMonths: 12,
    slaTerms: '',
    renewalTerms: '',
    serviceScope: '',
    description: ''
  }), []);

  const [formData, setFormData] = useState<FormState>(defaultFormState());

  const resetForm = useCallback(() => {
    setFormData(defaultFormState());
    setActiveTab('basic');
  }, [defaultFormState]);

  const loadInitialData = useCallback(async () => {
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
      toast.error('Failed to load form data');
    }
  }, []);

  useEffect(() => {
    if (open && tenant?.tenantId) {
      loadInitialData();
      if (serviceContract) {
        setFormData({
          title: serviceContract.title || '',
          status: serviceContract.status,
          serviceType: serviceContract.serviceType,
          priority: serviceContract.priority,
          customerId: serviceContract.customerId,
          customerName: serviceContract.customerName || '',
          productId: serviceContract.productId || '',
          productName: serviceContract.productName || '',
          startDate: formatDateInput(serviceContract.startDate),
          endDate: formatDateInput(serviceContract.endDate),
          value: serviceContract.value,
          currency: serviceContract.currency || 'USD',
          autoRenew: !!serviceContract.autoRenew,
          renewalPeriodMonths: serviceContract.renewalPeriodMonths || 12,
          slaTerms: serviceContract.slaTerms || '',
          renewalTerms: serviceContract.renewalTerms || '',
          serviceScope: serviceContract.serviceScope || '',
          description: serviceContract.description || ''
        });
      } else {
        resetForm();
      }
    }
  }, [open, serviceContract, tenant?.tenantId, loadInitialData, resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId || !formData.title.trim() || !formData.startDate || !formData.endDate) {
      toast.error('Please complete required fields');
      return;
    }

    try {
      setLoading(true);

      const basePayload = {
        title: formData.title,
        description: formData.description,
        customerId: formData.customerId,
        customerName: formData.customerName,
        productId: formData.productId || undefined,
        productName: formData.productName || undefined,
        serviceType: formData.serviceType,
        priority: formData.priority,
        value: formData.value,
        currency: formData.currency,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        autoRenew: formData.autoRenew,
        renewalPeriodMonths: formData.renewalPeriodMonths,
        slaTerms: formData.slaTerms || undefined,
        renewalTerms: formData.renewalTerms || undefined,
        serviceScope: formData.serviceScope || undefined
      };

      if (serviceContract) {
        const updatePayload: ServiceContractUpdateInput = {
          ...basePayload,
          status: formData.status
        };
        await moduleServiceContractService.updateServiceContract(serviceContract.id, updatePayload);
        toast.success('Service contract updated successfully');
      } else {
        const createPayload: ServiceContractCreateInput = {
          ...basePayload,
          status: formData.status
        };
        await moduleServiceContractService.createServiceContract(createPayload);
        toast.success('Service contract created successfully');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to save service contract');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      width={840}
      destroyOnClose
      maskClosable={!loading}
      closable={!loading}
      styles={{ body: { padding: 0 } }}
    >
      <form onSubmit={handleSubmit} className="flex h-full flex-col">
        <div className="border-b px-6 py-5">
          <h2 className="text-xl font-semibold">
            {serviceContract ? 'Edit Service Contract' : 'Create Service Contract'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {serviceContract
              ? 'Update service contract details and terms'
              : 'Create a new service contract for product support and maintenance'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                  <Label htmlFor="title">Contract Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter contract title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: ServiceContractType['status']) =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option.replace(/_/g, ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service_type">Service Type</Label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={(value: ServiceContractType['serviceType']) =>
                      setFormData((prev) => ({ ...prev, serviceType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: ServiceContractType['priority']) =>
                      setFormData((prev) => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer *</Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) => {
                      const customer = customers.find((c) => c.id === value);
                      setFormData((prev) => ({
                        ...prev,
                        customerId: value,
                        customerName: customer?.company_name || ''
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
                  <Label htmlFor="product">Product</Label>
                  <Select
                    value={formData.productId}
                    onValueChange={(value) => {
                      const product = Array.isArray(products) ? products.find((p) => p.id === value) : null;
                      setFormData((prev) => ({
                        ...prev,
                        productId: value,
                        productName: product?.name || ''
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

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter contract description"
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="dates" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="renewal_period">Renewal Period (Months)</Label>
                  <Input
                    id="renewal_period"
                    type="number"
                    value={formData.renewalPeriodMonths}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, renewalPeriodMonths: Number(e.target.value) || 0 }))
                    }
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auto_renew">Auto Renew</Label>
                  <div className="flex h-10 items-center space-x-2 rounded-md border px-3">
                    <Checkbox
                      id="auto_renew"
                      checked={formData.autoRenew}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, autoRenew: Boolean(checked) }))
                      }
                    />
                    <Label htmlFor="auto_renew" className="cursor-pointer">
                      Enable automatic renewal
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="renewal_terms">Renewal Terms</Label>
                <Textarea
                  id="renewal_terms"
                  value={formData.renewalTerms}
                  onChange={(e) => setFormData((prev) => ({ ...prev, renewalTerms: e.target.value }))}
                  placeholder="Enter renewal terms"
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Contract Value</Label>
                  <Input
                    id="value"
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData((prev) => ({ ...prev, value: Number(e.target.value) || 0 }))}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sla_terms">SLA Terms</Label>
                <Textarea
                  id="sla_terms"
                  value={formData.slaTerms}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slaTerms: e.target.value }))}
                  placeholder="Enter SLA terms"
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="service" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="service_scope">Service Scope</Label>
                <Textarea
                  id="service_scope"
                  value={formData.serviceScope}
                  onChange={(e) => setFormData((prev) => ({ ...prev, serviceScope: e.target.value }))}
                  placeholder="Describe the scope of service"
                  rows={4}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t px-6 py-4">
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : serviceContract ? 'Save Changes' : 'Create Contract'}
            </Button>
          </div>
        </div>
      </form>
    </Drawer>
  );
};

export default ServiceContractFormModal;
