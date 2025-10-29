---
title: PROJ_DOCS Master Index
description: Central navigation hub for all project documentation with single-source-of-truth structure
lastUpdated: 2025-01-29
category: navigation
---

# PROJ_DOCS - Project Documentation Hub

> ✅ **Single Source of Truth** - Each document has ONE authoritative location. No duplicates.

## 📍 Navigation Structure

### 00_START_HERE
**Entry point for all users**
- [`START_HERE.md`](./00_START_HERE/START_HERE.md) - Comprehensive overview and orientation guide

**Quick Links**: 
- [Developer Quick Start](./02_GETTING_STARTED/DEVELOPER_QUICK_START.md)
- [Setup Configuration](./05_SETUP_CONFIGURATION/)
- [Module Docs](./06_MODULE_DOCS/)

---

### 01_ARCHITECTURE_DESIGN
**System design and technical architecture**

- [`ARCHITECTURE_VISUAL_GUIDE.md`](./01_ARCHITECTURE_DESIGN/ARCHITECTURE_VISUAL_GUIDE.md) - Visual representation of system components
- [`DATA_MODEL_ANALYSIS.md`](./01_ARCHITECTURE_DESIGN/DATA_MODEL_ANALYSIS.md) - Entity relationships and data structures
- [`MODULAR_ARCHITECTURE_MIGRATION_GUIDE.md`](./01_ARCHITECTURE_DESIGN/MODULAR_ARCHITECTURE_MIGRATION_GUIDE.md) - Migration to modular architecture
- [`MODULE_SERVICES_ARCHITECTURE_ALIGNMENT.md`](./01_ARCHITECTURE_DESIGN/MODULE_SERVICES_ARCHITECTURE_ALIGNMENT.md) - Module-service relationships
- [`MULTI_BACKEND_INTEGRATION_GUIDE.md`](./01_ARCHITECTURE_DESIGN/MULTI_BACKEND_INTEGRATION_GUIDE.md) - Multi-backend support (Mock, .NET, Supabase)

**Use When**: Understanding system design, planning integrations, reviewing architecture decisions

---

### 02_GETTING_STARTED
**Onboarding and initial setup guides**

- [`DEVELOPER_QUICK_START.md`](./02_GETTING_STARTED/DEVELOPER_QUICK_START.md) - Quick-start for new developers

**Use When**: Getting your first development environment running, understanding project structure

---

### 03_PHASES
**Phase-based completion tracking and milestones**

#### Phase_1/
*Project initialization and foundational setup*

#### Phase_2/
- [`PHASE_2_COMPLETE_SUMMARY.md`](./03_PHASES/Phase_2/PHASE_2_COMPLETE_SUMMARY.md) - Phase 2 completion summary

#### Phase_3/
- [`PHASE_3_COMPLETION_SUMMARY.md`](./03_PHASES/Phase_3/PHASE_3_COMPLETION_SUMMARY.md) - Phase 3 overview
- [`PHASE_3_IMPLEMENTATION_SUMMARY.md`](./03_PHASES/Phase_3/PHASE_3_IMPLEMENTATION_SUMMARY.md) - Detailed implementation notes
- [`PHASE_3_STATUS_CHECKLIST.md`](./03_PHASES/Phase_3/PHASE_3_STATUS_CHECKLIST.md) - Phase 3 checklist

#### Phase_4/
- [`PHASE_4_STAGE_1_SUMMARY.md`](./03_PHASES/Phase_4/PHASE_4_STAGE_1_SUMMARY.md) - Stage 1 completion
- [`PHASE_4_STAGE_2_QUICK_REFERENCE.md`](./03_PHASES/Phase_4/PHASE_4_STAGE_2_QUICK_REFERENCE.md) - Stage 2 reference
- [`PHASE_4_IMPLEMENTATION_CHECKLIST.md`](./03_PHASES/Phase_4/PHASE_4_IMPLEMENTATION_CHECKLIST.md) - Phase 4 checklist

**Use When**: Reviewing historical progress, understanding what was completed in each phase

---

### 04_IMPLEMENTATION_GUIDES
**Step-by-step implementation references**

