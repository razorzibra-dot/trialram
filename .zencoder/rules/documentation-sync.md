---
description: Documentation Synchronization & Consolidation Rules
globs: ["src/modules/**/*.md", "docs/**/*.md", "*.md"]
alwaysApply: true
---

# Documentation Synchronization & Consolidation Rules

**Last Updated**: 2025-01-29 (Added Guide Documentation Standards)  
**Status**: Active Enforcement

## Core Principle

**Single Source of Truth**: Each module, service, or feature has exactly ONE authoritative documentation file.  
No duplicates, no scattered documentation, no outdated files.

---

## Mandatory Documentation Structure

### Module-Level Documentation

Every feature module in `/src/modules/features/{moduleName}/` must have ONE document:

```
src/modules/features/{moduleName}/
  ├── DOC.md (PRIMARY - Single source of truth)
  │   ├── Overview & Purpose
  │   ├── Architecture & Structure
  │   ├── Key Features & Responsibilities
  │   ├── Component Descriptions
  │   ├── State Management (Store, Hooks)
  │   ├── API & Hooks Reference
  │   ├── Data Types & Interfaces
  │   ├── Integration Points
  │   ├── Common Use Cases & Examples
  │   ├── Role-Based Access Control
  │   ├── Troubleshooting & Common Issues
  │   ├── Related Documentation Links
  │   └── Version Info & Last Updated
  ├── index.ts
  ├── routes.tsx
  ├── components/
  ├── services/
  ├── hooks/
  ├── store/
  └── views/
```

**File Naming**: Always use `DOC.md` (not ARCHITECTURE.md, not README.md, not module-specific names)

### Service-Level Documentation

Services in `/src/services/{serviceName}/` or `/src/modules/core/services/`:

```
src/services/{serviceName}/
  ├── DOC.md (PRIMARY - Document the service contract)
  │   ├── Purpose & Responsibilities
  │   ├── Multi-Backend Support (if applicable)
  │   ├── Public API Methods
  │   ├── Data Structures & Types
  │   ├── Error Handling Strategy
  │   ├── Integration Examples
  │   ├── Factory Routing (if applicable)
  │   └── Testing Guide
```

### Architecture/Pattern Documentation

Cross-cutting concerns in `/docs/architecture/`:

```
docs/architecture/
  ├── SERVICE_FACTORY.md
  ├── RBAC_AND_PERMISSIONS.md
  ├── SESSION_MANAGEMENT.md
  ├── REACT_QUERY.md
  ├── REACT_ROUTER.md
  ├── STATE_MANAGEMENT.md
  └── AUTHENTICATION.md
```

### Setup & Configuration Documentation

Environment and setup guides in `/docs/setup/`:

```
docs/setup/
  ├── LOCAL_DEVELOPMENT.md
  ├── SUPABASE_SETUP.md
  ├── DOCKER_SETUP.md
  ├── ENVIRONMENT_VARIABLES.md
  └── DATABASE_MIGRATIONS.md
```

### Troubleshooting & Quick References

Debug guides in `/docs/troubleshooting/`:

```
docs/troubleshooting/
  ├── COMMON_ERRORS.md
  ├── DEBUGGING_GUIDE.md
  ├── PERFORMANCE_ISSUES.md
  └── FQAS.md
```

### Summary & Report Documentation ⭐ NEW

All summary, report, and status documents in `/PROJ_DOCS/Summary and Report/`:

```
PROJ_DOCS/Summary and Report/
  ├── YYYY-MM-DD_ProjectName_SummaryType_v{version}.md
  │   ├── Metadata Header (title, date, author, status)
  │   ├── Executive Summary
  │   ├── Key Findings/Metrics
  │   ├── Details & Analysis
  │   ├── Next Steps/Recommendations
  │   └── Version History & Archival Info
  ├── Index_SummaryAndReport.md (Master index)
  └── ARCHIVE/
      └── {YearMonth}/ (organized by date)
          └── archived_reports.md
```

