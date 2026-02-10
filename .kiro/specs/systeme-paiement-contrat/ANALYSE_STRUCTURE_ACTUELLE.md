# 🔍 ANALYSE DE LA STRUCTURE ACTUELLE - KAZIPRO

## 📊 TABLES EXISTANTES

### 1. Table `devis` / `devis_pro`

**Structure actuelle:**
```sql
CREATE TABLE devis_pro (
  id UUID PRIMARY KEY,
  numero TEXT UNIQUE NOT NULL,
  prestataire_id UUID NOT NULL,
  client_id UUID,
  demande_id UUID,
  
  -- Informations
  titre TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  conditions TEXT,
  
  -- Montants
  montant_ht DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tva DECIMAL(5, 2) DEFAULT 16,
  montant_ttc DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Statut
  statut TEXT CHECK (statut IN ('brouillon', 'envoye', 'accepte', 'refuse', 'expire')),
  
  -- Dates
  date_creation TIMESTAMP,
  date_envoi TIMESTAMP,
  date_expiration TIMESTAMP,
  date_acceptation TIMESTAMP,
  date_refus TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**❌ MANQUE:**
- Colonne pour frais de déplacement
- Colonne pour montant travaux séparé
- Statut pour "en attente de contrat"
- Statut pour "en attente de paiement"
- Référence aux conditions de paiement

### 2. Table `devis_pro_items`

**Structure actuelle:**
```sql
CREATE TABLE devis_pro_items (
  id UUID PRIMARY KEY,
  devis_id UUID NOT NULL REFERENCES devis_pro(id),
  
  designation TEXT NOT NULL,
  quantite DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unite TEXT DEFAULT 'unité',
  prix_unitaire DECIMAL(10, 2) NOT NULL,
  montant DECIMAL(10, 2) NOT NULL,
  
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**✅ OK:** Cette table est suffisante pour les lignes de devis

### 3. Table `entreprise_info`

**Structure actuelle:**
```sql
CREATE TABLE entreprise_info (
  id UUID PRIMARY KEY,
  prestataire_id UUID NOT NULL UNIQUE,
  nom_entreprise TEXT,
  logo_url TEXT,
  adresse TEXT,
  ville TEXT,
  telephone TEXT,
  email_professionnel TEXT,
  numero_fiscal TEXT,
  conditions_generales TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**✅ OK:** Cette table contient les infos nécessaires pour le contrat

### 4. Table `paiements` (Existante mais incomplète)

**Structure actuelle (supposée):**
```sql
CREATE TABLE paiements (
  id UUID PRIMARY KEY,
  mission_id UUID,
  montant DECIMAL(10, 2),
  statut TEXT,
  methode_paiement TEXT,
  date_paiement TIMESTAMP
);
```

**❌ MANQUE:**
- Numéro unique de paiement
- Type de paiement (acompte, solde, complet)
- Séparation montant travaux / déplacement
- Référence au contrat
- Référence au devis
- Transaction ID externe
- URL du reçu
- Dates détaillées (échéance, validation)
- Métadonnées

## 🆕 NOUVELLES TABLES NÉCESSAIRES

### 1. Table `contrats` (À créer)

```sql
CREATE TABLE contrats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL, -- CONT-2026-0001
  devis_id UUID REFERENCES devis_pro(id),
  client_id UUID REFERENCES clients(id),
  prestataire_id UUID REFERENCES prestataires(id),
  
  -- Contenu
  contenu_html TEXT,
  contrat_pdf_url TEXT,
  
  -- Signatures
  signature_client_url TEXT,
  signature_prestataire_url TEXT,
  date_signature_client TIMESTAMP,
  date_signature_prestataire TIMESTAMP,
  
  -- Statut
  statut TEXT CHECK (statut IN (
    'genere',
    'signe_client',
    'signe_complet',
    'annule'
  )),
  
  -- Conditions
  conditions_paiement JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Table `paiements` (À améliorer/recréer)

```sql
CREATE TABLE paiements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL, -- PAY-2026-0001
  contrat_id UUID REFERENCES contrats(id),
  devis_id UUID REFERENCES devis_pro(id),
  mission_id UUID REFERENCES missions(id),
  client_id UUID REFERENCES clients(id),
  prestataire_id UUID REFERENCES prestataires(id),
  
  -- Type de paiement
  type_paiement TEXT CHECK (type_paiement IN (
    'acompte',
    'solde',
    'complet',
    'echeance'
  )),
  
  -- Montants
  montant_travaux DECIMAL(10,2),
  montant_deplacement DECIMAL(10,2),
  montant_total DECIMAL(10,2),
  
  -- Méthode et statut
  methode_paiement TEXT CHECK (methode_paiement IN (
    'mpesa', 'airtel_money', 'orange_money', 'carte_bancaire', 'especes', 'virement'
  )),
  statut TEXT CHECK (statut IN (
    'en_attente',
    'en_cours',
    'valide',
    'echoue',
    'rembourse'
  )),
  
  -- Détails transaction
  transaction_id TEXT,
  reference_paiement TEXT,
  recu_url TEXT,
  
  -- Dates
  date_echeance TIMESTAMP,
  date_paiement TIMESTAMP,
  date_validation TIMESTAMP,
  
  -- Métadonnées
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Table `frais_deplacement_config` (À créer)

```sql
CREATE TABLE frais_deplacement_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestataire_id UUID REFERENCES prestataires(id) UNIQUE,
  
  -- Activation
  actif BOOLEAN DEFAULT false,
  
  -- Configuration
  mode_calcul TEXT CHECK (mode_calcul IN (
    'fixe',
    'par_km',
    'par_zone',
    'gratuit'
  )),
  
  -- Tarifs
  montant_fixe DECIMAL(10,2),
  prix_par_km DECIMAL(10,2),
  distance_gratuite_km INTEGER,
  
  -- Zones (si mode par_zone)
  zones JSONB, -- [{nom: 'Kinshasa Centre', prix: 5000}, ...]
  
  -- Limites
  montant_minimum DECIMAL(10,2),
  montant_maximum DECIMAL(10,2),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Table `conditions_paiement_templates` (À créer)

```sql
CREATE TABLE conditions_paiement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestataire_id UUID REFERENCES prestataires(id),
  
  -- Template
  nom TEXT NOT NULL,
  description TEXT,
  
  -- Conditions
  type_paiement TEXT CHECK (type_paiement IN (
    'complet_avant',
    'complet_apres',
    'acompte_solde',
    'echelonne'
  )),
  
  -- Pourcentages (si acompte_solde)
  pourcentage_acompte INTEGER,
  pourcentage_solde INTEGER,
  
  -- Échéances (si echelonne)
  echeances JSONB, -- [{pourcentage: 30, moment: 'debut'}, ...]
  
  -- Délais
  delai_paiement_jours INTEGER,
  
  -- Par défaut
  est_defaut BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 MODIFICATIONS À APPORTER

### 1. Modifier la table `devis_pro`

**Colonnes à ajouter:**
```sql
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS montant_travaux_ht DECIMAL(10,2);
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS frais_deplacement DECIMAL(10,2) DEFAULT 0;
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10,2);
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS conditions_paiement_id UUID REFERENCES conditions_paiement_templates(id);
ALTER TABLE devis_pro ADD COLUMN IF NOT EXISTS delai_execution_jours INTEGER;
```

**Modifier le CHECK constraint du statut:**
```sql
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
```

### 2. Modifier la fonction `calculate_devis_pro_montants`

**Nouvelle logique:**
```sql
CREATE OR REPLACE FUNCTION calculate_devis_pro_montants(devis_uuid UUID)
RETURNS VOID AS $
DECLARE
  total_travaux_ht DECIMAL(10, 2);
  frais_depl DECIMAL(10, 2);
  sous_total_ht DECIMAL(10, 2);
  tva_rate DECIMAL(5, 2);
  total_ttc DECIMAL(10, 2);
