-- ============================================
-- Ajout de la distinction Personne Physique / Personne Morale (SANS CONTRAINTES OBLIGATOIRES)
-- ============================================
-- Cette version ajoute les champs sans les rendre obligatoires

-- ============================================
-- ÉTAPE 1: Ajouter les nouvelles colonnes
-- ============================================

-- Type de prestataire (par défaut physique)
ALTER TABLE prestataires 
ADD COLUMN IF NOT EXISTS type_prestataire TEXT DEFAULT 'physique';

-- ============================================
-- Champs pour PERSONNE PHYSIQUE
-- ============================================

ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS nom TEXT;
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS prenom TEXT;
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS date_naissance DATE;
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS numero_cni TEXT;
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS photo_cni TEXT;

-- ============================================
-- Champs pour PERSONNE MORALE (Entreprise)
-- ============================================

ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS raison_sociale TEXT;
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS forme_juridique TEXT;
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS numero_rccm TEXT;
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS numero_impot TEXT;
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS numero_id_nat TEXT;
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS representant_legal_nom TEXT;
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS representant_legal_prenom TEXT;
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS representant_legal_fonction TEXT;
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS adresse_siege TEXT;
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS ville_siege TEXT;
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS pays_siege TEXT DEFAULT 'RDC';
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS document_rccm TEXT;
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS document_id_nat TEXT;
ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS document_statuts TEXT;

-- ============================================
-- ÉTAPE 2: Supprimer les contraintes si elles existent
-- ============================================

ALTER TABLE prestataires DROP CONSTRAINT IF EXISTS check_personne_physique_fields;
ALTER TABLE prestataires DROP CONSTRAINT IF EXISTS check_personne_morale_fields;
ALTER TABLE prestataires DROP CONSTRAINT IF EXISTS prestataires_type_prestataire_check;
ALTER TABLE prestataires DROP CONSTRAINT IF EXISTS prestataires_forme_juridique_check;

-- ============================================
-- ÉTAPE 3: Ajouter UNIQUEMENT la contrainte sur le type (physique ou morale)
-- ============================================

ALTER TABLE prestataires 
ADD CONSTRAINT prestataires_type_prestataire_check 
CHECK (type_prestataire IN ('physique', 'morale'));

-- ============================================
-- ÉTAPE 4: Ajouter la contrainte sur forme_juridique (optionnel)
-- ============================================

ALTER TABLE prestataires 
ADD CONSTRAINT prestataires_forme_juridique_check
CHECK (forme_juridique IS NULL OR forme_juridique IN ('SARL', 'SA', 'SUARL', 'SNC', 'SCS', 'SCA', 'Entreprise Individuelle', 'Autre'));

-- ============================================
-- ÉTAPE 5: Migrer les données existantes (optionnel)
-- ============================================

-- Mettre à jour les prestataires existants comme personne physique
-- et essayer de remplir nom/prenom à partir de full_name
UPDATE prestataires 
SET 
  type_prestataire = COALESCE(type_prestataire, 'physique'),
  prenom = COALESCE(prenom, SPLIT_PART(full_name, ' ', 1)),
  nom = COALESCE(nom, NULLIF(SPLIT_PART(full_name, ' ', 2), ''), SPLIT_PART(full_name, ' ', 1))
WHERE type_prestataire IS NULL OR type_prestataire = 'physique';

-- ============================================
-- ÉTAPE 6: Créer une fonction pour obtenir le nom complet
-- ============================================

CREATE OR REPLACE FUNCTION get_prestataire_display_name(p prestataires)
RETURNS TEXT AS $$
BEGIN
  IF p.type_prestataire = 'physique' THEN
    IF p.prenom IS NOT NULL AND p.nom IS NOT NULL THEN
      RETURN p.prenom || ' ' || p.nom;
    ELSE
      RETURN p.full_name;
    END IF;
  ELSE
    RETURN COALESCE(p.raison_sociale, p.full_name);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- ÉTAPE 7: Créer une vue pour faciliter les requêtes
-- ============================================

CREATE OR REPLACE VIEW prestataires_view AS
SELECT 
  p.*,
  CASE 
    WHEN p.type_prestataire = 'physique' THEN 
      COALESCE(
        CASE WHEN p.prenom IS NOT NULL AND p.nom IS NOT NULL 
          THEN p.prenom || ' ' || p.nom 
          ELSE NULL 
        END,
        p.full_name
      )
    ELSE COALESCE(p.raison_sociale, p.full_name)
  END AS display_name,
  CASE 
    WHEN p.type_prestataire = 'physique' THEN 'Personne Physique'
    ELSE 'Personne Morale'
  END AS type_display
FROM prestataires p;

-- ============================================
-- ÉTAPE 8: Créer des index pour les recherches
-- ============================================

CREATE INDEX IF NOT EXISTS idx_prestataires_type ON prestataires(type_prestataire);
CREATE INDEX IF NOT EXISTS idx_prestataires_nom ON prestataires(nom);
CREATE INDEX IF NOT EXISTS idx_prestataires_prenom ON prestataires(prenom);
CREATE INDEX IF NOT EXISTS idx_prestataires_raison_sociale ON prestataires(raison_sociale);
CREATE INDEX IF NOT EXISTS idx_prestataires_numero_rccm ON prestataires(numero_rccm);

-- ============================================
-- ÉTAPE 9: Mettre à jour les policies de storage (si nécessaire)
-- ============================================

DO $$ 
BEGIN
  -- Supprimer les anciennes policies si elles existent
  DROP POLICY IF EXISTS "Prestataires can upload their documents" ON storage.objects;
  DROP POLICY IF EXISTS "Prestataires can view their documents" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;
  
  -- Créer les nouvelles policies
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
EXCEPTION
  WHEN OTHERS THEN
    -- Ignorer les erreurs si les policies existent déjà ou si le bucket n'existe pas
    NULL;
END $$;

-- ============================================
-- ÉTAPE 10: Vérification finale
-- ============================================

DO $$ 
DECLARE
  total_prestataires INTEGER;
  physiques INTEGER;
  morales INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_prestataires FROM prestataires;
  SELECT COUNT(*) INTO physiques FROM prestataires WHERE type_prestataire = 'physique';
  SELECT COUNT(*) INTO morales FROM prestataires WHERE type_prestataire = 'morale';
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION TERMINÉE (SANS CONTRAINTES OBLIGATOIRES)';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total prestataires: %', total_prestataires;
  RAISE NOTICE 'Personnes physiques: %', physiques;
  RAISE NOTICE 'Personnes morales: %', morales;
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Les champs nom, prenom, raison_sociale sont OPTIONNELS';
  RAISE NOTICE '============================================';
END $$;

-- ============================================
-- FIN - Migration complète SANS contraintes obligatoires
-- ============================================

COMMENT ON COLUMN prestataires.type_prestataire IS 'Type de prestataire: physique ou morale';
COMMENT ON COLUMN prestataires.nom IS 'Nom de famille (personne physique) - OPTIONNEL';
COMMENT ON COLUMN prestataires.prenom IS 'Prénom (personne physique) - OPTIONNEL';
COMMENT ON COLUMN prestataires.raison_sociale IS 'Nom de l''entreprise (personne morale) - OPTIONNEL';
COMMENT ON COLUMN prestataires.numero_rccm IS 'Numéro RCCM (Registre de Commerce) - OPTIONNEL';
COMMENT ON COLUMN prestataires.representant_legal_nom IS 'Nom du représentant légal de l''entreprise - OPTIONNEL';