**Key Requirements**:
- ✅ Single source of truth for all summary/report materials
- ✅ Standardized naming: `YYYY-MM-DD_ProjectName_SummaryType_v{version}.md`
- ✅ Metadata header with title, date, author, and status
- ✅ Version control with explicit version numbers
- ✅ Automatic logging in master index
- ✅ Old versions archived to ARCHIVE/ organized by date
- ✅ Consistent formatting across all reports

### Checklist Documentation ⭐ NEW

All checklist documents in `/PROJ_DOCS/10_CHECKLISTS/`:

```
PROJ_DOCS/10_CHECKLISTS/
  ├── YYYY-MM-DD_ProjectName_ChecklistType_v{version}.md
  │   ├── Metadata Header (title, date, author, status)
  │   ├── Purpose & Scope
  │   ├── Pre-Checklist Requirements
  │   ├── Checklist Items (organized by section)
  │   ├── Sign-Off Section
  │   └── Version History & Archival Info
  ├── Index_Checklist.md (Master index)
  └── ARCHIVE/
      └── {YearMonth}/ (organized by date)
          └── archived_checklists.md
```

**Key Requirements**:
- ✅ Single source of truth for all checklist materials
- ✅ Standardized naming: `YYYY-MM-DD_ProjectName_ChecklistType_v{version}.md`
- ✅ Metadata header with title, date, author, and status
- ✅ Version control with explicit version numbers
- ✅ Automatic logging in master index
- ✅ Old versions archived to ARCHIVE/ organized by date
- ✅ Consistent formatting across all checklists

### Guide Documentation ⭐ NEW

All guide documents in `/PROJ_DOCS/11_GUIDES/`:

```
PROJ_DOCS/11_GUIDES/
  ├── YYYY-MM-DD_ProjectName_GuideType_v{version}.md
  │   ├── Metadata Header (title, date, author, status)
  │   ├── Overview & Purpose
  │   ├── Table of Contents
  │   ├── Prerequisites/Requirements
  │   ├── Step-by-Step Instructions
  │   ├── Examples & Use Cases
  │   ├── Troubleshooting Section
  │   ├── Related Resources
  │   └── Version History & Archival Info
  ├── Index_Guide.md (Master index)
  └── ARCHIVE/
      └── {YearMonth}/ (organized by date)
          └── archived_guides.md
```

**Key Requirements**:
- ✅ Single source of truth for all guide materials
- ✅ Standardized naming: `YYYY-MM-DD_ProjectName_GuideType_v{version}.md`
- ✅ Metadata header with title, date, author, status, and guideType
- ✅ Version control with explicit version numbers
- ✅ Automatic logging in master index
- ✅ Old versions archived to ARCHIVE/ organized by date
- ✅ Consistent formatting across all guides

---

## Metadata Standard

Every documentation file must start with this header:

```markdown
---
title: {Feature/Module/Service Name}
description: {One-line description of what this documents}
lastUpdated: YYYY-MM-DD
relatedModules: [list of related modules]
category: {module|service|architecture|setup|troubleshooting}
author: {Last person who updated this}
---

# {Title}

{Content follows}
```

**Example**:
```markdown
---
title: Customer Module
description: Complete documentation for the Customer module including architecture, components, state management, and API
lastUpdated: 2025-01-15
relatedModules: [sales, contracts, notifications]
category: module
author: AI Agent
---

# Customer Module

...rest of doc
```

---

## Summary & Report Documentation Standards ⭐ NEW ENFORCEMENT

### Purpose
All summary documents, project reports, status updates, and retrospectives must be centrally managed in `/PROJ_DOCS/Summary and Report/` to establish a **single source of truth** for all project documentation materials.

### Mandatory Metadata Header
Every summary/report file must start with:

```markdown
---
title: {Report/Summary Title}
description: {One-line description}
date: YYYY-MM-DD
author: {Name/Team}
version: {X.Y.Z}
status: {active|archived|deprecated|draft}
projectName: {Associated Project}
reportType: {summary|status|retrospective|analysis|completion}
previousVersions: [list of prior versions if applicable]
nextReview: YYYY-MM-DD (if applicable)
---

# {Title}

## Executive Summary
{Concise overview}

## Key Findings/Metrics
{Critical data points}

## Details & Analysis
{Full content}

## Next Steps/Recommendations
{Action items}

## Version History
- v{X.Y.Z} - {Date} - {Changes}
```

