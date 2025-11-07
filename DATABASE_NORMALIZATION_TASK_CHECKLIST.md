---
title: Database Normalization & Optimization - Implementation Task Checklist
description: Complete step-by-step task checklist for database schema normalization and performance optimization across all PDS-CRM modules
date: 2025-01-30
version: 1.0.0
status: active
projectName: PDS-CRM Database Optimization
checklistType: implementation
scope: Full database schema normalization and performance optimization
author: AI Agent
---

# Database Normalization Implementation Checklist

**Project**: Database Schema Normalization & Performance Optimization  
**Status**: 🔴 NOT STARTED  
**Duration**: 3-4 weeks  
**Team Size**: 5-8 developers + 1 database admin + 1 QA lead  
**Last Updated**: 2025-01-30

---

## PRE-IMPLEMENTATION CHECKLIST

### Stakeholder Approval
- [ ] Executive sponsor approval received
- [ ] Architecture team reviewed analysis
- [ ] Database admin committed to timeline
- [ ] Team leads assigned to modules
- [ ] Testing team briefed on scope

### Preparation
- [ ] Create project branch: `database-normalization-2025`
- [ ] Set up staging environment
- [ ] Create full production backup
- [ ] Document baseline metrics
- [ ] Prepare communication plan

**Assignee**: Project Manager  
**Status**: ⬜ PENDING

---

## PHASE 1: ANALYSIS & PLANNING (Week 1)

### Task 1.1: Code Impact Audit

**Objective**: Identify all code that uses denormalized fields

- [ ] **1.1.1** Search codebase for `customer_name` field references
  - Command: `grep -r "customer_name" src/ --include="*.ts" --include="*.tsx" > audit_customer_name.txt`
  - [ ] Count occurrences
  - [ ] Document files: `_audit/customer_name_refs.txt`

- [ ] **1.1.2** Search for `product_name` field references
  - Command: `grep -r "product_name" src/ --include="*.ts" --include="*.tsx" > audit_product_name.txt`
  - [ ] Count occurrences
  - [ ] Document files

- [ ] **1.1.3** Search for `assigned_to_name` field references
  - Command: `grep -r "assigned_to_name" src/ --include="*.ts" --include="*.tsx" > audit_assigned_name.txt`
  - [ ] Count occurrences
  - [ ] Document files

- [ ] **1.1.4** Search for other denormalized fields
  ```bash
  grep -r "customer_email\|customer_phone\|customer_contact\|product_sku\|product_category\|receiver_engineer_name\|assigned_by_name\|approver_name" src/ --include="*.ts" --include="*.tsx"
  ```
  - [ ] Document all occurrences
  - [ ] Create impact matrix

- [ ] **1.1.5** Create audit report
  - [ ] Document: `_audit/DENORMALIZATION_IMPACT_AUDIT.md`
  - [ ] Include: file path, line number, context, module affected
  - [ ] Categorize by module

**Owner**: Lead Developer  
**Timeline**: 2 days  
**Status**: ⬜ NOT STARTED

---

### Task 1.2: Database Schema Audit

**Objective**: Document current schema state

- [ ] **1.2.1** Generate schema dump
  ```bash
  pg_dump --schema-only -h localhost -U postgres crm_db > schema_baseline.sql
  ```

- [ ] **1.2.2** Document table structures
  - Create: `_audit/SCHEMA_BASELINE.md`
  - For each table: columns, types, constraints, indexes

- [ ] **1.2.3** Estimate row sizes (before optimization)
  ```sql
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
  ```
  - [ ] Record baseline

- [ ] **1.2.4** Query performance baseline
  - [ ] Document slow queries: `_audit/SLOW_QUERIES_BASELINE.md`
  - [ ] Run EXPLAIN ANALYZE on common queries
  - [ ] Record execution times

- [ ] **1.2.5** Test data statistics
  - [ ] Row counts per table
  - [ ] Average table growth per month
  - [ ] Peak table sizes

**Owner**: Database Administrator  
**Timeline**: 2 days  
**Status**: ⬜ NOT STARTED

---

### Task 1.3: Module Assignment & Planning

**Objective**: Assign modules to team members

- [ ] **1.3.1** Create module ownership matrix
  - [ ] Sales Module: ___________________
  - [ ] Customer Module: ___________________
  - [ ] Tickets Module: ___________________
  - [ ] Contracts Module: ___________________
  - [ ] Product Sales Module: ___________________
  - [ ] Service Contracts Module: ___________________
  - [ ] Job Works Module: ___________________
  - [ ] Products Module: ___________________

- [ ] **1.3.2** Schedule kickoff meeting
  - [ ] Review analysis document
  - [ ] Discuss timeline and dependencies
  - [ ] Clarify individual responsibilities

- [ ] **1.3.3** Create project tracking
  - [ ] Set up Jira/GitHub projects
  - [ ] Create sub-tasks for each module
  - [ ] Link dependencies

**Owner**: Project Manager  
**Timeline**: 1 day  
**Status**: ⬜ NOT STARTED

---

### Task 1.4: Create Testing Plan

**Objective**: Define testing strategy

- [ ] **1.4.1** Unit test template
  - Create: `src/__tests__/templates/service-normalization.test.template.ts`
  - Include: Before/after data structure tests
  - Include: JOIN verification tests

- [ ] **1.4.2** Integration test template
  - Create: `src/__tests__/templates/integration-normalization.test.template.ts`
  - Include: End-to-end flow tests
  - Include: API response structure tests

- [ ] **1.4.3** Performance test template
  - Create: `src/__tests__/templates/performance-normalization.test.template.ts`
  - Include: Query performance benchmarks
  - Include: Memory usage tests

- [ ] **1.4.4** Create test data set
  - [ ] Generate 100K test records
  - [ ] Create staging dataset for load testing
  - [ ] Document test data: `_audit/TEST_DATA_INFO.md`

**Owner**: QA Lead  
**Timeline**: 2 days  
**Status**: ⬜ NOT STARTED

---

## PHASE 2: CREATE VIEWS & REFERENCE TABLES (Week 1-2)

### Task 2.1: Create Suppliers Reference Table

**Objective**: Establish proper supplier FK relationship

