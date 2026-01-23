-- ============================================
-- ACTIVER LA DISPONIBILITÉ POUR TOUS
-- ============================================

-- Rendre tous les prestataires disponibles
UPDATE prestataires 
SET disponible = true
WHERE profile_completed = true;

-- Vérifier le résultat
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE profile_completed = true) as profils_completes,
  COUNT(*) FILTER (WHERE disponible = true) as disponibles,
  COUNT(*) FILTER (WHERE profile_completed = true AND disponible = true) as visibles_maintenant
FROM prestataires;

-- Voir tous les prestataires
SELECT 
  full_name,
  profession,
  city,
  profile_completed,
  disponible,
  verified
FROM prestataires
ORDER BY created_at DESC;