### Filing Rules ✅

1. **Naming Convention**: `YYYY-MM-DD_ProjectName_ReportType_v{version}.md`
   - Example: `2025-01-15_CustomerModule_CompletionReport_v1.0.md`

2. **Destination**: `/PROJ_DOCS/Summary and Report/`
   - No exceptions — all reports go here

3. **Master Index**: Update `/PROJ_DOCS/Summary and Report/Index_SummaryAndReport.md`
   - Log every new entry with date, title, author, and status

4. **Version Control**: 
   - Always use explicit version numbers (v1.0, v1.1, v2.0)
   - Update version when significant changes are made
   - Never overwrite — create new versioned file

5. **Archival**: 
   - When superseded or older than 6 months, move to `PROJ_DOCS/Summary and Report/ARCHIVE/{YearMonth}/`
   - Update status to "archived" in metadata
   - Keep entry in master index with archive location noted

### Content Standards ✓

- [ ] Metadata header complete and accurate
- [ ] Version number explicit and consistent
- [ ] Executive summary concise (2-3 paragraphs max)
- [ ] Key findings/metrics clearly formatted
- [ ] All claims backed by data or references
- [ ] Next steps or recommendations actionable
- [ ] Author and date clearly identified
- [ ] Related modules/projects linked
- [ ] No duplicated content from other docs
- [ ] Markdown formatting clean and consistent
- [ ] Logged in master index immediately

### Auto-Logging Requirements

The agent must:
- ✅ Create new summary/report in correct location
- ✅ Add entry to `/PROJ_DOCS/Summary and Report/Index_SummaryAndReport.md`
- ✅ Include file path, date created, author, and brief description in index
- ✅ Ensure metadata header is complete before considering task done
- ✅ Archive previous versions when creating updates
- ✅ Maintain version control discipline

### Violations & Penalties

| Violation | Action |
|-----------|--------|
| Summary/report in root directory | Move to `/PROJ_DOCS/Summary and Report/` immediately |
| Missing metadata header | Reject submission — header is mandatory |
| No version number | Add versioning before acceptance |
| Duplicate content with other docs | Consolidate before merge |
| Not logged in master index | Add entry with timestamp and author |
| Stale report (6+ months old) not archived | Archive and update metadata |

---

## Checklist Documentation Standards ⭐ NEW ENFORCEMENT

### Purpose
All checklist documents, implementation checklists, deployment checklists, validation checklists, and review checklists must be centrally managed in `/PROJ_DOCS/10_CHECKLISTS/` to establish a **single source of truth** for all checklist materials across the project.

### Mandatory Metadata Header
Every checklist file must start with:

```markdown
---
title: {Checklist Title}
description: {One-line description}
date: YYYY-MM-DD
author: {Name/Team}
version: {X.Y.Z}
status: {active|archived|deprecated|draft}
projectName: {Associated Project}
checklistType: {implementation|deployment|validation|review|pre-launch|audit|qa}
scope: {Scope of applicability}
previousVersions: [list of prior versions if applicable]
nextReview: YYYY-MM-DD (if applicable)
---

# {Title}

## Purpose & Scope
{Clear explanation of what this checklist covers}

## Pre-Checklist Requirements
{Prerequisites that must be met before starting}

## Checklist Items

### Section 1: {Category}
- [ ] Item 1 - {Description}
- [ ] Item 2 - {Description}

### Section 2: {Category}
- [ ] Item 1 - {Description}
- [ ] Item 2 - {Description}

## Sign-Off Section
- **Completed By**: {Name}
- **Date Completed**: YYYY-MM-DD
- **Verified By**: {Name}
- **Notes**: {Any additional notes}

## Version History
- v{X.Y.Z} - {Date} - {Changes}
```

### Filing Rules ✅

1. **Naming Convention**: `YYYY-MM-DD_ProjectName_ChecklistType_v{version}.md`
   - Example: `2025-01-17_DeploymentProcess_PreLaunchChecklist_v2.1.md`
   - Checklist Types: implementation, deployment, validation, review, pre-launch, audit, qa

