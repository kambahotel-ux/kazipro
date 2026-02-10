# 📊 ANALYSE DU SYSTÈME DE PAIEMENT ET CONTRACTUALISATION - KAZIPRO

## 🎯 CONTEXTE

Le client a soulevé un point critique concernant le flux de paiement:
> "Une demande acceptée par le client est censée être payée par rapport au protocole ou conditions établies par le prestataire. Il paie le devis séparément des frais de déplacement. On est censé générer un contrat avec le client au moment où il veut verser son argent."

## 📋 ÉTAT ACTUEL DU SYSTÈME

### 1. TABLES EXISTANTES

#### Table `devis` / `devis_pro`
```sql
- id (UUID)
- numero (TEXT) - Ex: DEV-2026-0001
- prestataire_id (UUID)
- client_id (UUID)
- demande_id (UUID)
- titre, description, notes, conditions
- montant_ht, tva, montant_ttc
- statut: brouillon, envoye, accepte, refuse, expire
- dates: creation, envoi, expiration, acceptation, refus
```

#### Table `devis_items` / `devis_pro_items`
```sql
- id (UUID)
- devis_id (UUID)
- designation (TEXT)
- quantite, unite, prix_unitaire, montant
- ordre (INTEGER)
```

#### Table `paiements` (Existante mais incomplète)
```sql
- id (UUID)
- mission_id (UUID)
- montant (DECIMAL)
- statut (TEXT)
- methode_paiement (TEXT)
- date_paiement (TIMESTAMP)
```

#### Table `entreprise_info` (Pour les devis professionnels)
```sql
- prestataire_id (UUID)
- nom_entreprise, logo_url, signature_url
- adresse, ville, telephone, email_professionnel
- numero_fiscal
- conditions_generales (TEXT)
```

### 2. FLUX ACTUEL (INCOMPLET)

```
1. Client crée une demande
2. Prestataire envoie un devis
3. Client accepte le devis (statut = 'accepte')
4. ❌ PROBLÈME: Pas de système de paiement structuré
5. ❌ PROBLÈME: Pas de génération de contrat
6. ❌ PROBLÈME: Frais de déplacement non séparés
```

## 🚨 PROBLÈMES IDENTIFIÉS

### 1. SÉPARATION DES PAIEMENTS
**Problème**: Le devis actuel ne sépare pas:
- Le montant des travaux/services
- Les frais de déplacement

**Impact**: 
- Manque de transparence pour le client
- Difficulté de gestion comptable
- Pas de flexibilité sur les frais de déplacement

### 2. ABSENCE DE CONTRAT
**Problème**: Aucun contrat n'est généré lors de l'acceptation du devis

**Impact**:
- Pas de document légal liant les parties
- Pas de conditions générales signées
- Risque juridique pour KaziPro et les parties

### 3. FLUX DE PAIEMENT NON DÉFINI
**Problème**: Pas de protocole clair pour:
- Quand payer (avant/pendant/après)
- Comment payer (méthodes)
- Paiements échelonnés (acompte, solde)

**Impact**:
- Confusion pour les clients
- Risque de non-paiement
- Pas de traçabilité

### 4. FRAIS DE VISITE/DÉPLACEMENT
**Problème**: Les frais de visite et déplacement ne sont pas:
- Calculés automatiquement
- Affichés séparément du montant des travaux
- Configurables par le prestataire
- Distingués entre visite préalable et déplacement pour travaux

**Types de frais**:
1. **Frais de visite préalable**: Pour évaluation, prise de mesures, devis sur place
2. **Frais de déplacement travaux**: Pour se rendre sur le chantier

**Impact**:
- Manque de transparence pour le client
- Litiges potentiels sur les coûts
- Difficulté de facturation
- Prestataire peut perdre de l'argent sur les déplacements

## 💡 SOLUTION PROPOSÉE

### ARCHITECTURE DU NOUVEAU SYSTÈME

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUX COMPLET                              │
└─────────────────────────────────────────────────────────────┘

1. DEMANDE CLIENT
   └─> Client crée une demande avec localisation

