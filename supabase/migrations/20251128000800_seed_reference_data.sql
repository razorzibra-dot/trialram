-- ============================================================================
-- Migration: Seed reference_data defaults for core CRM dropdowns
-- Date:     2025-11-28
-- Purpose:  Ensure industry, company_size, and customer_type choices exist for
--           every tenant so customer forms have options immediately after a
--           reset. Idempotent (skips rows that already exist).
-- ============================================================================

WITH tenants AS (
  SELECT id
  FROM public.tenants
),
defaults AS (
  -- category, key, label, description, metadata, sort_order
  VALUES
    ('industry', 'manufacturing', 'Manufacturing', 'Industrial & manufacturing businesses', '{"icon":"factory"}', 1),
    ('industry', 'technology', 'Technology', 'Software, hardware, and IT services', '{"icon":"laptop"}', 2),
    ('industry', 'finance', 'Financial Services', 'Banking, insurance, and fintech', '{"icon":"bank"}', 3),
    ('industry', 'healthcare', 'Healthcare', 'Medical providers and life sciences', '{"icon":"medical"}', 4),
    ('industry', 'retail', 'Retail & Consumer', 'Retail stores and consumer brands', '{"icon":"retail"}', 5),

    ('company_size', 'startup', 'Startup (1-50)', 'Early-stage teams up to 50 employees', '{"minEmployees":1,"maxEmployees":50}', 1),
    ('company_size', 'small', 'Small (51-200)', 'Growing companies with 51-200 employees', '{"minEmployees":51,"maxEmployees":200}', 2),
    ('company_size', 'medium', 'Medium (201-1000)', 'Established companies with 201-1000 employees', '{"minEmployees":201,"maxEmployees":1000}', 3),
    ('company_size', 'enterprise', 'Enterprise (1000+)', 'Global enterprises with 1000+ employees', '{"minEmployees":1001}', 4),

    ('customer_type', 'business', 'Business', 'B2B customers and organizations', '{"icon":"building"}', 1),
    ('customer_type', 'individual', 'Individual', 'B2C customers and consumers', '{"icon":"user"}', 2),
    ('customer_type', 'government', 'Government / Public Sector', 'Agencies and government entities', '{"icon":"government"}', 3)
)
INSERT INTO public.reference_data (
  id,
  tenant_id,
  category,
  key,
  label,
  description,
  metadata,
  sort_order,
  is_active,
  created_at,
  updated_at
)
SELECT
  uuid_generate_v4(),
  t.id,
  d.column1,
  d.column2,
  d.column3,
  d.column4,
  d.column5::jsonb,
  d.column6,
  true,
  NOW(),
  NOW()
FROM tenants t
CROSS JOIN defaults d
WHERE NOT EXISTS (
  SELECT 1
  FROM public.reference_data r
  WHERE r.tenant_id = t.id
    AND r.category = d.column1
    AND r.key = d.column2
);

