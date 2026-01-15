-- ============================================
-- Fix devise constraint - MINIMAL VERSION
-- Execute these commands ONE BY ONE if needed
-- ============================================

-- 1. Drop constraint
ALTER TABLE devis DROP CONSTRAINT IF EXISTS devis_devise_check;

-- 2. Clean data
UPDATE devis SET devise = 'CDF' WHERE devise = 'FC' OR devise IS NULL OR devise NOT IN ('CDF', 'USD', 'EUR');

-- 3. Add constraint
ALTER TABLE devis ADD CONSTRAINT devis_devise_check CHECK (devise IN ('CDF', 'USD', 'EUR'));
