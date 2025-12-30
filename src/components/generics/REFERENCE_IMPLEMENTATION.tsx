/**
 * Generic Components Reference Implementation
 * Example of how to use all generic components together
 * 
 * This example shows how to build a complete CRUD page using:
 * 1. createEntityHooks factory for data fetching
 * 2. GenericEntityPage for the complete page layout
 * 3. All the individual generic components
 */

import React, { useState } from 'react';
import { GenericEntityPage } from '@/components/generics';
import { ColumnConfig, FormFieldConfig, QueryFilters } from '@/types/generic';
import { FilterConfig } from '@/components/generics/GenericFilterBar';

/**
 * Example: Deal Entity Page
 * 
 * This is a complete, production-ready example showing how to use:
 * - createEntityHooks factory for CRUD operations
 * - GenericEntityPage for the complete page
 * - All generic components together
 */

export interface Deal {
  id: string;
  name: string;
  amount: number;
  status: 'open' | 'won' | 'lost';
  createdAt: string;
  customerId: string;
  customerName?: string;
  description?: string;
}

/**
 * Step 1: Define table columns
 */
const dealColumns: ColumnConfig<Deal>[] = [
  {
    title: 'Deal Name',
    key: 'name',
    dataIndex: 'name',
    sortable: true
  },
  {
    title: 'Customer',
    key: 'customerName',
    dataIndex: 'customerName'
  },
  {
    title: 'Amount',
    key: 'amount',
    dataIndex: 'amount',
    render: (value: number) => `$${value?.toLocaleString() || '0'}`
  },
  {
    title: 'Status',
    key: 'status',
    dataIndex: 'status',
    render: (status: string) => {
      const colors: Record<string, string> = {
        open: 'blue',
        won: 'green',
        lost: 'red'
      };
      return <span style={{ color: colors[status] }}>{status.toUpperCase()}</span>;
    }
  },
  {
    title: 'Created',
    key: 'createdAt',
    dataIndex: 'createdAt',
    render: (date: string) => new Date(date).toLocaleDateString()
  }
];

/**
 * Step 2: Define filter controls
 */
const dealFilters: FilterConfig[] = [
  {
    key: 'search',
    label: 'Search',
    type: 'search',
    placeholder: 'Search by deal name or customer'
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Open', value: 'open' },
      { label: 'Won', value: 'won' },
      { label: 'Lost', value: 'lost' }
    ]
  },
  {
    key: 'createdAt',
    label: 'Created Date',
    type: 'dateRange'
  }
];

/**
 * Step 3: Define form fields for create/edit
 */
const dealFormFields: FormFieldConfig[] = [
  {
    type: 'text',
    name: 'name',
    label: 'Deal Name',
    required: true,
    placeholder: 'Enter deal name',
    tooltip: 'The name of the deal or opportunity'
  },
  {
    type: 'select',
    name: 'customerId',
    label: 'Customer',
    required: true,
    placeholder: 'Select customer',
    options: [
      // These would be dynamically loaded in a real app
      { label: 'Customer 1', value: 'cust-1' },
      { label: 'Customer 2', value: 'cust-2' }
    ]
  },
  {
    type: 'number',
    name: 'amount',
    label: 'Deal Amount',
    required: true,
    placeholder: 'Enter amount'
  },
  {
    type: 'select',
    name: 'status',
    label: 'Status',
    required: true,
    options: [
      { label: 'Open', value: 'open' },
      { label: 'Won', value: 'won' },
      { label: 'Lost', value: 'lost' }
    ]
  },
  {
    type: 'textarea',
    name: 'description',
    label: 'Description',
    placeholder: 'Add notes about this deal',
    tooltip: 'Internal notes visible only to your team'
  }
];

/**
 * Step 4: Use hooks factory to get CRUD operations
 * (In real code, you would use: const dealsHooks = createEntityHooks<Deal>(...))
 */

/**
 * Example Component using GenericEntityPage
 */
export const DealPageExample: React.FC = () => {
  // Example state (in real code, these would come from hooks)
  const [deals, setDeals] = React.useState<Deal[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [loading, setLoading] = React.useState(false);
  const [filters, setFilters] = React.useState<QueryFilters>({});

  // In a real implementation, these would be from the hooks factory:
  // const { data, isLoading, error } = useDeals(filters);
  // const createMutation = useCreateDeal();
  // const updateMutation = useUpdateDeal();
  // const deleteMutation = useDeleteDeal();

  const handleCreate = async (values: Record<string, unknown>) => {
    console.log('Creating deal:', values);
    // In real code: await createMutation.mutate(values);
  };

  const handleUpdate = async (id: string | number, values: Record<string, unknown>) => {
    console.log('Updating deal:', id, values);
    // In real code: await updateMutation.mutate({ id, data: values });
  };

  const handleDelete = async (id: string | number) => {
    console.log('Deleting deal:', id);
    // In real code: await deleteMutation.mutate(id);
  };

  return (
    <GenericEntityPage
      title="Deals"
      data={deals}
      total={total}
      page={page}
      pageSize={pageSize}
      loading={loading}
      columns={dealColumns}
      filters={dealFilters}
      formFields={dealFormFields}
      idField="id"
      enableCreate={true}
      enableActions={true}
      showTitle={true}
      onFiltersChange={(newFilters) => {
        setFilters(newFilters);
        setPage(1); // Reset to first page on filter change
      }}
      onPageChange={(newPage, newSize) => {
        setPage(newPage);
        setPageSize(newSize);
      }}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onView={(record) => console.log('Viewing:', record)}
    />
  );
};

/**
 * How to integrate this into a real module:
 * 
 * 1. Create hooks factory:
 *    const dealsHooks = createEntityHooks<Deal>({
 *      entityName: 'Deal',
 *      service: dealService,
 *      queryKeys: {
 *        all: ['deals'],
 *        list: (filters) => ['deals', 'list', filters],
 *        detail: (id) => ['deals', id]
 *      }
 *    });
 * 
 * 2. Use in component:
 *    const { data, isLoading } = dealsHooks.useEntities(filters);
 *    const createMutation = dealsHooks.useCreateEntity();
 *    const updateMutation = dealsHooks.useUpdateEntity();
 *    const deleteMutation = dealsHooks.useDeleteEntity();
 * 
 * 3. Pass to GenericEntityPage:
 *    <GenericEntityPage<Deal>
 *      // ... config as shown above ...
 *      onPageChange={(p, s) => {
 *        setFilters({ ...filters, page: p, limit: s });
 *      }}
 *      onCreate={(values) => createMutation.mutate(values)}
 *      onUpdate={(id, values) => updateMutation.mutate({ id, data: values })}
 *      onDelete={(id) => deleteMutation.mutate(id)}
 *    />
 */
