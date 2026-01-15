# 🔧 Fix: Permission Denied for Table Users

## ❌ Erreur

```json
{
  "code": "42501",
  "message": "permission denied for table users"
}
```

## 🎯 Cause

Les RLS policies ne peuvent **PAS** accéder à la table `auth.users` directement. Il faut utiliser `auth.jwt()` à la place.

---

## ✅ Solution Immédiate (30 Secondes)

### Exécutez ce SQL dans Supabase:

```sql
-- Supprimer les anciennes policies avec auth.users
DROP POLICY IF EXISTS "prestataires_update_own" ON public.prestataires;
DROP POLICY IF EXISTS "Admin can update all prestataires" ON public.prestataires;
DROP POLICY IF EXISTS "admin_update_all_prestataires" ON public.prestataires;

-- Policy pour les prestataires
CREATE POLICY "prestataires_update_own"
  ON public.prestataires
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy pour l'admin (UTILISE auth.jwt() au lieu de auth.users)
CREATE POLICY "admin_update_all_prestataires"
  ON public.prestataires
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'email') = 'admin@kazipro.com'
  )
  WITH CHECK (
    (auth.jwt() ->> 'email') = 'admin@kazipro.com'
  );
```

---

## 🧪 Test Immédiat

1. **Rechargez** la page: http://localhost:8080/dashboard/admin/prestataires
2. **Ouvrez la console** (F12)
3. **Cliquez sur "Vérifier"** pour Justin Akonkwa
4. **Vérifiez la console:**

### ✅ Succès:
```
🔄 Tentative de vérification du prestataire: 65ae32e5-c808-42db-acff-2f3dd554c434
✅ Prestataire vérifié: [{verified: true, ...}]
```

### ❌ Si encore une erreur:
```
❌ Erreur vérification: {code: "...", message: "..."}
```

Partagez l'erreur complète de la console.

---

## 🔍 Vérifier que Vous Êtes Admin

Exécutez ce SQL pour vérifier votre email:

```sql
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role
FROM auth.users
WHERE id = auth.uid();
```

**Résultat attendu:**
```
email: "admin@kazipro.com"
role: "admin"
```

Si ce n'est pas le cas, reconnectez-vous avec:
- Email: `admin@kazipro.com`
- Password: `Admin@123456`

---

## 📋 Différence Entre les Approches

### ❌ MAUVAIS (cause l'erreur):
```sql
-- Ne fonctionne PAS dans les RLS policies
EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND auth.users.email = 'admin@kazipro.com'
)
```

### ✅ BON (fonctionne):
```sql
-- Utilise le JWT token
(auth.jwt() ->> 'email') = 'admin@kazipro.com'
```

---

## 🎯 Pourquoi Ça Marche

- `auth.jwt()` lit les données du **token JWT** (accessible)
- `auth.users` essaie d'accéder à la **table users** (interdit dans RLS)
- Le JWT contient déjà l'email, pas besoin de requête supplémentaire

---

## ✅ Checklist

- [ ] SQL exécuté dans Supabase
- [ ] Policies créées sans erreur
- [ ] Connecté en tant qu'admin@kazipro.com
- [ ] Page admin rechargée
- [ ] Console ouverte (F12)
- [ ] Bouton "Vérifier" cliqué
- [ ] Logs vérifiés dans la console
- [ ] Prestataire vérifié avec succès

---

## 🚀 Résultat Attendu

Après avoir exécuté le SQL:
- ✅ Pas d'erreur "permission denied for table users"
- ✅ Bouton "Vérifier" fonctionne
- ✅ Statut mis à jour: `verified: true`
- ✅ Prestataire déplacé vers "Vérifiés"

---

**Exécutez le SQL ci-dessus et réessayez!** 🎉
