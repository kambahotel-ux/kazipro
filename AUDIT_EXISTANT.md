# 🔍 AUDIT - Ce qui existe déjà

## ✅ BASE DE DONNÉES

### Tables existantes

| Table | Colonnes principales | Statut |
|-------|---------------------|--------|
| **clients** | id, user_id, full_name, address, city, verified | ✅ OK |
| **prestataires** | id, user_id, full_name, profession, bio, rating, verified | ✅ OK |
| **demandes** | id, client_id, title, description, service, location, budget_min, budget_max, status | ⚠️ À COMPLÉTER |
| **devis** | id, demande_id, prestataire_id, amount, description, status | ⚠️ À COMPLÉTER |
| **missions** | id, devis_id, client_id, prestataire_id, status, start_date, end_date | ✅ OK |
| **paiements** | id, mission_id, amount, method, status, transaction_id | ⚠️ À COMPLÉTER |
| **avis** | id, mission_id, from_user_id, to_user_id, rating, comment | ✅ OK |
| **messages** | id, sender_id, receiver_id, content, read | ✅ OK |

### Tables ajoutées (devis pro)

| Table | Colonnes principales | Statut |
|-------|---------------------|--------|
| **devis_pro** | numero, titre, montant_ht, tva, montant_ttc, statut, dates | ✅ CRÉÉ |
| **devis_pro_items** | designation, quantite, prix_unitaire, montant | ✅ CRÉÉ |

---

## ⚠️ CE QUI MANQUE

### 1. Table DEMANDES - Colonnes manquantes

**Actuellement**:
- title, description, service, location
- budget_min, budget_max
- status (active, completed, cancelled)

**Manque**:
- ❌ `profession` (au lieu de service)
- ❌ `localisation` (au lieu de location)
- ❌ `urgence` (normal, urgent, tres-urgent)
- ❌ `statut` avec plus d'options (en_attente, attribuee, en_cours, terminee, completee, annulee, litige)
- ❌ `devis_accepte_id` (référence au devis accepté)
- ❌ `deadline` (date limite)

### 2. Table DEVIS - Colonnes manquantes

**Actuellement** (table devis):
- demande_id, prestataire_id
- amount, description
- status (pending, accepted, rejected)

**Actuellement** (table devis_pro):
- ✅ numero, titre, montant_ht, tva, montant_ttc
- ✅ statut (brouillon, envoye, accepte, refuse, expire)
- ✅ dates (creation, envoi, expiration, acceptation, refus)

**Manque** (pour workflow complet):
- ❌ `frais_deplacement` (frais de visite terrain)
- ❌ `delai_execution` (combien de jours)
- ❌ `delai_intervention` (quand peut commencer)
- ❌ `validite_devis` (date d'expiration)
- ❌ `garantie` (durée de garantie)
- ❌ `conditions_paiement` (JSONB):
  - acompte_requis (boolean)
  - pourcentage_acompte (number)
  - montant_acompte (number)
  - montant_solde (number)
  - modalites (text)
  - methodes_acceptees (array)

### 3. Table PAIEMENTS - Colonnes manquantes

**Actuellement**:
- mission_id, amount, method, status, transaction_id

**Manque**:
- ❌ `devis_id` (référence au devis)
- ❌ `client_id` (référence directe)
- ❌ `prestataire_id` (référence directe)
- ❌ `type` (acompte, solde, total)
- ❌ `reference_transaction` (au lieu de transaction_id)
- ❌ Plus de méthodes: mobile_money, virement, especes, carte
- ❌ Plus de statuts: en_attente, confirme, echoue, rembourse

### 4. Tables MANQUANTES

#### Table LITIGES
```sql
CREATE TABLE litiges (
  id UUID PRIMARY KEY,
  demande_id UUID REFERENCES demandes(id),
  mission_id UUID REFERENCES missions(id),
  ouvert_par UUID REFERENCES auth.users(id),
  type TEXT, -- travaux_non_conformes, retard, paiement, abandon
  description TEXT,
  statut TEXT, -- ouvert, en_mediation, en_arbitrage, resolu, clos
  resolution TEXT,
  created_at TIMESTAMP,
  resolved_at TIMESTAMP
);
```

#### Table NOTIFICATIONS
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type TEXT, -- nouveau_devis, devis_accepte, message, etc.
  titre TEXT,
  message TEXT,
  lien TEXT,
  lu BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
);
```

#### Table DOCUMENTS (pour prestataires)
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  prestataire_id UUID REFERENCES prestataires(id),
  type TEXT, -- identite, assurance, certificat, etc.
  nom_fichier TEXT,
  url TEXT,
  statut TEXT, -- en_attente, valide, refuse
  date_expiration DATE,
  created_at TIMESTAMP
);
```

#### Table FAVORIS (clients marquent prestataires favoris)
```sql
CREATE TABLE favoris (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  prestataire_id UUID REFERENCES prestataires(id),
  created_at TIMESTAMP,
  UNIQUE(client_id, prestataire_id)
);
```

---

## 📊 STATUTS À METTRE À JOUR

### Demandes

**Actuellement**: active, completed, cancelled

**Devrait être**:
- `en_attente` - Publiée, attend devis
- `attribuee` - Devis accepté, attend paiement
- `en_cours` - Travaux en cours
- `en_validation` - Attend validation client
- `corrections_demandees` - Corrections à faire
- `terminee` - Validée par client
- `completee` - Payée et clôturée
- `annulee` - Annulée
- `litige` - En litige
- `archivee` - Archivée

### Devis

**Actuellement**: pending, accepted, rejected

