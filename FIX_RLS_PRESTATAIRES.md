# 🔒 Fix: RLS Policy Error - Prestataires

## ❌ Erreur Rencontrée

```
{"code": "42501","details": null,"hint": null,"message": "new row violates row-level security policy for table \"prestataires\""}
Status Code: 401 Unauthorized
```

## 🔍 Cause

Les policies RLS (Row Level Security) sur la table `prestataires` empêchent les utilisateurs de créer leur propre profil lors de l'inscription.

---

## ✅ Solution Rapide

### Exécuter le Script SQL

1. Ouvrez **Supabase Dashboard** → **SQL Editor**
2. Copiez et collez ce code:

```sql
-- Permettre aux utilisateurs de créer leur propre profil prestataire
DROP POLICY IF EXISTS "Users can insert their own prestataire profile" ON public.prestataires;
DROP POLICY IF EXISTS "Authenticated users can create prestataire profile" ON public.prestataires;

CREATE POLICY "Users can create their own prestataire profile"
  ON public.prestataires
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

3. Cliquez sur **Run**
4. ✅ La policy est maintenant créée

### OU Utiliser le Script Fourni

1. Ouvrez **SQL Editor** dans Supabase
2. Ouvrez le fichier `sql/fix_prestataires_rls_insert.sql`
3. Copiez tout le contenu
4. Collez dans l'éditeur SQL
5. Exécutez

---

## 🔐 Explication

### Qu'est-ce que RLS?

Row Level Security (RLS) est un système de sécurité qui contrôle qui peut lire/écrire quelles lignes dans une table.

### Le Problème

Lors de l'inscription, le code essaie de créer un profil prestataire:

```typescript
await supabase
  .from("prestataires")
  .insert({
    user_id: authData.user.id,
    full_name: formData.fullName,
    // ...
  });
```

Mais la policy RLS existante ne permet pas cette insertion.

### La Solution

Créer une policy qui permet aux utilisateurs authentifiés de créer leur propre profil:

```sql
CREATE POLICY "Users can create their own prestataire profile"
  ON public.prestataires
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

Cette policy vérifie que:
- L'utilisateur est authentifié (`auth.uid()`)
- Le `user_id` dans le profil correspond à l'utilisateur connecté

---

## 🧪 Vérification

### 1. Vérifier les Policies

```sql
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'prestataires'
  AND cmd = 'INSERT';
```

**Résultat attendu:**
```
policyname                                    | cmd    | with_check
----------------------------------------------|--------|------------------
Users can create their own prestataire profile| INSERT | (auth.uid() = user_id)
```

### 2. Tester l'Inscription

1. Allez sur http://localhost:8080/inscription/prestataire
2. Remplissez le formulaire
3. Cliquez sur "S'inscrire"
4. ✅ Compte créé avec succès
5. ✅ Profil prestataire créé
6. ✅ Redirection vers page d'attente

### 3. Vérifier dans Supabase

**Vérifier l'utilisateur:**
1. **Authentication** → **Users**
2. Trouvez le nouvel utilisateur
3. Notez son `id`

**Vérifier le profil:**
1. **Table Editor** → **prestataires**
2. Trouvez le profil avec le même `user_id`
3. Vérifiez que toutes les données sont présentes

---

## 📋 Policies RLS Complètes pour Prestataires

Voici toutes les policies recommandées:

```sql
-- 1. SELECT: Les prestataires peuvent voir leur propre profil
CREATE POLICY "Prestataires can view own profile"
  ON public.prestataires
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. SELECT: Tous peuvent voir les prestataires vérifiés
CREATE POLICY "Anyone can view verified prestataires"
  ON public.prestataires
  FOR SELECT
  USING (verified = true);

-- 3. INSERT: Les utilisateurs peuvent créer leur profil
CREATE POLICY "Users can create their own prestataire profile"
  ON public.prestataires
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. UPDATE: Les prestataires peuvent modifier leur profil
CREATE POLICY "Prestataires can update own profile"
  ON public.prestataires
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. ADMIN: L'admin peut tout faire
CREATE POLICY "Admin has full access to prestataires"
  ON public.prestataires
  FOR ALL
  USING (auth.jwt() ->> 'email' = 'admin@kazipro.com');
```

---

## 🔄 Workflow d'Inscription Complet

### 1. Utilisateur remplit le formulaire
- Nom, email, profession, etc.

### 2. Code crée le compte Supabase Auth
```typescript
const { data: authData } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  // ...
});
```

### 3. Code crée le profil prestataire
```typescript
await supabase
  .from("prestataires")
  .insert({
    user_id: authData.user.id, // ← Doit correspondre à auth.uid()
    full_name: formData.fullName,
    // ...
  });
```

### 4. Policy RLS vérifie
```sql
WITH CHECK (auth.uid() = user_id)
```
- ✅ Si `auth.uid()` == `user_id` → Insertion autorisée
- ❌ Sinon → Erreur 401

### 5. Redirection
- Vers `/prestataire/en-attente`
- Affiche "En attente de vérification"

---

## ⚠️ Erreurs Courantes

### Erreur: "auth.uid() is null"

**Cause:** L'utilisateur n'est pas authentifié au moment de l'insertion

**Solution:** S'assurer que `signUp` est terminé avant `insert`:
```typescript
const { data: authData } = await supabase.auth.signUp(...);
if (!authData.user) throw new Error("Erreur création compte");

// Maintenant authData.user.id existe
await supabase.from("prestataires").insert({
  user_id: authData.user.id,
  // ...
});
```

### Erreur: "user_id does not match auth.uid()"

**Cause:** Le `user_id` fourni ne correspond pas à l'utilisateur connecté

**Solution:** Toujours utiliser `authData.user.id`:
```typescript
// ✅ CORRECT
user_id: authData.user.id

// ❌ INCORRECT
user_id: "some-other-id"
```

---

## 🆘 Dépannage

### Problème: L'erreur persiste après avoir exécuté le script

**Solution:**
1. Vérifiez que la policy a bien été créée:
```sql
SELECT * FROM pg_policies WHERE tablename = 'prestataires';
```

2. Videz le cache de Supabase:
   - Allez dans **Settings** → **API**
   - Cliquez sur **Reset API cache**

3. Rechargez l'application dans le navigateur

### Problème: "Permission denied"

**Solution:**
1. Vérifiez que RLS est activé:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'prestataires';
```

2. Si `rowsecurity` = false, activez-le:
```sql
ALTER TABLE public.prestataires ENABLE ROW LEVEL SECURITY;
```

---

## ✅ Checklist de Résolution

- [ ] Script SQL exécuté (`fix_prestataires_rls_insert.sql`)
- [ ] Policy "Users can create their own prestataire profile" créée
- [ ] Policy visible dans `pg_policies`
- [ ] Test d'inscription réussi
- [ ] Profil créé dans table `prestataires`
- [ ] Pas d'erreur 401
- [ ] Redirection vers page d'attente fonctionne

---

**Problème résolu! Les utilisateurs peuvent maintenant créer leur profil prestataire. ✅**
