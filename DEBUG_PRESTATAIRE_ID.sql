-- ═══════════════════════════════════════════════════════════════════
-- DEBUG - VÉRIFIER PRESTATAIRE_ID
-- ═══════════════════════════════════════════════════════════════════

-- 1. Voir tous les prestataires et leurs user_id
SELECT 
  id as prestataire_id,
  user_id,
  full_name,
  email,
  verified
FROM prestataires
ORDER BY created_at DESC
LIMIT 10;

-- 2. Vérifier les policies RLS actuelles
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
WHERE tablename IN ('configuration_paiement_prestataire', 'frais_deplacement_config')
ORDER BY tablename, policyname;

-- 3. Tester si la subquery fonctionne (remplace 'TON_USER_ID' par ton auth.uid())
-- SELECT id FROM prestataires WHERE user_id = 'TON_USER_ID';

-- 4. Voir les configs existantes
SELECT * FROM configuration_paiement_prestataire;
SELECT * FROM frais_deplacement_config;
