# Roles and Permissions Matrix - Complete Reference

## Overview
The application implements a comprehensive **Role-Based Access Control (RBAC)** system with **6 predefined roles**, **21 distinct permissions**, organized into **4 categories**. Each role has specific module/page access rights.

---

## 📋 Role Hierarchy

```
Customer (Level 0)
    ↓
Agent (Level 1)
    ↓
Engineer (Level 2)
    ↓
Manager (Level 3)
    ↓
Administrator (Level 4)
    ↓
Super Administrator (Level 5)
```

---

## 🎯 Detailed Roles & Their Access

### 1. **Super Administrator** 👑
**Role ID:** `super_admin_role`
**Tenant:** Platform (cross-tenant)
**Description:** Full platform administration with all permissions
**System Role:** Yes

#### Permissions (21/21 - ALL):
- ✅ read, write, delete
- ✅ manage_customers, manage_sales, manage_tickets, manage_complaints, manage_contracts, manage_service_contracts, manage_products, manage_product_sales, manage_job_works
- ✅ manage_users, manage_roles, view_analytics, manage_settings, manage_companies
- ✅ platform_admin, super_admin, manage_tenants, system_monitoring

#### Pages/Modules Accessible:
**Common Modules:**
- 📊 Dashboard
- 👥 Customers
- 💼 Sales
- 📦 Product Sales
- 📋 Contracts
- 🔧 Service Contracts
- 🎫 Support Tickets
- ⚠️ Complaints
- 🛠️ Job Works

**Administration Section:**
- 🏢 Masters (Companies, Products)
- 👤 User Management (Users, Roles, Permissions)
- ⚙️ Configuration (Tenant Settings, PDF Templates)
- 🔔 Notifications
- 📋 System Logs

**Super Admin Exclusive Section:**
- 📊 Super Admin Dashboard
- 🌐 Tenants Management
- 👥 All Users Management
- 📈 Analytics
- 💚 System Health
- ⚙️ Configuration (Platform-wide)
- 📋 Role Requests

---

### 2. **Administrator** 🔐
**Role ID:** `admin_role`
**Tenant:** Specific Tenant (techcorp)
**Description:** Tenant administrator with full tenant permissions
**System Role:** Yes

#### Permissions (18/21):
- ✅ read, write, delete
- ✅ manage_customers, manage_sales, manage_tickets, manage_complaints, manage_contracts, manage_service_contracts, manage_products, manage_product_sales, manage_job_works
- ✅ manage_users, manage_roles, view_analytics, manage_settings, manage_companies
- ❌ platform_admin, manage_tenants, system_monitoring (Super Admin only)

#### Pages/Modules Accessible:
**Common Modules:**
- 📊 Dashboard
- 👥 Customers
- 💼 Sales
- 📦 Product Sales
- 📋 Contracts
- 🔧 Service Contracts
- 🎫 Support Tickets
- ⚠️ Complaints
- 🛠️ Job Works

**Administration Section (Full Access):**
- 🏢 Masters
  - Companies
  - Products
- 👤 User Management
  - Users
  - Roles
  - Permissions
- ⚙️ Configuration
  - Tenant Settings
  - PDF Templates
- 🔔 Notifications
- 📋 System Logs

---

### 3. **Manager** 📊
**Role ID:** `manager_role`
**Tenant:** Specific Tenant (techcorp)
**Description:** Business operations manager with analytics access
**System Role:** Yes

#### Permissions (11/21):
- ✅ read, write
- ✅ manage_customers, manage_sales, manage_tickets, manage_complaints, manage_contracts, manage_service_contracts, manage_products, manage_product_sales
- ✅ view_analytics
- ❌ delete, manage_users, manage_roles, manage_settings, manage_companies, platform_admin, super_admin, manage_tenants, system_monitoring

#### Pages/Modules Accessible:
**Common Modules (Read/Write):**
- 📊 Dashboard
- 👥 Customers (Full CRM access)
- 💼 Sales (Full sales management)
- 📦 Product Sales
- 📋 Contracts
- 🔧 Service Contracts
- 🎫 Support Tickets (Complaint management)
- ⚠️ Complaints
- 📈 View Analytics

