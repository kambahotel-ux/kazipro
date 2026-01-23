-- Ajouter la colonne profile_completed à la table prestataires
-- Cette colonne indique si le prestataire a complété son profil

-- Ajouter la colonne
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prestataires' AND column_name = 'profile_completed'
  ) THEN
    ALTER TABLE prestataires ADD COLUMN profile_completed BOOLEAN DEFAULT FALSE;
    
    RAISE NOTICE 'Colonne profile_completed ajoutée à la table prestataires';
  ELSE
    RAISE NOTICE 'La colonne profile_completed existe déjà';
  END IF;
END $$;

-- Marquer les profils existants comme complétés s'ils ont une profession
UPDATE prestataires 
SET profile_completed = TRUE 
WHERE profession IS NOT NULL 
  AND profession != '' 
  AND profession != 'À définir'
  AND profile_completed = FALSE;

-- Afficher le résultat
SELECT 
  COUNT(*) as total_prestataires,
  COUNT(CASE WHEN profile_completed = TRUE THEN 1 END) as profils_complets,
  COUNT(CASE WHEN profile_completed = FALSE THEN 1 END) as profils_incomplets
FROM prestataires;
