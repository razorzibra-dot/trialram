# PDS-CRM Application Implementation Plan

## Overview

This document provides a comprehensive, step-by-step implementation plan for completing all pending functionality in the PDS-CRM Application. The plan is designed to maintain architectural integrity across all layers while ensuring no existing functionality is broken.

## Architecture Layers

The application follows a layered architecture:

1. **Database Layer** (Supabase/PostgreSQL)
   - Tables, relationships, and constraints
   - Row-level security policies
   - Database functions and triggers

2. **API/Service Layer**
   - Service interfaces
   - Supabase implementation
   - Mock implementation for testing
   - Error handling and validation

3. **State Management Layer**
   - React Query for server state
   - Zustand for client state
   - Form state with React Hook Form

4. **UI Component Layer**
   - Ant Design components
   - Custom components
   - Form components
   - Layout components

5. **Routing Layer**
   - React Router
   - Route guards
   - Permission checks

## Implementation Phases

### Phase 1: Dashboard Enhancement (2 days)

#### Step 1: Role-Based Dashboard Widgets
1. Create role-specific dashboard widget components
   - Path: `src/modules/features/dashboard/components/widgets`
   - Files:
     - `AdminDashboardWidgets.tsx`
     - `EngineerDashboardWidgets.tsx`
     - `CustomerDashboardWidgets.tsx`

2. Implement dashboard service methods
   - Path: `src/services/dashboardService.ts`
   - Methods:
     - `getExpiringContracts(days: number)`
     - `getPendingComplaints(days: number)`
     - `getTodayComplaints()`
     - `getCustomerProductCount(customerId: string)`

3. Create Supabase queries
   - Path: `src/services/supabase/dashboardService.ts`
   - Implement database queries for each dashboard metric

4. Update dashboard view to display role-specific widgets
   - Path: `src/modules/features/dashboard/views/DashboardPage.tsx`
   - Use role from auth context to determine which widgets to display

#### Step 2: Dashboard Analytics
1. Create analytics components
   - Path: `src/modules/features/dashboard/components/analytics`
   - Files:
     - `SalesAnalytics.tsx`
     - `ContractAnalytics.tsx`
     - `ComplaintAnalytics.tsx`

2. Implement analytics service methods
   - Path: `src/services/dashboardService.ts`
   - Methods:
     - `getSalesAnalytics(period: string)`
     - `getContractAnalytics(period: string)`
     - `getComplaintAnalytics(period: string)`

3. Create analytics charts using Recharts
   - Implement line charts, bar charts, and pie charts for analytics data

### Phase 2: Product Sales Enhancement (3 days)

#### Step 1: Product Sales Form Enhancement
1. Update product sales form component
   - Path: `src/components/product-sales/ProductSaleForm.tsx`
   - Add fields:
     - Customer selection with add-new capability
     - Product selection with add-new capability
     - Unit quantity input
     - Cost per unit with override capability
     - Delivery date field
     - Auto-calculated warranty period
     - Rich text editor for remarks
     - File attachment upload

2. Implement form validation
   - Use Zod schema for validation
   - Path: `src/modules/features/product-sales/schemas/productSaleSchema.ts`

3. Create customer and product selection components
   - Path: `src/components/common/selectors`
   - Files:
     - `CustomerSelector.tsx`
     - `ProductSelector.tsx`

4. Implement file upload component
   - Path: `src/components/common/FileUpload.tsx`
   - Integrate with Supabase storage

#### Step 2: Service Contract Generation
1. Create service contract generation utility
   - Path: `src/utils/contractGenerator.ts`
   - Implement function to generate service contract from product sale

2. Update product sale service
   - Path: `src/services/productSaleService.ts`
   - Add method: `generateServiceContract(saleId: string)`

3. Implement Supabase transaction
   - Path: `src/services/supabase/productSaleService.ts`
   - Create transaction to insert service contract record

4. Add contract generation button to product sales detail view
   - Path: `src/components/product-sales/ProductSaleDetail.tsx`

### Phase 3: Service Contract Management (3 days)

#### Step 1: Service Contract Form Enhancement
1. Update service contract form component
   - Path: `src/components/service-contracts/ServiceContractForm.tsx`
   - Add fields:
     - Customer selection
     - Product selection
     - Delivery date
     - Warranty date
     - Service charge from cost master
     - Status field
     - Rich text editor for remarks
     - File attachment upload

2. Implement form validation
   - Use Zod schema for validation
   - Path: `src/modules/features/service-contracts/schemas/serviceContractSchema.ts`

#### Step 2: PDF Generation
1. Create PDF template service
   - Path: `src/services/pdfTemplateService.ts`
   - Methods:
     - `getTemplates()`
     - `getTemplateById(id: string)`
     - `createTemplate(template: PdfTemplate)`
     - `updateTemplate(id: string, template: PdfTemplate)`
     - `deleteTemplate(id: string)`
     - `generatePdf(templateId: string, data: any)`

2. Implement HTML template editor
   - Path: `src/components/pdf-templates/TemplateEditor.tsx`
   - Use rich text editor with variable substitution

3. Create PDF generation component
   - Path: `src/components/service-contracts/ContractPdfGenerator.tsx`
   - Integrate with PDF template service

4. Add PDF generation button to service contract detail view
   - Path: `src/components/service-contracts/ServiceContractDetail.tsx`

