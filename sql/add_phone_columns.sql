-- ============================================
-- Add phone columns to clients and prestataires tables
-- ============================================

-- Add phone column to clients table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'phone'
  ) THEN
    ALTER TABLE clients ADD COLUMN phone TEXT;
    COMMENT ON COLUMN clients.phone IS 'Client phone number';
  END IF;
END $$;

-- Add phone column to prestataires table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prestataires' AND column_name = 'phone'
  ) THEN
    ALTER TABLE prestataires ADD COLUMN phone TEXT;
    COMMENT ON COLUMN prestataires.phone IS 'Provider phone number';
  END IF;
END $$;

-- Add email column to prestataires table if it doesn't exist (for completeness)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prestataires' AND column_name = 'email'
  ) THEN
    ALTER TABLE prestataires ADD COLUMN email TEXT;
    COMMENT ON COLUMN prestataires.email IS 'Provider email address';
  END IF;
END $$;

-- Add address column to prestataires table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prestataires' AND column_name = 'address'
  ) THEN
    ALTER TABLE prestataires ADD COLUMN address TEXT;
    COMMENT ON COLUMN prestataires.address IS 'Provider address';
  END IF;
END $$;

-- Add city column to prestataires table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prestataires' AND column_name = 'city'
  ) THEN
    ALTER TABLE prestataires ADD COLUMN city TEXT;
    COMMENT ON COLUMN prestataires.city IS 'Provider city';
  END IF;
END $$;

-- Verify columns were added
SELECT 
  'clients' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'clients' 
  AND column_name IN ('phone', 'address', 'city')
UNION ALL
SELECT 
  'prestataires' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'prestataires' 
  AND column_name IN ('phone', 'email', 'address', 'city')
ORDER BY table_name, column_name;