2. **Destination**: `/PROJ_DOCS/10_CHECKLISTS/`
   - No exceptions — all checklists go here
   - Move existing checklists from scattered locations

3. **Master Index**: Update `/PROJ_DOCS/10_CHECKLISTS/Index_Checklist.md`
   - Log every new entry with date, title, type, author, and status

4. **Version Control**: 
   - Always use explicit version numbers (v1.0, v1.1, v2.0)
   - Update version when scope changes, items are added/removed, or refinements made
   - Never overwrite — create new versioned file

5. **Archival**: 
   - When superseded or older than 9 months, move to `PROJ_DOCS/10_CHECKLISTS/ARCHIVE/{YearMonth}/`
   - Update status to "archived" in metadata
   - Keep entry in master index with archive location noted

### Content Standards ✓

- [ ] Metadata header complete and accurate
- [ ] Version number explicit and consistent
- [ ] Purpose & scope clearly defined
- [ ] Pre-requisites documented
- [ ] All checklist items action-oriented and measurable
- [ ] Clear pass/fail criteria for each item
- [ ] Sign-off section includes responsible party and date
- [ ] No critical items left unclear or ambiguous
- [ ] Related documents or tools linked
- [ ] Markdown formatting clean and consistent
- [ ] Logged in master index immediately
- [ ] Applicable to current project/environment

### Checklist Best Practices ⭐

✅ **DO**:
- Be specific: "Deploy to production server X" not "Deploy"
- Include time estimates where applicable
- Add prerequisites clearly at the top
- Group related items into sections
- Provide sign-off verification steps
- Link to related documentation
- Version updates when items change significantly
- Archive old versions when replaced

❌ **DON'T**:
- Leave items vague or open to interpretation
- Mix multiple independent checklists into one
- Forget to update versions when making changes
- Leave completed checklists in "active" status
- Store checklists outside `/PROJ_DOCS/10_CHECKLISTS/`
- Create checklists without metadata headers
- Mix checklist with status reports

### Auto-Logging Requirements

The agent must:
- ✅ Create new checklist in correct location
- ✅ Add entry to `/PROJ_DOCS/10_CHECKLISTS/Index_Checklist.md`
- ✅ Include file path, date created, type, author, and brief description in index
- ✅ Ensure metadata header is complete before considering task done
- ✅ Archive previous versions when creating updates
- ✅ Maintain version control discipline
- ✅ Notify team when new critical checklists are added

### Violations & Penalties

| Violation | Action |
|-----------|--------|
| Checklist in root directory | Move to `/PROJ_DOCS/10_CHECKLISTS/` immediately |
| Missing metadata header | Reject submission — header is mandatory |
| No version number | Add versioning before acceptance |
| Vague or unclear items | Clarify all items before acceptance |
| Not logged in master index | Add entry with timestamp and type |
| Stale checklist (9+ months old) not archived | Archive and update metadata |
| Multiple independent checklists combined | Split into separate files |
| Checklist without sign-off section | Add sign-off template before acceptance |

---

## Guide Documentation Standards ⭐ NEW ENFORCEMENT

### Purpose
All guide documents, implementation guides, setup guides, troubleshooting guides, and best practice guides must be centrally managed in `/PROJ_DOCS/11_GUIDES/` to establish a **single source of truth** for all guide materials across the project.

### Mandatory Metadata Header
Every guide file must start with:

