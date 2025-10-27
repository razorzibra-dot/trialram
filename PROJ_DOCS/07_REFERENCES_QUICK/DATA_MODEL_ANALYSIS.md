# Data Model Analysis and Issues

## Critical Issues Identified

### 1. **Customer Model Duplication and Inconsistency**

**Problem**: Multiple conflicting Customer types exist:
- `src/types/crm.ts` - Customer interface
- `src/types/masters.ts` - CustomerMaster interface  
- Backend: `Customer.cs` entity

**Issues**:
- Different field names: `company_name` vs `companyName` vs `CompanyName`
- Inconsistent relationships: Some use `company_id`, others don't
- Different status enums: `prospect/active/inactive` vs `active/inactive/prospect/suspended`
- ID types: string vs int inconsistency

### 2. **Product Model Fragmentation**

**Problem**: Product definitions scattered across modules:
- `src/types/masters.ts` - Product interface (comprehensive)
- `backend/Sales/Product.cs` - Backend entity (different structure)
- Form schemas use different validation rules

**Issues**:
- Price vs CostPrice vs cost field naming
- Stock management fields missing in frontend
- Category vs Brand field inconsistencies
- Service vs Product type handling

### 3. **User Model Conflicts**

**Problem**: Multiple User types with different structures:
- `src/types/auth.ts` - User interface (6 roles)
- `src/types/crm.ts` - User interface (3 roles)
- Backend: `User.cs` entity (different fields)

**Issues**:
- Role definitions don't match: `super_admin/admin/manager` vs `Admin/Manager/Viewer`
- Field naming: `firstName/lastName` vs `FirstName/LastName`
- Tenant relationship inconsistencies

### 4. **Sales/Deal Model Confusion**

**Problem**: Sales and Deal terms used interchangeably:
- Backend uses `Sale` entity
- Frontend sometimes calls them `Deal`
- Stage mappings are inconsistent

**Issues**:
- Stage names don't align: `prospect/qualified` vs `lead/qualified`
- Amount vs Value field naming
- Customer relationship: `CustomerId` (int) vs `customer_id` (string)

### 5. **Ticket Model Misalignment**

**Problem**: Frontend and backend Ticket models have different structures:
- Backend: `CustomerId` (int, nullable)
- Frontend: `customer_id` (string, required)
- Assignment logic differs

### 6. **Contract Relationship Issues**

**Problem**: Contract-Customer relationships are unclear:
- Contracts have `parties` array but also customer references
- Template system not properly integrated
- Approval workflow disconnected

### 7. **JobWork Integration Problems**

**Problem**: JobWork module not properly integrated:
- References Customer and Product by string IDs
- No backend entity exists
- Pricing calculation logic isolated
- Engineer assignment not linked to User system

### 8. **Form-Model Mismatches**

**Problem**: Form components use different data structures than their corresponding types:
- Validation schemas don't match type definitions
- Field mappings are inconsistent
- Default values don't align with backend requirements

## Relationship Issues

### 1. **Foreign Key Inconsistencies**
- Backend uses `int` IDs, frontend uses `string` IDs
- Some relationships are optional in backend but required in frontend
- Cascade delete behavior not defined

### 2. **Tenant Isolation**
- Not all entities properly implement tenant isolation
- Some use `TenantId`, others use `tenant_id`
- Filtering logic inconsistent

### 3. **Audit Trail Gaps**
- Some entities inherit from `AuditableEntity`, others from `BaseEntity`
- Created/Updated by fields not consistently populated
- Soft delete implementation varies

## Data Flow Problems

### 1. **Service Layer Mappings**
- Mappers in `src/services/index.ts` have hardcoded transformations
- Stage mappings are incomplete
- Error handling for missing relationships

### 2. **API Response Inconsistencies**
- Backend DTOs don't match frontend interfaces
- Nested object structures differ
- Pagination and filtering parameters misaligned

## Impact Assessment

### High Priority Issues:
1. **Customer Model Duplication** - Affects all modules
2. **User Role Conflicts** - Breaks authentication/authorization
3. **ID Type Mismatches** - Causes relationship failures
4. **Sales/Deal Confusion** - Impacts core business logic

### Medium Priority Issues:
1. **Product Model Fragmentation** - Affects inventory and sales
2. **Ticket Model Misalignment** - Impacts customer service
3. **Contract Relationships** - Affects legal/compliance features

### Low Priority Issues:
1. **JobWork Integration** - Isolated module
2. **Form Validation Mismatches** - UX impact only

## Recommended Solutions

### Phase 1: Core Model Standardization
1. Create unified Customer model
2. Standardize User models and roles
3. Fix ID type consistency (string vs int)
4. Align Sales/Deal terminology

### Phase 2: Relationship Fixes
1. Implement proper foreign key relationships
2. Standardize tenant isolation
3. Fix audit trail implementation
4. Update service layer mappings

### Phase 3: Integration and Testing
1. Integrate JobWork with core models
2. Update all form components
3. Create comprehensive relationship tests
4. Validate data flow end-to-end

## Next Steps

1. **Immediate**: Start with Customer model unification
2. **Short-term**: Fix User and Sales model conflicts  
3. **Medium-term**: Standardize all relationships and forms
4. **Long-term**: Implement comprehensive testing and validation

This analysis provides the foundation for systematic data model correction and relationship standardization across the entire CRM application.
