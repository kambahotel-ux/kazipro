-- Les politiques existent déjà ✅
-- Il suffit d'activer les profils:

UPDATE prestataires 
SET profile_completed = true
WHERE full_name IS NOT NULL AND profession IS NOT NULL;

-- Vérifier:
SELECT COUNT(*) as total, 
       COUNT(*) FILTER (WHERE profile_completed = true) as visibles
FROM prestataires;

-- Puis rafraîchir la page avec Ctrl+Shift+R
