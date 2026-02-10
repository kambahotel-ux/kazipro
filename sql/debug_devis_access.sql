-- ═══════════════════════════════════════════════════════════════
-- DEBUG - ACCÈS AUX DEVIS
-- ═══════════════════════════════════════════════════════════════
-- Ce script aide à diagnostiquer pourquoi un devis n'est pas accessible
-- REMPLACER L'ID CI-DESSOUS PAR L'ID DU DEVIS QUI POSE PROBLÈME

-- 1️⃣  Vérifier si le devis existe
SELECT 
  '1️⃣  Le devis existe-t-il?' as etape,
  CASE 
    WHEN EXISTS (SELECT 1 FROM devis_pro WHERE id = '115246da-782e-4a2f-b161-532bf34d05bf') 
    THEN '✅ OUI - Le devis existe'
    ELSE '❌ NON - Le devis n''existe pas dans la base'
  END as resultat;

-- 2️⃣  Informations du devis (si existe)
SELECT 
  '2️⃣  Informations du devis' as etape,
  id,
  numero,
  statut,
  client_id,
  prestataire_id,
  montant_ttc,
  created_at
FROM devis_pro
WHERE id = '115246da-782e-4a2f-b161-532bf34d05bf';

-- 3️⃣  Politiques RLS sur devis_pro
SELECT 
  '3️⃣  Politiques RLS' as etape,
  policyname,
  permissive,
  roles,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'Avec condition USING'
    ELSE 'Sans condition'
  END as has_using,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Avec condition WITH CHECK'
    ELSE 'Sans condition'
  END as has_with_check
FROM pg_policies
WHERE tablename = 'devis_pro'
ORDER BY cmd, policyname;

-- 4️⃣  RLS activé sur devis_pro?
SELECT 
  '4️⃣  RLS activé?' as etape,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'devis_pro';

-- 5️⃣  Liste de tous les devis (max 10)
SELECT 
  '5️⃣  Tous les devis' as etape,
  id,
  numero,
  statut,
  client_id,
  prestataire_id,
  montant_ttc,
  created_at
FROM devis_pro
ORDER BY created_at DESC
LIMIT 10;

-- 6️⃣  Liste des clients (max 5)
SELECT 
  '6️⃣  Clients' as etape,
  id,
  full_name,
  email,
  user_id
FROM clients
ORDER BY created_at DESC
LIMIT 5;

-- ═══════════════════════════════════════════════════════════════
-- SOLUTIONS POSSIBLES:
-- ═══════════════════════════════════════════════════════════════
-- 
-- Si le devis n'existe pas:
--   → Créer un devis de test: sql/create_test_devis_for_payment.sql
-- 
-- Si le devis existe mais n'est pas accessible:
--   → Problème de RLS
--   → Vérifier que le client_id correspond à l'utilisateur connecté
--   → Exécuter: sql/fix_rls_devis_simple.sql
-- ═══════════════════════════════════════════════════════════════
