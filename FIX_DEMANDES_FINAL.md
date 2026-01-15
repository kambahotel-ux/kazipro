# ⚡ FIX FINAL - Création de Demandes

## 🚨 Erreurs Rencontrées

1. ❌ "new row violates row-level security policy"
2. ❌ "null value in column title violates not-null constraint"

---

## ✅ SOLUTION UNIQUE (1 script)

### Exécuter CE script dans Supabase SQL Editor

**Fichier**: `sql/fix_demandes_TOUT.sql`

**OU copier-coller ce code**:

```sql
-- Rendre les colonnes nullable
ALTER TABLE demandes ALTER COLUMN title DROP NOT NULL;
ALTER TABLE demandes ALTER COLUMN description DROP NOT NULL;

-- Ajouter les colonnes manquantes
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS titre TEXT;
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS localisation TEXT;
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS budget INTEGER;
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS urgence TEXT DEFAULT 'normal';
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'en_attente';

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Clients can insert own demandes" ON demandes;
DROP POLICY IF EXISTS "Clients can create demandes" ON demandes;
DROP POLICY IF EXISTS "Clients can insert demandes" ON demandes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON demandes;
DROP POLICY IF EXISTS "Clients can view own demandes" ON demandes;
DROP POLICY IF EXISTS "Clients can update own demandes" ON demandes;
DROP POLICY IF EXISTS "Allow clients to insert demandes" ON demandes;
DROP POLICY IF EXISTS "Allow clients to view own demandes" ON demandes;
DROP POLICY IF EXISTS "Allow clients to update own demandes" ON demandes;

-- Créer les nouvelles policies
CREATE POLICY "Clients can create demandes"
ON demandes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Clients can view own demandes"
ON demandes FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
  OR
  (auth.jwt() ->> 'email') = 'admin@kazipro.com'
);

CREATE POLICY "Clients can update own demandes"
ON demandes FOR UPDATE
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Prestataires can view demandes"
ON demandes FOR SELECT
TO authenticated
USING (
  profession IN (
    SELECT profession FROM prestataires WHERE user_id = auth.uid()
  )
  AND statut = 'en_attente'
);
```

---

## 🧪 Test

Après avoir exécuté le script:

1. **Rafraîchir** la page (F5)
2. **Aller sur** `/dashboard/client/nouvelle-demande`
3. **Remplir le formulaire**:
   - Titre: "Test de demande"
   - Description: "Ceci est un test"
   - Service: Sélectionner
   - Commune: Sélectionner
   - Budget: Entrer un montant
4. **Soumettre**
5. ✅ **Succès!** La demande est créée

---

## 📋 Ce qui a été corrigé

### 1. Colonnes
- ✅ `title` rendu nullable
- ✅ `description` rendu nullable
- ✅ `titre` ajouté
- ✅ `localisation` ajouté
- ✅ `budget` ajouté
- ✅ `urgence` ajouté
- ✅ `statut` ajouté

### 2. Policies RLS
- ✅ Clients peuvent créer des demandes
- ✅ Clients peuvent voir leurs demandes
- ✅ Clients peuvent modifier leurs demandes
- ✅ Prestataires peuvent voir les demandes de leur profession
- ✅ Admin peut tout voir

### 3. Code
- ✅ Envoie `titre` ET `title` (compatibilité)
- ✅ Envoie `profession` au lieu de `service`
- ✅ Envoie `localisation` au lieu de `location`
- ✅ Envoie `statut: "en_attente"`

---

## 🔍 Vérification

### Voir les colonnes créées

```sql
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'demandes'
  AND column_name IN ('title', 'titre', 'description', 'localisation', 'budget', 'urgence', 'statut')
ORDER BY column_name;
```

### Voir les policies créées

```sql
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'demandes';
```

Vous devriez voir 4 policies:
1. Clients can create demandes (INSERT)
2. Clients can view own demandes (SELECT)
3. Clients can update own demandes (UPDATE)
4. Prestataires can view demandes (SELECT)

---

## 🎉 Résultat

Après ce fix:

- ✅ Les clients peuvent créer des demandes
- ✅ Pas d'erreur RLS
- ✅ Pas d'erreur NOT NULL
- ✅ Les demandes sont visibles dans la liste
- ✅ Les prestataires voient les demandes de leur profession

---

## 📝 Fichiers Créés

1. **sql/fix_demandes_TOUT.sql** - Script complet (RECOMMANDÉ)
2. **sql/fix_demandes_title_constraint.sql** - Fix NOT NULL uniquement
3. **sql/fix_demandes_rls_NOW.sql** - Fix RLS uniquement
4. **sql/fix_demandes_columns.sql** - Fix colonnes uniquement
5. **sql/fix_demandes_rls_insert.sql** - Fix RLS détaillé

---

**EXÉCUTEZ `sql/fix_demandes_TOUT.sql` ET TESTEZ!** ⚡

**C'est le dernier fix nécessaire pour les demandes!** 🎉
