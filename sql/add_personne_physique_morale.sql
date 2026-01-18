-- ============================================
-- Ajout de la distinction Personne Physique / Personne Morale
-- ============================================
-- Ce script ajoute tous les champs nécessaires pour gérer
-- les prestataires personnes physiques et personnes morales

-- ============================================
-- ÉTAPE 1: Ajouter les nouvelles colonnes
-- ============================================

-- Type de prestataire (physique ou morale)
ALTER TABLE prestataires 
ADD COLUMN IF NOT EXISTS type_prestataire TEXT DEFAULT 'physique' 
CHECK (type_prestataire IN ('physique', 'morale'));

-- ============================================
-- Champs pour PERSONNE PHYSIQUE
-- ============================================

-- Nom et prénom (remplace full_name pour personne physique)
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS nom TEXT;
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS prenom TEXT;

-- Date de naissance
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS date_naissance DATE;

-- Documents d'identité
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS numero_cni TEXT;
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS photo_cni TEXT; -- URL du document

-- ============================================
-- Champs pour PERSONNE MORALE (Entreprise)
-- ============================================

-- Informations de l'entreprise
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS raison_sociale TEXT;
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS forme_juridique TEXT 
CHECK (forme_juridique IS NULL OR forme_juridique IN ('SARL', 'SA', 'SUARL', 'SNC', 'SCS', 'SCA', 'Entreprise Individuelle', 'Autre'));

-- Numéros d'identification
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS numero_rccm TEXT; -- Registre de Commerce
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS numero_impot TEXT; -- Numéro fiscal
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS numero_id_nat TEXT; -- ID Nationale

-- Représentant légal
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS representant_legal_nom TEXT;
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS representant_legal_prenom TEXT;
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS representant_legal_fonction TEXT;

-- Adresse du siège social
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS adresse_siege TEXT;
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS ville_siege TEXT;
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS pays_siege TEXT DEFAULT 'RDC';

-- Documents de l'entreprise
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS document_rccm TEXT; -- URL du RCCM
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS document_id_nat TEXT; -- URL ID Nationale
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS document_statuts TEXT; -- URL des statuts

-- ============================================
-- ÉTAPE 2: Créer des contraintes de validation
-- ============================================

-- Contrainte: Si personne physique, nom et prénom requis
ALTER TABLE prestataires 
DROP CONSTRAINT IF EXISTS check_personne_physique_fields;

ALTER TABLE prestataires 
ADD CONSTRAINT check_personne_physique_fields 
CHECK (
  type_prestataire != 'physique' OR 
  (nom IS NOT NULL AND prenom IS NOT NULL)
);

-- Contrainte: Si personne morale, raison sociale requise
ALTER TABLE prestataires 
DROP CONSTRAINT IF EXISTS check_personne_morale_fields;

ALTER TABLE prestataires 
ADD CONSTRAINT check_personne_morale_fields 
CHECK (
  type_prestataire != 'morale' OR 
  (raison_sociale IS NOT NULL AND representant_legal_nom IS NOT NULL)
);

-- ============================================
-- ÉTAPE 3: Créer une fonction pour obtenir le nom complet
-- ============================================

CREATE OR REPLACE FUNCTION get_prestataire_display_name(p prestataires)
RETURNS TEXT AS $$
BEGIN
  IF p.type_prestataire = 'physique' THEN
    RETURN COALESCE(p.prenom || ' ' || p.nom, p.full_name);
  ELSE
    RETURN COALESCE(p.raison_sociale, p.full_name);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- ÉTAPE 4: Créer une vue pour faciliter les requêtes
-- ============================================

CREATE OR REPLACE VIEW prestataires_view AS
SELECT 
  p.*,
  CASE 
    WHEN p.type_prestataire = 'physique' THEN COALESCE(p.prenom || ' ' || p.nom, p.full_name)
    ELSE COALESCE(p.raison_sociale, p.full_name)
  END AS display_name,
  CASE 
    WHEN p.type_prestataire = 'physique' THEN 'Personne Physique'
    ELSE 'Personne Morale'
  END AS type_display
FROM prestataires p;

-- ============================================
-- ÉTAPE 5: Migrer les données existantes
-- ============================================

-- Mettre à jour les prestataires existants comme personne physique
UPDATE prestataires 
SET 
  type_prestataire = 'physique',
  nom = SPLIT_PART(full_name, ' ', 2),
  prenom = SPLIT_PART(full_name, ' ', 1)
WHERE type_prestataire IS NULL OR type_prestataire = 'physique';

-- ============================================
-- ÉTAPE 6: Créer des index pour les recherches
-- ============================================

CREATE INDEX IF NOT EXISTS idx_prestataires_type ON prestataires(type_prestataire);
CREATE INDEX IF NOT EXISTS idx_prestataires_nom ON prestataires(nom);
CREATE INDEX IF NOT EXISTS idx_prestataires_prenom ON prestataires(prenom);
CREATE INDEX IF NOT EXISTS idx_prestataires_raison_sociale ON prestataires(raison_sociale);
CREATE INDEX IF NOT EXISTS idx_prestataires_numero_rccm ON prestataires(numero_rccm);

-- ============================================
-- ÉTAPE 7: Mettre à jour le Storage pour les documents
-- ============================================

-- Créer des policies pour les documents d'entreprise
CREATE POLICY "Prestataires can upload their documents" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'prestataire-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Prestataires can view their documents" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'prestataire-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all documents" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'prestataire-documents' AND
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- ============================================
-- FIN - Prestataires peuvent maintenant être
-- personne physique ou personne morale
-- ============================================

COMMENT ON COLUMN prestataires.type_prestataire IS 'Type de prestataire: physique ou morale';
COMMENT ON COLUMN prestataires.raison_sociale IS 'Nom de l''entreprise (personne morale uniquement)';
COMMENT ON COLUMN prestataires.numero_rccm IS 'Numéro RCCM (Registre de Commerce)';
COMMENT ON COLUMN prestataires.representant_legal_nom IS 'Nom du représentant légal de l''entreprise';
