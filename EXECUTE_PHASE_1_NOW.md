# 🚀 EXÉCUTION PHASE 1 - Mise à Jour Base de Données

## ✅ FICHIERS CRÉÉS

Les 3 scripts SQL sont prêts:

1. ✅ `sql/upgrade_demandes_complete.sql` - Mise à jour table demandes
2. ✅ `sql/upgrade_devis_complete.sql` - Mise à jour table devis  
3. ✅ `sql/create_missing_tables.sql` - Création tables manquantes

---

## 📋 ORDRE D'EXÉCUTION

### Étape 1: Mettre à jour la table DEMANDES

**Fichier**: `sql/upgrade_demandes_complete.sql`

**Ce qui sera fait**:
- ✅ Ajouter colonnes: `profession`, `localisation`, `urgence`, `statut`, `devis_accepte_id`, `deadline`, `images`
- ✅ Mettre à jour les constraints avec nouveaux statuts
- ✅ Migrer données existantes (service→profession, location→localisation, status→statut)
- ✅ Créer indexes pour performance
- ✅ Créer fonction `accepter_devis()`
- ✅ Créer vue `opportunites_prestataires`

**Exécution**:
```bash
# Dans Supabase SQL Editor
# Copier-coller le contenu de sql/upgrade_demandes_complete.sql
# Cliquer "Run"
```

**Résultat attendu**:
```
✅ Table demandes mise à jour!
1. Colonnes ajoutées: profession, localisation, urgence, statut, devis_accepte_id, deadline, images
2. Constraints mis à jour avec nouveaux statuts
3. Données existantes migrées
4. Indexes créés pour performance
5. Fonctions utilitaires créées
6. Vue opportunites_prestataires créée
```

---

### Étape 2: Mettre à jour la table DEVIS

**Fichier**: `sql/upgrade_devis_complete.sql`

**Ce qui sera fait**:
- ✅ Ajouter colonnes: `frais_deplacement`, `delai_execution`, `delai_intervention`, `validite_devis`, `garantie`
- ✅ Ajouter `conditions_paiement` (JSONB) pour acompte et modalités
- ✅ Ajouter `visite_terrain_requise`, `frais_visite_terrain`
- ✅ Ajouter `materiaux_details` (JSONB), `photos_references`
- ✅ Ajouter `devise`, `nombre_revisions`, `devis_parent_id` (pour négociation)
- ✅ Créer fonction `creer_devis_avec_conditions()`
- ✅ Créer fonction `reviser_devis()` (pour négociation)
- ✅ Créer vue `comparaison_devis`
- ✅ Créer trigger expiration automatique

**Exécution**:
```bash
# Dans Supabase SQL Editor
# Copier-coller le contenu de sql/upgrade_devis_complete.sql
# Cliquer "Run"
```

**Résultat attendu**:
```
✅ Table devis mise à jour!
1. Colonnes ajoutées: frais_deplacement, delai_execution, etc.
2. Indexes créés pour performance
3. Fonctions créées: creer_devis_avec_conditions(), reviser_devis()
4. Vue comparaison_devis créée
5. Trigger expiration automatique créé
```

---

### Étape 3: Créer les tables manquantes

**Fichier**: `sql/create_missing_tables.sql`

**Ce qui sera fait**:
- ✅ Créer table `litiges` (gestion des litiges)
- ✅ Créer table `notifications` (centre de notifications)
- ✅ Créer table `documents` (documents prestataires)
- ✅ Créer table `favoris` (prestataires favoris)
- ✅ Créer table `conversations` (messagerie améliorée)
- ✅ Améliorer table `messages` existante
- ✅ Créer indexes, RLS policies, fonctions, triggers

**Exécution**:
```bash
# Dans Supabase SQL Editor
# Copier-coller le contenu de sql/create_missing_tables.sql
# Cliquer "Run"
```

**Résultat attendu**:
```
✅ Tables manquantes créées!
1. TABLE LITIGES: Gestion complète des litiges
2. TABLE NOTIFICATIONS: 15 types de notifications
3. TABLE DOCUMENTS: 8 types de documents
4. TABLE FAVORIS: Clients marquent prestataires favoris
5. TABLE CONVERSATIONS: Messagerie améliorée
6. Indexes créés pour performance
7. RLS policies configurées
8. Fonctions utilitaires créées
9. Triggers automatiques créés

🎉 PHASE 1 TERMINÉE!
```

---

## 🎯 VÉRIFICATION

