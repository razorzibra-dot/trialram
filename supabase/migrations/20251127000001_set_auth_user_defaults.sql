-- Migration: set safe defaults for auth.users token/string fields
-- Ensures GoTrue won't fail when scanning NULL string columns by using empty-string defaults

BEGIN;

-- Clean up existing NULLs for seeded or legacy rows
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change = COALESCE(email_change, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, '')
WHERE
  confirmation_token IS NULL
  OR recovery_token IS NULL
  OR email_change_token_new IS NULL
  OR email_change_token_current IS NULL
  OR email_change IS NULL
  OR reauthentication_token IS NULL
  OR phone_change IS NULL
  OR phone_change_token IS NULL;

-- Add safe defaults for future inserts
-- Only attempt to ALTER the table if this session user owns the table.
DO $$
DECLARE
  owner_name TEXT;
BEGIN
  SELECT pg_catalog.pg_get_userbyid(c.relowner) INTO owner_name
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'auth' AND c.relname = 'users';

  IF owner_name = current_user THEN
    EXECUTE $sql$ALTER TABLE auth.users ALTER COLUMN confirmation_token SET DEFAULT '';$sql$;
    EXECUTE $sql$ALTER TABLE auth.users ALTER COLUMN recovery_token SET DEFAULT '';$sql$;
    EXECUTE $sql$ALTER TABLE auth.users ALTER COLUMN email_change_token_new SET DEFAULT '';$sql$;
    EXECUTE $sql$ALTER TABLE auth.users ALTER COLUMN email_change_token_current SET DEFAULT '';$sql$;
    EXECUTE $sql$ALTER TABLE auth.users ALTER COLUMN email_change SET DEFAULT '';$sql$;
    EXECUTE $sql$ALTER TABLE auth.users ALTER COLUMN reauthentication_token SET DEFAULT '';$sql$;
    EXECUTE $sql$ALTER TABLE auth.users ALTER COLUMN phone_change SET DEFAULT '';$sql$;
    EXECUTE $sql$ALTER TABLE auth.users ALTER COLUMN phone_change_token SET DEFAULT '';$sql$;
  ELSE
    RAISE NOTICE 'Skipping ALTER TABLE auth.users (owner: % , current_user: %)', owner_name, current_user;
  END IF;
END;
$$;

COMMIT;
