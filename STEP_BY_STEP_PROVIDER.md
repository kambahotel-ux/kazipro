# Créer un Prestataire - Étape par Étape

## 🎯 Objectif
Créer un compte prestataire (provider) pour tester l'application.

---

## ✅ Étape 1: Ouvrir Supabase

### Actions:
1. Ouvrir votre navigateur
2. Aller à: **https://supabase.com**
3. Se connecter avec vos identifiants
4. Sélectionner votre projet KaziPro

### Résultat attendu:
Vous voyez le tableau de bord Supabase avec votre projet

---

## ✅ Étape 2: Ouvrir l'Éditeur SQL

### Actions:
1. Dans le menu de gauche, cliquer sur **"SQL Editor"**
2. Cliquer sur **"New Query"**
3. Donner un nom: **"Create Provider"**
4. Cliquer sur **"Create"**

### Résultat attendu:
Un nouvel éditeur SQL vide s'ouvre

---

## ✅ Étape 3: Copier le Script

### Script à copier:

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

### Actions:
1. Sélectionner tout le script ci-dessus
2. Copier (Ctrl+C ou Cmd+C)
3. Coller dans l'éditeur SQL (Ctrl+V ou Cmd+V)

### Résultat attendu:
Le script apparaît dans l'éditeur SQL

---

## ✅ Étape 4: Exécuter le Script

### Actions:
1. Cliquer sur le bouton **"Run"** (en haut à droite)
2. Ou appuyer sur **Ctrl+Enter** (ou Cmd+Enter sur Mac)
3. Attendre quelques secondes

### Résultat attendu:
Un tableau s'affiche avec les informations du prestataire créé:

```
id: [UUID]
email: test.provider@example.com
full_name: Test Provider
profession: Electrician
verified: true
```

---

## ✅ Étape 5: Vérifier la Création

### Actions:
1. Regarder le résultat du script
2. Vérifier que:
   - ✅ email = test.provider@example.com
   - ✅ full_name = Test Provider
   - ✅ profession = Electrician
   - ✅ verified = true

### Résultat attendu:
Tous les champs sont corrects

---

## ✅ Étape 6: Ouvrir l'Application

### Actions:
1. Ouvrir un nouvel onglet du navigateur
2. Aller à: **http://localhost:5173**
3. Attendre que l'application se charge

### Résultat attendu:
La page d'accueil de KaziPro s'affiche

---

## ✅ Étape 7: Se Connecter

### Actions:
1. Cliquer sur **"Connexion"** ou aller à `/connexion`
2. Entrer l'email: **test.provider@example.com**
3. Entrer le mot de passe: **Provider@123456**
4. Cliquer sur **"Se connecter"**

### Résultat attendu:
Vous êtes redirigé vers `/dashboard/prestataire`

---

## ✅ Étape 8: Vérifier le Tableau de Bord

### Actions:
1. Vérifier que vous êtes sur `/dashboard/prestataire`
2. Vérifier que le nom "Test Provider" s'affiche en haut
3. Vérifier que les pages se chargent:
   - Missions
   - Devis
   - Calendrier
   - Revenus
   - Messages
   - Profil
   - Paramètres

### Résultat attendu:
Le tableau de bord du prestataire s'affiche correctement

---

## 🎉 Succès!

Vous avez créé un prestataire avec succès!

### Informations du Compte:
```
Email: test.provider@example.com
Mot de passe: Provider@123456
Nom: Test Provider
Profession: Electrician
Ville: Kinshasa
Vérifié: ✅ Oui
```

### Pages Disponibles:
- `/dashboard/prestataire` - Tableau de bord
- `/dashboard/prestataire/missions` - Missions
- `/dashboard/prestataire/devis` - Devis
- `/dashboard/prestataire/calendrier` - Calendrier
- `/dashboard/prestataire/revenus` - Revenus
- `/dashboard/prestataire/messages` - Messages
- `/dashboard/prestataire/profil` - Profil
- `/dashboard/prestataire/parametres` - Paramètres

---

## 🆘 Dépannage

### ❌ Erreur: "Email already exists"
**Solution:** L'email existe déjà. Utilisez un email différent dans le script.

### ❌ Erreur: "Relation does not exist"
**Solution:** Les tables n'existent pas. Exécutez d'abord `sql/init_tables.sql`.

### ❌ Impossible de se connecter
**Solution:** Vérifiez l'email et le mot de passe exactement.

### ❌ Redirigé vers "En attente"
**Solution:** Le prestataire n'est pas approuvé. Connectez-vous en tant qu'admin et approuvez-le.

---

## 📞 Besoin d'Aide?

Consultez:
- [PROVIDER_CREATION_GUIDE.md](./PROVIDER_CREATION_GUIDE.md) - Guide complet
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Dépannage
- [QUICK_CREATE_PROVIDER.md](./QUICK_CREATE_PROVIDER.md) - Méthode rapide

---

**Créé:** December 24, 2025  
**Status:** ✅ Prêt à utiliser

