-- Fix RLS policies for professions table
-- Allow admin to manage professions

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow admin full access to professions" ON professions;
DROP POLICY IF EXISTS "Allow public read access to professions" ON professions;

-- Enable RLS
ALTER TABLE professions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admin can do everything
CREATE POLICY "Allow admin full access to professions"
ON professions
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'email') = 'admin@kazipro.com'
)
WITH CHECK (
  (auth.jwt() ->> 'email') = 'admin@kazipro.com'
);

-- Policy 2: Everyone can read active professions
CREATE POLICY "Allow public read access to professions"
ON professions
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Allow anonymous read for registration page
CREATE POLICY "Allow anonymous read active professions"
ON professions
FOR SELECT
TO anon
USING (actif = true);