#### Services/
- [`API_AUDIT_REPORT.md`](./04_IMPLEMENTATION_GUIDES/Services/API_AUDIT_REPORT.md) - API implementation audit
- [`RBAC_FIX_SUMMARY_SESSION.md`](./04_IMPLEMENTATION_GUIDES/Services/RBAC_FIX_SUMMARY_SESSION.md) - RBAC implementation and fixes
- [`PRODUCTS_MAP_ERROR_FIX_SUMMARY.md`](./04_IMPLEMENTATION_GUIDES/Services/PRODUCTS_MAP_ERROR_FIX_SUMMARY.md) - Product service fixes
- [`AUTH_SEEDING_DEPLOYMENT_CHECKLIST.md`](./04_IMPLEMENTATION_GUIDES/Services/AUTH_SEEDING_DEPLOYMENT_CHECKLIST.md) - Authentication setup
- [`RBAC_DEPLOYMENT_CHECKLIST.md`](./04_IMPLEMENTATION_GUIDES/Services/RBAC_DEPLOYMENT_CHECKLIST.md) - RBAC deployment

#### Features/
*Feature-specific implementation guides*

**Use When**: Implementing new services, deploying authentication, setting up RBAC

---

### 05_SETUP_CONFIGURATION
**Environment and system configuration**

#### Supabase/
- [`GET_STARTED_SUPABASE.md`](./05_SETUP_CONFIGURATION/Supabase/GET_STARTED_SUPABASE.md) - Supabase setup and configuration

#### Authentication/
*Authentication configuration guides*

#### Environment/
*Environment variable and .env setup*

**Use When**: Setting up local development, configuring backends, managing environments

---

### 06_MODULE_DOCS
**Feature module documentation**

- [`ALL_MODULES_FACTORY_ROUTING_STATUS.md`](./06_MODULE_DOCS/ALL_MODULES_FACTORY_ROUTING_STATUS.md) - Status of module migration to service factory

**Use When**: Understanding module structure, checking service factory implementation status

---

### 🚀 PRODUCT SALES MODULE (Phase 5 - Complete ✅)
**Comprehensive Product Sales management system - 100% Complete**

#### Documentation
- **Module Documentation**: [`src/modules/features/product-sales/DOC.md`](../src/modules/features/product-sales/DOC.md) - Complete module reference (1,126 lines)
  - 12 feature categories fully documented
  - 13 custom hooks with examples
  - 6 service layer APIs
  - 9 React components
  - Status workflows and invoice generation
  - Integration patterns with other modules

#### Guides & References
- **Implementation Guide**: [`11_GUIDES/2025-01-29_ProductSales_ImplementationGuide_v2.0.md`](./11_GUIDES/2025-01-29_ProductSales_ImplementationGuide_v2.0.md) - Complete setup and workflow walkthroughs
  - Environment setup and configuration
  - 6 core workflow examples
  - Advanced features (filtering, analytics, contracts)
  - Integration guide with Customers, Products, Notifications
  - Performance tuning and security best practices
  - Deployment checklist

- **API Reference**: [`07_REFERENCES_QUICK/2025-01-29_ProductSales_APIReference_v1.0.md`](./07_REFERENCES_QUICK/2025-01-29_ProductSales_APIReference_v1.0.md) - Complete API documentation
  - 5 Query hooks with signatures and examples
  - 8 Mutation hooks for all CRUD operations
  - 6 Service layer methods
  - 8 Component APIs with prop definitions
  - 9 Data type interfaces
  - 3 Enums (Status, PaymentStatus, ExportFormat)
  - Error codes and quick reference

- **Troubleshooting Guide**: [`11_GUIDES/ProductSalesModule_Troubleshooting_v1.0.md`](./11_GUIDES/ProductSalesModule_Troubleshooting_v1.0.md) - Common issues and solutions
  - 8 common issues with root causes and solutions
  - Debugging techniques and verification steps
  - Configuration troubleshooting
  - RLS policy issues
  - Bulk operations debugging

#### Status
| Component | Status |
|-----------|--------|
| Architecture | ✅ 100% Complete - 6-layer design |
| Components | ✅ 100% Complete - 9 components |
| Hooks | ✅ 100% Complete - 13 custom hooks |
| Services | ✅ 100% Complete - 6 services |
| Database | ✅ 100% Complete - RLS policies |
| Documentation | ✅ 100% Complete - 3,500+ lines |
| Build Status | ✅ PASS - 0 errors |
| Lint Status | ✅ PASS - 0 module-specific errors |

**Use When**: Building product sales features, integrating with other modules, troubleshooting issues

---

### 07_REFERENCES_QUICK
**Quick-access references (links to authoritative docs)**

