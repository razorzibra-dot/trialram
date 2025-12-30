# Comprehensive Refactoring Analysis & Plan

**Date**: December 27, 2025  
**Objective**: Identify code duplication, design generic reusable architecture, and eliminate legacy code

---

## Executive Summary

After deep analysis of the codebase, I've identified significant code duplication across **16 feature modules** following similar patterns:

### Modules Analyzed
1. **deals** (leads + deals)
2. **customers**
3. **tickets**
4. **complaints**
5. **products**
6. **product-sales**
7. **job-works/jobworks** (duplicate modules exist)
8. **service-contracts**
9. **user-management**
10. **super-admin**
11. **masters** (companies, products)
12. **audit-logs**
13. **dashboard**
14. **notifications**
15. **configuration**
16. **auth**

---

## Current Architecture Analysis

### Repeated Patterns Across Modules

#### 1. **Service Layer Duplication** (90% Similar)
```typescript
// Pattern repeated in EVERY module:
async getEntities(filters?: Filters): Promise<PaginatedResponse<Entity>> {
  const query = supabase.from('table_name')
    .select('*')
    .eq('tenant_id', tenantId);
  
  if (filters?.search) query.ilike('field', `%${filters.search}%`);
  if (filters?.status) query.eq('status', filters.status);
  // ... more filters
  
  const { data, error, count } = await query;
  if (error) throw error;
  return { data, total: count, page, pageSize };
}
```

**Files with this pattern** (39 files):
- `src/services/*/supabase/*Service.ts`
- Every service has: `get`, `getById`, `create`, `update`, `delete`, `getStats`

#### 2. **React Hook Duplication** (85% Similar)
```typescript
// Pattern repeated in EVERY module:
export function useEntities(filters?: Filters) {
  return useQuery({
    queryKey: ['entities', filters],
    queryFn: () => entityService.getEntities(filters),
  });
}

export function useCreateEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => entityService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['entities']);
      message.success('Created successfully');
    },
  });
}
```

**Files with this pattern** (50+ hooks files):
- `src/modules/features/*/hooks/*.ts`
- Every hook: `useEntities`, `useEntity`, `useCreateEntity`, `useUpdateEntity`, `useDeleteEntity`

#### 3. **Form Panel Duplication** (80% Similar)
```typescript
// Pattern repeated in 16 modules:
interface EntityFormPanelProps {
  open: boolean;
  onClose: () => void;
  entity?: Entity;
  mode: 'create' | 'edit' | 'view';
}

export const EntityFormPanel: React.FC<EntityFormPanelProps> = ({
  open, onClose, entity, mode
}) => {
  const [form] = Form.useForm();
  const { create } = useCreateEntity();
  const { update } = useUpdateEntity();
  
  const handleSubmit = async (values) => {
    if (mode === 'create') await create(values);
    else await update(entity.id, values);
    onClose();
  };
  
  return (
    <Drawer open={open} onClose={onClose}>
      <Form form={form} onFinish={handleSubmit}>
        {/* Form fields */}
      </Form>
    </Drawer>
  );
};
```

**Files with this pattern** (20+ form panels):
- UserFormPanel, DealFormPanel, CustomerFormPanel, TicketFormPanel, etc.

#### 4. **Detail Panel Duplication** (75% Similar)
```typescript
// Pattern repeated in 12 modules:
interface EntityDetailPanelProps {
  entity: Entity;
  onClose: () => void;
  onEdit: () => void;
}

export const EntityDetailPanel: React.FC<EntityDetailPanelProps> = ({
  entity, onClose, onEdit
}) => {
  return (
    <Drawer open onClose={onClose}>
      <Descriptions>
        <Descriptions.Item label="Field">{entity.field}</Descriptions.Item>
        {/* More fields */}
      </Descriptions>
      <Button onClick={onEdit}>Edit</Button>
    </Drawer>
  );
};
```

