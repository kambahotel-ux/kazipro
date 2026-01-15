-- Ajouter la colonne experience_years à la table prestataires
ALTER TABLE prestataires 
ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN prestataires.experience_years IS 'Nombre d''années d''expérience du prestataire';

-- Optionnel : Ajouter une contrainte pour s'assurer que la valeur est positive
ALTER TABLE prestataires 
ADD CONSTRAINT experience_years_positive CHECK (experience_years >= 0);
