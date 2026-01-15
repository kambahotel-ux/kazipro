# 📋 Workflow Complet: Demandes et Devis

## 🎯 Vue d'ensemble

Ce document clarifie le flux complet depuis la création d'une demande jusqu'au paiement.

---

## 📊 Cycle de vie d'une demande

### 1️⃣ Création de la demande (CLIENT)

**Statut**: `en_attente`

Le client crée une demande avec:
- Titre et description
- Service/Profession recherché
- Localisation
- Budget (min/max)
- Urgence
- Photos (optionnel)

**Résultat**: La demande est visible par tous les prestataires de cette profession.

---

### 2️⃣ Soumission des devis (PRESTATAIRES)

**Statut demande**: `en_attente` (reste inchangé)

**Plusieurs prestataires** peuvent soumettre des devis pour la même demande.

**Chaque devis contient**:
- **Montant total** (prix du service)
- **Frais de déplacement** (si visite terrain nécessaire)
- **Description détaillée** du travail proposé
- **Délai d'exécution** (combien de jours/semaines)
- **Conditions de paiement**:
  - Pourcentage d'acompte (ex: 30%)
  - Modalités de paiement (ex: 30% avant, 70% après)
  - Méthode de paiement acceptée
- **Validité du devis** (ex: valable 15 jours)
- **Garanties offertes** (optionnel)

**Statut devis**: `en_attente`

**Résultat**: Le client voit tous les devis soumis pour sa demande.

---

### 3️⃣ Évaluation des devis (CLIENT)

**Statut demande**: `en_attente` (reste inchangé)

Le client peut:
- **Voir tous les devis** reçus
- **Comparer**:
  - Prix total (montant + frais déplacement)
  - Délai d'exécution
  - Conditions de paiement
  - Profil du prestataire (note, avis, expérience)
- **Consulter le profil** de chaque prestataire:
  - Note moyenne
  - Nombre de missions complétées
  - Avis d'autres clients
  - Portfolio/photos de travaux précédents
- **Poser des questions** (via messagerie)

**Résultat**: Le client choisit un devis.

---

### 4️⃣ Acceptation d'un devis (CLIENT)

**Actions**:
1. Client clique sur "Accepter ce devis"
2. Système met à jour les statuts:
   - **Demande**: `en_attente` → `attribuee`
   - **Devis accepté**: `en_attente` → `accepte`
   - **Autres devis**: `en_attente` → `refuse`

**Résultat**: 
- Le prestataire choisi est notifié
- Les autres prestataires sont notifiés du refus
- La demande n'est plus visible dans les opportunités

---

### 5️⃣ Paiement (CLIENT)

**Statut demande**: `attribuee`

**Selon les conditions de paiement du devis**:

**Option A: Acompte requis**
- Client paie l'acompte (ex: 30%)
- **Statut demande**: `attribuee` → `en_cours`
- **Statut paiement**: `acompte_paye`
- Prestataire peut commencer le travail

**Option B: Paiement après travail**
- Pas de paiement immédiat
- **Statut demande**: `attribuee` → `en_cours`
- Prestataire commence le travail

**Résultat**: Le travail peut commencer.

---

### 6️⃣ Exécution du travail (PRESTATAIRE)

**Statut demande**: `en_cours`

Le prestataire:
- Effectue le travail
- Peut uploader des photos de progression
- Peut communiquer avec le client
- Peut demander des clarifications

**Résultat**: Travail terminé.

---

### 7️⃣ Finalisation (CLIENT + PRESTATAIRE)

**Étape 1: Prestataire marque comme terminé**
- **Statut demande**: `en_cours` → `terminee`
- Client est notifié

**Étape 2: Client valide le travail**
- Client vérifie le travail
- Si satisfait: Valide la mission
- Si problème: Ouvre un litige

**Étape 3: Paiement final**
- Si acompte déjà payé: Client paie le solde (70%)
- Si pas d'acompte: Client paie le montant total
- **Statut paiement**: `paye_complet`

**Étape 4: Clôture**
- **Statut demande**: `terminee` → `completee`
- Client peut laisser un avis
- Prestataire reçoit son paiement

**Résultat**: Mission complétée avec succès.

---

## 📊 Statuts des demandes

| Statut | Description | Qui peut modifier |
|--------|-------------|-------------------|
| `en_attente` | Demande publiée, attend des devis | Système (création) |
| `attribuee` | Devis accepté, attend paiement | Client (acceptation devis) |
| `en_cours` | Travail en cours | Système (après paiement) |
| `terminee` | Travail terminé par prestataire | Prestataire |
| `completee` | Mission validée et payée | Client |
| `annulee` | Demande annulée | Client |
| `litige` | Problème signalé | Client ou Prestataire |

---

## 📊 Statuts des devis

| Statut | Description | Qui peut modifier |
|--------|-------------|-------------------|
| `en_attente` | Devis soumis, attend réponse | Prestataire (création) |
| `accepte` | Devis accepté par client | Client |
| `refuse` | Devis refusé (autre devis accepté) | Système |
| `retire` | Devis retiré par prestataire | Prestataire |
| `expire` | Devis expiré (délai dépassé) | Système |

---

## 💰 Gestion des paiements

### Informations dans le devis

