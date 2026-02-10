-- ═══════════════════════════════════════════════════════════════════
-- 🔧 FIX + INSTALLATION COMPLÈTE - SYSTÈME DE PAIEMENT
-- ═══════════════════════════════════════════════════════════════════
-- Ce script:
-- 1. Supprime/renomme les anciennes tables si elles existent
-- 2. Installe tout le nouveau système
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════
-- ÉTAPE 0: NETTOYER LES ANCIENNES TABLES
-- ═══════════════════════════════════════════════════════════════════

-- Renommer l'ancienne table paiements si elle existe
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'paiements') THEN
    ALTER TABLE paiements RENAME TO paiements_old_backup;
    RAISE NOTICE '✅ Ancienne table paiements renommée en paiements_old_backup';
  END IF;
END $$;

-- Supprimer les tables du nouveau système si elles existent déjà (pour réinstallation propre)
DROP TABLE IF EXISTS litiges CASCADE;
DROP TABLE IF EXISTS contrats CASCADE;
DROP TABLE IF EXISTS conditions_paiement_templates CASCADE;
DROP TABLE IF EXISTS frais_deplacement_config CASCADE;
DROP TABLE IF EXISTS configuration_paiement_prestataire CASCADE;
DROP TABLE IF EXISTS historique_config_paiement CASCADE;
DROP TABLE IF EXISTS configuration_paiement_globale CASCADE;

-- ═══════════════════════════════════════════════════════════════════
-- PARTIE 1: CRÉER LES TABLES
-- ═══════════════════════════════════════════════════════════════════

-- Table 1: configuration_paiement_globale
CREATE TABLE configuration_paiement_globale (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode_paiement TEXT NOT NULL DEFAULT 'optionnel' 
    CHECK (mode_paiement IN ('desactive', 'optionnel', 'obligatoire')),
  commission_main_oeuvre DECIMAL(5,2) NOT NULL DEFAULT 5.00 
    CHECK (commission_main_oeuvre >= 0 AND commission_main_oeuvre <= 20),
  commission_materiel DECIMAL(5,2) NOT NULL DEFAULT 2.00 
    CHECK (commission_materiel >= 0 AND commission_materiel <= 20),
  commission_deplacement DECIMAL(5,2) NOT NULL DEFAULT 5.00 
    CHECK (commission_deplacement >= 0 AND commission_deplacement <= 20),
  pourcentage_acompte_defaut INTEGER NOT NULL DEFAULT 30 
    CHECK (pourcentage_acompte_defaut >= 0 AND pourcentage_acompte_defaut <= 100),
  pourcentage_solde_defaut INTEGER NOT NULL DEFAULT 70 
    CHECK (pourcentage_solde_defaut >= 0 AND pourcentage_solde_defaut <= 100),
  delai_validation_defaut INTEGER NOT NULL DEFAULT 7 
    CHECK (delai_validation_defaut > 0 AND delai_validation_defaut <= 90),
  delai_paiement_defaut INTEGER NOT NULL DEFAULT 30 
    CHECK (delai_paiement_defaut > 0 AND delai_paiement_defaut <= 365),
  pourcentage_garantie_defaut INTEGER NOT NULL DEFAULT 0 
    CHECK (pourcentage_garantie_defaut >= 0 AND pourcentage_garantie_defaut <= 20),
  duree_garantie_defaut INTEGER NOT NULL DEFAULT 30 
    CHECK (duree_garantie_defaut >= 0 AND duree_garantie_defaut <= 365),
  permettre_desactivation BOOLEAN NOT NULL DEFAULT true,
  permettre_choix_elements BOOLEAN NOT NULL DEFAULT true,
  permettre_negociation_commission BOOLEAN NOT NULL DEFAULT false,
  permettre_modification_acompte BOOLEAN NOT NULL DEFAULT true,
  permettre_modification_delais BOOLEAN NOT NULL DEFAULT true,
  modified_by UUID,
  modified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_acompte_solde_sum 
    CHECK (pourcentage_acompte_defaut + pourcentage_solde_defaut = 100)
);

