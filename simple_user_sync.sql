-- ============================================================================
-- Simple User Sync Script for bc6f3ba0-e1c8-436d-9256+4c43c1aca337
-- Run this in Supabase SQL Editor to manually sync the problematic user
-- ============================================================================

-- Simple upsert for the specific user
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
  updated_at,
  last_login
) 
SELECT 
  'bc6f3ba0-e1c8-436d-9256+4c43c1aca337'::UUID,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'display_name',
    split_part(au.email, '@', 1)
  ),
  split_part(
    COALESCE(
      au.raw_user_meta_data->>'name',
      au.raw_user_meta_data->>'display_name',
      split_part(au.email, '@', 1)
    ),
    ' ',
    1
  ),
  CASE 
    WHEN array_length(
      string_to_array(
        COALESCE(
          au.raw_user_meta_data->>'name',
          au.raw_user_meta_data->>'display_name',
          split_part(au.email, '@', 1)
        ),
        ' '
      ),
      1
    ) > 1 
    THEN array_to_string(
      (string_to_array(
        COALESCE(
          au.raw_user_meta_data->>'name',
          au.raw_user_meta_data->>'display_name',
          split_part(au.email, '@', 1)
        ),
        ' '
      ))[2:],
      ' '
    )
    ELSE NULL
  END,
  'active'::user_status,
  NULL, -- Set to appropriate tenant_id if needed
  FALSE, -- Set to TRUE if this is a super admin
  COALESCE(au.created_at, NOW()),
  COALESCE(au.updated_at, NOW()),
  NULL
FROM auth.users au
WHERE au.id = 'bc6f3ba0-e1c8-436d-9256+4c43c1aca337'
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

-- Verify the sync
SELECT 
  'User synced successfully!' as result,
  u.id,
  u.email,
  u.name,
  u.tenant_id,
  u.is_super_admin,
  u.status
FROM public.users u
WHERE u.id = 'bc6f3ba0-e1c8-436d-9256+4c43c1aca337';