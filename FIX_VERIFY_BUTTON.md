# 🔧 Fix: Bouton Vérifier Ne Fonctionne Pas

## ❌ Problème

Quand vous cliquez sur "Vérifier", le statut ne change pas:
- `verified: false` reste `false`
- `documents_verified: false` reste `false`

## 🎯 Cause

L'admin n'a pas la permission UPDATE sur la table `prestataires` à cause des RLS policies.

---

## ✅ Solution Rapide (2 Minutes)

### Étape 1: Exécuter le Script SQL

1. Ouvrez **Supabase Dashboard** → **SQL Editor**
2. Copiez et collez ce SQL:

```sql
-- Supprimer les anciennes policies UPDATE
DROP POLICY IF EXISTS "prestataires_update_own" ON public.prestataires;
DROP POLICY IF EXISTS "Admin can update all prestataires" ON public.prestataires;

-- Policy pour que les prestataires modifient leur propre profil
CREATE POLICY "prestataires_update_own"
  ON public.prestataires
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy pour que l'admin modifie tous les prestataires
CREATE POLICY "Admin can update all prestataires"
  ON public.prestataires
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@kazipro.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@kazipro.com'
    )
  );
```

3. Cliquez sur **Run**

### Étape 2: Tester

1. Rechargez la page: http://localhost:8080/dashboard/admin/prestataires
2. Ouvrez la console du navigateur (F12)
3. Cliquez sur "Vérifier" sur un prestataire
4. Vous devriez voir dans la console:
   ```
   🔄 Tentative de vérification du prestataire: [ID]
   ✅ Prestataire vérifié: [data]
   ```
5. Le prestataire devrait passer dans l'onglet "Vérifiés"

---

## 🔍 Vérifier les Logs

Après avoir cliqué sur "Vérifier", regardez la console (F12):

### ✅ Si ça marche:
```
🔄 Tentative de vérification du prestataire: 65ae32e5-c808-42db-acff-2f3dd554c434
✅ Prestataire vérifié: [{verified: true, documents_verified: true, ...}]
```

### ❌ Si erreur de permission:
```
❌ Erreur vérification: {code: "42501", message: "new row violates row-level security policy"}
```
→ Réexécutez le script SQL ci-dessus

### ❌ Si erreur "not authenticated":
```
❌ Erreur vérification: {code: "PGRST301", message: "JWT expired"}
```
→ Reconnectez-vous en tant qu'admin

---

## 🧪 Test Complet

### Test 1: Vérifier un Prestataire

1. Allez dans l'onglet "En attente"
2. Cliquez sur "Vérifier" sur Justin Akonkwa
3. Vérifiez dans la console:
   ```
   🔄 Tentative de vérification du prestataire: 65ae32e5-c808-42db-acff-2f3dd554c434
   ✅ Prestataire vérifié: [...]
   ```
4. Le prestataire devrait apparaître dans "Vérifiés"

### Test 2: Vérifier dans la Base de Données

Exécutez ce SQL pour confirmer:
```sql
SELECT 
  id,
  full_name,
  profession,
  verified,
  documents_verified
FROM public.prestataires
WHERE id = '65ae32e5-c808-42db-acff-2f3dd554c434';
```

Résultat attendu:
```
verified: true
documents_verified: true
```

### Test 3: Rejeter un Prestataire

1. Créez un nouveau prestataire de test
2. Dans l'admin, cliquez sur "Rejeter"
3. Confirmez l'action
4. Le prestataire devrait rester dans "En attente" avec `verified: false`

---

## 📋 Checklist de Vérification

- [ ] Script SQL exécuté sans erreur
- [ ] Policies UPDATE créées (vérifier avec `SELECT * FROM pg_policies WHERE tablename = 'prestataires' AND cmd = 'UPDATE'`)
- [ ] Connecté en tant qu'admin (admin@kazipro.com)
- [ ] Page admin rechargée
- [ ] Console du navigateur ouverte (F12)
- [ ] Bouton "Vérifier" cliqué
- [ ] Logs affichés dans la console
- [ ] Prestataire déplacé vers "Vérifiés"
- [ ] Statut vérifié dans la base de données

---

## 🔧 Alternative: Mise à Jour Manuelle

Si le problème persiste, vous pouvez mettre à jour manuellement:

```sql
-- Vérifier Justin Akonkwa
UPDATE public.prestataires
SET 
  verified = true,
  documents_verified = true,
  updated_at = NOW()
WHERE id = '65ae32e5-c808-42db-acff-2f3dd554c434';

-- Vérifier le résultat
SELECT * FROM public.prestataires 
WHERE id = '65ae32e5-c808-42db-acff-2f3dd554c434';
```

---

## 📝 Ce Qui a Été Amélioré

1. ✅ Ajout de logs détaillés dans la console
2. ✅ Ajout de `.select()` pour voir les données mises à jour
3. ✅ Création des policies UPDATE pour l'admin
4. ✅ Messages d'erreur plus clairs

---

## 🎯 Résultat Attendu

Après avoir exécuté le script SQL:
- ✅ Bouton "Vérifier" fonctionne
- ✅ Bouton "Rejeter" fonctionne
- ✅ Logs détaillés dans la console
- ✅ Statut mis à jour en temps réel
- ✅ Prestataires déplacés entre les onglets

---

**Exécutez le script SQL et réessayez!** 🚀
