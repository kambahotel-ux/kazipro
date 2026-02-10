-- ============================================
-- INSTALLATION COMPLÈTE - SYSTÈME DE PAIEMENT
-- KaziPro - Exécuter ce fichier dans Supabase SQL Editor
-- ============================================

-- ÉTAPE 1: Créer toutes les tables
\i sql/create_systeme_paiement_complet.sql

-- ÉTAPE 2: Créer les RLS policies
\i sql/create_rls_policies_paiement.sql

-- ÉTAPE 3: Créer les fonctions SQL
\i sql/create_functions_paiement.sql

-- ÉTAPE 4: Créer les storage buckets
\i sql/create_storage_paiement.sql

-- Message final
DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ============================================';
  RAISE NOTICE '🎉 INSTALLATION TERMINÉE AVEC SUCCÈS!';
  RAISE NOTICE '🎉 ============================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tables créées: 10';
  RAISE NOTICE '✅ RLS Policies: 30+';
  RAISE NOTICE '✅ Fonctions SQL: 4';
  RAISE NOTICE '✅ Storage Buckets: 4';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Prochaines étapes:';
  RAISE NOTICE '1. Vérifier que toutes les tables existent';
  RAISE NOTICE '2. Tester les fonctions SQL';
  RAISE NOTICE '3. Configurer les paramètres admin';
  RAISE NOTICE '4. Commencer l''implémentation frontend';
  RAISE NOTICE '';
END $;
