# 📋 Système de Devis Professionnel - Plan de Développement

## 🎯 Objectif

Créer un système complet de gestion de devis pour les prestataires avec:
- ✅ Création de devis professionnels avec lignes d'articles
- ✅ États: Brouillon, Envoyé, Accepté, Refusé, Expiré
- ✅ Export PDF avec design professionnel
- ✅ Prévisualisation avant envoi
- ✅ Calcul automatique des montants (HT, TVA, TTC)

---

## 📊 Structure de la Base de Données

### Table: `devis`

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique |
| numero | TEXT | Numéro unique (DEV-2024-0001) |
| prestataire_id | UUID | Référence au prestataire |
| client_id | UUID | Référence au client (optionnel) |
| demande_id | UUID | Référence à la demande (optionnel) |
| titre | TEXT | Titre du devis |
| description | TEXT | Description générale |
| notes | TEXT | Notes internes |
| conditions | TEXT | Conditions générales |
| montant_ht | DECIMAL | Montant hors taxes |
| tva | DECIMAL | Pourcentage TVA (16%) |
| montant_ttc | DECIMAL | Montant toutes taxes comprises |
| statut | TEXT | brouillon, envoye, accepte, refuse, expire |
| date_creation | TIMESTAMP | Date de création |
| date_envoi | TIMESTAMP | Date d'envoi au client |
| date_expiration | TIMESTAMP | Date d'expiration |
| date_acceptation | TIMESTAMP | Date d'acceptation |
| date_refus | TIMESTAMP | Date de refus |

### Table: `devis_items`

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique |
| devis_id | UUID | Référence au devis |
| designation | TEXT | Description de l'article/service |
| quantite | DECIMAL | Quantité |
| unite | TEXT | Unité (unité, heure, jour, m²) |
| prix_unitaire | DECIMAL | Prix unitaire |
| montant | DECIMAL | Montant total (quantité × prix) |
| ordre | INTEGER | Ordre d'affichage |

---

## 🎨 Interface Utilisateur

### Page Principale (`/dashboard/prestataire/devis`)

```
┌─────────────────────────────────────────────────────────────┐
│  Mes Devis                          [+ Nouveau devis]       │
├─────────────────────────────────────────────────────────────┤
│  [5] Brouillons  [3] Envoyés  [2] Acceptés  [150K FC]      │
├─────────────────────────────────────────────────────────────┤
│  [🔍 Rechercher...]  [Filtrer par statut ▼]                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Installation électrique complète  [Brouillon]      │   │
│  │ DEV-2024-0001                                       │   │
│  │ Montant HT: 50,000 FC  TVA (16%): 8,000 FC        │   │
│  │ Total TTC: 58,000 FC                                │   │
│  │ [👁️ Voir] [✏️ Modifier] [📋 Dupliquer] [🗑️ Suppr.]│   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Modal de Création

```
┌─────────────────────────────────────────────────────────────┐
│  Créer un Devis                                    [✕]      │
├─────────────────────────────────────────────────────────────┤
│  Titre: [Installation électrique                    ]      │
│  Description: [Installation complète...             ]      │
│                                                             │
│  Lignes du devis:                                           │
│  ┌───────────────────────────────────────────────────┐     │
│  │ Désignation          Qté  Unité  P.U.    Montant │     │
│  │ [Câblage électrique] [10] [m]   [500] = 5,000 FC│ [🗑️]│
│  │ [Tableau électrique] [1]  [unité][15K] = 15,000  │ [🗑️]│
│  │ [Main d'œuvre]       [8]  [heure][2K]  = 16,000  │ [🗑️]│
│  └───────────────────────────────────────────────────┘     │
│  [+ Ajouter une ligne]                                      │
│                                                             │
│  Montant HT:  36,000 FC                                     │
│  TVA (16%):    5,760 FC                                     │
│  ─────────────────────                                      │
│  Total TTC:   41,760 FC                                     │
│                                                             │
│  Conditions: [Devis valable 30 jours...         ]          │
│                                                             │
│  [Annuler] [💾 Enregistrer brouillon] [📤 Envoyer]        │
└─────────────────────────────────────────────────────────────┘
```

### Modal de Prévisualisation

```
┌─────────────────────────────────────────────────────────────┐
│  Prévisualisation du Devis                         [✕]      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ KAZIPRO                    DEVIS N° DEV-2024-0001  │   │
│  │                                                     │   │
│  │ Prestataire:               Client:                 │   │
│  │ Jean Dupont                Marie Martin            │   │
│  │ Électricien                Kinshasa                │   │
│  │                                                     │   │
│  │ Date: 04/01/2026          Valable jusqu'au: 03/02  │   │
│  │                                                     │   │
│  │ Installation électrique complète                   │   │
│  │                                                     │   │
│  │ ┌─────────────────────────────────────────────┐   │   │
│  │ │ Désignation      Qté  Unité  P.U.   Montant│   │   │
│  │ │ Câblage          10   m      500    5,000   │   │   │
│  │ │ Tableau          1    unité  15K    15,000  │   │   │
│  │ │ Main d'œuvre     8    heure  2K     16,000  │   │   │
│  │ └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │                          Montant HT:  36,000 FC    │   │
│  │                          TVA (16%):    5,760 FC    │   │
│  │                          ─────────────────────     │   │
│  │                          Total TTC:   41,760 FC    │   │
│  │                                                     │   │
│  │ Conditions:                                         │   │
│  │ - Devis valable 30 jours                           │   │
│  │ - Paiement à la livraison                          │   │
│  │ - Garantie 1 an                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Fermer] [📥 Télécharger PDF] [📤 Envoyer au client]     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 États du Devis

