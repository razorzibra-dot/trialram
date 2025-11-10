SELECT tenant_id, category, COUNT(*) as count FROM reference_data GROUP BY tenant_id, category ORDER BY tenant_id, category;
SELECT 'Total records' as label, COUNT(*) as count FROM reference_data;
SELECT * FROM reference_data WHERE category IN ('industry', 'company_size') ORDER BY category, sort_order;
