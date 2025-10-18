# Phase 3: Quick Reference Guide

## 🚀 Quick Start

### 1. Initialize Supabase
```typescript
import { initializeSupabase } from '@/services/supabase/client';

initializeSupabase();
console.log('✅ Ready to use services');
```

### 2. Import Services
```typescript
import {
  supabaseAuthService,
  supabaseCustomerService,
  supabasesSalesService,
  supabaseTicketService,
  supabaseContractService,
  supabaseProductService,
  supabaseCompanyService,
  supabaseNotificationService
} from '@/services/supabase';
```

---

## 📋 Service Cheat Sheet

### AuthService
```typescript
// Login
const auth = await supabaseAuthService.login('user@email.com', 'password');

// Get current user
const user = await supabaseAuthService.getCurrentUser();

// Logout
await supabaseAuthService.logout();

// Update profile
await supabaseAuthService.updateProfile(userId, { firstName: 'John' });

// List users
const users = await supabaseAuthService.getAllUsers();

// Get users by role
const admins = await supabaseAuthService.getUsersByRole('admin');
```

### CustomerService
```typescript
// List customers
const customers = await supabaseCustomerService.getCustomers({ status: 'active' });

// Get single customer
const customer = await supabaseCustomerService.getCustomer(id);

// Create customer
const newCustomer = await supabaseCustomerService.createCustomer({
  company_name: 'Acme Corp',
  contact_name: 'John Doe',
  email: 'john@acme.com'
});

// Update customer
await supabaseCustomerService.updateCustomer(id, { status: 'inactive' });

// Search customers
const results = await supabaseCustomerService.searchCustomers('Acme', tenantId);

// Get statistics
const stats = await supabaseCustomerService.getCustomerStats(tenantId);

// Real-time subscription
const unsub = supabaseCustomerService.subscribeToCustomers(tenantId, (payload) => {
  console.log('Customer changed:', payload);
});
```

### SalesService
```typescript
// List sales
const sales = await supabasesSalesService.getSales({ status: 'open' });

// Get single sale
const sale = await supabasesSalesService.getSale(id);

// Create sale
const newSale = await supabasesSalesService.createSale({
  title: 'Enterprise Deal',
  customer_id: customerId,
  value: 50000,
  probability: 70,
  stage: 'proposal'
});

// Update sale
await supabasesSalesService.updateSale(id, { stage: 'negotiation' });

// Get pipeline view
const byStage = await supabasesSalesService.getSalesByStage(tenantId);
// Returns: { lead: [], qualified: [], proposal: [], ... }

// Get KPIs
const stats = await supabasesSalesService.getSalesStats(tenantId);
// Returns: { total, totalValue, avgValue, byStage, closedWon, closedLost, conversionRate }

// Move deal through pipeline
await supabasesSalesService.updateStage(id, 'closed_won', 'Won!');
```

### TicketService
```typescript
// List tickets
const tickets = await supabaseTicketService.getTickets({ status: 'open' });

// Get single ticket
const ticket = await supabaseTicketService.getTicket(id);

// Create ticket
const newTicket = await supabaseTicketService.createTicket({
  title: 'Login Issue',
  description: 'Cannot access',
  customer_id: customerId,
  priority: 'high'
});

// Update ticket
await supabaseTicketService.updateTicket(id, { status: 'resolved' });

// Add comment
await supabaseTicketService.addComment(ticketId, 'Fixed now', userId);

// Upload attachment
const file = new File(['content'], 'file.pdf');
await supabaseTicketService.uploadAttachment(ticketId, file, userId);

// Get statistics
const stats = await supabaseTicketService.getTicketStats(tenantId);
// Returns: { total, open, closed, avgResolutionTime, slaBreach, byPriority, byStatus }
```

