-- ============================================
-- COPIER-COLLER CE SQL DANS SUPABASE
-- ============================================

-- 1. Nettoyer les anciennes politiques
ALTER TABLE prestataires DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view prestataire profiles" ON prestataires;
DROP POLICY IF EXISTS "Clients can view completed profiles" ON prestataires;
DROP POLICY IF EXISTS "Prestataires can view own data" ON prestataires;
DROP POLICY IF EXISTS "Prestataires can update own data" ON prestataires;
DROP POLICY IF EXISTS "Admins can view all prestataires" ON prestataires;
DROP POLICY IF EXISTS "Enable read access for all users" ON prestataires;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON prestataires;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON prestataires;

-- 2. Réactiver RLS
ALTER TABLE prestataires ENABLE ROW LEVEL SECURITY;

-- 3. Créer les nouvelles politiques (SIMPLES, sans auth.users)
CREATE POLICY "Public can view completed profiles" ON prestataires
FOR SELECT USING (profile_completed = true);

CREATE POLICY "Owners can view own profile" ON prestataires
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Owners can insert own profile" ON prestataires
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update own profile" ON prestataires
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Activer les profils existants
UPDATE prestataires 
SET profile_completed = true
WHERE full_name IS NOT NULL AND profession IS NOT NULL AND city IS NOT NULL;

-- 5. Vérifier le résultat
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE profile_completed = true) as visibles
FROM prestataires;

-- 6. Voir les prestataires
SELECT id, full_name, profession, city, profile_completed, verified, disponible
FROM prestataires
ORDER BY created_at DESC;
