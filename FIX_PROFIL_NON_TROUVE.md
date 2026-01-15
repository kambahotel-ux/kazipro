# 🔧 Fix: Profil Prestataire Non Trouvé

## 🚨 Problème

Message d'erreur: **"Profil prestataire non trouvé"**

Cela signifie qu'il n'y a pas d'entrée dans la table `prestataires` pour votre compte utilisateur.

---

## 🔍 Causes Possibles

1. **Compte créé manuellement** dans Supabase Auth sans profil prestataire
2. **Inscription incomplète** - Le profil n'a pas été créé lors de l'inscription
3. **Connexion avec mauvais compte** - Vous êtes connecté avec un compte client ou admin
4. **Suppression accidentelle** du profil prestataire

---

## ✅ Solution 1: Vérifier Quel Compte Est Connecté

### Dans la console du navigateur (F12):

```javascript
// Voir l'utilisateur connecté
const { data } = await supabase.auth.getUser();
console.log("Email connecté:", data.user?.email);
console.log("User ID:", data.user?.id);
```

### Vérifier dans Supabase:

1. Ouvrir Supabase Dashboard
2. Aller dans **Authentication** → **Users**
3. Chercher votre email
4. Noter le **User ID**

---

## ✅ Solution 2: Créer le Profil Prestataire

### Méthode A: Via SQL Editor (Recommandé)

1. **Ouvrir Supabase Dashboard**
2. **Aller dans SQL Editor**
3. **Copier et adapter ce script**:

```sql
-- Remplacez 'VOTRE_EMAIL' par votre email de connexion
-- Remplacez les autres valeurs par vos informations

INSERT INTO prestataires (
  user_id,
  full_name,
  profession,
  phone,
  email,
  city,
  verified,
  bio,
  experience_years,
  hourly_rate,
  availability
)
SELECT 
  id as user_id,
  'Jean Mukeba' as full_name,
  'Électricien' as profession,
  '+243 812 345 678' as phone,
  email,
  'Gombe' as city,
  false as verified,
  'Électricien professionnel avec 10 ans d''expérience.' as bio,
  10 as experience_years,
  5000 as hourly_rate,
  'disponible' as availability
FROM auth.users
WHERE email = 'VOTRE_EMAIL'
AND NOT EXISTS (
  SELECT 1 FROM prestataires WHERE user_id = auth.users.id
);
```

4. **Remplacer**:
   - `'VOTRE_EMAIL'` → Votre email de connexion
   - `'Jean Mukeba'` → Votre nom complet
   - `'Électricien'` → Votre profession
   - `'+243 812 345 678'` → Votre téléphone
   - `'Gombe'` → Votre commune
   - Autres valeurs selon vos besoins

5. **Exécuter** le script (Run)

6. **Vérifier** que le profil a été créé:

```sql
SELECT 
  p.id,
  p.full_name,
  p.profession,
  p.verified,
  u.email
FROM prestataires p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'VOTRE_EMAIL';
```

### Méthode B: Via Table Editor