**Devrait être**:
- `brouillon` - En cours de rédaction
- `en_attente` - Soumis, attend réponse
- `en_negociation` - En cours de négociation
- `accepte` - Accepté par client
- `refuse` - Refusé
- `retire` - Retiré par prestataire
- `expire` - Délai dépassé
- `archive` - Archivé

### Missions

**Actuellement**: pending, in_progress, completed, cancelled

**Devrait être**:
- `non_commence` - Pas encore démarré
- `en_preparation` - Préparation
- `en_cours` - Travaux en cours
- `en_pause` - Pause temporaire
- `termine` - Travaux terminés
- `valide` - Validé par client
- `annule` - Annulé

### Paiements

**Actuellement**: pending, completed, failed

**Devrait être**:
- `en_attente` - Attend paiement
- `acompte_en_attente` - Attend acompte
- `acompte_paye` - Acompte payé
- `solde_en_attente` - Attend solde
- `paye_complet` - Totalement payé
- `rembourse_partiel` - Remboursement partiel
- `rembourse_total` - Remboursement total
- `litige` - En litige

---

## 🔐 RLS POLICIES

### ✅ Ce qui existe

- Clients voient leurs propres données
- Prestataires voient leurs propres données
- Clients voient demandes actives
- Prestataires voient devis de leurs demandes
- Missions visibles par client et prestataire concernés

### ⚠️ Ce qui manque

- ❌ Admin peut tout voir (partiellement implémenté)
- ❌ Prestataires voient demandes de leur profession ET zone géographique
- ❌ Clients voient profils prestataires ayant soumis devis
- ❌ Gestion des demandes en négociation
- ❌ Visibilité des devis selon statut

---

## 📱 PAGES FRONTEND

### ✅ Ce qui existe

**Client**:
- ✅ Dashboard
- ✅ Création de demande (NouvelleDemandePages.tsx)
- ✅ Liste des demandes (DemandesPage.tsx)
- ✅ Messages
- ✅ Paiements
- ✅ Avis
- ✅ Paramètres

**Prestataire**:
- ✅ Dashboard (avec données réelles)
- ✅ Profil complet (ProfilPage.tsx)
- ✅ Missions
- ✅ Devis (DevisPage.tsx)
- ✅ Revenus
- ✅ Messages
- ✅ Calendrier
- ✅ Paramètres

**Admin**:
- ✅ Dashboard
- ✅ Utilisateurs
- ✅ Prestataires
- ✅ Demandes
- ✅ Transactions
- ✅ Litiges
- ✅ Rapports
- ✅ Configuration
- ✅ Professions

### ❌ Ce qui manque

**Client**:
- ❌ Page détail d'une demande (avec liste des devis reçus)
- ❌ Page comparaison de devis (tableau comparatif)
- ❌ Page détail d'un devis (voir devis complet)
- ❌ Page acceptation de devis (avec paiement)
- ❌ Page suivi de mission (progression en temps réel)
- ❌ Page validation de travaux (avec photos)

**Prestataire**:
- ❌ Page opportunités (liste demandes disponibles)
- ❌ Page détail d'une demande (avant soumission devis)
- ❌ Page création de devis (formulaire complet)
- ❌ Page mes devis (liste avec statuts)
- ❌ Page suivi de mission (upload photos, commentaires)
- ❌ Page négociation (chat avec client)

**Commun**:
- ❌ Messagerie complète (chat temps réel)
- ❌ Notifications (centre de notifications)
- ❌ Gestion des litiges (ouverture, suivi)

---

## 🎯 PRIORITÉS D'IMPLÉMENTATION

### Phase 1: URGENT (Workflow de base)

1. **Mettre à jour table demandes**
   - Ajouter colonnes manquantes
   - Mettre à jour statuts
   - Fixer RLS policies

2. **Compléter table devis**
   - Ajouter frais_deplacement
   - Ajouter conditions_paiement (JSONB)
   - Ajouter délais et garanties

3. **Page Opportunités (Prestataire)**
   - Liste des demandes disponibles
   - Filtres par profession/zone
   - Bouton "Soumettre un devis"

4. **Page Création de Devis (Prestataire)**
   - Formulaire complet
   - Calcul automatique
   - Conditions de paiement

5. **Page Liste Devis (Client)**
   - Voir tous les devis reçus
   - Tableau comparatif
   - Bouton "Accepter"

### Phase 2: IMPORTANT (Paiement et suivi)

6. **Système de paiement**
   - Intégration Mobile Money
   - Gestion acompte/solde
   - Compte séquestre

7. **Suivi de mission**
   - Upload photos progression
   - Commentaires
   - Changement statuts

8. **Validation et avis**
   - Validation travaux
   - Demande corrections
   - Système d'avis mutuel

### Phase 3: AVANCÉ (Fonctionnalités pro)

9. **Négociation**
   - Chat dédié
   - Révision de devis
   - Historique

10. **Litiges**
    - Ouverture ticket
    - Médiation
    - Arbitrage

11. **Notifications**
    - Centre de notifications
    - Emails automatiques
    - SMS pour urgences

---

## 📝 RÉSUMÉ

### ✅ Bien avancé
- Structure de base des tables
- Authentification
- Dashboards
- Création de demandes
- Profils

### ⚠️ À compléter
- Colonnes manquantes dans tables existantes
- Statuts à mettre à jour
- RLS policies à affiner

### ❌ À créer
- Tables: litiges, notifications, documents, favoris
- Pages: opportunités, création devis, comparaison, paiement, suivi
- Fonctionnalités: négociation, messagerie temps réel, notifications

---

**Prochaine étape**: Commencer par la Phase 1, tâche 1 - Mettre à jour la table demandes
