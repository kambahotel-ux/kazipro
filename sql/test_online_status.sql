-- Test et correction du système de statut en ligne

-- 1. Vérifier si les colonnes existent
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'prestataires' 
AND column_name IN ('is_online', 'last_seen');

-- 2. Voir tous les prestataires
SELECT id, full_name, verified, is_online, last_seen 
FROM prestataires 
ORDER BY created_at DESC
LIMIT 10;

-- 3. Compter les prestataires vérifiés
SELECT 
  COUNT(*) as total_prestataires,
  COUNT(*) FILTER (WHERE verified = true) as prestataires_verifies,
  COUNT(*) FILTER (WHERE is_online = true) as prestataires_en_ligne,
  COUNT(*) FILTER (WHERE is_online = true AND verified = true) as verifies_en_ligne
FROM prestataires;

-- 4. SI AUCUN PRESTATAIRE N'EST VÉRIFIÉ, exécutez ceci pour en vérifier un :
-- (Décommentez la ligne suivante si besoin)
-- UPDATE prestataires SET verified = true WHERE id = (SELECT id FROM prestataires LIMIT 1);

-- 5. Pour tester, marquer un prestataire comme en ligne :
-- (Décommentez la ligne suivante pour tester)
-- UPDATE prestataires SET is_online = true, last_seen = NOW() WHERE verified = true LIMIT 1;
