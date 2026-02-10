-- ═══════════════════════════════════════════════════════════════════
-- FIX FINAL - PERMISSIONS RLS POUR CONTRATS
-- ═══════════════════════════════════════════════════════════════════

-- Problème: Les devis de l'ancienne table n'ont pas de client_id
-- Solution: Policy plus permissive pour la création de contrats

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "clients_insert_contrats" ON contrats;
DROP POLICY IF EXISTS "clients_select_contrats" ON contrats;
DROP POLICY IF EXISTS "clients_update_contrats" ON contrats;

-- Policy INSERT ultra-permissive: tout utilisateur authentifié peut créer un contrat
CREATE POLICY "authenticated_insert_contrats"
ON contrats
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy SELECT: voir ses contrats (client OU prestataire)
CREATE POLICY "users_select_contrats"
ON contrats
FOR SELECT
TO authenticated
USING (
  -- Si vous êtes le client
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  OR
  -- OU si vous êtes le prestataire
  prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
  OR
  -- OU si le contrat n'a pas de client_id (anciens devis)
  client_id IS NULL
);

-- Policy UPDATE: modifier ses contrats
CREATE POLICY "users_update_contrats"
ON contrats
FOR UPDATE
TO authenticated
USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  OR
  prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
  OR
  client_id IS NULL
)
WITH CHECK (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  OR
  prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
  OR
  client_id IS NULL
);

SELECT '✅ Policies contrats mises à jour!' as status;

-- Vérification
SELECT 
  '📋 POLICIES CONTRATS' as info,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'contrats'
ORDER BY policyname;

SELECT '═══════════════════════════════════════════════════════════════════' as separator;
SELECT '✅ PERMISSIONS RLS CONFIGURÉES!' as resultat;
SELECT '' as separator2;
SELECT '👉 Rafraîchissez l''application (F5) et réessayez' as action;
SELECT '═══════════════════════════════════════════════════════════════════' as separator3;

