---
title: Service Contract Module - Enterprise Edition
description: Complete documentation for the Service Contract module with advanced multi-step wizard forms, document management, delivery scheduling, and SLA tracking
lastUpdated: 2025-01-30
version: 1.0.0
status: active
category: module
relatedModules: [contracts, customers, notifications, rbac]
author: AI Agent
---

# Service Contract Module - Enterprise Edition

**Version**: 1.0.0 | **Status**: Production-Ready | **Last Updated**: 2025-01-30

## 📋 Overview

The Service Contract module is a **completely separate, production-grade module** designed to manage service delivery contracts, service level agreements (SLAs), delivery milestones, and service fulfillment tracking. This module is **distinct from the Contract module** and provides specialized functionality for managing ongoing service engagements.

### Key Distinctions from Contract Module

| Aspect | Contract Module | Service Contract Module |
|--------|-----------------|------------------------|
| **Focus** | Client agreements & renewals | Service delivery & SLA fulfillment |
| **Duration** | Typically fixed-term | Ongoing/recurring |
| **Tracking** | Financial terms & compliance | Delivery milestones & issues |
| **Documents** | Contract documents | SLA terms, schedules, amendments |
| **Metrics** | Value, renewals, approvals | SLA compliance, delivery %completion |

**⚠️ CRITICAL**: Never mix these modules or share state between them. Each is independently deployable.

---

## 🏗️ Architecture & Structure

```
serviceContract/
├── components/
│   ├── ServiceContractWizardForm.tsx          # Multi-step creation wizard
│   ├── ServiceContractFormPanel.tsx           # Quick edit/create drawer
│   ├── ServiceContractDetailPanel.tsx         # Rich detail view with tabs
│   ├── ServiceContractsList.tsx               # Advanced list with filtering
│   ├── ServiceContractDocumentManager.tsx     # Document upload/management
│   ├── ServiceDeliveryMilestonePanel.tsx      # Timeline & milestone tracking
│   └── ServiceContractIssuePanel.tsx          # Issue tracking & resolution
├── hooks/
│   └── useServiceContracts.ts                 # All React Query hooks
├── services/
│   └── serviceContractService.ts              # Module-level service layer
├── store/
│   └── serviceContractStore.ts                # Zustand state management (optional)
├── views/
│   ├── ServiceContractsPage.tsx               # Main list page
│   └── ServiceContractDetailPage.tsx          # Detail view page
├── index.ts                                   # Module exports
├── routes.tsx                                 # Route configuration
└── DOC.md                                     # This file
```

---

## ✨ Key Features

### 1. **Service Contract Management**
- Create, read, update, delete service contracts
- Multiple service types: support, maintenance, consulting, training, hosting, custom
- Contract lifecycle tracking: draft → pending_approval → active → completed/cancelled
- Priority levels: low, medium, high, urgent
- Approval workflow with audit trail

### 2. **Multi-Step Wizard Form** (Enterprise Feature)
- **Step 1**: Basic Information (title, description, customer, product)
- **Step 2**: Service Details (SLA terms, scope, exclusions)
- **Step 3**: Financial Terms (value, billing, payment terms)
- **Step 4**: Dates & Renewal (start, end, auto-renewal settings)
- **Step 5**: Team Assignment (primary/secondary contacts)
- **Step 6**: Scheduling (delivery schedule, hours/week, timezone)
- **Step 7**: Documents (upload supporting docs, SLA agreements)
- **Step 8**: Review & Confirmation

Features:
- Progress tracking
- Field validation at each step
- Back/forward navigation
- Auto-save capability
- Validation error highlighting
- Helpful tooltips and examples

### 3. **Document Management** (Enterprise Feature)
- Upload and attach SLA agreements, schedules, amendments
- Document versioning with automatic version tracking
- File type support: PDF, Word, Excel, PowerPoint, images
- Document categorization: SLA document, schedule, attachment, signed contract
- Full audit trail of uploads and changes
- Secure storage with access control

### 4. **Service Delivery Milestones**
- Define and track service delivery milestones
- Timeline view with Gantt-style visualization
- Milestone status: pending, in_progress, completed, delayed, cancelled
- Completion percentage tracking
- Deliverable acceptance criteria
- Dependencies between milestones
- Responsible party assignment

### 5. **SLA Terms & Service Scope**
- Rich text editor for SLA terms definition
- Support for complex service level agreements
- Service scope documentation
- Exclusions and limitations
- Renewal terms configuration
- Automatic renewal with configurable periods

### 6. **Issue & Risk Tracking**
- Report and track service delivery issues
- Severity levels: low, medium, high, critical
- Issue categories: SLA breach, resource, schedule, scope, budget
- Resolution workflow: open → in_progress → resolved → closed
- Target resolution dates
- Impact assessment
- Assigned responsibility