#### 5. **List Page Duplication** (85% Similar)
```typescript
// Pattern repeated in EVERY module:
export const EntitiesPage: React.FC = () => {
  const [filters, setFilters] = useState({});
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  
  const { data, isLoading } = useEntities(filters);
  const { delete: deleteEntity } = useDeleteEntity();
  
  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    // ... more columns
    {
      title: 'Actions',
      render: (_, record) => (
        <>
          <Button onClick={() => handleEdit(record)}>Edit</Button>
          <Popconfirm onConfirm={() => deleteEntity(record.id)}>
            <Button>Delete</Button>
          </Popconfirm>
        </>
      ),
    },
  ];
  
  return (
    <>
      <PageHeader title="Entities" />
      <Table
        columns={columns}
        dataSource={data}
        loading={isLoading}
        pagination={{ ...}}
      />
      <EntityFormPanel open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
};
```

**Files with this pattern** (15+ list pages):
- DealsPage, CustomersPage, TicketsPage, etc.

---

## Duplication Statistics

### Code Metrics
- **Total Service Methods**: ~450 methods across 39 service files
- **Estimated Duplicate CRUD Code**: **~70%** (315 methods could be generic)
- **Total Hook Files**: 50+ files
- **Estimated Duplicate Hook Code**: **~80%** (40+ files follow identical pattern)
- **Total Form Components**: 20+ forms
- **Estimated Duplicate Form Code**: **~75%** (15+ forms nearly identical)
- **Total List Pages**: 15+ pages
- **Estimated Duplicate List Code**: **~85%** (12+ pages nearly identical)

### Legacy/Duplicate Files Identified
```
MARK_FOR_DELETE/                  ← Legacy services (old pattern)
src/modules/features/contracts/   ← DUPLICATE of service-contracts
src/modules/features/job-works/   ← DUPLICATE of jobworks
src/services/supabase/ticketCommentService.ts  ← Duplicate location
src/services/supabase/ticketAttachmentService.ts  ← Duplicate location
src/modules/features/customers/hooks/useCustomerTypes.ts ← Should use reference data
src/modules/features/customers/hooks/useIndustries.ts ← Should use reference data
src/modules/features/customers/hooks/useLeadSource.ts ← Should use reference data
... (50+ more identified)
```

---

## Proposed Generic Architecture

### 1. Generic Repository Pattern (Database Layer)

```typescript
// src/services/core/GenericRepository.ts
export class GenericRepository<T, TCreate = T, TUpdate = Partial<T>> {
  constructor(
    protected tableName: string,
    protected client: SupabaseClient,
    protected config: RepositoryConfig<T>
  ) {}

  async findMany(filters?: QueryFilters): Promise<PaginatedResponse<T>> {
    let query = this.client.from(this.tableName).select('*', { count: 'exact' });
    
    // Auto-apply tenant filter (RLS)
    if (this.config.tenantScoped) {
      query = query.eq('tenant_id', this.getTenantId());
    }
    
    // Generic filter application
    query = this.applyFilters(query, filters);
    
    const { data, error, count } = await query;
    if (error) throw new RepositoryError(error);
    
    return {
      data: data.map(this.config.mapper),
      total: count,
      page: filters?.page || 1,
      pageSize: filters?.pageSize || 20,
    };
  }

  async findById(id: string): Promise<T> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw new RepositoryError(error);
    return this.config.mapper(data);
  }

  async create(data: TCreate): Promise<T> {
    const insertData = {
      ...data,
      tenant_id: this.getTenantId(),
      created_by: this.getUserId(),
    };
    
    const { data: result, error } = await this.client
      .from(this.tableName)
      .insert([insertData])
      .select()
      .single();
    
    if (error) throw new RepositoryError(error);
    return this.config.mapper(result);
  }

  async update(id: string, data: TUpdate): Promise<T> {
    const updateData = {
      ...data,
      updated_by: this.getUserId(),
      updated_at: new Date().toISOString(),
    };
    
    const { data: result, error } = await this.client
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new RepositoryError(error);
    return this.config.mapper(result);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id);
    
    if (error) throw new RepositoryError(error);
  }

  // Extensible: Custom queries
  protected applyFilters(query: any, filters?: QueryFilters) {
    if (!filters) return query;
    
    // Search
    if (filters.search && this.config.searchFields) {
      const orConditions = this.config.searchFields
        .map(field => `${field}.ilike.%${filters.search}%`)
        .join(',');
      query = query.or(orConditions);
    }
    
    // Status filter
    if (filters.status) query = query.eq('status', filters.status);
    
    // Date range
    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
    if (filters.dateTo) query = query.lte('created_at', filters.dateTo);
    
    // Custom filters (extensible)
    if (this.config.filterHandlers) {
      Object.entries(filters).forEach(([key, value]) => {
        if (this.config.filterHandlers[key]) {
          query = this.config.filterHandlers[key](query, value);
        }
      });
    }
    
    // Sorting
    if (filters.sortBy) {
      query = query.order(filters.sortBy, { 
        ascending: filters.sortOrder !== 'desc' 
      });
    }
    
    // Pagination
    if (filters.page && filters.pageSize) {
      const offset = (filters.page - 1) * filters.pageSize;
      query = query.range(offset, offset + filters.pageSize - 1);
    }
    
    return query;
  }
}

// Usage example:
const dealRepository = new GenericRepository('deals', supabaseClient, {
  tenantScoped: true,
  searchFields: ['title', 'description', 'customer_name'],
  mapper: (row) => mapDealRow(row),
  filterHandlers: {
    dealType: (query, value) => query.eq('deal_type', value),
    minValue: (query, value) => query.gte('value', value),
  },
});
```