2. DEVIS PRESTATAIRE
   ├─> Montant des travaux (HT)
   ├─> Frais de déplacement (calculés selon distance)
   ├─> TVA (16%)
   ├─> Total TTC
   └─> Conditions de paiement (acompte %, échéances)

3. ACCEPTATION CLIENT
   └─> Client accepte le devis
       └─> Statut: "accepte_en_attente_paiement"

4. GÉNÉRATION CONTRAT ⭐ NOUVEAU
   ├─> Contrat PDF généré automatiquement
   ├─> Contient:
   │   ├─> Détails du devis
   │   ├─> Conditions générales
   │   ├─> Modalités de paiement
   │   ├─> Signatures électroniques
   │   └─> Numéro unique de contrat
   └─> Stocké dans storage Supabase

5. PAIEMENT(S) ⭐ NOUVEAU
   ├─> Option 1: Paiement complet
   ├─> Option 2: Acompte + Solde
   │   ├─> Acompte (ex: 30%) avant début
   │   └─> Solde (70%) après travaux
   └─> Méthodes: M-Pesa, Airtel Money, Carte bancaire

6. CONFIRMATION & MISSION
   ├─> Paiement validé
   ├─> Contrat signé électroniquement
   ├─> Mission créée automatiquement
   └─> Notification aux deux parties

7. SUIVI PAIEMENTS
   ├─> Historique des paiements
   ├─> Reçus automatiques
   └─> Rappels si impayés