- [ ] **2.1.1** Create migration file
  - [ ] File: `supabase/migrations/20250315000020_create_suppliers_table.sql`
  - [ ] Review with database admin
  - [ ] Test syntax

- [ ] **2.1.2** Migration content validation
  - [ ] Table structure defined
  - [ ] Indexes created
  - [ ] FK constraints added to products
  - [ ] Comments documented

- [ ] **2.1.3** Test migration in local environment
  - [ ] Run migration: `supabase db reset`
  - [ ] Verify table creation
  - [ ] Verify indexes
  - [ ] Verify FK constraints

- [ ] **2.1.4** Data migration strategy
  - [ ] Existing supplier data → suppliers table (if any)
  - [ ] NULL handling for products.supplier_id
  - [ ] Document: `_migrations/SUPPLIER_DATA_MIGRATION_PLAN.md`

**Owner**: Database Administrator  
**Timeline**: 1 day  
**Status**: ⬜ NOT STARTED

---

### Task 2.2: Create Sales Views

**Objective**: Create views for sales module denormalized data

- [ ] **2.2.1** Create `sales_with_details` view
  - [ ] File: `supabase/migrations/20250315000021_create_sales_views.sql`
  - [ ] Join: sales + customers + users
  - [ ] Include: customer_name, customer_email, phone, assigned_to_name
  - [ ] Test query in Supabase
  - [ ] Verify RLS policies apply

- [ ] **2.2.2** Create `sale_items_with_details` view
  - [ ] Join: sale_items + products + product_categories
  - [ ] Include: product_name, category_name, unit_price
  - [ ] Test query

- [ ] **2.2.3** Create `product_sales_with_details` view
  - [ ] Join: product_sales + customers + products
  - [ ] Include: customer_name, product_name
  - [ ] Test query

- [ ] **2.2.4** Document views
  - [ ] Create: `_docs/SALES_VIEWS.md`
  - [ ] Include: Purpose, structure, usage examples

- [ ] **2.2.5** Verify view performance
  - [ ] Test with 100K rows
  - [ ] Execution time < 500ms
  - [ ] Compare to denormalized table queries

**Owner**: Database Architect  
**Timeline**: 2 days  
**Status**: ⬜ NOT STARTED

---

### Task 2.3: Create CRM Views

**Objective**: Create views for CRM module

- [ ] **2.3.1** Create `customers_with_stats` view
  - [ ] Join: customers + sales + tickets + contracts
  - [ ] Include: total_sales_amount, ticket_count, open_contracts_count
  - [ ] Verify calculation accuracy

- [ ] **2.3.2** Create `tickets_with_details` view
  - [ ] Join: tickets + customers + users (assigned + reported)
  - [ ] Include: customer_name, customer_email, customer_phone, assigned_to_name, reported_by_name
  - [ ] Test query

- [ ] **2.3.3** Create `ticket_comments_with_details` view
  - [ ] Join: ticket_comments + users + tickets
  - [ ] Include: author_name, author_role
  - [ ] Test query

- [ ] **2.3.4** Verify RLS policies on views
  - [ ] [ ] Views respect tenant isolation
  - [ ] Test queries as different users

**Owner**: Lead Developer (CRM Module)  
**Timeline**: 2 days  
**Status**: ⬜ NOT STARTED

---

### Task 2.4: Create Contract Views

**Objective**: Create views for contracts module

- [ ] **2.4.1** Create `contracts_with_details` view
  - [ ] Join: contracts + customers + users + contract_templates
  - [ ] Include: customer_name, assigned_to_name, template_name
  - [ ] Test

- [ ] **2.4.2** Create `contract_approval_records_with_details` view
  - [ ] Join: contract_approval_records + users + contracts
  - [ ] Include: approver_name, contract_number
  - [ ] Test

- [ ] **2.4.3** Document views
  - [ ] Create: `_docs/CONTRACT_VIEWS.md`

**Owner**: Lead Developer (Contracts Module)  
**Timeline**: 1 day  
**Status**: ⬜ NOT STARTED

---

### Task 2.5: Create Job Works Views (CRITICAL)

**Objective**: Create comprehensive views for 14 denormalized fields

- [ ] **2.5.1** Create `job_works_with_details` view (COMPLEX)
  - [ ] File: `supabase/migrations/20250322000024_create_job_works_views.sql`
  - [ ] Joins needed: 5+ tables
    - [ ] job_works
    - [ ] customers
    - [ ] products
    - [ ] product_categories
    - [ ] users (engineer)
    - [ ] users (assigner)
  - [ ] Include all 14 denormalized fields
  - [ ] Test query

- [ ] **2.5.2** Performance optimization for view
  - [ ] Add indexes to support view joins
  - [ ] Test execution time with 100K rows
  - [ ] Target: < 1 second for full table scan
  - [ ] If slow: create materialized view option

- [ ] **2.5.3** Create `job_work_specifications_with_details` view
  - [ ] Join: job_work_specifications + job_works
  - [ ] Test

- [ ] **2.5.4** Document complexity
  - [ ] Create: `_docs/JOB_WORKS_VIEWS_COMPLEXITY.md`
  - [ ] Explain performance trade-offs
  - [ ] Document when to use materialized view

**Owner**: Lead Developer (Job Works Module) + Database Architect  
**Timeline**: 3 days  
**Status**: ⬜ NOT STARTED

---

### Task 2.6: Create Other Views

**Objective**: Create remaining views

- [ ] **2.6.1** Create `service_contracts_with_details` view
  - [ ] Join: service_contracts + customers + products
  - [ ] Test

- [ ] **2.6.2** Create `complaints_with_details` view
  - [ ] Join: complaints + customers
  - [ ] Test

- [ ] **2.6.3** Document all views
  - [ ] Create master view documentation
  - [ ] Include usage examples

**Owner**: Database Architect  
**Timeline**: 1 day  
**Status**: ⬜ NOT STARTED

---

## PHASE 3: UPDATE APPLICATION CODE (Week 2-3)

### Task 3.1: Update Products Module

**Objective**: Normalize products table usage

- [ ] **3.1.1** Update type definitions
  - File: `/src/types/product.ts`
  - [ ] Remove: `category?: string;` (use category_id + JOIN)
  - [ ] Remove: `is_active?: boolean;` (use status)
  - [ ] Add: `categoryName?: string;` (if fetched from category_id)
  - Document changes

