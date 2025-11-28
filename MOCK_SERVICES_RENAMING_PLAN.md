# Mock Services Renaming Plan

## Overview
All mock services need to be renamed to have "Mock" prefix in their class names and "mock" prefix in their export names to clearly identify them as mock services.

## Completed ✅
1. ✅ `AuthService` → `MockAuthService`, `authService` → `mockAuthService`
2. ✅ `CustomerService` → `MockCustomerService`, `customerService` → `mockCustomerService`
3. ✅ `RBACService` → `MockRBACService`, `rbacService` → `mockRbacService`

## Remaining Services to Rename

### High Priority (Most Used)
1. `UserService` → `MockUserService`, `userService` → `mockUserService`
2. `SalesService` → `MockSalesService`, `salesService` → `mockSalesService`
3. `LeadsService` → `MockLeadsService`, `leadsService` → `mockLeadsService`
4. `TicketService` → `MockTicketService`, `ticketService` → `mockTicketService`
5. `CompanyService` → `MockCompanyService`, `companyService` → `mockCompanyService`
6. `ProductService` → `MockProductService`, `productService` → `mockProductService`
7. `JobWorkService` → `MockJobWorkService`, `jobWorkService` → `mockJobWorkService`
8. `ContractService` → `MockContractService`, `contractService` → `mockContractService`
9. `ComplaintService` → `MockComplaintService`, `complaintService` → `mockComplaintService`
10. `TenantService` → `MockTenantService`, `tenantService` → `mockTenantService`
11. `NotificationService` → `MockNotificationService`, `notificationService` → `mockNotificationService`
12. `SuperAdminService` → `MockSuperAdminService`, `superAdminService` → `mockSuperAdminService`
13. `SuperAdminManagementService` → `MockSuperAdminManagementService`, `superAdminManagementService` → `mockSuperAdminManagementService`
14. `AuditService` → `MockAuditService`, `auditService` → `mockAuditService`

### Medium Priority
15. `ServiceContractService` → `MockServiceContractService`, `mockServiceContractService` (already has mock prefix in export)
16. `ProductSaleService` → `MockProductSaleService`, `productSaleService` → `mockProductSaleService`
17. `OpportunityService` → `MockOpportunityService`, `opportunityService` → `mockOpportunityService`
18. `PurchaseOrderService` → `MockPurchaseOrderService`, `purchaseOrderService` → `mockPurchaseOrderService`
19. `NavigationService` → `MockNavigationService`, `navigationService` → `mockNavigationService`
20. `ProductCategoryService` → `MockProductCategoryService`, `productCategoryService` → `mockProductCategoryService`
21. `RoleRequestService` → `MockRoleRequestService`, `mockRoleRequestService` (already has mock prefix)
22. `RateLimitService` → `MockRateLimitService`, `mockRateLimitService` (already has mock prefix)
23. `ReferenceDataService` → `MockReferenceDataService`, `mockReferenceDataService` (already has mock prefix)
24. `ComplianceNotificationService` → `MockComplianceNotificationService`, `mockComplianceNotificationService` (already has mock prefix)
25. `TicketCommentService` → `MockTicketCommentService`, `ticketCommentService` → `mockTicketCommentService`
26. `TicketAttachmentService` → `MockTicketAttachmentService`, `ticketAttachmentService` → `mockTicketAttachmentService`
27. `UINotificationService` → `MockUINotificationService`, `uiNotificationService` → `mockUINotificationService`
28. `SessionConfigService` → `MockSessionConfigService`, `sessionConfigService` → `mockSessionConfigService`
29. `SalesActivityService` → `MockSalesActivityService`, `mockSalesActivityService` (already has mock prefix)
30. `ReferenceDataLoader` → `MockReferenceDataLoader`, `mockReferenceDataLoader` (already has mock prefix)

## Files Already Correctly Named
- `deals/mock/dealsService.ts` - Already has `MockDealsService` and `mockDealsService`
- `sales-activities/mock/salesActivityService.ts` - Already has `MockSalesActivityService` and `mockSalesActivityService`
- `productsale/mock/productSaleService.ts` - Check if already has Mock prefix
- `productcategory/mock/productCategoryService.ts` - Check if already has Mock prefix

## Steps for Each Service
1. Rename class: `class ServiceName` → `class MockServiceName`
2. Rename export: `export const serviceName = new ServiceName()` → `export const mockServiceName = new MockServiceName()`
3. Update serviceFactory.ts import: Remove alias if present, use direct import
4. Check for direct imports in codebase and update if needed

## ServiceFactory.ts Updates Needed
Update all imports from:
```typescript
import { serviceName as mockServiceName } from './path/serviceName';
```
To:
```typescript
import { mockServiceName } from './path/serviceName';
```

## Testing Checklist
- [ ] All services compile without errors
- [ ] ServiceFactory correctly routes to mock services
- [ ] No direct imports of old service names exist
- [ ] All tests pass
- [ ] Application runs correctly in mock mode

