---
title: Service Contracts Module
description: Complete documentation for the Service Contracts module including SLA management, contract terms, renewal tracking, and service scheduling
lastUpdated: 2025-01-15
relatedModules: [customers, sales, contracts, jobworks]
category: module
status: production
---

# Service Contracts Module

## Overview

The Service Contracts module manages service-level agreements (SLAs), maintenance contracts, support contracts, and ongoing service relationships with customers. It tracks contract terms, renewal schedules, service coverage, and fulfillment metrics.

## Module Structure

```
service-contracts/
├── components/              # Reusable UI components
│   ├── ServiceContractDetailPanel.tsx    # Side drawer for details
│   ├── ServiceContractFormPanel.tsx      # Side drawer for create/edit
│   └── ServiceContractsList.tsx          # Contracts list component
├── hooks/                   # Custom React hooks
│   ├── useServiceContracts.ts    # React Query hooks
├── services/                # Business logic
│   ├── serviceContractService.ts # Service factory-routed service
│   └── index.ts
├── store/                   # State management
│   ├── serviceContractStore.ts   # Zustand state
├── views/                   # Page components
│   ├── ServiceContractsPage.tsx  # Main contracts page
│   └── ServiceContractDetailPage.tsx
├── index.ts                 # Module entry point
├── routes.tsx               # Route definitions
└── DOC.md                  # This file
```

## Key Features

### 1. Service Contract Management
- Create, read, update, and delete contracts
- Multiple contract types (Maintenance, Support, SLA, Guarantee)
- Contract status tracking (Draft, Active, Expired, Terminated)
- Start and end dates with renewal tracking
- Auto-renewal options

### 2. SLA Management
- Response time SLAs
- Resolution time SLAs
- Availability guarantees
- Escalation procedures
- Penalty clauses

### 3. Service Coverage
- Service hours definition
- Coverage zones
- Equipment/Product coverage
- Service level tiers

### 4. Renewal Management
- Renewal reminders
- Renewal notifications
- Renewal terms
- Renewal history

### 5. Financial Tracking
- Contract value
- Payment terms
- Billing cycle
- Invoice tracking

## Architecture

### Component Layer

#### ServiceContractsPage.tsx
- Ant Design Table with contract list
- Columns: Contract #, Customer, Type, Status, Start Date, End Date, Value, Actions
- Search by contract number, customer
- Filter by status, type, contract value range
- Pagination: 50 contracts per page
- Create contract button

#### ServiceContractDetailPanel.tsx
- Contract information display
- SLA terms and conditions
- Coverage details
- Renewal schedule
- Payment information
- Contact for escalation
- Edit button

#### ServiceContractFormPanel.tsx
- Create/Edit contract form
- Fields: Contract #, Customer, Type, Start Date, End Date, SLA Terms, Value, Terms & Conditions
- DatePicker for dates
- SLA configuration section
- Renewal settings
- File attachments
- Form validation

### State Management (Zustand)

```typescript
interface ServiceContractStore {
  contracts: ServiceContract[];
  selectedContract: ServiceContract | null;
  isLoading: boolean;
  error: string | null;
  
  setContracts: (contracts: ServiceContract[]) => void;
  setSelectedContract: (contract: ServiceContract | null) => void;
  addContract: (contract: ServiceContract) => void;
  updateContract: (contract: ServiceContract) => void;
  deleteContract: (id: string) => void;
}
```

### API/Hooks (React Query)

```typescript
// Get all contracts
const { data: contracts } = useServiceContracts(filters);

// Get single contract
const { data: contract } = useServiceContract(contractId);

// Create contract
const createMutation = useCreateServiceContract();
await createMutation.mutateAsync(contractData);

// Update contract
const updateMutation = useUpdateServiceContract(contractId);
await updateMutation.mutateAsync(updates);

// Get renewal alerts
const { data: renewalAlerts } = useContractRenewalAlerts();
```

## Data Types & Interfaces

