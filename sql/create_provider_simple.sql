-- Simple script to create a prestataire profile
-- This assumes the user already exists in auth.users
-- Use this AFTER creating the user via Supabase Auth UI

-- Step 1: Create prestataire profile for existing user
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
  u.id,
  'Test Provider',
  'Electrician',
  'Professional service provider',
  4.5,
  true,
  false,
  now()
FROM auth.users u
WHERE u.email = 'test.provider@example.com'
ON CONFLICT (user_id) DO UPDATE SET updated_at = now();

-- Step 2: Verify the creation
SELECT 
  u.id as user_id,
  u.email,
  p.full_name,
  p.profession,
  p.verified,
  p.created_at
FROM auth.users u
LEFT JOIN prestataires p ON u.id = p.user_id
WHERE u.email = 'test.provider@example.com';
