-- Quick script to create a test provider
-- Run this in Supabase SQL Editor
-- This uses Supabase's built-in auth functions

-- Step 1: Create auth user using Supabase function
SELECT auth.uid() as current_user;

-- Step 2: Create prestataire profile
-- First, get or create the user via Supabase Auth
-- Then create the prestataire record

-- Simple approach: Insert directly into prestataires
-- Assuming the user already exists in auth.users

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

-- Show the created provider
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