**NOT Accessible:**
- ❌ Administration Section
- ❌ Super Admin Section
- ❌ Job Works
- ❌ User Management
- ❌ System Logs

---

### 4. **Agent** 🎫
**Role ID:** `agent_role`
**Tenant:** Specific Tenant (techcorp)
**Description:** Customer service agent with basic operations
**System Role:** Yes

#### Permissions (5/21):
- ✅ read, write
- ✅ manage_customers, manage_tickets, manage_complaints
- ❌ delete + all others

#### Pages/Modules Accessible:
**Limited Common Modules:**
- 📊 Dashboard (Read-only)
- 👥 Customers (Limited - customer service focused)
- 🎫 Support Tickets (Full management)
- ⚠️ Complaints (Full management)

**NOT Accessible:**
- ❌ Sales
- ❌ Product Sales
- ❌ Contracts
- ❌ Service Contracts
- ❌ Job Works
- ❌ Administration Section
- ❌ Super Admin Section
- ❌ Analytics

---

### 5. **Engineer** 🛠️
**Role ID:** `engineer_role`
**Tenant:** Specific Tenant (techcorp)
**Description:** Technical engineer with product and job work access
**System Role:** Yes

#### Permissions (6/21):
- ✅ read, write
- ✅ manage_products, manage_product_sales, manage_job_works, manage_tickets
- ❌ delete + all others

#### Pages/Modules Accessible:
**Technical Modules:**
- 📊 Dashboard (Read-only)
- 📦 Product Sales (Full management)
- 🛠️ Job Works (Full management - primary access)
- 🎫 Support Tickets (Incident tracking)
- 📦 Products (Technical product info)

**NOT Accessible:**
- ❌ Customers (Full CRM)
- ❌ Sales
- ❌ Contracts
- ❌ Service Contracts
- ❌ Complaints
- ❌ Administration Section
- ❌ Super Admin Section

---

### 6. **Customer** 👥
**Role ID:** `customer_role`
**Tenant:** Specific Tenant (techcorp)
**Description:** Customer with read-only access to own data
**System Role:** Yes

#### Permissions (1/21):
- ✅ read (only)
- ❌ write, delete + all others

#### Pages/Modules Accessible:
**Read-Only Access:**
- 📊 Dashboard (View-only - summary metrics)
- 👥 Profile/Account (View own information)

**NOT Accessible:**
- ❌ All modification features
- ❌ Administration Section
- ❌ Super Admin Section
- ❌ Sales, Contracts, Tickets (unless owner)

---

## 🔐 Permissions Reference

### Core Permissions (3)
| Permission | ID | Description |
|------------|-----|-------------|
| Read | `read` | View and read data |
| Write | `write` | Create and edit data |
| Delete | `delete` | Delete data |

### Module Permissions (9)
| Permission | ID | Module | Description |
|------------|-----|--------|-------------|
| Manage Customers | `manage_customers` | Customers | Manage customer data and relationships |
| Manage Sales | `manage_sales` | Sales | Manage sales processes and deals |
| Manage Tickets | `manage_tickets` | Support Tickets | Manage support tickets and issues |
| Manage Complaints | `manage_complaints` | Complaints | Handle customer complaints |
| Manage Contracts | `manage_contracts` | Contracts | Manage service contracts and agreements |
| Manage Service Contracts | `manage_service_contracts` | Service Contracts | Manage service contracts |
| Manage Products | `manage_products` | Products | Manage product catalog and inventory |
| Manage Product Sales | `manage_product_sales` | Product Sales | Manage product sales and transactions |
| Manage Job Works | `manage_job_works` | Job Works | Manage job work orders and tasks |

### Administrative Permissions (5)
| Permission | ID | Description |
|------------|-----|-------------|
| Manage Users | `manage_users` | Manage user accounts and access |
| Manage Roles | `manage_roles` | Manage roles and permissions |
| View Analytics | `view_analytics` | Access analytics and reports |
| Manage Settings | `manage_settings` | Configure system settings |
| Manage Companies | `manage_companies` | Manage company information |