BEGIN
  -- 1. Calculer le total des travaux HT
  SELECT COALESCE(SUM(montant), 0) INTO total_travaux_ht
  FROM devis_pro_items
  WHERE devis_id = devis_uuid;
  
  -- 2. Récupérer les frais de déplacement
  SELECT COALESCE(frais_deplacement, 0) INTO frais_depl
  FROM devis_pro
  WHERE id = devis_uuid;
  
  -- 3. Calculer le sous-total HT (travaux + déplacement)
  sous_total_ht := total_travaux_ht + frais_depl;
  
  -- 4. Récupérer le taux de TVA
  SELECT tva INTO tva_rate
  FROM devis_pro
  WHERE id = devis_uuid;
  
  -- 5. Calculer le total TTC
  total_ttc := sous_total_ht * (1 + (tva_rate / 100));
  
  -- 6. Mettre à jour le devis
  UPDATE devis_pro
  SET montant_travaux_ht = total_travaux_ht,
      montant_ht = sous_total_ht,
      montant_ttc = total_ttc
  WHERE id = devis_uuid;
END;
$ LANGUAGE plpgsql;
```

### 3. Créer une fonction pour calculer les frais de déplacement

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
      frais := config.montant_fixe;
      
    WHEN 'par_km' THEN
      -- Soustraire la distance gratuite
      distance_facturable := GREATEST(0, p_distance_km - COALESCE(config.distance_gratuite_km, 0));
      frais := distance_facturable * config.prix_par_km;
      
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

## 📋 STORAGE BUCKETS NÉCESSAIRES

### 1. Bucket `contrats` (À créer)
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contrats', 'contrats', false) 
ON CONFLICT (id) DO NOTHING;
```