- [ ] **3.1.2** Update mock service
  - File: `/src/services/productService.ts`
  - [ ] Remove category and is_active from mock data
  - [ ] Update getProducts() response
  - [ ] Update createProduct() to not accept these fields
  - [ ] Test mock service

- [ ] **3.1.3** Update Supabase service
  - File: `/src/services/api/supabase/productService.ts`
  - [ ] Remove: `category` from SELECT
  - [ ] Remove: `is_active` from SELECT
  - [ ] Add: JOIN to product_categories for category name (if needed)
  - [ ] Update mappings

- [ ] **3.1.4** Update module service
  - File: `/src/modules/features/products/services/productService.ts`
  - [ ] Update method signatures
  - [ ] Update return types
  - [ ] Add error handling

- [ ] **3.1.5** Update component bindings
  - [ ] Search: `/src/modules/features/products/components/*.tsx`
  - [ ] Remove references to `category` field
  - [ ] Update forms to use `category_id` with dropdown
  - [ ] Remove `is_active` field (use `status` enum)

- [ ] **3.1.6** Test products module
  - [ ] Unit tests pass
  - [ ] Integration tests pass
  - [ ] Create/read/update products works
  - [ ] Category selection works
  - [ ] Status field displays correctly

**Owner**: Products Module Lead  
**Timeline**: 3 days  
**Subtasks**: 6  
**Status**: ⬜ NOT STARTED

---

### Task 3.2: Update Sales Module

**Objective**: Normalize sales table

- [ ] **3.2.1** Update type definitions
  - File: `/src/types/sales.ts`
  - [ ] Remove: `customer_name?: string;`
  - [ ] Remove: `assigned_to_name?: string;`
  - [ ] Remove: `amount?: number;` (use value only)
  - [ ] Test compilation

- [ ] **3.2.2** Update mock service
  - File: `/src/services/salesService.ts`
  - [ ] Remove: amount, customer_name, assigned_to_name
  - [ ] Update mock data structure
  - [ ] Test service

- [ ] **3.2.3** Update Supabase service
  - File: `/src/services/api/supabase/salesService.ts`
  - [ ] Remove these fields from SELECT
  - [ ] For convenience, consider if view should be used:
    - [ ] Option A: Use `sales_with_details` view
    - [ ] Option B: Manual JOINs in queries
  - Decision: ________________

- [ ] **3.2.4** Update module service
  - File: `/src/modules/features/sales/services/salesService.ts`
  - [ ] Update all method signatures

- [ ] **3.2.5** Update components
  - [ ] Search: `/src/modules/features/sales/components/*.tsx`
  - [ ] Remove field references
  - [ ] Add JOINs if needed
  - [ ] Update display logic

- [ ] **3.2.6** Update hooks
  - [ ] Search: `/src/modules/features/sales/hooks/*.ts`
  - [ ] Update return types
  - [ ] Update query selections

- [ ] **3.2.7** Test sales module
  - [ ] Unit tests: 100% pass
  - [ ] Integration tests pass
  - [ ] Create/read/update sales works
  - [ ] Customer name displays in list
  - [ ] Assignee name displays in list

**Owner**: Sales Module Lead  
**Timeline**: 3 days  
**Subtasks**: 7  
**Status**: ⬜ NOT STARTED

---

### Task 3.3: Update CRM Module (Customers)

**Objective**: Ensure customer data normalization

- [ ] **3.3.1** Verify customer types
  - File: `/src/types/customer.ts`
  - [ ] Review: Should already be normalized
  - [ ] Verify: No denormalized fields
  - [ ] Document audit: `_audit/CUSTOMERS_ALREADY_NORMALIZED.md`

- [ ] **3.3.2** Update customer queries
  - [ ] Verify mock service doesn't include derived data
  - [ ] Verify Supabase service correct
  - [ ] Run tests

**Owner**: Customer Module Lead  
**Timeline**: 1 day  
**Subtasks**: 2  
**Status**: ⬜ NOT STARTED

---

### Task 3.4: Update Tickets Module

**Objective**: Remove 5 denormalized fields

- [ ] **3.4.1** Update type definitions
  - File: `/src/types/ticket.ts`
  - [ ] Remove: customer_name
  - [ ] Remove: customer_email
  - [ ] Remove: customer_phone
  - [ ] Remove: assigned_to_name
  - [ ] Remove: reported_by_name
  - [ ] Verify: customer_id present
  - [ ] Verify: assigned_to present
  - [ ] Verify: reported_by present

- [ ] **3.4.2** Update services
  - File: `/src/services/ticketService.ts`
  - File: `/src/services/api/supabase/ticketService.ts`
  - [ ] Remove denormalized fields from getTickets()
  - [ ] Remove from createTicket()
  - [ ] Remove from updateTicket()
  - [ ] Test services

- [ ] **3.4.3** Update module service
  - File: `/src/modules/features/tickets/services/ticketService.ts`
  - [ ] Update signatures

- [ ] **3.4.4** Update components (EXTENSIVE)
  - [ ] Search: `/src/modules/features/tickets/components/*.tsx`
  - Count matches: _______ files
  - [ ] TicketList: Update to JOIN or use view
  - [ ] TicketForm: Remove field bindings
  - [ ] TicketDetail: Update display logic
  - [ ] TicketCreation: Handle customer selection properly

- [ ] **3.4.5** Update hooks
  - File: `/src/modules/features/tickets/hooks/useTickets.ts`
  - [ ] Update return type structure
  - [ ] Update queries

- [ ] **3.4.6** Test tickets module
  - [ ] Unit tests pass
  - [ ] Create ticket works
  - [ ] Customer info displays correctly
  - [ ] Assignee info displays correctly

**Owner**: Tickets Module Lead  
**Timeline**: 4 days  
**Subtasks**: 6  
**Status**: ⬜ NOT STARTED

---

### Task 3.5: Update Contracts Module

**Objective**: Remove denormalized fields

- [ ] **3.5.1** Update type definitions
  - File: `/src/types/contract.ts`
  - [ ] Remove: customer_name
  - [ ] Remove: customer_contact
  - [ ] Remove: assigned_to_name
  - [ ] Remove: total_value (keep value only)

