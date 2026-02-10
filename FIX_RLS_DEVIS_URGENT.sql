-- ═══════════════════════════════════════════════════════════════════
-- FIX URGENT - PERMISSIONS RLS POUR DEVIS_PRO
-- ═══════════════════════════════════════════════════════════════════

-- Problème: "Devis introuvable" alors que le devis existe
-- Cause: Les RLS policies bloquent l'accès

-- ═══════════════════════════════════════════════════════════════════
-- SOLUTION: POLICIES ULTRA-PERMISSIVES POUR LES CLIENTS
-- ═══════════════════════════════════════════════════════════════════

-- Supprimer TOUTES les anciennes policies sur devis_pro
DROP POLICY IF EXISTS "Clients peuvent voir leurs devis" ON devis_pro;
DROP POLICY IF EXISTS "Clients peuvent accepter leurs devis" ON devis_pro;
DROP POLICY IF EXISTS "Clients can view devis_pro sent to them" ON devis_pro;
DROP POLICY IF EXISTS "Clients can view their devis" ON devis_pro;
DROP POLICY IF EXISTS "Clients can update their devis status" ON devis_pro;
DROP POLICY IF EXISTS "Prestataires can manage their own devis_pro" ON devis_pro;
DROP POLICY IF EXISTS "Prestataires can create devis" ON devis_pro;
DROP POLICY IF EXISTS "Admin can view all devis_pro" ON devis_pro;
DROP POLICY IF EXISTS "Prestataires can view their devis" ON devis_pro;
DROP POLICY IF EXISTS "Prestataires can update their devis" ON devis_pro;

-- Créer des policies ULTRA-PERMISSIVES pour les clients
CREATE POLICY "clients_select_devis"
ON devis_pro
FOR SELECT
TO authenticated
USING (
  -- Le client peut voir TOUS les devis qui lui sont destinés
  EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = devis_pro.client_id 
    AND clients.user_id = auth.uid()
  )
);

CREATE POLICY "clients_update_devis"
ON devis_pro
FOR UPDATE
TO authenticated
USING (
  -- Le client peut modifier TOUS les devis qui lui sont destinés
  EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = devis_pro.client_id 
    AND clients.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = devis_pro.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- Policies pour les prestataires
CREATE POLICY "prestataires_select_devis"
ON devis_pro
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM prestataires 
    WHERE prestataires.id = devis_pro.prestataire_id 
    AND prestataires.user_id = auth.uid()
  )
);

CREATE POLICY "prestataires_all_devis"
ON devis_pro
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM prestataires 
    WHERE prestataires.id = devis_pro.prestataire_id 
    AND prestataires.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM prestataires 
    WHERE prestataires.id = devis_pro.prestataire_id 
    AND prestataires.user_id = auth.uid()
  )
);

SELECT '✅ Policies devis_pro créées!' as status;

-- ═══════════════════════════════════════════════════════════════════
-- MÊME CHOSE POUR LA TABLE CONTRATS
-- ═══════════════════════════════════════════════════════════════════

-- Activer RLS
ALTER TABLE contrats ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Clients peuvent voir leurs contrats" ON contrats;
DROP POLICY IF EXISTS "Clients peuvent créer leurs contrats" ON contrats;
DROP POLICY IF EXISTS "Clients peuvent mettre à jour leurs contrats" ON contrats;
DROP POLICY IF EXISTS "Prestataires peuvent voir leurs contrats" ON contrats;

-- Policies ULTRA-PERMISSIVES pour les clients
CREATE POLICY "clients_select_contrats"
ON contrats
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = contrats.client_id 
    AND clients.user_id = auth.uid()
  )
);

CREATE POLICY "clients_insert_contrats"
ON contrats
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = contrats.client_id 
    AND clients.user_id = auth.uid()
  )
);

CREATE POLICY "clients_update_contrats"
ON contrats
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = contrats.client_id 
    AND clients.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = contrats.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- Policies pour les prestataires
CREATE POLICY "prestataires_select_contrats"
ON contrats
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM prestataires 
    WHERE prestataires.id = contrats.prestataire_id 
    AND prestataires.user_id = auth.uid()
  )
);

CREATE POLICY "prestataires_update_contrats"
ON contrats
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM prestataires 
    WHERE prestataires.id = contrats.prestataire_id 
    AND prestataires.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM prestataires 
    WHERE prestataires.id = contrats.prestataire_id 
    AND prestataires.user_id = auth.uid()
  )
);

SELECT '✅ Policies contrats créées!' as status;

-- ═══════════════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════

-- Afficher toutes les policies
SELECT 
  '📋 POLICIES DEVIS_PRO' as info,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'devis_pro'
ORDER BY policyname;

SELECT 
  '📋 POLICIES CONTRATS' as info,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'contrats'
ORDER BY policyname;

-- Test: Vérifier que vous pouvez voir vos devis
SELECT 
  '🧪 TEST: VOS DEVIS' as info,
  COUNT(*) as nombre_devis
FROM devis_pro
WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid());

SELECT '═══════════════════════════════════════════════════════════════════' as separator;
SELECT '✅ PERMISSIONS RLS CONFIGURÉES!' as resultat;
SELECT '' as separator2;
SELECT '👉 Rafraîchissez l''application (F5) et réessayez' as action;
SELECT '═══════════════════════════════════════════════════════════════════' as separator3;