#### CHECKLISTS/
- [`NEW_SERVICE_IMPLEMENTATION_CHECKLIST.md`](./07_REFERENCES_QUICK/CHECKLISTS/NEW_SERVICE_IMPLEMENTATION_CHECKLIST.md)
- [`PHASE_3_STATUS_CHECKLIST.md`](./07_REFERENCES_QUICK/CHECKLISTS/PHASE_3_STATUS_CHECKLIST.md)
- [`PHASE_4_IMPLEMENTATION_CHECKLIST.md`](./07_REFERENCES_QUICK/CHECKLISTS/PHASE_4_IMPLEMENTATION_CHECKLIST.md)
- [`AUTH_SEEDING_DEPLOYMENT_CHECKLIST.md`](./07_REFERENCES_QUICK/CHECKLISTS/AUTH_SEEDING_DEPLOYMENT_CHECKLIST.md)
- [`RBAC_DEPLOYMENT_CHECKLIST.md`](./07_REFERENCES_QUICK/CHECKLISTS/RBAC_DEPLOYMENT_CHECKLIST.md)

**Reference Stubs** (Link to canonical files):
- [`ARCHITECTURE_VISUAL_GUIDE.md`](./07_REFERENCES_QUICK/ARCHITECTURE_VISUAL_GUIDE.md) → Canonical: `01_ARCHITECTURE_DESIGN/`
- [`DATA_MODEL_ANALYSIS.md`](./07_REFERENCES_QUICK/DATA_MODEL_ANALYSIS.md) → Canonical: `01_ARCHITECTURE_DESIGN/`
- [`DEVELOPER_QUICK_START.md`](./07_REFERENCES_QUICK/DEVELOPER_QUICK_START.md) → Canonical: `02_GETTING_STARTED/`
- [`API_AUDIT_REPORT.md`](./07_REFERENCES_QUICK/API_AUDIT_REPORT.md) → Canonical: `04_IMPLEMENTATION_GUIDES/Services/`
- [`PRODUCTS_MAP_ERROR_FIX_SUMMARY.md`](./07_REFERENCES_QUICK/PRODUCTS_MAP_ERROR_FIX_SUMMARY.md) → Canonical: `04_IMPLEMENTATION_GUIDES/Services/`
- [`ALL_MODULES_FACTORY_ROUTING_STATUS.md`](./07_REFERENCES_QUICK/ALL_MODULES_FACTORY_ROUTING_STATUS.md) → Canonical: `06_MODULE_DOCS/`
- [`MULTI_BACKEND_INTEGRATION_GUIDE.md`](./07_REFERENCES_QUICK/MULTI_BACKEND_INTEGRATION_GUIDE.md) → Canonical: `01_ARCHITECTURE_DESIGN/`
- [`MODULE_SERVICES_ARCHITECTURE_ALIGNMENT.md`](./07_REFERENCES_QUICK/MODULE_SERVICES_ARCHITECTURE_ALIGNMENT.md) → Canonical: `01_ARCHITECTURE_DESIGN/`
- [`MODULAR_ARCHITECTURE_MIGRATION_GUIDE.md`](./07_REFERENCES_QUICK/MODULAR_ARCHITECTURE_MIGRATION_GUIDE.md) → Canonical: `01_ARCHITECTURE_DESIGN/`
- [`START_HERE.md`](./07_REFERENCES_QUICK/START_HERE.md) → Canonical: `00_START_HERE/`

**Use When**: Need quick reference links or command checklists

---

### 08_ARCHIVE
**Historical and deprecated documentation**

#### Phases/
*Archived Phase summaries and previous versions*

#### Services/
*Archived service implementation notes*

#### Legacy/
*Deprecated or superseded documentation*

**Use When**: Reviewing historical decisions, understanding why things changed

**Note**: Contents archived but kept for reference. Do not use for current development.

---

## 🎯 Quick Access by Use Case