- [ ] **3.5.2** Update services
  - File: `/src/services/contractService.ts`
  - File: `/src/services/api/supabase/contractService.ts`
  - [ ] Remove denormalized fields

- [ ] **3.5.3** Update approval records type
  - File: `/src/types/contract.ts`
  - [ ] Remove: approver_name from approval records

- [ ] **3.5.4** Update components
  - [ ] ContractList: Update display
  - [ ] ContractForm: Update bindings
  - [ ] ApprovalRecords: Update display

- [ ] **3.5.5** Test contracts module
  - [ ] All CRUD operations work
  - [ ] Customer info displays
  - [ ] Approval workflow works

**Owner**: Contracts Module Lead  
**Timeline**: 3 days  
**Subtasks**: 5  
**Status**: ⬜ NOT STARTED

---

### Task 3.6: Update Product Sales Module

**Objective**: Remove customer_name and product_name

- [ ] **3.6.1** Update type definitions
  - File: `/src/types/productSale.ts`
  - [ ] Remove: customer_name
  - [ ] Remove: product_name

- [ ] **3.6.2** Update services
  - File: `/src/services/productSaleService.ts`
  - File: `/src/services/api/supabase/productSaleService.ts`
  - [ ] Remove denormalized fields

- [ ] **3.6.3** Update components
  - [ ] ProductSalesList
  - [ ] ProductSaleForm
  - [ ] ProductSaleDetail

- [ ] **3.6.4** Test module
  - [ ] CRUD works
  - [ ] Display correct

**Owner**: Product Sales Module Lead  
**Timeline**: 2 days  
**Subtasks**: 4  
**Status**: ⬜ NOT STARTED

---

### Task 3.7: Update Service Contracts Module

**Objective**: Remove customer_name and product_name

- [ ] **3.7.1** Update type definitions
  - File: `/src/types/serviceContract.ts`
  - [ ] Remove: customer_name
  - [ ] Remove: product_name

- [ ] **3.7.2** Update services
  - [ ] Remove denormalized fields
  - [ ] Update queries

- [ ] **3.7.3** Update components
  - [ ] Update all bindings

- [ ] **3.7.4** Test module
  - [ ] CRUD works

**Owner**: Service Contracts Module Lead  
**Timeline**: 2 days  
**Subtasks**: 4  
**Status**: ⬜ NOT STARTED

---

### Task 3.8: Update Job Works Module (CRITICAL - 14 FIELDS)

**Objective**: Remove 14 denormalized fields - MOST COMPLEX MODULE

- [ ] **3.8.1** Update type definitions (EXTENSIVE)
  - File: `/src/types/jobWork.ts`
  - [ ] Remove: customer_name
  - [ ] Remove: customer_short_name
  - [ ] Remove: customer_contact
  - [ ] Remove: customer_email
  - [ ] Remove: customer_phone
  - [ ] Remove: product_name
  - [ ] Remove: product_sku
  - [ ] Remove: product_category
  - [ ] Remove: product_unit
  - [ ] Remove: receiver_engineer_name
  - [ ] Remove: receiver_engineer_email
  - [ ] Remove: assigned_by_name
  - [ ] Verify: IDs are all present
  - **Result**: Type size reduced from ~20 properties to ~8

- [ ] **3.8.2** Update mock service
  - File: `/src/services/jobWorkService.ts`
  - [ ] Remove all 14 denormalized fields from mock data
  - [ ] Update getJobWorks() return type
  - [ ] Update createJobWork() input type
  - [ ] Update updateJobWork() input type
  - [ ] Test with new structure

- [ ] **3.8.3** Update Supabase service
  - File: `/src/services/api/supabase/jobWorkService.ts`
  - [ ] Remove 14 fields from SELECT statements
  - [ ] Update mappings
  - [ ] Consider using `job_works_with_details` view
  - [ ] **Decision**: Use view? Yes / No
  - [ ] If yes: Update query to use view
  - [ ] If no: Add JOINs in queries
  - [ ] Test

- [ ] **3.8.4** Update module service
  - File: `/src/modules/features/jobWorks/services/jobWorkService.ts`
  - [ ] Update method signatures
  - [ ] Update return types

- [ ] **3.8.5** Update components (EXTENSIVE)
  - [ ] Search: `/src/modules/features/jobWorks/components/*.tsx`
  - Count files: ______
  - [ ] JobWorksList.tsx: Update columns, remove denormalized displays
  - [ ] JobWorkForm.tsx: Update form fields
  - [ ] JobWorkDetail.tsx: Update detail display
  - [ ] JobWorkAssignment.tsx: Update assignment UI
  - [ ] Any other components...

- [ ] **3.8.6** Update hooks (CRITICAL)
  - File: `/src/modules/features/jobWorks/hooks/useJobWorks.ts`
  - [ ] Update return type structure
  - [ ] Update cached queries
  - [ ] Update subscription logic (if any)

- [ ] **3.8.7** Update views
  - [ ] Check if any page-level views import denormalized fields
  - [ ] Update routing views if affected

- [ ] **3.8.8** Verify application logic
  - [ ] Email sending (uses engineer email):
    - [ ] Find: sendEmailToEngineer()
    - [ ] Update to: Fetch engineer email from users table
  - [ ] Assignment notifications (uses engineer name):
    - [ ] Find: createNotification()
    - [ ] Update to: Use view or JOIN
  - [ ] Reports (uses product category):
    - [ ] Find: Report generation
    - [ ] Update: Use JOIN to product_categories

- [ ] **3.8.9** Comprehensive test
  - [ ] Unit tests: 100% pass
  - [ ] Integration tests: Create/Read/Update/Delete
  - [ ] Verify engineer assignment workflow
  - [ ] Verify email notifications work
  - [ ] Verify reports generate correctly
  - [ ] Performance: Query < 2 seconds for 100K records

**Owner**: Job Works Module Lead + 2 Senior Developers  
**Timeline**: 5-6 days  
**Subtasks**: 9  
**Complexity**: 🔴 CRITICAL - Most complex module  
**Status**: ⬜ NOT STARTED

---

### Task 3.9: Update Complaints Module

**Objective**: Remove customer_name

- [ ] **3.9.1** Update type definitions
  - File: `/src/types/complaint.ts`
  - [ ] Remove: customer_name

