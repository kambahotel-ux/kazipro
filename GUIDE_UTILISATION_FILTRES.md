# 📖 Guide d'Utilisation des Filtres

## 🎯 Vue d'Ensemble

Les filtres avancés ont été ajoutés sur 5 pages principales pour faciliter la recherche et l'analyse des données.

## 📍 Où Trouver les Filtres

### 1. Admin - Gestion des Prestataires
**URL**: `/dashboard/admin/providers`

**Filtres disponibles:**
- 🔍 **Recherche**: Nom ou email du prestataire
- 👔 **Profession**: Sélectionner une profession spécifique
- ✅ **Statut**: Vérifié / Non vérifié / Tous
- 🏙️ **Ville**: Filtrer par localisation
- 📅 **Dates**: Période d'inscription

**Cas d'usage:**
- Trouver tous les électriciens vérifiés à Kinshasa
- Voir les nouveaux prestataires inscrits ce mois
- Chercher un prestataire par nom

### 2. Admin - Modération des Demandes
**URL**: `/dashboard/admin/requests`

**Filtres disponibles:**
- 🔍 **Recherche**: Titre ou description
- 🛠️ **Service**: Type de service demandé
- ⚡ **Urgence**: Normal / Urgent / Très urgent
- 📊 **Statut**: Active / Complétée / Annulée
- 📅 **Dates**: Période de création

**Cas d'usage:**
- Voir toutes les demandes urgentes en attente
- Filtrer les demandes de plomberie du mois dernier
- Trouver une demande spécifique

### 3. Admin - Gestion des Devis
**URL**: `/dashboard/admin/devis`

**Filtres disponibles:**
- 🔍 **Recherche**: Titre, numéro ou prestataire
- 📊 **Statut**: Brouillon / Envoyé / Accepté / Refusé / Expiré
- 💱 **Devise**: FC / USD / EUR / etc.
- 💰 **Montant min**: Montant minimum
- 💰 **Montant max**: Montant maximum
- 📅 **Dates**: Période de création

**Cas d'usage:**
- Voir tous les devis acceptés en USD
- Filtrer les devis entre 1000 et 5000 FC
- Analyser les devis du trimestre

### 4. Client - Mes Demandes
**URL**: `/dashboard/client/demandes`

**Filtres disponibles:**
- 🔍 **Recherche**: Titre ou description
- 🛠️ **Service**: Type de service
- 📊 **Statut**: Active / Complétée / Annulée
- 📅 **Dates**: Période de création

**Cas d'usage:**
- Retrouver une demande spécifique
- Voir toutes les demandes actives
- Consulter l'historique des demandes

### 5. Prestataire - Mes Devis
**URL**: `/dashboard/prestataire/devis`

**Filtres disponibles:**
- 🔍 **Recherche**: Titre ou numéro
- 📊 **Statut**: Brouillon / Envoyé / Accepté / Refusé / Expiré
- 💱 **Devise**: FC / USD / EUR / etc.
- 📅 **Dates**: Période de création

**Cas d'usage:**
- Retrouver un devis par numéro
- Voir tous les devis acceptés
- Filtrer les brouillons à finaliser

## 🎨 Interface des Filtres

### Zone de Filtres
```
┌─────────────────────────────────────────────────────────┐
│  🔍 Recherche...    │ Profession ▼  │ Statut ▼  │ Ville │
├─────────────────────────────────────────────────────────┤
│  📅 Période: [Du: __/__/__] [Au: __/__/__]             │
├─────────────────────────────────────────────────────────┤
│  📊 42 résultat(s)              [✕ Réinitialiser]       │
└─────────────────────────────────────────────────────────┘
```

### Éléments Visuels
- **Champs de recherche**: Icône loupe à gauche
- **Dropdowns**: Flèche vers le bas
- **Dates**: Deux champs côte à côte avec icône calendrier
- **Badge de résultats**: Affiche le nombre de résultats
- **Bouton reset**: Visible uniquement si des filtres sont actifs

## 📝 Comment Utiliser

### 1. Recherche Textuelle
1. Cliquer dans le champ de recherche
2. Taper le texte recherché
3. Les résultats se filtrent automatiquement

**Exemple**: Taper "Jean" pour trouver tous les prestataires nommés Jean

### 2. Filtres par Dropdown
1. Cliquer sur le dropdown (ex: Profession)
2. Sélectionner une option
3. Les résultats se mettent à jour

**Exemple**: Sélectionner "Électricien" pour voir uniquement les électriciens

### 3. Filtres par Dates
1. Cliquer sur le champ "Du"
2. Sélectionner la date de début
3. Cliquer sur le champ "Au"
4. Sélectionner la date de fin
5. Les résultats se filtrent automatiquement

**Exemple**: Du 01/01/2026 au 31/01/2026 pour voir les données de janvier

### 4. Combiner Plusieurs Filtres
Vous pouvez utiliser plusieurs filtres en même temps:

**Exemple**:
- Recherche: "plomberie"
- Statut: "Active"
- Dates: Du 01/12/2025 au 31/12/2025

→ Affiche toutes les demandes actives de plomberie de décembre 2025

### 5. Réinitialiser les Filtres
1. Cliquer sur le bouton "✕ Réinitialiser les filtres"
2. Tous les filtres reviennent à leur valeur par défaut
3. Toutes les données sont affichées

## 💡 Astuces