```markdown
---
title: {Guide Title}
description: {One-line description of what this guide covers}
date: YYYY-MM-DD
author: {Name/Team}
version: {X.Y.Z}
status: {active|archived|deprecated|draft}
projectName: {Associated Project}
guideType: {setup|implementation|troubleshooting|best-practices|integration|migration|performance|deployment|security|api}
scope: {Scope of applicability}
audience: {Target audience: developers|operators|admins|end-users}
difficulty: {beginner|intermediate|advanced}
estimatedTime: {X minutes or X hours}
previousVersions: [list of prior versions if applicable]
nextReview: YYYY-MM-DD (if applicable)
---

# {Title}

## Overview & Purpose
{Clear explanation of what this guide covers and why it's important}

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step-by-Step Instructions](#step-by-step-instructions)
3. [Examples & Use Cases](#examples--use-cases)
4. [Troubleshooting](#troubleshooting)
5. [Related Resources](#related-resources)

## Prerequisites/Requirements
{Prerequisites that must be met before starting}

## Step-by-Step Instructions

### Step 1: {Action}
{Detailed instructions}

### Step 2: {Action}
{Detailed instructions}

## Examples & Use Cases

### Example 1: {Use Case}
{Detailed example with code/screenshots}

### Example 2: {Use Case}
{Detailed example with code/screenshots}

## Troubleshooting

### Issue: {Problem}
**Solution**: {Detailed resolution steps}

### Issue: {Problem}
**Solution**: {Detailed resolution steps}

## Related Resources
- [Related Guide 1](link)
- [Related Documentation](link)

## Version History
- v{X.Y.Z} - {Date} - {Changes}
```

### Filing Rules ✅

1. **Naming Convention**: `YYYY-MM-DD_ProjectName_GuideType_v{version}.md`
   - Example: `2025-01-29_DeploymentProcess_PreLaunchGuide_v1.0.md`
   - Guide Types: setup, implementation, troubleshooting, best-practices, integration, migration, performance, deployment, security, api

2. **Destination**: `/PROJ_DOCS/11_GUIDES/`
   - No exceptions — all guides go here
   - Move existing guides from scattered locations (04_IMPLEMENTATION_GUIDES, 05_SETUP_CONFIGURATION, etc.)

3. **Master Index**: Update `/PROJ_DOCS/11_GUIDES/Index_Guide.md`
   - Log every new entry with date, title, type, audience, author, and status

4. **Version Control**: 
   - Always use explicit version numbers (v1.0, v1.1, v2.0)
   - Update version when scope changes, steps are added/modified, or clarifications made
   - Never overwrite — create new versioned file

5. **Archival**: 
   - When superseded or older than 12 months, move to `PROJ_DOCS/11_GUIDES/ARCHIVE/{YearMonth}/`
   - Update status to "archived" in metadata
   - Keep entry in master index with archive location noted

### Content Standards ✓

- [ ] Metadata header complete with all required fields
- [ ] Version number explicit and consistent
- [ ] Purpose clearly explained
- [ ] Prerequisites documented and easy to find
- [ ] Step-by-step instructions clear and detailed
- [ ] Each step includes success criteria or expected outcome
- [ ] Examples provided for key concepts
- [ ] Troubleshooting section addresses common issues
- [ ] All links are valid and current
- [ ] Difficulty level and estimated time accurate
- [ ] Target audience clearly identified
- [ ] No critical steps left unclear or ambiguous
- [ ] Related guides/documents linked
- [ ] Markdown formatting clean and consistent
- [ ] Logged in master index immediately
- [ ] Applicable to current project/environment

### Guide Best Practices ⭐

✅ **DO**:
- Start with clear prerequisites and requirements
- Use numbered steps with specific actions
- Include expected outcomes after each step
- Provide concrete examples with code/screenshots
- Link to related guides and documentation
- Break complex guides into sections
- Include troubleshooting section
- Estimate time to complete
- Specify target audience level (beginner/intermediate/advanced)
- Update version when steps significantly change
- Archive old versions when replaced
- Use consistent terminology throughout

❌ **DON'T**:
- Leave steps vague or open to interpretation
- Mix multiple independent guides into one
- Forget to update versions when making changes
- Leave outdated guides in "active" status
- Store guides outside `/PROJ_DOCS/11_GUIDES/`
- Create guides without metadata headers
- Mix guide content with troubleshooting reports
- Skip the Table of Contents in long guides
- Assume reader knowledge without documenting prerequisites
- Use jargon without explanation
- Mix multiple difficulty levels in one guide
- Leave new guides unlogged in master index

### Auto-Logging Requirements

The agent must:
- ✅ Create new guide in correct location
- ✅ Add entry to `/PROJ_DOCS/11_GUIDES/Index_Guide.md`
- ✅ Include file path, date created, type, audience, author, and brief description in index
- ✅ Ensure metadata header is complete before considering task done
- ✅ Archive previous versions when creating updates
- ✅ Maintain version control discipline
- ✅ Link to related guides in the index
- ✅ Notify team when new critical guides are added

