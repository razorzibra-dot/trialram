-- Check what the auth JWT contains
SELECT 
  auth.role() as current_role,
  auth.uid() as current_user_id,
  auth.jwt() as full_jwt,
  auth.jwt() ->> 'tenant_id' as tenant_id_from_jwt;

-- Check the users table
SELECT id, email, tenant_id, role, is_super_admin FROM users LIMIT 5;

-- Test the RLS policy condition
SELECT 
  id, 
  tenant_id, 
  category, 
  label,
  (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid) as policy_passes
FROM reference_data 
WHERE category IN ('industry', 'company_size')
LIMIT 5;
