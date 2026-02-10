-- ═══════════════════════════════════════════════════════════════════
-- FIX ACCÈS DEVIS ET CONTRATS - RÉSOUDRE L'ERREUR PGRST116
-- ═══════════════════════════════════════════════════════════════════

-- Cette erreur signifie que le client ne peut pas accéder au devis
-- Vérifions et corrigeons les policies RLS

-- ═══════════════════════════════════════════════════════════════════
-- 1. VÉRIFIER LES POLICIES ACTUELLES SUR DEVIS_PRO
-- ═══════════════════════════════════════════════════════════════════

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
WHERE tablename = 'devis_pro'
ORDER BY policyname;

-- ═══════════════════════════════════════════════════════════════════
-- 2. SUPPRIMER LES ANCIENNES POLICIES RESTRICTIVES
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Clients can view devis_pro sent to them" ON devis_pro;
DROP POLICY IF EXISTS "Clients can view their devis" ON devis_pro;
DROP POLICY IF EXISTS "Clients can update their devis status" ON devis_pro;

-- ═══════════════════════════════════════════════════════════════════
-- 3. CRÉER DES POLICIES PERMISSIVES POUR LES CLIENTS
-- ═══════════════════════════════════════════════════════════════════

-- Policy SELECT pour les clients (lecture)
CREATE POLICY "Clients peuvent voir leurs devis"
ON devis_pro
FOR SELECT
TO authenticated
USING (
  -- Le client peut voir les devis qui lui sont destinés
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- Policy UPDATE pour les clients (acceptation)
CREATE POLICY "Clients peuvent accepter leurs devis"
ON devis_pro
FOR UPDATE
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- ═══════════════════════════════════════════════════════════════════
-- 4. VÉRIFIER/CRÉER LES POLICIES SUR LA TABLE CONTRATS
-- ═══════════════════════════════════════════════════════════════════

-- Activer RLS sur contrats si pas déjà fait
ALTER TABLE contrats ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Clients peuvent voir leurs contrats" ON contrats;
DROP POLICY IF EXISTS "Clients peuvent créer leurs contrats" ON contrats;
DROP POLICY IF EXISTS "Clients peuvent mettre à jour leurs contrats" ON contrats;

-- Policy SELECT pour les clients
CREATE POLICY "Clients peuvent voir leurs contrats"
ON contrats
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- Policy INSERT pour les clients (création automatique)
CREATE POLICY "Clients peuvent créer leurs contrats"
ON contrats
FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- Policy UPDATE pour les clients (signature)
CREATE POLICY "Clients peuvent mettre à jour leurs contrats"
ON contrats
FOR UPDATE
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- ═══════════════════════════════════════════════════════════════════
-- 5. POLICIES POUR LES PRESTATAIRES
-- ═══════════════════════════════════════════════════════════════════

-- Les prestataires doivent aussi pouvoir voir leurs contrats
DROP POLICY IF EXISTS "Prestataires peuvent voir leurs contrats" ON contrats;

CREATE POLICY "Prestataires peuvent voir leurs contrats"
ON contrats
FOR SELECT
TO authenticated
USING (
  prestataire_id IN (
    SELECT id FROM prestataires WHERE user_id = auth.uid()
  )
);

-- ═══════════════════════════════════════════════════════════════════
-- 6. VÉRIFICATION FINALE
-- ═══════════════════════════════════════════════════════════════════

-- Afficher toutes les policies sur devis_pro
SELECT 
  '✅ POLICIES DEVIS_PRO:' as info,
  policyname,
  cmd as operation,
  roles
FROM pg_policies 
WHERE tablename = 'devis_pro'
ORDER BY policyname;

-- Afficher toutes les policies sur contrats
SELECT 
  '✅ POLICIES CONTRATS:' as info,
  policyname,
  cmd as operation,
  roles
FROM pg_policies 
WHERE tablename = 'contrats'
ORDER BY policyname;

-- ═══════════════════════════════════════════════════════════════════
-- 7. TEST: VÉRIFIER QU'UN CLIENT PEUT ACCÉDER À SES DEVIS
-- ═══════════════════════════════════════════════════════════════════

-- Remplacez USER_ID par l'ID de votre utilisateur connecté
-- Vous pouvez le trouver dans: Authentication > Users

-- SELECT 
--   d.*,
--   c.full_name as client_name
-- FROM devis_pro d
-- JOIN clients c ON d.client_id = c.id
-- WHERE c.user_id = 'VOTRE_USER_ID_ICI'
-- LIMIT 5;

SELECT '✅ Policies RLS créées avec succès!' as status;
SELECT '👉 Testez maintenant en cliquant sur "Voir le contrat"' as action;

