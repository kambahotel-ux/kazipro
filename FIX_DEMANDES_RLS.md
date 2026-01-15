# 🔧 Fix: Erreur RLS lors de la création de demande

## 🚨 Problème

Erreur: **"new row violates row-level security policy for table demandes"**

Status: **403 Forbidden**

---

## 🔍 Cause

Les politiques RLS (Row Level Security) de la table `demandes` empêchent les clients de créer des demandes.

---

## ✅ Solution en 2 Étapes

### ÉTAPE 1: Corriger les Politiques RLS

**Fichier**: `sql/fix_demandes_rls_insert.sql`

1. **Ouvrir Supabase Dashboard** → SQL Editor
2. **Copier tout le contenu** de `sql/fix_demandes_rls_insert.sql`
3. **Exécuter** le script
4. **Vérifier** qu'il n'y a pas d'erreur

**Ce que fait le script**:
- Supprime les anciennes policies
- Crée une policy pour permettre aux clients de créer des demandes
- Crée des policies pour voir/modifier/supprimer ses propres demandes
- Crée des policies pour les prestataires et l'admin

### ÉTAPE 2: Vérifier les Colonnes de la Table

**Fichier**: `sql/fix_demandes_columns.sql`

1. **Dans le même SQL Editor**
2. **Copier tout le contenu** de `sql/fix_demandes_columns.sql`
3. **Exécuter** le script
4. **Vérifier** que toutes les colonnes existent

**Ce que fait le script**:
- Ajoute les colonnes manquantes (titre, localisation, budget, etc.)
- Synchronise les données entre colonnes similaires
- Définit des valeurs par défaut

---

## 📋 Scripts SQL à Exécuter

### Script 1: RLS Policies

```sql
-- Permettre aux clients de créer des demandes
DROP POLICY IF EXISTS "Clients can create demandes" ON demandes;
CREATE POLICY "Clients can create demandes"
ON demandes FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- Permettre aux clients de voir leurs demandes
DROP POLICY IF EXISTS "Clients can view own demandes" ON demandes;
CREATE POLICY "Clients can view own demandes"
ON demandes FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);
```

### Script 2: Colonnes

```sql
-- Ajouter les colonnes nécessaires
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS titre TEXT;
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS localisation TEXT;
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS budget INTEGER;
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS urgence TEXT DEFAULT 'normal';
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'en_attente';
```

---

## 🧪 Test

Après avoir exécuté les scripts:

1. **Se connecter** en tant que client
2. **Aller sur** `/dashboard/client/nouvelle-demande`
3. **Remplir le formulaire**:
   - Titre: "Test de demande"
   - Description: "Ceci est un test"
   - Service: Sélectionner un service
   - Commune: Sélectionner une commune
   - Budget: Entrer un montant
4. **Soumettre** la demande
5. **Vérifier** qu'il n'y a pas d'erreur 403

---

## 🔍 Diagnostic

### Vérifier les Policies RLS

```sql
-- Voir toutes les policies de demandes
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'demandes';
```

### Vérifier les Colonnes

```sql
-- Voir toutes les colonnes de demandes
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'demandes'
ORDER BY ordinal_position;
```

### Vérifier le Profil Client

```sql
-- Vérifier que le client existe
SELECT 
  c.id,
  c.full_name,
  c.user_id,
  u.email
FROM clients c
JOIN auth.users u ON c.user_id = u.id
WHERE u.email = 'VOTRE_EMAIL';
```

Si aucun résultat, créer le profil client:

```sql
INSERT INTO clients (user_id, full_name, city, verified)
SELECT 
  id,
  email,
  'Kinshasa',
  false
FROM auth.users
WHERE email = 'VOTRE_EMAIL'
AND NOT EXISTS (SELECT 1 FROM clients WHERE user_id = auth.users.id);
```

---

## 🐛 Erreurs Courantes

### Erreur: "client_id violates foreign key constraint"

**Cause**: Le profil client n'existe pas

**Solution**: Créer le profil client (voir ci-dessus)

### Erreur: "column does not exist"

**Cause**: Une colonne utilisée dans le code n'existe pas dans la table

**Solution**: Exécuter `sql/fix_demandes_columns.sql`

### Erreur: "permission denied for table demandes"

**Cause**: RLS est activé mais aucune policy ne permet l'accès

**Solution**: Exécuter `sql/fix_demandes_rls_insert.sql`

---

## 📊 Structure de la Table demandes

### Colonnes Principales

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique |
| client_id | UUID | Référence au client |
| titre | TEXT | Titre de la demande |
| description | TEXT | Description détaillée |
| profession | TEXT | Profession recherchée |
| localisation | TEXT | Commune/Localisation |
| budget | INTEGER | Budget en FC |
| urgence | TEXT | normal, urgent, tres_urgent |
| statut | TEXT | en_attente, en_cours, terminee, annulee |
| created_at | TIMESTAMP | Date de création |

---

## ✅ Checklist de Vérification

Après avoir appliqué les corrections:

- [ ] Script RLS exécuté sans erreur
- [ ] Script colonnes exécuté sans erreur
- [ ] Profil client existe
- [ ] Policies RLS visibles dans pg_policies
- [ ] Colonnes nécessaires présentes
- [ ] Test de création de demande réussi
- [ ] Demande visible dans la liste
- [ ] Pas d'erreur 403

---

## 🚀 Résultat Attendu

Après avoir appliqué les corrections:

- ✅ Les clients peuvent créer des demandes
- ✅ Les clients voient leurs propres demandes
- ✅ Les prestataires voient les demandes de leur profession
- ✅ L'admin voit toutes les demandes
- ✅ Pas d'erreur RLS

---

## 📝 Fichiers Modifiés

1. **sql/fix_demandes_rls_insert.sql** - Politiques RLS
2. **sql/fix_demandes_columns.sql** - Structure de la table
3. **src/pages/dashboard/client/NouvelleDemandePages.tsx** - Code mis à jour

---

**Exécutez les 2 scripts SQL et testez la création de demande!** 🎉
