-- ============================================
-- FIX SIMPLE: Recherche Prestataires
-- ============================================
-- Sans accès à auth.users

-- Supprimer l'ancienne politique restrictive
DROP POLICY IF EXISTS "Clients can view prestataire profiles" ON prestataires;

-- Nouvelle politique: Les clients peuvent voir tous les prestataires avec profil complété
CREATE POLICY "Clients can view completed profiles" ON prestataires 
FOR SELECT 
USING (profile_completed = true);

-- Les prestataires peuvent toujours voir leur propre profil
DROP POLICY IF EXISTS "Prestataires can view own data" ON prestataires;
CREATE POLICY "Prestataires can view own data" ON prestataires 
FOR SELECT 
USING (auth.uid() = user_id);

-- Les admins peuvent tout voir
DROP POLICY IF EXISTS "Admins can view all prestataires" ON prestataires;
CREATE POLICY "Admins can view all prestataires" ON prestataires 
FOR SELECT 
USING (
  (auth.jwt()->>'role')::text = 'admin'
);

-- Vérifier les prestataires disponibles
SELECT 
  id,
  full_name,
  profession,
  city,
  verified,
  profile_completed,
  disponible,
  created_at
FROM prestataires
ORDER BY created_at DESC;

-- Statistiques
SELECT 
  COUNT(*) as total_prestataires,
  COUNT(*) FILTER (WHERE profile_completed = true) as visibles_clients,
  COUNT(*) FILTER (WHERE verified = true) as verifies,
  COUNT(*) FILTER (WHERE disponible = true) as disponibles
FROM prestataires;
