# 📖 Créer un Prestataire - Guide Étape par Étape (Méthode Correcte)

## 🎯 Objectif

Créer un prestataire en 5 minutes en utilisant la méthode correcte.

---

## ✅ Étape 1: Ouvrir Supabase

### Actions:
1. Ouvrir votre navigateur
2. Aller à: **https://supabase.com**
3. Se connecter avec vos identifiants
4. Sélectionner votre projet KaziPro

### Résultat attendu:
Vous voyez le tableau de bord Supabase

---

## ✅ Étape 2: Aller à Authentication

### Actions:
1. Dans le menu de gauche, cliquer sur **"Authentication"**
2. Cliquer sur **"Users"**
3. Vous voyez la liste des utilisateurs

### Résultat attendu:
La page "Users" s'affiche avec les utilisateurs existants

---

## ✅ Étape 3: Créer un Nouvel Utilisateur

### Actions:
1. Cliquer sur le bouton **"Add user"** (en haut à droite)
2. Une fenêtre s'ouvre

### Résultat attendu:
Un formulaire d'ajout d'utilisateur apparaît

---

## ✅ Étape 4: Remplir le Formulaire

### Remplir avec:
```
Email: test.provider@example.com
Password: Provider@123456
Confirm Password: Provider@123456
```

### Actions:
1. Entrer l'email
2. Entrer le mot de passe
3. Confirmer le mot de passe
4. Cliquer sur **"Save"**

### Résultat attendu:
L'utilisateur est créé et apparaît dans la liste

---

## ✅ Étape 5: Vérifier la Création

### Actions:
1. Chercher `test.provider@example.com` dans la liste
2. Vérifier que l'utilisateur est présent

### Résultat attendu:
L'utilisateur `test.provider@example.com` est visible dans la liste

---

## ✅ Étape 6: Ouvrir SQL Editor

### Actions:
1. Dans le menu de gauche, cliquer sur **"SQL Editor"**
2. Cliquer sur **"New Query"**
3. Donner un nom: **"Create Provider Profile"**
4. Cliquer sur **"Create"**

### Résultat attendu:
Un nouvel éditeur SQL vide s'ouvre

---

## ✅ Étape 7: Copier le Script

### Script à copier:

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

### Actions:
1. Sélectionner tout le script ci-dessus
2. Copier (Ctrl+C ou Cmd+C)
3. Coller dans l'éditeur SQL (Ctrl+V ou Cmd+V)

### Résultat attendu:
Le script apparaît dans l'éditeur SQL

---

## ✅ Étape 8: Exécuter le Script

### Actions:
1. Cliquer sur le bouton **"Run"** (en haut à droite)
2. Ou appuyer sur **Ctrl+Enter** (ou Cmd+Enter sur Mac)
3. Attendre quelques secondes

### Résultat attendu:
Un tableau s'affiche avec les informations du prestataire créé:

```
user_id: [UUID]
email: test.provider@example.com
full_name: Test Provider
profession: Electrician
verified: true
```

---

## ✅ Étape 9: Vérifier la Création

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

## ✅ Étape 10: Ouvrir l'Application

### Actions:
1. Ouvrir un nouvel onglet du navigateur
2. Aller à: **http://localhost:5173**
3. Attendre que l'application se charge

### Résultat attendu:
La page d'accueil de KaziPro s'affiche

---

## ✅ Étape 11: Se Connecter

### Actions:
1. Cliquer sur **"Connexion"** ou aller à `/connexion`
2. Entrer l'email: **test.provider@example.com**
3. Entrer le mot de passe: **Provider@123456**
4. Cliquer sur **"Se connecter"**

### Résultat attendu:
Vous êtes redirigé vers `/dashboard/prestataire`

---

## ✅ Étape 12: Vérifier le Tableau de Bord

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

### ❌ Erreur: "No rows returned"
**Cause:** L'utilisateur n'existe pas  
**Solution:** Créer l'utilisateur via Supabase Auth UI d'abord

### ❌ Erreur: "Duplicate key value"
**Cause:** Le profil existe déjà  
**Solution:** Utiliser un email différent

### ❌ Impossible de se connecter
**Cause:** Identifiants incorrects  
**Solution:** Vérifier l'email et le mot de passe exactement

### ❌ Redirigé vers "En attente"
**Cause:** Le prestataire n'est pas approuvé  
**Solution:** Connectez-vous en tant qu'admin et approuvez-le

---

## 📞 Besoin d'Aide?

Consultez:
- [PROVIDER_CREATION_CORRECT_METHOD.md](./PROVIDER_CREATION_CORRECT_METHOD.md) - Méthode correcte
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Dépannage
- [PROVIDER_CREATION_GUIDE.md](./PROVIDER_CREATION_GUIDE.md) - Guide complet

---

**Créé:** December 24, 2025  
**Status:** ✅ Prêt à utiliser  
**Durée:** 5 minutes

