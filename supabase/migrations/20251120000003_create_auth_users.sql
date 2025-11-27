-- ============================================================================
-- Migration: Create auth users for local development
-- Date: 2025-11-20
-- Purpose: Create users in auth.users table to enable login functionality
-- Note: Password is 'password123' for all users (bcrypt hash)
-- ============================================================================

-- Enable pgcrypto for password hashing (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert auth users with matching IDs from public.users
-- Password hash for 'password123' using bcrypt
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES
    -- Acme Corporation users
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '6e084750-4e35-468c-9903-5b5ab9d14af4'::uuid,
        'authenticated',
        'authenticated',
        'admin@acme.com',
        crypt('password123', gen_salt('bf', 8)),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"name": "Admin Acme"}'::jsonb,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '2707509b-57e8-4c84-a6fe-267eaa724223'::uuid,
        'authenticated',
        'authenticated',
        'manager@acme.com',
        crypt('password123', gen_salt('bf', 8)),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"name": "Manager Acme"}'::jsonb,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '27ff37b5-ef55-4e34-9951-42f35a1b2506'::uuid,
        'authenticated',
        'authenticated',
        'engineer@acme.com',
        crypt('password123', gen_salt('bf', 8)),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"name": "Engineer Acme"}'::jsonb,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '3ce006ad-3a2b-45b8-b540-4b8634d0e410'::uuid,
        'authenticated',
        'authenticated',
        'user@acme.com',
        crypt('password123', gen_salt('bf', 8)),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"name": "User Acme"}'::jsonb,
        NOW(),
        NOW()
    ),

    -- Tech Solutions users
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '945ab101-36c0-4ef1-9e12-9d13294deb46'::uuid,
        'authenticated',
        'authenticated',
        'admin@techsolutions.com',
        crypt('password123', gen_salt('bf', 8)),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"name": "Admin Tech"}'::jsonb,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '4fe9bb56-c5cd-481b-bc7d-2275d7f3ebaf'::uuid,
        'authenticated',
        'authenticated',
        'manager@techsolutions.com',
        crypt('password123', gen_salt('bf', 8)),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"name": "Manager Tech"}'::jsonb,
        NOW(),
        NOW()
    ),

    -- Global Trading users
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        'de2b56b8-bffc-4a54-b1f4-4a058afe5c5f'::uuid,
        'authenticated',
        'authenticated',
        'admin@globaltrading.com',
        crypt('password123', gen_salt('bf', 8)),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"name": "Admin Global"}'::jsonb,
        NOW(),
        NOW()
    ),

    -- Super admin users
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '465f34f1-e33c-475b-b42d-4feb4feaaf92'::uuid,
        'authenticated',
        'authenticated',
        'superadmin@platform.com',
        crypt('password123', gen_salt('bf', 8)),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"name": "Platform Super Admin"}'::jsonb,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '5782d9ca-ef99-4f57-b9e2-2463d2fbb637'::uuid,
        'authenticated',
        'authenticated',
        'superadmin2@platform.com',
        crypt('password123', gen_salt('bf', 8)),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"name": "Limited Super Admin"}'::jsonb,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        'cad16f39-88a0-47c0-826d-bc84ebe59384'::uuid,
        'authenticated',
        'authenticated',
        'superadmin3@platform.com',
        crypt('password123', gen_salt('bf', 8)),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"name": "Read-Only Super Admin"}'::jsonb,
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show created auth users
SELECT id, email, raw_user_meta_data->>'name' as name, created_at
FROM auth.users
WHERE email LIKE '%@%'
ORDER BY email;