-- ✅ Corriger complètement la table avis
-- Ajouter toutes les colonnes manquantes

-- 1. Ajouter la colonne commentaire si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'avis' AND column_name = 'commentaire'
  ) THEN
    ALTER TABLE avis ADD COLUMN commentaire TEXT;
    RAISE NOTICE '✅ Colonne commentaire ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️ La colonne commentaire existe déjà';
  END IF;
END $$;

-- 2. Ajouter la colonne client_id si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'avis' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE avis ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Colonne client_id ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️ La colonne client_id existe déjà';
  END IF;
END $$;

-- 3. Ajouter la colonne demande_id si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'avis' AND column_name = 'demande_id'
  ) THEN
    ALTER TABLE avis ADD COLUMN demande_id UUID REFERENCES demandes(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Colonne demande_id ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️ La colonne demande_id existe déjà';
  END IF;
END $$;

-- 4. Vérifier la structure complète de la table avis
SELECT 
  '✅ Structure de la table avis' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'avis'
ORDER BY ordinal_position;

-- 5. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Table avis corrigée !';
    RAISE NOTICE '✅ Colonnes: commentaire, client_id, demande_id';
END $$;
