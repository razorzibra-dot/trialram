# 🔒 Smart Constraint Explanation: Tenant Independence with Data Integrity

## The Problem We Solved

Regular users MUST always have a `tenant_id` (they belong to a specific tenant).  
Super users should NEVER have a `tenant_id` (they manage all tenants).

**Without the constraint:** You could accidentally create invalid data like:
- Regular user with `tenant_id = NULL` ❌ INVALID
- Super user with `tenant_id = UUID` ❌ INCONSISTENT

**With the constraint:** The database enforces the rules automatically!

---

## The Constraint

```sql
ALTER TABLE users
ADD CONSTRAINT ck_tenant_id_for_regular_users
  CHECK (is_super_admin = true OR tenant_id IS NOT NULL);
```

### Breaking Down the Logic

The constraint uses a logical OR (`OR`):

```
is_super_admin = true  OR  tenant_id IS NOT NULL
      ↓                         ↓
  Super user?           Has a tenant?
     (OK)                    (OK)
```

**Translation:** "Allow this row if EITHER super admin is true OR tenant_id is not null (or both)"

---

## Truth Table: When Inserts Succeed ✅

| is_super_admin | tenant_id | Allowed? | Why |
|---|---|---|---|
| true | NULL | ✅ YES | First condition true (is_super_admin = true) |
| true | UUID | ✅ YES | Both conditions true (doesn't matter, at least one is true) |
| false | UUID | ✅ YES | Second condition true (tenant_id IS NOT NULL) |
| false | NULL | ❌ NO | Both conditions false (violates constraint) |

### Real Examples

#### ✅ VALID: Super Admin with NULL Tenant
```sql
INSERT INTO users (email, name, is_super_admin, tenant_id) 
VALUES ('admin@acme.com', 'Admin Acme', true, NULL);
-- Succeeds because: is_super_admin = true ✅
```

#### ✅ VALID: Regular User with UUID Tenant
```sql
INSERT INTO users (email, name, is_super_admin, tenant_id) 
VALUES ('manager@acme.com', 'Manager', false, '550e8400-...');
-- Succeeds because: tenant_id IS NOT NULL ✅
```

#### ❌ INVALID: Regular User without Tenant
```sql
INSERT INTO users (email, name, is_super_admin, tenant_id) 
VALUES ('broken@acme.com', 'Broken User', false, NULL);
-- FAILS with: new row for relation "users" violates check constraint "ck_tenant_id_for_regular_users"
-- Both conditions false: is_super_admin=false AND tenant_id=NULL ❌
```

#### ❌ INVALID: Update Violates Constraint
```sql
UPDATE users 
SET tenant_id = NULL 
WHERE email = 'manager@acme.com' AND is_super_admin = false;
-- FAILS: Would violate constraint (is_super_admin=false AND tenant_id would be NULL)
```

---

## The Unique Indexes: Smart Uniqueness

### Index 1: For Super Admins (Globally Unique)

```sql
CREATE UNIQUE INDEX idx_unique_super_admin_email 
  ON users(email) 
  WHERE is_super_admin = true;
```

**What It Does:** Ensures only ONE super admin with each email exists platform-wide.

**Examples:**
```
Platform Data:
┌─────────────────────────────────────┐
│ Email             │ is_super_admin  │
├─────────────────────────────────────┤
│ admin@acme.com    │ true            │ ✅ Allowed
│ admin@acme.com    │ true            │ ❌ DUPLICATE - Would violate unique index!
│ admin@acme.com    │ false           │ ✅ Allowed (different is_super_admin value)
└─────────────────────────────────────┘
```

---

### Index 2: For Regular Users (Per-Tenant Unique)

```sql
CREATE UNIQUE INDEX idx_unique_email_per_tenant 
  ON users(email, tenant_id) 
  WHERE is_super_admin = false AND tenant_id IS NOT NULL;
```

**What It Does:** Ensures email is unique ONLY within each tenant (allows same email across tenants).

**Examples:**
```
Acme Tenant (550e8400-...):
┌──────────────────────────────────────────────┐
│ Email         │ tenant_id     │ is_super_admin│
├──────────────────────────────────────────────┤
│ admin@acme.com│ acme_uuid     │ false         │ ✅ Allowed
│ admin@acme.com│ acme_uuid     │ false         │ ❌ DUPLICATE in same tenant!
└──────────────────────────────────────────────┘

Tech Solutions Tenant (550e8400-...):
┌──────────────────────────────────────────────┐
│ Email         │ tenant_id         │ is_super_admin│
├──────────────────────────────────────────────┤
│ admin@acme.com│ tech_solutions_uuid│ false        │ ✅ ALLOWED! Different tenant
└──────────────────────────────────────────────┘
```

**Why This Matters:**
- Organization A can hire "john@example.com" as an admin
- Organization B (different tenant) can ALSO hire "john@example.com" as an admin
- Both are allowed because they're in different tenants
- But super admin emails must be globally unique (no duplicates platform-wide)

---

## Constraint Enforcement Scenarios

### Scenario 1: Creating a New Super Admin ✅

```sql
INSERT INTO users (id, email, name, is_super_admin, tenant_id, role, status)
VALUES (uuid(), 'superadmin@platform.com', 'Platform Admin', true, NULL, 'admin', 'active');

-- Result: ✅ ALLOWED
-- Constraint check: is_super_admin=true OR tenant_id IS NOT NULL
--   → true OR (NULL IS NOT NULL) 
--   → true OR false
--   → TRUE ✅

-- Unique index check: idx_unique_super_admin_email
--   → Only one email 'superadmin@platform.com' with is_super_admin=true ✅
```

---

### Scenario 2: Creating Regular Tenant User ✅

```sql
INSERT INTO users (id, email, name, is_super_admin, tenant_id, role, status)
VALUES (uuid(), 'user@example.com', 'Regular User', false, 'acme_uuid', 'agent', 'active');

-- Result: ✅ ALLOWED
-- Constraint check: is_super_admin=true OR tenant_id IS NOT NULL
--   → false OR (acme_uuid IS NOT NULL)
--   → false OR true
--   → TRUE ✅

-- Unique index check: idx_unique_email_per_tenant
--   → Only one 'user@example.com' in 'acme_uuid' tenant ✅
```

---

### Scenario 3: Creating Same User in Different Tenant ✅

```sql
INSERT INTO users (id, email, name, is_super_admin, tenant_id, role, status)
VALUES (uuid(), 'user@example.com', 'Same User', false, 'tech_uuid', 'agent', 'active');

-- Result: ✅ ALLOWED (different tenant!)
-- Constraint check: is_super_admin=true OR tenant_id IS NOT NULL
--   → false OR (tech_uuid IS NOT NULL)
--   → false OR true
--   → TRUE ✅

-- Unique index check: idx_unique_email_per_tenant
--   → 'user@example.com' + 'acme_uuid' exists (different tenant_id, so allowed!)
--   → 'user@example.com' + 'tech_uuid' doesn't exist yet
--   → Allowed! ✅
```

---

### Scenario 4: Attempted Invalid Update ❌

```sql
UPDATE users 
SET tenant_id = NULL 
WHERE email = 'manager@acme.com' AND is_super_admin = false;

-- Result: ❌ REJECTED
-- Constraint check would fail: is_super_admin=true OR tenant_id IS NOT NULL
--   → false OR (NULL IS NOT NULL)
--   → false OR false
--   → FALSE ❌
-- ERROR: new row for relation "users" violates check constraint "ck_tenant_id_for_regular_users"
```

---

### Scenario 5: Attempted Invalid Insert ❌

```sql
INSERT INTO users (email, name, is_super_admin, tenant_id, role, status)
VALUES ('orphan@platform.com', 'Orphan User', false, NULL, 'agent', 'active');

-- Result: ❌ REJECTED
-- Constraint check: is_super_admin=true OR tenant_id IS NOT NULL
--   → false OR (NULL IS NOT NULL)
--   → false OR false
--   → FALSE ❌
-- ERROR: new row for relation "users" violates check constraint "ck_tenant_id_for_regular_users"
```

---

## How It Protects Your Data

### Protection 1: Prevents Orphaned Users ✅
```
Without Constraint: You could create a user with no tenant (orphaned)
With Constraint:    Database refuses to create such user
```

### Protection 2: Prevents Mixed States ✅
```
Without Constraint: Super user could have a primary tenant (confusing)
With Constraint:    Super users MUST have NULL tenant_id
```

### Protection 3: Enforces Email Uniqueness Rules ✅
```
Without Constraint: Must manually check uniqueness in application code
With Constraint:    Database enforces per-tenant uniqueness automatically
```

### Protection 4: Catches Development Errors ✅
```
Without Constraint: Bugs silently create invalid data (caught in production)
With Constraint:    Database catches errors immediately during development
```

---

## The Complete Picture

```
Users Table with Constraint
├─ Super User Record
│  ├─ email: admin@platform.com (globally unique)
│  ├─ is_super_admin: true
│  ├─ tenant_id: NULL ← Constraint enforced via CHECK
│  └─ Unique Index: idx_unique_super_admin_email
│
├─ Regular User Record 1
│  ├─ email: john@example.com (unique per tenant)
│  ├─ is_super_admin: false
│  ├─ tenant_id: acme_uuid ← Constraint enforced via CHECK
│  └─ Unique Index: idx_unique_email_per_tenant + acme_uuid
│
├─ Regular User Record 2 (SAME EMAIL, DIFFERENT TENANT) ✅
│  ├─ email: john@example.com (same as above, but allowed!)
│  ├─ is_super_admin: false
│  ├─ tenant_id: tech_uuid ← Different tenant, so allowed!
│  └─ Unique Index: idx_unique_email_per_tenant + tech_uuid
│
└─ Invalid Record (REJECTED) ❌
   ├─ email: orphan@example.com
   ├─ is_super_admin: false
   ├─ tenant_id: NULL
   └─ Constraint Violation: (false OR NULL IS NOT NULL) = FALSE ❌
```

---

## Summary

| Feature | Without | With |
|---------|---------|------|
| Regular user without tenant | ❌ Possible (bug) | ✅ Impossible (enforced) |
| Super admin with tenant | ❌ Confusing | ✅ Prevented |
| Same email in 2 tenants | ❌ Requires app code | ✅ Automatically allowed |
| Data integrity | ❌ Application responsible | ✅ Database enforced |
| Error detection | ❌ Late (production) | ✅ Early (development) |

The constraint is your **data integrity guardian** 🛡️