### ContractService
```typescript
// List contracts
const contracts = await supabaseContractService.getContracts({ status: 'active' });

// Get single contract
const contract = await supabaseContractService.getContract(id);

// Create contract
const newContract = await supabaseContractService.createContract({
  title: 'Service Agreement',
  customer_id: customerId,
  value: 10000,
  status: 'draft'
});

// Update contract
await supabaseContractService.updateContract(id, { status: 'active' });

// Get expiring soon (30 days)
const expiring = await supabaseContractService.getExpiringContracts(tenantId, 30);

// Request approval
const approval = await supabaseContractService.requestApproval(contractId, approverId);

// Approve contract
await supabaseContractService.approveContract(approvalId);

// Reject contract
await supabaseContractService.rejectContract(approvalId, 'Needs revision');

// Get statistics
const stats = await supabaseContractService.getContractStats(tenantId);
// Returns: { total, active, expiring, totalValue, byStatus, byType }
```

### ProductService
```typescript
// List products
const products = await supabaseProductService.getProducts({ status: 'active' });

// Get single product
const product = await supabaseProductService.getProduct(id);

// Create product
const newProduct = await supabaseProductService.createProduct({
  name: 'Widget',
  sku: 'WGT-001',
  price: 99.99,
  stock_quantity: 100
});

// Update product
await supabaseProductService.updateProduct(id, { price: 89.99 });

// Search products
const results = await supabaseProductService.searchProducts('Widget', tenantId);

// Get low stock products
const lowStock = await supabaseProductService.getLowStockProducts(tenantId);

// Update stock
await supabaseProductService.updateStock(id, 10, 'add'); // add 10
await supabaseProductService.updateStock(id, 5, 'subtract'); // remove 5
await supabaseProductService.updateStock(id, 50, 'set'); // set to 50

// Get statistics
const stats = await supabaseProductService.getProductStats(tenantId);
// Returns: { total, active, discontinued, totalInventoryValue, averagePrice }
```

### CompanyService
```typescript
// List companies
const companies = await supabaseCompanyService.getCompanies({ status: 'active' });

// Get single company
const company = await supabaseCompanyService.getCompany(id);

// Get company by domain
const company = await supabaseCompanyService.getCompanyByDomain('acme.com');

// Create company
const newCompany = await supabaseCompanyService.createCompany({
  name: 'Acme Corporation',
  domain: 'acme.com',
  plan: 'enterprise'
});

// Update company
await supabaseCompanyService.updateCompany(id, { status: 'inactive' });

// Search companies
const results = await supabaseCompanyService.searchCompanies('Acme');

// Update subscription
await supabaseCompanyService.updateSubscription(id, 'pro', 'active');

// Get statistics
const stats = await supabaseCompanyService.getCompanyStats();
// Returns: { total, active, suspended, byPlan, byStatus }
```

### NotificationService
```typescript
// List notifications
const notifs = await supabaseNotificationService.getNotifications({ userId });

// Get unread only
const unread = await supabaseNotificationService.getUnreadNotifications(userId);

// Create notification
await supabaseNotificationService.createNotification({
  user_id: userId,
  type: 'success',
  title: 'Done!',
  message: 'Your contract was approved',
  action_url: '/contracts/123'
});

// Create batch
await supabaseNotificationService.createNotifications([
  { user_id: user1, type: 'info', title: 'Notification 1' },
  { user_id: user2, type: 'warning', title: 'Notification 2' }
]);

// Mark as read
await supabaseNotificationService.markAsRead(notificationId);

// Mark all as read
await supabaseNotificationService.markAllAsRead(userId);

// Delete notification
await supabaseNotificationService.deleteNotification(id);

// Clear all
await supabaseNotificationService.clearAllNotifications(userId);

// Get preferences
const prefs = await supabaseNotificationService.getPreferences(userId);

// Update preference
await supabaseNotificationService.updatePreference(
  userId,
  'contract_approval',  // type
  'email',              // channel
  true                  // enabled
);

// Get statistics
const stats = await supabaseNotificationService.getStats(userId);
// Returns: { total, unread, byType }

// Real-time subscription
const unsub = supabaseNotificationService.subscribeToNotifications(userId, (payload) => {
  console.log('New notification:', payload);
});
```

---

## 🎯 Common Patterns

### Real-time Subscriptions
```typescript
// Subscribe to changes
const unsubscribe = supabaseCustomerService.subscribeToCustomers(
  tenantId,
  (payload) => {
    console.log('Event:', payload.eventType); // INSERT, UPDATE, DELETE
    console.log('New data:', payload.new);
    console.log('Old data:', payload.old);
  }
);

// Later, unsubscribe
unsubscribe();
```

