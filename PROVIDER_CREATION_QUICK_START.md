# ⚡ Créer un Prestataire - Démarrage Rapide

## 🚀 En 2 Minutes

### 1️⃣ Copier ce Script:

```sql
WITH new_user AS (INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, is_sso_user) VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'test.provider@example.com', crypt('Provider@123456', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, false) ON CONFLICT (email) DO UPDATE SET updated_at = now() RETURNING id) INSERT INTO prestataires (user_id, full_name, profession, bio, rating, verified, documents_verified, created_at) SELECT new_user.id, 'Test Provider', 'Electrician', 'Professional service provider', 4.5, true, false, now() FROM new_user ON CONFLICT (user_id) DO UPDATE SET updated_at = now(); SELECT u.id as user_id, u.email, p.full_name, p.profession, p.verified, p.created_at FROM auth.users u LEFT JOIN prestataires p ON u.id = p.user_id WHERE u.email = 'test.provider@example.com';
```

### 2️⃣ Exécuter dans Supabase:
- Ouvrir: https://supabase.com
- SQL Editor → New Query
- Coller le script
- Cliquer "Run"

### 3️⃣ Se Connecter:
```
Email: test.provider@example.com
Mot de passe: Provider@123456
```

### 4️⃣ Vérifier:
- Vous êtes redirigé vers `/dashboard/prestataire`
- Tableau de bord visible ✅

---

## 📊 Compte

```
Email: test.provider@example.com
Mot de passe: Provider@123456
Nom: Test Provider
Profession: Electrician
Vérifié: ✅ Oui
```

---

## 📚 Guides Complets

- [PROVIDER_CREATION_FINAL.md](./PROVIDER_CREATION_FINAL.md)
- [PROVIDER_CREATION_README.md](./PROVIDER_CREATION_README.md)
- [FIX_PROVIDER_CREATION.md](./FIX_PROVIDER_CREATION.md)

---

**Durée:** 2 minutes ⏱️  
**Status:** ✅ Fonctionnel