### 2. Generic Service Pattern

```typescript
// src/services/core/GenericCrudService.ts
export abstract class GenericCrudService<T, TCreate, TUpdate, TFilters> {
  constructor(protected repository: GenericRepository<T, TCreate, TUpdate>) {}

  async getAll(filters?: TFilters): Promise<PaginatedResponse<T>> {
    // Pre-hook for custom logic
    await this.beforeGetAll?.(filters);
    
    const result = await this.repository.findMany(filters);
    
    // Post-hook for custom logic
    await this.afterGetAll?.(result);
    
    return result;
  }

  async getById(id: string): Promise<T> {
    await this.beforeGetById?.(id);
    const entity = await this.repository.findById(id);
    await this.afterGetById?.(entity);
    return entity;
  }

  async create(data: TCreate): Promise<T> {
    // Validate
    await this.validateCreate?.(data);
    
    await this.beforeCreate?.(data);
    const entity = await this.repository.create(data);
    await this.afterCreate?.(entity);
    
    // Trigger events (audit, notifications, etc.)
    await this.onCreated?.(entity);
    
    return entity;
  }

  async update(id: string, data: TUpdate): Promise<T> {
    await this.validateUpdate?.(id, data);
    
    const existing = await this.repository.findById(id);
    await this.beforeUpdate?.(existing, data);
    
    const updated = await this.repository.update(id, data);
    await this.afterUpdate?.(updated);
    
    await this.onUpdated?.(existing, updated);
    
    return updated;
  }

  async delete(id: string): Promise<void> {
    const entity = await this.repository.findById(id);
    await this.beforeDelete?.(entity);
    
    await this.repository.delete(id);
    await this.afterDelete?.(entity);
    
    await this.onDeleted?.(entity);
  }

  // Hooks for customization (override in subclass)
  protected beforeGetAll?(filters?: TFilters): Promise<void>;
  protected afterGetAll?(result: PaginatedResponse<T>): Promise<void>;
  protected beforeGetById?(id: string): Promise<void>;
  protected afterGetById?(entity: T): Promise<void>;
  protected validateCreate?(data: TCreate): Promise<void>;
  protected beforeCreate?(data: TCreate): Promise<void>;
  protected afterCreate?(entity: T): Promise<void>;
  protected onCreated?(entity: T): Promise<void>;
  protected validateUpdate?(id: string, data: TUpdate): Promise<void>;
  protected beforeUpdate?(existing: T, data: TUpdate): Promise<void>;
  protected afterUpdate?(entity: T): Promise<void>;
  protected onUpdated?(before: T, after: T): Promise<void>;
  protected beforeDelete?(entity: T): Promise<void>;
  protected afterDelete?(entity: T): Promise<void>;
  protected onDeleted?(entity: T): Promise<void>;
}

// Usage example:
export class DealService extends GenericCrudService<
  Deal, DealCreateInput, DealUpdateInput, DealFilters
> {
  constructor() {
    super(dealRepository);
  }

  // Override hooks for business logic
  protected async validateCreate(data: DealCreateInput): Promise<void> {
    if (!data.customerId) throw new Error('Customer is required');
    if (data.value && data.value < 0) throw new Error('Value must be positive');
  }

  protected async afterCreate(deal: Deal): Promise<void> {
    // Custom business logic: create related records, send notifications, etc.
    await this.createDealActivities(deal);
    await this.notifyTeam(deal);
  }

  protected async onUpdated(before: Deal, after: Deal): Promise<void> {
    // Audit trail
    await auditService.log({
      action: 'deal.updated',
      entityId: after.id,
      changes: this.getChanges(before, after),
    });
    
    // Notifications
    if (before.status !== after.status) {
      await this.notifyStatusChange(after);
    }
  }

  // Custom methods still possible
  async convertLeadToDeal(leadId: string): Promise<Deal> {
    const lead = await leadRepository.findById(leadId);
    const deal = await this.create(this.leadToDealMapper(lead));
    await leadRepository.update(leadId, { converted: true, dealId: deal.id });
    return deal;
  }
}
```