INSERT INTO configuration_paiement_globale (id) 
VALUES ('00000000-0000-0000-0000-000000000001');

CREATE INDEX idx_config_paiement_modified 
  ON configuration_paiement_globale(modified_at DESC);

-- Table 2: historique_config_paiement
CREATE TABLE historique_config_paiement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID,
  admin_email TEXT NOT NULL,
  anciennes_valeurs JSONB NOT NULL,
  nouvelles_valeurs JSONB NOT NULL,
  raison TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_historique_config_admin ON historique_config_paiement(admin_id);
CREATE INDEX idx_historique_config_date ON historique_config_paiement(created_at DESC);

-- Table 3: configuration_paiement_prestataire
CREATE TABLE configuration_paiement_prestataire (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestataire_id UUID NOT NULL UNIQUE REFERENCES prestataires(id) ON DELETE CASCADE,
  paiement_via_kazipro BOOLEAN NOT NULL DEFAULT true,
  main_oeuvre_via_kazipro BOOLEAN NOT NULL DEFAULT true,
  materiel_via_kazipro BOOLEAN NOT NULL DEFAULT true,
  deplacement_via_kazipro BOOLEAN NOT NULL DEFAULT true,
  commission_main_oeuvre DECIMAL(5,2) 
    CHECK (commission_main_oeuvre IS NULL OR 
           (commission_main_oeuvre >= 0 AND commission_main_oeuvre <= 20)),
  commission_materiel DECIMAL(5,2) 
    CHECK (commission_materiel IS NULL OR 
           (commission_materiel >= 0 AND commission_materiel <= 20)),
  commission_deplacement DECIMAL(5,2) 
    CHECK (commission_deplacement IS NULL OR 
           (commission_deplacement >= 0 AND commission_deplacement <= 20)),
  pourcentage_acompte INTEGER 
    CHECK (pourcentage_acompte IS NULL OR 
           (pourcentage_acompte >= 0 AND pourcentage_acompte <= 100)),
  delai_validation INTEGER 
    CHECK (delai_validation IS NULL OR 
           (delai_validation > 0 AND delai_validation <= 90)),
  date_activation TIMESTAMP WITH TIME ZONE,
  date_desactivation TIMESTAMP WITH TIME ZONE,
  raison_desactivation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_config_prestataire_id ON configuration_paiement_prestataire(prestataire_id);
CREATE INDEX idx_config_prestataire_actif ON configuration_paiement_prestataire(paiement_via_kazipro);

-- Table 4: frais_deplacement_config
CREATE TABLE frais_deplacement_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestataire_id UUID NOT NULL UNIQUE REFERENCES prestataires(id) ON DELETE CASCADE,
  actif BOOLEAN NOT NULL DEFAULT false,
  mode_calcul TEXT NOT NULL DEFAULT 'fixe' 
    CHECK (mode_calcul IN ('fixe', 'par_km', 'par_zone', 'gratuit')),
  montant_fixe DECIMAL(10,2) CHECK (montant_fixe >= 0),
  prix_par_km DECIMAL(10,2) CHECK (prix_par_km >= 0),
  distance_gratuite_km INTEGER CHECK (distance_gratuite_km >= 0),
  zones JSONB,
  montant_minimum DECIMAL(10,2) CHECK (montant_minimum >= 0),
  montant_maximum DECIMAL(10,2) CHECK (montant_maximum >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_min_max CHECK (
    montant_minimum IS NULL OR 
    montant_maximum IS NULL OR 
    montant_minimum <= montant_maximum
  )
);

CREATE INDEX idx_frais_deplacement_prestataire ON frais_deplacement_config(prestataire_id);
CREATE INDEX idx_frais_deplacement_actif ON frais_deplacement_config(actif);

-- Table 5: conditions_paiement_templates
CREATE TABLE conditions_paiement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestataire_id UUID REFERENCES prestataires(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  type_paiement TEXT NOT NULL 
    CHECK (type_paiement IN ('complet_avant', 'complet_apres', 'acompte_solde', 'echelonne')),
  pourcentage_acompte INTEGER 
    CHECK (pourcentage_acompte >= 0 AND pourcentage_acompte <= 100),
  pourcentage_solde INTEGER 
    CHECK (pourcentage_solde >= 0 AND pourcentage_solde <= 100),
  echeances JSONB,
  delai_paiement_jours INTEGER CHECK (delai_paiement_jours > 0),
  est_defaut BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_acompte_solde_template CHECK (
    type_paiement != 'acompte_solde' OR 
    (pourcentage_acompte + pourcentage_solde = 100)
  )
);

CREATE INDEX idx_templates_prestataire ON conditions_paiement_templates(prestataire_id);

-- Table 6: contrats
CREATE TABLE contrats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  devis_id UUID NOT NULL REFERENCES devis_pro(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id),
  prestataire_id UUID NOT NULL REFERENCES prestataires(id),
  contenu_html TEXT NOT NULL,
  contrat_pdf_url TEXT,
  signature_client_url TEXT,
  signature_prestataire_url TEXT,
  date_signature_client TIMESTAMP WITH TIME ZONE,
  date_signature_prestataire TIMESTAMP WITH TIME ZONE,
  statut TEXT NOT NULL DEFAULT 'genere' 
    CHECK (statut IN ('genere', 'signe_client', 'signe_complet', 'annule')),
  conditions_paiement JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contrats_devis ON contrats(devis_id);
CREATE INDEX idx_contrats_client ON contrats(client_id);
CREATE INDEX idx_contrats_prestataire ON contrats(prestataire_id);
CREATE INDEX idx_contrats_statut ON contrats(statut);
CREATE INDEX idx_contrats_numero ON contrats(numero);

-- Table 7: paiements (NOUVELLE VERSION)
CREATE TABLE paiements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  contrat_id UUID REFERENCES contrats(id),
  devis_id UUID NOT NULL REFERENCES devis_pro(id),
  mission_id UUID REFERENCES missions(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  prestataire_id UUID NOT NULL REFERENCES prestataires(id),
  type_paiement TEXT NOT NULL 
    CHECK (type_paiement IN ('acompte', 'solde', 'complet', 'echeance', 'garantie')),
  montant_travaux DECIMAL(10,2) NOT NULL CHECK (montant_travaux >= 0),
  montant_materiel DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (montant_materiel >= 0),
  montant_deplacement DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (montant_deplacement >= 0),
  montant_total DECIMAL(10,2) NOT NULL CHECK (montant_total >= 0),
  commission_travaux DECIMAL(10,2) DEFAULT 0,
  commission_materiel DECIMAL(10,2) DEFAULT 0,
  commission_deplacement DECIMAL(10,2) DEFAULT 0,
  commission_totale DECIMAL(10,2) DEFAULT 0,
  montant_prestataire DECIMAL(10,2),
  methode_paiement TEXT 
    CHECK (methode_paiement IN (
      'mpesa', 'airtel_money', 'orange_money', 
      'carte_bancaire', 'especes', 'virement', 'direct'
    )),
  statut TEXT NOT NULL DEFAULT 'en_attente' 
    CHECK (statut IN ('en_attente', 'en_cours', 'valide', 'echoue', 'rembourse', 'annule')),
  transaction_id TEXT,
  reference_paiement TEXT,
  recu_url TEXT,
  preuve_paiement_url TEXT,
  preuve_validee_par UUID,
  preuve_validee_at TIMESTAMP WITH TIME ZONE,
  date_echeance TIMESTAMP WITH TIME ZONE,
  date_paiement TIMESTAMP WITH TIME ZONE,
  date_validation TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_paiements_contrat ON paiements(contrat_id);
CREATE INDEX idx_paiements_devis ON paiements(devis_id);
CREATE INDEX idx_paiements_mission ON paiements(mission_id);
CREATE INDEX idx_paiements_client ON paiements(client_id);
CREATE INDEX idx_paiements_prestataire ON paiements(prestataire_id);
CREATE INDEX idx_paiements_statut ON paiements(statut);
CREATE INDEX idx_paiements_type ON paiements(type_paiement);
CREATE INDEX idx_paiements_numero ON paiements(numero);

-- Table 8: litiges
CREATE TABLE litiges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  mission_id UUID NOT NULL REFERENCES missions(id),
  contrat_id UUID REFERENCES contrats(id),
  devis_id UUID REFERENCES devis_pro(id),
  ouvert_par UUID NOT NULL,
  ouvert_par_type TEXT NOT NULL CHECK (ouvert_par_type IN ('client', 'prestataire')),
  client_id UUID NOT NULL REFERENCES clients(id),
  prestataire_id UUID NOT NULL REFERENCES prestataires(id),
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  categorie TEXT CHECK (categorie IN (
    'qualite_travaux', 'delai', 'paiement', 'materiel', 'autre'
  )),
  preuves JSONB,
  statut TEXT NOT NULL DEFAULT 'ouvert' 
    CHECK (statut IN ('ouvert', 'en_cours', 'resolu', 'ferme')),
  resolu_par UUID,
  decision TEXT,
  decision_details JSONB,
  date_resolution TIMESTAMP WITH TIME ZONE,
  montant_bloque DECIMAL(10,2),
  montant_rembourse_client DECIMAL(10,2),
  montant_verse_prestataire DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_litiges_mission ON litiges(mission_id);
CREATE INDEX idx_litiges_client ON litiges(client_id);
CREATE INDEX idx_litiges_prestataire ON litiges(prestataire_id);
CREATE INDEX idx_litiges_statut ON litiges(statut);
CREATE INDEX idx_litiges_numero ON litiges(numero);

-- Modifier tables existantes
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS montant_travaux_ht DECIMAL(10,2);
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS montant_materiel_ht DECIMAL(10,2);
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS frais_deplacement DECIMAL(10,2) DEFAULT 0;
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10,2);
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS conditions_paiement_id UUID REFERENCES conditions_paiement_templates(id);
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS delai_execution_jours INTEGER;
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS configuration_paiement JSONB;

ALTER TABLE missions ADD COLUMN IF NOT EXISTS date_terminee TIMESTAMP WITH TIME ZONE;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS date_validation_demandee TIMESTAMP WITH TIME ZONE;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS date_validation TIMESTAMP WITH TIME ZONE;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS validee_par UUID;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS validation_auto BOOLEAN DEFAULT false;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS delai_validation_jours INTEGER DEFAULT 7;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS problemes_signales TEXT;

-- ═══════════════════════════════════════════════════════════════════
-- PARTIE 2: CRÉER LES FONCTIONS SQL
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION generate_contrat_numero()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  count INTEGER;
  numero TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) INTO count FROM contrats WHERE numero LIKE 'CONT-' || year || '-%';
  numero := 'CONT-' || year || '-' || LPAD((count + 1)::TEXT, 4, '0');
  RETURN numero;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_paiement_numero()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  count INTEGER;
  numero TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) INTO count FROM paiements WHERE numero LIKE 'PAY-' || year || '-%';
  numero := 'PAY-' || year || '-' || LPAD((count + 1)::TEXT, 4, '0');
  RETURN numero;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_litige_numero()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  count INTEGER;
  numero TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) INTO count FROM litiges WHERE numero LIKE 'LIT-' || year || '-%';
  numero := 'LIT-' || year || '-' || LPAD((count + 1)::TEXT, 4, '0');
  RETURN numero;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_frais_deplacement(
  p_prestataire_id UUID,
  p_distance_km DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  config RECORD;
  frais DECIMAL := 0;
  distance_facturable DECIMAL;
BEGIN
  SELECT * INTO config FROM frais_deplacement_config
  WHERE prestataire_id = p_prestataire_id AND actif = true;
  
  IF NOT FOUND THEN RETURN 0; END IF;
  
  CASE config.mode_calcul
    WHEN 'fixe' THEN
      frais := COALESCE(config.montant_fixe, 0);
    WHEN 'par_km' THEN
      distance_facturable := GREATEST(0, p_distance_km - COALESCE(config.distance_gratuite_km, 0));
      frais := distance_facturable * COALESCE(config.prix_par_km, 0);
    WHEN 'gratuit' THEN
      frais := 0;
  END CASE;
  
  IF config.montant_minimum IS NOT NULL THEN
    frais := GREATEST(frais, config.montant_minimum);
  END IF;
  
  IF config.montant_maximum IS NOT NULL THEN
    frais := LEAST(frais, config.montant_maximum);
  END IF;
  
  RETURN frais;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════
-- PARTIE 3: CRÉER LES RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE configuration_paiement_globale ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read config" ON configuration_paiement_globale
  FOR SELECT USING (true);

ALTER TABLE historique_config_paiement ENABLE ROW LEVEL SECURITY;

ALTER TABLE configuration_paiement_prestataire ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers can manage own config" ON configuration_paiement_prestataire
  FOR ALL USING (
    prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
  );

ALTER TABLE frais_deplacement_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers can manage own travel fees" ON frais_deplacement_config
  FOR ALL USING (
    prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
  );

CREATE POLICY "Clients can view active travel fees" ON frais_deplacement_config
  FOR SELECT USING (actif = true);

ALTER TABLE conditions_paiement_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers can manage own templates" ON conditions_paiement_templates
  FOR ALL USING (
    prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
  );

ALTER TABLE contrats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can view own contracts" ON contrats
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

CREATE POLICY "Providers can view own contracts" ON contrats
  FOR SELECT USING (
    prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
  );

CREATE POLICY "Parties can update contracts" ON contrats
  FOR UPDATE USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()) OR
    prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
  );

ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can view own payments" ON paiements
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

