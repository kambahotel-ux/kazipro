-- ✅ Corriger les données des prestataires pour la recherche

-- 1. Vérifier l'état actuel
SELECT 
    '📊 État actuel des prestataires' as info,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE profile_completed = true) as profils_complets,
    COUNT(*) FILTER (WHERE disponible = true) as disponibles,
    COUNT(*) FILTER (WHERE verified = true) as verifies,
    COUNT(*) FILTER (WHERE city IS NOT NULL) as avec_ville
FROM prestataires;

-- 2. Afficher les prestataires sans profil complet
SELECT 
    '⚠️ Prestataires sans profil complet' as info,
    id,
    full_name,
    profession,
    profile_completed,
    verified
FROM prestataires
WHERE profile_completed IS NULL OR profile_completed = false;

-- 3. Marquer tous les prestataires comme ayant un profil complet
-- (Pour les tests - à ajuster selon vos besoins)
UPDATE prestataires
SET profile_completed = true
WHERE profile_completed IS NULL OR profile_completed = false;

-- 4. S'assurer que tous les prestataires ont une ville
-- (Mettre une ville par défaut si NULL)
UPDATE prestataires
SET city = 'Kinshasa'
WHERE city IS NULL OR city = '';

-- 5. S'assurer que disponible est défini
UPDATE prestataires
SET disponible = true
WHERE disponible IS NULL;

-- 6. Vérifier le résultat
SELECT 
    '✅ État après correction' as info,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE profile_completed = true) as profils_complets,
    COUNT(*) FILTER (WHERE disponible = true) as disponibles,
    COUNT(*) FILTER (WHERE verified = true) as verifies,
    COUNT(*) FILTER (WHERE city IS NOT NULL) as avec_ville
FROM prestataires;

-- 7. Afficher tous les prestataires visibles dans la recherche
SELECT 
    '🔍 Prestataires visibles dans la recherche' as info,
    id,
    full_name,
    profession,
    city,
    verified,
    disponible,
    profile_completed
FROM prestataires
WHERE profile_completed = true
ORDER BY created_at DESC;

-- 8. Message final
DO $
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '✅ Données des prestataires corrigées !';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Tous les prestataires ont profile_completed = true';
    RAISE NOTICE '✅ Tous les prestataires ont une ville';
    RAISE NOTICE '✅ Tous les prestataires ont disponible défini';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 La page de recherche devrait maintenant afficher tous les prestataires !';
    RAISE NOTICE '';
END $;
