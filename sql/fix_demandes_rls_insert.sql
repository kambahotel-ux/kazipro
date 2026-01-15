-- ============================================
-- FIX: RLS Policies pour la table demandes
-- Permettre aux clients de créer des demandes
-- ============================================

-- 1. Supprimer les anciennes policies
DROP POLICY IF EXISTS "Clients can insert own demandes" ON demandes;
DROP POLICY IF EXISTS "Clients can create demandes" ON demandes;
DROP POLICY IF EXISTS "Clients can insert demandes" ON demandes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON demandes;

-- 2. Créer la policy pour permettre l'insertion
CREATE POLICY "Clients can create demandes"
ON demandes FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- 3. Policy pour voir ses propres demandes
DROP POLICY IF EXISTS "Clients can view own demandes" ON demandes;
CREATE POLICY "Clients can view own demandes"
ON demandes FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- 4. Policy pour modifier ses propres demandes
DROP POLICY IF EXISTS "Clients can update own demandes" ON demandes;
CREATE POLICY "Clients can update own demandes"
ON demandes FOR UPDATE
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- 5. Policy pour supprimer ses propres demandes (si en attente)
DROP POLICY IF EXISTS "Clients can delete own pending demandes" ON demandes;
CREATE POLICY "Clients can delete own pending demandes"
ON demandes FOR DELETE
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
  AND statut = 'en_attente'
);

-- 6. Policy pour les prestataires (voir les demandes de leur profession)
DROP POLICY IF EXISTS "Prestataires can view demandes for their profession" ON demandes;
CREATE POLICY "Prestataires can view demandes for their profession"
ON demandes FOR SELECT
TO authenticated
USING (
  profession IN (
    SELECT profession FROM prestataires WHERE user_id = auth.uid()
  )
  AND statut = 'en_attente'
);

-- 7. Policy pour l'admin (voir toutes les demandes)
DROP POLICY IF EXISTS "Admin can view all demandes" ON demandes;
CREATE POLICY "Admin can view all demandes"
ON demandes FOR SELECT
TO authenticated
USING ((auth.jwt() ->> 'email') = 'admin@kazipro.com');

-- 8. Policy pour l'admin (modifier toutes les demandes)
DROP POLICY IF EXISTS "Admin can update all demandes" ON demandes;
CREATE POLICY "Admin can update all demandes"
ON demandes FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'email') = 'admin@kazipro.com');

-- ============================================
-- Vérification
-- ============================================

-- Voir toutes les policies de la table demandes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'demandes';

-- ============================================
-- Test
-- ============================================

-- Pour tester si un client peut créer une demande:
-- 1. Se connecter en tant que client
-- 2. Essayer de créer une demande via l'interface
-- 3. Vérifier qu'il n'y a pas d'erreur 403

-- ✅ Succès si la demande est créée sans erreur
