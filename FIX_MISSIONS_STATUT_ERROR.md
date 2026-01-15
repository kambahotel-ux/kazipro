# Fix: column missions.statut does not exist

## 🔍 LE PROBLÈME

Tu as l'erreur:
```
{"code": "42703", "message": "column missions.statut does not exist"}
Hint: Perhaps you meant to reference the column "missions.status".
```

**Cause**: Quelque chose dans ton code ou ta base de données essaie d'accéder à `missions.statut` (français) alors que la colonne s'appelle `missions.status` (anglais).

---

## 🎯 INCOHÉRENCE DE NOMMAGE

Ta base de données a une incohérence:
- Table `devis` → colonne `statut` (français) ✅
- Table `demandes` → colonnes `status` ET `statut` (les deux!) ⚠️
- Table `missions` → colonne `status` (anglais) ✅

---

## 🔍 DIAGNOSTIC

Exécute ce script pour trouver la source du problème:

**Fichier**: `sql/fix_missions_status_column.sql`

Ce script va afficher:
1. Les colonnes de la table `missions`
2. Les RLS policies sur `missions`
3. Les triggers sur `missions`
4. Les fonctions qui référencent `missions`

**Cherche "statut" dans les résultats** - c'est là qu'est le problème!

---

## 🔧 SOLUTIONS POSSIBLES

### Solution 1: C'est une RLS Policy

Si une policy utilise `missions.statut`:

```sql
-- Exemple de policy problématique
CREATE POLICY "example_policy" ON missions
FOR SELECT USING (statut = 'in_progress');  -- ❌ ERREUR

-- Correction
DROP POLICY "example_policy" ON missions;
CREATE POLICY "example_policy" ON missions
FOR SELECT USING (status = 'in_progress');  -- ✅ CORRECT
```

### Solution 2: C'est un Trigger/Fonction

Si une fonction utilise `missions.statut`:

```sql
-- Exemple de fonction problématique
CREATE FUNCTION example_function()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.statut = 'completed' THEN  -- ❌ ERREUR
    -- ...
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Correction
CREATE OR REPLACE FUNCTION example_function()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN  -- ✅ CORRECT
    -- ...
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### Solution 3: C'est dans le code TypeScript

Cherche dans ton code:
```typescript
// ❌ ERREUR
.eq('statut', 'in_progress')

// ✅ CORRECT
.eq('status', 'in_progress')
```

---

## 🧪 VÉRIFICATION RAPIDE

### Dans Supabase SQL Editor:

```sql
-- Vérifier que la colonne s'appelle bien "status"
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'missions' 
  AND column_name IN ('status', 'statut');

-- Résultat attendu: status (pas statut)
```

---

## 📝 CONTEXTE DE L'ERREUR

L'erreur se produit probablement quand:
1. Tu essaies d'afficher la page "Missions" (prestataire)
2. Tu essaies de créer une mission automatiquement
3. Une RLS policy s'exécute sur la table missions

**Envoie-moi**:
- Le contexte exact où l'erreur se produit (quelle page?)
- Le résultat du script `sql/fix_missions_status_column.sql`

Et je pourrai créer le script de correction exact!

---

## 🚨 NOTE IMPORTANTE

Si tu viens d'exécuter `sql/fix_missions_complete.sql`, l'erreur pourrait venir du trigger `create_mission_on_devis_accept()` qui essaie de créer une mission.

Vérifie si le trigger existe:
```sql
SELECT trigger_name, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_create_mission_on_devis_accept';
```

Si oui, vérifie la fonction associée pour voir si elle utilise `statut` au lieu de `status`.