### 1. Brouillon
- **Description**: Devis en cours de création
- **Actions possibles**: Modifier, Supprimer, Envoyer
- **Couleur**: Gris

### 2. Envoyé
- **Description**: Devis envoyé au client
- **Actions possibles**: Voir, Dupliquer, Relancer
- **Couleur**: Bleu
- **Date d'expiration**: 30 jours après envoi

### 3. Accepté
- **Description**: Client a accepté le devis
- **Actions possibles**: Voir, Télécharger PDF, Créer mission
- **Couleur**: Vert

### 4. Refusé
- **Description**: Client a refusé le devis
- **Actions possibles**: Voir, Dupliquer, Supprimer
- **Couleur**: Rouge

### 5. Expiré
- **Description**: Devis dépassé la date d'expiration
- **Actions possibles**: Voir, Dupliquer
- **Couleur**: Gris clair

---

## 🛠️ Fonctionnalités

### Création de Devis

1. **Informations générales**
   - Titre du devis
   - Description
   - Notes internes (non visibles par le client)
   - Conditions générales

2. **Lignes d'articles**
   - Désignation (description de l'article/service)
   - Quantité
   - Unité (unité, heure, jour, m², kg, etc.)
   - Prix unitaire
   - Montant calculé automatiquement

3. **Calculs automatiques**
   - Montant HT = Somme des montants des lignes
   - TVA = Montant HT × (Taux TVA / 100)
   - Montant TTC = Montant HT + TVA

4. **Actions**
   - Enregistrer en brouillon
   - Envoyer au client

### Gestion des Devis

1. **Liste des devis**
   - Filtrer par statut
   - Rechercher par titre ou numéro
   - Trier par date

2. **Actions sur un devis**
   - Voir les détails
   - Modifier (si brouillon)
   - Dupliquer
   - Supprimer (si brouillon ou refusé)
   - Télécharger PDF
   - Envoyer au client

### Export PDF

1. **Design professionnel**
   - En-tête avec logo KaziPro
   - Informations prestataire et client
   - Numéro et dates
   - Tableau des articles
   - Totaux (HT, TVA, TTC)
   - Conditions générales
   - Pied de page

2. **Génération**
   - Utilisation de jsPDF ou react-pdf
   - Téléchargement direct
   - Envoi par email (futur)

---

## 📁 Fichiers Créés

### SQL

1. **sql/create_devis_system.sql**
   - Création des tables `devis` et `devis_items`
   - Fonction de génération de numéro
   - Triggers de calcul automatique
   - RLS policies

### Frontend

1. **src/pages/dashboard/prestataire/DevisPage.tsx**
   - Page principale de gestion des devis
   - Liste, filtres, stats
   - Modals de création et prévisualisation

2. **src/components/devis/DevisCreateModal.tsx** (À créer)
   - Modal de création/édition
   - Formulaire avec lignes d'articles
   - Calculs en temps réel

3. **src/components/devis/DevisPreviewModal.tsx** (À créer)
   - Prévisualisation du devis
   - Design professionnel
   - Bouton d'export PDF

4. **src/components/devis/DevisPDF.tsx** (À créer)
   - Composant de génération PDF
   - Template professionnel

---

## 🚀 Prochaines Étapes

### Phase 1: Base de Données ✅
- [x] Créer le schéma SQL
- [x] Fonctions et triggers
- [x] RLS policies

### Phase 2: Interface de Base ✅
- [x] Page principale
- [x] Liste des devis
- [x] Stats et filtres

### Phase 3: Création de Devis (En cours)
- [ ] Modal de création
- [ ] Gestion des lignes d'articles
- [ ] Calculs automatiques
- [ ] Validation et enregistrement

### Phase 4: Prévisualisation
- [ ] Modal de prévisualisation
- [ ] Design professionnel
- [ ] Affichage des détails

### Phase 5: Export PDF
- [ ] Installation de jsPDF ou react-pdf
- [ ] Template PDF professionnel
- [ ] Génération et téléchargement

### Phase 6: Fonctionnalités Avancées
- [ ] Envoi au client par email
- [ ] Notifications
- [ ] Historique des modifications
- [ ] Modèles de devis

---

## 📋 Script SQL à Exécuter

**Fichier**: `sql/create_devis_system.sql`

**Action**: Exécuter dans Supabase SQL Editor

Ce script va:
1. Créer les tables `devis` et `devis_items`
2. Créer la fonction `generate_devis_numero()`
3. Créer les triggers de calcul automatique
4. Configurer les RLS policies
5. Créer les indexes pour la performance

---

## 🎯 Résultat Final

Un système complet de gestion de devis permettant aux prestataires de:
- ✅ Créer des devis professionnels
- ✅ Gérer plusieurs états (brouillon, envoyé, accepté, etc.)
- ✅ Calculer automatiquement les montants
- ✅ Prévisualiser avant envoi
- ✅ Exporter en PDF professionnel
- ✅ Suivre l'historique des devis

---

**Système de devis professionnel en cours de développement!** 🚀

**Prochaine étape**: Compléter les modals de création et prévisualisation
