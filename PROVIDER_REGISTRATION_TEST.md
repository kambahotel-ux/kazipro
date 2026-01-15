# ✅ Tester l'Inscription Prestataire

## 🎯 Objectif

Tester que l'inscription prestataire fonctionne correctement avec les corrections appliquées.

---

## 🚀 Étapes de Test

### Étape 1: Ouvrir l'Application

1. Ouvrir: http://localhost:5173
2. Cliquer sur "S'inscrire"
3. Sélectionner "Prestataire"

### Étape 2: Remplir le Formulaire

```
Nom complet: Jean Mukeba
Email: jean.mukeba@example.com
Profession: Electrician
Ville: Kinshasa
Années d'expérience: 5
Mot de passe: Test@123456
Confirmer: Test@123456
```

### Étape 3: Soumettre

1. Cliquer sur "S'inscrire"
2. Attendre le message: "Code OTP envoyé à votre email !"

### Étape 4: Vérifier l'OTP

1. Vérifier votre email
2. Copier le code OTP
3. Coller le code dans l'application
4. Cliquer sur "Vérifier"

### Étape 5: Vérifier la Création

1. Aller à Supabase Console
2. Aller à: SQL Editor
3. Exécuter cette requête:

```sql
SELECT 
  u.id,
  u.email,
  p.full_name,
  p.profession,
  p.verified
FROM auth.users u
LEFT JOIN prestataires p ON u.id = p.user_id
WHERE u.email = 'jean.mukeba@example.com';
```

4. Vous devriez voir:
```
id: [UUID]
email: jean.mukeba@example.com
full_name: Jean Mukeba
profession: Electrician
verified: false
```

### Étape 6: Se Connecter

1. Aller à: http://localhost:5173/connexion
2. Entrer:
   - Email: jean.mukeba@example.com
   - Mot de passe: Test@123456
3. Cliquer sur "Se connecter"

### Étape 7: Vérifier l'Accès

1. Vous devriez être redirigé vers `/prestataire/en-attente`
2. Message: "Votre compte est en attente d'approbation"

### Étape 8: Approuver le Prestataire

1. Se connecter en tant qu'admin: admin@kazipro.com / Admin@123456
2. Aller à: /dashboard/admin/prestataires
3. Trouver "Jean Mukeba" dans "En attente"
4. Cliquer sur "Vérifier"

### Étape 9: Se Connecter à Nouveau

1. Se déconnecter
2. Se connecter avec: jean.mukeba@example.com / Test@123456
3. Vous devriez être redirigé vers `/dashboard/prestataire`

---

## ✅ Résultats Attendus

### Après Inscription
- ✅ Code OTP envoyé
- ✅ Utilisateur créé dans `auth.users`
- ✅ Données stockées dans `user_metadata`

### Après Vérification OTP
- ✅ Profil créé dans `prestataires`
- ✅ Redirection vers login
- ✅ Utilisateur peut se connecter

### Après Connexion (Avant Approbation)
- ✅ Redirigé vers `/prestataire/en-attente`
- ✅ Message d'attente d'approbation

### Après Approbation
- ✅ Redirigé vers `/dashboard/prestataire`
- ✅ Accès au tableau de bord

---

## 🆘 Dépannage

### Erreur: "Could not find the 'city' column"
**Solution:** Les corrections ont été appliquées. Rechargez l'application.

### Erreur: "Email already exists"
**Solution:** Utilisez un email différent

### Pas de profil créé
**Solution:** Vérifiez que l'OTP a été vérifié correctement

### Impossible de se connecter
**Solution:** Vérifiez l'email et le mot de passe exactement

---

## 📚 Guides

- [PROVIDER_REGISTRATION_FIXED.md](./PROVIDER_REGISTRATION_FIXED.md) - Corrections appliquées
- [PROVIDER_APPROVAL_SYSTEM.md](./PROVIDER_APPROVAL_SYSTEM.md) - Système d'approbation
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Dépannage

---

**Status:** ✅ Prêt à Tester  
**Créé:** December 24, 2025

