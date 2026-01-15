# Créer un Utilisateur Prestataire de Test

## Option 1: Via l'Interface Web (Recommandé)

### Étapes:

1. **Ouvrir l'application**
   - Allez à `http://localhost:5173`

2. **Aller à l'inscription prestataire**
   - Cliquez sur "S'inscrire" ou allez à `/inscription/prestataire`

3. **Remplir le formulaire**
   ```
   Nom complet: Test Provider
   Email: test.provider@example.com
   Profession: Electrician
   Ville: Kinshasa
   Années d'expérience: 5
   Mot de passe: Provider@123456
   Confirmer mot de passe: Provider@123456
   ```

4. **Soumettre le formulaire**
   - Cliquez sur "S'inscrire"

5. **Vérifier l'OTP**
   - Vous recevrez un code OTP
   - Entrez le code sur la page de vérification
   - Cliquez sur "Vérifier"

6. **Approuver le prestataire**
   - Connectez-vous en tant qu'admin: `admin@kazipro.com` / `Admin@123456`
   - Allez à `/dashboard/admin/prestataires`
   - Trouvez "Test Provider" dans l'onglet "En attente"
   - Cliquez sur "Vérifier" pour approuver

7. **Se connecter en tant que prestataire**
   - Déconnectez-vous
   - Connectez-vous avec: `test.provider@example.com` / `Provider@123456`
   - Vous serez redirigé vers `/dashboard/prestataire`

---

## Option 2: Via SQL (Rapide)

### Étapes:

1. **Ouvrir Supabase Console**
   - Allez à https://supabase.com
   - Connectez-vous à votre projet
   - Allez à "SQL Editor"

2. **Exécuter le script SQL**
   - Ouvrez le fichier `sql/create_test_provider.sql`
   - Copiez tout le contenu
   - Collez-le dans l'éditeur SQL de Supabase
   - Cliquez sur "Run"

3. **Vérifier la création**
   - Le script affichera les détails du prestataire créé
   - Vous devriez voir:
     ```
     id: [UUID]
     email: test.provider@example.com
     full_name: Test Provider
     profession: Electrician
     verified: true
     ```

4. **Se connecter**
   - Allez à `http://localhost:5173/connexion`
   - Connectez-vous avec:
     - Email: `test.provider@example.com`
     - Mot de passe: `Provider@123456`
   - Vous serez redirigé vers `/dashboard/prestataire`

---

## Détails du Compte Créé

### Informations de Connexion
```
Email: test.provider@example.com
Mot de passe: Provider@123456
```

### Profil
```
Nom complet: Test Provider
Profession: Electrician
Ville: Kinshasa
Localisation: Gombe
Années d'expérience: 5
Bio: Professional service provider
Note: 4.5/5
Vérifié: Oui
Missions complétées: 0
```

---

## Vérifier la Création

### Via l'Application
1. Connectez-vous avec le compte prestataire
2. Allez à `/dashboard/prestataire`
3. Vous devriez voir le tableau de bord du prestataire
4. Allez à `/dashboard/prestataire/profil` pour voir le profil

### Via Supabase Console
1. Allez à "SQL Editor"
2. Exécutez cette requête:
   ```sql
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
3. Vous devriez voir une ligne avec les détails du prestataire

---

## Dépannage

### Le prestataire ne peut pas se connecter
- Vérifiez que l'email est correct: `test.provider@example.com`
- Vérifiez que le mot de passe est correct: `Provider@123456`
- Vérifiez que `verified: true` dans la base de données

### Le prestataire est redirigé vers la page d'attente
- Cela signifie que `verified: false`
- Connectez-vous en tant qu'admin
- Allez à `/dashboard/admin/prestataires`
- Cliquez sur "Vérifier" pour approuver

### Le prestataire ne voit pas ses données
- Vérifiez que le profil est créé dans la table `prestataires`
- Vérifiez que `user_id` correspond à l'ID de l'utilisateur auth

---

## Créer d'Autres Prestataires

Pour créer d'autres prestataires, modifiez le script SQL:

```sql
-- Changez ces valeurs:
email = 'autre.email@example.com',
full_name = 'Autre Nom',
profession = 'Autre Profession',
city = 'Autre Ville',
experience = 3,
```

Puis exécutez le script modifié.

---

## Comptes de Test Disponibles

### Admin
```
Email: admin@kazipro.com
Mot de passe: Admin@123456
```

### Client
```
Email: marie@example.com
Mot de passe: Test@123456
```

### Prestataire (Créé)
```
Email: test.provider@example.com
Mot de passe: Provider@123456
```

---

## Prochaines Étapes

Après avoir créé le prestataire:

1. **Tester le tableau de bord**
   - Allez à `/dashboard/prestataire`
   - Vérifiez que toutes les pages se chargent

2. **Tester les fonctionnalités**
   - Allez à `/dashboard/prestataire/missions`
   - Allez à `/dashboard/prestataire/devis`
   - Allez à `/dashboard/prestataire/revenus`
   - Allez à `/dashboard/prestataire/parametres`

3. **Tester les données**
   - Vérifiez que les données réelles s'affichent
   - Vérifiez que le nom du prestataire s'affiche correctement

---

**Créé:** December 24, 2025  
**Status:** ✅ Prêt à utiliser

