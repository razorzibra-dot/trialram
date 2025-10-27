---
title: Documentation Quick Reference
description: Fast lookup guide for finding documentation
lastUpdated: 2025-01-15
---

# 📚 Documentation Quick Reference

## 🎯 What You're Looking For?

### I'm a Developer

**Starting a new feature?**
```
1. Read: .zencoder/rules/repo.md (PRIMARY AUTHORITY)
2. Read: START_HERE_DOCUMENTATION.md
3. Go to: src/modules/features/{your-module}/DOC.md
4. Reference: .zencoder/rules/documentation-sync.md (standards)
```

**Understanding a module?**
```
👉 src/modules/features/{module-name}/DOC.md
   Contains: Overview, architecture, components, hooks, API, integration
```

**Need authentication info?**
```
👉 src/modules/features/auth/DOC.md
   + docs/architecture/AUTHENTICATION.md
   + docs/architecture/SESSION_MANAGEMENT.md
```

**Need RBAC/Permissions?**
```
👉 docs/architecture/RBAC_AND_PERMISSIONS.md
   + src/modules/features/user-management/DOC.md
```

**Understanding the Service Factory?**
```
👉 .zencoder/rules/repo.md (lines 107-214)
   + docs/architecture/SERVICE_FACTORY.md (when created)
```

---

## 📁 Directory Structure At A Glance

```
root/
├── 🎯 STRATEGIC REFERENCE FILES
│   ├── START_HERE_DOCUMENTATION.md          ⭐ Start here
│   ├── DOCUMENTATION_CONSOLIDATION_COMPLETE_FINAL.md  (This consolidation)
│   ├── README_DOCUMENTATION_CLEANUP.md       Quick overview
│   ├── DOCUMENTATION_CLEANUP_STRATEGY.md     Roadmap
│   └── DOCUMENTATION_CONSOLIDATION_INDEX.md  Progress tracking
│
├── .zencoder/rules/
│   ├── repo.md                              ⭐ PRIMARY AUTHORITY
│   └── documentation-sync.md                📋 Enforcement rules
│
├── src/modules/features/
│   ├── audit-logs/DOC.md                    📋 Audit module
│   ├── auth/DOC.md                          🔐 Authentication
│   ├── complaints/DOC.md                    📞 Complaints
│   ├── configuration/DOC.md                 ⚙️ Configuration
│   ├── contracts/DOC.md                     📋 Contracts
│   ├── customers/DOC.md                     👥 Customers
│   ├── dashboard/DOC.md                     📊 Dashboard
│   ├── jobworks/DOC.md                      🔨 Job Works
│   ├── masters/DOC.md                       📦 Masters
│   ├── notifications/DOC.md                 🔔 Notifications
│   ├── product-sales/DOC.md                 🛒 Product Sales
│   ├── sales/DOC.md                         📈 Sales
│   ├── service-contracts/DOC.md             📜 Service Contracts
│   ├── super-admin/DOC.md                   👑 Super Admin
│   ├── tickets/DOC.md                       🎫 Tickets
│   └── user-management/DOC.md               👤 User Management
│
├── docs/
│   ├── architecture/                        🏗️ Cross-cutting architecture
│   ├── setup/                               🔧 Setup guides
│   ├── troubleshooting/                     🆘 Debugging
│   └── user-guide/                          📖 User documentation
│
├── DOCUMENTATION/
│   ├── 00_START_HERE/
│   ├── 01_ARCHITECTURE_DESIGN/
│   ├── 02_GETTING_STARTED/
│   ├── 03_PHASES/
│   ├── 04_IMPLEMENTATION_GUIDES/
│   ├── 05_SETUP_CONFIGURATION/
│   ├── 06_BUG_FIXES_KNOWN_ISSUES/
│   ├── 07_MODULE_DOCS/
│   ├── 08_REFERENCES_QUICK/
│   ├── 09_ARCHIVED/
│   └── 10_DEPRECATED_FOR_DELETION/
│
└── MARK_FOR_DELETE/
    └── Temporary session/fix docs (ready for cleanup)
```

---

## 🔍 Module Documentation Map

| Module | Location | Purpose | Status |
|--------|----------|---------|--------|
| **Customers** | `src/modules/features/customers/DOC.md` | Customer lifecycle | ✅ 480 lines |
| **Sales** | `src/modules/features/sales/DOC.md` | Sales pipeline | ✅ 450 lines |
| **Tickets** | `src/modules/features/tickets/DOC.md` | Support tickets | ✅ 480 lines |
| **JobWorks** | `src/modules/features/jobworks/DOC.md` | Job scheduling | ✅ 450 lines |
| **Notifications** | `src/modules/features/notifications/DOC.md` | Alerts & messages | ✅ 420 lines |
| **User Mgmt** | `src/modules/features/user-management/DOC.md` | Users & roles | ✅ 400 lines |
| **Dashboard** | `src/modules/features/dashboard/DOC.md` | Analytics & KPIs | ✅ 380 lines |
| **Masters** | `src/modules/features/masters/DOC.md` | Products & companies | ✅ 420 lines |
| **Service Contracts** | `src/modules/features/service-contracts/DOC.md` | SLA & contracts | ✅ 430 lines |
| **Product Sales** | `src/modules/features/product-sales/DOC.md` | Sales transactions | ✅ 410 lines |
| **Audit Logs** | `src/modules/features/audit-logs/DOC.md` | Activity tracking | ✅ 380 lines |
| **Auth** | `src/modules/features/auth/DOC.md` | Login & sessions | ✅ 390 lines |
| **Complaints** | `src/modules/features/complaints/DOC.md` | Issue resolution | ✅ 380 lines |
| **Contracts** | `src/modules/features/contracts/DOC.md` | Master contracts | ✅ Existing |
| **Configuration** | `src/modules/features/configuration/DOC.md` | System config | ✅ Existing |
| **Super Admin** | `src/modules/features/super-admin/DOC.md` | Admin features | ✅ Existing |

