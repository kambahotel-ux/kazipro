-- =====================================================
-- AJOUTER LA COLONNE EMAIL À PRESTATAIRES
-- =====================================================

-- 1. Vérifier si la colonne existe déjà
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'prestataires'
  AND column_name = 'email';

-- 2. Ajouter la colonne email si elle n'existe pas
ALTER TABLE public.prestataires 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 3. Remplir les emails existants depuis auth.users
UPDATE public.prestataires p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id
  AND (p.email IS NULL OR p.email = '');

-- 4. Vérifier le résultat
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

-- 5. Statistiques
SELECT 
  COUNT(*) as total_prestataires,
  COUNT(email) as avec_email,
  COUNT(*) - COUNT(email) as sans_email
FROM public.prestataires;

-- 6. Message de succès
DO $$
DECLARE
  column_exists BOOLEAN;
  with_email INTEGER;
  without_email INTEGER;
BEGIN
  -- Vérifier si la colonne existe
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'prestataires' 
    AND column_name = 'email'
  ) INTO column_exists;
  
  IF column_exists THEN
    -- Compter les emails
    SELECT 
      COUNT(email),
      COUNT(*) - COUNT(email)
    INTO with_email, without_email
    FROM public.prestataires;
    
    RAISE NOTICE '✅ Colonne email existe!';
    RAISE NOTICE '📊 Prestataires avec email: %', with_email;
    RAISE NOTICE '⚠️  Prestataires sans email: %', without_email;
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Rechargez la page pour voir les changements';
  ELSE
    RAISE NOTICE '❌ Erreur: La colonne email n''existe pas';
  END IF;
END $$;
