-- Script pour tester et activer l'affichage des prestataires en ligne

-- 1. Vérifier l'état actuel
SELECT 
  COUNT(*) as total_prestataires,
  COUNT(*) FILTER (WHERE verified = true) as prestataires_verifies,
  COUNT(*) FILTER (WHERE is_online = true) as prestataires_en_ligne,
  COUNT(*) FILTER (WHERE is_online = true AND verified = true) as verifies_en_ligne
FROM prestataires;

-- 2. Voir les prestataires existants
SELECT id, full_name, email, verified, is_online, last_seen 
FROM prestataires 
ORDER BY created_at DESC
LIMIT 5;

-- 3. SOLUTION : Vérifier tous les prestataires existants
UPDATE prestataires 
SET verified = true 
WHERE verified = false OR verified IS NULL;

-- 4. SOLUTION : Marquer un prestataire comme en ligne pour tester
UPDATE prestataires 
SET is_online = true, last_seen = NOW() 
WHERE id = (SELECT id FROM prestataires WHERE verified = true LIMIT 1);

-- 5. Vérifier le résultat
SELECT 
  COUNT(*) FILTER (WHERE verified = true) as prestataires_verifies,
  COUNT(*) FILTER (WHERE is_online = true AND verified = true) as verifies_en_ligne
FROM prestataires;

-- 6. Voir qui est en ligne maintenant
SELECT id, full_name, verified, is_online, last_seen 
FROM prestataires 
WHERE is_online = true;