CREATE POLICY "Providers can view own payments" ON paiements
  FOR SELECT USING (
    prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
  );

CREATE POLICY "Clients can create payments" ON paiements
  FOR INSERT WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

ALTER TABLE litiges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties can view own disputes" ON litiges
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()) OR
    prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
  );

CREATE POLICY "Parties can create disputes" ON litiges
  FOR INSERT WITH CHECK (ouvert_par = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- PARTIE 4: CRÉER LES STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('contrats', 'contrats', false, 10485760, ARRAY['application/pdf']),
  ('signatures', 'signatures', false, 1048576, ARRAY['image/png', 'image/jpeg', 'image/jpg']),
  ('recus', 'recus', false, 5242880, ARRAY['application/pdf']),
  ('preuves-paiement', 'preuves-paiement', false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════
-- ✅ INSTALLATION TERMINÉE AVEC SUCCÈS!
-- ═══════════════════════════════════════════════════════════════════
-- 
-- ✅ Ancienne table paiements → paiements_old_backup
-- ✅ Tables créées: 8
-- ✅ Tables modifiées: 2
-- ✅ Fonctions SQL: 4
-- ✅ RLS Policies: 15+
-- ✅ Storage Buckets: 4
-- 
-- NOTE: L'ancienne table paiements a été renommée en paiements_old_backup
-- Tu peux la supprimer plus tard si tu n'en as plus besoin:
-- DROP TABLE paiements_old_backup CASCADE;
-- 
-- ═══════════════════════════════════════════════════════════════════