- [ ] **3.9.2** Update services
  - [ ] Remove from selects

- [ ] **3.9.3** Update components
  - [ ] Update display

- [ ] **3.9.4** Test module
  - [ ] CRUD works

**Owner**: Complaints Module Lead  
**Timeline**: 1 day  
**Subtasks**: 4  
**Status**: ⬜ NOT STARTED

---

### Task 3.10: Search-and-Replace Validation

**Objective**: Ensure all denormalized references removed

- [ ] **3.10.1** Final search for denormalized fields
  ```bash
  grep -r "customer_name\|product_name\|assigned_to_name\|customer_email\|customer_phone" src/modules --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v "__tests__" | tee _audit/DENORMALIZATION_REMAINING.txt
  ```
  - [ ] Review results
  - [ ] Fix any remaining references
  - [ ] Expected: <5 occurrences (in views/comments only)

- [ ] **3.10.2** Verify type compilation
  ```bash
  npm run type-check
  ```
  - [ ] 0 TypeScript errors
  - [ ] 0 TypeScript warnings (related to denormalization)

**Owner**: Lead Developer  
**Timeline**: 1 day  
**Subtasks**: 2  
**Status**: ⬜ NOT STARTED

---

## PHASE 4: DATABASE MIGRATION (Week 3)

**⚠️ CRITICAL**: Phases 1-3 must be 100% complete before starting Phase 4

### Pre-Migration Checklist
- [ ] All code changes completed and tested
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Code review approved
- [ ] Production backup created
- [ ] Rollback plan documented
- [ ] Team trained on rollback procedure

---

### Task 4.1: Staging Database Migration

**Objective**: Execute migrations in staging environment

- [ ] **4.1.1** Backup staging database
  ```bash
  pg_dump -h staging-db -U postgres crm_db > /backups/staging_pre_migration.sql
  ```
  - [ ] Verify backup size: _________ MB
  - [ ] Test restore: ✓

- [ ] **4.1.2** Apply suppliers table migration
  - [ ] File: `supabase/migrations/20250315000020_create_suppliers_table.sql`
  - [ ] Command: `supabase db push --linked`
  - [ ] Verify: Table created
  - [ ] Verify: Indexes created
  - [ ] Verify: FK constraints working

- [ ] **4.1.3** Apply view migrations (in sequence)
  - [ ] 20250315000021: Sales views
  - [ ] 20250315000022: CRM views
  - [ ] 20250315000023: Contract views
  - [ ] 20250322000024: Job works views
  - For each:
    - [ ] Applied successfully
    - [ ] Verify view definitions with: `\d+ view_name`
    - [ ] Test SELECT from view

- [ ] **4.1.4** Test views with application code
  - [ ] Staging application deployment
  - [ ] Test all modules with views
  - [ ] Verify data accuracy
  - [ ] Check RLS policies

- [ ] **4.1.5** Performance validation (BEFORE denormalization removal)
  - [ ] Query denormalized tables: _________ ms
  - [ ] Query views: _________ ms
  - [ ] Document: `_metrics/STAGING_VIEW_PERFORMANCE.md`

**Owner**: Database Administrator  
**Timeline**: 1 day  
**Subtasks**: 5  
**Status**: ⬜ NOT STARTED

---

### Task 4.2: Remove Denormalized Data (Staging)

**Objective**: Test denormalization removal in staging

- [ ] **4.2.1** Backup staging before removal
  ```bash
  pg_dump -h staging-db -U postgres crm_db > /backups/staging_pre_denormalization_removal.sql
  ```

- [ ] **4.2.2** Apply removal migrations (in sequence)
  - [ ] 20250322000025: Products denormalization
  - [ ] 20250322000026: Sales denormalization
  - [ ] 20250322000027: Tickets denormalization
  - [ ] 20250322000028: Contracts denormalization
  - [ ] 20250322000029: Product sales denormalization
  - [ ] 20250322000030: Service contracts denormalization
  - [ ] 20250322000031: Job works denormalization (CRITICAL)
  - [ ] 20250322000032: Complaints denormalization
  
  For each migration:
  - [ ] Applied successfully
  - [ ] No errors in logs
  - [ ] Data integrity check:
    ```sql
    SELECT COUNT(*) FROM {table_name};
    ```
    - [ ] Expected count: ________

- [ ] **4.2.3** Data integrity verification (CRITICAL)
  - [ ] Run comprehensive queries to verify no data loss
  - [ ] Document: `_audit/STAGING_DATA_INTEGRITY_VERIFICATION.md`
  
  Verification queries:
  ```sql
  -- Products: should still have all records
  SELECT COUNT(*) FROM products;
  
  -- Sales: should still link to customers
  SELECT COUNT(*) FROM sales WHERE customer_id IS NOT NULL;
  
  -- Job Works: should still link to all relationships
  SELECT COUNT(*) FROM job_works WHERE customer_id IS NOT NULL AND product_id IS NOT NULL;
  
  -- Verify no orphaned records
  SELECT COUNT(*) FROM sales WHERE customer_id NOT IN (SELECT id FROM customers);
  ```
  - [ ] All checks pass

- [ ] **4.2.4** Test application code (CRITICAL)
  - [ ] Deploy staging application
  - [ ] Run all module tests against staging database
  - [ ] Verify: Create operations work
  - [ ] Verify: Read operations work
  - [ ] Verify: Update operations work
  - [ ] Verify: Delete operations work
  - [ ] Verify: Related data displays correctly

**Owner**: Database Administrator + Full Team (Testing)  
**Timeline**: 2 days  
**Subtasks**: 4  
**Status**: ⬜ NOT STARTED

---

### Task 4.3: Add Performance Indexes (Staging)

**Objective**: Add optimized indexes in staging

- [ ] **4.3.1** Apply index migrations (in sequence)
  - [ ] 20250322000033: Sales performance indexes
  - [ ] 20250322000034: Tickets performance indexes
  - [ ] 20250322000035: Contracts performance indexes
  - [ ] 20250322000036: Job works performance indexes
  - [ ] 20250322000037: Products performance indexes
  
  For each:
  - [ ] Indexes created
  - [ ] Verify: `\di` shows all indexes

