-- Fix the search_path for the sync_auth_user_to_public_user function
-- This ensures the function can find the public.tenants table when called by Gotrue

ALTER FUNCTION public.sync_auth_user_to_public_user() SET search_path = public;