### 7. **Statistics & Analytics**
- Total contracts count
- Breakdown by service type and status
- Active vs. pending vs. expired contracts
- Total and average contract value
- Open issues and SLA breaches
- Upcoming milestones
- Document inventory

### 8. **Team Collaboration**
- Assign contracts to team members
- Secondary contact support
- Activity audit log
- Comments and notes
- Approval workflows
- Role-based access control (RBAC)

---

## 🧩 Component Descriptions

### ServiceContractWizardForm
**Type**: Multi-step wizard component
**Purpose**: Enterprise-grade form for creating new service contracts

**Props**:
```typescript
interface ServiceContractWizardFormProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Partial<ServiceContractType>;
}
```

**Features**:
- 8-step guided experience
- Auto-validation at each step
- Progress indicator
- Field dependencies & dynamic validation
- Document upload integration
- Draft auto-save
- Helpful inline help text

### ServiceContractFormPanel
**Type**: Drawer component for quick edit
**Purpose**: Fast edit/update of existing contracts

**Props**:
```typescript
interface ServiceContractFormPanelProps {
  visible: boolean;
  contract?: ServiceContractType | null;
  onClose: () => void;
  onSuccess: () => void;
}
```

### ServiceContractDetailPanel
**Type**: Rich detail view with tabs
**Purpose**: Comprehensive contract information display

**Tabs**:
- **Overview**: Key metrics, status, financial summary
- **Details**: Full contract information
- **SLA & Terms**: Service scope, SLA terms, exclusions
- **Team**: Assigned members, contact details
- **Milestones**: Timeline and deliverables
- **Documents**: Uploaded files and versions
- **Issues**: Problem tracking and resolution
- **Activity**: Audit log of all changes

### ServiceContractDocumentManager
**Type**: File management component
**Purpose**: Upload, version, and organize contract documents

**Features**:
- Drag-and-drop upload
- Multiple file upload
- Progress indication
- File type validation
- Document preview
- Version history
- Download functionality
- Delete with confirmation

### ServiceDeliveryMilestonePanel
**Type**: Milestone timeline component
**Purpose**: Track service delivery progress

**Views**:
- Timeline view (Gantt-style)
- List view
- Kanban status board
- Completion progress indicators

### ServiceContractIssuePanel
**Type**: Issue tracker component
**Purpose**: Report and manage service delivery issues

**Features**:
- Issue creation wizard
- Severity and impact assessment
- Assignment to team members
- Resolution tracking
- SLA compliance monitoring
- Bulk issue operations

---

## 🔌 API & Hooks

### React Query Hooks

**Data Fetching**:
```typescript
// Get contracts with filters
const { data: contractsResponse, isLoading } = useServiceContracts({
  status: 'active',
  serviceType: 'support',
  page: 1,
  pageSize: 20,
});

// Get single contract
const { data: contract } = useServiceContract(contractId);

// Get contract with all related data
const { data: fullData } = useServiceContractWithDetails(contractId);

// Get statistics
const { data: stats } = useServiceContractStats();
```

**Mutations**:
```typescript
// Create contract
const { mutate: createContract, isPending } = useCreateServiceContract();
createContract(formData, {
  onSuccess: () => {
    // Handle success
  }
});

// Update contract
const { mutate: updateContract } = useUpdateServiceContract();
updateContract({ id: contractId, data: updatedData });

// Delete contract
const { mutate: deleteContract } = useDeleteServiceContract();
deleteContract(contractId);

// Bulk operations
const { bulkUpdate, bulkDelete } = useBulkServiceContractOperations();
bulkUpdate.mutate({ ids: [...], updates: {...} });
```

**Related Data**:
```typescript
// Documents
const { data: documents } = useServiceContractDocuments(contractId);
const { mutate: addDocument } = useAddServiceContractDocument();

// Milestones
const { data: milestones } = useServiceDeliveryMilestones(contractId);
const { mutate: addMilestone } = useAddServiceDeliveryMilestone();

// Issues
const { data: issues } = useServiceContractIssues(contractId);
const { mutate: reportIssue } = useAddServiceContractIssue();
```

### Query Keys Structure
```typescript
serviceContractKeys.all              // ['serviceContracts']
serviceContractKeys.lists()          // ['serviceContracts', 'list']
serviceContractKeys.list(filters)    // ['serviceContracts', 'list', filters]
serviceContractKeys.detail(id)       // ['serviceContracts', 'detail', id]
serviceContractKeys.documents(id)    // ['serviceContracts', 'detail', id, 'documents']
serviceContractKeys.milestones(id)   // ['serviceContracts', 'detail', id, 'milestones']
serviceContractKeys.issues(id)       // ['serviceContracts', 'detail', id, 'issues']
serviceContractKeys.stats()          // ['serviceContracts', 'stats']
```

---

## 📊 Data Types & Interfaces

