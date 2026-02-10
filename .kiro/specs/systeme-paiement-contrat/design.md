# Design Document - Système de Paiement et Contractualisation KaziPro

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Specifications](#api-specifications)
4. [Business Logic](#business-logic)
5. [User Interfaces](#user-interfaces)
6. [Integration Points](#integration-points)
7. [Security & Validation](#security--validation)
8. [Performance Considerations](#performance-considerations)

---

## 1. Architecture Overview

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         KAZIPRO PLATFORM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Frontend   │  │   Backend    │  │   Database   │         │
│  │   (React)    │◄─┤  (Supabase)  │◄─┤ (PostgreSQL) │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                  │                                    │
│         │                  │                                    │
│         ▼                  ▼                                    │
│  ┌──────────────────────────────────────────────┐              │
│  │         Payment Processing Layer              │              │
│  ├──────────────────────────────────────────────┤              │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │              │
│  │  │  M-Pesa  │  │  Airtel  │  │   Card   │  │              │
│  │  │   API    │  │   Money  │  │ Payment  │  │              │
│  │  └──────────┘  └──────────┘  └──────────┘  │              │
│  └──────────────────────────────────────────────┘              │
│         │                  │                                    │
│         ▼                  ▼                                    │
│  ┌──────────────────────────────────────────────┐              │
│  │         Document Generation Layer             │              │
│  ├──────────────────────────────────────────────┤              │
│  │  • Contract PDF Generation                   │              │
│  │  • Receipt PDF Generation                    │              │
│  │  • Electronic Signature Capture              │              │
│  └──────────────────────────────────────────────┘              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────┐              │
│  │         Storage Layer (Supabase)              │              │
│  ├──────────────────────────────────────────────┤              │
│  │  • Contracts Bucket                          │              │
│  │  • Signatures Bucket                         │              │
│  │  • Receipts Bucket                           │              │
│  └──────────────────────────────────────────────┘              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. Accepts Quote
       ▼
┌─────────────────────┐
│  Quote Accepted     │
│  Status: accepte    │
└──────┬──────────────┘
       │
       │ 2. Trigger Contract Generation
       ▼
┌─────────────────────┐
│ Generate Contract   │
│ • Create PDF        │
│ • Store in bucket   │
│ • Create record     │
└──────┬──────────────┘
       │
       │ 3. Notify parties
       ▼
┌─────────────────────┐
│ Electronic          │
│ Signatures          │
│ • Client signs      │
│ • Provider signs    │
└──────┬──────────────┘
       │
       │ 4. Contract complete
       ▼
┌─────────────────────┐
│ Payment Page        │
│ • Calculate amounts │
│ • Show options      │
└──────┬──────────────┘
       │
       │ 5. Initiate payment
       ▼
┌─────────────────────┐
│ Payment Gateway     │
│ • M-Pesa/Airtel     │
│ • Process payment   │
└──────┬──────────────┘
       │
       │ 6. Webhook callback
       ▼
┌─────────────────────┐
│ Validate Payment    │
│ • Update status     │
│ • Generate receipt  │
│ • Create mission    │
└──────┬──────────────┘
       │
       │ 7. Complete
       ▼
┌─────────────────────┐
│ Mission Active      │
│ Work can begin      │
└─────────────────────┘
```

---

## 2. Database Schema

### 2.1 New Tables

#### Table: `configuration_paiement_globale`

```sql
CREATE TABLE configuration_paiement_globale (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Mode de paiement
  mode_paiement TEXT NOT NULL DEFAULT 'optionnel' 
    CHECK (mode_paiement IN ('desactive', 'optionnel', 'obligatoire')),
  
  -- Commissions (modifiables par admin)
  commission_main_oeuvre DECIMAL(5,2) NOT NULL DEFAULT 5.00 
    CHECK (commission_main_oeuvre >= 0 AND commission_main_oeuvre <= 20),
  commission_materiel DECIMAL(5,2) NOT NULL DEFAULT 2.00 
    CHECK (commission_materiel >= 0 AND commission_materiel <= 20),
  commission_deplacement DECIMAL(5,2) NOT NULL DEFAULT 5.00 
    CHECK (commission_deplacement >= 0 AND commission_deplacement <= 20),
  
  -- Acompte et solde (modifiables par admin)
  pourcentage_acompte_defaut INTEGER NOT NULL DEFAULT 30 
    CHECK (pourcentage_acompte_defaut >= 0 AND pourcentage_acompte_defaut <= 100),
  pourcentage_solde_defaut INTEGER NOT NULL DEFAULT 70 
    CHECK (pourcentage_solde_defaut >= 0 AND pourcentage_solde_defaut <= 100),
  
  -- Délais (modifiables par admin)
  delai_validation_defaut INTEGER NOT NULL DEFAULT 7 
    CHECK (delai_validation_defaut > 0 AND delai_validation_defaut <= 90),
  delai_paiement_defaut INTEGER NOT NULL DEFAULT 30 
    CHECK (delai_paiement_defaut > 0 AND delai_paiement_defaut <= 365),
  
  -- Garantie (modifiable par admin)
  pourcentage_garantie_defaut INTEGER NOT NULL DEFAULT 0 
    CHECK (pourcentage_garantie_defaut >= 0 AND pourcentage_garantie_defaut <= 20),
  duree_garantie_defaut INTEGER NOT NULL DEFAULT 30 
    CHECK (duree_garantie_defaut >= 0 AND duree_garantie_defaut <= 365),
  
  -- Permissions prestataires
  permettre_desactivation BOOLEAN NOT NULL DEFAULT true,
  permettre_choix_elements BOOLEAN NOT NULL DEFAULT true,
  permettre_negociation_commission BOOLEAN NOT NULL DEFAULT false,
  permettre_modification_acompte BOOLEAN NOT NULL DEFAULT true,
  permettre_modification_delais BOOLEAN NOT NULL DEFAULT true,
  
  -- Traçabilité
  modified_by UUID REFERENCES auth.users(id),
  modified_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte: acompte + solde = 100
  CONSTRAINT check_acompte_solde_sum 
    CHECK (pourcentage_acompte_defaut + pourcentage_solde_defaut = 100)
);

-- Index
CREATE INDEX idx_config_paiement_modified ON configuration_paiement_globale(modified_at DESC);

-- Initialiser avec une seule ligne
INSERT INTO configuration_paiement_globale (id) 
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE configuration_paiement_globale ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut lire
CREATE POLICY "Anyone can read config" ON configuration_paiement_globale
  FOR SELECT USING (true);

-- Policy: Seuls les admins peuvent modifier
CREATE POLICY "Only admins can update config" ON configuration_paiement_globale
  FOR UPDATE USING (
    (auth.jwt() ->> 'email') IN (
      SELECT email FROM auth.users WHERE role = 'admin'
    )
  );
```

#### Table: `historique_config_paiement`

```sql
CREATE TABLE historique_config_paiement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Admin qui a modifié
  admin_id UUID REFERENCES auth.users(id),
  admin_email TEXT NOT NULL,
  
  -- Valeurs avant/après
  anciennes_valeurs JSONB NOT NULL,
  nouvelles_valeurs JSONB NOT NULL,
  
  -- Raison du changement
  raison TEXT,
  
  -- Métadonnées
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_historique_config_admin ON historique_config_paiement(admin_id);
CREATE INDEX idx_historique_config_date ON historique_config_paiement(created_at DESC);

-- RLS
ALTER TABLE historique_config_paiement ENABLE ROW LEVEL SECURITY;

-- Policy: Seuls les admins peuvent lire l'historique
CREATE POLICY "Only admins can read history" ON historique_config_paiement
  FOR SELECT USING (
    (auth.jwt() ->> 'email') IN (
      SELECT email FROM auth.users WHERE role = 'admin'
    )
  );

-- Policy: Seuls les admins peuvent insérer
CREATE POLICY "Only admins can insert history" ON historique_config_paiement
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'email') IN (
      SELECT email FROM auth.users WHERE role = 'admin'
    )
  );
```

#### Table: `configuration_paiement_prestataire`

```sql
CREATE TABLE configuration_paiement_prestataire (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestataire_id UUID NOT NULL UNIQUE REFERENCES prestataires(id) ON DELETE CASCADE,
  
  -- Activation générale
  paiement_via_kazipro BOOLEAN NOT NULL DEFAULT true,
  
  -- Éléments qui passent par KaziPro
  main_oeuvre_via_kazipro BOOLEAN NOT NULL DEFAULT true,
  materiel_via_kazipro BOOLEAN NOT NULL DEFAULT true,
  deplacement_via_kazipro BOOLEAN NOT NULL DEFAULT true,
  
  -- Commissions personnalisées (NULL = utilise global)
  commission_main_oeuvre DECIMAL(5,2) 
    CHECK (commission_main_oeuvre IS NULL OR 
           (commission_main_oeuvre >= 0 AND commission_main_oeuvre <= 20)),
  commission_materiel DECIMAL(5,2) 
    CHECK (commission_materiel IS NULL OR 
           (commission_materiel >= 0 AND commission_materiel <= 20)),
  commission_deplacement DECIMAL(5,2) 
    CHECK (commission_deplacement IS NULL OR 
           (commission_deplacement >= 0 AND commission_deplacement <= 20)),
  
  -- Acompte personnalisé (NULL = utilise global)
  pourcentage_acompte INTEGER 
    CHECK (pourcentage_acompte IS NULL OR 
           (pourcentage_acompte >= 0 AND pourcentage_acompte <= 100)),
  
  -- Délai personnalisé (NULL = utilise global)
  delai_validation INTEGER 
    CHECK (delai_validation IS NULL OR 
           (delai_validation > 0 AND delai_validation <= 90)),
  
  -- Métadonnées
  date_activation TIMESTAMP WITH TIME ZONE,
  date_desactivation TIMESTAMP WITH TIME ZONE,
  raison_desactivation TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_config_prestataire_id ON configuration_paiement_prestataire(prestataire_id);
CREATE INDEX idx_config_prestataire_actif ON configuration_paiement_prestataire(paiement_via_kazipro);

-- RLS
ALTER TABLE configuration_paiement_prestataire ENABLE ROW LEVEL SECURITY;

-- Policy: Prestataire peut lire sa config
CREATE POLICY "Providers can read own config" ON configuration_paiement_prestataire
  FOR SELECT USING (
    prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
  );

-- Policy: Prestataire peut modifier sa config
CREATE POLICY "Providers can update own config" ON configuration_paiement_prestataire
  FOR ALL USING (
    prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
  );

-- Policy: Admin peut tout voir
CREATE POLICY "Admins can read all configs" ON configuration_paiement_prestataire
  FOR SELECT USING (
    (auth.jwt() ->> 'email') IN (
      SELECT email FROM auth.users WHERE role = 'admin'
    )
  );
```

#### Table: `frais_deplacement_config`

```sql
CREATE TABLE frais_deplacement_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestataire_id UUID NOT NULL UNIQUE REFERENCES prestataires(id) ON DELETE CASCADE,
  
  -- Activation
  actif BOOLEAN NOT NULL DEFAULT false,
  
  -- Mode de calcul
  mode_calcul TEXT NOT NULL DEFAULT 'fixe' 
    CHECK (mode_calcul IN ('fixe', 'par_km', 'par_zone', 'gratuit')),
  
  -- Tarifs
  montant_fixe DECIMAL(10,2) CHECK (montant_fixe >= 0),
  prix_par_km DECIMAL(10,2) CHECK (prix_par_km >= 0),
  distance_gratuite_km INTEGER CHECK (distance_gratuite_km >= 0),
  
  -- Zones (pour mode par_zone)
  zones JSONB,
  -- Format: [{"nom": "Kinshasa Centre", "prix": 5000}, ...]
  
  -- Limites
  montant_minimum DECIMAL(10,2) CHECK (montant_minimum >= 0),
  montant_maximum DECIMAL(10,2) CHECK (montant_maximum >= 0),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte: min <= max
  CONSTRAINT check_min_max CHECK (
    montant_minimum IS NULL OR 
    montant_maximum IS NULL OR 
    montant_minimum <= montant_maximum
  )
);

-- Index
CREATE INDEX idx_frais_deplacement_prestataire ON frais_deplacement_config(prestataire_id);
CREATE INDEX idx_frais_deplacement_actif ON frais_deplacement_config(actif);

-- RLS
ALTER TABLE frais_deplacement_config ENABLE ROW LEVEL SECURITY;

-- Policy: Prestataire peut gérer sa config
CREATE POLICY "Providers can manage own travel fees" ON frais_deplacement_config
  FOR ALL USING (
    prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
  );

-- Policy: Clients peuvent voir les configs actives
CREATE POLICY "Clients can view active travel fees" ON frais_deplacement_config
  FOR SELECT USING (actif = true);
```

#### Table: `conditions_paiement_templates`

```sql
CREATE TABLE conditions_paiement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestataire_id UUID REFERENCES prestataires(id) ON DELETE CASCADE,
  
  -- Template
  nom TEXT NOT NULL,
  description TEXT,
  
  -- Type de paiement
  type_paiement TEXT NOT NULL 
    CHECK (type_paiement IN (
      'complet_avant', 
      'complet_apres', 
      'acompte_solde', 
      'echelonne'
    )),
  
  -- Pourcentages (pour acompte_solde)
  pourcentage_acompte INTEGER 
    CHECK (pourcentage_acompte >= 0 AND pourcentage_acompte <= 100),
  pourcentage_solde INTEGER 
    CHECK (pourcentage_solde >= 0 AND pourcentage_solde <= 100),
  
  -- Échéances (pour echelonne)
  echeances JSONB,
  -- Format: [{"pourcentage": 30, "moment": "debut", "description": "..."}, ...]
  
  -- Délais
  delai_paiement_jours INTEGER CHECK (delai_paiement_jours > 0),
  
  -- Par défaut
  est_defaut BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte: acompte + solde = 100 pour type acompte_solde
  CONSTRAINT check_acompte_solde_template CHECK (
    type_paiement != 'acompte_solde' OR 
    (pourcentage_acompte + pourcentage_solde = 100)
  )
);

-- Index
CREATE INDEX idx_templates_prestataire ON conditions_paiement_templates(prestataire_id);
CREATE INDEX idx_templates_defaut ON conditions_paiement_templates(est_defaut);

-- RLS
ALTER TABLE conditions_paiement_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Prestataire peut gérer ses templates
CREATE POLICY "Providers can manage own templates" ON conditions_paiement_templates
  FOR ALL USING (
    prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
  );
```

---

*[Continuing in next part...]*


#### Table: `contrats`

```sql
CREATE TABLE contrats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL, -- CONT-2026-0001
  
  -- Relations
  devis_id UUID NOT NULL REFERENCES devis_pro(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id),
  prestataire_id UUID NOT NULL REFERENCES prestataires(id),
  
  -- Contenu
  contenu_html TEXT NOT NULL,
  contrat_pdf_url TEXT,
  
  -- Signatures
  signature_client_url TEXT,
  signature_prestataire_url TEXT,
  date_signature_client TIMESTAMP WITH TIME ZONE,
  date_signature_prestataire TIMESTAMP WITH TIME ZONE,
  
  -- Statut
  statut TEXT NOT NULL DEFAULT 'genere' 
    CHECK (statut IN ('genere', 'signe_client', 'signe_complet', 'annule')),
  
  -- Conditions de paiement
  conditions_paiement JSONB NOT NULL,
  -- Format: {
  --   "type": "acompte_solde",
  --   "acompte": 30,
  --   "solde": 70,
  --   "delai_validation": 7
  -- }
  
  -- Métadonnées
  metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_contrats_devis ON contrats(devis_id);
CREATE INDEX idx_contrats_client ON contrats(client_id);
CREATE INDEX idx_contrats_prestataire ON contrats(prestataire_id);
CREATE INDEX idx_contrats_statut ON contrats(statut);
CREATE INDEX idx_contrats_numero ON contrats(numero);

-- RLS
ALTER TABLE contrats ENABLE ROW LEVEL SECURITY;

-- Policy: Client peut voir ses contrats
CREATE POLICY "Clients can view own contracts" ON contrats
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

-- Policy: Prestataire peut voir ses contrats
CREATE POLICY "Providers can view own contracts" ON contrats
  FOR SELECT USING (
    prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
  );

-- Policy: Prestataire peut signer ses contrats
CREATE POLICY "Providers can sign own contracts" ON contrats
  FOR UPDATE USING (
    prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
  );

-- Policy: Client peut signer ses contrats
CREATE POLICY "Clients can sign own contracts" ON contrats
  FOR UPDATE USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

-- Policy: Admin peut tout voir
CREATE POLICY "Admins can view all contracts" ON contrats
  FOR SELECT USING (
    (auth.jwt() ->> 'email') IN (
      SELECT email FROM auth.users WHERE role = 'admin'
    )
  );
```

#### Table: `paiements` (Enhanced)

```sql
CREATE TABLE paiements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL, -- PAY-2026-0001
  
  -- Relations
  contrat_id UUID REFERENCES contrats(id),
  devis_id UUID NOT NULL REFERENCES devis_pro(id),
  mission_id UUID REFERENCES missions(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  prestataire_id UUID NOT NULL REFERENCES prestataires(id),
  
  -- Type de paiement
  type_paiement TEXT NOT NULL 
    CHECK (type_paiement IN ('acompte', 'solde', 'complet', 'echeance', 'garantie')),
  
  -- Montants détaillés
  montant_travaux DECIMAL(10,2) NOT NULL CHECK (montant_travaux >= 0),
  montant_materiel DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (montant_materiel >= 0),
  montant_deplacement DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (montant_deplacement >= 0),
  montant_total DECIMAL(10,2) NOT NULL CHECK (montant_total >= 0),
  
  -- Commissions KaziPro
  commission_travaux DECIMAL(10,2) DEFAULT 0,
  commission_materiel DECIMAL(10,2) DEFAULT 0,
  commission_deplacement DECIMAL(10,2) DEFAULT 0,
  commission_totale DECIMAL(10,2) DEFAULT 0,
  montant_prestataire DECIMAL(10,2), -- Ce que reçoit le prestataire
  
  -- Méthode et statut
  methode_paiement TEXT 
    CHECK (methode_paiement IN (
      'mpesa', 'airtel_money', 'orange_money', 
      'carte_bancaire', 'especes', 'virement', 'direct'
    )),
  statut TEXT NOT NULL DEFAULT 'en_attente' 
    CHECK (statut IN ('en_attente', 'en_cours', 'valide', 'echoue', 'rembourse', 'annule')),
  
  -- Détails transaction
  transaction_id TEXT,
  reference_paiement TEXT,
  recu_url TEXT,
  
  -- Preuve de paiement (pour paiement direct)
  preuve_paiement_url TEXT,
  preuve_validee_par UUID REFERENCES auth.users(id),
  preuve_validee_at TIMESTAMP WITH TIME ZONE,
  
  -- Dates
  date_echeance TIMESTAMP WITH TIME ZONE,
  date_paiement TIMESTAMP WITH TIME ZONE,
  date_validation TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  metadata JSONB,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_paiements_contrat ON paiements(contrat_id);
CREATE INDEX idx_paiements_devis ON paiements(devis_id);
CREATE INDEX idx_paiements_mission ON paiements(mission_id);
CREATE INDEX idx_paiements_client ON paiements(client_id);
CREATE INDEX idx_paiements_prestataire ON paiements(prestataire_id);
CREATE INDEX idx_paiements_statut ON paiements(statut);
CREATE INDEX idx_paiements_type ON paiements(type_paiement);
CREATE INDEX idx_paiements_numero ON paiements(numero);
CREATE INDEX idx_paiements_transaction ON paiements(transaction_id);

-- RLS
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;

-- Policy: Client peut voir ses paiements
CREATE POLICY "Clients can view own payments" ON paiements
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

-- Policy: Prestataire peut voir ses paiements
CREATE POLICY "Providers can view own payments" ON paiements
  FOR SELECT USING (
    prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
  );

-- Policy: Client peut créer ses paiements
CREATE POLICY "Clients can create own payments" ON paiements
  FOR INSERT WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

-- Policy: Admin peut tout voir
CREATE POLICY "Admins can view all payments" ON paiements
  FOR SELECT USING (
    (auth.jwt() ->> 'email') IN (
      SELECT email FROM auth.users WHERE role = 'admin'
    )
  );
```

#### Table: `litiges`

```sql
CREATE TABLE litiges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL, -- LIT-2026-0001
  
  -- Relations
  mission_id UUID NOT NULL REFERENCES missions(id),
  contrat_id UUID REFERENCES contrats(id),
  devis_id UUID REFERENCES devis_pro(id),
  
  -- Parties
  ouvert_par UUID NOT NULL REFERENCES auth.users(id),
  ouvert_par_type TEXT NOT NULL CHECK (ouvert_par_type IN ('client', 'prestataire')),
  client_id UUID NOT NULL REFERENCES clients(id),
  prestataire_id UUID NOT NULL REFERENCES prestataires(id),
  
  -- Détails du litige
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  categorie TEXT CHECK (categorie IN (
    'qualite_travaux', 'delai', 'paiement', 'materiel', 'autre'
  )),
  
  -- Preuves
  preuves JSONB,
  -- Format: [{"type": "photo", "url": "...", "description": "..."}, ...]
  
  -- Statut
  statut TEXT NOT NULL DEFAULT 'ouvert' 
    CHECK (statut IN ('ouvert', 'en_cours', 'resolu', 'ferme')),
  
  -- Résolution
  resolu_par UUID REFERENCES auth.users(id),
  decision TEXT,
  decision_details JSONB,
  date_resolution TIMESTAMP WITH TIME ZONE,
  
  -- Montants
  montant_bloque DECIMAL(10,2),
  montant_rembourse_client DECIMAL(10,2),
  montant_verse_prestataire DECIMAL(10,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_litiges_mission ON litiges(mission_id);
CREATE INDEX idx_litiges_client ON litiges(client_id);
CREATE INDEX idx_litiges_prestataire ON litiges(prestataire_id);
CREATE INDEX idx_litiges_statut ON litiges(statut);
CREATE INDEX idx_litiges_numero ON litiges(numero);

-- RLS
ALTER TABLE litiges ENABLE ROW LEVEL SECURITY;

-- Policy: Parties peuvent voir leurs litiges
CREATE POLICY "Parties can view own disputes" ON litiges
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()) OR
    prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
  );

-- Policy: Parties peuvent créer des litiges
CREATE POLICY "Parties can create disputes" ON litiges
  FOR INSERT WITH CHECK (
    ouvert_par = auth.uid()
  );

-- Policy: Admin peut tout voir et modifier
CREATE POLICY "Admins can manage all disputes" ON litiges
  FOR ALL USING (
    (auth.jwt() ->> 'email') IN (
      SELECT email FROM auth.users WHERE role = 'admin'
    )
  );
```

### 2.2 Modified Tables

#### Modify: `devis_pro`

```sql
-- Ajouter colonnes pour le nouveau système
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS montant_travaux_ht DECIMAL(10,2);
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS montant_materiel_ht DECIMAL(10,2);
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS frais_deplacement DECIMAL(10,2) DEFAULT 0;
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10,2);
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS conditions_paiement_id UUID REFERENCES conditions_paiement_templates(id);
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS delai_execution_jours INTEGER;
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS configuration_paiement JSONB;

-- Modifier le CHECK constraint pour ajouter nouveaux statuts
ALTER TABLE devis_pro DROP CONSTRAINT IF EXISTS devis_pro_statut_check;
ALTER TABLE devis_pro ADD CONSTRAINT devis_pro_statut_check 
  CHECK (statut IN (
    'brouillon',
    'envoye',
    'accepte',
    'accepte_en_attente_contrat',
    'accepte_avec_contrat',
    'refuse',
    'expire'
  ));

-- Index
CREATE INDEX IF NOT EXISTS idx_devis_pro_config_paiement ON devis_pro USING GIN (configuration_paiement);
```

#### Modify: `missions`

```sql
-- Ajouter colonnes pour validation
ALTER TABLE missions ADD COLUMN IF NOT EXISTS date_terminee TIMESTAMP WITH TIME ZONE;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS date_validation_demandee TIMESTAMP WITH TIME ZONE;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS date_validation TIMESTAMP WITH TIME ZONE;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS validee_par UUID REFERENCES auth.users(id);
ALTER TABLE missions ADD COLUMN IF NOT EXISTS validation_auto BOOLEAN DEFAULT false;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS delai_validation_jours INTEGER DEFAULT 7;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS problemes_signales TEXT;

-- Modifier statuts
ALTER TABLE missions DROP CONSTRAINT IF EXISTS missions_statut_check;
ALTER TABLE missions ADD CONSTRAINT missions_statut_check 
  CHECK (statut IN (
    'pending',
    'acompte_paye',
    'in_progress',
    'terminee_en_attente_validation',
    'validee',
    'completed',
    'cancelled',
    'litige'
  ));
```

### 2.3 Storage Buckets

```sql
-- Bucket pour les contrats
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contrats',
  'contrats',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Bucket pour les signatures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signatures',
  'signatures',
  false,
  1048576, -- 1MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;

-- Bucket pour les reçus
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recus',
  'recus',
  false,
  5242880, -- 5MB
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Bucket pour les preuves de paiement
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'preuves-paiement',
  'preuves-paiement',
  false,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;
```

### 2.4 Storage Policies

```sql
-- Policies pour contrats
CREATE POLICY "Users can upload own contracts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'contrats' AND
    auth.uid() IN (SELECT user_id FROM prestataires)
  );

CREATE POLICY "Users can view own contracts" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'contrats' AND
    (
      -- Prestataire peut voir ses contrats
      auth.uid() IN (
        SELECT p.user_id FROM prestataires p
        JOIN contrats c ON c.prestataire_id = p.id
        WHERE c.contrat_pdf_url LIKE '%' || name
      ) OR
      -- Client peut voir ses contrats
      auth.uid() IN (
        SELECT cl.user_id FROM clients cl
        JOIN contrats c ON c.client_id = cl.id
        WHERE c.contrat_pdf_url LIKE '%' || name
      )
    )
  );