- [ ] **4.3.2** Performance benchmark (AFTER normalization)
  - [ ] Run same queries as before
  - [ ] Document: `_metrics/STAGING_OPTIMIZED_PERFORMANCE.md`
  - [ ] Calculate improvement percentage
  
  Expected improvements:
  - [ ] Job works queries: ~40% faster
  - [ ] Tickets queries: ~25% faster
  - [ ] Sales queries: ~15% faster

**Owner**: Database Administrator + Performance Engineer  
**Timeline**: 1 day  
**Subtasks**: 2  
**Status**: ⬜ NOT STARTED

---

## PHASE 5: COMPREHENSIVE TESTING (Week 3-4)

### Task 5.1: Unit Tests - All Modules

**Objective**: Verify service layer works with normalized data

- [ ] **5.1.1** Products module unit tests
  - File: `/src/modules/features/products/__tests__/productService.test.ts`
  - [ ] Test getProduct() returns correct structure
  - [ ] Test createProduct() without denormalized fields
  - [ ] Test updateProduct() works
  - [ ] 100% tests pass

- [ ] **5.1.2** Sales module unit tests
  - [ ] Test getters
  - [ ] Test amount/value unification
  - [ ] 100% tests pass

- [ ] **5.1.3** Tickets module unit tests
  - [ ] Test all fields removed
  - [ ] 100% tests pass

- [ ] **5.1.4** Contracts module unit tests
  - [ ] Test value/total_value unification
  - [ ] 100% tests pass

- [ ] **5.1.5** Job works module unit tests (EXTENSIVE)
  - [ ] Test all 14 fields removed
  - [ ] Test relationships still work
  - [ ] 100% tests pass

- [ ] **5.1.6** Other modules unit tests
  - [ ] Product sales: pass
  - [ ] Service contracts: pass
  - [ ] Complaints: pass

**Owner**: All Module Leads + QA Team  
**Timeline**: 3 days  
**Subtasks**: 6  
**Status**: ⬜ NOT STARTED

---

### Task 5.2: Integration Tests - Database Views

**Objective**: Verify views work correctly

- [ ] **5.2.1** Sales views integration tests
  - [ ] `sales_with_details` returns correct data
  - [ ] Customer data populated correctly
  - [ ] Performance acceptable
  - [ ] RLS works on view

- [ ] **5.2.2** CRM views integration tests
  - [ ] `tickets_with_details` works
  - [ ] `customers_with_stats` works
  - [ ] All data accurate

- [ ] **5.2.3** Contract views integration tests
  - [ ] `contracts_with_details` works
  - [ ] Approval records joined correctly

- [ ] **5.2.4** Job works views integration tests (CRITICAL)
  - [ ] `job_works_with_details` returns all 14 denormalized fields
  - [ ] All JOINs work correctly
  - [ ] No missing data
  - [ ] Performance: < 1 second for 100K rows

**Owner**: QA Lead  
**Timeline**: 2 days  
**Subtasks**: 4  
**Status**: ⬜ NOT STARTED

---

### Task 5.3: API Endpoint Tests

**Objective**: Verify REST APIs work with new structure

- [ ] **5.3.1** Sales endpoints
  - [ ] GET /api/sales: works, data correct
  - [ ] GET /api/sales/{id}: works
  - [ ] POST /api/sales: creates without denormalized fields
  - [ ] PUT /api/sales/{id}: updates correctly
  - [ ] DELETE /api/sales/{id}: deletes correctly

- [ ] **5.3.2** Tickets endpoints
  - [ ] All CRUD endpoints work
  - [ ] Response includes customer info
  - [ ] No null values for derived data

- [ ] **5.3.3** Job works endpoints (CRITICAL)
  - [ ] All CRUD endpoints work
  - [ ] GET /api/job-works returns all needed data
  - [ ] POST /api/job-works works without 14 fields
  - [ ] Response structure matches expected

- [ ] **5.3.4** All other modules
  - [ ] Test APIs for each module

**Owner**: QA Team  
**Timeline**: 2 days  
**Subtasks**: 4  
**Status**: ⬜ NOT STARTED

---

### Task 5.4: UI Component Tests

**Objective**: Verify UI renders correctly with new data

- [ ] **5.4.1** Sales components
  - [ ] SalesList: Renders correctly, customer name displays
  - [ ] SaleForm: All fields work
  - [ ] SaleDetail: All data displays

- [ ] **5.4.2** Tickets components
  - [ ] TicketList: Displays correctly
  - [ ] TicketForm: Creates tickets
  - [ ] TicketDetail: Shows all info

- [ ] **5.4.3** Job works components (EXTENSIVE)
  - [ ] JobWorksList: Renders all columns
  - [ ] JobWorkForm: All fields work
  - [ ] JobWorkDetail: Complete info displays
  - [ ] Engineer assignment: Works
  - [ ] Status updates: Work

- [ ] **5.4.4** All other module components
  - [ ] Each module: Basic UI tests pass

**Owner**: Frontend QA Team  
**Timeline**: 3 days  
**Subtasks**: 4  
**Status**: ⬜ NOT STARTED

---

### Task 5.5: Data Integrity Tests

**Objective**: Verify no data was corrupted

- [ ] **5.5.1** Row count verification
  - [ ] products: Same row count before/after
  - [ ] sales: Same row count
  - [ ] tickets: Same row count
  - [ ] job_works: Same row count
  - [ ] All tables: Same row counts
  - [ ] Document: `_audit/DATA_INTEGRITY_VERIFICATION.md`

- [ ] **5.5.2** Referential integrity checks
  - [ ] All foreign keys valid
  - [ ] No orphaned records
  - [ ] All relationships intact

- [ ] **5.5.3** Data value verification
  - [ ] Sample 100 sales: Verify customer_id, value, stage correct
  - [ ] Sample 100 job_works: Verify all IDs correct
  - [ ] Spot-check 20 contracts: Verify dates, amounts correct

**Owner**: Database Administrator + QA  
**Timeline**: 2 days  
**Subtasks**: 3  
**Status**: ⬜ NOT STARTED

---

### Task 5.6: Performance Tests

**Objective**: Verify performance improvements

- [ ] **5.6.1** Query performance comparison
  - [ ] Document baseline before changes
  - [ ] Document performance after changes
  - [ ] Calculate % improvement
  - [ ] All critical queries improved or maintained