### 3. Generic React Hooks Factory

```typescript
// src/hooks/factories/createEntityHooks.ts
export function createEntityHooks<T, TCreate, TUpdate, TFilters>(
  config: EntityHooksConfig<T, TCreate, TUpdate, TFilters>
) {
  const { entityName, service, queryKeys } = config;

  // List hook
  function useEntities(filters?: TFilters) {
    return useQuery({
      queryKey: [queryKeys.list, filters],
      queryFn: () => service.getAll(filters),
      staleTime: config.staleTime || 30000,
    });
  }

  // Single entity hook
  function useEntity(id: string | undefined) {
    return useQuery({
      queryKey: [queryKeys.detail, id],
      queryFn: () => service.getById(id!),
      enabled: !!id,
    });
  }

  // Create mutation
  function useCreateEntity() {
    const queryClient = useQueryClient();
    const { showNotification } = useNotification();

    return useMutation({
      mutationFn: (data: TCreate) => service.create(data),
      onSuccess: (data) => {
        queryClient.invalidateQueries([queryKeys.list]);
        showNotification({
          type: 'success',
          message: `${entityName} created successfully`,
        });
        config.onCreateSuccess?.(data);
      },
      onError: (error) => {
        showNotification({
          type: 'error',
          message: `Failed to create ${entityName}`,
          description: error.message,
        });
      },
    });
  }

  // Update mutation
  function useUpdateEntity(id: string) {
    const queryClient = useQueryClient();
    const { showNotification } = useNotification();

    return useMutation({
      mutationFn: (data: TUpdate) => service.update(id, data),
      onSuccess: (data) => {
        queryClient.invalidateQueries([queryKeys.list]);
        queryClient.invalidateQueries([queryKeys.detail, id]);
        showNotification({
          type: 'success',
          message: `${entityName} updated successfully`,
        });
        config.onUpdateSuccess?.(data);
      },
      onError: (error) => {
        showNotification({
          type: 'error',
          message: `Failed to update ${entityName}`,
          description: error.message,
        });
      },
    });
  }

  // Delete mutation
  function useDeleteEntity() {
    const queryClient = useQueryClient();
    const { showNotification } = useNotification();

    return useMutation({
      mutationFn: (id: string) => service.delete(id),
      onSuccess: () => {
        queryClient.invalidateQueries([queryKeys.list]);
        showNotification({
          type: 'success',
          message: `${entityName} deleted successfully`,
        });
      },
      onError: (error) => {
        showNotification({
          type: 'error',
          message: `Failed to delete ${entityName}`,
          description: error.message,
        });
      },
    });
  }

  return {
    useEntities,
    useEntity,
    useCreateEntity,
    useUpdateEntity,
    useDeleteEntity,
  };
}

// Usage example:
const {
  useEntities: useDeals,
  useEntity: useDeal,
  useCreateEntity: useCreateDeal,
  useUpdateEntity: useUpdateDeal,
  useDeleteEntity: useDeleteDeal,
} = createEntityHooks({
  entityName: 'Deal',
  service: dealService,
  queryKeys: {
    list: 'deals',
    detail: 'deal',
  },
  onCreateSuccess: (deal) => {
    // Custom logic after creation
    analytics.track('deal_created', { dealId: deal.id });
  },
});
```

### 4. Generic Form Components