1. **Ouvrir Supabase Dashboard**
2. **Aller dans Table Editor**
3. **Sélectionner la table `prestataires`**
4. **Cliquer sur "Insert" → "Insert row"**
5. **Remplir les champs**:
   - `user_id`: Copier depuis Authentication → Users
   - `full_name`: Votre nom complet
   - `profession`: Choisir dans la liste
   - `phone`: Votre téléphone
   - `email`: Votre email
   - `city`: Votre commune
   - `verified`: false (sera vérifié par l'admin)
6. **Cliquer "Save"**

---

## ✅ Solution 3: S'Inscrire Correctement

Si vous n'avez pas de compte prestataire:

1. **Se déconnecter** du compte actuel
2. **Aller sur** `/register-provider`
3. **Remplir le formulaire d'inscription**
4. **Compléter toutes les étapes**
5. **Attendre l'approbation** de l'admin

---

## 📋 Informations Requises

### Champs Obligatoires

- **user_id**: ID de l'utilisateur dans auth.users (UUID)
- **full_name**: Nom complet
- **profession**: Une des professions disponibles
- **phone**: Numéro de téléphone
- **email**: Email (même que dans auth.users)

### Champs Optionnels

- **city**: Commune de Kinshasa
- **address**: Adresse complète
- **bio**: Description du profil
- **experience_years**: Années d'expérience
- **hourly_rate**: Tarif horaire en FC
- **availability**: disponible / occupe / indisponible
- **verified**: true/false (vérifié par admin)

---

## 🎯 Professions Disponibles

- Électricien
- Plombier
- Menuisier
- Maçon
- Peintre
- Mécanicien
- Informaticien
- Jardinier
- Couturier/Couturière
- Coiffeur/Coiffeuse

---

## 🏙️ Communes de Kinshasa

Bandalungwa, Barumbu, Bumbu, Gombe, Kalamu, Kasa-Vubu, Kimbanseke, Kinshasa, Kintambo, Kisenso, Lemba, Limete, Lingwala, Makala, Maluku, Masina, Matete, Mont-Ngafula, Ndjili, Ngaba, Ngaliema, Ngiri-Ngiri, Nsele, Selembao

---

## 🧪 Vérification

Après avoir créé le profil:

1. **Rafraîchir la page** (F5)
2. **Aller sur** `/dashboard/prestataire/profil`
3. **Vérifier** que le profil s'affiche correctement

Si le problème persiste:

```sql
-- Vérifier la correspondance user_id
SELECT 
  u.id as auth_user_id,
  u.email,
  p.id as provider_id,
  p.user_id as provider_user_id,
  p.full_name
FROM auth.users u
LEFT JOIN prestataires p ON u.id = p.user_id
WHERE u.email = 'VOTRE_EMAIL';
```

Le `auth_user_id` doit correspondre au `provider_user_id`.

---

## 🔐 Vérifier les RLS Policies

Si le profil existe mais n'est pas visible:

```sql
-- Vérifier les policies RLS
SELECT * FROM prestataires WHERE user_id = 'VOTRE_USER_ID';
```

Si cette requête retourne des résultats mais l'interface ne les affiche pas, il peut y avoir un problème de RLS.

**Solution**:

```sql
-- Permettre aux prestataires de voir leur propre profil
DROP POLICY IF EXISTS "Prestataires can view own profile" ON prestataires;
CREATE POLICY "Prestataires can view own profile"
ON prestataires FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Permettre aux prestataires de modifier leur propre profil
DROP POLICY IF EXISTS "Prestataires can update own profile" ON prestataires;
CREATE POLICY "Prestataires can update own profile"
ON prestataires FOR UPDATE
TO authenticated
USING (user_id = auth.uid());
```

---

## 📝 Script Complet de Diagnostic

Utilisez ce script pour diagnostiquer le problème:

```sql
-- 1. Vérifier l'utilisateur connecté
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'VOTRE_EMAIL';

-- 2. Vérifier si un profil prestataire existe
SELECT 
  p.*,
  u.email as auth_email
FROM prestataires p
RIGHT JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'VOTRE_EMAIL';

-- 3. Compter les profils prestataires
SELECT COUNT(*) as total_providers FROM prestataires;

-- 4. Voir tous les profils (pour debug)
SELECT 
  p.id,
  p.full_name,
  p.profession,
  p.verified,
  u.email
FROM prestataires p
JOIN auth.users u ON p.user_id = u.id
LIMIT 10;
```

---

## ✅ Résultat Attendu

Après avoir appliqué la solution:

- ✅ Le profil s'affiche correctement
- ✅ Les informations sont visibles
- ✅ Le mode édition fonctionne
- ✅ Les statistiques s'affichent
- ✅ Les avis sont visibles (si existants)

---

## 🆘 Besoin d'Aide?

Si le problème persiste:

1. Vérifier les logs de la console (F12)
2. Vérifier les erreurs Supabase
3. Vérifier que le `user_id` correspond
4. Vérifier les RLS policies
5. Contacter le support

---

**Fichier SQL**: `sql/check_create_provider_profile.sql`

**Utilisez ce fichier pour créer facilement votre profil prestataire!**
