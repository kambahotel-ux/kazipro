# ⚡ EXÉCUTER LA MISE À JOUR DU SYSTÈME DE DEVIS

## 🎯 Fichier à Exécuter

**Fichier**: `sql/upgrade_devis_simple.sql`

Ce script va:
- ✅ Ajouter les colonnes nécessaires à la table `devis` existante
- ✅ Créer la table `devis_items` pour les lignes d'articles
- ✅ Créer les fonctions et triggers
- ✅ Configurer les RLS policies
- ✅ Migrer les données existantes

---

## 📋 ÉTAPES D'EXÉCUTION

### 1. Ouvrir Supabase Dashboard

1. Aller sur: https://supabase.com/dashboard
2. Sélectionner votre projet KaziPro
3. Cliquer sur "SQL Editor" dans le menu latéral

### 2. Copier le Script

1. Ouvrir le fichier `sql/upgrade_devis_simple.sql`
2. Sélectionner tout le contenu (Ctrl+A)
3. Copier (Ctrl+C)

### 3. Exécuter le Script

1. Dans SQL Editor, coller le script (Ctrl+V)
2. Cliquer sur "Run" ou appuyer sur Ctrl+Enter
3. Attendre la fin de l'exécution

### 4. Vérifier le Succès

Exécuter cette requête pour vérifier:

```sql
-- Vérifier que les colonnes existent
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'devis' 
  AND column_name IN ('numero', 'titre', 'statut', 'montant_ht', 'montant_ttc');

-- Vérifier que la table devis_items existe
SELECT * FROM devis_items LIMIT 1;

-- Vérifier que la fonction existe
SELECT generate_devis_numero();
```

Si tout fonctionne, vous devriez voir:
- ✅ 5 colonnes listées pour devis
- ✅ Table devis_items accessible (même vide)
- ✅ Un numéro généré (ex: DEV-2026-0001)

---

## 🧪 TESTER L'INTERFACE

### 1. Accéder à la Page Devis

- URL: http://localhost:8080/dashboard/prestataire/devis
- Ou cliquer sur "Devis" dans le menu prestataire

### 2. Créer un Devis Test

**Cliquer sur "Nouveau devis"**

Remplir:
```
Titre: Test système de devis
Description: Premier test du nouveau système

Lignes:
1. Service test | 1 | unité | 10000 | = 10,000 FC
2. Main d'œuvre | 2 | heure | 2000 | = 4,000 FC

Total HT: 14,000 FC
TVA (16%): 2,240 FC
Total TTC: 16,240 FC
```

**Cliquer "Enregistrer brouillon"**

### 3. Vérifier le Résultat

- ✅ Le devis apparaît dans la liste
- ✅ Statut "Brouillon" (badge gris)
- ✅ Numéro généré: DEV-2026-0001
- ✅ Montants corrects affichés

### 4. Tester la Prévisualisation

- Cliquer sur "Voir"
- ✅ Modal s'ouvre avec design professionnel
- ✅ Toutes les informations affichées
- ✅ Tableau des articles visible
- ✅ Totaux corrects

---

## 🐛 EN CAS D'ERREUR

### Erreur: "column already exists"

**C'est normal!** Le script utilise `IF NOT EXISTS`, donc il ignore les colonnes déjà présentes.

### Erreur: "relation devis_items already exists"

**C'est normal!** Le script utilise `IF NOT EXISTS`, donc il ignore la table si elle existe déjà.

### Erreur: "syntax error"

**Solution**: Assurez-vous de copier tout le contenu du fichier `sql/upgrade_devis_simple.sql` (pas `sql/upgrade_devis_system.sql`)

### Erreur: "permission denied"

**Solution**: Vérifiez que vous êtes connecté avec les bons droits dans Supabase Dashboard

---

## 📊 VÉRIFICATIONS DANS LA BASE DE DONNÉES

### Voir la structure de la table devis

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'devis'
ORDER BY ordinal_position;
```

### Voir les devis existants

```sql
SELECT 
  id,
  numero,
  titre,
  statut,
  montant_ht,
  montant_ttc,
  created_at
FROM devis
ORDER BY created_at DESC
LIMIT 10;
```

### Voir les items d'un devis

```sql
SELECT 
  designation,
  quantite,
  unite,
  prix_unitaire,
  montant
FROM devis_items
WHERE devis_id = 'VOTRE_DEVIS_ID'
ORDER BY ordre;
```

### Tester la génération de numéro

```sql
SELECT generate_devis_numero();
-- Devrait retourner: DEV-2026-0001 (ou suivant)
```

---

## ✅ CHECKLIST DE VALIDATION

Après l'exécution du script:

- [ ] Script exécuté sans erreur
- [ ] Colonnes ajoutées à la table `devis`
- [ ] Table `devis_items` créée
- [ ] Fonction `generate_devis_numero()` existe
- [ ] Fonction `calculate_devis_montants()` existe
- [ ] Fonction `change_devis_statut()` existe
- [ ] Triggers créés
- [ ] RLS policies configurées
- [ ] Page `/dashboard/prestataire/devis` accessible
- [ ] Création de devis fonctionne
- [ ] Prévisualisation fonctionne
- [ ] Calculs automatiques corrects

---

## 🎉 RÉSULTAT ATTENDU

Après avoir exécuté le script, vous aurez:

✅ **Table devis étendue** avec toutes les colonnes nécessaires
✅ **Table devis_items** pour les lignes d'articles
✅ **Fonctions automatiques** pour numérotation et calculs
✅ **Triggers** pour recalcul automatique
✅ **RLS policies** pour sécurité
✅ **Interface complète** pour gérer les devis

---

## 📝 NOTES IMPORTANTES

### Colonnes Préservées

Les anciennes colonnes sont préservées:
- `amount` → Toujours présente (pour compatibilité)
- `status` → Toujours présente (pour compatibilité)
- `description` → Toujours présente

### Nouvelles Colonnes

Utilisez les nouvelles colonnes:
- `montant_ttc` au lieu de `amount`
- `statut` au lieu de `status`
- `titre` pour le titre du devis
- `montant_ht` pour le montant hors taxes

### Migration Automatique

Le script migre automatiquement les données existantes:
- `amount` → `montant_ttc`
- `status` → `statut` (pending→envoye, accepted→accepte, rejected→refuse)

---

## 🚀 PROCHAINES ÉTAPES

Une fois le script exécuté et testé:

1. **Créer plusieurs devis** pour tester toutes les fonctionnalités
2. **Tester les filtres** et la recherche
3. **Tester la duplication** de devis
4. **Vérifier les calculs** automatiques
5. **Tester les différents états** (brouillon, envoyé, etc.)

---

**COMMENCEZ MAINTENANT!** ⚡

Exécutez `sql/upgrade_devis_simple.sql` dans Supabase SQL Editor
