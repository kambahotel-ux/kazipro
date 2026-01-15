# 🔧 FIX: Erreur Contrainte Statut Devis

## 🐛 ERREUR

```json
{
  "code": "23514",
  "details": null,
  "hint": null,
  "message": "new row for relation \"devis\" violates check constraint \"devis_statut_check\""
}
```

## 🔍 CAUSE

La contrainte `devis_statut_check` dans la table `devis` n'accepte pas la valeur `'en_attente'` que nous essayons d'insérer.

**Valeurs actuellement acceptées** (probablement):
- `'pending'`
- `'accepted'`
- `'rejected'`
- `'expired'`

**Valeurs que nous utilisons** (nouveau système):
- `'en_attente'` ❌ Non accepté
- `'envoye'`
- `'accepte'`
- `'refuse'`
- `'expire'`

## ✅ SOLUTION

Mettre à jour la contrainte pour accepter **les deux systèmes** (ancien et nouveau) pour assurer la compatibilité.

### Script SQL à exécuter

**Fichier**: `sql/fix_devis_statut_constraint.sql`

```sql
-- Drop existing constraint
ALTER TABLE devis DROP CONSTRAINT IF EXISTS devis_statut_check;

-- Add new constraint with all possible values
ALTER TABLE devis ADD CONSTRAINT devis_statut_check 
  CHECK (statut IN (
    'en_attente',      -- Nouveau système
    'envoye',          -- Nouveau système
    'accepte',         -- Nouveau système
    'refuse',          -- Nouveau système
    'expire',          -- Nouveau système
    'negocie',         -- Nouveau système
    'pending',         -- Ancien système (compatibilité)
    'accepted',        -- Ancien système (compatibilité)
    'rejected',        -- Ancien système (compatibilité)
    'expired'          -- Ancien système (compatibilité)
  ));
```

## 📋 ÉTAPES À SUIVRE

### 1. Exécuter le script SQL

**Dans Supabase Dashboard**:
1. Aller dans **SQL Editor**
2. Ouvrir le fichier `sql/fix_devis_statut_constraint.sql`
3. Copier tout le contenu
4. Coller dans l'éditeur SQL
5. Cliquer **Run**

### 2. Vérifier la contrainte

```sql
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'devis'::regclass
  AND (conname LIKE '%statut%' OR conname LIKE '%status%');
```

**Résultat attendu**:
```
constraint_name: devis_statut_check
constraint_definition: CHECK (statut IN ('en_attente', 'envoye', 'accepte', ...))
```

### 3. Tester la soumission de devis

1. Retourner sur l'application
2. Créer un nouveau devis
3. Soumettre
4. ✅ Devrait fonctionner maintenant

## 🎯 VALEURS DE STATUT

### Nouveau système (français)

| Statut | Description |
|--------|-------------|
| `en_attente` | Devis soumis, en attente de réponse du client |
| `envoye` | Devis envoyé au client |
| `accepte` | Devis accepté par le client |
| `refuse` | Devis refusé par le client |
| `expire` | Devis expiré (date de validité dépassée) |
| `negocie` | Devis en cours de négociation |

### Ancien système (anglais) - Compatibilité

| Status | Description |
|--------|-------------|
| `pending` | En attente |
| `accepted` | Accepté |
| `rejected` | Refusé |
| `expired` | Expiré |
| `negotiating` | En négociation |

## 🔄 MAPPING STATUT/STATUS

Le code utilise les deux colonnes pour compatibilité:

```typescript
{
  statut: 'en_attente',  // Nouveau système
  status: 'pending',     // Ancien système
}
```

**Correspondances**:
- `en_attente` ↔ `pending`
- `envoye` ↔ `pending`
- `accepte` ↔ `accepted`
- `refuse` ↔ `rejected`
- `expire` ↔ `expired`
- `negocie` ↔ `negotiating`

## 🧪 TEST APRÈS FIX

### Test 1: Créer un devis simple

```typescript
// Données minimales
{
  demande_id: 'xxx',
  prestataire_id: 'yyy',
  montant_ttc: 100000,
  devise: 'CDF',
  statut: 'en_attente',  // ✅ Devrait fonctionner
  status: 'pending'
}
```

### Test 2: Vérifier en base de données

```sql
SELECT id, statut, status, created_at
FROM devis
ORDER BY created_at DESC
LIMIT 5;
```

**Résultat attendu**:
```
id | statut      | status  | created_at
---|-------------|---------|------------
1  | en_attente  | pending | 2024-01-04
```

## 📝 ALTERNATIVE: Utiliser uniquement 'pending'

Si vous préférez utiliser l'ancien système en attendant:

**Dans CreerDevisPage.tsx**:
```typescript
// AVANT
statut: 'en_attente',
status: 'pending',

// APRÈS (temporaire)
statut: 'pending',
status: 'pending',
```

Mais la **meilleure solution** est d'exécuter le script SQL pour accepter les deux systèmes.

## ✅ RÉSULTAT ATTENDU

Après avoir exécuté le script SQL:
- ✅ La contrainte accepte `'en_attente'`
- ✅ La contrainte accepte aussi `'pending'` (compatibilité)
- ✅ La soumission de devis fonctionne
- ✅ Pas besoin de modifier le code

## 🚨 SI LE PROBLÈME PERSISTE

Vérifier quelle contrainte existe actuellement:

```sql
-- Voir la définition actuelle
SELECT pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'devis_statut_check';
```

Si la contrainte n'existe pas, la créer:

```sql
ALTER TABLE devis ADD CONSTRAINT devis_statut_check 
  CHECK (statut IN ('en_attente', 'envoye', 'accepte', 'refuse', 'expire', 'negocie', 'pending', 'accepted', 'rejected', 'expired'));
```

Si elle existe mais est différente, la supprimer puis la recréer:

```sql
ALTER TABLE devis DROP CONSTRAINT devis_statut_check;
ALTER TABLE devis ADD CONSTRAINT devis_statut_check 
  CHECK (statut IN ('en_attente', 'envoye', 'accepte', 'refuse', 'expire', 'negocie', 'pending', 'accepted', 'rejected', 'expired'));
```
