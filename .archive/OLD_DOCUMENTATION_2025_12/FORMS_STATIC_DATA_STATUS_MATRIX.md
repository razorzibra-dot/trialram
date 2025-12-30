---
title: Forms Static Data - Status Matrix
description: Visual matrix showing static data status across all modules and forms
date: 2025-01-31
author: Code Analysis
version: 1.0.0
---

# Forms Static Data - Status Matrix & Summary

## Overview Matrix

```
📊 STATIC DATA STATUS ACROSS ALL FORMS

Legend:
✅ = Dynamic (hooks/services)
⚠️  = Mixed (some dynamic, some static)
❌ = Static (hardcoded)
🚨 = Critical (blocks multi-tenant)
```

---

## Module Status Overview

### 🟢 HEALTHY MODULES

#### ✅ Dashboard Module
- **Status**: No forms with static data
- **Reason**: Mostly read-only widgets
- **Action**: None needed

#### ✅ Audit Logs Module
- **Status**: No forms with static data
- **Reason**: Log viewer only
- **Action**: None needed

#### ✅ Auth Module
- **Status**: Login page (no dropdowns)
- **Reason**: Simple authentication
- **Action**: None needed

#### ✅ PDF Templates
- **Status**: Template viewer (verify)
- **Reason**: Likely read-only display
- **Action**: Quick audit recommended

#### ✅ Notifications
- **Status**: Minor forms only
- **Reason**: Preference settings
- **Action**: Check preferences panel

---

### 🟡 MODERATE MODULES (Medium Priority Fix)

#### ⚠️ Masters Module - CompaniesFormPanel
```
Component: CompaniesFormPanel.tsx
File: src/modules/features/masters/components/CompaniesFormPanel.tsx

Hardcoded Elements:
├─ sizeOptions (Lines 21-26)
│  ├─ Startup, Small, Medium, Large, Enterprise
│  └─ Cannot add new sizes without code
├─ statusOptions (Lines 29-33)
│  ├─ Active, Inactive, Prospect
│  └─ Cannot customize per tenant
└─ Industry field (Line 141)
   └─ Text input, should be dropdown

Fields Using Static Data:
┌──────────────┬────────────────┬──────────────────────┐
│ Field        │ Current Type   │ Issue                │
├──────────────┼────────────────┼──────────────────────┤
│ Size         │ Select.options │ Hardcoded array      │
│ Status       │ Select.options │ Hardcoded array      │
│ Industry     │ Text Input     │ Should be dynamic    │
└──────────────┴────────────────┴──────────────────────┘

Fix Effort: 1-2 hours
Priority: High (used frequently)
Impact: Cannot manage company types
```

#### ⚠️ Masters Module - ProductsFormPanel
```
Component: ProductsFormPanel.tsx
File: src/modules/features/masters/components/ProductsFormPanel.tsx

Status: Mixed (Partially Good)
├─ ✅ Uses getRefDataByCategory for status/units
├─ ✅ Uses DynamicSelect for categories
└─ ⚠️  Need to verify all dropdowns are truly dynamic

Fields Using Dynamic Data:
┌──────────────┬────────────────────┐
│ Field        │ Source             │
├──────────────┼────────────────────┤
│ Status       │ getRefDataByCategory │
│ Unit         │ getRefDataByCategory │
│ Category     │ DynamicSelect        │
└──────────────┴────────────────────┘

Fix Effort: 0-1 hours (if needed)
Priority: Low (mostly working)
Action: Verify all refs are truly dynamic
```

#### ⚠️ Customers Module - CustomerFormPanel
```
Component: CustomerFormPanel.tsx
File: src/modules/features/customers/components/CustomerFormPanel.tsx

Status: Mixed (Good hooks + Hardcoded configs)

Dynamic Data (✅ Good):
├─ Industries: useIndustries()
├─ Company Sizes: useCompanySizes()
└─ Users: useActiveUsers()

Hardcoded Configs (❌ Bad):
├─ statusConfig (Lines 78-83)
│  ├─ active, inactive, prospect, suspended
│  └─ Contains emoji + color + label
├─ customerTypeConfig (Lines 85-90)
│  ├─ business, individual, corporate, government
│  └─ Contains emoji + label
├─ ratingConfig (Lines 92-96)
│  ├─ hot, warm, cold
│  └─ Contains emoji + label
└─ sourceConfig (Lines 98-104)
   ├─ referral, website, sales_team, event, other
   └─ Contains emoji + label

Fields Using Hardcoded Configs:
┌─────────────┬──────────────────────┬─────────────┐
│ Field       │ Config Source        │ Issue       │
├─────────────┼──────────────────────┼─────────────┤
│ Status      │ statusConfig obj     │ Hardcoded   │
│ Type        │ customerTypeConfig   │ Hardcoded   │
│ Rating      │ ratingConfig         │ Hardcoded   │
│ Source      │ sourceConfig         │ Hardcoded   │
└─────────────┴──────────────────────┴─────────────┘

Fix Effort: 2-3 hours
Priority: Medium (good pattern, needs completion)
Action: Extract configs to hooks/database
```

---

