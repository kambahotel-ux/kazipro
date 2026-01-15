# ✅ Créer un Prestataire - Solution Finale

## ❌ Erreur Reçue

```
ERROR: 42703: column "email_change_token" of relation "users" does not exist
```

## ✅ Cause

Supabase Auth gère la table `auth.users` automatiquement. Nous ne pouvons pas insérer directement dans cette table.

## ✅ Solution

Créer l'utilisateur via l'interface Supabase, puis créer le profil prestataire via SQL.

---

## 🚀 Méthode Correcte (5 minutes)

### Étape 1: Créer l'Utilisateur via Supabase Auth UI

1. Ouvrir: https://supabase.com
2. Aller à: Authentication → Users
3. Cliquer: "Add user"
4. Remplir:
   - Email: `test.provider@example.com`
   - Password: `Provider@123456`
5. Cliquer: "Save"

### Étape 2: Exécuter le Script SQL

Copier-coller dans SQL Editor:

```sql
INSERT INTO prestataires (
  user_id,
  full_name,
  profession,
  bio,
  rating,
  verified,
  documents_verified,
  created_at
)
SELECT
  u.id,
  'Test Provider',
  'Electrician',
  'Professional service provider',
  4.5,
  true,
  false,
  now()
FROM auth.users u
WHERE u.email = 'test.provider@example.com'
ON CONFLICT (user_id) DO UPDATE SET updated_at = now();

SELECT 
  u.id as user_id,
  u.email,
  p.full_name,
  p.profession,
  p.verified,
  p.created_at
FROM auth.users u
LEFT JOIN prestataires p ON u.id = p.user_id
WHERE u.email = 'test.provider@example.com';
```

### Étape 3: Se Connecter

```
URL: http://localhost:5173/connexion
Email: test.provider@example.com
Mot de passe: Provider@123456
```

---

## 📊 Compte Créé

```
Email: test.provider@example.com
Mot de passe: Provider@123456
Nom: Test Provider
Profession: Electrician
Vérifié: ✅ Oui
```

---

## 📚 Guides Disponibles

- [PROVIDER_CREATION_STEP_BY_STEP_CORRECT.md](./PROVIDER_CREATION_STEP_BY_STEP_CORRECT.md) - Guide étape par étape
- [PROVIDER_CREATION_CORRECT_METHOD.md](./PROVIDER_CREATION_CORRECT_METHOD.md) - Méthode correcte
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Dépannage

---

## ✨ Résumé

**Avant:** Erreur lors de l'insertion dans `auth.users` ❌  
**Après:** Créer via UI, puis créer profil via SQL ✅

**Durée:** 5 minutes  
**Résultat:** Prestataire fonctionnel ✅

---

**Status:** ✅ Solution Finale  
**Créé:** December 24, 2025