-- Policies pour signatures
CREATE POLICY "Users can upload own signatures" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'signatures' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view own signatures" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'signatures' AND
    auth.uid() IS NOT NULL
  );

-- Policies pour reçus
CREATE POLICY "System can upload receipts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'recus'
  );

CREATE POLICY "Users can view own receipts" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'recus' AND
    (
      auth.uid() IN (
        SELECT p.user_id FROM prestataires p
        JOIN paiements pay ON pay.prestataire_id = p.id
        WHERE pay.recu_url LIKE '%' || name
      ) OR
      auth.uid() IN (
        SELECT cl.user_id FROM clients cl
        JOIN paiements pay ON pay.client_id = cl.id
        WHERE pay.recu_url LIKE '%' || name
      )
    )
  );

-- Policies pour preuves de paiement
CREATE POLICY "Clients can upload payment proofs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'preuves-paiement' AND
    auth.uid() IN (SELECT user_id FROM clients)
  );

CREATE POLICY "Parties can view payment proofs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'preuves-paiement' AND
    (
      auth.uid() IN (
        SELECT p.user_id FROM prestataires p
        JOIN paiements pay ON pay.prestataire_id = p.id
        WHERE pay.preuve_paiement_url LIKE '%' || name
      ) OR
      auth.uid() IN (
        SELECT cl.user_id FROM clients cl
        JOIN paiements pay ON pay.client_id = cl.id
        WHERE pay.preuve_paiement_url LIKE '%' || name
      )
    )
  );
