# ✅ Créer un Prestataire - Script Corrigé

## 🔧 Problème Résolu

**Erreur:** `column "city" of relation "prestataires" does not exist`

**Cause:** La table `prestataires` n'a pas les colonnes `city`, `localisation`, `experience`, et `missions_completed`.

**Solution:** Utiliser le script corrigé ci-dessous.

---

## 🚀 Script Corrigé

Copier-coller ce script dans Supabase SQL Editor:

```sql
WITH new_user AS (
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    is_sso_user
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'test.provider@example.com',
    crypt('Provider@123456', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    false
  )
  ON CONFLICT (email) DO UPDATE SET updated_at = now()
  RETURNING id
)
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
  new_user.id,
  'Test Provider',
  'Electrician',
  'Professional service provider',
  4.5,
  true,
  false,
  now()
FROM new_user
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

---

## ✅ Étapes

### 1. Ouvrir Supabase
```
https://supabase.com → Votre Projet → SQL Editor
```

### 2. Créer une Nouvelle Requête
```
Cliquer sur "New Query"
```

### 3. Copier le Script
```
Copier le script ci-dessus
Coller dans l'éditeur
```

### 4. Exécuter
```
Cliquer sur "Run" ou Ctrl+Enter
```

### 5. Vérifier le Résultat
```
Vous devriez voir:
- user_id: [UUID]
- email: test.provider@example.com
- full_name: Test Provider
- profession: Electrician
- verified: true
```

---

## 🔑 Se Connecter

Après l'exécution du script:

```
URL: http://localhost:5173/connexion
Email: test.provider@example.com
Mot de passe: Provider@123456
```

---

## 📊 Colonnes Réelles de la Table `prestataires`

```
- id (UUID)
- user_id (UUID)
- full_name (TEXT)
- profession (TEXT)
- bio (TEXT)
- rating (NUMERIC)
- verified (BOOLEAN)
- documents_verified (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

## ✨ Résumé

**Avant:** Script avec colonnes inexistantes ❌  
**Après:** Script avec colonnes correctes ✅

**Durée:** 2 minutes  
**Résultat:** Prestataire créé et prêt à utiliser

---

**Créé:** December 24, 2025  
**Status:** ✅ Corrigé et Prêt

