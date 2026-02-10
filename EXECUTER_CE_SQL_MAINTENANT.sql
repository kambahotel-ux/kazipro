-- ═══════════════════════════════════════════════════════════════════
-- 🚀 INSTALLATION SYSTÈME DE PAIEMENT KAZIPRO
-- ═══════════════════════════════════════════════════════════════════
-- INSTRUCTIONS:
-- 1. Ouvrir Supabase Dashboard → SQL Editor
-- 2. Créer une nouvelle query
-- 3. Copier TOUT ce fichier
-- 4. Cliquer sur "Run" (ou Ctrl+Enter)
-- 5. Attendre la confirmation de succès
-- ═══════════════════════════════════════════════════════════════════

-- Commencer la transaction
BEGIN;

-- ═══════════════════════════════════════════════════════════════════
-- ÉTAPE 1: CRÉER LES TABLES DE CONFIGURATION
-- ═══════════════════════════════════════════════════════════════════

-- Table: configuration_paiement_globale (Configuration admin)
CREATE TABLE IF NOT EXISTS configuration_paiement_globale (
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

-- Initialiser avec valeurs par défaut
INSERT INTO configuration_paiement_globale (id) 
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_config_paiement_modified 
  ON configuration_paiement_globale(modified_at DESC);

-- Table: historique_config_paiement (Historique des modifications)
CREATE TABLE IF NOT EXISTS historique_config_paiement (
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

CREATE INDEX IF NOT EXISTS idx_historique_config_admin 
  ON historique_config_paiement(admin_id);
CREATE INDEX IF NOT EXISTS idx_historique_config_date 
  ON historique_config_paiement(created_at DESC);

-- Table: configuration_paiement_prestataire (Configuration par prestataire)
CREATE TABLE IF NOT EXISTS configuration_paiement_prestataire (
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

CREATE INDEX IF NOT EXISTS idx_config_prestataire_id 
  ON configuration_paiement_prestataire(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_config_prestataire_actif 
  ON configuration_paiement_prestataire(paiement_via_kazipro);

-- Table: frais_deplacement_config (Frais de déplacement)
CREATE TABLE IF NOT EXISTS frais_deplacement_config (
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

CREATE INDEX IF NOT EXISTS idx_frais_deplacement_prestataire 
  ON frais_deplacement_config(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_frais_deplacement_actif 
  ON frais_deplacement_config(actif);

-- Table: conditions_paiement_templates (Templates de conditions)
CREATE TABLE IF NOT EXISTS conditions_paiement_templates (
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

CREATE INDEX IF NOT EXISTS idx_templates_prestataire 
  ON conditions_paiement_templates(prestataire_id);

-- ═══════════════════════════════════════════════════════════════════
-- ÉTAPE 2: CRÉER LES TABLES DE CONTRATS ET PAIEMENTS
-- ═══════════════════════════════════════════════════════════════════

-- Table: contrats (Contrats signés)
CREATE TABLE IF NOT EXISTS contrats (
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

CREATE INDEX IF NOT EXISTS idx_contrats_devis ON contrats(devis_id);
CREATE INDEX IF NOT EXISTS idx_contrats_client ON contrats(client_id);
CREATE INDEX IF NOT EXISTS idx_contrats_prestataire ON contrats(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_contrats_statut ON contrats(statut);
CREATE INDEX IF NOT EXISTS idx_contrats_numero ON contrats(numero);

-- Table: paiements (Paiements enhanced)
CREATE TABLE IF NOT EXISTS paiements (
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

CREATE INDEX IF NOT EXISTS idx_paiements_contrat ON paiements(contrat_id);
CREATE INDEX IF NOT EXISTS idx_paiements_devis ON paiements(devis_id);
CREATE INDEX IF NOT EXISTS idx_paiements_mission ON paiements(mission_id);
CREATE INDEX IF NOT EXISTS idx_paiements_client ON paiements(client_id);
CREATE INDEX IF NOT EXISTS idx_paiements_prestataire ON paiements(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_paiements_statut ON paiements(statut);
CREATE INDEX IF NOT EXISTS idx_paiements_type ON paiements(type_paiement);
CREATE INDEX IF NOT EXISTS idx_paiements_numero ON paiements(numero);

-- Table: litiges (Système de litiges)
CREATE TABLE IF NOT EXISTS litiges (
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

CREATE INDEX IF NOT EXISTS idx_litiges_mission ON litiges(mission_id);
CREATE INDEX IF NOT EXISTS idx_litiges_client ON litiges(client_id);
CREATE INDEX IF NOT EXISTS idx_litiges_prestataire ON litiges(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_litiges_statut ON litiges(statut);
CREATE INDEX IF NOT EXISTS idx_litiges_numero ON litiges(numero);

-- ═══════════════════════════════════════════════════════════════════
-- ÉTAPE 3: MODIFIER LES TABLES EXISTANTES
-- ═══════════════════════════════════════════════════════════════════

-- Modifier devis_pro
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS montant_travaux_ht DECIMAL(10,2);
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS montant_materiel_ht DECIMAL(10,2);
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS frais_deplacement DECIMAL(10,2) DEFAULT 0;
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10,2);
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS conditions_paiement_id UUID REFERENCES conditions_paiement_templates(id);
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS delai_execution_jours INTEGER;
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS configuration_paiement JSONB;

-- Modifier missions
ALTER TABLE missions ADD COLUMN IF NOT EXISTS date_terminee TIMESTAMP WITH TIME ZONE;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS date_validation_demandee TIMESTAMP WITH TIME ZONE;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS date_validation TIMESTAMP WITH TIME ZONE;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS validee_par UUID;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS validation_auto BOOLEAN DEFAULT false;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS delai_validation_jours INTEGER DEFAULT 7;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS problemes_signales TEXT;

-- Valider la transaction
COMMIT;

-- ═══════════════════════════════════════════════════════════════════
-- ✅ INSTALLATION TERMINÉE!
-- ═══════════════════════════════════════════════════════════════════
-- 
-- Tables créées: 8
-- Tables modifiées: 2
-- Index créés: 30+
-- 
-- Prochaines étapes:
-- 1. Vérifier dans Supabase → Table Editor que toutes les tables existent
-- 2. Tester la configuration globale (doit avoir 1 ligne)
-- 3. Continuer avec l'implémentation frontend
-- 
-- ═══════════════════════════════════════════════════════════════════
