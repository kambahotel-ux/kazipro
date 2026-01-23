-- Corriger la table avis en ajoutant la colonne prestataire_id

-- 1. Ajouter la colonne prestataire_id si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'avis' AND column_name = 'prestataire_id'
  ) THEN
    ALTER TABLE avis ADD COLUMN prestataire_id UUID REFERENCES prestataires(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_avis_prestataire_id ON avis(prestataire_id);
    RAISE NOTICE 'Colonne prestataire_id ajoutée à la table avis';
  ELSE
    RAISE NOTICE 'La colonne prestataire_id existe déjà dans la table avis';
  END IF;
END $$;

-- 2. Vérifier la structure de la table avis
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'avis'
ORDER BY ordinal_position;
