-- ============================================
-- VÉRIFICATION DU SYSTÈME DE PAIEMENT
-- ============================================
-- Ce script vérifie que tous les éléments nécessaires
-- au flux de paiement sont en place

\echo '═══════════════════════════════════════════════════════════════'
\echo '   VÉRIFICATION DU SYSTÈME DE PAIEMENT'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

-- ============================================
-- 1. VÉRIFIER LES TABLES
-- ============================================
\echo '1️⃣  VÉRIFICATION DES TABLES'
\echo '───────────────────────────────────────────────────────────────'

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'devis_pro') 
    THEN '✅ Table devis_pro existe'
    ELSE '❌ Table devis_pro MANQUANTE'
  END as check_devis_pro;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contrats') 
    THEN '✅ Table contrats existe'
    ELSE '❌ Table contrats MANQUANTE'
  END as check_contrats;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'paiements') 
    THEN '✅ Table paiements existe'
    ELSE '❌ Table paiements MANQUANTE'
  END as check_paiements;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'missions') 
    THEN '✅ Table missions existe'
    ELSE '❌ Table missions MANQUANTE'
  END as check_missions;

\echo ''

-- ============================================
-- 2. VÉRIFIER LES FONCTIONS
-- ============================================
\echo '2️⃣  VÉRIFICATION DES FONCTIONS'
\echo '───────────────────────────────────────────────────────────────'

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'generate_devis_numero'
    ) 
    THEN '✅ Fonction generate_devis_numero existe'
    ELSE '❌ Fonction generate_devis_numero MANQUANTE'
  END as check_generate_devis;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'generate_contrat_numero'
    ) 
    THEN '✅ Fonction generate_contrat_numero existe'
    ELSE '❌ Fonction generate_contrat_numero MANQUANTE'
  END as check_generate_contrat;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'generate_paiement_numero'
    ) 
    THEN '✅ Fonction generate_paiement_numero existe'
    ELSE '❌ Fonction generate_paiement_numero MANQUANTE'
  END as check_generate_paiement;

\echo ''

-- ============================================
-- 3. VÉRIFIER LES TRIGGERS
-- ============================================
\echo '3️⃣  VÉRIFICATION DES TRIGGERS'
\echo '───────────────────────────────────────────────────────────────'

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'auto_create_contrat_on_devis_accept'
    ) 
    THEN '✅ Trigger auto_create_contrat_on_devis_accept existe'
    ELSE '❌ Trigger auto_create_contrat_on_devis_accept MANQUANT'
  END as check_trigger_contrat;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname LIKE '%generate_devis_numero%'
    ) 
    THEN '✅ Trigger génération numéro devis existe'
    ELSE '⚠️  Trigger génération numéro devis MANQUANT (optionnel)'
  END as check_trigger_devis_numero;

\echo ''

-- ============================================
-- 4. VÉRIFIER LE BUCKET STORAGE
-- ============================================
\echo '4️⃣  VÉRIFICATION DU STORAGE'
\echo '───────────────────────────────────────────────────────────────'

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM storage.buckets 
      WHERE id = 'signatures'
    ) 
    THEN '✅ Bucket signatures existe'
    ELSE '❌ Bucket signatures MANQUANT'
  END as check_bucket_signatures;

SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'signatures';

\echo ''

-- ============================================
-- 5. VÉRIFIER LES POLITIQUES RLS
-- ============================================
\echo '5️⃣  VÉRIFICATION DES POLITIQUES RLS'
\echo '───────────────────────────────────────────────────────────────'

-- Politiques sur devis_pro
SELECT 
  COUNT(*) as nb_policies_devis,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Politiques RLS sur devis_pro'
    ELSE '⚠️  Aucune politique RLS sur devis_pro'
  END as status
FROM pg_policies
WHERE tablename = 'devis_pro';

-- Politiques sur contrats
SELECT 
  COUNT(*) as nb_policies_contrats,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Politiques RLS sur contrats'
    ELSE '⚠️  Aucune politique RLS sur contrats'
  END as status