```

## 🗄️ NOUVELLES TABLES NÉCESSAIRES

### 1. Table `contrats`
```sql
CREATE TABLE contrats (
  id UUID PRIMARY KEY,
  numero TEXT UNIQUE NOT NULL, -- CONT-2026-0001
  devis_id UUID REFERENCES devis(id),
  client_id UUID REFERENCES clients(id),
  prestataire_id UUID REFERENCES prestataires(id),
  
  -- Contenu
  contenu_html TEXT, -- Contenu du contrat en HTML
  contrat_pdf_url TEXT, -- URL du PDF dans storage
  
  -- Signatures
  signature_client_url TEXT,
  signature_prestataire_url TEXT,
  date_signature_client TIMESTAMP,
  date_signature_prestataire TIMESTAMP,
  
  -- Statut
  statut TEXT CHECK (statut IN (
    'genere',           -- Contrat généré, en attente signatures
    'signe_client',     -- Client a signé
    'signe_complet',    -- Les deux ont signé
    'annule'            -- Contrat annulé
  )),
  
  -- Conditions
  conditions_paiement JSONB, -- {type: 'complet|echelonne', acompte: 30, ...}
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Table `paiements` (Améliorée)
```sql
CREATE TABLE paiements (
  id UUID PRIMARY KEY,
  numero TEXT UNIQUE NOT NULL, -- PAY-2026-0001
  contrat_id UUID REFERENCES contrats(id),
  devis_id UUID REFERENCES devis(id),
  mission_id UUID REFERENCES missions(id),
  client_id UUID REFERENCES clients(id),
  prestataire_id UUID REFERENCES prestataires(id),
  
  -- Type de paiement
  type_paiement TEXT CHECK (type_paiement IN (
    'acompte',          -- Paiement initial
    'solde',            -- Paiement final
    'complet',          -- Paiement unique
    'echeance'          -- Paiement échelonné
  )),
  
  -- Montants
  montant_travaux DECIMAL(10,2),      -- Montant des travaux
  montant_deplacement DECIMAL(10,2),  -- Frais de déplacement
  montant_total DECIMAL(10,2),        -- Total à payer
  
  -- Méthode et statut
  methode_paiement TEXT CHECK (methode_paiement IN (
    'mpesa', 'airtel_money', 'carte_bancaire', 'especes', 'virement'
  )),
  statut TEXT CHECK (statut IN (
    'en_attente',       -- En attente de paiement
    'en_cours',         -- Paiement en cours de traitement
    'valide',           -- Paiement validé
    'echoue',           -- Paiement échoué
    'rembourse'         -- Paiement remboursé
  )),
  
  -- Détails transaction
  transaction_id TEXT,              -- ID de la transaction externe
  reference_paiement TEXT,          -- Référence unique
  recu_url TEXT,                    -- URL du reçu PDF
  
  -- Dates
  date_echeance TIMESTAMP,
  date_paiement TIMESTAMP,
  date_validation TIMESTAMP,
  
  -- Métadonnées
  metadata JSONB,                   -- Infos supplémentaires
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Table `frais_deplacement_config`
```sql
CREATE TABLE frais_deplacement_config (
  id UUID PRIMARY KEY,
  prestataire_id UUID REFERENCES prestataires(id) UNIQUE,
  
  -- Configuration
  mode_calcul TEXT CHECK (mode_calcul IN (
    'fixe',             -- Montant fixe
    'par_km',           -- Prix par kilomètre
    'par_zone',         -- Prix par zone géographique
    'gratuit'           -- Pas de frais
  )),
  
  -- Tarifs
  montant_fixe DECIMAL(10,2),       -- Si mode fixe
  prix_par_km DECIMAL(10,2),        -- Si mode par_km
  distance_gratuite_km INTEGER,     -- Distance gratuite (ex: 5km)
  
  -- Zones (si mode par_zone)
  zones JSONB, -- [{nom: 'Kinshasa Centre', prix: 5000}, ...]
  
  -- Limites
  montant_minimum DECIMAL(10,2),
  montant_maximum DECIMAL(10,2),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Table `conditions_paiement_templates`
```sql
CREATE TABLE conditions_paiement_templates (
  id UUID PRIMARY KEY,
  prestataire_id UUID REFERENCES prestataires(id),
  
  -- Template
  nom TEXT NOT NULL,                -- Ex: "Standard", "Grands travaux"
  description TEXT,
  
  -- Conditions
  type_paiement TEXT CHECK (type_paiement IN (
    'complet_avant',    -- 100% avant travaux
    'complet_apres',    -- 100% après travaux
    'acompte_solde',    -- Acompte + Solde
    'echelonne'         -- Paiements échelonnés
  )),
  
  -- Pourcentages (si acompte_solde)
  pourcentage_acompte INTEGER,     -- Ex: 30
  pourcentage_solde INTEGER,       -- Ex: 70
  
  -- Échéances (si echelonne)
  echeances JSONB, -- [{pourcentage: 30, moment: 'debut'}, ...]
  
  -- Délais
  delai_paiement_jours INTEGER,    -- Délai de paiement
  
  -- Par défaut
  est_defaut BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔄 NOUVEAU FLUX DÉTAILLÉ

### ÉTAPE 1: CRÉATION DU DEVIS (Prestataire)

```typescript
interface DevisData {
  // Travaux
  items: DevisItem[];           // Lignes du devis
  montant_travaux_ht: number;
  
  // Déplacement
  distance_km: number;          // Calculée automatiquement
  frais_deplacement: number;    // Calculés selon config
  
  // Totaux
  sous_total_ht: number;        // travaux + déplacement
  tva: number;
  montant_ttc: number;
  
  // Conditions
  conditions_paiement_id: UUID; // Template choisi
  delai_validite_jours: number; // Ex: 15 jours
}
```

### ÉTAPE 2: ACCEPTATION (Client)

```typescript
// Client clique "Accepter le devis"
1. Afficher récapitulatif:
   - Montant travaux: X FC
   - Frais déplacement: Y FC
   - Total TTC: Z FC
   - Conditions de paiement

2. Client confirme
   └─> Statut devis: "accepte_en_attente_contrat"

3. Génération automatique du contrat
```

### ÉTAPE 3: GÉNÉRATION DU CONTRAT ⭐

```typescript
async function genererContrat(devisId: UUID) {
  // 1. Récupérer les données
  const devis = await getDevis(devisId);
  const prestataire = await getPrestataire(devis.prestataire_id);
  const client = await getClient(devis.client_id);
  const entrepriseInfo = await getEntrepriseInfo(prestataire.id);
  
  // 2. Générer le HTML du contrat
  const contratHTML = genererContratHTML({
    numero: generateContratNumero(), // CONT-2026-0001
    date: new Date(),
    prestataire: {
      nom: entrepriseInfo.nom_entreprise,
      adresse: entrepriseInfo.adresse,
      telephone: entrepriseInfo.telephone,
      email: entrepriseInfo.email_professionnel,
      numero_fiscal: entrepriseInfo.numero_fiscal
    },
    client: {
      nom: client.full_name,
      adresse: client.address,
      telephone: client.phone,
      email: client.email
    },
    devis: {
      numero: devis.numero,
      items: devis.items,
      montant_travaux: devis.montant_travaux_ht,
      frais_deplacement: devis.frais_deplacement,
      tva: devis.tva,
      montant_ttc: devis.montant_ttc
    },
    conditions: {
      paiement: devis.conditions_paiement,
      generales: entrepriseInfo.conditions_generales,
      delais: devis.delai_execution,
      garanties: "..."
    }
  });
  
  // 3. Générer le PDF
  const contratPDF = await genererPDF(contratHTML);
  
  // 4. Uploader dans Supabase Storage
  const pdfUrl = await uploadContrat(contratPDF, `contrat-${numero}.pdf`);
  
  // 5. Créer l'enregistrement
  const contrat = await createContrat({
    numero,
    devis_id: devisId,
    client_id: client.id,
    prestataire_id: prestataire.id,
    contenu_html: contratHTML,
    contrat_pdf_url: pdfUrl,
    statut: 'genere',
    conditions_paiement: devis.conditions_paiement
  });
  
  // 6. Notifier les parties
  await notifierContratGenere(contrat);
  
  return contrat;
}
```

### ÉTAPE 4: SIGNATURE DU CONTRAT

```typescript
// Interface de signature
1. Client visualise le contrat PDF
2. Client lit les conditions
3. Client signe électroniquement:
   - Option A: Signature dessinée (canvas)
   - Option B: Signature uploadée
   - Option C: Acceptation par code SMS
4. Signature enregistrée
   └─> contrat.statut = 'signe_client'
5. Prestataire notifié
6. Prestataire signe aussi
   └─> contrat.statut = 'signe_complet'
```

### ÉTAPE 5: PAIEMENT ⭐

```typescript
// Page de paiement
interface PaiementData {
  contrat_id: UUID;
  type_paiement: 'acompte' | 'solde' | 'complet';
  
  montants: {
    travaux: number;
    deplacement: number;
    total: number;
  };
  
  methode: 'mpesa' | 'airtel_money' | 'carte';
  telephone?: string; // Pour mobile money
}

async function initierPaiement(data: PaiementData) {
  // 1. Créer l'enregistrement paiement
  const paiement = await createPaiement({
    numero: generatePaiementNumero(), // PAY-2026-0001
    contrat_id: data.contrat_id,
    type_paiement: data.type_paiement,
    montant_travaux: data.montants.travaux,
    montant_deplacement: data.montants.deplacement,
    montant_total: data.montants.total,
    methode_paiement: data.methode,
    statut: 'en_attente'
  });
  
  // 2. Initier la transaction selon la méthode
  let transactionResult;
  switch (data.methode) {
    case 'mpesa':
      transactionResult = await initierMPesa(paiement, data.telephone);
      break;
    case 'airtel_money':
      transactionResult = await initierAirtelMoney(paiement, data.telephone);
      break;
    case 'carte':
      transactionResult = await initierPaiementCarte(paiement);
      break;
  }
  
  // 3. Mettre à jour avec l'ID de transaction
  await updatePaiement(paiement.id, {
    transaction_id: transactionResult.transaction_id,
    statut: 'en_cours'
  });
  
  // 4. Attendre la confirmation (webhook)
  return paiement;
}

// Webhook de confirmation
async function confirmerPaiement(transactionId: string) {
  const paiement = await getPaiementByTransaction(transactionId);
  
  // 1. Valider le paiement
  await updatePaiement(paiement.id, {
    statut: 'valide',
    date_paiement: new Date(),
    date_validation: new Date()
  });
  
  // 2. Générer le reçu
  const recu = await genererRecu(paiement);
  const recuUrl = await uploadRecu(recu);
  await updatePaiement(paiement.id, { recu_url: recuUrl });
  
  // 3. Si paiement complet ou dernier paiement
  if (paiement.type_paiement === 'complet' || 
      paiement.type_paiement === 'solde') {
    // Créer la mission
    await creerMission({
      devis_id: paiement.devis_id,
      contrat_id: paiement.contrat_id,
      statut: 'pending'
    });
  }
  
  // 4. Notifier les parties
  await notifierPaiementValide(paiement);
}
```

## 📱 INTERFACES UTILISATEUR NÉCESSAIRES

### 1. Pour le Prestataire

#### A. Configuration des frais de déplacement
```
┌─────────────────────────────────────────┐
│ Frais de Déplacement                    │
├─────────────────────────────────────────┤
│ Mode de calcul:                         │
│ ○ Montant fixe                          │
│ ● Prix par kilomètre                    │
│ ○ Par zone géographique                 │
│ ○ Gratuit                               │
│                                         │
│ Prix par km: [500] FC                   │
│ Distance gratuite: [5] km               │
│                                         │
│ Montant minimum: [2000] FC              │
│ Montant maximum: [50000] FC             │
│                                         │
│ [Enregistrer]                           │
└─────────────────────────────────────────┘
```

#### B. Templates de conditions de paiement
```
┌─────────────────────────────────────────┐
│ Conditions de Paiement                  │
├─────────────────────────────────────────┤
│ ✓ Standard (par défaut)                 │
│   • Acompte 30% avant début             │
│   • Solde 70% après travaux             │
│                                         │
│ ○ Grands Travaux                        │
│   • Acompte 40% à la signature          │
│   • 30% à mi-parcours                   │
│   • 30% à la fin                        │
│                                         │
│ ○ Paiement Complet                      │
│   • 100% avant début des travaux        │
│                                         │
│ [+ Nouveau Template]                    │
└─────────────────────────────────────────┘
```

#### C. Création de devis (améliorée)
```
┌─────────────────────────────────────────┐
│ Nouveau Devis                           │
├─────────────────────────────────────────┤
│ TRAVAUX                                 │
│ ┌─────────────────────────────────────┐ │
│ │ 1. Installation électrique          │ │
│ │    Qté: 1  Prix: 50,000 FC          │ │
│ │ 2. Matériel                         │ │
│ │    Qté: 1  Prix: 30,000 FC          │ │
│ └─────────────────────────────────────┘ │
│ Sous-total travaux: 80,000 FC           │
│                                         │
│ DÉPLACEMENT                             │
│ Distance: 12 km                         │
│ Frais: 6,000 FC (500 FC/km)            │
│                                         │
│ TOTAL                                   │
│ HT: 86,000 FC                           │
│ TVA (16%): 13,760 FC                    │
│ TTC: 99,760 FC                          │
│                                         │
│ CONDITIONS DE PAIEMENT                  │
│ [Standard ▼]                            │
│ • Acompte 30%: 29,928 FC                │
│ • Solde 70%: 69,832 FC                  │
│                                         │
│ [Envoyer le Devis]                      │
└─────────────────────────────────────────┘
```

### 2. Pour le Client

#### A. Acceptation du devis
```
┌─────────────────────────────────────────┐
│ Devis DEV-2026-0042                     │
├─────────────────────────────────────────┤
│ De: TechServices SARL                   │
│ Date: 23/01/2026                        │
│                                         │
│ DÉTAILS                                 │
│ • Installation électrique: 50,000 FC    │
│ • Matériel: 30,000 FC                   │
│ • Frais déplacement (12km): 6,000 FC    │
│                                         │
│ TOTAL TTC: 99,760 FC                    │
│                                         │
│ CONDITIONS DE PAIEMENT                  │
│ • Acompte 30% (29,928 FC) avant début   │
│ • Solde 70% (69,832 FC) après travaux   │
│                                         │
│ [Refuser] [Accepter et Continuer]      │
└─────────────────────────────────────────┘
```

#### B. Signature du contrat
```
┌─────────────────────────────────────────┐
│ Contrat CONT-2026-0042                  │
├─────────────────────────────────────────┤
│ [📄 Visualiser le contrat PDF]          │
│                                         │
│ ☑ J'ai lu et j'accepte les conditions   │
│   générales du contrat                  │
│                                         │
│ SIGNATURE                               │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │   [Zone de signature]               │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│ [Effacer] [Signer et Continuer]        │
└─────────────────────────────────────────┘
```

#### C. Paiement
```
┌─────────────────────────────────────────┐
│ Paiement - Acompte                      │
├─────────────────────────────────────────┤
│ MONTANT À PAYER                         │
│ • Travaux: 24,000 FC                    │
│ • Déplacement: 1,800 FC                 │
│ • TVA: 4,128 FC                         │
│ ─────────────────────                   │
│ Total: 29,928 FC                        │
│                                         │
│ MÉTHODE DE PAIEMENT                     │
│ ● M-Pesa                                │
│ ○ Airtel Money                          │
│ ○ Carte bancaire                        │
│                                         │
│ Numéro de téléphone:                    │
│ [+243 812 345 678]                      │
│                                         │
│ [Payer Maintenant]                      │
│                                         │
│ 🔒 Paiement sécurisé                    │
└─────────────────────────────────────────┘
```

## 📊 AVANTAGES DU NOUVEAU SYSTÈME

### 1. TRANSPARENCE
✅ Séparation claire travaux / déplacement
✅ Conditions de paiement explicites
✅ Contrat détaillé et signé

### 2. SÉCURITÉ JURIDIQUE
✅ Contrat légal entre les parties
✅ Signatures électroniques
✅ Conditions générales acceptées
✅ Traçabilité complète

### 3. FLEXIBILITÉ
✅ Plusieurs modes de paiement
✅ Paiements échelonnés possibles
✅ Configuration par prestataire
✅ Templates réutilisables

### 4. TRAÇABILITÉ
✅ Historique complet des paiements
✅ Reçus automatiques
✅ Numéros uniques (contrats, paiements)
✅ Audit trail

### 5. EXPÉRIENCE UTILISATEUR
✅ Processus clair et guidé
✅ Pas de surprise sur les coûts
✅ Paiement mobile intégré
✅ Documents téléchargeables

## 🎯 PROCHAINES ÉTAPES

### Phase 1: Spécification (En cours)
- [x] Analyse du flux actuel
- [x] Identification des problèmes
- [x] Proposition de solution
- [ ] Validation avec le client
- [ ] Création du spec complet

### Phase 2: Design de la base de données
- [ ] Créer les nouvelles tables
- [ ] Migrer les données existantes
- [ ] Tester les relations

### Phase 3: Backend
- [ ] API génération de contrat
- [ ] API paiement
- [ ] Intégration M-Pesa/Airtel Money
- [ ] Webhooks de confirmation

### Phase 4: Frontend
- [ ] Interfaces prestataire
- [ ] Interfaces client
- [ ] Génération PDF
- [ ] Signature électronique

### Phase 5: Tests & Déploiement
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Tests de paiement (sandbox)
- [ ] Déploiement progressif

## ❓ QUESTIONS À CLARIFIER AVEC LE CLIENT

1. **Frais de déplacement**:
   - Quel mode de calcul par défaut? (fixe, par km, par zone)
   - Quelle distance gratuite standard?
   - Plafonds min/max?

2. **Conditions de paiement**:
   - Pourcentage d'acompte standard? (30%, 40%, 50%?)
   - Délai de paiement du solde?
   - Pénalités de retard?

3. **Contrat**:
   - Modèle de contrat standard à utiliser?
   - Mentions légales obligatoires?
   - Durée de validité?

4. **Paiement**:
   - Méthodes prioritaires? (M-Pesa, Airtel Money, Carte)
   - Frais de transaction: qui paie?
   - Remboursements: politique?

5. **Signatures**:
   - Signature électronique suffisante?
   - Validation par SMS/OTP nécessaire?
   - Conservation des signatures?

## 📝 CONCLUSION

Le système actuel nécessite une refonte complète du flux de paiement et de contractualisation. La solution proposée apporte:

✅ **Transparence**: Séparation claire des coûts
✅ **Sécurité**: Contrats signés et paiements tracés
✅ **Flexibilité**: Configuration par prestataire
✅ **Conformité**: Documents légaux générés
✅ **UX**: Processus guidé et clair

**Prochaine étape**: Validation de cette analyse et création du spec détaillé pour l'implémentation.
