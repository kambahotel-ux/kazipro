-- ============================================
-- FIX URGENT: Supprimer TOUTES les politiques RLS
-- et les recréer proprement
-- ============================================

-- 1. DÉSACTIVER RLS temporairement pour voir les données
ALTER TABLE prestataires DISABLE ROW LEVEL SECURITY;

-- 2. SUPPRIMER TOUTES LES ANCIENNES POLITIQUES
DROP POLICY IF EXISTS "Clients can view prestataire profiles" ON prestataires;
DROP POLICY IF EXISTS "Clients can view completed profiles" ON prestataires;
DROP POLICY IF EXISTS "Prestataires can view own data" ON prestataires;
DROP POLICY IF EXISTS "Prestataires can update own data" ON prestataires;
DROP POLICY IF EXISTS "Admins can view all prestataires" ON prestataires;
DROP POLICY IF EXISTS "Enable read access for all users" ON prestataires;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON prestataires;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON prestataires;

-- 3. RÉACTIVER RLS
ALTER TABLE prestataires ENABLE ROW LEVEL SECURITY;

-- 4. CRÉER DES POLITIQUES SIMPLES ET PROPRES

-- Politique 1: Tout le monde peut voir les profils complétés (lecture publique)
CREATE POLICY "Public can view completed profiles" ON prestataires
FOR SELECT
USING (profile_completed = true);

-- Politique 2: Les prestataires peuvent voir leur propre profil (même incomplet)
CREATE POLICY "Owners can view own profile" ON prestataires
FOR SELECT
USING (auth.uid() = user_id);

-- Politique 3: Les prestataires peuvent insérer leur propre profil
CREATE POLICY "Owners can insert own profile" ON prestataires
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Politique 4: Les prestataires peuvent mettre à jour leur propre profil
CREATE POLICY "Owners can update own profile" ON prestataires
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. VÉRIFIER LES POLITIQUES ACTIVES
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'prestataires';

-- 6. VÉRIFIER LES DONNÉES
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE profile_completed = true) as visibles,
  COUNT(*) FILTER (WHERE verified = true) as verifies
FROM prestataires;

-- 7. AFFICHER LES PRESTATAIRES
SELECT 
  id,
  full_name,
  profession,
  city,
  profile_completed,
  verified,
  disponible
FROM prestataires
ORDER BY created_at DESC;