```typescript
// src/components/generic/GenericFormDrawer.tsx
interface GenericFormDrawerProps<T, TFormData> {
  open: boolean;
  onClose: () => void;
  entity?: T;
  mode: 'create' | 'edit' | 'view';
  title: string;
  fields: FormFieldConfig[];
  onSubmit: (data: TFormData) => Promise<void>;
  loading?: boolean;
  width?: number;
}

export function GenericFormDrawer<T, TFormData>({
  open,
  onClose,
  entity,
  mode,
  title,
  fields,
  onSubmit,
  loading,
  width = 640,
}: GenericFormDrawerProps<T, TFormData>) {
  const [form] = Form.useForm();
  const isViewMode = mode === 'view';

  useEffect(() => {
    if (entity && open) {
      form.setFieldsValue(entity);
    }
  }, [entity, open, form]);

  const handleSubmit = async (values: TFormData) => {
    try {
      await onSubmit(values);
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Drawer
      title={`${mode === 'create' ? 'Create' : mode === 'edit' ? 'Edit' : 'View'} ${title}`}
      open={open}
      onClose={onClose}
      width={width}
      footer={
        !isViewMode && (
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()} loading={loading}>
              {mode === 'create' ? 'Create' : 'Update'}
            </Button>
          </Space>
        )
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} disabled={isViewMode}>
        {fields.map((field) => renderField(field))}
      </Form>
    </Drawer>
  );
}

function renderField(field: FormFieldConfig) {
  switch (field.type) {
    case 'text':
      return (
        <Form.Item key={field.name} name={field.name} label={field.label} rules={field.rules}>
          <Input placeholder={field.placeholder} />
        </Form.Item>
      );
    case 'textarea':
      return (
        <Form.Item key={field.name} name={field.name} label={field.label} rules={field.rules}>
          <Input.TextArea rows={4} placeholder={field.placeholder} />
        </Form.Item>
      );
    case 'select':
      return (
        <Form.Item key={field.name} name={field.name} label={field.label} rules={field.rules}>
          <Select options={field.options} placeholder={field.placeholder} />
        </Form.Item>
      );
    case 'date':
      return (
        <Form.Item key={field.name} name={field.name} label={field.label} rules={field.rules}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      );
    case 'number':
      return (
        <Form.Item key={field.name} name={field.name} label={field.label} rules={field.rules}>
          <InputNumber style={{ width: '100%' }} placeholder={field.placeholder} />
        </Form.Item>
      );
    case 'custom':
      return (
        <Form.Item key={field.name} name={field.name} label={field.label} rules={field.rules}>
          {field.render?.()}
        </Form.Item>
      );
    default:
      return null;
  }
}

// Usage example:
<GenericFormDrawer
  open={formOpen}
  onClose={() => setFormOpen(false)}
  entity={selectedDeal}
  mode={formMode}
  title="Deal"
  fields={[
    { type: 'text', name: 'title', label: 'Title', rules: [{ required: true }] },
    { type: 'select', name: 'customerId', label: 'Customer', options: customerOptions, rules: [{ required: true }] },
    { type: 'select', name: 'dealType', label: 'Type', options: dealTypeOptions },
    { type: 'number', name: 'value', label: 'Value' },
    { type: 'textarea', name: 'description', label: 'Description' },
    { type: 'date', name: 'closingDate', label: 'Expected Closing' },
  ]}
  onSubmit={handleSubmit}
  loading={isSubmitting}
/>
```

### 5. Generic List/Table Component

