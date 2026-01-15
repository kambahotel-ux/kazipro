# Correction - Items de Devis Non Sauvegardés

## 🎯 Problème Identifié

**Symptôme:** Les items ajoutés lors de la création d'un devis ne sont pas sauvegardés dans la base de données.

**Requête retourne:** `[]` (tableau vide)
```
GET /devis_pro_items?devis_id=eq.5e7cd3da-cb0a-4cdc-b843-8d1851879b9e
Response: []
```

**Cause probable:** Les politiques RLS (Row Level Security) bloquent l'insertion des items.

## 🔍 Diagnostic

### Vérifier si les items sont bloqués par RLS

```sql
-- Dans Supabase SQL Editor
-- Vérifier les politiques actuelles
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies
WHERE tablename = 'devis_pro_items'
ORDER BY cmd, policyname;
```

### Vérifier si RLS est activé

```sql
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'devis_pro_items';
```

### Tester l'insertion manuelle

```sql
-- Essayer d'insérer un item de test
INSERT INTO devis_pro_items (
  devis_id,
  designation,
  quantite,
  unite,
  prix_unitaire,
  montant
) VALUES (
  '5e7cd3da-cb0a-4cdc-b843-8d1851879b9e',
  'Test item',
  1,
  'unité',
  100,
  100
);

-- Si erreur "new row violates row-level security policy"
-- → Les politiques RLS bloquent l'insertion
```

## ✅ Solution

### Script SQL: `sql/fix_devis_items_insert.sql`

Ce script:
1. ✅ Supprime toutes les politiques RLS existantes
2. ✅ Crée des politiques simplifiées et plus permissives
3. ✅ Permet aux prestataires d'insérer des items pour leurs devis
4. ✅ Permet aux clients de voir les items des devis reçus
5. ✅ Permet à l'admin de tout voir

### Politiques RLS Corrigées

#### INSERT (Prestataires)
```sql
-- Permet l'insertion si le devis appartient au prestataire
CREATE POLICY "Prestataires can insert their own devis items"
ON devis_pro_items FOR INSERT
WITH CHECK (
  devis_id IN (
    SELECT d.id FROM devis d
    INNER JOIN prestataires p ON p.id = d.prestataire_id
    WHERE p.user_id = auth.uid()
  )
);
```

#### SELECT (Prestataires)
```sql
-- Permet de voir les items de ses propres devis
CREATE POLICY "Prestataires can view their own devis items"
ON devis_pro_items FOR SELECT
USING (
  devis_id IN (
    SELECT d.id FROM devis d
    INNER JOIN prestataires p ON p.id = d.prestataire_id
    WHERE p.user_id = auth.uid()
  )
);
```

#### SELECT (Clients)
```sql
-- Permet aux clients de voir les items des devis reçus
CREATE POLICY "Clients can view devis items"
ON devis_pro_items FOR SELECT
USING (
  devis_id IN (
    SELECT d.id FROM devis d
    INNER JOIN demandes dm ON dm.id = d.demande_id
    INNER JOIN clients c ON c.id = dm.client_id
    WHERE c.user_id = auth.uid()
  )
);
```

## 🔧 Différences avec l'Ancienne Version

### Avant (Problématique)
```sql
-- Utilisait EXISTS avec sous-requête complexe
WITH CHECK (
  EXISTS (
    SELECT 1 FROM devis
    WHERE devis.id = devis_pro_items.devis_id  -- ❌ Peut échouer
    AND devis.prestataire_id IN (...)
  )
);
```

### Après (Corrigé)
```sql
-- Utilise IN avec JOIN direct
WITH CHECK (
  devis_id IN (
    SELECT d.id FROM devis d
    INNER JOIN prestataires p ON p.id = d.prestataire_id
    WHERE p.user_id = auth.uid()
  )
);
```

## 📋 Étapes de Correction

### 1. Exécuter le Script SQL
```bash
# Dans Supabase SQL Editor
sql/fix_devis_items_insert.sql
```

### 2. Vérifier les Politiques
```sql
-- Vérifier que les politiques sont créées
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'devis_pro_items'
ORDER BY cmd, policyname;

-- Résultat attendu:
-- policyname                                    | cmd
-- ---------------------------------------------+--------
-- Prestataires can delete their own devis items | DELETE
-- Prestataires can insert their own devis items | INSERT
-- Admin can view all devis items                | SELECT
-- Clients can view devis items                  | SELECT
-- Prestataires can view their own devis items   | SELECT
-- Prestataires can update their own devis items | UPDATE
```

### 3. Tester la Création d'un Devis
1. Connectez-vous en tant que prestataire
2. Créez un nouveau devis avec des items
3. Vérifiez que les items apparaissent dans la liste

### 4. Vérifier dans la Base de Données
```sql
-- Compter les items par devis
SELECT 
  d.numero,
  d.titre,
  COUNT(i.id) as nombre_items
FROM devis d
LEFT JOIN devis_pro_items i ON i.devis_id = d.id
GROUP BY d.id, d.numero, d.titre
ORDER BY d.created_at DESC
LIMIT 10;
```

## 🐛 Problèmes Potentiels

### Problème 1: Items toujours pas sauvegardés
**Cause:** Erreur JavaScript dans le code
**Solution:** Vérifier la console du navigateur pour les erreurs

### Problème 2: Erreur "permission denied"
**Cause:** L'utilisateur n'a pas de profil prestataire
**Solution:** Vérifier que l'utilisateur a un enregistrement dans la table `prestataires`

```sql
-- Vérifier le profil prestataire
SELECT p.id, p.full_name, p.user_id
FROM prestataires p
WHERE p.user_id = auth.uid();
```

### Problème 3: Items visibles pour le prestataire mais pas pour le client
**Cause:** Politique SELECT pour les clients mal configurée
**Solution:** Le script corrige aussi cette politique

## ✅ Checklist de Test

- [ ] Exécuter `sql/fix_devis_items_insert.sql`
- [ ] Créer un nouveau devis avec 2-3 items
- [ ] Vérifier que les items s'affichent dans "Mes Devis"
- [ ] Vérifier que les items s'affichent dans le modal de détails
- [ ] Se connecter en tant que client
- [ ] Vérifier que les items du devis sont visibles
- [ ] Vérifier qu'aucune erreur n'apparaît dans la console

## 📊 Vérification Post-Correction

```sql
-- Statistiques des items
SELECT 
  'Total devis' as metric,
  COUNT(*) as value
FROM devis
UNION ALL
SELECT 
  'Devis avec items' as metric,
  COUNT(DISTINCT devis_id) as value
FROM devis_pro_items
UNION ALL
SELECT 
  'Total items' as metric,
  COUNT(*) as value
FROM devis_pro_items
UNION ALL
SELECT 
  'Moyenne items par devis' as metric,
  ROUND(AVG(item_count), 2) as value
FROM (
  SELECT devis_id, COUNT(*) as item_count
  FROM devis_pro_items
  GROUP BY devis_id
) subquery;
```

## 🎯 Résultat Attendu

Après correction:
- ✅ Les items sont sauvegardés lors de la création du devis
- ✅ Les items s'affichent dans la liste des devis du prestataire
- ✅ Les items s'affichent dans les détails du devis
- ✅ Les clients peuvent voir les items des devis reçus
- ✅ L'admin peut voir tous les items

## 📄 Fichiers Créés

- `sql/fix_devis_items_insert.sql` - Script de correction des politiques RLS

## ✅ Status

**CORRECTION PRÊTE** - Exécuter `sql/fix_devis_items_insert.sql` pour résoudre le problème.