- [ ] **5.6.2** Load testing
  - [ ] Simulate 100 concurrent users
  - [ ] Monitor: CPU, memory, database connections
  - [ ] Verify: No degradation
  - [ ] Document: `_metrics/LOAD_TEST_RESULTS.md`

- [ ] **5.6.3** Storage optimization verification
  - [ ] Compare table sizes before/after
  - [ ] Calculate storage reduction
  - [ ] Expected reduction: 25-40%

**Owner**: Performance Engineer  
**Timeline**: 2 days  
**Subtasks**: 3  
**Status**: ⬜ NOT STARTED

---

### Task 5.7: Regression Testing

**Objective**: Ensure no existing functionality broken

- [ ] **5.7.1** Full regression test suite
  - [ ] Run: `npm run test`
  - [ ] Expected: 100% pass rate
  - [ ] Document failures if any

- [ ] **5.7.2** End-to-end workflow tests
  - [ ] Customer creation → Sale creation → Invoice generation
  - [ ] Ticket creation → Assignment → Resolution
  - [ ] Job work creation → Assignment → Completion
  - [ ] Contract creation → Approval → Activation
  - [ ] All workflows work without issues

- [ ] **5.7.3** Permission & RLS tests
  - [ ] Multi-tenant isolation verified
  - [ ] Role-based access enforced
  - [ ] No data leakage

**Owner**: QA Lead + All Testers  
**Timeline**: 3 days  
**Subtasks**: 3  
**Status**: ⬜ NOT STARTED

---

## PHASE 6: PRODUCTION DEPLOYMENT (Week 4)

### Pre-Production Checklist
- [ ] All staging tests passed (100%)
- [ ] Performance improvements verified
- [ ] Rollback plan documented
- [ ] Team trained
- [ ] Production backup scheduled
- [ ] Communication drafted

---

### Task 6.1: Production Database Preparation

**Objective**: Prepare production database for migration

- [ ] **6.1.1** Final production backup
  ```bash
  pg_dump -h prod-db -U postgres crm_db > /backups/prod_pre_normalization.sql
  ```
  - [ ] Backup size: _________ MB
  - [ ] Backup verified: ✓
  - [ ] Test restore location ready

- [ ] **6.1.2** Maintenance window scheduling
  - [ ] Date: ________________
  - [ ] Time: ________________
  - [ ] Duration: ~3-4 hours
  - [ ] Notification sent to users: ✓

- [ ] **6.1.3** Team coordination
  - [ ] All team members aware
  - [ ] Rollback team identified: ___________, ___________
  - [ ] On-call support: ___________________

**Owner**: Database Administrator + DevOps  
**Timeline**: 1 day  
**Subtasks**: 3  
**Status**: ⬜ NOT STARTED

---

### Task 6.2: Execute Production Migration

**Objective**: Run migrations in production

- [ ] **6.2.1** Notify users of maintenance window
  - [ ] Email sent
  - [ ] In-app banner shown
  - [ ] Slack notification posted

- [ ] **6.2.2** Put application in maintenance mode
  - [ ] API returns 503
  - [ ] UI shows maintenance page
  - [ ] Email queues paused

- [ ] **6.2.3** Create final production backup
  ```bash
  pg_dump -h prod-db -U postgres crm_db | gzip > /backups/prod_maintenance_final.sql.gz
  ```

- [ ] **6.2.4** Apply suppliers table migration
  - [ ] Command: `supabase db push --linked --prod`
  - [ ] Status: ✓ Complete
  - [ ] Errors: ✓ None

- [ ] **6.2.5** Apply view migrations
  - [ ] Sales views: ✓
  - [ ] CRM views: ✓
  - [ ] Contract views: ✓
  - [ ] Job works views: ✓
  - [ ] Verify each view created

- [ ] **6.2.6** Apply denormalization removal migrations
  - [ ] Products: ✓
  - [ ] Sales: ✓
  - [ ] Tickets: ✓
  - [ ] Contracts: ✓
  - [ ] Product sales: ✓
  - [ ] Service contracts: ✓
  - [ ] Job works: ✓
  - [ ] Complaints: ✓
  - **Total time**: _________ minutes

- [ ] **6.2.7** Apply index migrations
  - [ ] Sales indexes: ✓
  - [ ] Tickets indexes: ✓
  - [ ] Contracts indexes: ✓
  - [ ] Job works indexes: ✓
  - [ ] Products indexes: ✓

- [ ] **6.2.8** Data integrity verification (PRODUCTION)
  ```sql
  -- Quick checks
  SELECT COUNT(*) as products_count FROM products;
  SELECT COUNT(*) as sales_count FROM sales;
  SELECT COUNT(*) as job_works_count FROM job_works;
  ```
  - [ ] Row counts match pre-migration
  - [ ] No errors logged

**Owner**: Database Administrator  
**Timeline**: 2-3 hours (during maintenance window)  
**Subtasks**: 8  
**Status**: ⬜ NOT STARTED

---

### Task 6.3: Deploy Production Application

**Objective**: Deploy updated code to production

- [ ] **6.3.1** Deploy to production servers
  - [ ] Version: ________________
  - [ ] Deployment method: Blue-green / Canary / Standard
  - [ ] Status: ✓ Deployed

- [ ] **6.3.2** Health checks
  - [ ] API responding: ✓
  - [ ] Database connections: ✓
  - [ ] RLS policies working: ✓
  - [ ] Views accessible: ✓

- [ ] **6.3.3** Smoke tests
  - [ ] Can users login: ✓
  - [ ] Can create sale: ✓
  - [ ] Can create ticket: ✓
  - [ ] Can create job work: ✓

**Owner**: DevOps / Release Engineer  
**Timeline**: 30 minutes  
**Subtasks**: 3  
**Status**: ⬜ NOT STARTED

---

### Task 6.4: Take Application Out of Maintenance Mode

**Objective**: Resume normal operations

- [ ] **6.4.1** Disable maintenance mode
  - [ ] API returns 200: ✓
  - [ ] UI accessible: ✓
  - [ ] Features working: ✓

- [ ] **6.4.2** Resume background jobs
  - [ ] Email queue: ✓ Resuming
  - [ ] Notifications: ✓ Resuming
  - [ ] Reports: ✓ Resuming

