-- Script to create a test provider account
-- This script creates both an auth user and a prestataire profile

-- Step 1: Create the auth user
-- Note: You need to run this in Supabase SQL Editor
-- The password will be hashed automatically

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token,
  email_change,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  is_sso_user
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test.provider@example.com',
  crypt('Provider@123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  false
)
ON CONFLICT DO NOTHING;

-- Step 2: Get the user ID we just created
-- Then create the prestataire profile

WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'test.provider@example.com' LIMIT 1
)
INSERT INTO prestataires (
  user_id,
  full_name,
  profession,
  bio,
  rating,
  verified,
  documents_verified,
  created_at
)
SELECT
  new_user.id,
  'Test Provider',
  'Electrician',
  'Professional service provider',
  4.5,
  true,
  false,
  now()
FROM new_user
ON CONFLICT DO NOTHING;

-- Verify the creation
SELECT 
  u.id,
  u.email,
  p.full_name,
  p.profession,
  p.verified
FROM auth.users u
LEFT JOIN prestataires p ON u.id = p.user_id
WHERE u.email = 'test.provider@example.com';