**Policies:**
- Prestataires peuvent uploader les contrats de leurs devis
- Clients peuvent télécharger leurs contrats
- Admin peut tout voir

### 2. Bucket `signatures` (À créer)
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('signatures', 'signatures', false) 
ON CONFLICT (id) DO NOTHING;
```

**Policies:**
- Utilisateurs peuvent uploader leur propre signature
- Seul le propriétaire peut voir sa signature

### 3. Bucket `recus` (À créer)
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('recus', 'recus', false) 
ON CONFLICT (id) DO NOTHING;
```

**Policies:**
- Système génère les reçus
- Client et prestataire peuvent télécharger leurs reçus

## 🔄 FLUX DE DONNÉES

### Création d'un devis avec frais de déplacement

```typescript
// 1. Frontend calcule la distance (Google Maps API)
const distance = calculateDistance(
  prestataireLocation,
  clientLocation
);

// 2. Frontend appelle une fonction pour calculer les frais
const { data: frais } = await supabase.rpc(
  'calculate_frais_deplacement',
  {
    p_prestataire_id: prestataireId,
    p_distance_km: distance
  }
);

// 3. Frontend crée le devis avec les frais
const { data: devis } = await supabase
  .from('devis_pro')
  .insert({
    prestataire_id: prestataireId,
    client_id: clientId,
    demande_id: demandeId,
    titre: 'Installation électrique',
    distance_km: distance,
    frais_deplacement: frais,
    // ... autres champs
  });

// 4. Frontend ajoute les items
await supabase
  .from('devis_pro_items')
  .insert([
    { devis_id: devis.id, designation: 'Installation', ... },
    { devis_id: devis.id, designation: 'Matériel', ... }
  ]);

// 5. Le trigger recalcule automatiquement les montants
// montant_travaux_ht = SUM(items)
// montant_ht = montant_travaux_ht + frais_deplacement
// montant_ttc = montant_ht * (1 + tva/100)
```

## 📊 RÉSUMÉ DES CHANGEMENTS

### Tables à créer (4)
1. ✅ `contrats`
2. ✅ `paiements` (nouvelle version)
3. ✅ `frais_deplacement_config`
4. ✅ `conditions_paiement_templates`

### Tables à modifier (1)
1. ✅ `devis_pro` (ajouter colonnes)

### Fonctions à créer (3)
1. ✅ `calculate_frais_deplacement()`
2. ✅ `generate_contrat_numero()`
3. ✅ `generate_paiement_numero()`

### Fonctions à modifier (1)
1. ✅ `calculate_devis_pro_montants()` (nouvelle logique)

### Storage buckets à créer (3)
1. ✅ `contrats`
2. ✅ `signatures`
3. ✅ `recus`

### RLS Policies à créer
- Pour chaque nouvelle table
- Pour chaque nouveau bucket

## 🎯 ORDRE D'IMPLÉMENTATION RECOMMANDÉ

### Phase 1: Frais de déplacement
1. Créer table `frais_deplacement_config`
2. Créer fonction `calculate_frais_deplacement()`
3. Modifier table `devis_pro` (ajouter colonnes)
4. Modifier fonction `calculate_devis_pro_montants()`
5. Créer interface de configuration pour prestataires
6. Modifier interface de création de devis

### Phase 2: Templates de paiement
1. Créer table `conditions_paiement_templates`
2. Créer interface de gestion des templates
3. Modifier interface de création de devis (sélection template)

### Phase 3: Contrats
1. Créer table `contrats`
2. Créer bucket `contrats`
3. Créer bucket `signatures`
4. Créer fonction de génération de contrat
5. Créer interface de signature
6. Créer trigger sur acceptation de devis

### Phase 4: Paiements
1. Créer nouvelle table `paiements`
2. Créer bucket `recus`
3. Créer fonctions de génération de reçus
4. Intégrer APIs de paiement (M-Pesa, Airtel)
5. Créer interfaces de paiement
6. Créer webhooks de confirmation

## ✅ COMPATIBILITÉ

**Important:** Toutes ces modifications sont **rétrocompatibles**:
- Les devis existants continuent de fonctionner
- Les nouvelles colonnes ont des valeurs par défaut
- Les frais de déplacement sont optionnels (désactivés par défaut)
- Pas besoin de migration de données

