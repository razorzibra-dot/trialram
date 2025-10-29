import { http, HttpResponse } from 'msw';

/**
 * MSW (Mock Service Worker) handlers for API mocking in tests
 * These handlers intercept fetch/axios calls and return mock responses
 */

export const handlers = [
  // Sales endpoints
  http.get('/api/sales', () => {
    return HttpResponse.json([
      {
        id: 'deal_1',
        customerId: 'customer_1',
        title: 'Enterprise Deal',
        status: 'negotiation',
        value: 250000,
        probability: 70,
        expectedCloseDate: '2025-03-15',
        tenantId: 'tenant_1',
      },
      {
        id: 'deal_2',
        customerId: 'customer_2',
        title: 'SMB Deal',
        status: 'proposal',
        value: 50000,
        probability: 40,
        expectedCloseDate: '2025-02-28',
        tenantId: 'tenant_1',
      },
    ]);
  }),

  http.get('/api/sales/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      customerId: 'customer_1',
      title: 'Test Deal',
      status: 'negotiation',
      value: 100000,
      probability: 60,
      expectedCloseDate: '2025-03-15',
      tenantId: 'tenant_1',
    });
  }),

  http.post('/api/sales', async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      id: `deal_${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    });
  }),

  http.put('/api/sales/:id', async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      id: 'deal_1',
      ...body,
      updatedAt: new Date().toISOString(),
    });
  }),

  http.delete('/api/sales/:id', () => {
    return HttpResponse.json({ success: true });
  }),

  // Sales stats endpoint
  http.get('/api/sales/stats', () => {
    return HttpResponse.json({
      totalDeals: 150,
      closedDeals: 45,
      totalRevenue: 1500000,
      averageDealValue: 10000,
      conversionRate: 30,
      pipelineValue: 3000000,
    });
  }),

  // Deal stages endpoint
  http.get('/api/sales/stages', () => {
    return HttpResponse.json([
      { id: 'stage_1', name: 'Lead', color: '#E8F4F8', probability: 10 },
      { id: 'stage_2', name: 'Qualification', color: '#D0E8F2', probability: 25 },
      { id: 'stage_3', name: 'Proposal', color: '#B8DDE8', probability: 50 },
      { id: 'stage_4', name: 'Negotiation', color: '#80C8E0', probability: 75 },
      { id: 'stage_5', name: 'Closed Won', color: '#3DBF6B', probability: 100 },
    ]);
  }),

  // Search deals endpoint
  http.get('/api/sales/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    return HttpResponse.json([
      {
        id: 'deal_search_1',
        title: `Result for "${query}"`,
        value: 50000,
        status: 'proposal',
      },
    ]);
  }),

  // Bulk operations
  http.put('/api/sales/bulk', async ({ request }) => {
    const body = await request.json() as any;
    const dealCount = Array.isArray(body.deals) ? body.deals.length : 0;

    return HttpResponse.json({
      successCount: dealCount,
      failureCount: 0,
      errors: [],
    });
  }),

  http.delete('/api/sales/bulk', async ({ request }) => {
    const body = await request.json() as any;
    const dealCount = Array.isArray(body.ids) ? body.ids.length : 0;

    return HttpResponse.json({
      successCount: dealCount,
      failureCount: 0,
      errors: [],
    });
  }),

  // Export/Import endpoints
  http.get('/api/sales/export', () => {
    return HttpResponse.text('id,title,value,status\ndeal_1,Test Deal,100000,closed');
  }),

  http.post('/api/sales/import', async ({ request }) => {
    const formData = await request.formData();
    return HttpResponse.json({
      importedCount: 10,
      failedCount: 0,
      errors: [],
    });
  }),
];