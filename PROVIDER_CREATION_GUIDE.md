# Guide Complet: Créer un Prestataire

## 📋 Table des Matières
1. [Méthode Rapide (SQL)](#méthode-rapide-sql)
2. [Méthode Web (Interface)](#méthode-web-interface)
3. [Vérification](#vérification)
4. [Dépannage](#dépannage)

---

## Méthode Rapide (SQL)

### ⏱️ Durée: 2 minutes

### Étape 1: Accéder à Supabase
```
1. Ouvrir: https://supabase.com
2. Se connecter
3. Sélectionner le projet
4. Cliquer sur "SQL Editor"
```

### Étape 2: Créer une Nouvelle Requête
```
1. Cliquer sur "New Query"
2. Donner un nom: "Create Test Provider"
3. Cliquer sur "Create"
```

### Étape 3: Copier le Script
Copiez ce script complet:

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

### Étape 4: Exécuter le Script
```
1. Coller le script dans l'éditeur
2. Cliquer sur "Run" (ou Ctrl+Enter)
3. Attendre le résultat
```

### Étape 5: Vérifier le Résultat
Vous devriez voir:
```
┌─────────────────────────────────────────────────────────┐
│ user_id                              │ email                      │
├─────────────────────────────────────────────────────────┤
│ 550e8400-e29b-41d4-a716-446655440000 │ test.provider@example.com  │
│ full_name: Test Provider                                │
│ profession: Electrician                                 │
│ city: Kinshasa                                          │
│ verified: true                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Méthode Web (Interface)

### ⏱️ Durée: 5 minutes

### Étape 1: Ouvrir l'Application
```
1. Ouvrir: http://localhost:5173
2. Cliquer sur "S'inscrire"
3. Sélectionner "Prestataire"
```

### Étape 2: Remplir le Formulaire
```
Nom complet: Test Provider
Email: test.provider@example.com
Profession: Electrician
Ville: Kinshasa
Années d'expérience: 5
Mot de passe: Provider@123456
Confirmer mot de passe: Provider@123456
```

### Étape 3: Soumettre
```
1. Cliquer sur "S'inscrire"
2. Attendre le message de confirmation
```

### Étape 4: Vérifier l'OTP
```
1. Vérifier votre email
2. Copier le code OTP
3. Coller le code dans l'application
4. Cliquer sur "Vérifier"
```

### Étape 5: Approuver le Prestataire
```
1. Se déconnecter
2. Se connecter en tant qu'admin:
   - Email: admin@kazipro.com
   - Mot de passe: Admin@123456
3. Aller à: /dashboard/admin/prestataires
4. Trouver "Test Provider" dans "En attente"
5. Cliquer sur "Vérifier"
```

### Étape 6: Se Connecter en tant que Prestataire
```
1. Se déconnecter
2. Se connecter avec:
   - Email: test.provider@example.com
   - Mot de passe: Provider@123456
3. Vous serez redirigé vers /dashboard/prestataire
```

---

## Vérification

### ✅ Vérifier la Création

#### Via Supabase Console
```sql
-- Exécuter cette requête
SELECT 
  u.id,
  u.email,
  p.full_name,
  p.profession,
  p.verified
FROM auth.users u
LEFT JOIN prestataires p ON u.id = p.user_id
WHERE u.email = 'test.provider@example.com';
```

Résultat attendu:
```
id: [UUID]
email: test.provider@example.com
full_name: Test Provider
profession: Electrician
verified: true
```

#### Via l'Application
```
1. Se connecter avec le prestataire
2. Aller à: /dashboard/prestataire
3. Vérifier que le tableau de bord s'affiche
4. Aller à: /dashboard/prestataire/profil
5. Vérifier que le profil s'affiche correctement
```

---

## Dépannage

### ❌ Problème: "Email already exists"

**Cause:** L'email existe déjà  
**Solution:** Utilisez un email différent

```sql
-- Modifier cette ligne:
email = 'autre.email@example.com',
```

### ❌ Problème: "Relation does not exist"

**Cause:** Les tables n'existent pas  
**Solution:** Exécutez d'abord le script d'initialisation

```
1. Aller à: sql/init_tables.sql
2. Copier le contenu
3. Exécuter dans Supabase SQL Editor
```

### ❌ Problème: Impossible de se connecter

**Cause:** Identifiants incorrects  
**Solution:** Vérifiez:

```
Email: test.provider@example.com (exact)
Mot de passe: Provider@123456 (exact)
```

### ❌ Problème: Redirigé vers "En attente"

**Cause:** Le prestataire n'est pas approuvé  
**Solution:** Approuver le prestataire

```
1. Se connecter en tant qu'admin
2. Aller à: /dashboard/admin/prestataires
3. Cliquer sur "Vérifier"
```

### ❌ Problème: Pas de données affichées

**Cause:** Les données ne sont pas créées  
**Solution:** Créer des données de test

```
1. Créer des demandes (clients)
2. Créer des devis (prestataires)
3. Créer des missions
```

---

## 📊 Comptes de Test Disponibles

### Admin
```
Email: admin@kazipro.com
Mot de passe: Admin@123456
Accès: /dashboard/admin
```

### Client
```
Email: marie@example.com
Mot de passe: Test@123456
Accès: /dashboard/client
```

### Prestataire (Créé)
```
Email: test.provider@example.com
Mot de passe: Provider@123456
Accès: /dashboard/prestataire
```

---

## 🎯 Après la Création

### Pages Disponibles

#### Tableau de Bord
```
/dashboard/prestataire
```

#### Missions
```
/dashboard/prestataire/missions
```

#### Devis
```
/dashboard/prestataire/devis
```

#### Calendrier
```
/dashboard/prestataire/calendrier
```

#### Revenus
```
/dashboard/prestataire/revenus
```

#### Messages
```
/dashboard/prestataire/messages
```

#### Profil
```
/dashboard/prestataire/profil
```

#### Paramètres
```
/dashboard/prestataire/parametres
```

---

## 🔧 Personnaliser le Prestataire

Pour créer un prestataire avec des informations différentes:

```sql
-- Modifier ces valeurs:
email = 'jean.mukeba@example.com',
full_name = 'Jean Mukeba',
profession = 'Plombier',
city = 'Gombe',
localisation = 'Gombe',
experience = 10,
bio = 'Plombier professionnel avec 10 ans d\'expérience',
rating = 4.8,
```

---

## 📝 Créer Plusieurs Prestataires

Pour créer plusieurs prestataires, exécutez le script plusieurs fois avec des emails différents:

```sql
-- Prestataire 1
email = 'provider1@example.com',
full_name = 'Provider 1',

-- Prestataire 2
email = 'provider2@example.com',
full_name = 'Provider 2',

-- Prestataire 3
email = 'provider3@example.com',
full_name = 'Provider 3',
```

---

## ✅ Checklist

- [ ] Supabase configuré
- [ ] Tables créées
- [ ] Script SQL exécuté
- [ ] Prestataire créé
- [ ] Prestataire approuvé
- [ ] Connexion réussie
- [ ] Tableau de bord visible
- [ ] Profil visible

---

## 📞 Support

Si vous avez des problèmes:

1. Vérifiez [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Vérifiez [TROUBLESHOOT_LOGIN.md](./TROUBLESHOOT_LOGIN.md)
3. Vérifiez les logs Supabase
4. Vérifiez la console du navigateur

---

**Créé:** December 24, 2025  
**Status:** ✅ Prêt à utiliser

