-- =====================================================
-- FIX: Admin ne peut pas mettre à jour les prestataires
-- =====================================================

-- 1. Vérifier les policies actuelles
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'prestataires'
ORDER BY cmd, policyname;

-- 2. Supprimer les anciennes policies UPDATE si elles existent
DROP POLICY IF EXISTS "prestataires_update_own" ON public.prestataires;
DROP POLICY IF EXISTS "Admin can update all prestataires" ON public.prestataires;

-- 3. Créer une policy pour que les prestataires puissent modifier leur propre profil
CREATE POLICY "prestataires_update_own"
  ON public.prestataires
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Créer une policy pour que l'admin puisse modifier tous les prestataires
CREATE POLICY "Admin can update all prestataires"
  ON public.prestataires
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@kazipro.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@kazipro.com'
    )
  );

-- 5. Vérifier les nouvelles policies
SELECT 
  policyname,
  cmd,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual::text
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check::text
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'prestataires' AND cmd = 'UPDATE'
ORDER BY policyname;

-- 6. Test: Essayer de mettre à jour un prestataire (remplacez l'ID)
-- UPDATE public.prestataires 
-- SET verified = true, documents_verified = true
-- WHERE id = 'VOTRE_ID_ICI';

-- Message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Policies UPDATE créées pour prestataires!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 L''admin peut maintenant:';
  RAISE NOTICE '   - Vérifier les prestataires (verified = true)';
  RAISE NOTICE '   - Rejeter les prestataires (verified = false)';
  RAISE NOTICE '   - Modifier tous les champs';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Rechargez la page admin et réessayez';
END $$;
