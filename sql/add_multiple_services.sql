-- ============================================
-- Système de Services Multiples pour Prestataires
-- ============================================

-- 1. Créer table prestataire_services (relation many-to-many)
CREATE TABLE IF NOT EXISTS prestataire_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestataire_id UUID NOT NULL REFERENCES prestataires(id) ON DELETE CASCADE,
  service TEXT NOT NULL,
  niveau_competence TEXT DEFAULT 'intermediaire' CHECK (niveau_competence IN ('debutant', 'intermediaire', 'expert')),
  annees_experience INTEGER DEFAULT 0,
  tarif_horaire INTEGER,
  principal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prestataire_id, service)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_prestataire_services_prestataire ON prestataire_services(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_prestataire_services_service ON prestataire_services(service);
CREATE INDEX IF NOT EXISTS idx_prestataire_services_principal ON prestataire_services(principal);

COMMENT ON TABLE prestataire_services IS 'Services proposés par les prestataires avec détails';
COMMENT ON COLUMN prestataire_services.principal IS 'Indique si c''est le service principal du prestataire';
COMMENT ON COLUMN prestataire_services.niveau_competence IS 'Niveau de compétence: debutant, intermediaire, expert';

-- 2. RLS Policies pour prestataire_services
ALTER TABLE prestataire_services ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les services des prestataires
DROP POLICY IF EXISTS "Public can view provider services" ON prestataire_services;
CREATE POLICY "Public can view provider services" ON prestataire_services
  FOR SELECT USING (true);

-- Prestataires peuvent gérer leurs propres services
DROP POLICY IF EXISTS "Prestataires can manage their services" ON prestataire_services;
CREATE POLICY "Prestataires can manage their services" ON prestataire_services
  FOR ALL USING (
    prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
  );

-- Admins peuvent tout gérer (si vous avez une table admins séparée)
-- Sinon, commentez cette policy
-- DROP POLICY IF EXISTS "Admins can manage all services" ON prestataire_services;
-- CREATE POLICY "Admins can manage all services" ON prestataire_services
--   FOR ALL USING (
--     EXISTS (
--       SELECT 1 FROM admins 
--       WHERE user_id = auth.uid()
--     )
--   );

-- 3. Fonction pour migrer les services existants
CREATE OR REPLACE FUNCTION migrate_existing_services()
RETURNS void AS $$
BEGIN
  -- Insérer les professions existantes comme service principal
  INSERT INTO prestataire_services (prestataire_id, service, principal, annees_experience)
  SELECT 
    id,
    profession,
    true,
    0  -- Valeur par défaut si la colonne experience_years n'existe pas
  FROM prestataires
  WHERE profession IS NOT NULL 
    AND profession != ''
    AND NOT EXISTS (
      SELECT 1 FROM prestataire_services ps 
      WHERE ps.prestataire_id = prestataires.id 
        AND ps.service = prestataires.profession
    );
  
  RAISE NOTICE 'Migration des services existants terminée';
END;
$$ LANGUAGE plpgsql;

-- Exécuter la migration
SELECT migrate_existing_services();

-- 4. Fonction pour obtenir tous les services d'un prestataire
CREATE OR REPLACE FUNCTION get_prestataire_services(p_prestataire_id UUID)
RETURNS TABLE (
  service TEXT,
  niveau_competence TEXT,
  annees_experience INTEGER,
  tarif_horaire INTEGER,
  principal BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.service,
    ps.niveau_competence,
    ps.annees_experience,
    ps.tarif_horaire,
    ps.principal
  FROM prestataire_services ps
  WHERE ps.prestataire_id = p_prestataire_id
  ORDER BY ps.principal DESC, ps.service ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fonction pour définir le service principal
CREATE OR REPLACE FUNCTION set_principal_service(
  p_prestataire_id UUID,
  p_service TEXT
)
RETURNS void AS $$
BEGIN
  -- Retirer le flag principal de tous les services
  UPDATE prestataire_services
  SET principal = false
  WHERE prestataire_id = p_prestataire_id;
  
  -- Définir le nouveau service principal
  UPDATE prestataire_services
  SET principal = true
  WHERE prestataire_id = p_prestataire_id 
    AND service = p_service;
  
  -- Mettre à jour la colonne profession dans prestataires
  UPDATE prestataires
  SET profession = p_service
  WHERE id = p_prestataire_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_prestataire_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_prestataire_services_updated_at ON prestataire_services;
CREATE TRIGGER trigger_update_prestataire_services_updated_at
  BEFORE UPDATE ON prestataire_services
  FOR EACH ROW
  EXECUTE FUNCTION update_prestataire_services_updated_at();

-- 7. Vue pour faciliter les requêtes
CREATE OR REPLACE VIEW prestataires_with_services AS
SELECT 
  p.*,
  COALESCE(
    json_agg(
      json_build_object(
        'service', ps.service,
        'niveau_competence', ps.niveau_competence,
        'annees_experience', ps.annees_experience,
        'tarif_horaire', ps.tarif_horaire,
        'principal', ps.principal
      ) ORDER BY ps.principal DESC, ps.service ASC
    ) FILTER (WHERE ps.id IS NOT NULL),
    '[]'::json
  ) as services
FROM prestataires p
LEFT JOIN prestataire_services ps ON p.id = ps.prestataire_id
GROUP BY p.id;

-- ============================================
-- FIN
-- ============================================
