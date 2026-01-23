-- ============================================
-- JUSTE ACTIVER LES PROFILS
-- ============================================
-- Les politiques existent déjà, il suffit d'activer les profils

-- 1. Activer les profils existants
UPDATE prestataires 
SET profile_completed = true
WHERE 
  full_name IS NOT NULL 
  AND full_name != ''
  AND profession IS NOT NULL 
  AND profession != ''
  AND city IS NOT NULL
  AND city != '';

-- 2. Vérifier le résultat
SELECT 
  COUNT(*) as total_prestataires,
  COUNT(*) FILTER (WHERE profile_completed = true) as visibles_clients,
  COUNT(*) FILTER (WHERE verified = true) as verifies,
  COUNT(*) FILTER (WHERE disponible = true) as disponibles
FROM prestataires;

-- 3. Voir les prestataires visibles
SELECT 
  id,
  full_name,
  profession,
  city,
  profile_completed,
  verified,
  disponible
FROM prestataires
WHERE profile_completed = true
ORDER BY created_at DESC;

-- 4. Vérifier les politiques actives
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'prestataires'
ORDER BY policyname;