### ServiceContractType
Complete service contract record

```typescript
interface ServiceContractType {
  id: string;
  contractNumber: string;
  title: string;
  description?: string;
  
  // Related entities
  customerId: string;
  customerName: string;
  productId?: string;
  productName?: string;
  
  // Service details
  serviceType: 'support' | 'maintenance' | 'consulting' | 'training' | 'hosting' | 'custom';
  status: 'draft' | 'pending_approval' | 'active' | 'on_hold' | 'completed' | 'cancelled' | 'expired';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Financial
  value: number;
  currency: string;
  billingFrequency?: string;
  paymentTerms?: string;
  
  // SLA & Service Terms
  slaTerms?: string;
  renewalTerms?: string;
  serviceScope?: string;
  exclusions?: string;
  
  // Dates
  startDate: string;
  endDate: string;
  estimatedCompletionDate?: string;
  
  // Renewal
  autoRenew: boolean;
  renewalPeriodMonths?: number;
  nextRenewalDate?: string;
  
  // Scheduling
  deliverySchedule?: string;
  scheduledHoursPerWeek?: number;
  timeZone?: string;
  
  // Team
  assignedToUserId?: string;
  assignedToName?: string;
  secondaryContactId?: string;
  secondaryContactName?: string;
  
  // Metadata
  approvalStatus?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  
  // Audit
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

### ServiceContractCreateInput
Input for creating new contracts

```typescript
interface ServiceContractCreateInput {
  title: string;
  description?: string;
  customerId: string;
  customerName: string;
  productId?: string;
  serviceType: string;
  value: number;
  startDate: string;
  endDate: string;
  // ... other optional fields
}
```

---

## 🗄️ Database Schema

### service_contracts (Main Table)
Core service contract information
- Contract identification and basic info
- Related customer and product references
- Financial terms and billing information
- SLA terms, service scope, exclusions
- Renewal configuration
- Team assignments
- Audit fields (created_at, updated_at, created_by)

### service_contract_documents
Uploaded documents and attachments
- File storage and versioning
- Document categorization
- Upload tracking
- Access control

### service_delivery_milestones
Service delivery tracking
- Milestone definitions and dates
- Deliverables and acceptance criteria
- Completion tracking
- Dependencies

### service_contract_issues
Issue and risk tracking
- Issue reporting and categorization
- Severity and impact assessment
- Resolution tracking

### service_contract_activity_log
Complete audit trail
- All changes tracked with timestamps
- User attribution
- Change details (before/after values)

---

## 🔐 Role-Based Access Control

Permissions:
- `serviceContracts:view` - View contracts and details
- `serviceContracts:create` - Create new contracts
- `serviceContracts:update` - Edit existing contracts
- `serviceContracts:approve` - Approve contracts
- `serviceContracts:delete` - Delete contracts
- `serviceContracts:export` - Export contract data
- `serviceContracts:manageDocuments` - Upload/download documents
- `serviceContracts:manageMilestones` - Manage milestones
- `serviceContracts:manageIssues` - Report and track issues

---

## 🔄 State Management

### React Query (Remote State)
- Automatic caching and synchronization
- Stale time: 5 minutes for lists, 10 minutes for stats
- Automatic refetch on window focus
- Optimistic updates support

### Zustand Store (Optional Local State)
For advanced use cases:
- Contract filters and sort preferences
- UI state (drawer visibility, selected items)
- Local form state

---

## 📋 Usage Examples

### Basic List View
```typescript
import { ServiceContractsList, useServiceContracts } from '@/modules/features/serviceContract';

