-- ============================================
-- Fix missions.statut → missions.status
-- Vérifier et corriger toutes les références
-- ============================================

-- ÉTAPE 1: Vérifier la structure de la table missions
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'missions'
ORDER BY ordinal_position;

-- ÉTAPE 2: Vérifier les policies RLS sur missions
-- ============================================
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'missions';

-- ÉTAPE 3: Vérifier les triggers sur missions
-- ============================================
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'missions';

-- ÉTAPE 4: Vérifier les fonctions qui référencent missions
-- ============================================
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_definition LIKE '%missions%'
  AND routine_schema = 'public';

-- Si tu vois une référence à 'statut' dans les résultats ci-dessus,
-- il faudra corriger la policy/trigger/fonction spécifique.

-- Message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '🔍 VÉRIFICATION TERMINÉE';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Vérifie les résultats ci-dessus:';
  RAISE NOTICE '  1. Colonne missions.status existe? (pas statut)';
  RAISE NOTICE '  2. Les policies utilisent "status" (pas statut)';
  RAISE NOTICE '  3. Les triggers utilisent "status" (pas statut)';
  RAISE NOTICE '';
  RAISE NOTICE '❌ Si tu vois "statut" quelque part:';
  RAISE NOTICE '  - Envoie-moi le nom de la policy/trigger/fonction';
  RAISE NOTICE '  - Je créerai un script pour le corriger';
  RAISE NOTICE '';
END $$;
