-- =====================================================
-- FIX RLS POLICIES FOR PRESTATAIRES INSERT
-- =====================================================
-- Permettre aux utilisateurs de créer leur propre profil prestataire

-- Supprimer les anciennes policies d'insertion si elles existent
DROP POLICY IF EXISTS "Users can insert their own prestataire profile" ON public.prestataires;
DROP POLICY IF EXISTS "Authenticated users can create prestataire profile" ON public.prestataires;

-- Créer une policy permettant aux utilisateurs authentifiés de créer leur profil
CREATE POLICY "Users can create their own prestataire profile"
  ON public.prestataires
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Vérifier les policies existantes
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
WHERE tablename = 'prestataires'
ORDER BY policyname;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Policy RLS pour insertion de prestataires créée!';
  RAISE NOTICE '✅ Les utilisateurs peuvent maintenant créer leur profil';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Testez l''inscription d''un nouveau prestataire';
END $$;