### Recherche Efficace
- La recherche n'est **pas sensible à la casse** (majuscules/minuscules)
- Vous pouvez chercher par **mots partiels** (ex: "élec" trouve "électricien")
- La recherche fonctionne sur **plusieurs champs** (nom, email, titre, etc.)

### Filtres de Dates
- **Date de début seule**: Affiche tout depuis cette date
- **Date de fin seule**: Affiche tout jusqu'à cette date
- **Les deux dates**: Affiche la période exacte
- La date de fin **inclut toute la journée** (jusqu'à 23:59:59)

### Montants (Admin Devis)
- **Montant min seul**: Affiche tout au-dessus de ce montant
- **Montant max seul**: Affiche tout en-dessous de ce montant
- **Les deux**: Affiche la fourchette exacte

### Dropdowns Dynamiques
Les options des dropdowns sont générées automatiquement:
- **Professions**: Liste des professions existantes dans la base
- **Services**: Liste des services existants
- **Devises**: Liste des devises utilisées

## 📊 Statistiques Dynamiques

Les cartes de statistiques en haut de chaque page s'adaptent automatiquement:

**Sans filtres:**
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Total: 42  │  │ Actifs: 15   │  │ Complétés: 8 │
│ Tous statuts │  │  En cours    │  │    Total     │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Avec filtres:**
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Total: 12  │  │  Actifs: 8   │  │ Complétés: 2 │
│   Filtrés    │  │  En cours    │  │    Total     │
└──────────────┘  └──────────────┘  └──────────────┘
```

## 🎯 Cas d'Usage Pratiques

### Pour les Administrateurs

**Vérifier les nouveaux prestataires:**
1. Aller sur Admin > Prestataires
2. Statut: "Non vérifié"
3. Dates: Dernière semaine
→ Liste des prestataires à vérifier

**Analyser les devis du mois:**
1. Aller sur Admin > Devis
2. Dates: 01/01/2026 au 31/01/2026
3. Statut: "Accepté"
→ Voir le chiffre d'affaires du mois

**Modérer les demandes urgentes:**
1. Aller sur Admin > Demandes
2. Urgence: "Très urgent"
3. Statut: "Active"
→ Traiter les demandes prioritaires

### Pour les Clients

**Retrouver une demande:**
1. Aller sur Mes Demandes
2. Recherche: Taper un mot-clé
→ Trouver rapidement la demande

**Voir l'historique:**
1. Aller sur Mes Demandes
2. Dates: Sélectionner une période
3. Statut: "Complétée"
→ Consulter les anciennes demandes

### Pour les Prestataires

**Gérer les brouillons:**
1. Aller sur Mes Devis
2. Statut: "Brouillon"
→ Finaliser les devis en attente

**Suivre les devis acceptés:**
1. Aller sur Mes Devis
2. Statut: "Accepté"
3. Dates: Ce mois
→ Voir les missions à réaliser

**Analyser le chiffre d'affaires:**
1. Aller sur Mes Devis
2. Statut: "Accepté"
3. Devise: "USD"
4. Dates: Trimestre
→ Calculer les revenus

## 🔄 Comportement des Filtres

### Filtrage en Temps Réel
- Les résultats se mettent à jour **instantanément**
- Pas besoin de cliquer sur un bouton "Rechercher"
- Les stats se recalculent automatiquement

### Persistance
- Les filtres restent actifs pendant la navigation sur la page
- Ils se réinitialisent si vous quittez la page
- Le bouton "Réinitialiser" permet de tout effacer rapidement

### Performance
- Utilisation de `useMemo` pour optimiser le rendu
- Pas de ralentissement même avec beaucoup de données
- Filtrage côté client pour une réponse instantanée

## ❓ Questions Fréquentes

**Q: Pourquoi le bouton "Réinitialiser" n'apparaît pas?**
R: Il n'apparaît que si au moins un filtre est actif.

**Q: Puis-je combiner tous les filtres?**
R: Oui, tous les filtres peuvent être utilisés ensemble.

**Q: Les filtres affectent-ils les stats?**
R: Oui, les statistiques se basent sur les données filtrées.

**Q: Comment voir toutes les données?**
R: Cliquez sur "Réinitialiser les filtres" ou laissez tous les filtres vides.

**Q: La recherche est-elle sensible aux accents?**
R: Non, la recherche ignore les majuscules et minuscules.

**Q: Puis-je filtrer par plusieurs professions?**
R: Non, un seul choix à la fois. Utilisez "Tous" pour voir toutes les professions.

## 🎓 Exemples Complets

### Exemple 1: Trouver un Électricien Vérifié à Kinshasa
```
Page: Admin > Prestataires
Filtres:
  - Profession: Électricien
  - Statut: Vérifié
  - Ville: Kinshasa
Résultat: Liste des électriciens vérifiés à Kinshasa
```

### Exemple 2: Analyser les Devis Acceptés en USD du Mois
```
Page: Admin > Devis
Filtres:
  - Statut: Accepté
  - Devise: USD
  - Dates: 01/01/2026 au 31/01/2026
Résultat: Tous les devis acceptés en USD de janvier
```

### Exemple 3: Voir les Demandes Urgentes de Plomberie
```
Page: Admin > Demandes
Filtres:
  - Service: Plomberie
  - Urgence: Très urgent
  - Statut: Active
Résultat: Demandes urgentes de plomberie à traiter
```

---

**Besoin d'aide?** Contactez le support technique.
