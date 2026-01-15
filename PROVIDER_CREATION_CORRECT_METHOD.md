# ✅ Créer un Prestataire - Méthode Correcte

## ❌ Erreur Reçue

```
ERROR: 42703: column "email_change_token" of relation "users" does not exist
```

## ✅ Cause

Supabase Auth gère la table `auth.users` automatiquement. Nous ne pouvons pas insérer directement dans cette table avec des colonnes personnalisées.

## ✅ Solution

Créer l'utilisateur via l'interface Supabase, puis créer le profil prestataire via SQL.

---

## 🚀 Méthode Correcte (3 étapes)

### Étape 1: Créer l'Utilisateur via Supabase Auth UI

1. Ouvrir Supabase Console
2. Aller à "Authentication" → "Users"
3. Cliquer sur "Add user"
4. Remplir:
   - Email: `test.provider@example.com`
   - Password: `Provider@123456`
5. Cliquer "Save"

### Étape 2: Vérifier que l'Utilisateur est Créé

1. Aller à "SQL Editor"
2. Exécuter cette requête:
```sql
SELECT id, email FROM auth.users WHERE email = 'test.provider@example.com';
```
3. Vous devriez voir l'utilisateur créé

### Étape 3: Créer le Profil Prestataire

1. Aller à "SQL Editor"
2. Copier ce script:

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

3. Cliquer "Run"

### Étape 4: Se Connecter

```
URL: http://localhost:5173/connexion
Email: test.provider@example.com
Mot de passe: Provider@123456
```

---

## 📊 Résultat Attendu

Après l'exécution du script SQL:

```
user_id: [UUID]
email: test.provider@example.com
full_name: Test Provider
profession: Electrician
verified: true
```

---

## 🎯 Résumé

| Étape | Méthode | Outil |
|-------|---------|-------|
| 1 | Créer utilisateur | Supabase Auth UI |
| 2 | Vérifier utilisateur | SQL Query |
| 3 | Créer profil | SQL Insert |
| 4 | Se connecter | Application |

---

## 📝 Script SQL Complet

```sql
-- Créer le profil prestataire
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

-- Vérifier la création
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

---

## 🔑 Compte Créé

```
Email: test.provider@example.com
Mot de passe: Provider@123456
Nom: Test Provider
Profession: Electrician
Vérifié: ✅ Oui
```

---

## 🆘 Dépannage

### Erreur: "No rows returned"
**Cause:** L'utilisateur n'existe pas dans `auth.users`  
**Solution:** Créer l'utilisateur via Supabase Auth UI d'abord

### Erreur: "Duplicate key value"
**Cause:** Le profil prestataire existe déjà  
**Solution:** Utiliser `ON CONFLICT ... DO UPDATE`

### Impossible de se connecter
**Cause:** Identifiants incorrects  
**Solution:** Vérifier l'email et le mot de passe exactement

---

## 📚 Fichiers Disponibles

- `sql/create_provider_simple.sql` - Script SQL simple
- `sql/quick_create_provider.sql` - Script rapide
- `PROVIDER_CREATION_CORRECT_METHOD.md` - Ce guide

---

## ✨ Résumé

**Méthode Correcte:**
1. Créer utilisateur via Supabase Auth UI
2. Exécuter script SQL pour créer profil
3. Se connecter

**Durée:** 5 minutes  
**Résultat:** Prestataire fonctionnel ✅

---

**Status:** ✅ Méthode Correcte  
**Créé:** December 24, 2025