function ContractsPage() {
  const { data, isLoading } = useServiceContracts({
    status: 'active',
    page: 1,
    pageSize: 20,
  });

  return (
    <div>
      {isLoading && <Spin />}
      <ServiceContractsList contracts={data?.data || []} />
    </div>
  );
}
```

### Creating Contract with Wizard
```typescript
function CreateContractModal() {
  const [visible, setVisible] = useState(false);
  const { mutate: createContract } = useCreateServiceContract();

  const handleSubmit = async (data: ServiceContractWizardData) => {
    createContract(data);
  };

  return (
    <>
      <Button onClick={() => setVisible(true)}>Create Contract</Button>
      <ServiceContractWizardForm
        visible={visible}
        onClose={() => setVisible(false)}
        onSuccess={() => setVisible(false)}
      />
    </>
  );
}
```

### Document Upload
```typescript
function DocumentManager({ contractId }: { contractId: string }) {
  const { data: documents } = useServiceContractDocuments(contractId);
  const { mutate: addDocument } = useAddServiceContractDocument();

  const handleFileUpload = async (file: File) => {
    const filePath = await uploadToStorage(file);
    addDocument({
      serviceContractId: contractId,
      fileName: file.name,
      fileSize: file.size,
      filePath,
      fileType: file.type,
      documentType: 'attachment',
    });
  };

  return (
    <ServiceContractDocumentManager
      documents={documents || []}
      onUpload={handleFileUpload}
    />
  );
}
```

---

## 🧪 Testing

### Unit Tests
- Service layer methods with mock data
- Validation schemas and rules
- Hook behavior with mock queries
- Component rendering and interaction

### Integration Tests
- Complete create/edit/delete workflows
- Filter and pagination functionality
- Document upload and storage
- Milestone tracking

### E2E Tests
- Full user journeys from list to detail
- Multi-step wizard completion
- Document management workflows
- Issue reporting and resolution

---

## 🚀 Performance Optimizations

1. **Query Caching**: React Query caches with configurable stale times
2. **Memoization**: Components use React.memo to prevent re-renders
3. **Code Splitting**: Routes lazy-loaded for initial load performance
4. **Pagination**: Server-side pagination for large datasets
5. **Indexes**: Database indexes on frequently filtered fields
6. **Batch Operations**: Bulk update/delete for efficiency

---

## ⚠️ Common Pitfalls

### ❌ DON'T Mix Modules
```typescript
// WRONG - Never mix Contract and Service Contract modules
import { contractService } from '@/modules/features/contracts';
import { serviceContractService } from '@/modules/features/serviceContract';

// Use one or the other, not both
```

### ✅ DO Use Factory Pattern
```typescript
// CORRECT - Always use service factory for routing
import { serviceContractService } from '@/services/serviceFactory';

const contract = await serviceContractService.getServiceContract(id);
```

### ✅ DO Validate Dates
```typescript
// CORRECT - Ensure endDate > startDate
if (new Date(endDate) <= new Date(startDate)) {
  throw new Error('End date must be after start date');
}
```

### ✅ DO Handle Loading States
```typescript
// CORRECT - Always handle loading and error
const { data, isLoading, error } = useServiceContract(id);

if (isLoading) return <Spin />;
if (error) return <Alert type="error" message={error.message} />;

return <div>{/* render data */}</div>;
```

---

## 🔗 Integration Points

### With Authentication
- Uses `useAuth()` for permission checks
- JWT tokens in request headers
- Multi-tenant context from current user

### With Notifications
- Sonner toast for user feedback
- Email notifications for approvals
- SMS alerts for critical issues

### With File Storage
- Document storage in S3 or similar
- Secure URLs with expiration
- Virus scanning on upload

### With Audit Logging
- Complete activity trail
- User attribution for all changes
- Compliance reporting

---

## 📚 Related Documentation

- **Contract Module**: `../contracts/DOC.md` (for comparison)
- **Customers Module**: `../customers/DOC.md` (related)
- **Service Factory Pattern**: `../../core/ARCHITECTURE.md`
- **Database Schema**: `../../../../supabase/migrations/20250130000018_*.sql`
- **Type Definitions**: `../../../../src/types/serviceContract.ts`

---

## 🔄 Migration Guide

### From Legacy Implementation
1. Export existing service contracts from old system
2. Map to new ServiceContractType structure
3. Import documents and attachments
4. Migrate approval workflows
5. Configure team assignments
6. Test end-to-end workflows

### API Endpoint Changes
Old endpoints → New service methods:
- `GET /api/contracts` → `useServiceContracts()`
- `GET /api/contracts/:id` → `useServiceContract(id)`
- `POST /api/contracts` → `useCreateServiceContract()`
- `PUT /api/contracts/:id` → `useUpdateServiceContract()`
- `DELETE /api/contracts/:id` → `useDeleteServiceContract()`

---

## 🐛 Troubleshooting

### Issue: Documents not uploading
**Solution**: Check file size limits, CORS settings, and storage permissions

### Issue: Milestones not showing
**Solution**: Verify milestone start dates, refresh cache, check permissions

### Issue: SLA terms not saving
**Solution**: Validate HTML in rich text, check field limits, enable RLS policies

### Issue: Performance slow on large contracts
**Solution**: Use pagination, reduce initial data load, optimize queries

---

## ✅ Deployment Checklist

- [ ] Database migration applied
- [ ] Types and schemas synced
- [ ] Services factory updated
- [ ] Mock and Supabase services tested
- [ ] Hooks tested with React Query
- [ ] Components tested and styled
- [ ] RBAC permissions configured
- [ ] Document storage configured
- [ ] Notifications configured
- [ ] Error handling verified
- [ ] Performance tested
- [ ] Security review completed
- [ ] E2E tests passing
- [ ] Documentation complete

---

## 📞 Support

For issues or questions about the Service Contract module:
1. Check this documentation
2. Review component examples
3. Check related module docs
4. Contact development team

---

**Last Updated**: 2025-01-30 | **Version**: 1.0.0 | **Status**: Production-Ready ✅