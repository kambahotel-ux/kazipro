-- =====================================================
-- AJOUTER COLONNE EMAIL À PRESTATAIRES
-- =====================================================
-- Solution pour afficher l'email des prestataires dans l'admin

-- Option 1: Ajouter une colonne email (SIMPLE)
-- =====================================================

-- Ajouter la colonne email si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prestataires' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.prestataires ADD COLUMN email TEXT;
    RAISE NOTICE '✅ Colonne email ajoutée à prestataires';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne email existe déjà';
  END IF;
END $$;

-- Remplir les emails existants depuis auth.users
UPDATE public.prestataires p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id
  AND p.email IS NULL;

-- Créer un trigger pour auto-remplir l'email lors de l'insertion
CREATE OR REPLACE FUNCTION public.set_prestataire_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Récupérer l'email depuis auth.users
  SELECT email INTO NEW.email
  FROM auth.users
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_set_prestataire_email ON public.prestataires;

-- Créer le trigger
CREATE TRIGGER trigger_set_prestataire_email
  BEFORE INSERT ON public.prestataires
  FOR EACH ROW
  EXECUTE FUNCTION public.set_prestataire_email();

-- =====================================================
-- Option 2: Créer une vue (AVANCÉ)
-- =====================================================

-- Créer une vue qui joint prestataires et auth.users
CREATE OR REPLACE VIEW public.prestataires_with_email AS
SELECT 
  p.*,
  u.email,
  u.email_confirmed_at,
  u.last_sign_in_at
FROM public.prestataires p
LEFT JOIN auth.users u ON p.user_id = u.id;

-- Donner les permissions sur la vue
GRANT SELECT ON public.prestataires_with_email TO authenticated;
GRANT SELECT ON public.prestataires_with_email TO anon;

-- =====================================================
-- VÉRIFICATION
-- =====================================================

-- Vérifier que les emails sont bien remplis
SELECT 
  id,
  full_name,
  profession,
  email,
  verified,
  created_at
FROM public.prestataires
ORDER BY created_at DESC
LIMIT 10;

-- Vérifier la vue
SELECT 
  id,
  full_name,
  profession,
  email,
  verified
FROM public.prestataires_with_email
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
DECLARE
  email_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO email_count
  FROM public.prestataires
  WHERE email IS NOT NULL;
  
  RAISE NOTICE '✅ Configuration terminée!';
  RAISE NOTICE '📊 Prestataires avec email: %', email_count;
  RAISE NOTICE '';
  RAISE NOTICE '📝 Prochaines étapes:';
  RAISE NOTICE '1. Rechargez la page admin des prestataires';
  RAISE NOTICE '2. Les emails devraient maintenant s''afficher';
  RAISE NOTICE '3. Les nouveaux prestataires auront automatiquement leur email';
END $$;