#### Step 3: Notification System
1. Implement notification service
   - Path: `src/services/notificationService.ts`
   - Methods:
     - `createNotification(notification: Notification)`
     - `getNotifications(userId: string)`
     - `markAsRead(notificationId: string)`
     - `deleteNotification(notificationId: string)`

2. Create WhatsApp integration service
   - Path: `src/services/whatsAppService.ts`
   - Methods:
     - `sendMessage(phoneNumber: string, message: string)`
     - `sendTemplateMessage(phoneNumber: string, templateId: string, params: any)`

3. Implement notification scheduler
   - Path: `src/services/schedulerService.ts`
   - Use node-cron for scheduling
   - Schedule contract renewal notifications

4. Create notification components
   - Path: `src/components/notifications`
   - Files:
     - `NotificationList.tsx`
     - `NotificationItem.tsx`
     - `NotificationBadge.tsx`

### Phase 4: Complaint Management (2 days)

#### Step 1: Complaint Form Enhancement
1. Update complaint form component
   - Path: `src/components/complaints/ComplaintForm.tsx`
   - Add fields:
     - Status management (New, In-progress, Closed)
     - Product name selection
     - Customer name selection
     - Type selection
     - Engineer assignment
     - Engineer final resolution field
     - Comments/remarks with history tracking

2. Implement form validation
   - Use Zod schema for validation
   - Path: `src/modules/features/complaints/schemas/complaintSchema.ts`

#### Step 2: Complaint History Tracking
1. Create complaint history service
   - Path: `src/services/complaintHistoryService.ts`
   - Methods:
     - `addHistoryEntry(complaintId: string, entry: ComplaintHistoryEntry)`
     - `getComplaintHistory(complaintId: string)`

2. Implement complaint history component
   - Path: `src/components/complaints/ComplaintHistory.tsx`
   - Display timeline of complaint status changes and comments

3. Update complaint detail view
   - Path: `src/components/complaints/ComplaintDetail.tsx`
   - Add history timeline
   - Add action buttons for status changes

### Phase 5: Job Work Management (2 days)

#### Step 1: Job Work Form Enhancement
1. Update job work form component
   - Path: `src/components/job-works/JobWorkForm.tsx`
   - Add fields:
     - Customer selection with add-new capability
     - Number of pieces input
     - Size input
     - Auto-populated price from job pricing master
     - Engineer selection
     - Rich text area for remarks

2. Implement form validation
   - Use Zod schema for validation
   - Path: `src/modules/features/job-works/schemas/jobWorkSchema.ts`

#### Step 2: Job Reference ID Generation
1. Create job reference ID generator utility
   - Path: `src/utils/jobReferenceGenerator.ts`
   - Format: customer short name-today's date-UID 6 digit number

2. Update job work service
   - Path: `src/services/jobWorkService.ts`
   - Add method: `generateJobReferenceId(customerId: string)`

3. Implement in job work form
   - Auto-generate reference ID when customer is selected
   - Allow manual override if needed

### Phase 6: PDF Template Management (2 days)

#### Step 1: Template Editor
1. Create HTML template editor component
   - Path: `src/components/pdf-templates/TemplateEditor.tsx`
   - Use rich text editor with HTML editing capabilities
   - Add variable insertion toolbar

2. Implement template preview component
   - Path: `src/components/pdf-templates/TemplatePreview.tsx`
   - Show live preview of template with sample data

#### Step 2: Variable Substitution
1. Create variable substitution utility
   - Path: `src/utils/templateVariableSubstitution.ts`
   - Replace variables in template with actual data

2. Implement template management service
   - Path: `src/services/templateService.ts`
   - Methods:
     - `getTemplateVariables(templateType: string)`
     - `substituteVariables(template: string, data: any)`

### Phase 7: Integration and Testing (2 days)

#### Step 1: Cross-Module Integration
1. Ensure all modules work together seamlessly
2. Test workflows:
   - Product sale → Service contract generation
   - Service contract → PDF generation
   - Contract expiration → Notification

#### Step 2: Performance Optimization
1. Implement query caching with React Query
2. Optimize large data table rendering
3. Add pagination and filtering to all list views

#### Step 3: Final Testing
1. Test all features with different user roles
2. Verify all form validations
3. Test notification system
4. Validate PDF generation

## Implementation Guidelines

### Code Organization
- Follow the existing modular architecture
- Keep components focused on a single responsibility
- Use shared components for common UI elements
- Implement proper error handling at all levels

### State Management
- Use React Query for server state
- Use Zustand for client state
- Use React Hook Form for form state
- Implement proper loading and error states

### API Integration
- Use service abstraction layer
- Implement proper error handling
- Use TypeScript interfaces for all data models
- Follow RESTful principles

### UI/UX Guidelines
- Follow Ant Design patterns
- Ensure responsive design for all screens
- Implement proper form validation with error messages
- Use consistent styling across the application

### Testing
- Write unit tests for critical functions
- Test all forms with valid and invalid data
- Verify all API integrations
- Test with different user roles

## Conclusion

This implementation plan provides a comprehensive roadmap for completing all pending functionality in the PDS-CRM Application. By following this plan, the AI agent can systematically implement each feature while maintaining architectural integrity and ensuring no existing functionality is broken.

The plan is designed to be executed in phases, with each phase building on the previous one. This approach allows for incremental testing and validation, reducing the risk of introducing bugs or breaking existing functionality.