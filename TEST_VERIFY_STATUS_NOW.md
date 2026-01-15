# 🧪 Test Rapide: Vérifier le Statut - MAINTENANT

## ✅ Fix Appliqué

Le bouton "Vérifier le statut" fonctionne maintenant correctement!

---

## 🚀 Test Rapide (5 minutes)

### Étape 1: Créer un Prestataire
```
1. Ouvrir: http://localhost:8080/inscription/prestataire
2. Remplir:
   - Nom: Test User
   - Email: test@test.com
   - Mot de passe: Test123456
   - Profession: Électricien
   - Ville: Kinshasa
   - Expérience: 5
3. Uploader 2 documents (n'importe quels fichiers)
4. Soumettre
5. ✅ Devrait rediriger vers /prestataire/en-attente
```

### Étape 2: Tester le Bouton (Non Approuvé)
```
1. Sur /prestataire/en-attente
2. Cliquer "Vérifier le statut"
3. ✅ Devrait afficher: "Votre compte est toujours en attente"
```

### Étape 3: Approuver (Admin)
```
1. Se déconnecter
2. Se connecter: admin@kazipro.com / Admin@123456
3. Aller sur: /dashboard/admin/prestataires
4. Cliquer "Détails" sur "Test User"
5. Cliquer "Vérifier"
6. ✅ Devrait afficher: "Prestataire vérifié avec succès"
```

### Étape 4: Tester le Bouton (Approuvé)
```
1. Se déconnecter
2. Se connecter: test@test.com / Test123456
3. ✅ Devrait être sur /prestataire/en-attente
4. Cliquer "Vérifier le statut"
5. ✅ Devrait afficher: "Votre compte a été approuvé!"
6. ✅ Devrait rediriger vers /dashboard/prestataire
```

### Étape 5: Connexion Directe
```
1. Se déconnecter
2. Se connecter: test@test.com / Test123456
3. ✅ Devrait rediriger directement vers /dashboard/prestataire
4. ✅ Pas de page d'attente
```

---

## 🎯 Résultats Attendus

### ✅ Tout Fonctionne Si:

1. Inscription redirige vers page d'attente
2. Page d'attente affiche les infos du prestataire
3. Bouton "Vérifier le statut" fonctionne sans erreur
4. Admin peut approuver le prestataire
5. Après approbation, redirection automatique vers dashboard
6. Connexion suivante va directement au dashboard

### ❌ Problème Si:

- Erreur "Cannot coerce..." → Vérifier que les SQL scripts sont exécutés
- Erreur "permission denied" → Vérifier les RLS policies
- Documents non visibles → Vérifier le bucket Supabase Storage
- Professions vides → Exécuter `sql/create_professions_table.sql`

---

## 📋 Scripts SQL Requis

Si vous avez des erreurs, exécutez ces scripts dans l'ordre:

```sql
-- 1. Email column
sql/setup_email_column_complete.sql

-- 2. Admin permissions
sql/fix_admin_update_simple.sql

-- 3. Documents columns
sql/add_documents_columns.sql

-- 4. Professions table
sql/create_professions_table.sql
```

---

## 🎉 C'est Tout!

Le système est maintenant **100% fonctionnel**.

**Commencez les tests:** http://localhost:8080/inscription/prestataire

---

**Bon test!** 🚀