```

---

## 3. SQL Functions

### 3.1 Generate Unique Numbers

```sql
-- Fonction pour générer numéro de contrat
CREATE OR REPLACE FUNCTION generate_contrat_numero()
RETURNS TEXT AS $
DECLARE
  year TEXT;
  count INTEGER;
  numero TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COUNT(*) INTO count
  FROM contrats
  WHERE numero LIKE 'CONT-' || year || '-%';
  
  numero := 'CONT-' || year || '-' || LPAD((count + 1)::TEXT, 4, '0');
  
  RETURN numero;
END;
$ LANGUAGE plpgsql;

-- Fonction pour générer numéro de paiement
CREATE OR REPLACE FUNCTION generate_paiement_numero()
RETURNS TEXT AS $
DECLARE
  year TEXT;
  count INTEGER;
  numero TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COUNT(*) INTO count
  FROM paiements
  WHERE numero LIKE 'PAY-' || year || '-%';
  
  numero := 'PAY-' || year || '-' || LPAD((count + 1)::TEXT, 4, '0');
  
  RETURN numero;
END;
$ LANGUAGE plpgsql;

-- Fonction pour générer numéro de litige
CREATE OR REPLACE FUNCTION generate_litige_numero()
RETURNS TEXT AS $
DECLARE
  year TEXT;
  count INTEGER;
  numero TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COUNT(*) INTO count
  FROM litiges
  WHERE numero LIKE 'LIT-' || year || '-%';
  
  numero := 'LIT-' || year || '-' || LPAD((count + 1)::TEXT, 4, '0');
  
  RETURN numero;
