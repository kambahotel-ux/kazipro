# ✅ Créer un Prestataire - Guide Complet

## 🎯 Résumé Exécutif

Vous pouvez créer un prestataire en **2 minutes** en exécutant un script SQL dans Supabase.

---

## 🚀 Méthode Rapide (Recommandée)

### 1️⃣ Ouvrir Supabase SQL Editor
```
https://supabase.com → Votre Projet → SQL Editor → New Query
```

### 2️⃣ Copier le Script
```sql
WITH new_user AS (
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, is_sso_user)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'test.provider@example.com', crypt('Provider@123456', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, false)
  ON CONFLICT (email) DO UPDATE SET updated_at = now()
  RETURNING id
)
INSERT INTO prestataires (user_id, full_name, profession, city, localisation, experience, bio, rating, verified, documents_verified, missions_completed, created_at)
SELECT new_user.id, 'Test Provider', 'Electrician', 'Kinshasa', 'Gombe', 5, 'Professional service provider', 4.5, true, false, 0, now()
FROM new_user
ON CONFLICT (user_id) DO UPDATE SET updated_at = now();

SELECT u.id, u.email, p.full_name, p.profession, p.verified FROM auth.users u LEFT JOIN prestataires p ON u.id = p.user_id WHERE u.email = 'test.provider@example.com';
```

### 3️⃣ Exécuter
```
Cliquer sur "Run" ou Ctrl+Enter
```

### 4️⃣ Se Connecter
```
URL: http://localhost:5173/connexion
Email: test.provider@example.com
Mot de passe: Provider@123456
```

### 5️⃣ Vérifier
```
Vous devriez être redirigé vers /dashboard/prestataire
```

---

## 📊 Compte Créé

| Propriété | Valeur |
|-----------|--------|
| **Email** | test.provider@example.com |
| **Mot de passe** | Provider@123456 |
| **Nom** | Test Provider |
| **Profession** | Electrician |
| **Ville** | Kinshasa |
| **Expérience** | 5 ans |
| **Vérifié** | ✅ Oui |
| **Statut** | Actif |

---

## 🎯 Pages Disponibles

Après la connexion, vous pouvez accéder à:

```
✅ /dashboard/prestataire              - Tableau de bord principal
✅ /dashboard/prestataire/missions     - Gestion des missions
✅ /dashboard/prestataire/devis        - Gestion des devis
✅ /dashboard/prestataire/calendrier   - Calendrier des missions
✅ /dashboard/prestataire/revenus      - Suivi des revenus
✅ /dashboard/prestataire/messages     - Messagerie
✅ /dashboard/prestataire/profil       - Profil public
✅ /dashboard/prestataire/parametres   - Paramètres du compte
```

---

## 🔧 Personnaliser le Prestataire

Pour créer un prestataire avec des informations différentes, modifiez ces lignes dans le script:

```sql
-- Modifier ces valeurs:
email = 'votre.email@example.com',
full_name = 'Votre Nom',
profession = 'Votre Profession',
city = 'Votre Ville',
experience = 10,
bio = 'Votre bio',
rating = 4.8,
```

---

## 📋 Guides Disponibles

| Guide | Durée | Description |
|-------|-------|-------------|
| [STEP_BY_STEP_PROVIDER.md](./STEP_BY_STEP_PROVIDER.md) | 5 min | Guide étape par étape avec images |
| [QUICK_CREATE_PROVIDER.md](./QUICK_CREATE_PROVIDER.md) | 2 min | Méthode rapide |
| [PROVIDER_CREATION_GUIDE.md](./PROVIDER_CREATION_GUIDE.md) | 10 min | Guide complet avec dépannage |
| [CREATE_TEST_PROVIDER.md](./CREATE_TEST_PROVIDER.md) | 15 min | Guide détaillé avec options |
| [PROVIDER_CREATION_QUICK_REFERENCE.txt](./PROVIDER_CREATION_QUICK_REFERENCE.txt) | 1 min | Référence rapide |

---

## ✅ Checklist

- [ ] Supabase ouvert
- [ ] SQL Editor ouvert
- [ ] Script copié
- [ ] Script exécuté
- [ ] Résultat vérifié
- [ ] Application ouverte
- [ ] Connexion réussie
- [ ] Tableau de bord visible

---

## 🆘 Dépannage Rapide

### ❌ "Email already exists"
**Solution:** Utilisez un email différent

### ❌ "Relation does not exist"
**Solution:** Exécutez `sql/init_tables.sql` d'abord

### ❌ Impossible de se connecter
**Solution:** Vérifiez l'email et le mot de passe exactement

### ❌ Redirigé vers "En attente"
**Solution:** Connectez-vous en tant qu'admin et approuvez

---

## 📞 Autres Comptes de Test

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

---

## 🎉 Prochaines Étapes

Après la création du prestataire:

1. **Tester le tableau de bord**
   - Vérifier que toutes les pages se chargent
   - Vérifier que les données s'affichent

2. **Tester les fonctionnalités**
   - Créer des missions
   - Créer des devis
   - Modifier le profil

3. **Tester l'intégration**
   - Vérifier que les données réelles s'affichent
   - Vérifier que les erreurs s'affichent correctement

---

## 📚 Documentation Complète

- [README_FINAL.md](./README_FINAL.md) - Vue d'ensemble du projet
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Guide de déploiement
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Dépannage général
- [DOCUMENTATION_INDEX_FINAL.md](./DOCUMENTATION_INDEX_FINAL.md) - Index complet

---

## ✨ Résumé

**Créer un prestataire en 2 minutes:**

1. Ouvrir Supabase SQL Editor
2. Copier le script SQL
3. Exécuter
4. Se connecter avec les identifiants
5. Accéder au tableau de bord

**C'est tout! 🎉**

---

**Créé:** December 24, 2025  
**Status:** ✅ Prêt à utiliser  
**Durée:** 2 minutes