- [ ] **6.4.3** Notify users
  - [ ] Email sent
  - [ ] In-app message shown
  - [ ] Slack: "🟢 Maintenance complete"

- [ ] **6.4.4** Monitor for issues
  - [ ] Error rate: < 0.1%
  - [ ] Response times: Normal
  - [ ] Database queries: Normal

**Owner**: DevOps  
**Timeline**: 15 minutes  
**Subtasks**: 4  
**Status**: ⬜ NOT STARTED

---

### Task 6.5: Post-Deployment Verification (1 hour)

**Objective**: Verify production state

- [ ] **6.5.1** Monitor application logs
  - [ ] Duration: Next 60 minutes
  - [ ] No critical errors: ✓
  - [ ] No 500 errors: ✓
  - [ ] No auth failures: ✓

- [ ] **6.5.2** Monitor database performance
  - [ ] Query times: Normal
  - [ ] Index usage: Verified via logs
  - [ ] Connections: Stable

- [ ] **6.5.3** User-facing tests
  - [ ] Test as different user roles
  - [ ] Verify each module works
  - [ ] Check: All lists load quickly
  - [ ] Check: Forms work
  - [ ] Check: Reports generate

- [ ] **6.5.4** Critical workflow tests
  - [ ] Complete a sale end-to-end
  - [ ] Create and close a ticket
  - [ ] Assign job work
  - [ ] All workflows completed without issues: ✓

**Owner**: Lead Developer + QA  
**Timeline**: 1 hour (active monitoring)  
**Subtasks**: 4  
**Status**: ⬜ NOT STARTED

---

## PHASE 7: PERFORMANCE ANALYSIS & REPORTING (Post-Deployment)

### Task 7.1: Performance Metrics Collection

**Objective**: Document performance improvements

- [ ] **7.1.1** Query performance analysis
  - [ ] Compare top 50 queries before/after
  - [ ] Calculate average improvement
  - [ ] Document: `_reports/PERFORMANCE_ANALYSIS.md`
  - [ ] Query examples with times:
    - [ ] Sales list query: Before ___ms → After ___ms (Improvement: __%)
    - [ ] Tickets query: Before ___ms → After ___ms
    - [ ] Job works query: Before ___ms → After ___ms

- [ ] **7.1.2** Storage metrics
  - [ ] Database size before: ___________ GB
  - [ ] Database size after: ___________ GB
  - [ ] Reduction: __________% 
  - [ ] Savings per table documented

- [ ] **7.1.3** Index efficiency
  - [ ] Active indexes before: __________
  - [ ] Active indexes after: __________
  - [ ] Index utilization: __________% of indexes used

**Owner**: Performance Engineer  
**Timeline**: 1 day  
**Subtasks**: 3  
**Status**: ⬜ NOT STARTED

---

### Task 7.2: Document Lessons Learned

**Objective**: Capture knowledge for future projects

- [ ] **7.2.1** Create post-mortim document
  - [ ] File: `_reports/NORMALIZATION_POST_MORTEM.md`
  - [ ] What went well
  - [ ] What was challenging
  - [ ] Recommendations for next time
  - [ ] Timeline vs actual (variance %)
  - [ ] Budget/resource utilization

- [ ] **7.2.2** Update architecture documentation
  - [ ] File: `/docs/architecture/DATABASE_DESIGN.md`
  - [ ] Document normalized schema
  - [ ] Update best practices
  - [ ] Document view usage patterns

- [ ] **7.2.3** Update developer guide
  - [ ] File: `/DEVELOPER_GUIDE.md`
  - [ ] Document how to add denormalized fields in future (with caution)
  - [ ] Document view creation patterns
  - [ ] Document FK relationship best practices

**Owner**: Technical Writer + Lead Architect  
**Timeline**: 1 day  
**Subtasks**: 3  
**Status**: ⬜ NOT STARTED

---

## PHASE 8: POST-DEPLOYMENT CLEANUP (Optional)

### Task 8.1: Archive Migration Files

- [ ] **8.1.1** Document migration sequence
  - [ ] Create: `_migrations/MIGRATION_SEQUENCE_2025.md`
  - [ ] List all 37 migration files in execution order
  - [ ] Include timestamps for each

**Timeline**: 2 hours  
**Status**: ⬜ NOT STARTED

---

### Task 8.2: Monitoring & Alerts Setup

- [ ] **8.2.1** Set up slow query monitoring
  - [ ] Alert if query > 5 seconds
  - [ ] Alert if query > 100ms increase from baseline
  - [ ] Document alerts created

- [ ] **8.2.2** Set up index usage monitoring
  - [ ] Verify indexes are being used
  - [ ] Alert if index unused for 7 days
  - [ ] Document setup

**Timeline**: 4 hours  
**Owner**: DevOps  
**Status**: ⬜ NOT STARTED

---

## FINAL SIGN-OFF

### Project Completion Checklist

- [ ] All phases completed
- [ ] All tests passing (100%)
- [ ] Performance improvements verified
- [ ] Documentation updated
- [ ] Team trained
- [ ] Post-mortem completed
- [ ] Monitoring configured

### Metrics Summary

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Denormalized fields removed | 45+ | _____ | ⬜ |
| Tables normalized to BCNF | 9 | _____ | ⬜ |
| Query performance improvement | +25% | _____ % | ⬜ |
| Storage reduction | 25-40% | _____ % | ⬜ |
| Test pass rate | 100% | _____ % | ⬜ |
| Downtime | <5 hours | _____ hours | ⬜ |
| Data loss | 0 records | _____ records | ⬜ |

### Final Approval

- [ ] Project Manager Sign-off: _________________ (Date: ______)
- [ ] Architecture Lead Sign-off: _________________ (Date: ______)
- [ ] Database Admin Sign-off: _________________ (Date: ______)
- [ ] QA Lead Sign-off: _________________ (Date: ______)

---

## Contact & Support

**Project Lead**: _________________________________  
**Database Administrator**: _________________________________  
**Technical Lead**: _________________________________  
**QA Lead**: _________________________________  

**Emergency Contact** (During Maintenance): _________________________________  

---

**Document Status**: Active  
**Last Updated**: 2025-01-30  
**Next Review**: Upon completion  
**Version**: 1.0.0