### Violations & Penalties

| Violation | Action |
|-----------|--------|
| Guide in root directory | Move to `/PROJ_DOCS/11_GUIDES/` immediately |
| Missing metadata header | Reject submission — header is mandatory |
| No version number | Add versioning before acceptance |
| Vague or incomplete steps | Clarify all steps before acceptance |
| Not logged in master index | Add entry with timestamp and type |
| Stale guide (12+ months old) not archived | Archive and update metadata |
| Multiple independent guides combined | Split into separate files |
| Guide without Table of Contents (if length > 1000 words) | Add TOC before acceptance |
| Outdated guide still marked "active" | Update status to "archived" |
| Missing examples or use cases | Add practical examples before acceptance |

---

## Consolidation Rules (Enforcement ⚠️)

### ✅ DO
- ✅ Keep ONE authoritative document per module/service
- ✅ Update documentation whenever code changes
- ✅ Link to other docs rather than duplicate content
- ✅ Archive outdated/superseded documentation
- ✅ Include metadata header with last updated date
- ✅ Use clear section structure and navigation
- ✅ Include real code examples and use cases
- ✅ Document breaking changes explicitly
- ✅ Store ALL summary/report docs in `/PROJ_DOCS/Summary and Report/`
- ✅ Use standardized naming: `YYYY-MM-DD_ProjectName_ReportType_v{version}.md`
- ✅ Include complete metadata header with version and status
- ✅ Log every new summary/report in master index immediately
- ✅ Archive old reports (6+ months) to ARCHIVE/{YearMonth}/ subdirectory
- ✅ Maintain version control discipline with explicit version numbers
- ✅ Store ALL checklists in `/PROJ_DOCS/10_CHECKLISTS/`
- ✅ Use standardized checklist naming: `YYYY-MM-DD_ProjectName_ChecklistType_v{version}.md`
- ✅ Include mandatory metadata header with checklist type and scope
- ✅ Add sign-off section with completed by/verified by fields
- ✅ Make checklist items specific and action-oriented
- ✅ Log every new checklist in master index immediately
- ✅ Archive old checklists (9+ months) to ARCHIVE/{YearMonth}/ subdirectory
- ✅ Update version when checklist items significantly change
- ✅ Store ALL guides in `/PROJ_DOCS/11_GUIDES/`
- ✅ Use standardized guide naming: `YYYY-MM-DD_ProjectName_GuideType_v{version}.md`
- ✅ Include metadata header with guideType, audience, and difficulty level
- ✅ Use numbered steps for procedural guides
- ✅ Include examples and use cases in all guides
- ✅ Add troubleshooting section to guides
- ✅ Specify target audience (developers|operators|admins|end-users)
- ✅ Log every new guide in master index immediately
- ✅ Archive old guides (12+ months) to ARCHIVE/{YearMonth}/ subdirectory
- ✅ Update version when guide steps or content significantly change

### ❌ DON'T
- ❌ Create multiple docs for the same feature
- ❌ Leave outdated documentation in place
- ❌ Repeat technical details across multiple files
- ❌ Store docs in the root directory (except README.md)
- ❌ Use ARCHITECTURE.md (use DOC.md instead)
- ❌ Leave documentation out of sync with code
- ❌ Create session-tracking or temporary documentation
- ❌ Duplicate content from `.zencoder/rules/repo.md`
- ❌ Store summary/report documents anywhere except `/PROJ_DOCS/Summary and Report/`
- ❌ Create summary/report without metadata header
- ❌ Mix versioning schemes (use semantic versioning consistently)
- ❌ Leave new reports unlogged in the master index
- ❌ Keep stale reports (6+ months) in active folder without archival
- ❌ Overwrite report files — always create new versions
- ❌ Store checklists outside `/PROJ_DOCS/10_CHECKLISTS/`
- ❌ Create checklists without mandatory metadata header
- ❌ Use vague checklist items ("Deploy" instead of "Deploy to production server X")
- ❌ Mix unrelated checklists into a single file
- ❌ Leave completed checklists with "active" status
- ❌ Forget to add sign-off section to checklists
- ❌ Leave new checklists unlogged in the master index
- ❌ Overwrite checklist files — always create new versions
- ❌ Store guides outside `/PROJ_DOCS/11_GUIDES/`
- ❌ Create guides without mandatory metadata header
- ❌ Mix multiple independent guides into a single file
- ❌ Leave vague or incomplete steps in guides
- ❌ Skip prerequisites and requirements section
- ❌ Create guides without examples or use cases
- ❌ Forget to include troubleshooting section
- ❌ Leave guides in "active" status when outdated
- ❌ Leave new guides unlogged in the master index
- ❌ Overwrite guide files — always create new versions
- ❌ Create guides without Table of Contents (if longer than 1000 words)
- ❌ Use jargon without explaining technical terms

