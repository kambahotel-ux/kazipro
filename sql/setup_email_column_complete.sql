-- =====================================================
-- SETUP COMPLET: Colonne Email pour Prestataires
-- =====================================================

-- ÉTAPE 1: Ajouter la colonne email
-- =====================================================
ALTER TABLE public.prestataires 
ADD COLUMN IF NOT EXISTS email TEXT;

-- ÉTAPE 2: Remplir les emails existants
-- =====================================================
UPDATE public.prestataires p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id
  AND (p.email IS NULL OR p.email = '');

-- ÉTAPE 3: Créer une fonction pour auto-remplir l'email
-- =====================================================
CREATE OR REPLACE FUNCTION public.auto_fill_prestataire_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Si l'email n'est pas fourni, le récupérer depuis auth.users
  IF NEW.email IS NULL OR NEW.email = '' THEN
    SELECT email INTO NEW.email
    FROM auth.users
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ÉTAPE 4: Créer le trigger
-- =====================================================
DROP TRIGGER IF EXISTS trigger_auto_fill_prestataire_email ON public.prestataires;

CREATE TRIGGER trigger_auto_fill_prestataire_email
  BEFORE INSERT OR UPDATE ON public.prestataires
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_fill_prestataire_email();

-- ÉTAPE 5: Vérifier le résultat
-- =====================================================
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

-- ÉTAPE 6: Statistiques
-- =====================================================
SELECT 
  COUNT(*) as total_prestataires,
  COUNT(email) as avec_email,
  COUNT(*) - COUNT(email) as sans_email,
  ROUND(100.0 * COUNT(email) / NULLIF(COUNT(*), 0), 2) as pourcentage_avec_email
FROM public.prestataires;

-- ÉTAPE 7: Vérifier que le trigger existe
-- =====================================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'prestataires'
  AND trigger_name = 'trigger_auto_fill_prestataire_email';

-- ÉTAPE 8: Message de succès
-- =====================================================
DO $$
DECLARE
  column_exists BOOLEAN;
  trigger_exists BOOLEAN;
  with_email INTEGER;
  total INTEGER;
BEGIN
  -- Vérifier la colonne
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'prestataires' 
    AND column_name = 'email'
  ) INTO column_exists;
  
  -- Vérifier le trigger
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.triggers
    WHERE event_object_table = 'prestataires'
    AND trigger_name = 'trigger_auto_fill_prestataire_email'
  ) INTO trigger_exists;
  
  -- Compter les emails
  SELECT 
    COUNT(email),
    COUNT(*)
  INTO with_email, total
  FROM public.prestataires;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SETUP COMPLET TERMINÉ!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  IF column_exists THEN
    RAISE NOTICE '✅ Colonne email: EXISTE';
  ELSE
    RAISE NOTICE '❌ Colonne email: N''EXISTE PAS';
  END IF;
  
  IF trigger_exists THEN
    RAISE NOTICE '✅ Trigger auto-fill: ACTIF';
  ELSE
    RAISE NOTICE '❌ Trigger auto-fill: INACTIF';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Statistiques:';
  RAISE NOTICE '   - Total prestataires: %', total;
  RAISE NOTICE '   - Avec email: %', with_email;
  RAISE NOTICE '   - Sans email: %', total - with_email;
  
  IF total > 0 THEN
    RAISE NOTICE '   - Pourcentage: %%%', ROUND(100.0 * with_email / total, 2);
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Prochaines étapes:';
  RAISE NOTICE '   1. Rechargez la page admin';
  RAISE NOTICE '   2. Les emails devraient s''afficher';
  RAISE NOTICE '   3. Les nouveaux prestataires auront automatiquement leur email';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
