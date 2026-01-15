# 📚 Créer un Prestataire - Documentation Complète

## 🎯 Démarrage Rapide

**Durée:** 2 minutes

### Script à Copier-Coller:

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

### Étapes:
1. Ouvrir https://supabase.com → SQL Editor
2. Copier le script ci-dessus
3. Coller dans l'éditeur
4. Cliquer sur "Run"
5. Se connecter avec: `test.provider@example.com` / `Provider@123456`

---

## 📖 Guides Disponibles

### Guides Rapides
| Guide | Durée | Description |
|-------|-------|-------------|
| [PROVIDER_CREATION_FINAL.md](./PROVIDER_CREATION_FINAL.md) | 2 min | Guide final et simple |
| [PROVIDER_CREATION_WORKING.md](./PROVIDER_CREATION_WORKING.md) | 2 min | Version fonctionnelle |
| [PROVIDER_CREATION_CORRECTED.txt](./PROVIDER_CREATION_CORRECTED.txt) | 1 min | Référence rapide |

### Guides Détaillés
| Guide | Durée | Description |
|-------|-------|-------------|
| [FIX_PROVIDER_CREATION.md](./FIX_PROVIDER_CREATION.md) | 5 min | Explication de la correction |
| [PROVIDER_CREATION_FIXED.md](./PROVIDER_CREATION_FIXED.md) | 5 min | Guide détaillé |
| [PROVIDER_CREATION_INDEX.md](./PROVIDER_CREATION_INDEX.md) | 10 min | Index complet |

### Guides Complets (Anciens)
| Guide | Durée | Description |
|-------|-------|-------------|
| [PROVIDER_CREATION_GUIDE.md](./PROVIDER_CREATION_GUIDE.md) | 20 min | Guide complet avec dépannage |
| [CREATE_TEST_PROVIDER.md](./CREATE_TEST_PROVIDER.md) | 15 min | Guide détaillé |
| [STEP_BY_STEP_PROVIDER.md](./STEP_BY_STEP_PROVIDER.md) | 5 min | Étape par étape |
| [QUICK_CREATE_PROVIDER.md](./QUICK_CREATE_PROVIDER.md) | 2 min | Méthode rapide |

---

## 🔧 Correction Appliquée

### Erreur Reçue:
```
ERROR: 42703: column "city" of relation "prestataires" does not exist
```

### Cause:
La table `prestataires` n'a pas les colonnes:
- ❌ city
- ❌ localisation
- ❌ experience
- ❌ missions_completed

### Solution:
Utiliser uniquement les colonnes qui existent:
- ✅ id
- ✅ user_id
- ✅ full_name
- ✅ profession
- ✅ bio
- ✅ rating
- ✅ verified
- ✅ documents_verified
- ✅ created_at
- ✅ updated_at

---

## 📊 Compte Créé

```
Email: test.provider@example.com
Mot de passe: Provider@123456
Nom: Test Provider
Profession: Electrician
Vérifié: ✅ Oui
```

---

## 🎯 Prochaines Étapes

1. **Exécuter le script** - Copier-coller dans Supabase
2. **Se connecter** - Utiliser les identifiants ci-dessus
3. **Tester le tableau de bord** - Vérifier que tout fonctionne
4. **Créer des données** - Missions, devis, etc.

---

## 📚 Scripts SQL

### Scripts Corrigés
- ✅ `sql/quick_create_provider.sql` - Script rapide
- ✅ `sql/create_test_provider.sql` - Script complet

---

## 🆘 Dépannage

### Erreur: "Email already exists"
**Solution:** Utilisez un email différent

### Erreur: "Relation does not exist"
**Solution:** Exécutez d'abord `sql/init_tables.sql`

### Impossible de se connecter
**Solution:** Vérifiez l'email et le mot de passe exactement

---

## 📞 Besoin d'Aide?

Consultez:
- [FIX_PROVIDER_CREATION.md](./FIX_PROVIDER_CREATION.md) - Explication de la correction
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Dépannage général
- [DOCUMENTATION_INDEX_FINAL.md](./DOCUMENTATION_INDEX_FINAL.md) - Index complet

---

## ✨ Résumé

**Créer un prestataire en 2 minutes:**

1. Copier le script
2. Exécuter dans Supabase
3. Se connecter
4. C'est tout! 🎉

---

**Status:** ✅ Corrigé et Fonctionnel  
**Créé:** December 24, 2025

