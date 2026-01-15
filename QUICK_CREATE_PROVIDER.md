# Créer Rapidement un Prestataire

## 🚀 Méthode Rapide (2 minutes)

### Étape 1: Ouvrir Supabase SQL Editor
1. Allez à https://supabase.com
2. Connectez-vous à votre projet
3. Cliquez sur "SQL Editor" dans le menu de gauche

### Étape 2: Exécuter le Script
1. Cliquez sur "New Query"
2. Copiez ce script:

```sql
-- Create auth user and prestataire profile
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
  city,
  localisation,
  experience,
  bio,
  rating,
  verified,
  documents_verified,
  missions_completed,
  created_at
)
SELECT
  new_user.id,
  'Test Provider',
  'Electrician',
  'Kinshasa',
  'Gombe',
  5,
  'Professional service provider',
  4.5,
  true,
  false,
  0,
  now()
FROM new_user
ON CONFLICT (user_id) DO UPDATE SET updated_at = now();

-- Show the created provider
SELECT 
  u.id as user_id,
  u.email,
  p.full_name,
  p.profession,
  p.city,
  p.verified,
  p.created_at
FROM auth.users u
LEFT JOIN prestataires p ON u.id = p.user_id
WHERE u.email = 'test.provider@example.com';
```

3. Cliquez sur "Run" (ou Ctrl+Enter)

### Étape 3: Vérifier la Création
Vous devriez voir un résultat comme:
```
user_id: [UUID]
email: test.provider@example.com
full_name: Test Provider
profession: Electrician
city: Kinshasa
verified: true
created_at: [timestamp]
```

### Étape 4: Se Connecter
1. Allez à `http://localhost:5173/connexion`
2. Entrez:
   - Email: `test.provider@example.com`
   - Mot de passe: `Provider@123456`
3. Cliquez sur "Se connecter"
4. Vous serez redirigé vers `/dashboard/prestataire`

---

## ✅ Compte Créé

```
Email: test.provider@example.com
Mot de passe: Provider@123456
Nom: Test Provider
Profession: Electrician
Ville: Kinshasa
Vérifié: Oui ✅
```

---

## 🎯 Prochaines Étapes

Après la connexion, vous pouvez:

1. **Voir le tableau de bord**
   - `/dashboard/prestataire`

2. **Voir les missions**
   - `/dashboard/prestataire/missions`

3. **Voir les devis**
   - `/dashboard/prestataire/devis`

4. **Voir les revenus**
   - `/dashboard/prestataire/revenus`

5. **Voir le profil**
   - `/dashboard/prestataire/profil`

6. **Modifier les paramètres**
   - `/dashboard/prestataire/parametres`

---

## 🆘 Dépannage

### Erreur: "Email already exists"
- L'email existe déjà
- Utilisez un email différent dans le script

### Erreur: "Relation does not exist"
- Les tables n'existent pas
- Exécutez d'abord `sql/init_tables.sql`

### Impossible de se connecter
- Vérifiez l'email: `test.provider@example.com`
- Vérifiez le mot de passe: `Provider@123456`
- Vérifiez que `verified: true` dans la base de données

### Redirigé vers la page d'attente
- Le prestataire n'est pas approuvé
- Connectez-vous en tant qu'admin
- Allez à `/dashboard/admin/prestataires`
- Cliquez sur "Vérifier"

---

## 📝 Personnaliser le Prestataire

Pour créer un prestataire différent, modifiez ces lignes:

```sql
email = 'votre.email@example.com',
full_name = 'Votre Nom',
profession = 'Votre Profession',
city = 'Votre Ville',
experience = 10,
bio = 'Votre bio',
```

---

## 🔑 Autres Comptes de Test

### Admin
```
Email: admin@kazipro.com
Mot de passe: Admin@123456
```

### Client
```
Email: marie@example.com
Mot de passe: Test@123456
```

---

**Créé:** December 24, 2025  
**Status:** ✅ Prêt à utiliser

