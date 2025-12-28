-- ============================================================================
-- Migration: Comprehensive Reference Data Seed
-- Date:      2025-12-15
-- Purpose:   Eliminate ALL hardcoded dropdowns across the application
--            Database-driven approach for all status options, types, priorities
-- 
-- This migration seeds reference_data for ALL modules:
-- - Job Works: priorities, statuses, size categories
-- - Service Contracts: service types, contract statuses
-- - Complaints: complaint types, priorities, statuses
-- - Deals/Leads: stages, qualification statuses, statuses
-- - Tickets: priorities, statuses, categories
-- - Products: statuses, categories
-- - User Management: user statuses
-- ============================================================================

-- ============================================================================
-- 0. ENSURE BASE TENANTS EXIST BEFORE SEEDING
-- ============================================================================
-- The seed relies on tenant rows; when the DB is reset tenants may be empty.
-- Insert the canonical sample tenants if none exist (idempotent).

INSERT INTO public.tenants (id, name, domain, plan, status)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Acme Corporation', 'acme.com', 'enterprise', 'active'),
  ('b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid, 'Tech Solutions Inc', 'techsolutions.example', 'premium', 'active'),
  ('c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid, 'Global Trading Ltd', 'globaltrading.example', 'basic', 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 1. JOB WORKS MODULE - Priorities, Statuses, Size Categories
-- ============================================================================

WITH tenants AS (
  SELECT id FROM public.tenants
),
jobwork_priorities AS (
  VALUES
    -- category, key, label, description, metadata, sort_order
    ('jobwork_priority', 'low', 'Low', 'Standard turnaround (14 days, 48hr response)', '{"color":"default","turnaroundDays":14,"responseTime":"48 hours","icon":"📊","badgeColor":"default"}', 1),
    ('jobwork_priority', 'medium', 'Medium', 'Expedited turnaround (7 days, 24hr response)', '{"color":"processing","turnaroundDays":7,"responseTime":"24 hours","icon":"⚠️","badgeColor":"processing"}', 2),
    ('jobwork_priority', 'high', 'High', 'Priority turnaround (3 days, 12hr response)', '{"color":"warning","turnaroundDays":3,"responseTime":"12 hours","icon":"🔴","badgeColor":"warning"}', 3),
    ('jobwork_priority', 'urgent', 'Urgent', 'Critical turnaround (1 day, 4hr response)', '{"color":"error","turnaroundDays":1,"responseTime":"4 hours","icon":"🚨","badgeColor":"error"}', 4)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN jobwork_priorities d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

WITH tenants AS (
  SELECT id FROM public.tenants
),
jobwork_statuses AS (
  VALUES
    ('jobwork_status', 'pending', 'Pending', 'Awaiting processing', '{"color":"warning","icon":"📌","badgeColor":"warning"}', 1),
    ('jobwork_status', 'in_progress', 'In Progress', 'Being worked on', '{"color":"processing","icon":"⏳","badgeColor":"processing"}', 2),
    ('jobwork_status', 'completed', 'Completed', 'Work finished', '{"color":"success","icon":"✓","badgeColor":"success"}', 3),
    ('jobwork_status', 'delivered', 'Delivered', 'Delivered to customer', '{"color":"success","icon":"📦","badgeColor":"success"}', 4),
    ('jobwork_status', 'cancelled', 'Cancelled', 'Job cancelled', '{"color":"error","icon":"✕","badgeColor":"error"}', 5)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN jobwork_statuses d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

WITH tenants AS (
  SELECT id FROM public.tenants
),
size_categories AS (
  VALUES
    ('jobwork_size', 'small', 'Small', 'Small size job (0.8x base cost)', '{"multiplier":0.8,"icon":"📦"}', 1),
    ('jobwork_size', 'medium', 'Medium', 'Standard size job (1.0x base cost)', '{"multiplier":1.0,"icon":"📦📦"}', 2),
    ('jobwork_size', 'large', 'Large', 'Large size job (1.5x base cost)', '{"multiplier":1.5,"icon":"📦📦📦"}', 3),
    ('jobwork_size', 'xlarge', 'Extra Large', 'Extra large job (2.0x base cost)', '{"multiplier":2.0,"icon":"📦📦📦📦"}', 4)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN size_categories d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

-- ============================================================================
-- 2. SERVICE CONTRACTS MODULE - Service Types, Statuses
-- ============================================================================

WITH tenants AS (
  SELECT id FROM public.tenants
),
service_types AS (
  VALUES
    ('service_contract_type', 'support', 'Technical Support', 'Ongoing technical support services', '{"icon":"HeadsetIcon","badgeColor":"blue"}', 1),
    ('service_contract_type', 'maintenance', 'Maintenance', 'Regular maintenance and upkeep', '{"icon":"ToolIcon","badgeColor":"cyan"}', 2),
    ('service_contract_type', 'consulting', 'Consulting', 'Professional consulting services', '{"icon":"UserIcon","badgeColor":"purple"}', 3),
    ('service_contract_type', 'training', 'Training', 'Staff training and education', '{"icon":"BookIcon","badgeColor":"green"}', 4),
    ('service_contract_type', 'hosting', 'Hosting', 'Infrastructure hosting services', '{"icon":"ServerIcon","badgeColor":"orange"}', 5),
    ('service_contract_type', 'custom', 'Custom', 'Custom service agreement', '{"icon":"SettingsIcon","badgeColor":"default"}', 6)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN service_types d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

WITH tenants AS (
  SELECT id FROM public.tenants
),
contract_statuses AS (
  VALUES
    ('service_contract_status', 'draft', 'Draft', 'Contract in draft state', '{"color":"default","icon":"EditOutlined","badgeColor":"default"}', 1),
    ('service_contract_status', 'pending_approval', 'Pending Approval', 'Awaiting approval', '{"color":"warning","icon":"ClockCircleOutlined","badgeColor":"warning"}', 2),
    ('service_contract_status', 'active', 'Active', 'Contract is currently active', '{"color":"success","icon":"CheckCircleOutlined","badgeColor":"success"}', 3),
    ('service_contract_status', 'on_hold', 'On Hold', 'Contract temporarily on hold', '{"color":"orange","icon":"PauseCircleOutlined","badgeColor":"warning"}', 4),
    ('service_contract_status', 'completed', 'Completed', 'Contract completed successfully', '{"color":"blue","icon":"CheckCircleOutlined","badgeColor":"processing"}', 5),
    ('service_contract_status', 'cancelled', 'Cancelled', 'Contract cancelled', '{"color":"default","icon":"CloseCircleOutlined","badgeColor":"default"}', 6),
    ('service_contract_status', 'expired', 'Expired', 'Contract has expired', '{"color":"error","icon":"CloseCircleOutlined","badgeColor":"error"}', 7)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN contract_statuses d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

WITH tenants AS (
  SELECT id FROM public.tenants
),
contract_priorities AS (
  VALUES
    ('service_contract_priority', 'low', 'Low', 'Low priority contract', '{"color":"default","icon":"ArrowDownOutlined","badgeColor":"default"}', 1),
    ('service_contract_priority', 'medium', 'Medium', 'Medium priority contract', '{"color":"blue","icon":"MinusOutlined","badgeColor":"processing"}', 2),
    ('service_contract_priority', 'high', 'High', 'High priority contract', '{"color":"orange","icon":"ArrowUpOutlined","badgeColor":"warning"}', 3),
    ('service_contract_priority', 'urgent', 'Urgent', 'Urgent priority contract', '{"color":"red","icon":"ExclamationCircleOutlined","badgeColor":"error"}', 4)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN contract_priorities d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

-- ============================================================================
-- 3. COMPLAINTS MODULE - Types, Priorities, Statuses
-- ============================================================================

WITH tenants AS (
  SELECT id FROM public.tenants
),
complaint_types AS (
  VALUES
    ('complaint_type', 'breakdown', 'Equipment Breakdown', 'Equipment failure or malfunction', '{"icon":"ToolOutlined","badgeColor":"error"}', 1),
    ('complaint_type', 'preventive', 'Preventive Maintenance', 'Scheduled preventive maintenance', '{"icon":"CalendarOutlined","badgeColor":"processing"}', 2),
    ('complaint_type', 'software_update', 'Software Update', 'Software patch or upgrade', '{"icon":"CloudDownloadOutlined","badgeColor":"cyan"}', 3),
    ('complaint_type', 'optimize', 'System Optimization', 'Performance tuning and optimization', '{"icon":"RocketOutlined","badgeColor":"purple"}', 4),
    ('complaint_type', 'quality_issue', 'Quality Issue', 'Product or service quality concern', '{"icon":"ExclamationCircleOutlined","badgeColor":"warning"}', 5),
    ('complaint_type', 'billing', 'Billing Issue', 'Billing or payment concern', '{"icon":"DollarOutlined","badgeColor":"gold"}', 6),
    ('complaint_type', 'other', 'Other', 'Other type of complaint', '{"icon":"QuestionCircleOutlined","badgeColor":"default"}', 7)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN complaint_types d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

WITH tenants AS (
  SELECT id FROM public.tenants
),
complaint_priorities AS (
  VALUES
    ('complaint_priority', 'low', 'Low', 'Low priority complaint (7 day SLA)', '{"color":"default","sla_days":7,"badgeColor":"default"}', 1),
    ('complaint_priority', 'medium', 'Medium', 'Medium priority complaint (3 day SLA)', '{"color":"processing","sla_days":3,"badgeColor":"processing"}', 2),
    ('complaint_priority', 'high', 'High', 'High priority complaint (1 day SLA)', '{"color":"warning","sla_days":1,"badgeColor":"warning"}', 3),
    ('complaint_priority', 'urgent', 'Urgent', 'Urgent complaint (4 hour SLA)', '{"color":"error","sla_hours":4,"badgeColor":"error"}', 4)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN complaint_priorities d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

WITH tenants AS (
  SELECT id FROM public.tenants
),
complaint_statuses AS (
  VALUES
    ('complaint_status', 'open', 'Open', 'Complaint opened, awaiting response', '{"color":"error","icon":"ExclamationCircleOutlined","badgeColor":"error"}', 1),
    ('complaint_status', 'acknowledged', 'Acknowledged', 'Complaint received and acknowledged', '{"color":"warning","icon":"CheckCircleOutlined","badgeColor":"warning"}', 2),
    ('complaint_status', 'investigating', 'Investigating', 'Under investigation', '{"color":"processing","icon":"SearchOutlined","badgeColor":"processing"}', 3),
    ('complaint_status', 'resolved', 'Resolved', 'Issue resolved', '{"color":"success","icon":"CheckCircleOutlined","badgeColor":"success"}', 4),
    ('complaint_status', 'closed', 'Closed', 'Complaint closed', '{"color":"default","icon":"CloseCircleOutlined","badgeColor":"default"}', 5)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN complaint_statuses d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

-- ============================================================================
-- 4. DEALS/LEADS MODULE - Stages, Qualification, Statuses
-- ============================================================================

WITH tenants AS (
  SELECT id FROM public.tenants
),
lead_qualification AS (
  VALUES
    ('lead_qualification', 'new', 'New', 'Newly acquired lead, not yet contacted', '{"badgeColor":"blue","icon":"PlusOutlined"}', 1),
    ('lead_qualification', 'contacted', 'Contacted', 'Initial contact made with lead', '{"badgeColor":"cyan","icon":"PhoneOutlined"}', 2),
    ('lead_qualification', 'qualified', 'Qualified', 'Lead meets qualification criteria', '{"badgeColor":"success","icon":"CheckCircleOutlined"}', 3),
    ('lead_qualification', 'unqualified', 'Unqualified', 'Lead does not meet criteria', '{"badgeColor":"error","icon":"CloseCircleOutlined"}', 4)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN lead_qualification d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

WITH tenants AS (
  SELECT id FROM public.tenants
),
lead_stages AS (
  VALUES
    ('lead_stage', 'awareness', 'Awareness', 'Lead is aware of product/service', '{"funnel_position":1}', 1),
    ('lead_stage', 'interest', 'Interest', 'Lead has shown interest', '{"funnel_position":2}', 2),
    ('lead_stage', 'consideration', 'Consideration', 'Lead is considering options', '{"funnel_position":3}', 3),
    ('lead_stage', 'intent', 'Intent', 'Lead has purchase intent', '{"funnel_position":4}', 4),
    ('lead_stage', 'evaluation', 'Evaluation', 'Lead is evaluating solution', '{"funnel_position":5}', 5),
    ('lead_stage', 'purchase', 'Purchase', 'Ready to purchase', '{"funnel_position":6}', 6)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN lead_stages d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

WITH tenants AS (
  SELECT id FROM public.tenants
),
lead_statuses AS (
  VALUES
    ('lead_status', 'new', 'New', 'New lead', '{"badgeColor":"blue"}', 1),
    ('lead_status', 'contacted', 'Contacted', 'Lead has been contacted', '{"badgeColor":"cyan"}', 2),
    ('lead_status', 'qualified', 'Qualified', 'Qualified lead', '{"badgeColor":"success"}', 3),
    ('lead_status', 'unqualified', 'Unqualified', 'Does not meet criteria', '{"badgeColor":"default"}', 4),
    ('lead_status', 'converted', 'Converted', 'Converted to customer/deal', '{"badgeColor":"success"}', 5),
    ('lead_status', 'lost', 'Lost', 'Lead lost to competitor or no interest', '{"badgeColor":"error"}', 6)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN lead_statuses d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

WITH tenants AS (
  SELECT id FROM public.tenants
),
deal_stages AS (
  VALUES
    ('deal_stage', 'lead', 'Lead', 'Initial lead stage', '{"probability":10,"badgeColor":"blue"}', 1),
    ('deal_stage', 'qualified', 'Qualified', 'Lead qualified and accepted', '{"probability":25,"badgeColor":"cyan"}', 2),
    ('deal_stage', 'proposal', 'Proposal', 'Proposal sent to customer', '{"probability":50,"badgeColor":"processing"}', 3),
    ('deal_stage', 'negotiation', 'Negotiation', 'In negotiation phase', '{"probability":75,"badgeColor":"warning"}', 4),
    ('deal_stage', 'won', 'Won', 'Deal won', '{"probability":100,"badgeColor":"success"}', 5),
    ('deal_stage', 'lost', 'Lost', 'Deal lost', '{"probability":0,"badgeColor":"error"}', 6),
    ('deal_stage', 'cancelled', 'Cancelled', 'Deal cancelled', '{"probability":0,"badgeColor":"default"}', 7)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN deal_stages d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

-- ============================================================================
-- 5. TICKETS MODULE - Priorities, Statuses, Categories
-- ============================================================================

WITH tenants AS (
  SELECT id FROM public.tenants
),
ticket_priorities AS (
  VALUES
    ('ticket_priority', 'low', 'Low', 'Low priority ticket (7 day SLA)', '{"color":"default","sla_days":7,"badgeColor":"default"}', 1),
    ('ticket_priority', 'medium', 'Medium', 'Medium priority ticket (3 day SLA)', '{"color":"processing","sla_days":3,"badgeColor":"processing"}', 2),
    ('ticket_priority', 'high', 'High', 'High priority ticket (1 day SLA)', '{"color":"warning","sla_days":1,"badgeColor":"warning"}', 3),
    ('ticket_priority', 'urgent', 'Urgent', 'Urgent ticket (4 hour SLA)', '{"color":"error","sla_hours":4,"badgeColor":"error"}', 4)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN ticket_priorities d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

WITH tenants AS (
  SELECT id FROM public.tenants
),
ticket_statuses AS (
  VALUES
    ('ticket_status', 'open', 'Open', 'Ticket opened', '{"badgeColor":"error"}', 1),
    ('ticket_status', 'in_progress', 'In Progress', 'Being worked on', '{"badgeColor":"processing"}', 2),
    ('ticket_status', 'pending_customer', 'Pending Customer', 'Awaiting customer response', '{"badgeColor":"warning"}', 3),
    ('ticket_status', 'resolved', 'Resolved', 'Issue resolved', '{"badgeColor":"success"}', 4),
    ('ticket_status', 'closed', 'Closed', 'Ticket closed', '{"badgeColor":"default"}', 5)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN ticket_statuses d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

WITH tenants AS (
  SELECT id FROM public.tenants
),
ticket_categories AS (
  VALUES
    ('ticket_category', 'technical', 'Technical Support', 'Technical issues and bugs', '{"icon":"BugOutlined"}', 1),
    ('ticket_category', 'billing', 'Billing', 'Billing and payment issues', '{"icon":"DollarOutlined"}', 2),
    ('ticket_category', 'feature_request', 'Feature Request', 'New feature suggestions', '{"icon":"BulbOutlined"}', 3),
    ('ticket_category', 'question', 'General Question', 'General inquiries', '{"icon":"QuestionCircleOutlined"}', 4),
    ('ticket_category', 'bug_report', 'Bug Report', 'Software bug reports', '{"icon":"BugOutlined"}', 5),
    ('ticket_category', 'other', 'Other', 'Other issues', '{"icon":"EllipsisOutlined"}', 6)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN ticket_categories d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

-- ============================================================================
-- 6. PRODUCTS MODULE - Statuses
-- ============================================================================

WITH tenants AS (
  SELECT id FROM public.tenants
),
product_statuses AS (
  VALUES
    ('product_status', 'active', 'Active', 'Product is active and available', '{"badgeColor":"success"}', 1),
    ('product_status', 'inactive', 'Inactive', 'Product temporarily unavailable', '{"badgeColor":"default"}', 2),
    ('product_status', 'discontinued', 'Discontinued', 'Product discontinued', '{"badgeColor":"error"}', 3),
    ('product_status', 'out_of_stock', 'Out of Stock', 'Currently out of stock', '{"badgeColor":"warning"}', 4),
    ('product_status', 'coming_soon', 'Coming Soon', 'Product coming soon', '{"badgeColor":"processing"}', 5)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN product_statuses d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

-- Product Units of Measurement
WITH tenants AS (
  SELECT id FROM public.tenants
),
product_units AS (
  VALUES
    ('product_unit', 'piece', 'Piece', 'Individual piece or item', '{"abbr":"pc","emoji":"📦"}', 1),
    ('product_unit', 'box', 'Box', 'Box or package', '{"abbr":"box","emoji":"📦"}', 2),
    ('product_unit', 'carton', 'Carton', 'Carton packaging', '{"abbr":"ctn","emoji":"📦"}', 3),
    ('product_unit', 'kilogram', 'Kilogram', 'Weight in kilograms', '{"abbr":"kg","emoji":"⚖️"}', 4),
    ('product_unit', 'liter', 'Liter', 'Volume in liters', '{"abbr":"L","emoji":"🧴"}', 5),
    ('product_unit', 'meter', 'Meter', 'Length in meters', '{"abbr":"m","emoji":"📏"}', 6),
    ('product_unit', 'set', 'Set', 'Set of items', '{"abbr":"set","emoji":"🎁"}', 7),
    ('product_unit', 'pack', 'Pack', 'Pack or bundle', '{"abbr":"pk","emoji":"📦"}', 8)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN product_units d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

-- ============================================================================
-- 7. USER MANAGEMENT - User Statuses
-- ============================================================================

WITH tenants AS (
  SELECT id FROM public.tenants
),
user_statuses AS (
  VALUES
    ('user_status', 'active', 'Active', 'User is active and can log in', '{"badgeColor":"success","canLogin":true}', 1),
    ('user_status', 'inactive', 'Inactive', 'User is inactive but account retained', '{"badgeColor":"default","canLogin":false}', 2),
    ('user_status', 'suspended', 'Suspended', 'User temporarily suspended', '{"badgeColor":"error","canLogin":false}', 3),
    ('user_status', 'pending', 'Pending', 'User invitation pending acceptance', '{"badgeColor":"warning","canLogin":false}', 4)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN user_statuses d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

-- ============================================================================
-- 8. PRODUCT SALES MODULE - Statuses
-- ============================================================================

WITH tenants AS (
  SELECT id FROM public.tenants
),
product_sale_statuses AS (
  VALUES
    ('product_sale_status', 'new', 'New', 'New product sale', '{"badgeColor":"blue"}', 1),
    ('product_sale_status', 'active', 'Active', 'Active sale/subscription', '{"badgeColor":"success"}', 2),
    ('product_sale_status', 'renewed', 'Renewed', 'Sale renewed', '{"badgeColor":"cyan"}', 3),
    ('product_sale_status', 'expired', 'Expired', 'Sale/subscription expired', '{"badgeColor":"error"}', 4),
    ('product_sale_status', 'cancelled', 'Cancelled', 'Sale cancelled', '{"badgeColor":"default"}', 5)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN product_sale_statuses d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

-- ============================================================================
-- VERIFICATION: Count seeded reference data per tenant
-- ============================================================================

-- ============================================================================
-- 8. CUSTOMER MODULE - Industries, Company Sizes, Customer Types, Statuses
-- ============================================================================

WITH tenants AS (
  SELECT id FROM public.tenants
),
industries AS (
  VALUES
    ('industry', 'general', 'General', 'General business or miscellaneous', '{"icon":"📋"}', 0),
    ('industry', 'technology', 'Technology', 'Software, hardware, and IT services', '{"icon":"💻"}', 1),
    ('industry', 'finance', 'Financial Services', 'Banking, insurance, and fintech', '{"icon":"💰"}', 2),
    ('industry', 'healthcare', 'Healthcare', 'Medical providers and life sciences', '{"icon":"⚕️"}', 3),
    ('industry', 'retail', 'Retail & Consumer', 'Retail stores and consumer brands', '{"icon":"🛍️"}', 4),
    ('industry', 'manufacturing', 'Manufacturing', 'Industrial & manufacturing businesses', '{"icon":"🏭"}', 5),
    ('industry', 'education', 'Education', 'Educational institutions and training', '{"icon":"🎓"}', 6),
    ('industry', 'consulting', 'Consulting', 'Management and business consulting', '{"icon":"📊"}', 7),
    ('industry', 'energy', 'Energy', 'Oil, gas, renewable energy, and utilities', '{"icon":"⚡"}', 8),
    ('industry', 'transportation', 'Transportation & Logistics', 'Shipping, logistics, and transportation', '{"icon":"🚚"}', 9)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN industries d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

WITH tenants AS (
  SELECT id FROM public.tenants
),
company_sizes AS (
  VALUES
    ('company_size', 'startup', 'Startup (1-50 employees)', 'Early-stage teams up to 50 employees', '{"minEmployees":1,"maxEmployees":50}', 1),
    ('company_size', 'small', 'Small Business (51-200 employees)', 'Growing companies with 51-200 employees', '{"minEmployees":51,"maxEmployees":200}', 2),
    ('company_size', 'medium', 'Medium Enterprise (201-1000 employees)', 'Established companies with 201-1000 employees', '{"minEmployees":201,"maxEmployees":1000}', 3),
    ('company_size', 'large', 'Large Enterprise (1001-5000 employees)', 'Large enterprises with 1001-5000 employees', '{"minEmployees":1001,"maxEmployees":5000}', 4),
    ('company_size', 'enterprise', 'Enterprise (5000+ employees)', 'Global enterprises with 5000+ employees', '{"minEmployees":5001}', 5)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN company_sizes d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

WITH tenants AS (
  SELECT id FROM public.tenants
),
customer_types AS (
  VALUES
    ('customer_type', 'business', 'Business', 'B2B customers and organizations', '{"icon":"🏢","emoji":"🏢"}', 1),
    ('customer_type', 'individual', 'Individual', 'B2C customers and consumers', '{"icon":"👤","emoji":"👤"}', 2),
    ('customer_type', 'corporate', 'Corporate', 'Large corporate organizations', '{"icon":"🏛️","emoji":"🏛️"}', 3),
    ('customer_type', 'government', 'Government', 'Government agencies and entities', '{"icon":"🏛️","emoji":"🏛️"}', 4)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN customer_types d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

WITH tenants AS (
  SELECT id FROM public.tenants
),
customer_statuses AS (
  VALUES
    ('customer_status', 'active', 'Active', 'Currently engaged customer', '{"emoji":"✅","badgeColor":"green","color":"#4CAF50"}', 1),
    ('customer_status', 'inactive', 'Inactive', 'Dormant customer with no recent activity', '{"emoji":"❌","badgeColor":"default","color":"#9E9E9E"}', 2),
    ('customer_status', 'prospect', 'Prospect', 'Pre-sales prospect under evaluation', '{"emoji":"⏳","badgeColor":"blue","color":"#FFA500"}', 3),
    ('customer_status', 'suspended', 'Suspended', 'Temporarily blocked due to issues', '{"emoji":"🛑","badgeColor":"red","color":"#F44336"}', 4)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN customer_statuses d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

WITH tenants AS (
  SELECT id FROM public.tenants
),
lead_sources AS (
  VALUES
    ('lead_source', 'referral', 'Referral', 'Brought in by an existing contact or client', '{"emoji":"👥","icon":"Users"}', 1),
    ('lead_source', 'website', 'Website', 'Captured from corporate website or landing page', '{"emoji":"🌐","icon":"Globe"}', 2),
    ('lead_source', 'sales_team', 'Sales Team', 'Direct outreach by sales representatives', '{"emoji":"📞","icon":"Phone"}', 3),
    ('lead_source', 'event', 'Event', 'Generated from marketing events or webinars', '{"emoji":"🎯","icon":"Target"}', 4),
    ('lead_source', 'other', 'Other', 'Other sources not categorized', '{"emoji":"📋","icon":"MoreHorizontal"}', 5)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN lead_sources d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

WITH tenants AS (
  SELECT id FROM public.tenants
),
lead_ratings AS (
  VALUES
    ('lead_rating', 'cold', 'Cold Lead', 'Low-engagement lead requiring long-term follow-up', '{"emoji":"❄️","icon":"Snowflake","weight":1}', 1),
    ('lead_rating', 'warm', 'Warm Lead', 'Engaged lead that needs nurturing', '{"emoji":"☀️","icon":"Sun","weight":2}', 2),
    ('lead_rating', 'hot', 'Hot Lead', 'High-intent lead ready for conversion', '{"emoji":"🔥","icon":"Flame","weight":3}', 3)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN lead_ratings d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

-- ============================================================================
-- 9. DEALS/LEADS MODULE - Qualification, Stage, Status
-- ============================================================================

WITH tenants AS (
  SELECT id FROM public.tenants
),
lead_qualifications AS (
  VALUES
    ('lead_qualification', 'unqualified', 'Unqualified', 'Lead not yet qualified', '{"color":"#9E9E9E","emoji":"❓"}', 1),
    ('lead_qualification', 'qualified', 'Qualified', 'Lead meets qualification criteria', '{"color":"#4CAF50","emoji":"✅"}', 2),
    ('lead_qualification', 'disqualified', 'Disqualified', 'Lead does not meet criteria', '{"color":"#F44336","emoji":"❌"}', 3)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN lead_qualifications d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

WITH tenants AS (
  SELECT id FROM public.tenants
),
lead_stages AS (
  VALUES
    ('lead_stage', 'new', 'New', 'New lead in the pipeline', '{"color":"#2196F3","emoji":"🆕"}', 1),
    ('lead_stage', 'contacted', 'Contacted', 'Initial contact made', '{"color":"#03A9F4","emoji":"📞"}', 2),
    ('lead_stage', 'qualified', 'Qualified', 'Lead qualified and validated', '{"color":"#8BC34A","emoji":"✅"}', 3),
    ('lead_stage', 'proposal', 'Proposal Sent', 'Proposal or quote sent', '{"color":"#FF9800","emoji":"📄"}', 4),
    ('lead_stage', 'negotiation', 'Negotiation', 'In negotiation phase', '{"color":"#FFC107","emoji":"💬"}', 5),
    ('lead_stage', 'closed_won', 'Closed - Won', 'Deal closed successfully', '{"color":"#4CAF50","emoji":"🎉"}', 6),
    ('lead_stage', 'closed_lost', 'Closed - Lost', 'Deal lost to competitor or dropped', '{"color":"#F44336","emoji":"❌"}', 7)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN lead_stages d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

WITH tenants AS (
  SELECT id FROM public.tenants
),
lead_statuses AS (
  VALUES
    ('lead_status', 'open', 'Open', 'Lead is open and active', '{"color":"#2196F3","emoji":"📂"}', 1),
    ('lead_status', 'in_progress', 'In Progress', 'Lead is being actively worked', '{"color":"#FF9800","emoji":"⏳"}', 2),
    ('lead_status', 'converted', 'Converted', 'Lead converted to customer', '{"color":"#4CAF50","emoji":"✅"}', 3),
    ('lead_status', 'closed', 'Closed', 'Lead closed (won or lost)', '{"color":"#9E9E9E","emoji":"🔒"}', 4)
)
INSERT INTO public.reference_data (id, tenant_id, category, key, label, description, metadata, sort_order, is_active, created_at, updated_at)
SELECT uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, d.column5::jsonb, d.column6, true, NOW(), NOW()
FROM tenants t CROSS JOIN lead_statuses d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);

-- ============================================================================
-- VERIFICATION: Count seeded reference data per tenant
-- ============================================================================

DO $$
DECLARE
  tenant_record RECORD;
  category_count INTEGER;
BEGIN
  FOR tenant_record IN SELECT id, name FROM public.tenants LOOP
    SELECT COUNT(DISTINCT category) INTO category_count
    FROM public.reference_data
    WHERE tenant_id = tenant_record.id;
    
    RAISE NOTICE 'Tenant: % - Reference Data Categories: %', tenant_record.name, category_count;
  END LOOP;
END $$;
