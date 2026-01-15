-- ============================================
-- Fix devise constraint - SAFE VERSION
-- This script checks data first and provides feedback
-- ============================================

-- DIAGNOSTIC: Show all current devise values
DO $$
DECLARE
  invalid_count INTEGER;
  null_count INTEGER;
  fc_count INTEGER;
BEGIN
  -- Count invalid values
  SELECT COUNT(*) INTO invalid_count
  FROM devis
  WHERE devise IS NOT NULL 
    AND devise NOT IN ('CDF', 'USD', 'EUR', 'FC');
  
  -- Count NULL values
  SELECT COUNT(*) INTO null_count
  FROM devis
  WHERE devise IS NULL;
  
  -- Count 'FC' values
  SELECT COUNT(*) INTO fc_count
  FROM devis
  WHERE devise = 'FC';
  
  RAISE NOTICE '=== DIAGNOSTIC ===';
  RAISE NOTICE 'Devis with FC: %', fc_count;
  RAISE NOTICE 'Devis with NULL devise: %', null_count;
  RAISE NOTICE 'Devis with invalid devise: %', invalid_count;
  
  IF invalid_count > 0 THEN
    RAISE NOTICE 'WARNING: Found % devis with invalid devise values!', invalid_count;
    RAISE NOTICE 'Run this query to see them: SELECT id, devise FROM devis WHERE devise NOT IN (''CDF'', ''USD'', ''EUR'', ''FC'') AND devise IS NOT NULL;';
  END IF;
END $$;

-- Show detailed breakdown
SELECT 
  COALESCE(devise, 'NULL') as devise_value,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM devis), 2) as percentage
FROM devis
GROUP BY devise
ORDER BY count DESC;

-- STEP 1: Drop existing constraint
ALTER TABLE devis DROP CONSTRAINT IF EXISTS devis_devise_check;
RAISE NOTICE 'Old constraint dropped';

-- STEP 2: Clean up data
-- Convert 'FC' to 'CDF'
UPDATE devis SET devise = 'CDF' WHERE devise = 'FC';
RAISE NOTICE 'Converted FC to CDF';

-- Set NULL to 'CDF'
UPDATE devis SET devise = 'CDF' WHERE devise IS NULL;
RAISE NOTICE 'Set NULL values to CDF';

-- Handle any other invalid values
UPDATE devis SET devise = 'CDF' 
WHERE devise NOT IN ('CDF', 'USD', 'EUR');
RAISE NOTICE 'Converted invalid values to CDF';

-- STEP 3: Add new constraint
ALTER TABLE devis ADD CONSTRAINT devis_devise_check 
  CHECK (devise IN ('CDF', 'USD', 'EUR'));
RAISE NOTICE 'New constraint added successfully';

-- STEP 4: Verify results
SELECT 
  '✅ FINAL RESULT' as status,
  devise,
  COUNT(*) as count
FROM devis
GROUP BY devise
ORDER BY devise;

-- Show constraint definition
SELECT 
  '✅ CONSTRAINT' as status,
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conname = 'devis_devise_check';
