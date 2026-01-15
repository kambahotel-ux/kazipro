-- =====================================================
-- VÉRIFIER TOUTES LES POLICIES PRESTATAIRES
-- =====================================================

-- 1. Voir toutes les policies actuelles
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN substring(qual::text, 1, 100)
    ELSE 'No USING'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN substring(with_check::text, 1, 100)
    ELSE 'No WITH CHECK'
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'prestataires'
ORDER BY cmd, policyname;

-- 2. Vérifier si des policies utilisent auth.users (PROBLÈME!)
SELECT 
  policyname,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'prestataires'
  AND (
    qual::text LIKE '%auth.users%' 
    OR with_check::text LIKE '%auth.users%'
  );

-- 3. Message
DO $$
DECLARE
  bad_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO bad_policies
  FROM pg_policies
  WHERE tablename = 'prestataires'
    AND (
      qual::text LIKE '%auth.users%' 
      OR with_check::text LIKE '%auth.users%'
    );
  
  IF bad_policies > 0 THEN
    RAISE NOTICE '⚠️  ATTENTION: % policies utilisent auth.users (ERREUR!)', bad_policies;
    RAISE NOTICE '📝 Exécutez sql/fix_admin_update_simple.sql pour corriger';
  ELSE
    RAISE NOTICE '✅ Aucune policy ne référence auth.users';
    RAISE NOTICE '✅ Les policies sont correctes';
  END IF;
END $$;
