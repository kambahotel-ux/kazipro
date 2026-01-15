-- ============================================
-- Fix devise constraint - Support CDF instead of FC
-- SIMPLE VERSION - No diagnostic messages
-- ============================================

-- STEP 1: Drop the old constraint first
ALTER TABLE devis DROP CONSTRAINT IF EXISTS devis_devise_check;

-- STEP 2: Update existing data BEFORE adding new constraint
-- Convert 'FC' to 'CDF'
UPDATE devis SET devise = 'CDF' WHERE devise = 'FC';

-- Set NULL values to default 'CDF'
UPDATE devis SET devise = 'CDF' WHERE devise IS NULL;

-- Convert any other invalid values to 'CDF' (safety measure)
UPDATE devis SET devise = 'CDF' 
WHERE devise NOT IN ('CDF', 'USD', 'EUR');

-- STEP 3: Now add the new constraint with CDF
ALTER TABLE devis ADD CONSTRAINT devis_devise_check 
  CHECK (devise IN ('CDF', 'USD', 'EUR'));

-- STEP 4: Verify - Show final devise values
SELECT 
  'Final devise distribution' as info,
  devise, 
  COUNT(*) as count
FROM devis
GROUP BY devise
ORDER BY devise;
