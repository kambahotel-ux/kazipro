-- ============================================
-- FIX COMPLET: Professions et Demandes
-- ============================================

-- PARTIE 1: Fix RLS policies for professions table
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow admin full access to professions" ON professions;
DROP POLICY IF EXISTS "Allow public read access to professions" ON professions;
DROP POLICY IF EXISTS "Allow anonymous read active professions" ON professions;

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

-- Policy 2: Everyone can read professions
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

-- PARTIE 2: Add profession column to demandes table
-- ============================================

-- Add the column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'demandes' AND column_name = 'profession'
  ) THEN
    ALTER TABLE demandes ADD COLUMN profession TEXT;
    RAISE NOTICE 'Column profession added to demandes table';
  ELSE
    RAISE NOTICE 'Column profession already exists in demandes table';
  END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_demandes_profession ON demandes(profession);

-- Update existing demandes with a default profession if needed
UPDATE demandes 
SET profession = 'Non spécifié' 
WHERE profession IS NULL;

-- Add comment
COMMENT ON COLUMN demandes.profession IS 'Profession demandée par le client';

-- PARTIE 3: Verify setup
-- ============================================

-- Show professions policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'professions';

-- Show demandes columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'demandes'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Fix professions complete!';
  RAISE NOTICE '1. RLS policies updated for professions table';
  RAISE NOTICE '2. Column profession added to demandes table';
  RAISE NOTICE '3. Admin can now manage professions';
  RAISE NOTICE '4. Stats will now work correctly';
END $$;
