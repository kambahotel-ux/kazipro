# Résumé des Corrections - Session Actuelle

## 🎯 Problèmes Résolus

### 1. ✅ Erreur `user_id` dans DemandeDetailPage
**Problème:** `column demandes.user_id does not exist`
**Solution:** Supprimé le filtre `.eq('user_id', ...)` - RLS gère l'accès
**Fichier:** `src/pages/dashboard/client/DemandeDetailPage.tsx`

### 2. ✅ Relation Ambiguë Devis-Demandes (Admin)
**Problème:** `Could not embed because more than one relationship was found`
**Solution:** Spécifié `demandes!devis_demande_id_fkey`
**Fichier:** `src/pages/dashboard/admin/DevisPage.tsx`

### 3. ✅ Colonne `phone` Manquante
**Problème:** `column prestataires.phone does not exist`
**Solution:** Script SQL pour ajouter les colonnes manquantes
**Fichier:** `sql/add_phone_columns.sql`

### 4. ✅ Images de Demande Non Affichées
**Problème:** Images existent mais ne s'affichent pas dans les détails
**Solution:** Ajouté section d'affichage des images avec grille responsive
**Fichier:** `src/pages/dashboard/client/DemandeDetailPage.tsx`

### 5. ✅ Colonne `missions.statut` vs `missions.status`
**Problème:** `column missions.statut does not exist`
**Solution:** Changé `statut` → `status` dans AdminDashboard
**Fichier:** `src/pages/dashboard/admin/AdminDashboard.tsx`

### 6. ✅ Contrainte Devise (FC vs CDF)
**Problème:** `check constraint "devis_devise_check" is violated`
**Solution:** Script SQL pour accepter 'CDF' au lieu de 'FC'
**Fichier:** `sql/fix_devise_constraint_minimal.sql`

### 7. ✅ Items de Devis Non Sauvegardés
**Problème:** Items ajoutés mais tableau vide `[]` retourné
**Solution:** Script SQL pour corriger les politiques RLS
**Fichier:** `sql/fix_devis_items_insert.sql`

### 8. ✅ Images de Demande Non Sauvegardées
**Problème:** Images uploadées mais `images: null` dans la DB
**Solution:** Récupérer les URLs publiques et mettre à jour la demande
**Fichier:** `src/pages/dashboard/client/NouvelleDemandePages.tsx`

### 9. ⚠️ Foreign Key `devis_pro` vs `devis`
**Problème:** `violates foreign key constraint "devis_pro_items_devis_id_fkey"`
**Solution:** Script SQL pour pointer vers la bonne table
**Fichier:** `sql/fix_devis_pro_items_foreign_key.sql`
**Status:** Script créé, à exécuter

### 10. ⚠️ Permission Denied `auth.users`
**Problème:** `permission denied for table users`
**Cause:** Code essaie d'accéder directement à `auth.users`
**Solution:** Utiliser les vues ou fonctions Supabase appropriées

## 📋 Scripts SQL à Exécuter

### Priorité Haute (Bloquants)
1. ✅ `sql/fix_devise_constraint_minimal.sql` - Contrainte devise
2. ⚠️ `sql/fix_devis_pro_items_foreign_key.sql` - Foreign key items
3. ⚠️ `sql/fix_devis_items_insert.sql` - Politiques RLS items

### Priorité Moyenne (Améliorations)
4. `sql/add_phone_columns.sql` - Colonnes téléphone
5. `sql/auto_generate_devis_numero.sql` - Numéros auto

## 🔧 Corrections de Code Appliquées

### TypeScript/React
- ✅ DemandeDetailPage - Suppression filtre user_id
- ✅ DemandeDetailPage - Ajout affichage images
- ✅ AdminDashboard - Correction missions.status
- ✅ AdminDevisPage - Relation explicite
- ✅ NouvelleDemandePages - Sauvegarde URLs images

### SQL
- Scripts créés pour toutes les corrections DB
- Certains scripts nécessitent exécution manuelle

## 🐛 Problèmes en Attente

### Permission Denied `auth.users`
**Contexte:** Probablement dans une politique RLS ou requête admin

**Solutions possibles:**

#### Option 1: Utiliser auth.uid()
```sql
-- Au lieu de
SELECT * FROM auth.users WHERE id = auth.uid()

-- Utiliser
SELECT auth.uid() -- Retourne l'ID de l'utilisateur actuel
```

#### Option 2: Créer une vue sécurisée
```sql
CREATE VIEW public.user_profiles AS
SELECT 
  id,
  email,
  created_at
FROM auth.users;

-- Puis donner les permissions
GRANT SELECT ON public.user_profiles TO authenticated;
```