---

## ⚡ Quick Lookups

### By Topic

**Authentication & Security**
```
- src/modules/features/auth/DOC.md
- docs/architecture/AUTHENTICATION.md
- docs/architecture/SESSION_MANAGEMENT.md
```

**State Management**
```
- .zencoder/rules/repo.md (Zustand section)
- src/modules/features/{module}/DOC.md (State Management section)
```

**API & Data Integration**
```
- .zencoder/rules/repo.md (Service Factory Pattern)
- src/modules/features/{module}/DOC.md (API/Hooks section)
```

**Database & Schema**
```
- .zencoder/rules/repo.md (Database Schema Requirements)
- DOCUMENTATION/05_SETUP_CONFIGURATION/Supabase/
```

**Permission & RBAC**
```
- docs/architecture/RBAC_AND_PERMISSIONS.md
- src/modules/features/user-management/DOC.md
- src/modules/features/{module}/DOC.md (RBAC section)
```

### By Problem

**Module not loading**
1. Check `VITE_API_MODE` in `.env`
2. Read service factory section in `.zencoder/rules/repo.md`
3. Check `src/modules/features/{module}/DOC.md` troubleshooting

**Permission denied**
1. Check user role in super-admin or user-management
2. Read RBAC section in module's DOC.md
3. Verify permissions in `src/config/navigationPermissions.ts`

**Data not showing**
1. Check service factory routing
2. Verify backend is running (mock or Supabase)
3. Check React Query hooks in module's DOC.md
4. Review troubleshooting section

**UI not rendering correctly**
1. Check Ant Design version in `package.json`
2. Review component props in module's DOC.md
3. Check Tailwind CSS setup in docs/

---

## 📋 Standardized Module DOC Structure

Every module's DOC.md contains (in order):

1. **Metadata** - Title, description, last updated, status
2. **Overview** - What the module does
3. **Module Structure** - Folder layout and files
4. **Key Features** - Main functionality list
5. **Architecture** - Component, state, and API layers
6. **Data Types** - TypeScript interfaces
7. **Integration Points** - Links to other modules
8. **RBAC & Permissions** - Access control rules
9. **Common Use Cases** - Code examples with snippets
10. **Troubleshooting** - Common issues and fixes
11. **Related Documentation** - Links to other docs
12. **Version Information** - Status and last updated

---

## 🔄 Module Integration Map

```
Dashboard (Core)
    ├─→ Customers
    ├─→ Sales
    ├─→ Tickets
    ├─→ JobWorks
    └─→ Notifications

Sales (Pipeline)
    ├─→ Customers
    ├─→ Contracts
    ├─→ Product Sales
    ├─→ Notifications
    └─→ Masters (pricing reference)

Customers (Core Entity)
    ├─→ Sales
    ├─→ Tickets
    ├─→ Contracts
    ├─→ Service Contracts
    ├─→ JobWorks
    └─→ Complaints

User Management (Access Control)
    ├─→ Super Admin
    ├─→ Audit Logs
    └─→ Notifications

Tickets (Support)
    ├─→ Customers
    ├─→ Notifications
    └─→ Audit Logs

JobWorks (Operations)
    ├─→ Customers
    ├─→ Sales
    ├─→ Service Contracts
    └─→ Notifications
```

---

## ✅ Enforcement Checklist

When contributing code that changes a module:

- [ ] Read `.zencoder/rules/documentation-sync.md`
- [ ] Update the module's DOC.md with your changes
- [ ] Add metadata header with `lastUpdated: YYYY-MM-DD`
- [ ] Include code examples if adding new features
- [ ] Update troubleshooting section if needed
- [ ] Link to related modules if applicable
- [ ] Run PR through documentation sync gate

---

## 🚀 Getting Help

### Can't find something?

1. **Check** `START_HERE_DOCUMENTATION.md`
2. **Search** in `.zencoder/rules/repo.md`
3. **Look up** module at `/src/modules/features/{module}/DOC.md`
4. **Review** `DOCUMENTATION_CONSOLIDATION_INDEX.md` for mapping

### Need a new module documented?

1. **Copy** structure from existing module's DOC.md
2. **Follow** template in `.zencoder/rules/documentation-sync.md`
3. **Include** all required sections
4. **Add** code examples and screenshots
5. **Link** to related modules
6. **Submit** PR for review

### Found outdated documentation?

1. **Update** the module's DOC.md
2. **Archive** old files to MARK_FOR_DELETE
3. **Update** cross-references
4. **Create** PR with "docs: update {module}"

---

## 📊 Documentation Statistics

- **Total Modules**: 16 ✅
- **Total DOC.md Files**: 16 ✅
- **Total Lines of Content**: 5,500+ ✅
- **Enforcement Rules**: Active ✅
- **Single Source of Truth**: Per module ✅

---

**Last Updated**: 2025-01-15  
**Status**: ✅ Production Ready  
**Next Phase**: Architecture documentation (Phase 2)