### 🔴 HIGH PRIORITY MODULES (Fix Soon)

#### ❌ Contracts Module - ContractFormPanel
```
Component: ContractFormPanel.tsx
File: src/modules/features/contracts/components/ContractFormPanel.tsx

Hardcoded Elements:
├─ Contract Types (Lines 250-264)
│  ├─ service_agreement, nda, purchase_order, employment, custom
│  └─ Uses Select.Option elements
├─ Status (Lines 275-286)
│  ├─ draft, pending_approval, active, renewed, expired, terminated
│  └─ Uses Select.Option elements with emojis
└─ Priority (Lines 297-305)
   ├─ low, medium, high, critical
   └─ Uses Select.Option elements with icons

Fields Using Static Data:
┌──────────────┬────────────────────────┬────────────────┐
│ Field        │ Type                   │ Issue          │
├──────────────┼────────────────────────┼────────────────┤
│ Type         │ Select.Option array    │ 5 hardcoded    │
│ Status       │ Select.Option array    │ 6 hardcoded    │
│ Priority     │ Select.Option array    │ 4 hardcoded    │
│ Customer     │ Must search/enter      │ No dropdown    │
└──────────────┴────────────────────────┴────────────────┘

Additional Issues:
- No customer search (just text input)
- Cannot add new contract types
- Contract workflow not configurable
- No SLA management per type

Fix Effort: 2-3 hours
Priority: High (critical business feature)
Impact: High (contract management core)
```

#### ❌ JobWorks Module - JobWorksFormPanel
```
Component: JobWorksFormPanel.tsx
File: src/modules/features/jobworks/components/JobWorksFormPanel.tsx

Hardcoded Elements:
├─ Status (Lines 141-146)
│  ├─ pending, in_progress, completed, cancelled
│  └─ Uses Select.Option elements
├─ Priority (Lines 154-159)
│  ├─ low, medium, high, urgent
│  └─ Uses Select.Option elements
└─ Customer ID (Line 128)
   ├─ Text input (NO DROPDOWN!)
   └─ Very poor UX

Fields Using Static Data:
┌──────────────┬────────────────────┬──────────────────────┐
│ Field        │ Current Type       │ Issue                │
├──────────────┼────────────────────┼──────────────────────┤
│ Customer     │ Text Input         │ ❌ NO DROPDOWN!      │
│ Status       │ Select.Option arr  │ 4 hardcoded options  │
│ Priority     │ Select.Option arr  │ 4 hardcoded options  │
└──────────────┴────────────────────┴──────────────────────┘

Major Issues:
- Customer selection is terrible UX (text input!)
- Status values hardcoded
- Priority values hardcoded
- No way to discover valid customer IDs

Fix Effort: 3-4 hours
Priority: Critical (blockers good UX)
Impact: Very High (job work core feature)
```

---

### 🚨 CRITICAL MODULES (Fix ASAP)

#### 🚨 Complaints Module - ComplaintsFormPanel
```
Component: ComplaintsFormPanel.tsx
File: src/modules/features/complaints/components/ComplaintsFormPanel.tsx

🚨 CRITICAL ISSUES 🚨

Hardcoded Elements (Lines 70-165):
├─ STATUSES (Lines 70-75)
│  ├─ new, in_progress, on_hold, closed
│  ├─ Contains: label, value, color, icon
│  └─ 4 hardcoded statuses
├─ PRIORITIES (Lines 78-111)
│  ├─ low, medium, high, urgent
│  ├─ Contains: label, value, color, responseTime, resolutionTime, icon
│  ├─ SLA times hardcoded in component!
│  └─ 4 hardcoded priorities
├─ COMPLAINT_TYPES (Lines 114-150)
│  ├─ breakdown, preventive, software_update, optimize
│  ├─ Contains: label, value, color, department, slaResponse, slaResolution, icon
│  ├─ Department routing hardcoded!
│  ├─ SLA timings hardcoded per type!
│  └─ 4 hardcoded complaint types
└─ SUGGESTED_TAGS (Lines 154-165)
   ├─ 10 hardcoded tag suggestions
   └─ Cannot add tags without code change

Fields Using Static Data:
┌──────────────┬────────────────────┬─────────────────────────┐
│ Field        │ Source             │ Critical Issue          │
├──────────────┼────────────────────┼─────────────────────────┤
│ Priority     │ PRIORITIES array   │ SLA times hardcoded     │
│ Type         │ COMPLAINT_TYPES    │ Routing hardcoded       │
│ Tags         │ SUGGESTED_TAGS     │ Cannot customize        │
│ Department   │ Hardcoded in type  │ Cannot manage           │
└──────────────┴────────────────────┴─────────────────────────┘

Why It's Critical:
1. Cannot change SLA times without code change
2. Cannot customize per tenant
3. Cannot manage complaint types/routing
4. Blocks multi-tenant feature
5. Violates CRM best practices

Lines with SLA Logic:
├─ Line 197-208: SLA calculations from hardcoded COMPLAINT_TYPES
├─ Line 212-215: Department routing from hardcoded type config
└─ Line 321-341: Using hardcoded PRIORITIES and COMPLAINT_TYPES in render

Fix Effort: 4-5 hours
Priority: 🚨 CRITICAL
Impact: 🚨 CRITICAL (breaks multi-tenant SLA management)
Blocks: Multi-tenant customization, dynamic SLA management
```

