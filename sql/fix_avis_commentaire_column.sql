-- Corriger la table avis : ajouter la colonne commentaire si elle n'existe pas

-- 1. Ajouter la colonne commentaire
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'avis' AND column_name = 'commentaire'
  ) THEN
    ALTER TABLE avis ADD COLUMN commentaire TEXT;
    RAISE NOTICE 'Colonne commentaire ajoutée à la table avis';
  ELSE
    RAISE NOTICE 'La colonne commentaire existe déjà dans la table avis';
  END IF;
END $$;

-- 2. Vérifier la structure complète de la table avis
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'avis'
ORDER BY ordinal_position;
