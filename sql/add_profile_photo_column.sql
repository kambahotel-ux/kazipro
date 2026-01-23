-- Ajouter la colonne photo_url à la table prestataires

ALTER TABLE prestataires 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Créer le bucket pour les photos de profil s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Vérification
SELECT 'Colonne photo_url ajoutée et bucket profile-photos créé' as status;