```typescript
{
  montant_service: 100000,        // Prix du service
  frais_deplacement: 5000,        // Frais de déplacement
  montant_total: 105000,          // Total
  
  // Conditions de paiement
  conditions_paiement: {
    acompte_requis: true,
    pourcentage_acompte: 30,      // 30%
    montant_acompte: 31500,       // 30% de 105000
    montant_solde: 73500,         // 70% de 105000
    modalites: "30% avant début, 70% après validation",
    methodes_acceptees: ["Mobile Money", "Virement", "Espèces"]
  },
  
  delai_execution: "7 jours",
  validite_devis: "15 jours",
  garantie: "6 mois sur les travaux"
}
```

### Flux de paiement

**Avec acompte**:
1. Client accepte devis → Demande `attribuee`
2. Client paie acompte → Demande `en_cours`
3. Prestataire termine → Demande `terminee`
4. Client valide → Client paie solde
5. Paiement confirmé → Demande `completee`

**Sans acompte**:
1. Client accepte devis → Demande `attribuee` puis `en_cours`
2. Prestataire termine → Demande `terminee`
3. Client valide → Client paie total
4. Paiement confirmé → Demande `completee`

---

## 🔍 Évaluation par le client

### Critères de comparaison

Le client peut trier/filtrer les devis par:
- **Prix total** (croissant/décroissant)
- **Note du prestataire** (meilleure note d'abord)
- **Délai d'exécution** (plus rapide d'abord)
- **Nombre de missions** (plus expérimenté d'abord)

### Profil du prestataire visible

Pour chaque devis, le client voit:
- Photo de profil
- Nom complet
- Profession
- Note moyenne (⭐ 4.5/5)
- Nombre de missions complétées
- Taux de satisfaction
- Années d'expérience
- Localisation
- Lien vers profil complet

---

## 📱 Notifications

### Client reçoit notification quand:
- ✅ Nouveau devis soumis
- ✅ Prestataire pose une question
- ✅ Travail marqué comme terminé
- ⚠️ Devis va expirer (rappel)

### Prestataire reçoit notification quand:
- ✅ Nouvelle demande dans sa profession
- ✅ Son devis est accepté
- ✅ Son devis est refusé
- ✅ Client pose une question
- ✅ Paiement reçu

---

## 🗄️ Structure de la base de données

### Table `demandes`
```sql
- id
- client_id
- titre
- description
- profession
- localisation
- budget (montant indicatif)
- urgence
- statut (en_attente, attribuee, en_cours, terminee, completee, annulee, litige)
- devis_accepte_id (NULL jusqu'à acceptation)
- created_at
- updated_at
```

### Table `devis`
```sql
- id
- demande_id
- prestataire_id
- montant_service
- frais_deplacement
- montant_total
- description
- delai_execution
- validite_devis (date)
- statut (en_attente, accepte, refuse, retire, expire)
- conditions_paiement (JSONB):
  - acompte_requis
  - pourcentage_acompte
  - montant_acompte
  - montant_solde
  - modalites
  - methodes_acceptees
- garantie
- created_at
- updated_at
```

### Table `paiements`
```sql
- id
- demande_id
- devis_id
- client_id
- prestataire_id
- type (acompte, solde, total)
- montant
- methode (mobile_money, virement, especes)
- statut (en_attente, confirme, echoue, rembourse)
- reference_transaction
- created_at
```

---

## ✅ Résumé du workflow

```
CLIENT                    PRESTATAIRES              SYSTÈME
  |                            |                        |
  |--[Crée demande]----------->|                        |
  |                            |                        |
  |                            |<--[Voit demande]-------|
  |                            |                        |
  |                            |--[Soumet devis]------->|
  |<--[Reçoit devis]-----------|                        |
  |                            |                        |
  |--[Compare devis]---------->|                        |
  |--[Consulte profils]------->|                        |
  |                            |                        |
  |--[Accepte devis]---------->|                        |
  |                            |<--[Notifié accepté]----|
  |                            |                        |
  |--[Paie acompte]----------->|                        |
  |                            |<--[Reçoit notif]-------|
  |                            |                        |
  |                            |--[Effectue travail]--->|
  |                            |                        |
  |                            |--[Marque terminé]----->|
  |<--[Notifié terminé]--------|                        |
  |                            |                        |
  |--[Valide travail]--------->|                        |
  |--[Paie solde]------------->|                        |
  |                            |<--[Reçoit paiement]----|
  |                            |                        |
  |--[Laisse avis]------------>|                        |
  |                            |                        |
  ✅ Mission complétée         ✅ Paiement reçu         ✅
```

---

## 🎯 Points clés à implémenter

1. ✅ **Création de demandes** (FAIT)
2. 🔨 **Soumission de devis** (À FAIRE)
   - Formulaire avec tous les champs
   - Conditions de paiement personnalisables
3. 🔨 **Liste des devis pour le client** (À FAIRE)
   - Comparaison côte à côte
   - Profil prestataire intégré
4. 🔨 **Acceptation de devis** (À FAIRE)
   - Mise à jour des statuts
   - Notifications
5. 🔨 **Système de paiement** (À FAIRE)
   - Intégration Mobile Money
   - Gestion acompte/solde
6. 🔨 **Suivi de mission** (À FAIRE)
   - Statuts en temps réel
   - Communication client-prestataire
7. 🔨 **Validation et avis** (À FAIRE)
   - Validation du travail
   - Système d'avis

---

**Est-ce que ce workflow correspond à votre vision?**
**Y a-t-il des éléments à ajuster avant de commencer l'implémentation?**