#### 🚨 Tickets Module - TicketsFormPanel
```
Component: TicketsFormPanel.tsx
File: src/modules/features/tickets/components/* (verify location)

Status: Likely Similar to Complaints

Estimated Issues:
├─ Ticket types hardcoded
├─ Priority levels hardcoded
├─ Status workflow hardcoded
└─ SLA times likely hardcoded

Note: Needs audit to confirm exact locations

Fix Effort: 4-5 hours (if similar to complaints)
Priority: 🚨 CRITICAL
Action: Audit first, then implement fixes
```

---

## Quick Status Summary

```
┌─────────────────────────┬────────┬──────────┬────────────┐
│ Module / Form           │ Status │ Priority │ Fix Hours  │
├─────────────────────────┼────────┼──────────┼────────────┤
│ Dashboard               │ ✅    │ None     │ N/A        │
│ Audit Logs              │ ✅    │ None     │ N/A        │
│ Auth                    │ ✅    │ None     │ N/A        │
│ Masters - Companies     │ ❌    │ High     │ 1-2        │
│ Masters - Products      │ ✅    │ Low      │ 0-1        │
│ Customers               │ ⚠️    │ Medium   │ 2-3        │
│ Contracts               │ ❌    │ High     │ 2-3        │
│ JobWorks                │ ❌    │ High     │ 3-4        │
│ Complaints              │ 🚨    │ Critical │ 4-5        │
│ Tickets                 │ 🚨    │ Critical │ 4-5        │
│ Product Sales           │ ⚠️    │ Medium   │ 2-3 (audit)│
│ Sales Deals             │ ⚠️    │ Medium   │ 2-3 (audit)│
└─────────────────────────┴────────┴──────────┴────────────┘

Total Estimated Work: 25-35 hours
Total Forms Affected: 30+ components
```

---

## Implementation Timeline

### Week 1: Critical Path
```
🚨 Monday-Tuesday: Complaints Module
   ├─ Create ref tables (priorities, types, statuses, tags)
   ├─ Create hooks
   ├─ Update component
   └─ Test thoroughly

🚨 Wednesday-Thursday: Tickets Module
   ├─ Similar to complaints
   └─ Parallel or sequential

🚨 Friday: Testing & QA
   ├─ Both modules
   └─ Multi-tenant scenarios
```

### Week 2: High Priority
```
❌ Monday-Tuesday: ContractFormPanel
   ├─ Create ref tables (types, statuses, priorities)
   ├─ Create hooks
   └─ Update component

❌ Wednesday: JobWorksFormPanel
   ├─ Add customer dropdown
   ├─ Create ref tables (statuses, priorities)
   └─ Update component

❌ Thursday-Friday: Testing & QA
   ├─ Both modules
   └─ Integration tests
```

### Week 3: Medium Priority
```
❌ Monday-Tuesday: CompaniesFormPanel
   ├─ Create ref tables (sizes, statuses)
   ├─ Create hooks
   └─ Update component

⚠️  Wednesday: CustomerFormPanel
   ├─ Create ref tables (statuses, types, ratings, sources)
   ├─ Create hooks
   └─ Update component

⚠️  Thursday-Friday: Testing & QA
   ├─ Both modules
   └─ User acceptance testing
```

---

## Dependencies & Blockers

### Database Dependencies
```
✓ Supabase tables need to exist:
  - ref_statuses
  - ref_priorities
  - ref_types
  - ref_configuration
  - ref_company_sizes
  - ref_customer_statuses
  - ref_contract_types
  - ref_complaint_types
  - ref_ticket_types
  - ref_jobwork_statuses
```

### Code Dependencies
```
✓ Hooks must be created and exported
✓ Components must use queries correctly
✓ Error states must be handled
✓ Loading states must be displayed
```

### Testing Dependencies
```
✓ Mock service must have same data
✓ Supabase RLS policies must allow reads
✓ Multi-tenant filtering must work
```

---

## Before You Start

### Checklist
- [ ] Read FORMS_STATIC_DATA_ANALYSIS.md for detailed info
- [ ] Read FORMS_STATIC_DATA_QUICK_REFERENCE.md for code examples
- [ ] Database tables created
- [ ] Initial data seeded
- [ ] Hooks templates prepared
- [ ] Component update strategy planned
- [ ] Testing environment ready
- [ ] Team notified of changes

### Key Files to Reference
- FORMS_STATIC_DATA_ANALYSIS.md (comprehensive analysis)
- FORMS_STATIC_DATA_QUICK_REFERENCE.md (code examples)
- src/modules/features/customers/components/CustomerFormPanel.tsx (reference for good pattern with hooks)
- src/modules/features/masters/components/ProductsFormPanel.tsx (reference for dynamic data usage)

---

**Last Updated**: 2025-01-31  
**Status**: Analysis Complete - Ready for Development Planning

