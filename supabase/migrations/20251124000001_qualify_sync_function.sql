-- Ensure the sync trigger function references schema-qualified tables
-- This avoids "relation \"tenants\" does not exist" errors when search_path differs

CREATE OR REPLACE FUNCTION public.sync_auth_user_to_public_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
DECLARE
  user_tenant_id UUID;
  role_name TEXT;
  user_name TEXT;
  is_super_admin_flag BOOLEAN;
BEGIN
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );

  is_super_admin_flag := (
    NEW.email LIKE '%superadmin%' OR
    NEW.email LIKE '%@platform.com' OR
    NEW.email LIKE '%@platform.%'
  );

  IF is_super_admin_flag THEN
    user_tenant_id := NULL;
    role_name := 'super_admin';
  ELSE
    SELECT id INTO user_tenant_id
    FROM public.tenants
    WHERE name = (
      CASE
        WHEN NEW.email LIKE '%@acme.com' OR NEW.email LIKE '%@acme.%' THEN 'Acme Corporation'
        WHEN NEW.email LIKE '%@techsolutions.com' OR NEW.email LIKE '%@techsolutions.%' THEN 'Tech Solutions Inc'
        WHEN NEW.email LIKE '%@globaltrading.com' OR NEW.email LIKE '%@globaltrading.%' THEN 'Global Trading Ltd'
        ELSE NULL
      END
    )
    LIMIT 1;

    IF user_tenant_id IS NULL THEN
      SELECT id INTO user_tenant_id FROM public.tenants ORDER BY created_at LIMIT 1;
    END IF;

    role_name := CASE
      WHEN NEW.email LIKE '%admin%' THEN 'Administrator'
      WHEN NEW.email LIKE '%manager%' THEN 'Manager'
      WHEN NEW.email LIKE '%engineer%' THEN 'Engineer'
      WHEN NEW.email LIKE '%customer%' THEN 'Customer'
      ELSE 'User'
    END;
  END IF;

  INSERT INTO public.users (
    id,
    email,
    name,
    first_name,
    last_name,
    status,
    tenant_id,
    is_super_admin,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    split_part(user_name, ' ', 1),
    CASE
      WHEN array_length(string_to_array(user_name, ' '), 1) > 1
      THEN array_to_string((string_to_array(user_name, ' '))[2:], ' ')
      ELSE NULL
    END,
    'active'::public.user_status,
    user_tenant_id,
    is_super_admin_flag,
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW())
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    status = EXCLUDED.status,
    tenant_id = EXCLUDED.tenant_id,
    is_super_admin = EXCLUDED.is_super_admin,
    updated_at = NOW();

  INSERT INTO public.user_roles (user_id, role_id, tenant_id, assigned_at)
  SELECT
    NEW.id,
    r.id,
    user_tenant_id,
    NOW()
  FROM public.roles r
  WHERE r.name = role_name
    AND (r.tenant_id = user_tenant_id OR (user_tenant_id IS NULL AND r.tenant_id IS NULL))
  ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Recreate trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE
  ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_auth_user_to_public_user();
