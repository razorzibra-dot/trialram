# AI Agent Implementation Instructions for PDS-CRM Application

## Introduction

You are tasked with implementing the pending functionality in the PDS-CRM Application. This document provides detailed instructions on how to approach this task systematically while maintaining architectural integrity and ensuring no existing functionality is broken.

## System Architecture Overview

The PDS-CRM Application follows a layered architecture:

1. **Database Layer**: Supabase/PostgreSQL
2. **API/Service Layer**: Service interfaces with Supabase implementation
3. **State Management Layer**: React Query and Zustand
4. **UI Component Layer**: Ant Design components
5. **Routing Layer**: React Router with permission checks

## Implementation Approach

### Step 1: Analyze the Current State

Before making any changes:

1. **Understand the database schema**
   - Review all migration files in `supabase/migrations/`
   - Identify table relationships and constraints
   - Note any existing triggers or functions

2. **Examine the service layer**
   - Review service interfaces in `src/services/`
   - Understand the Supabase implementation in `src/services/supabase/`
   - Note any existing error handling patterns

3. **Analyze the UI components**
   - Review existing components in `src/components/` and `src/modules/features/`
   - Understand the component hierarchy and data flow
   - Note any reusable components or patterns

4. **Check the routing structure**
   - Review route definitions in `src/modules/features/*/routes.tsx`
   - Understand permission checks and route guards

### Step 2: Implement Each Feature Systematically

For each feature, follow this workflow:

1. **Database Layer**
   - Check if the required tables and relationships exist
   - If not, create migration files in `supabase/migrations/`
   - Test migrations locally before proceeding

2. **Service Layer**
   - Implement or update service methods in `src/services/`
   - Create Supabase implementation in `src/services/supabase/`
   - Add proper error handling and validation
   - Write unit tests for critical functions

3. **State Management**
   - Implement React Query hooks for data fetching
   - Create Zustand stores for client state if needed
   - Ensure proper loading and error states

4. **UI Components**
   - Create or update components in `src/components/` or `src/modules/features/`
   - Implement form validation with Zod schemas
   - Ensure responsive design for all screens
   - Follow Ant Design patterns and guidelines

5. **Routing**
   - Update route definitions if needed
   - Add permission checks for new routes

6. **Testing**
   - Test each feature with different user roles
   - Verify all form validations
   - Test all API integrations
   - Ensure no existing functionality is broken

### Step 3: Feature-Specific Implementation Guidelines

#### Dashboard Enhancement

1. **Role-Based Dashboard Widgets**
   - Create separate widget components for each role
   - Use the user's role from auth context to determine which widgets to display
   - Implement service methods to fetch widget data
   - Use Recharts for visualizations

2. **Implementation Steps**:
   ```typescript
   // Example: AdminDashboardWidgets.tsx
   import React from 'react';
   import { Card, Row, Col } from 'antd';
   import { useQuery } from '@tanstack/react-query';
   import { dashboardService } from '@/services/dashboardService';
   import { StatCard } from '@/components/common/StatCard';
   
   export const AdminDashboardWidgets: React.FC = () => {
     const { data: expiringContracts, isLoading: isLoadingContracts } = 
       useQuery(['expiringContracts'], () => dashboardService.getExpiringContracts(7));
     
     const { data: pendingComplaints, isLoading: isLoadingComplaints } = 
       useQuery(['pendingComplaints'], () => dashboardService.getPendingComplaints(7));
     
     // Render widgets based on fetched data
     return (
       <Row gutter={[16, 16]}>
         <Col xs={24} md={12} lg={8}>
           <StatCard 
             title="Expiring Contracts" 
             value={expiringContracts?.length || 0}
             loading={isLoadingContracts}
             // Additional props
           />
         </Col>
         {/* More widgets */}
       </Row>
     );
   };
   ```

#### Product Sales Enhancement

1. **Product Sales Form**
   - Update the form with all required fields
   - Implement customer and product selection components
   - Add file upload functionality
   - Implement auto-calculation of warranty period

2. **Service Contract Generation**
   - Create utility to generate service contract from product sale
   - Implement transaction to insert service contract record
   - Add contract generation button to product sales detail view