Après exécution des 3 scripts, vérifier:

### 1. Table demandes

```sql
-- Vérifier les nouvelles colonnes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'demandes'
ORDER BY ordinal_position;

-- Tester la vue opportunites
SELECT * FROM opportunites_prestataires LIMIT 5;
```

### 2. Table devis

```sql
-- Vérifier les nouvelles colonnes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'devis'
ORDER BY ordinal_position;

-- Tester la vue comparaison
SELECT * FROM comparaison_devis LIMIT 5;
```

### 3. Nouvelles tables

```sql
-- Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('litiges', 'notifications', 'documents', 'favoris', 'conversations')
ORDER BY table_name;
```

---

## 📊 RÉSUMÉ DES CHANGEMENTS

### Tables MODIFIÉES

**demandes**:
- 7 nouvelles colonnes
- Nouveaux statuts (10 au total)
- Vue `opportunites_prestataires`
- Fonction `accepter_devis()`

**devis**:
- 13 nouvelles colonnes
- Support négociation (révisions)
- Conditions de paiement (JSONB)
- Vue `comparaison_devis`
- Fonctions `creer_devis_avec_conditions()`, `reviser_devis()`

**messages**:
- 3 nouvelles colonnes (conversation_id, type, fichier_url)
- Support images et documents

### Tables CRÉÉES

1. **litiges** - Gestion des litiges
2. **notifications** - Centre de notifications
3. **documents** - Documents prestataires
4. **favoris** - Prestataires favoris
5. **conversations** - Messagerie structurée

### Fonctionnalités AJOUTÉES

- ✅ Système de statuts complet (demandes, devis, paiements)
- ✅ Négociation de devis (révisions)
- ✅ Conditions de paiement flexibles (acompte, modalités)
- ✅ Frais de déplacement séparés
- ✅ Visite terrain
- ✅ Garanties
- ✅ Multi-devises (CDF, USD, EUR)
- ✅ Gestion des litiges
- ✅ Notifications
- ✅ Documents vérifiés
- ✅ Favoris
- ✅ Messagerie contextuelle

---

## 🚨 IMPORTANT

### Compatibilité

Les scripts sont conçus pour:
- ✅ Préserver les anciennes colonnes (service, location, status)
- ✅ Migrer automatiquement les données existantes
- ✅ Être idempotents (peuvent être exécutés plusieurs fois)
- ✅ Ne pas casser le code existant

### Code Frontend

Après exécution, le code frontend devra:
- Utiliser les nouvelles colonnes (profession, localisation, statut)
- Envoyer les deux versions pour compatibilité (temporaire)
- Utiliser les nouvelles fonctions SQL

---

## 🎯 PROCHAINES ÉTAPES

Une fois la Phase 1 terminée:

### PHASE 2: Pages Frontend (Workflow Devis)

1. **Page Opportunités** (Prestataire)
   - Liste des demandes disponibles
   - Filtres par profession/zone
   - Bouton "Soumettre un devis"

2. **Page Création Devis** (Prestataire)
   - Formulaire complet
   - Conditions de paiement
   - Calcul automatique

3. **Page Liste Devis** (Client)
   - Voir tous les devis reçus
   - Tableau comparatif
   - Bouton "Accepter"

4. **Page Détail Devis** (Client)
   - Affichage complet
   - Profil prestataire
   - Bouton "Négocier"

5. **Acceptation de Devis**
   - Mise à jour statuts
   - Création mission
   - Notifications

### PHASE 3: Paiement et Suivi

6. **Page Paiement**
7. **Page Suivi Mission** (Prestataire)
8. **Page Suivi Mission** (Client)
9. **Validation des Travaux**
10. **Système d'Avis**

---

## ✅ CHECKLIST D'EXÉCUTION

- [ ] Ouvrir Supabase Dashboard
- [ ] Aller dans SQL Editor
- [ ] Exécuter `sql/upgrade_demandes_complete.sql`
- [ ] Vérifier les messages de succès
- [ ] Exécuter `sql/upgrade_devis_complete.sql`
- [ ] Vérifier les messages de succès
- [ ] Exécuter `sql/create_missing_tables.sql`
- [ ] Vérifier les messages de succès
- [ ] Tester les vues (opportunites_prestataires, comparaison_devis)
- [ ] Vérifier que les nouvelles tables existent
- [ ] Passer à la Phase 2 (Frontend)

---

**Prêt à exécuter? Commencez par le premier script!** 🚀