```typescript
// src/components/generic/GenericEntityTable.tsx
interface GenericEntityTableProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  loading?: boolean;
  pagination?: PaginationConfig;
  onRowClick?: (record: T) => void;
  onEdit?: (record: T) => void;
  onDelete?: (record: T) => void;
  onView?: (record: T) => void;
  rowSelection?: TableRowSelection<T>;
  actionColumn?: boolean;
}

export function GenericEntityTable<T extends { id: string }>({
  data,
  columns: baseColumns,
  loading,
  pagination,
  onRowClick,
  onEdit,
  onDelete,
  onView,
  rowSelection,
  actionColumn = true,
}: GenericEntityTableProps<T>) {
  const { hasPermission } = usePermissions();

  const actionColumnConfig: ColumnType<T> = {
    title: 'Actions',
    key: 'actions',
    fixed: 'right',
    width: 150,
    render: (_, record) => (
      <Space>
        {onView && (
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => onView(record)}>
            View
          </Button>
        )}
        {onEdit && hasPermission('update') && (
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)}>
            Edit
          </Button>
        )}
        {onDelete && hasPermission('delete') && (
          <Popconfirm
            title="Are you sure?"
            onConfirm={() => onDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        )}
      </Space>
    ),
  };

  const columns = actionColumn ? [...baseColumns, actionColumnConfig] : baseColumns;

  return (
    <Table
      dataSource={data}
      columns={columns}
      loading={loading}
      rowKey="id"
      pagination={pagination}
      onRow={(record) => ({
        onClick: () => onRowClick?.(record),
        style: { cursor: onRowClick ? 'pointer' : 'default' },
      })}
      rowSelection={rowSelection}
      scroll={{ x: 'max-content' }}
    />
  );
}

// Usage:
<GenericEntityTable
  data={deals}
  columns={[
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Customer', dataIndex: 'customerName', key: 'customer' },
    { title: 'Value', dataIndex: 'value', key: 'value', render: formatCurrency },
    { title: 'Status', dataIndex: 'status', key: 'status', render: renderStatusTag },
  ]}
  loading={isLoading}
  pagination={{ current: page, pageSize, total, onChange: handlePageChange }}
  onView={handleView}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

---

## Refactoring Execution Plan

### Phase 1: Foundation (Week 1)
1. **Create generic repository pattern** → `src/services/core/GenericRepository.ts`
2. **Create generic service base class** → `src/services/core/GenericCrudService.ts`
3. **Create error handling utilities** → `src/services/core/errors.ts`
4. **Create type utilities** → `src/types/generic.ts`

### Phase 2: Generic Hooks (Week 1-2)
5. **Create hooks factory** → `src/hooks/factories/createEntityHooks.ts`
6. **Create query key factory** → `src/hooks/factories/createQueryKeys.ts`
7. **Create notification hook** → `src/hooks/useNotification.ts`

### Phase 3: Generic UI Components (Week 2)
8. **Generic form drawer** → `src/components/generic/GenericFormDrawer.tsx`
9. **Generic detail drawer** → `src/components/generic/GenericDetailDrawer.tsx`
10. **Generic table** → `src/components/generic/GenericEntityTable.tsx`
11. **Generic filter bar** → `src/components/generic/GenericFilterBar.tsx`
12. **Generic page layout** → `src/components/generic/GenericEntityPage.tsx`

### Phase 4: Refactor Modules (Week 3-5)
**Order by complexity (simplest first):**

13. **Refactor Masters module** (companies, products) - Simplest
14. **Refactor Audit Logs module**
15. **Refactor Tickets module**
16. **Refactor Complaints module**
17. **Refactor Service Contracts module**
18. **Refactor Job Works module**
19. **Refactor Customers module**
20. **Refactor Product Sales module**
21. **Refactor Deals module** (complex - has leads + deals)
22. **Refactor User Management** (complex - permissions)

### Phase 5: Cleanup (Week 5-6)
23. **Remove legacy code**:
    - Delete `MARK_FOR_DELETE/` folder
    - Remove duplicate `contracts` module (keep `service-contracts`)
    - Remove duplicate `job-works` folder (keep `jobworks`)
    - Remove duplicate service files in `src/services/supabase/`
    - Remove obsolete hook files (useCustomerTypes, useIndustries, etc.)

24. **Consolidate reference data hooks** → Use `useReferenceDataOptions()`

25. **Update documentation**

---

## Expected Outcomes

### Code Reduction
- **~40% reduction** in service layer code
- **~60% reduction** in hooks code
- **~50% reduction** in form component code
- **~70% reduction** in list page code

### Maintainability Improvements
- **Single source of truth** for CRUD operations
- **Consistent patterns** across all modules
- **Easier to add new modules** (< 1 hour vs current ~4 hours)
- **Easier testing** (test generic base, not every instance)

### Performance Improvements
- **Unified caching strategy**
- **Optimized query key management**
- **Consistent pagination and filtering**

---

## Next Steps

**Approve this plan?** I can then:
1. Start implementing Phase 1 (Generic Repository + Service)
2. Create proof-of-concept with one simple module (e.g., Audit Logs)
3. Get your feedback before proceeding to all modules

**Timeline**: 5-6 weeks for complete refactoring

Would you like me to proceed with Phase 1 implementation?