FROM pg_policies
WHERE tablename = 'contrats';

-- Politiques sur paiements
SELECT 
  COUNT(*) as nb_policies_paiements,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Politiques RLS sur paiements'
    ELSE '❌ Aucune politique RLS sur paiements'
  END as status
FROM pg_policies
WHERE tablename = 'paiements';

-- Politiques sur storage signatures
SELECT 
  COUNT(*) as nb_policies_storage,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Politiques RLS sur storage.objects (signatures)'
    ELSE '❌ Aucune politique RLS sur storage.objects'
  END as status
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%signature%';

\echo ''

-- ============================================
-- 6. VÉRIFIER LES COLONNES IMPORTANTES
-- ============================================
\echo '6️⃣  VÉRIFICATION DES COLONNES'
\echo '───────────────────────────────────────────────────────────────'

-- Colonnes de devis_pro
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'devis_pro' AND column_name = 'statut'
    ) 
    THEN '✅ Colonne devis_pro.statut existe'
    ELSE '❌ Colonne devis_pro.statut MANQUANTE'
  END as check_devis_statut;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'devis_pro' AND column_name = 'date_acceptation'
    ) 
    THEN '✅ Colonne devis_pro.date_acceptation existe'
    ELSE '❌ Colonne devis_pro.date_acceptation MANQUANTE'
  END as check_devis_date_acceptation;

-- Colonnes de contrats
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'contrats' AND column_name = 'signature_client_url'
    ) 
    THEN '✅ Colonne contrats.signature_client_url existe'
    ELSE '❌ Colonne contrats.signature_client_url MANQUANTE'
  END as check_contrat_signature;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'contrats' AND column_name = 'date_signature_client'
    ) 
    THEN '✅ Colonne contrats.date_signature_client existe'
    ELSE '❌ Colonne contrats.date_signature_client MANQUANTE'
  END as check_contrat_date_signature;

-- Colonnes de paiements
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'paiements' AND column_name = 'type_paiement'
    ) 
    THEN '✅ Colonne paiements.type_paiement existe'
    ELSE '❌ Colonne paiements.type_paiement MANQUANTE'
  END as check_paiement_type;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'paiements' AND column_name = 'methode_paiement'
    ) 
    THEN '✅ Colonne paiements.methode_paiement existe'
    ELSE '❌ Colonne paiements.methode_paiement MANQUANTE'
  END as check_paiement_methode;

\echo ''

-- ============================================
-- 7. STATISTIQUES
-- ============================================
\echo '7️⃣  STATISTIQUES'
\echo '───────────────────────────────────────────────────────────────'

SELECT 
  COUNT(*) as total_devis,
  COUNT(*) FILTER (WHERE statut = 'en_attente') as devis_en_attente,
  COUNT(*) FILTER (WHERE statut = 'accepte') as devis_acceptes
FROM devis_pro;

SELECT 
  COUNT(*) as total_contrats,
  COUNT(*) FILTER (WHERE statut = 'genere') as contrats_generes,
  COUNT(*) FILTER (WHERE statut = 'signe_client') as contrats_signes
FROM contrats;

SELECT 
  COUNT(*) as total_paiements,
  COUNT(*) FILTER (WHERE type_paiement = 'acompte') as paiements_acompte,
  COUNT(*) FILTER (WHERE statut = 'complete') as paiements_completes
FROM paiements;

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '   FIN DE LA VÉRIFICATION'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
\echo 'Si tous les checks sont ✅, le système est prêt!'
\echo 'Si certains sont ❌, exécutez les scripts SQL correspondants:'
\echo '  - FIX_PAIEMENTS_ET_INSTALLER.sql (tables et fonctions)'
\echo '  - sql/create_trigger_contrat_auto.sql (trigger)'
\echo '  - sql/create_storage_signatures.sql (bucket)'
\echo '  - FIX_RLS_PAIEMENTS.sql (politiques RLS)'
\echo ''
