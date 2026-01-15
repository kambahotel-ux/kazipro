# Résumé: Créer un Prestataire

## 🚀 Méthode la Plus Rapide (2 minutes)

### Copier-Coller ce Script dans Supabase SQL Editor:

```sql
WITH new_user AS (
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, is_sso_user)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'test.provider@example.com', crypt('Provider@123456', gen_salt('bf')), now(), now(), now(), '{\"provider\":\"email\",\"providers\":[\"email\"]}', '{}', false, false)
  ON CONFLICT (email) DO UPDATE SET updated_at = now()
  RETURNING id
)
INSERT INTO prestataires (user_id, full_name, profession, city, localisation, experience, bio, rating, verified, documents_verified, missions_completed, created_at)
SELECT new_user.id, 'Test Provider', 'Electrician', 'Kinshasa', 'Gombe', 5, 'Professional service provider', 4.5, true, false, 0, now()
FROM new_user
ON CONFLICT (user_id) DO UPDATE SET updated_at = now();

SELECT u.id, u.email, p.full_name, p.profession, p.verified FROM auth.users u LEFT JOIN prestataires p ON u.id = p.user_id WHERE u.email = 'test.provider@example.com';
```

### Puis Se Connecter:
```
Email: test.provider@example.com
Mot de passe: Provider@123456
```

---

## 📋 Détails du Compte

| Champ | Valeur |
|-------|--------|
| Email | test.provider@example.com |
| Mot de passe | Provider@123456 |
| Nom | Test Provider |
| Profession | Electrician |
| Ville | Kinshasa |
| Expérience | 5 ans |
| Vérifié | ✅ Oui |

---

## 🔗 Liens Utiles

- [Guide Complet](./PROVIDER_CREATION_GUIDE.md)
- [Méthode Rapide](./QUICK_CREATE_PROVIDER.md)
- [Guide Détaillé](./CREATE_TEST_PROVIDER.md)
- [Dépannage](./TROUBLESHOOTING.md)

---

**Status:** ✅ Prêt à utiliser