### I Want to Work on Product Sales
1. Overview: [`PRODUCT SALES MODULE`](#-product-sales-module-phase-5---complete-)
2. Module Docs: [`src/modules/features/product-sales/DOC.md`](../src/modules/features/product-sales/DOC.md)
3. Implementation: [`11_GUIDES/2025-01-29_ProductSales_ImplementationGuide_v2.0.md`](./11_GUIDES/2025-01-29_ProductSales_ImplementationGuide_v2.0.md)
4. API Reference: [`07_REFERENCES_QUICK/2025-01-29_ProductSales_APIReference_v1.0.md`](./07_REFERENCES_QUICK/2025-01-29_ProductSales_APIReference_v1.0.md)
5. Troubleshooting: [`11_GUIDES/ProductSalesModule_Troubleshooting_v1.0.md`](./11_GUIDES/ProductSalesModule_Troubleshooting_v1.0.md)

### I'm New to This Project
1. Start: [`00_START_HERE/START_HERE.md`](./00_START_HERE/START_HERE.md)
2. Setup: [`05_SETUP_CONFIGURATION/Supabase/GET_STARTED_SUPABASE.md`](./05_SETUP_CONFIGURATION/Supabase/GET_STARTED_SUPABASE.md)
3. Getting Started: [`02_GETTING_STARTED/DEVELOPER_QUICK_START.md`](./02_GETTING_STARTED/DEVELOPER_QUICK_START.md)

### I Need to Understand the Architecture
1. Overview: [`01_ARCHITECTURE_DESIGN/ARCHITECTURE_VISUAL_GUIDE.md`](./01_ARCHITECTURE_DESIGN/ARCHITECTURE_VISUAL_GUIDE.md)
2. Data Model: [`01_ARCHITECTURE_DESIGN/DATA_MODEL_ANALYSIS.md`](./01_ARCHITECTURE_DESIGN/DATA_MODEL_ANALYSIS.md)
3. Integration: [`01_ARCHITECTURE_DESIGN/MULTI_BACKEND_INTEGRATION_GUIDE.md`](./01_ARCHITECTURE_DESIGN/MULTI_BACKEND_INTEGRATION_GUIDE.md)

### I'm Implementing a New Service
1. Checklist: [`07_REFERENCES_QUICK/CHECKLISTS/NEW_SERVICE_IMPLEMENTATION_CHECKLIST.md`](./07_REFERENCES_QUICK/CHECKLISTS/NEW_SERVICE_IMPLEMENTATION_CHECKLIST.md)
2. API Reference: [`04_IMPLEMENTATION_GUIDES/Services/API_AUDIT_REPORT.md`](./04_IMPLEMENTATION_GUIDES/Services/API_AUDIT_REPORT.md)
3. RBAC Setup: [`04_IMPLEMENTATION_GUIDES/Services/RBAC_DEPLOYMENT_CHECKLIST.md`](./04_IMPLEMENTATION_GUIDES/Services/RBAC_DEPLOYMENT_CHECKLIST.md)

### I Need to Deploy Something
1. Auth: [`07_REFERENCES_QUICK/CHECKLISTS/AUTH_SEEDING_DEPLOYMENT_CHECKLIST.md`](./07_REFERENCES_QUICK/CHECKLISTS/AUTH_SEEDING_DEPLOYMENT_CHECKLIST.md)
2. RBAC: [`07_REFERENCES_QUICK/CHECKLISTS/RBAC_DEPLOYMENT_CHECKLIST.md`](./07_REFERENCES_QUICK/CHECKLISTS/RBAC_DEPLOYMENT_CHECKLIST.md)
3. Supabase: [`05_SETUP_CONFIGURATION/Supabase/GET_STARTED_SUPABASE.md`](./05_SETUP_CONFIGURATION/Supabase/GET_STARTED_SUPABASE.md)

---

## 📋 Documentation Principles

### ✅ Single Source of Truth
- Each topic has **ONE authoritative file**
- Quick references link to canonical files instead of duplicating content
- No document exists in multiple places with potentially different versions

### ✅ Clear Organization
- Documents grouped by function and use case
- Hierarchical structure mirrors project architecture
- Consistent file naming conventions

### ✅ Easy Navigation
- Index files at each level for sub-section discovery
- Cross-references between related documents
- Breadcrumb trails and "Related" sections

### ✅ Always Current
- Last updated dates in metadata headers
- Links verified during documentation maintenance
- Archived versions clearly marked with "OLD_" prefix

---

## 📊 Consolidation Status

**Total Unique Documents**: 40+  
**Duplicate Sets Consolidated**: 25  
**Archive References**: 15  
**Quick Reference Links**: 10  

✅ **Zero content duplication**  
✅ **Single authoritative version of each document**  
✅ **All archived copies safely stored with "OLD_" prefix**

---

## 🔄 How to Update This Documentation

1. **Find the canonical file** using this INDEX
2. **Update only the canonical file** (not duplicates)
3. **Update the last_updated date** in the file's metadata header
4. **Update any cross-references** if the file moved or changed purpose
5. **Archive old versions** in `08_ARCHIVE/` if they become obsolete

---

## 📞 Questions?

- **Where's a specific document?** → Start with this INDEX, use search (Ctrl+F)
- **A document seems out of date?** → Check the `last_updated` date; if > 2 weeks old, it may need review
- **Found duplicate content?** → Report it so we can consolidate it into the single canonical version

---

**Last Consolidated**: 2025-01-29  
**Consolidation Complete**: ✅ All 25 duplicate sets consolidated  
**Product Sales Module**: ✅ Phase 5 Complete - Full documentation (3,500+ lines)  
**Next Review**: Monthly documentation audit