---

## Module Documentation Checklist

When creating or updating module documentation:

### Structure ✓
- [ ] Overview section explains purpose
- [ ] Module structure diagram provided
- [ ] Directory tree included
- [ ] All major components documented

### Components ✓
- [ ] Each component has responsibility documented
- [ ] Props/parameters listed
- [ ] Component relationships shown
- [ ] Usage examples provided

### State Management ✓
- [ ] Store structure documented (if using Zustand)
- [ ] Actions/setters documented
- [ ] Selector hooks listed
- [ ] State update flow explained

### APIs & Hooks ✓
- [ ] All public hooks documented
- [ ] Parameters and return types shown
- [ ] Query keys structure documented (if using React Query)
- [ ] Usage examples included

### Data Types ✓
- [ ] All interfaces documented
- [ ] Type definitions with comments
- [ ] Example data structures
- [ ] Type inheritance shown

### Integration ✓
- [ ] Dependencies listed
- [ ] Integration points documented
- [ ] Related modules linked
- [ ] Permission requirements shown

### Troubleshooting ✓
- [ ] Common issues section
- [ ] Debugging guidance
- [ ] Error messages explained
- [ ] Resolution steps provided

### Metadata ✓
- [ ] Title clearly states module name
- [ ] Description provided
- [ ] Last updated date recent
- [ ] Author/contact documented
- [ ] Related modules linked

---

## Archival Rules

### What Gets Archived

Files to archive immediately to `/DOCUMENTATION/09_ARCHIVED/ROOT_DOCS_ARCHIVE/`:

1. **Session Summaries** (e.g., SESSION_FIX_SUMMARY.md, SESSION_COMPLETION_REPORT.md)
2. **Temporary Docs** (e.g., BEFORE_AFTER_COMPARISON.md)
3. **Status Trackers** (e.g., COMPLETION_CHECKLIST.md, PHASE_5_3_COMPLETION_SUMMARY.md)
4. **Investigation Reports** (e.g., ADMIN_PERMISSIONS_DEEP_INVESTIGATION.md)
5. **Quick Fix Guides** - unless they're consolidated into proper docs
6. **Duplicate Docs** - Keep only the most recent/authoritative version

### Archive Naming

```
/DOCUMENTATION/09_ARCHIVED/ROOT_DOCS_ARCHIVE/
├── BY_MODULE/
│   ├── ADMIN_PERMISSIONS/
│   │   ├── ADMIN_PERMISSIONS_INVESTIGATION_INDEX.md
│   │   ├── ADMIN_PERMISSIONS_DEEP_INVESTIGATION.md
│   │   └── ... (all 8 files)
│   ├── SALES/
│   │   └── ... (all 19 files)
│   └── ... (other modules)
└── BY_TYPE/
    ├── SESSION_SUMMARIES/
    ├── TEMPORARY_DOCS/
    └── STATUS_TRACKERS/
```

### Archival Process

1. Create archive subdirectory
2. Move files with `mv` command
3. Update master index at `/DOCUMENTATION/ARCHIVE_INDEX.md`
4. Document what was consolidated into which new doc
5. Update `.zencoder/rules/documentation-sync.md` with archival record

---

## Audit & Maintenance

### Monthly Audit

Every month:
- [ ] Check for duplicate documentation
- [ ] Verify all module docs are up-to-date
- [ ] Check for outdated links
- [ ] Review archived docs for references
- [ ] Update root README.md with structure overview

