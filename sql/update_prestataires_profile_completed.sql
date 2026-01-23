-- ============================================
-- METTRE À JOUR: profile_completed
-- ============================================
-- Pour rendre les prestataires existants visibles

-- Vérifier l'état actuel
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE profile_completed = true) as profils_completes,
  COUNT(*) FILTER (WHERE profile_completed = false OR profile_completed IS NULL) as profils_incomplets
FROM prestataires;

-- Afficher les prestataires avec profil incomplet
SELECT 
  id,
  full_name,
  profession,
  city,
  profile_completed,
  verified,
  disponible
FROM prestataires
WHERE profile_completed = false OR profile_completed IS NULL;

-- Mettre à jour automatiquement les prestataires qui ont les infos de base
UPDATE prestataires 
SET profile_completed = true
WHERE 
  (profile_completed = false OR profile_completed IS NULL)
  AND full_name IS NOT NULL 
  AND full_name != ''
  AND profession IS NOT NULL 
  AND profession != ''
  AND city IS NOT NULL
  AND city != '';

-- Vérifier le résultat
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE profile_completed = true) as profils_completes,
  COUNT(*) FILTER (WHERE profile_completed = false OR profile_completed IS NULL) as profils_incomplets
FROM prestataires;

-- Afficher tous les prestataires maintenant visibles
SELECT 
  id,
  full_name,
  profession,
  city,
  profile_completed,
  verified,
  disponible,
  created_at
FROM prestataires
WHERE profile_completed = true
ORDER BY created_at DESC;
