# 🚀 Installation Rapide - Système de Litiges

## ⚡ Installation en 2 Minutes

### Étape 1: Créer la table litiges

1. Ouvrez **Supabase Dashboard**: https://app.supabase.com
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** dans le menu de gauche
4. Cliquez sur **New Query**
5. Ouvrez le fichier `sql/create_litiges_simple.sql` dans votre éditeur
6. **Copiez TOUT le contenu** du fichier
7. **Collez** dans l'éditeur SQL de Supabase
8. Cliquez sur **Run** (ou appuyez sur Ctrl+Enter)
9. Attendez le message de succès ✅

### Étape 2: Vérifier la création

1. Allez dans **Table Editor** (menu de gauche)
2. Cherchez la table `litiges` dans la liste
3. Cliquez dessus pour voir les données
4. Vous devriez voir **5 litiges de test** déjà créés

### Étape 3: Tester l'interface

1. Ouvrez votre application (http://localhost:8080)
2. Connectez-vous en tant qu'admin:
   - Email: `admin@kazipro.com`
   - Mot de passe: `Admin@123456`
3. Allez sur **Litiges** dans le menu
4. Vous devriez voir les 5 litiges de test
5. Cliquez sur un litige pour voir les détails
6. Testez les actions (Escalader, Résoudre)

---

## ✅ C'est tout!

Le système de litiges est maintenant opérationnel avec:
- ✅ Table créée
- ✅ 5 litiges de test
- ✅ Policies RLS configurées
- ✅ Interface fonctionnelle

---

## 🔒 (Optionnel) Sécurité Avancée

Si vous voulez des policies RLS plus restrictives:

1. Ouvrez **SQL Editor** dans Supabase
2. Ouvrez le fichier `sql/fix_litiges_rls.sql`
3. Copiez et collez le contenu
4. Exécutez

Cela limitera l'accès:
- Admin: accès complet
- Clients: seulement leurs litiges
- Prestataires: seulement leurs litiges

---

## 📊 Données de Test Créées

Le script crée automatiquement 5 litiges de test:

1. **Travail non terminé** (Délai, Haute priorité, Ouvert)
2. **Qualité insuffisante** (Qualité, Moyenne priorité, En cours)
3. **Paiement non reçu** (Paiement, Urgente, Ouvert)
4. **Matériaux non conformes** (Qualité, Haute priorité, Escaladé)
5. **Abandon de chantier** (Délai, Urgente, Escaladé)

---

## 🆘 Problèmes?

### Erreur: "permission denied for table users"
**Solution:** Utilisez `sql/create_litiges_simple.sql` au lieu de `sql/create_litiges_table.sql`

### Erreur: "relation litiges already exists"
**Solution:** La table existe déjà. Supprimez-la d'abord:
```sql
DROP TABLE IF EXISTS public.litiges CASCADE;
```
Puis réexécutez le script.

### Les litiges ne s'affichent pas
**Solution:** 
1. Vérifiez que vous êtes connecté en tant qu'admin
2. Vérifiez dans Table Editor que la table contient des données
3. Vérifiez la console du navigateur pour les erreurs

---

## 📝 Prochaines Étapes

Après l'installation, vous pouvez:
1. Créer de vrais litiges depuis l'interface
2. Tester le workflow complet (escalader, résoudre)
3. Lier les litiges à de vraies missions
4. Configurer les notifications
5. Personnaliser les types de litiges

---

**Installation terminée! Le système de litiges est prêt à l'emploi. 🎉**
