-- Fix RLS policies for devis_pro_items table

-- Enable RLS if not already enabled
ALTER TABLE devis_pro_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Prestataires can insert their own devis items" ON devis_pro_items;
DROP POLICY IF EXISTS "Prestataires can view their own devis items" ON devis_pro_items;
DROP POLICY IF EXISTS "Prestataires can update their own devis items" ON devis_pro_items;
DROP POLICY IF EXISTS "Prestataires can delete their own devis items" ON devis_pro_items;
DROP POLICY IF EXISTS "Clients can view devis items" ON devis_pro_items;

-- Policy 1: Prestataires can INSERT items for their own devis
CREATE POLICY "Prestataires can insert their own devis items"
ON devis_pro_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM devis
    WHERE devis.id = devis_pro_items.devis_id
    AND devis.prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
  )
);

-- Policy 2: Prestataires can SELECT items for their own devis
CREATE POLICY "Prestataires can view their own devis items"
ON devis_pro_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM devis
    WHERE devis.id = devis_pro_items.devis_id
    AND devis.prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
  )
);

-- Policy 3: Clients can SELECT items for devis they received
CREATE POLICY "Clients can view devis items"
ON devis_pro_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM devis
    JOIN demandes ON demandes.id = devis.demande_id
    WHERE devis.id = devis_pro_items.devis_id
    AND demandes.client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  )
);

-- Policy 4: Prestataires can UPDATE items for their own devis (before acceptance)
CREATE POLICY "Prestataires can update their own devis items"
ON devis_pro_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM devis
    WHERE devis.id = devis_pro_items.devis_id
    AND devis.prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
    AND devis.statut IN ('en_attente', 'pending', 'negocie', 'negotiating')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM devis
    WHERE devis.id = devis_pro_items.devis_id
    AND devis.prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
    AND devis.statut IN ('en_attente', 'pending', 'negocie', 'negotiating')
  )
);

-- Policy 5: Prestataires can DELETE items for their own devis (before acceptance)
CREATE POLICY "Prestataires can delete their own devis items"
ON devis_pro_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM devis
    WHERE devis.id = devis_pro_items.devis_id
    AND devis.prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
    AND devis.statut IN ('en_attente', 'pending', 'negocie', 'negotiating')
  )
);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'devis_pro_items'
ORDER BY policyname;