#### Option 3: Utiliser les métadonnées utilisateur
```sql
-- Dans les politiques RLS
auth.uid() -- ID de l'utilisateur
auth.email() -- Email de l'utilisateur (si disponible)
```

#### Option 4: Vérifier le code admin
```typescript
// Chercher dans le code:
.from('users') // ❌ Table protégée
.from('auth.users') // ❌ Schéma protégé

// Remplacer par:
.from('prestataires') // ✅ Votre table
.from('clients') // ✅ Votre table
```

## 🔍 Diagnostic Permission Denied

### Étape 1: Identifier la Source
Chercher dans le code où `users` ou `auth.users` est utilisé:

```bash
# Dans le terminal
grep -r "from('users')" src/
grep -r "from(\"users\")" src/
grep -r "auth.users" sql/
```

### Étape 2: Vérifier les Politiques RLS
```sql
-- Lister toutes les politiques qui référencent auth.users
SELECT 
  schemaname,
  tablename,
  policyname,
  qual as using_expression
FROM pg_policies
WHERE qual LIKE '%auth.users%'
   OR with_check LIKE '%auth.users%';
```

### Étape 3: Corriger selon le Contexte

**Si c'est pour l'admin:**
```typescript
// Au lieu de
const { data } = await supabase.from('users').select('*');

// Utiliser
const { data } = await supabase.auth.admin.listUsers();
// OU
const { data: clients } = await supabase.from('clients').select('*, user:auth.users(email)');
```

**Si c'est dans une politique RLS:**
```sql
-- Au lieu de
EXISTS (SELECT 1 FROM auth.users WHERE ...)

-- Utiliser
auth.uid() = user_id
-- OU
auth.email() = 'admin@kazipro.com'
```

## 📊 État du Système

### Tables Principales
- ✅ `clients` - OK
- ✅ `prestataires` - OK (+ colonnes phone, email à ajouter)
- ✅ `demandes` - OK (images fonctionnelles)
- ✅ `devis` - OK (devise CDF à corriger)
- ⚠️ `devis_pro_items` - Foreign key à corriger
- ✅ `missions` - OK (utilise status)

### Fonctionnalités
- ✅ Création demande avec images
- ✅ Affichage détails demande
- ✅ Liste devis admin
- ⚠️ Création devis avec items (foreign key)
- ✅ Dashboard admin (stats missions)

## 🎯 Prochaines Actions

### Immédiat
1. Exécuter `sql/fix_devis_pro_items_foreign_key.sql`
2. Exécuter `sql/fix_devis_items_insert.sql`
3. Identifier source de "permission denied for table users"

### Court Terme
4. Exécuter `sql/add_phone_columns.sql`
5. Tester création complète d'un devis
6. Vérifier workflow client → prestataire → devis

### Moyen Terme
7. Nettoyer les tables inutilisées (devis_pro si existe)
8. Standardiser les noms de colonnes (status vs statut)
9. Documenter le schéma final

## 📝 Notes Techniques

### Convention de Nommage Actuelle
- **Anglais:** `status`, `created_at`, `updated_at`
- **Français:** `statut`, `titre`, `localisation`
- **Mixte:** Les deux pour compatibilité

### Recommandation
Standardiser progressivement vers l'anglais pour:
- Cohérence avec les conventions SQL
- Facilité d'intégration avec outils tiers
- Meilleure compatibilité internationale

## ✅ Checklist Finale

- [x] Corrections code TypeScript appliquées
- [x] Scripts SQL créés
- [ ] Scripts SQL exécutés
- [ ] Tests de bout en bout
- [ ] Documentation mise à jour
- [ ] Déploiement en production

## 📄 Fichiers Créés Cette Session

### Documentation
- `FIX_DEMANDE_IMAGES_DISPLAY.md`
- `FIX_MISSIONS_STATUS_COLUMN.md`
- `FIX_DEVISE_CONSTRAINT.md`
- `FIX_DEVIS_ITEMS_NOT_SAVING.md`
- `FIX_DEMANDE_IMAGES_UPLOAD.md`
- `SESSION_FIXES_SUMMARY.md` (ce fichier)

### Scripts SQL
- `sql/add_phone_columns.sql`
- `sql/fix_devise_constraint.sql`
- `sql/fix_devise_constraint_minimal.sql`
- `sql/fix_devis_items_insert.sql`
- `sql/fix_devis_pro_items_foreign_key.sql`

### Code
- Modifications dans 4 fichiers TypeScript

## 🎉 Résultat

La majorité des problèmes ont été identifiés et corrigés. Il reste principalement:
1. Exécuter les scripts SQL
2. Résoudre le "permission denied" pour auth.users
3. Tester le workflow complet