### Error Handling
```typescript
try {
  const customer = await supabaseCustomerService.createCustomer(data);
  console.log('Success:', customer);
} catch (error) {
  console.error('Error creating customer:', error);
  // Error is logged with [customers] prefix in console
}
```

### Filtering Examples
```typescript
// Single filter
const customers = await supabaseCustomerService.getCustomers({
  status: 'active'
});

// Multiple filters
const sales = await supabasesSalesService.getSales({
  tenantId,
  stage: 'proposal',
  assignedTo: userId
});

// Date range filtering
const sales = await supabasesSalesService.getSales({
  tenantId,
  dateRange: {
    from: '2024-01-01',
    to: '2024-12-31'
  }
});
```

---

## 📊 Filter Parameters

### CustomerService Filters
```typescript
{
  status?: 'active' | 'inactive' | 'prospect';
  industry?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  tenantId?: string;
  search?: string;
}
```

### SalesService Filters
```typescript
{
  status?: 'open' | 'won' | 'lost';
  stage?: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  assignedTo?: string;
  customerId?: string;
  tenantId?: string;
  dateRange?: { from: string; to: string };
}
```

### TicketService Filters
```typescript
{
  status?: 'open' | 'pending' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  customerId?: string;
  tenantId?: string;
  search?: string;
}
```

### ProductService Filters
```typescript
{
  status?: 'active' | 'inactive' | 'discontinued';
  categoryId?: string;
  tenantId?: string;
  search?: string;
}
```

---

## 🔑 Key Statistics Available

### CustomerService
```typescript
const stats = await supabaseCustomerService.getCustomerStats(tenantId);
// total, active, byIndustry, bySize
```

### SalesService
```typescript
const stats = await supabasesSalesService.getSalesStats(tenantId);
// total, totalValue, avgValue, byStage, closedWon, closedLost, conversionRate
```

### TicketService
```typescript
const stats = await supabaseTicketService.getTicketStats(tenantId);
// total, open, closed, avgResolutionTime, slaBreach, byPriority, byStatus
```

### ProductService
```typescript
const stats = await supabaseProductService.getProductStats(tenantId);
// total, active, discontinued, totalInventoryValue, averagePrice
```

### ContractService
```typescript
const stats = await supabaseContractService.getContractStats(tenantId);
// total, active, expiring, totalValue, byStatus, byType
```

---

## 🛠️ Configuration

### Environment Variables
```env
# .env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_API_MODE=supabase
```

### Initialization in App
```typescript
// main.tsx or App.tsx
import { initializeSupabase } from '@/services/supabase/client';

try {
  initializeSupabase();
  console.log('✅ Supabase initialized');
} catch (error) {
  console.error('❌ Failed to initialize Supabase', error);
  process.exit(1);
}
```

---

## 📦 Service Files Location

```
src/services/supabase/
├── baseService.ts              # Base class
├── client.ts                   # Client initialization
├── authService.ts              # Authentication
├── customerService.ts          # Customers
├── salesService.ts             # Sales pipeline
├── ticketService.ts            # Support tickets
├── contractService.ts          # Contracts
├── productService.ts           # Products
├── companyService.ts           # Companies
├── notificationService.ts      # Notifications
└── index.ts                    # Central exports
```

---

## ✅ Verification Checklist

After implementing Phase 3:
- [ ] Supabase client initializes without errors
- [ ] All 8 services are imported successfully
- [ ] Real-time subscriptions are working
- [ ] CRUD operations complete successfully
- [ ] Search/filtering returns expected results
- [ ] Statistics/KPI calculations are accurate
- [ ] Error handling works properly
- [ ] Type checking passes (TypeScript)

---

## 🚀 Next Steps

1. **Phase 4: Integration** - Connect services to React components
2. **Add React hooks** - useCustomers(), useSales(), etc.
3. **Create UI components** - CustomerList, SalesBoard, etc.
4. **Test integration** - E2E testing
5. **Deploy** - Production deployment

---

**Happy coding! 🎉**

For detailed documentation, see: **PHASE_3_SERVICE_IMPLEMENTATION_COMPLETE.md**