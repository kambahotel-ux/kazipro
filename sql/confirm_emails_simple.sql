-- =====================================================
-- CONFIRMER LES EMAILS - VERSION SIMPLE
-- =====================================================
-- Script simplifié pour confirmer les emails des utilisateurs

-- Confirmer tous les utilisateurs non confirmés
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Vérifier le résultat
SELECT 
  COUNT(*) as total_users,
  COUNT(email_confirmed_at) as confirmed_users,
  COUNT(*) - COUNT(email_confirmed_at) as unconfirmed_users
FROM auth.users;

-- Afficher les derniers utilisateurs
SELECT 
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Non confirmé'
    ELSE '✅ Confirmé'
  END as statut
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
