# Fix Admin Data Visibility - KaziPro

## Problème
L'admin ne peut pas voir les données existantes (clients, demandes, etc.) dans le dashboard admin.

**Cause:** Les RLS (Row Level Security) policies empêchent l'admin de voir les données des autres utilisateurs.

---

## Solution

### Étape 1: Exécuter le Script SQL

1. **Ouvrir Supabase Dashboard**
   - Aller à: https://supabase.com/dashboard
   - Sélectionner le projet: `qbasvwwerkpmsbzfrydj`

2. **Aller à SQL Editor**
   - Cliquer sur **SQL Editor**
   - Cliquer sur **New query**

3. **Copier le Script**
   - Ouvrir le fichier: `sql/fix_admin_rls.sql`
   - Copier tout le contenu

4. **Exécuter le Script**
   - Coller le contenu dans SQL Editor
   - Cliquer sur **Run**
   - Attendre la confirmation

### Étape 2: Vérifier les Données

Après exécution du script, vérifier que les données sont visibles:

```sql
-- Vérifier les clients
SELECT COUNT(*) as total_clients FROM clients;
SELECT id, full_name, user_id FROM clients;

-- Vérifier les demandes
SELECT COUNT(*) as total_demandes FROM demandes;
SELECT id, titre, description FROM demandes;

-- Vérifier les prestataires
SELECT COUNT(*) as total_prestataires FROM prestataires;
SELECT id, full_name, profession FROM prestataires;
```

### Étape 3: Tester dans l'App

1. **Rafraîchir le navigateur**
   - Appuyer sur F5 ou Ctrl+R

2. **Aller au Dashboard Admin**
   - URL: `http://localhost:5173/dashboard/admin`

3. **Vérifier les Pages**
   - [ ] Page Utilisateurs: affiche les clients et prestataires
   - [ ] Page Demandes: affiche les demandes
   - [ ] Page Prestataires: affiche les prestataires
   - [ ] Dashboard: affiche les statistiques correctes

---

## Qu'est-ce que le Script Fait?

### 1. Désactive RLS Temporairement
- Permet de vérifier que les données existent
- Évite les erreurs de permission

### 2. Supprime les Anciennes Policies
- Supprime les policies restrictives
- Prépare pour les nouvelles policies

### 3. Crée Nouvelles Policies
- Permet à l'admin de voir TOUTES les données
- Permet aux utilisateurs de voir leurs propres données
- Utilise l'email admin: `admin@kazipro.com`

### 4. Réactive RLS
- Réactive la sécurité
- Applique les nouvelles policies

---

## Policies Créées

### Pour chaque table (clients, prestataires, demandes, etc.):

**SELECT (Lecture):**
- L'utilisateur peut voir ses propres données
- L'admin peut voir TOUTES les données

**INSERT (Création):**
- L'utilisateur peut créer ses propres données
- L'admin peut créer des données

**UPDATE (Modification):**
- L'utilisateur peut modifier ses propres données
- L'admin peut modifier les données

**DELETE (Suppression):**
- L'utilisateur peut supprimer ses propres données
- L'admin peut supprimer les données

---

## Vérification

Après exécution, vérifier que:

1. **Les données existent**
   ```sql
   SELECT COUNT(*) FROM clients;
   SELECT COUNT(*) FROM demandes;
   SELECT COUNT(*) FROM prestataires;
   ```

2. **Les policies sont créées**
   ```sql
   SELECT tablename, policyname FROM pg_policies 
   WHERE tablename IN ('clients', 'demandes', 'prestataires');
   ```

3. **L'admin peut voir les données**
   - Aller au dashboard admin
   - Vérifier que les utilisateurs s'affichent
   - Vérifier que les demandes s'affichent

---

## Troubleshooting

### Erreur: "Permission denied"
- Vérifier que l'admin email est exactement: `admin@kazipro.com`
- Vérifier que le script a été exécuté complètement
- Essayer de rafraîchir la page

### Erreur: "Policy already exists"
- Le script a déjà été exécuté
- Les policies existent déjà
- Pas besoin de réexécuter

### Les données ne s'affichent toujours pas
1. Vérifier que les données existent:
   ```sql
   SELECT * FROM clients LIMIT 1;
   SELECT * FROM demandes LIMIT 1;
   ```

2. Vérifier les policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'clients';
   ```

3. Vérifier l'email admin:
   ```sql
   SELECT email FROM auth.users WHERE email = 'admin@kazipro.com';
   ```

---

## Sécurité

⚠️ **Important:**
- Ces policies permettent à l'admin de voir TOUTES les données
- C'est normal pour un admin
- Les utilisateurs normaux ne peuvent voir que leurs propres données
- Les données sensibles (mots de passe) ne sont jamais visibles

---

## Prochaines Étapes

Après avoir fixé la visibilité des données:

1. Tester le dashboard admin
2. Vérifier que toutes les pages affichent les données
3. Tester les actions (approuver, rejeter, etc.)
4. Continuer avec les tests du plan de test

---

**Last Updated:** 22 December 2025  
**Status:** Ready to Execute
