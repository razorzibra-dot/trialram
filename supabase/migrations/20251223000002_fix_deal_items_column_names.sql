-- ============================================================================
-- MIGRATION: Fix Deal Items Column Names in RPC Functions
-- Date: December 23, 2025
-- 
-- CRITICAL FIX: The deal_items table uses these column names:
--   - discount_amount (not discount)
--   - discount_percentage (not discount_type)
--   - tax_amount (not tax)
--   - tax_percentage (not tax_rate)
--   - description (not product_description)
--   - service_id (optional for service deals)
--
-- This migration recreates the RPC functions with correct column mappings.
-- ============================================================================

BEGIN;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.create_deal_with_items(json, uuid);
DROP FUNCTION IF EXISTS public.update_deal_with_items(json, uuid);

-- Recreate create_deal_with_items with correct column names
CREATE OR REPLACE FUNCTION public.create_deal_with_items(p_json json, p_tenant uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deal_id uuid := NULL;
  v_items json;
  v_title varchar;
  v_close_date date;
  v_customer_id uuid;
  v_assigned_to uuid;
  v_value numeric;
BEGIN
  -- Extract and validate required fields
  v_title := COALESCE(NULLIF(trim(p_json->>'title'), ''), 'Untitled Deal');
  
  -- Support both snake_case and camelCase (defensive)
  v_customer_id := COALESCE(
    NULLIF(p_json->>'customer_id','')::uuid,
    NULLIF(p_json->>'customerId','')::uuid
  );
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'customer_id is required';
  END IF;

  v_assigned_to := COALESCE(
    NULLIF(p_json->>'assigned_to','')::uuid,
    NULLIF(p_json->>'assignedTo','')::uuid,
    NULLIF(p_json->>'created_by','')::uuid
  );
  IF v_assigned_to IS NULL THEN
    RAISE EXCEPTION 'assigned_to is required';
  END IF;

  v_value := COALESCE(NULLIF(p_json->>'value','')::numeric, 0);

  v_close_date := COALESCE(
    NULLIF(p_json->>'close_date','')::date,
    CURRENT_DATE
  );
  
  -- Insert deal row with all provided fields
  INSERT INTO public.deals (
    title, description, customer_id, value, currency, status, source, campaign,
    close_date, expected_close_date, assigned_to, notes, tags, competitor_info,
    win_loss_reason, opportunity_id, contract_id, converted_to_order_id,
    converted_to_contract_id, deal_type, tenant_id, created_at, updated_at, created_by
  ) VALUES (
    v_title,
    p_json->>'description',
    v_customer_id,
    v_value,
    COALESCE(p_json->>'currency', 'INR'),
    COALESCE(p_json->>'status', 'draft'), 
    p_json->>'source', 
    p_json->>'campaign',
    v_close_date,
    NULLIF(p_json->>'expected_close_date','')::date,
    v_assigned_to,
    p_json->>'notes',
    CASE WHEN p_json->>'tags' IS NOT NULL THEN to_jsonb(string_to_array(p_json->>'tags', ',')) ELSE '[]'::jsonb END,
    p_json->>'competitor_info',
    p_json->>'win_loss_reason',
    NULLIF(p_json->>'opportunity_id','')::uuid,
    NULLIF(p_json->>'contract_id','')::uuid,
    NULLIF(p_json->>'converted_to_order_id','')::uuid,
    NULLIF(p_json->>'converted_to_contract_id','')::uuid,
    COALESCE(p_json->>'deal_type', 'PRODUCT'),
    p_tenant,
    now(), now(), NULLIF(p_json->>'created_by','')::uuid
  )
  RETURNING id INTO v_deal_id;

  -- Insert items if provided (map to correct column names)
  v_items := p_json->'items';
  IF v_items IS NOT NULL THEN
    INSERT INTO public.deal_items (
      deal_id, product_id, service_id, product_name, description, 
      quantity, unit_price, discount_amount, discount_percentage,
      tax_amount, tax_percentage, line_total,
      tenant_id, created_at, updated_at, created_by, updated_by
    )
    SELECT
      v_deal_id,
      NULLIF(item->>'product_id','')::uuid,
      NULLIF(item->>'service_id','')::uuid,
      item->>'product_name',
      item->>'product_description', -- Frontend sends product_description, map to description
      NULLIF(item->>'quantity','')::int,
      NULLIF(item->>'unit_price','')::numeric,
      -- Map discount based on discount_type
      CASE 
        WHEN item->>'discount_type' = 'fixed' THEN COALESCE(NULLIF(item->>'discount','')::numeric, 0)
        ELSE 0
      END,
      CASE 
        WHEN item->>'discount_type' = 'percentage' THEN COALESCE(NULLIF(item->>'discount','')::numeric, 0)
        ELSE 0
      END,
      COALESCE(NULLIF(item->>'tax','')::numeric, 0), -- Map tax to tax_amount
      COALESCE(NULLIF(item->>'tax_rate','')::numeric, 0), -- Map tax_rate to tax_percentage
      NULLIF(item->>'line_total','')::numeric,
      p_tenant,
      now(), now(),
      NULLIF(p_json->>'created_by','')::uuid,
      NULLIF(p_json->>'created_by','')::uuid
    FROM json_array_elements(v_items) AS item;
  END IF;

  RETURN v_deal_id;
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- Recreate update_deal_with_items with correct column names
CREATE OR REPLACE FUNCTION public.update_deal_with_items(p_json json, p_tenant uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deal_id uuid := NULL;
  v_items json;
BEGIN
  -- Require id
  IF p_json->>'id' IS NULL THEN
    RAISE EXCEPTION 'id is required';
  END IF;

  v_deal_id := (p_json->>'id')::uuid;

  -- Update allowed fields on deals (only fields provided)
  UPDATE public.deals SET
    title = COALESCE(NULLIF(p_json->>'title',''), title),
    description = COALESCE(NULLIF(p_json->>'description',''), description),
    customer_id = COALESCE(NULLIF(p_json->>'customer_id','')::uuid, customer_id),
    value = COALESCE(NULLIF(p_json->>'value','')::numeric, value),
    currency = COALESCE(p_json->>'currency', currency),
    status = COALESCE(p_json->>'status', status),
    source = COALESCE(p_json->>'source', source),
    campaign = COALESCE(p_json->>'campaign', campaign),
    close_date = COALESCE(NULLIF(p_json->>'close_date','')::timestamptz, close_date),
    expected_close_date = COALESCE(NULLIF(p_json->>'expected_close_date','')::timestamptz, expected_close_date),
    assigned_to = COALESCE(NULLIF(p_json->>'assigned_to','')::uuid, assigned_to),
    notes = COALESCE(p_json->>'notes', notes),
    tags = CASE WHEN p_json->>'tags' IS NULL THEN tags ELSE to_jsonb(string_to_array(p_json->>'tags', ',')) END,
    competitor_info = COALESCE(p_json->>'competitor_info', competitor_info),
    win_loss_reason = COALESCE(p_json->>'win_loss_reason', win_loss_reason),
    opportunity_id = COALESCE(NULLIF(p_json->>'opportunity_id','')::uuid, opportunity_id),
    contract_id = COALESCE(NULLIF(p_json->>'contract_id','')::uuid, contract_id),
    converted_to_order_id = COALESCE(NULLIF(p_json->>'converted_to_order_id','')::uuid, converted_to_order_id),
    converted_to_contract_id = COALESCE(NULLIF(p_json->>'converted_to_contract_id','')::uuid, converted_to_contract_id),
    updated_at = now()
  WHERE id = v_deal_id AND tenant_id = p_tenant;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deal not found or not in tenant';
  END IF;

  -- If items provided, delete existing items for this deal and re-insert (with correct column names)
  v_items := p_json->'items';
  IF v_items IS NOT NULL THEN
    DELETE FROM public.deal_items WHERE deal_id = v_deal_id AND tenant_id = p_tenant;

    INSERT INTO public.deal_items (
      deal_id, product_id, service_id, product_name, description,
      quantity, unit_price, discount_amount, discount_percentage,
      tax_amount, tax_percentage, line_total,
      tenant_id, created_at, updated_at, created_by, updated_by
    )
    SELECT
      v_deal_id,
      NULLIF(item->>'product_id','')::uuid,
      NULLIF(item->>'service_id','')::uuid,
      item->>'product_name',
      item->>'product_description', -- Frontend sends product_description, map to description
      NULLIF(item->>'quantity','')::int,
      NULLIF(item->>'unit_price','')::numeric,
      -- Map discount based on discount_type
      CASE 
        WHEN item->>'discount_type' = 'fixed' THEN COALESCE(NULLIF(item->>'discount','')::numeric, 0)
        ELSE 0
      END,
      CASE 
        WHEN item->>'discount_type' = 'percentage' THEN COALESCE(NULLIF(item->>'discount','')::numeric, 0)
        ELSE 0
      END,
      COALESCE(NULLIF(item->>'tax','')::numeric, 0), -- Map tax to tax_amount
      COALESCE(NULLIF(item->>'tax_rate','')::numeric, 0), -- Map tax_rate to tax_percentage
      NULLIF(item->>'line_total','')::numeric,
      p_tenant,
      now(), now(),
      NULLIF(p_json->>'updated_by','')::uuid,
      NULLIF(p_json->>'updated_by','')::uuid
    FROM json_array_elements(v_items) AS item;
  END IF;

  RETURN v_deal_id;
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

COMMIT;
