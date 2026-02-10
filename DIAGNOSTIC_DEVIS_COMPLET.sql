-- ═══════════════════════════════════════════════════════════════════
-- DIAGNOSTIC COMPLET - TROUVER POURQUOI "DEVIS INTROUVABLE"
-- ═══════════════════════════════════════════════════════════════════

-- ÉTAPE 1: Vérifier votre identité
-- ═══════════════════════════════════════════════════════════════════
SELECT 
  '🔍 VOTRE IDENTITÉ' as info,
  auth.uid() as user_id,
  auth.email() as email;

-- ÉTAPE 2: Vérifier votre profil client
-- ═══════════════════════════════════════════════════════════════════
SELECT 
  '👤 VOTRE PROFIL CLIENT' as info,
  id as client_id,
  full_name,
  email,
  user_id,
  created_at
FROM clients
WHERE user_id = auth.uid();

-- Si cette requête retourne 0 lignes, vous n'avez pas de profil client!

-- ÉTAPE 3: Lister TOUS vos devis (sans RLS)
-- ═══════════════════════════════════════════════════════════════════
-- Cette requête désactive temporairement RLS pour voir tous les devis
SET LOCAL ROLE postgres;

SELECT 
  '📋 TOUS LES DEVIS DANS LA BASE' as info,
  d.id,
  d.numero,
  d.titre,
  d.statut,
  d.client_id,
  c.full_name as client_name,
  c.user_id as client_user_id,
  d.created_at
FROM devis_pro d
LEFT JOIN clients c ON d.client_id = c.id
ORDER BY d.created_at DESC
LIMIT 10;

RESET ROLE;

-- ÉTAPE 4: Vérifier les devis qui VOUS appartiennent
-- ═══════════════════════════════════════════════════════════════════
SELECT 
  '✅ VOS DEVIS (avec RLS)' as info,
  d.id,
  d.numero,
  d.titre,
  d.statut,
  d.montant_ttc,
  d.created_at,
  d.date_acceptation
FROM devis_pro d
WHERE d.client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
)
ORDER BY d.created_at DESC;

-- Si cette requête retourne 0 lignes mais l'étape 3 en montrait,
-- c'est un problème de RLS policies!

-- ÉTAPE 5: Vérifier les policies RLS actuelles
-- ═══════════════════════════════════════════════════════════════════
SELECT 
  '🔒 POLICIES RLS SUR DEVIS_PRO' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'devis_pro'
ORDER BY policyname;

-- ÉTAPE 6: Tester l'accès à un devis spécifique
-- ═══════════════════════════════════════════════════════════════════
-- Remplacez 'VOTRE_DEVIS_ID' par l'ID du devis que vous essayez d'ouvrir

-- SELECT 
--   '🎯 TEST ACCÈS DEVIS SPÉCIFIQUE' as info,
--   d.*
-- FROM devis_pro d
-- WHERE d.id = 'VOTRE_DEVIS_ID';

-- Si cette requête retourne 0 lignes, soit:
-- 1. Le devis n'existe pas
-- 2. Les RLS policies bloquent l'accès

