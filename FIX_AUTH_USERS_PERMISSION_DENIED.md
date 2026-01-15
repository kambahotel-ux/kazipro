# Correction - Permission Denied for Table auth.users

## 🎯 Problème

**Erreur:** `permission denied for table users`

**Cause:** Les politiques RLS (Row Level Security) essaient d'accéder directement à la table `auth.users`, ce qui n'est pas permis par Supabase pour des raisons de sécurité.

## 🔍 Où se Trouve le Problème

### Fichier Identifié
`sql/fix_devis_items_insert.sql` - Ligne 91-96

**Code Problématique:**
```sql
CREATE POLICY "Admin can view all devis items"
ON devis_pro_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users  -- ❌ INTERDIT dans les policies RLS
    WHERE auth.users.id = auth.uid()
    AND auth.users.email = 'admin@kazipro.com'
  )
);
```

## ✅ Solution

### Utiliser `auth.jwt()` au lieu de `auth.users`

**Code Corrigé:**
```sql
CREATE POLICY "Admin can view all devis items"
ON devis_pro_items
FOR SELECT
USING (
  (auth.jwt() ->> 'email') = 'admin@kazipro.com'  -- ✅ CORRECT
);
```

## 📚 Méthodes Alternatives

### Option 1: auth.jwt() (Recommandé)
```sql
-- Vérifier l'email
(auth.jwt() ->> 'email') = 'admin@kazipro.com'

-- Vérifier un rôle custom
(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'

-- Vérifier l'ID
(auth.jwt() ->> 'sub') = 'uuid-here'
```

### Option 2: auth.uid() (Pour l'ID seulement)
```sql
-- Vérifier si c'est l'utilisateur actuel
auth.uid() = user_id

-- Vérifier si l'utilisateur est connecté
auth.uid() IS NOT NULL
```

### Option 3: Créer une Vue Publique
```sql
-- Créer une vue accessible
CREATE VIEW public.user_emails AS
SELECT id, email
FROM auth.users;

-- Donner les permissions
GRANT SELECT ON public.user_emails TO authenticated;

-- Utiliser dans les policies
EXISTS (
  SELECT 1 FROM public.user_emails
  WHERE id = auth.uid()
  AND email = 'admin@kazipro.com'
)
```

### Option 4: Utiliser une Table de Rôles
```sql
-- Créer une table pour les rôles
CREATE TABLE user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('admin', 'user', 'moderator'))
);

-- Utiliser dans les policies
EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_id = auth.uid()
  AND role = 'admin'
)
```

## 🔧 Autres Fichiers à Vérifier

### Fichiers SQL avec auth.users
Tous ces fichiers contiennent des références à `auth.users`:

1. `sql/fix_admin_update_prestataires.sql` - ❌ À corriger
2. `sql/fix_admin_update_simple.sql` - ✅ Déjà corrigé (utilise auth.jwt)
3. `sql/create_admin_account.sql` - ✅ OK (pas dans une policy)
4. `sql/add_email_to_prestataires.sql` - ✅ OK (trigger, pas policy)
5. `sql/setup_email_column_complete.sql` - ✅ OK (trigger, pas policy)

### Vérifier fix_admin_update_prestataires.sql

**Fichier:** `sql/fix_admin_update_prestataires.sql`

**Code à Corriger:**
```sql
-- AVANT (Cassé)
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email = 'admin@kazipro.com'
  )
)

-- APRÈS (Corrigé)
USING (
  (auth.jwt() ->> 'email') = 'admin@kazipro.com'
)
```

## 📋 Règles pour les Politiques RLS

### ✅ AUTORISÉ dans les Policies
```sql
-- Fonctions Supabase
auth.uid()                    -- ID de l'utilisateur actuel
auth.jwt()                    -- JWT token complet
auth.email()                  -- Email (si disponible)

-- Tables publiques
SELECT FROM public.ma_table
SELECT FROM clients
SELECT FROM prestataires

-- Vues publiques
SELECT FROM public.user_emails
```

### ❌ INTERDIT dans les Policies
```sql
-- Tables auth
SELECT FROM auth.users        -- ❌ Permission denied
SELECT FROM auth.sessions     -- ❌ Permission denied
SELECT FROM auth.identities   -- ❌ Permission denied

-- Modifications auth
UPDATE auth.users             -- ❌ Permission denied
INSERT INTO auth.users        -- ❌ Permission denied
```

## 🎯 Pattern Recommandé pour Admin

### Méthode 1: JWT avec app_metadata (Meilleure)
```sql
-- 1. Ajouter le rôle dans Supabase Dashboard
-- User Management > User > Raw user meta data
{
  "app_metadata": {
    "role": "admin"
  }
}

-- 2. Utiliser dans les policies
CREATE POLICY "admin_access"
ON ma_table
FOR ALL
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
```

### Méthode 2: Email hardcodé (Simple)
```sql
CREATE POLICY "admin_access"
ON ma_table
FOR ALL
USING (
  (auth.jwt() ->> 'email') = 'admin@kazipro.com'
);
```

### Méthode 3: Table de rôles (Flexible)
```sql
-- Créer la table
CREATE TABLE user_roles (
  user_id UUID PRIMARY KEY,
  role TEXT NOT NULL
);

-- Policy
CREATE POLICY "admin_access"
ON ma_table
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);
```

## 🔍 Debugging

### Vérifier le JWT
```sql
-- Voir le contenu du JWT
SELECT auth.jwt();

-- Extraire l'email
SELECT auth.jwt() ->> 'email';

-- Extraire le rôle
SELECT auth.jwt() -> 'app_metadata' ->> 'role';

-- Extraire l'ID
SELECT auth.jwt() ->> 'sub';
```

### Tester une Policy
```sql
-- Tester si la condition est vraie
SELECT 
  auth.uid() as user_id,
  auth.jwt() ->> 'email' as email,
  (auth.jwt() ->> 'email') = 'admin@kazipro.com' as is_admin;
```

## ✅ Checklist de Correction

- [x] Identifier les policies avec `auth.users`
- [x] Corriger `sql/fix_devis_items_insert.sql`
- [ ] Corriger `sql/fix_admin_update_prestataires.sql`
- [ ] Exécuter les scripts SQL corrigés
- [ ] Tester l'accès admin
- [ ] Vérifier qu'aucune erreur "permission denied"

## 📄 Scripts à Exécuter

### 1. Corriger fix_admin_update_prestataires.sql
Ouvrir le fichier et remplacer:
```sql
EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND auth.users.email = 'admin@kazipro.com'
)
```

Par:
```sql
(auth.jwt() ->> 'email') = 'admin@kazipro.com'
```

### 2. Exécuter les scripts
```bash
# Dans Supabase SQL Editor
sql/fix_devis_items_insert.sql
sql/fix_admin_update_prestataires.sql  # Après correction
```

## 🎉 Résultat Attendu

Après correction:
- ✅ Aucune erreur "permission denied"
- ✅ Les policies RLS fonctionnent correctement
- ✅ L'admin peut accéder à toutes les données
- ✅ Les utilisateurs normaux ont un accès limité

## 📝 Notes

### Pourquoi auth.users est Protégé?
- **Sécurité:** Contient des données sensibles (hash de mot de passe, etc.)
- **Isolation:** Supabase gère l'authentification séparément
- **Performance:** Évite les requêtes lourdes dans les policies

### Alternatives Sécurisées
- `auth.uid()` - ID de l'utilisateur actuel
- `auth.jwt()` - Token JWT avec métadonnées
- Tables publiques - Vos propres tables avec les infos nécessaires
