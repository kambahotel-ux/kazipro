-- ============================================
-- Fix devis_pro_items INSERT policy
-- Allow prestataires to insert items for their devis
-- ============================================

-- Enable RLS
ALTER TABLE devis_pro_items ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Prestataires can insert their own devis items" ON devis_pro_items;
DROP POLICY IF EXISTS "Prestataires can view their own devis items" ON devis_pro_items;
DROP POLICY IF EXISTS "Prestataires can update their own devis items" ON devis_pro_items;
DROP POLICY IF EXISTS "Prestataires can delete their own devis items" ON devis_pro_items;
DROP POLICY IF EXISTS "Clients can view devis items" ON devis_pro_items;
DROP POLICY IF EXISTS "Admin can view all devis items" ON devis_pro_items;

-- Policy 1: Prestataires can INSERT items for their own devis
-- SIMPLIFIED: Just check if the devis belongs to the prestataire
CREATE POLICY "Prestataires can insert their own devis items"
ON devis_pro_items
FOR INSERT
WITH CHECK (
  devis_id IN (
    SELECT d.id FROM devis d
    INNER JOIN prestataires p ON p.id = d.prestataire_id
    WHERE p.user_id = auth.uid()
  )
);

-- Policy 2: Prestataires can SELECT items for their own devis
CREATE POLICY "Prestataires can view their own devis items"
ON devis_pro_items
FOR SELECT
USING (
  devis_id IN (
    SELECT d.id FROM devis d
    INNER JOIN prestataires p ON p.id = d.prestataire_id
    WHERE p.user_id = auth.uid()
  )
);

-- Policy 3: Prestataires can UPDATE items for their own devis
CREATE POLICY "Prestataires can update their own devis items"
ON devis_pro_items
FOR UPDATE
USING (
  devis_id IN (
    SELECT d.id FROM devis d
    INNER JOIN prestataires p ON p.id = d.prestataire_id
    WHERE p.user_id = auth.uid()
  )
)
WITH CHECK (
  devis_id IN (
    SELECT d.id FROM devis d
    INNER JOIN prestataires p ON p.id = d.prestataire_id
    WHERE p.user_id = auth.uid()
  )
);

-- Policy 4: Prestataires can DELETE items for their own devis
CREATE POLICY "Prestataires can delete their own devis items"
ON devis_pro_items
FOR DELETE
USING (
  devis_id IN (
    SELECT d.id FROM devis d
    INNER JOIN prestataires p ON p.id = d.prestataire_id
    WHERE p.user_id = auth.uid()
  )
);

-- Policy 5: Clients can SELECT items for devis they received
CREATE POLICY "Clients can view devis items"
ON devis_pro_items
FOR SELECT
USING (
  devis_id IN (
    SELECT d.id FROM devis d
    INNER JOIN demandes dm ON dm.id = d.demande_id
    INNER JOIN clients c ON c.id = dm.client_id
    WHERE c.user_id = auth.uid()
  )
);

-- Policy 6: Admin can view all items
-- Using auth.jwt() instead of auth.users (which is not accessible in RLS)
CREATE POLICY "Admin can view all devis items"
ON devis_pro_items
FOR SELECT
USING (
  (auth.jwt() ->> 'email') = 'admin@kazipro.com'
);

-- Verify policies were created
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN roles = '{public}' THEN 'public'
    WHEN roles = '{authenticated}' THEN 'authenticated'
    ELSE roles::text
  END as roles
FROM pg_policies
WHERE tablename = 'devis_pro_items'
ORDER BY cmd, policyname;
