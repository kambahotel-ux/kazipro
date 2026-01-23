-- Corriger et ajouter toutes les colonnes manquantes dans la table prestataires
-- Ce script est idempotent (peut être exécuté plusieurs fois sans problème)

-- 1. Ajouter la colonne email si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prestataires' AND column_name = 'email'
  ) THEN
    ALTER TABLE prestataires ADD COLUMN email TEXT;
    CREATE INDEX IF NOT EXISTS idx_prestataires_email ON prestataires(email);
    RAISE NOTICE 'Colonne email ajoutée';
  END IF;
END $$;

-- 2. Ajouter la colonne profile_completed si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prestataires' AND column_name = 'profile_completed'
  ) THEN
    ALTER TABLE prestataires ADD COLUMN profile_completed BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Colonne profile_completed ajoutée';
  END IF;
END $$;

-- 3. Ajouter la colonne disponible si elle n'existe pas (pour compatibilité)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prestataires' AND column_name = 'disponible'
  ) THEN
    ALTER TABLE prestataires ADD COLUMN disponible BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Colonne disponible ajoutée';
  END IF;
END $$;

-- 4. Ajouter la colonne telephone si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prestataires' AND column_name = 'telephone'
  ) THEN
    ALTER TABLE prestataires ADD COLUMN telephone TEXT;
    RAISE NOTICE 'Colonne telephone ajoutée';
  END IF;
END $$;

-- 5. Ajouter la colonne city si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prestataires' AND column_name = 'city'
  ) THEN
    ALTER TABLE prestataires ADD COLUMN city TEXT;
    RAISE NOTICE 'Colonne city ajoutée';
  END IF;
END $$;

-- 6. Ajouter la colonne bio si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prestataires' AND column_name = 'bio'
  ) THEN
    ALTER TABLE prestataires ADD COLUMN bio TEXT;
    RAISE NOTICE 'Colonne bio ajoutée';
  END IF;
END $$;

-- 7. Ajouter la colonne experience_years si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prestataires' AND column_name = 'experience_years'
  ) THEN
    ALTER TABLE prestataires ADD COLUMN experience_years INTEGER;
    RAISE NOTICE 'Colonne experience_years ajoutée';
  END IF;
END $$;

-- 8. Mettre à jour les emails manquants depuis auth.users
UPDATE prestataires p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND p.email IS NULL;

-- 9. Marquer les profils existants comme complétés s'ils ont une profession
UPDATE prestataires 
SET profile_completed = TRUE 
WHERE profession IS NOT NULL 
  AND profession != '' 
  AND profession != 'À définir'
  AND profile_completed = FALSE;

-- 10. Afficher le résultat
SELECT 
  'prestataires' as table_name,
  COUNT(*) as total,
  COUNT(CASE WHEN profile_completed = TRUE THEN 1 END) as profils_complets,
  COUNT(CASE WHEN profile_completed = FALSE THEN 1 END) as profils_incomplets,
  COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as avec_email
FROM prestataires;

-- 11. Afficher les colonnes de la table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'prestataires'
ORDER BY ordinal_position;