### Automated Checks (CI/CD)

Consider implementing:
- Validation that referenced docs exist
- Verification of metadata headers
- Check for stale (unupdated) documentation
- Duplicate filename detection
- Link validation

### Documentation Debt Tracking

Maintain `/DOCUMENTATION/TODO.md`:
```markdown
# Documentation Debt Tracker

## High Priority (Do First)
- [ ] Customer module consolidation (10 files → 1)
- [ ] Sales module consolidation (19 files → 1)

## Medium Priority (Soon)
- [ ] RBAC documentation consolidation
- [ ] Session management architecture doc

## Low Priority (When Time)
- [ ] Performance tuning guide
- [ ] Migration guide from old architecture
```

---

## Penalties & Enforcement

### Code Review Gates

Pull requests must pass:
- ✅ Documentation synchronization check
- ✅ No duplicate docs introduced
- ✅ Updated docs match code changes
- ✅ Metadata headers present
- ✅ Links to related docs valid

### Violations

**Penalty for violating these rules**:

1. **Creating duplicate documentation**
   → Reviewer will request consolidation before merge

2. **Leaving outdated documentation**
   → Reviewer will request update or archival

3. **Scattered session/temporary docs in root**
   → Auto-archive to `/DOCUMENTATION/09_ARCHIVED/` before merge

4. **Documentation out of sync with code**
   → Code change rejected until docs are updated

---

## Transition Guide

### For Existing Out-of-Sync Documentation

1. **Identify the topic** (e.g., "Customer Module")
2. **Find all related docs** (e.g., CUSTOMER_*.md files)
3. **Consolidate into one** module/service doc
4. **Place in correct location** (e.g., `/src/modules/features/customers/DOC.md`)
5. **Archive originals** to `/DOCUMENTATION/09_ARCHIVED/`
6. **Update cross-references** in other docs

### Example: Customer Module

**Before**:
```
Root: CUSTOMER_MODULE_COMPLETION_CHECKLIST.md
Root: CUSTOMER_MODULE_QUICK_FIX_GUIDE.md
Root: CUSTOMER_DROPDOWN_FIX_SUMMARY.md
Root: CUSTOMER_GRID_EMPTY_FIX_COMPLETE.md
Scattered: Various bug fixes and status docs
```

**After**:
```
src/modules/features/customers/DOC.md (Consolidated)
├── Overview
├── Architecture & Components
├── Features
├── Known Issues (includes all fixes)
├── Troubleshooting
└── Metadata

/DOCUMENTATION/09_ARCHIVED/ROOT_DOCS_ARCHIVE/CUSTOMER/
├── OLD_CUSTOMER_MODULE_COMPLETION_CHECKLIST.md
├── OLD_CUSTOMER_MODULE_QUICK_FIX_GUIDE.md
└── ... (archived with dates)
```

---

## Related Files

- **Primary Rule**: `.zencoder/rules/repo.md` - Repository information
- **Code Standards**: `.zencoder/rules/new-zen-rule.md` - Coding standards
- **Architecture Reference**: `/docs/architecture/` - Cross-cutting concerns
- **Module Index**: `/src/modules/features/` - All modules
- **Service Index**: `/src/services/` - All services
- **Summary & Report Hub**: `/PROJ_DOCS/Summary and Report/` - All project reports & status updates
- **Summary Master Index**: `/PROJ_DOCS/Summary and Report/Index_SummaryAndReport.md` - Central registry
- **Checklist Hub**: `/PROJ_DOCS/10_CHECKLISTS/` - All project checklists & verification lists
- **Checklist Master Index**: `/PROJ_DOCS/10_CHECKLISTS/Index_Checklist.md` - Central registry

---

## Questions & Support

For questions about documentation structure, refer to:
1. **Module Example**: `/src/modules/features/contracts/DOC.md`
2. **Service Example**: Check any service with implemented DOC.md
3. **Architecture Reference**: `.zencoder/rules/repo.md`
4. **This File**: You're reading the enforcement rules

**Last Updated**: 2025-01-15  
**Next Review**: Monthly audit cycle