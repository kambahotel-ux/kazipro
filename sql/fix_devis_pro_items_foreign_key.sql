-- ============================================
-- Fix devis_pro_items foreign key constraint
-- Change reference from devis_pro to devis
-- ============================================

-- Step 1: Drop the incorrect foreign key constraint
ALTER TABLE devis_pro_items 
DROP CONSTRAINT IF EXISTS devis_pro_items_devis_id_fkey;

-- Step 2: Add correct foreign key constraint pointing to 'devis' table
ALTER TABLE devis_pro_items 
ADD CONSTRAINT devis_pro_items_devis_id_fkey 
FOREIGN KEY (devis_id) REFERENCES devis(id) ON DELETE CASCADE;

-- Step 3: Verify the constraint
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'devis_pro_items'
  AND kcu.column_name = 'devis_id';

-- Expected result:
-- table_name       | column_name | foreign_table_name | foreign_column_name | constraint_name
-- ----------------+-------------+--------------------+---------------------+--------------------------------
-- devis_pro_items | devis_id    | devis              | id                  | devis_pro_items_devis_id_fkey
