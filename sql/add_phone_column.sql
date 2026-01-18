-- Ajouter la colonne phone à la table prestataires si elle n'existe pas
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS phone TEXT;

-- Créer un index pour les recherches
CREATE INDEX IF NOT EXISTS idx_prestataires_phone ON prestataires(phone);

-- Vérifier que la colonne existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'prestataires' 
AND column_name = 'phone';