```typescript
interface ServiceContract {
  id: string;
  contractNumber: string;
  customerId: string;
  customerName: string;
  type: 'maintenance' | 'support' | 'sla' | 'guarantee';
  status: 'draft' | 'active' | 'expired' | 'terminated';
  startDate: string;
  endDate: string;
  value: number;
  paymentTerms: string;
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  renewalDate?: string;
  autoRenew: boolean;
  renewalTerms?: string;
  
  // SLA Terms
  responseTimeSLA?: number;  // in hours
  resolutionTimeSLA?: number;  // in hours
  availabilityTarget?: number;  // percentage
  
  // Coverage
  serviceHours: string;  // e.g., "24x7" or "9-5"
  coverageZones?: string[];
  coveredProducts?: string[];
  
  // Contact & Escalation
  escalationContact?: string;
  escalationPhone?: string;
  escalationEmail?: string;
  
  // Attachments
  attachments?: string[];
  
  createdAt: string;
  updatedAt: string;
}

interface ServiceContractFilter {
  status?: string[];
  type?: string[];
  customerId?: string;
  dateRange?: [Date, Date];
  valueRange?: [number, number];
  searchQuery?: string;
}
```

## Integration Points

### 1. Customers Module
- Customer association
- Customer contact information
- Customer history

### 2. Sales Module
- Contract conversion from sales deals
- Revenue tracking

### 3. Contracts Module
- Service contract link to master contracts
- Terms synchronization

### 4. JobWorks Module
- Job work scheduling based on SLA
- Service fulfillment tracking

### 5. Notifications Module
- Renewal reminders
- SLA violation alerts
- Escalation notifications

## RBAC & Permissions

```typescript
// Required Permissions
- service-contracts:view       // View contracts
- service-contracts:create     // Create contracts
- service-contracts:edit       // Edit contracts
- service-contracts:delete     // Delete contracts
- service-contracts:renew      // Renew contracts

// Role-Based Access
Admin:
  - Full access
  
Manager:
  - Can view, create, edit
  - Cannot delete
  
Customer:
  - Can view own contracts only
```

## Common Use Cases

### 1. Creating a Service Contract

```typescript
const createServiceContract = async (data: Partial<ServiceContract>) => {
  const mutation = useCreateServiceContract();
  await mutation.mutateAsync({
    contractNumber: 'SC-2025-001',
    customerId: 'cust_123',
    type: 'maintenance',
    status: 'active',
    startDate: '2025-01-15',
    endDate: '2026-01-14',
    value: 12000,
    billingCycle: 'annual',
    responseTimeSLA: 4,  // 4 hours
    resolutionTimeSLA: 24,  // 24 hours
    serviceHours: '24x7',
    autoRenew: true,
  });
};
```

### 2. Checking SLA Breach

```typescript
const checkSLABreach = (contract: ServiceContract, ticket: any) => {
  const now = new Date();
  const ticketAge = (now.getTime() - new Date(ticket.createdAt).getTime()) / 3600000;
  
  if (ticket.status !== 'resolved' && ticketAge > contract.responseTimeSLA!) {
    // SLA breached - send alert
    notificationService.error({
      message: 'SLA Response Time Breached',
      description: `Ticket has not been responded to within ${contract.responseTimeSLA} hours`,
    });
  }
};
```

### 3. Getting Renewal Alerts

```typescript
const { data: renewalAlerts } = useContractRenewalAlerts();
// Alerts for contracts renewing within 30 days
renewalAlerts?.forEach(contract => {
  const renewalDate = new Date(contract.renewalDate!);
  const daysUntilRenewal = Math.ceil((renewalDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  console.log(`Contract ${contract.contractNumber} renews in ${daysUntilRenewal} days`);
});
```

## Troubleshooting

### Issue: Contracts not loading
**Cause**: Service factory not configured  
**Solution**: Verify `VITE_API_MODE` and service in factory

### Issue: SLA calculations incorrect
**Cause**: Time zone or format issues  
**Solution**: Verify timestamps are in UTC format

### Issue: Renewal reminders not sending
**Cause**: Notification service not integrated  
**Solution**: Check notification service configuration

### Issue: Cannot create contract
**Cause**: Validation or permission error  
**Solution**: Verify form data and RBAC permissions

## Related Documentation

- [Customers Module](../customers/DOC.md)
- [Contracts Module](../contracts/DOC.md)
- [JobWorks Module](../jobworks/DOC.md)
- [SLA Management Guide](../../docs/architecture/SLA_MANAGEMENT.md)

## Version Information

- **Last Updated**: 2025-01-15
- **Module Version**: 1.0.0
- **Production Status**: ✅ Ready