END;
$ LANGUAGE plpgsql;
```

### 3.2 Calculate Travel Fees

```sql
CREATE OR REPLACE FUNCTION calculate_frais_deplacement(
  p_prestataire_id UUID,
  p_distance_km DECIMAL
)
RETURNS DECIMAL AS $
DECLARE
  config RECORD;
  frais DECIMAL := 0;
  distance_facturable DECIMAL;
BEGIN
  -- Récupérer la config du prestataire
  SELECT * INTO config
  FROM frais_deplacement_config
  WHERE prestataire_id = p_prestataire_id AND actif = true;
  
  -- Si pas de config ou pas actif, retourner 0
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calculer selon le mode
  CASE config.mode_calcul
    WHEN 'fixe' THEN
      frais := COALESCE(config.montant_fixe, 0);
      
    WHEN 'par_km' THEN
      -- Soustraire la distance gratuite
      distance_facturable := GREATEST(0, p_distance_km - COALESCE(config.distance_gratuite_km, 0));
      frais := distance_facturable * COALESCE(config.prix_par_km, 0);
      
    WHEN 'par_zone' THEN
      -- TODO: Implémenter la logique par zone
      frais := 0;
      
    WHEN 'gratuit' THEN
      frais := 0;
  END CASE;
  
  -- Appliquer les limites min/max
  IF config.montant_minimum IS NOT NULL THEN
    frais := GREATEST(frais, config.montant_minimum);
  END IF;
  
  IF config.montant_maximum IS NOT NULL THEN
    frais := LEAST(frais, config.montant_maximum);
  END IF;
  
  RETURN frais;
END;
$ LANGUAGE plpgsql;
```

*[Continuing in next part...]*