3. **Implementation Steps**:
   ```typescript
   // Example: contractGenerator.ts
   import { supabase } from '@/services/supabase/client';
   import { ProductSale } from '@/types/productSales';
   import { ServiceContract } from '@/types/contracts';
   
   export const generateServiceContract = async (productSale: ProductSale): Promise<ServiceContract> => {
     // Generate contract number
     const contractNumber = `SC-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
     
     // Create service contract object
     const serviceContract = {
       product_sale_id: productSale.id,
       contract_number: contractNumber,
       customer_id: productSale.customer_id,
       customer_name: productSale.customer_name,
       product_id: productSale.product_id,
       product_name: productSale.product_name,
       start_date: productSale.delivery_date,
       end_date: productSale.warranty_expiry,
       status: 'active',
       contract_value: productSale.total_cost,
       annual_value: productSale.total_cost,
       service_level: 'standard',
       tenant_id: productSale.tenant_id,
     };
     
     // Insert into database
     const { data, error } = await supabase
       .from('service_contracts')
       .insert(serviceContract)
       .select()
       .single();
     
     if (error) throw error;
     
     // Update product sale with service contract ID
     await supabase
       .from('product_sales')
       .update({ service_contract_id: data.id })
       .eq('id', productSale.id);
     
     return data;
   };
   ```

#### Service Contract Management

1. **Service Contract Form**
   - Update the form with all required fields
   - Implement customer and product selection components
   - Add file upload functionality

2. **PDF Generation**
   - Create PDF template service
   - Implement HTML template editor
   - Add variable substitution for dynamic content

3. **Notification System**
   - Implement notification service
   - Create WhatsApp integration service
   - Implement notification scheduler

4. **Implementation Steps**:
   ```typescript
   // Example: pdfTemplateService.ts
   import { supabase } from '@/services/supabase/client';
   import { PdfTemplate } from '@/types/templates';
   
   export const pdfTemplateService = {
     async getTemplates() {
       const { data, error } = await supabase
         .from('pdf_templates')
         .select('*')
         .order('created_at', { ascending: false });
       
       if (error) throw error;
       return data;
     },
     
     async getTemplateById(id: string) {
       const { data, error } = await supabase
         .from('pdf_templates')
         .select('*')
         .eq('id', id)
         .single();
       
       if (error) throw error;
       return data;
     },
     
     async createTemplate(template: PdfTemplate) {
       const { data, error } = await supabase
         .from('pdf_templates')
         .insert(template)
         .select()
         .single();
       
       if (error) throw error;
       return data;
     },
     
     // Additional methods
   };
   ```

#### Complaint Management

1. **Complaint Form**
   - Update the form with all required fields
   - Implement status management
   - Add engineer assignment functionality

2. **Complaint History Tracking**
   - Create complaint history service
   - Implement history timeline component
   - Add action buttons for status changes

3. **Implementation Steps**:
   ```typescript
   // Example: ComplaintHistory.tsx
   import React from 'react';
   import { Timeline, Card, Typography } from 'antd';
   import { useQuery } from '@tanstack/react-query';
   import { complaintHistoryService } from '@/services/complaintHistoryService';
   
   const { Title, Text } = Typography;
   
   interface ComplaintHistoryProps {
     complaintId: string;
   }
   
   export const ComplaintHistory: React.FC<ComplaintHistoryProps> = ({ complaintId }) => {
     const { data: history, isLoading } = useQuery(
       ['complaintHistory', complaintId],
       () => complaintHistoryService.getComplaintHistory(complaintId)
     );
     
     if (isLoading) return <div>Loading history...</div>;
     
     return (
       <Card title="Complaint History" loading={isLoading}>
         <Timeline>
           {history?.map((entry) => (
             <Timeline.Item key={entry.id} color={getStatusColor(entry.status)}>
               <Title level={5}>{entry.status}</Title>
               <Text type="secondary">{new Date(entry.created_at).toLocaleString()}</Text>
               <div>{entry.comments}</div>
               <Text type="secondary">By: {entry.created_by_name}</Text>
             </Timeline.Item>
           ))}
         </Timeline>
       </Card>
     );
   };
   
   const getStatusColor = (status: string) => {
     switch (status) {
       case 'new': return 'blue';
       case 'in_progress': return 'orange';
       case 'closed': return 'green';
       default: return 'gray';
     }
   };
   ```

#### Job Work Management

1. **Job Work Form**
   - Update the form with all required fields
   - Implement customer selection component
   - Add auto-pricing from job pricing master

2. **Job Reference ID Generation**
   - Create job reference ID generator utility
   - Implement in job work form

3. **Implementation Steps**:
   ```typescript
   // Example: jobReferenceGenerator.ts
   import { supabase } from '@/services/supabase/client';
   
   export const generateJobReferenceId = async (customerId: string): Promise<string> => {
     // Get customer short name
     const { data: customer, error } = await supabase
       .from('customers')
       .select('short_name')
       .eq('id', customerId)
       .single();
     
     if (error) throw error;
     
     // Generate date part
     const today = new Date();
     const datePart = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
     
     // Generate unique ID
     const uniqueId = Math.floor(100000 + Math.random() * 900000);
     
     // Combine parts
     return `${customer.short_name}-${datePart}-${uniqueId}`;
   };
   ```

### Step 4: Cross-Module Integration

1. **Ensure Consistent Data Flow**
   - Verify that data flows correctly between modules
   - Test workflows that span multiple modules
   - Check that state is properly synchronized

2. **Optimize Performance**
   - Implement query caching with React Query
   - Optimize large data table rendering
   - Add pagination and filtering to all list views

3. **Final Testing**
   - Test all features with different user roles
   - Verify all form validations
   - Test all API integrations
   - Ensure no existing functionality is broken

## Best Practices

### Code Organization

1. **Follow the Existing Pattern**
   - Maintain the modular architecture
   - Keep components focused on a single responsibility
   - Use shared components for common UI elements

2. **Naming Conventions**
   - Use PascalCase for component names
   - Use camelCase for variables and functions
   - Use UPPER_SNAKE_CASE for constants
   - Use kebab-case for file names

3. **File Structure**
   - Group related files in directories
   - Keep component files small and focused
   - Extract complex logic into separate utility functions

### Error Handling

1. **Service Layer**
   - Use try/catch blocks for all async operations
   - Return meaningful error messages
   - Log errors for debugging

2. **UI Layer**
   - Display user-friendly error messages
   - Provide fallback UI for error states
   - Implement retry mechanisms where appropriate

### Performance Optimization

1. **React Query**
   - Use query keys that reflect the data dependencies
   - Implement stale-while-revalidate pattern
   - Use prefetching for anticipated data needs

2. **Component Rendering**
   - Use React.memo for expensive components
   - Implement virtualization for long lists
   - Avoid unnecessary re-renders

### Security

1. **Input Validation**
   - Validate all user inputs
   - Sanitize data before displaying
   - Use prepared statements for database queries

2. **Authentication and Authorization**
   - Check permissions for all operations
   - Implement proper token handling
   - Use row-level security in Supabase

## Conclusion

By following these instructions, you will be able to implement the pending functionality in the PDS-CRM Application systematically while maintaining architectural integrity and ensuring no existing functionality is broken. Remember to test thoroughly at each step and document your changes for future reference.