-- ============================================
-- Create Admin Account for KaziPro
-- ============================================
-- Run this script in Supabase SQL Editor to create the admin account

-- Step 1: Create the admin user in auth.users
-- Note: You need to do this via Supabase Dashboard UI for security
-- Email: admin@kazipro.com
-- Password: Admin@123456

-- Step 2: After creating the auth user, run this to create the client profile
-- This will automatically find the admin user by email

INSERT INTO clients (user_id, full_name, address, city, verified)
SELECT 
  id,
  'Admin KaziPro',
  'Kinshasa',
  'Kinshasa',
  true
FROM auth.users
WHERE email = 'admin@kazipro.com'
AND NOT EXISTS (
  SELECT 1 FROM clients WHERE user_id = auth.users.id
);

-- Step 3: Verify the admin account was created
SELECT id, user_id, full_name, verified, created_at
FROM clients
WHERE full_name = 'Admin KaziPro';

-- ============================================
-- Alternative: Create via Supabase Dashboard
-- ============================================
-- 1. Go to Supabase Dashboard
-- 2. Navigate to Authentication > Users
-- 3. Click "Add user"
-- 4. Enter:
--    - Email: admin@kazipro.com
--    - Password: Admin@123456
--    - Auto generate password: OFF
-- 5. Click "Create user"
-- 6. Run the INSERT statement above (it will find the user automatically)

-- ============================================
-- Test Accounts (Optional)
-- ============================================

-- Create test client account
-- First create auth user via Dashboard:
-- Email: client@test.com
-- Password: Client@123456

-- Then run:
INSERT INTO clients (user_id, full_name, address, city, verified)
SELECT 
  id,
  'Test Client',
  'Kinshasa',
  'Kinshasa',
  true
FROM auth.users
WHERE email = 'client@test.com'
AND NOT EXISTS (
  SELECT 1 FROM clients WHERE user_id = auth.users.id
);

-- Create test provider account
-- First create auth user via Dashboard:
-- Email: provider@test.com
-- Password: Provider@123456

-- Then run:
INSERT INTO prestataires (user_id, full_name, profession, verified)
SELECT 
  id,
  'Test Provider',
  'Electrician',
  true
FROM auth.users
WHERE email = 'provider@test.com'
AND NOT EXISTS (
  SELECT 1 FROM prestataires WHERE user_id = auth.users.id
);
