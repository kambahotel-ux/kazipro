-- ============================================
-- Ajout de la distinction Personne Physique / Personne Morale (VERSION SÉCURISÉE)
-- ============================================
-- Cette version gère les données existantes avant d'ajouter les contraintes

-- ============================================
-- ÉTAPE 1: Ajouter les nouvelles colonnes SANS contraintes
-- ============================================

-- Type de prestataire (sans contrainte pour l'instant)
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
-- ÉTAPE 2: Migrer les données existantes
-- ============================================

-- Mettre à jour les prestataires existants comme personne physique
-- et remplir nom/prenom à partir de full_name
UPDATE prestataires 
SET 
  type_prestataire = 'physique',
  prenom = COALESCE(SPLIT_PART(full_name, ' ', 1), full_name),
  nom = COALESCE(NULLIF(SPLIT_PART(full_name, ' ', 2), ''), full_name)
WHERE type_prestataire IS NULL OR (nom IS NULL AND prenom IS NULL);

-- ============================================
-- ÉTAPE 3: Ajouter les contraintes APRÈS migration
-- ============================================

-- Contrainte sur le type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'prestataires_type_prestataire_check'
  ) THEN
    ALTER TABLE prestataires 
    ADD CONSTRAINT prestataires_type_prestataire_check 
    CHECK (type_prestataire IN ('physique', 'morale'));
  END IF;
END $$;

-- Contrainte: Si personne physique, nom et prénom requis
DO $$ 
BEGIN
  -- Supprimer l'ancienne contrainte si elle existe
  ALTER TABLE prestataires DROP CONSTRAINT IF EXISTS check_personne_physique_fields;
  
  -- Ajouter la nouvelle contrainte
  ALTER TABLE prestataires 
  ADD CONSTRAINT check_personne_physique_fields 
  CHECK (
    type_prestataire != 'physique' OR 
    (nom IS NOT NULL AND nom != '' AND prenom IS NOT NULL AND prenom != '')
  );
END $$;

-- Contrainte: Si personne morale, raison sociale requise
DO $$ 
BEGIN
  -- Supprimer l'ancienne contrainte si elle existe
  ALTER TABLE prestataires DROP CONSTRAINT IF EXISTS check_personne_morale_fields;
  
  -- Ajouter la nouvelle contrainte
  ALTER TABLE prestataires 
  ADD CONSTRAINT check_personne_morale_fields 
  CHECK (
    type_prestataire != 'morale' OR 
    (raison_sociale IS NOT NULL AND raison_sociale != '' AND representant_legal_nom IS NOT NULL AND representant_legal_nom != '')
  );
END $$;

-- Contrainte sur forme_juridique
DO $$ 
BEGIN
  ALTER TABLE prestataires DROP CONSTRAINT IF EXISTS prestataires_forme_juridique_check;
  
  ALTER TABLE prestataires 
  ADD CONSTRAINT prestataires_forme_juridique_check
  CHECK (forme_juridique IS NULL OR forme_juridique IN ('SARL', 'SA', 'SUARL', 'SNC', 'SCS', 'SCA', 'Entreprise Individuelle', 'Autre'));
END $$;

-- ============================================
-- ÉTAPE 4: Créer une fonction pour obtenir le nom complet
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
-- ÉTAPE 5: Créer une vue pour faciliter les requêtes
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
-- ÉTAPE 6: Créer des index pour les recherches
-- ============================================

CREATE INDEX IF NOT EXISTS idx_prestataires_type ON prestataires(type_prestataire);
CREATE INDEX IF NOT EXISTS idx_prestataires_nom ON prestataires(nom);
CREATE INDEX IF NOT EXISTS idx_prestataires_prenom ON prestataires(prenom);
CREATE INDEX IF NOT EXISTS idx_prestataires_raison_sociale ON prestataires(raison_sociale);
CREATE INDEX IF NOT EXISTS idx_prestataires_numero_rccm ON prestataires(numero_rccm);

-- ============================================
-- ÉTAPE 7: Mettre à jour les policies de storage (si nécessaire)
-- ============================================

-- Créer des policies pour les documents d'entreprise
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
-- ÉTAPE 8: Vérification finale
-- ============================================

-- Afficher un résumé
DO $$ 
DECLARE
  total_prestataires INTEGER;
  physiques INTEGER;
  morales INTEGER;
  sans_nom INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_prestataires FROM prestataires;
  SELECT COUNT(*) INTO physiques FROM prestataires WHERE type_prestataire = 'physique';
  SELECT COUNT(*) INTO morales FROM prestataires WHERE type_prestataire = 'morale';
  SELECT COUNT(*) INTO sans_nom FROM prestataires WHERE type_prestataire = 'physique' AND (nom IS NULL OR prenom IS NULL);
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION TERMINÉE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total prestataires: %', total_prestataires;
  RAISE NOTICE 'Personnes physiques: %', physiques;
  RAISE NOTICE 'Personnes morales: %', morales;
  RAISE NOTICE 'Prestataires sans nom/prénom: %', sans_nom;
  RAISE NOTICE '============================================';
  
  IF sans_nom > 0 THEN
    RAISE WARNING 'ATTENTION: % prestataire(s) n''ont pas de nom/prénom correctement rempli', sans_nom;
  END IF;
END $$;

-- ============================================
-- FIN - Migration complète et sécurisée
-- ============================================

COMMENT ON COLUMN prestataires.type_prestataire IS 'Type de prestataire: physique ou morale';
COMMENT ON COLUMN prestataires.raison_sociale IS 'Nom de l''entreprise (personne morale uniquement)';
COMMENT ON COLUMN prestataires.numero_rccm IS 'Numéro RCCM (Registre de Commerce)';
COMMENT ON COLUMN prestataires.representant_legal_nom IS 'Nom du représentant légal de l''entreprise';
