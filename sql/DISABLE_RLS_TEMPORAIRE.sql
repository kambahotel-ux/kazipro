-- ============================================
-- SOLUTION TEMPORAIRE: Désactiver RLS
-- ============================================
-- À utiliser SEULEMENT pour tester rapidement
-- Puis réactiver avec les bonnes politiques

-- DÉSACTIVER RLS (TEMPORAIRE)
ALTER TABLE prestataires DISABLE ROW LEVEL SECURITY;

-- Vérifier que ça fonctionne
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

-- IMPORTANT: Une fois que vous voyez les prestataires,
-- exécutez sql/FIX_RLS_URGENT.sql pour réactiver RLS proprement
