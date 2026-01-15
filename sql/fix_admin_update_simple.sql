-- =====================================================
-- FIX SIMPLE: Admin Update Prestataires
-- =====================================================
-- On ne peut pas accéder à auth.users dans les policies RLS
-- Solution: Utiliser auth.jwt() pour vérifier l'email

-- 1. Supprimer les anciennes policies UPDATE
DROP POLICY IF EXISTS "prestataires_update_own" ON public.prestataires;
DROP POLICY IF EXISTS "Admin can update all prestataires" ON public.prestataires;
DROP POLICY IF EXISTS "admin_update_all_prestataires" ON public.prestataires;

-- 2. Policy pour que les prestataires modifient leur propre profil
CREATE POLICY "prestataires_update_own"
  ON public.prestataires
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Policy pour que l'admin modifie tous les prestataires
-- Utiliser auth.jwt() au lieu de auth.users
CREATE POLICY "admin_update_all_prestataires"
  ON public.prestataires
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'email') = 'admin@kazipro.com'
  )
  WITH CHECK (
    (auth.jwt() ->> 'email') = 'admin@kazipro.com'
  );

-- 4. Vérifier les policies créées
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
WHERE tablename = 'prestataires' AND cmd = 'UPDATE'
ORDER BY policyname;

-- 5. Message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Policies UPDATE créées avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Policies actives:';
  RAISE NOTICE '   1. prestataires_update_own - Les prestataires peuvent modifier leur profil';
  RAISE NOTICE '   2. admin_update_all_prestataires - Admin peut tout modifier';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Rechargez la page admin et réessayez de vérifier un prestataire';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Important: Vous devez être connecté avec admin@kazipro.com';
END $$;
