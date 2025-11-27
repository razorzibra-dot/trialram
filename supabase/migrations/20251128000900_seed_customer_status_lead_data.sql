-- ============================================================================
-- Migration: Seed customer_status, lead_source, and lead_rating reference data
-- Date:      2025-11-28
-- Purpose:   Ensure all core customer dropdowns have default values per tenant
--            so that Status, Lead Source, and Lead Rating lists render without
--            manual inserts after every db reset.
-- ============================================================================

WITH tenants AS (
  SELECT id
  FROM public.tenants
),
defaults AS (
  -- category, key, label, description, metadata_json, sort_order
  VALUES
    -- Customer status defaults
    ('customer_status', 'active', 'Active', 'Currently engaged customer', '{"emoji":"\uD83D\uDFE2","badgeColor":"green"}', 1),
    ('customer_status', 'prospect', 'Prospect', 'Pre-sales prospect under evaluation', '{"emoji":"\uD83D\uDD35","badgeColor":"blue"}', 2),
    ('customer_status', 'inactive', 'Inactive', 'Dormant customer with no recent activity', '{"emoji":"\u26AA","badgeColor":"default"}', 3),
    ('customer_status', 'suspended', 'Suspended', 'Temporarily blocked due to issues', '{"emoji":"\uD83D\uDD34","badgeColor":"red"}', 4),

    -- Lead source defaults
    ('lead_source', 'referral', 'Referral', 'Brought in by an existing contact or client', '{"emoji":"\uD83E\uDD1D"}', 1),
    ('lead_source', 'website', 'Website', 'Captured from corporate website or landing page', '{"emoji":"\uD83C\uDF10"}', 2),
    ('lead_source', 'event', 'Event / Webinar', 'Generated from marketing events or webinars', '{"emoji":"\uD83C\uDFAF"}', 3),
    ('lead_source', 'email_campaign', 'Email Campaign', 'Marketing automation or newsletter response', '{"emoji":"\u2709"}', 4),
    ('lead_source', 'partner', 'Partner / Channel', 'Submitted by a channel or alliance partner', '{"emoji":"\uD83E\uDD1D"}', 5),

    -- Lead rating defaults
    ('lead_rating', 'hot', 'Hot', 'High-intent lead ready for conversion', '{"emoji":"\uD83D\uDD25"}', 1),
    ('lead_rating', 'warm', 'Warm', 'Engaged lead that needs nurturing', '{"emoji":"\uD83C\uDF21"}', 2),
    ('lead_rating', 'cold', 'Cold', 'Low-engagement lead requiring long-term follow-up', '{"emoji":"\u2744"}', 3),
    ('lead_rating', 'nurture', 'Nurture', 'Long-term nurture program candidate', '{"emoji":"\uD83C\uDF31"}', 4)
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

