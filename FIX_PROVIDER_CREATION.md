# 🔧 Corriger la Création de Prestataire

## ❌ Erreur Reçue

```
ERROR: 42703: column "city" of relation "prestataires" does not exist
```

## ✅ Solution

La table `prestataires` n'a pas les colonnes `city`, `localisation`, `experience`, et `missions_completed`.

Utilisez le script corrigé ci-dessous.

---

## 🚀 Script Corrigé (Copier-Coller)

```sql
WITH new_user AS (
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, is_sso_user)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'test.provider@example.com', crypt('Provider@123456', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, false)
  ON CONFLICT (email) DO UPDATE SET updated_at = now()
  RETURNING id
)
INSERT INTO prestataires (user_id, full_name, profession, bio, rating, verified, documents_verified, created_at)
SELECT new_user.id, 'Test Provider', 'Electrician', 'Professional service provider', 4.5, true, false, now()
FROM new_user
ON CONFLICT (user_id) DO UPDATE SET updated_at = now();

SELECT u.id as user_id, u.email, p.full_name, p.profession, p.verified, p.created_at FROM auth.users u LEFT JOIN prestataires p ON u.id = p.user_id WHERE u.email = 'test.provider@example.com';
```

---

## 📋 Étapes

1. **Ouvrir Supabase**
   - https://supabase.com
   - Sélectionner votre projet
   - Cliquer sur "SQL Editor"

2. **Créer une Nouvelle Requête**
   - Cliquer sur "New Query"

3. **Copier le Script**
   - Copier le script ci-dessus
   - Coller dans l'éditeur

4. **Exécuter**
   - Cliquer sur "Run"
   - Ou appuyer sur Ctrl+Enter

5. **Vérifier**
   - Vous devriez voir le prestataire créé

---

## 🔑 Se Connecter

```
Email: test.provider@example.com
Mot de passe: Provider@123456
```

---

## 📊 Colonnes Correctes

### Colonnes qui EXISTENT ✅
- id
- user_id
- full_name
- profession
- bio
- rating
- verified
- documents_verified
- created_at
- updated_at

### Colonnes qui N'EXISTENT PAS ❌
- city
- localisation
- experience
- missions_completed

---

## 📚 Guides Mis à Jour

Les fichiers suivants ont été corrigés:

- ✅ `sql/quick_create_provider.sql`
- ✅ `sql/create_test_provider.sql`
- ✅ `PROVIDER_CREATION_FIXED.md`
- ✅ `PROVIDER_CREATION_CORRECTED.txt`

---

## 🎉 Résultat

Après l'exécution du script corrigé:

```
✅ Prestataire créé
✅ Email: test.provider@example.com
✅ Mot de passe: Provider@123456
✅ Prêt à se connecter
```

---

**Status:** ✅ Corrigé  
**Créé:** December 24, 2025