### System Permissions (4)
| Permission | ID | Description |
|------------|-----|-------------|
| Platform Admin | `platform_admin` | Platform administration access |
| Super Admin | `super_admin` | Full system administration |
| Manage Tenants | `manage_tenants` | Manage tenant accounts |
| System Monitoring | `system_monitoring` | Monitor system health and performance |

---

## 📊 Role Comparison Matrix

| Feature | Customer | Agent | Engineer | Manager | Admin | Super Admin |
|---------|----------|-------|----------|---------|-------|------------|
| **Read** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Write** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Delete** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Customers** | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Sales** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Tickets** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Complaints** | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Contracts** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Service Contracts** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Products** | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Product Sales** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Job Works** | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Analytics** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **User Management** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Administration** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Super Admin** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Tenants** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🚀 Navigation Access Overview

### Section 1: COMMON ITEMS (All Authenticated Users)
These items appear for everyone who has permission:
- Dashboard
- Customers
- Sales
- Product Sales
- Contracts
- Service Contracts
- Support Tickets
- Complaints
- Job Works

### Section 2: ADMINISTRATION (Admin & Super Admin only)
Only visible to users with `admin` or `super_admin` role:
- **Masters**
  - Companies
  - Products
- **User Management**
  - Users
  - Roles
  - Permissions
- **Configuration**
  - Tenant Settings
  - PDF Templates
- **Notifications**
- **System Logs**

### Section 3: SUPER ADMIN (Super Admin only)
Only visible to `super_admin` role:
- **Super Admin Dashboard**
- **Tenants Management**
- **All Users Management**
- **Analytics (Platform-wide)**
- **System Health**
- **Configuration (Platform)**
- **Role Requests**

---

## 💡 Key Features

### Multi-Tenant Support
- Roles can be configured per tenant
- Super Admin manages all tenants
- Admin manages tenant-specific roles
- Regular users see only their tenant data

### Dynamic Navigation Filtering
- Navigation items automatically hide based on user's role
- Section headers (Administration, Super Admin) only show if user has access to any child items
- Permission-based field-level access control

### Audit Logging
All role assignments and permission grants are logged with:
- User ID who performed the action
- Timestamp
- IP address
- User agent
- Tenant ID

---

## 🔧 Implementation Files

| File | Purpose |
|------|---------|
| `src/services/rbacService.ts` | Role and permission management service |
| `src/config/navigationPermissions.ts` | Navigation structure with permission mappings |
| `src/utils/navigationFilter.ts` | Permission-based filtering logic |
| `src/components/layout/EnterpriseLayout.tsx` | Layout with permission-based nav |
| `src/hooks/usePermissionBasedNavigation.ts` | Hook for permission checking |

---

## 📝 How to Modify Roles

### Adding a New Permission
1. Update `src/services/rbacService.ts` - Add to `mockPermissions` array
2. Update `src/config/navigationPermissions.ts` - Add to appropriate category

### Creating a New Role
1. Update `src/services/rbacService.ts` - Add to `mockRoles` array with permissions
2. Update `src/config/navigationPermissions.ts` - Update `roleHierarchy` if needed
3. Update navigation config - Set `requiredRole` for navigation items

### Changing Role Permissions
Edit the `permissions` array in the role object in `src/services/rbacService.ts`

---

## 🎓 Usage Example

```typescript
// Get current user's permissions
import { useAuth } from '@/contexts/AuthContext';
import { userService as factoryUserService } from '@/services/serviceFactory';

function MyComponent() {
  const { user } = useAuth();
  
  // User role determines access
  // Customer → read-only
  // Agent → tickets and complaints
  // Engineer → products and job works
  // Manager → full operations + analytics
  // Admin → everything + user management
  // Super Admin → platform control
}
```

---

**Last Updated:** 2024
**Configuration Location:** `src/services/rbacService.ts`, `src/config/navigationPermissions.ts`
**Status:** ✅ Complete and Production-Ready