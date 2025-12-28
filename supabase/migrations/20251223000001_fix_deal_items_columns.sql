-- Fix deal RPC functions to match actual database schema
-- Remove non-existent columns: discount_type, tax_rate, service_id, duration, notes from deal_items
-- Remove non-existent column: assigned_to_name from deals

-- Drop and recreate create_deal_with_items function with correct columns
CREATE OR REPLACE FUNCTION public.create_deal_with_items(p_json json, p_tenant uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deal_id uuid;
  v_items json;
BEGIN
  -- Insert deal and capture generated id
  INSERT INTO public.deals (
    tenant_id, title, description, customer_id, value, currency, status,
    deal_type, source, campaign, close_date, expected_close_date, assigned_to,
    notes, tags, competitor_info, win_loss_reason, opportunity_id,
    contract_id, converted_to_order_id, converted_to_contract_id, created_at, updated_at, created_by
  )
  SELECT
    p_tenant,
    p_json->>'title',
    p_json->>'description',
    NULLIF(p_json->>'customer_id','')::uuid,
    NULLIF(p_json->>'value','')::numeric,
    COALESCE(p_json->>'currency','USD'),
    p_json->>'status',
    p_json->>'dealType',
    p_json->>'source',
    p_json->>'campaign',
    NULLIF(p_json->>'close_date','')::timestamptz,
    NULLIF(p_json->>'expected_close_date','')::timestamptz,
    NULLIF(p_json->>'assigned_to','')::uuid,
    p_json->>'notes',
    CASE WHEN p_json->>'tags' IS NULL THEN NULL ELSE string_to_array(p_json->>'tags', ',') END,
    p_json->>'competitor_info',
    p_json->>'win_loss_reason',
    NULLIF(p_json->>'opportunity_id','')::uuid,
    NULLIF(p_json->>'contract_id','')::uuid,
    NULLIF(p_json->>'converted_to_order_id','')::uuid,
    NULLIF(p_json->>'converted_to_contract_id','')::uuid,
    now(), now(), NULLIF(p_json->>'created_by','')::uuid
  RETURNING id INTO v_deal_id;

  -- Insert items if provided
  -- ✅ FIXED: Only include columns that exist in deal_items table:
  --    id, deal_id, product_id, product_name, product_description,
  --    quantity, unit_price, discount, tax, line_total, tenant_id, created_at, updated_at
  v_items := p_json->'items';
  IF v_items IS NOT NULL THEN
    INSERT INTO public.deal_items (
      deal_id, product_id, product_name, product_description, quantity, unit_price,
      discount, tax, line_total,
      tenant_id, created_at, updated_at
    )
    SELECT
      v_deal_id,
      NULLIF(item->>'product_id','')::uuid,
      item->>'product_name',
      item->>'product_description',
      NULLIF(item->>'quantity','')::int,
      NULLIF(item->>'unit_price','')::numeric,
      COALESCE(NULLIF(item->>'discount','')::numeric, 0),
      COALESCE(NULLIF(item->>'tax','')::numeric, 0),
      NULLIF(item->>'line_total','')::numeric,
      p_tenant,
      now(), now()
    FROM json_array_elements(v_items) AS item;
  END IF;

  RETURN v_deal_id;
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- Drop and recreate update_deal_with_items function with correct columns
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
  -- ✅ FIXED: Removed assigned_to_name - column was dropped from deals table
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
    tags = CASE WHEN p_json->>'tags' IS NULL THEN tags ELSE string_to_array(p_json->>'tags', ',') END,
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

  -- If items provided, delete existing items for this deal and re-insert
  -- ✅ FIXED: Only include columns that exist in deal_items table
  v_items := p_json->'items';
  IF v_items IS NOT NULL THEN
    DELETE FROM public.deal_items WHERE deal_id = v_deal_id AND tenant_id = p_tenant;

    INSERT INTO public.deal_items (
      deal_id, product_id, product_name, product_description, quantity, unit_price,
      discount, tax, line_total,
      tenant_id, created_at, updated_at
    )
    SELECT
      v_deal_id,
      NULLIF(item->>'product_id','')::uuid,
      item->>'product_name',
      item->>'product_description',
      NULLIF(item->>'quantity','')::int,
      NULLIF(item->>'unit_price','')::numeric,
      COALESCE(NULLIF(item->>'discount','')::numeric, 0),
      COALESCE(NULLIF(item->>'tax','')::numeric, 0),
      NULLIF(item->>'line_total','')::numeric,
      p_tenant,
      now(), now()
    FROM json_array_elements(v_items) AS item;
  END IF;

  RETURN v_deal_id;
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;
