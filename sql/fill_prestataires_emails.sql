-- =====================================================
-- REMPLIR LES EMAILS DES PRESTATAIRES
-- =====================================================
-- La colonne email existe déjà, on remplit juste les valeurs

-- Remplir les emails manquants depuis auth.users
UPDATE public.prestataires p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id
  AND (p.email IS NULL OR p.email = '');

-- Vérifier le résultat
SELECT 
  id,
  full_name,
  email,
  profession,
  verified,
  created_at
FROM public.prestataires
ORDER BY created_at DESC
LIMIT 10;

-- Statistiques
SELECT 
  COUNT(*) as total_prestataires,
  COUNT(email) as avec_email,
  COUNT(*) - COUNT(email) as sans_email
FROM public.prestataires;

-- Message de succès
DO $$
DECLARE
  with_email INTEGER;
  without_email INTEGER;
BEGIN
  SELECT 
    COUNT(email),
    COUNT(*) - COUNT(email)
  INTO with_email, without_email
  FROM public.prestataires;
  
  RAISE NOTICE '✅ Emails mis à jour!';
  RAISE NOTICE '📊 Prestataires avec email: %', with_email;
  RAISE NOTICE '⚠️  Prestataires sans email: %', without_email;
  RAISE NOTICE '';
  RAISE NOTICE '📝 Rechargez la page admin pour voir les emails';
END $$;
