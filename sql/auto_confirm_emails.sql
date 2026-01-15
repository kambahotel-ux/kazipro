-- =====================================================
-- AUTO-CONFIRM EMAIL ADDRESSES
-- =====================================================
-- Ce script permet de confirmer automatiquement les emails
-- des utilisateurs pour éviter l'étape OTP

-- =====================================================
-- OPTION 1: Confirmer tous les utilisateurs existants
-- =====================================================

-- Confirmer tous les utilisateurs qui n'ont pas encore confirmé leur email
-- Note: confirmed_at est une colonne générée, on ne met à jour que email_confirmed_at
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- =====================================================
-- OPTION 2: Confirmer un utilisateur spécifique
-- =====================================================

-- Remplacez 'email@example.com' par l'email de l'utilisateur
/*
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'email@example.com';
*/

-- =====================================================
-- VÉRIFICATION
-- =====================================================

-- Vérifier les utilisateurs non confirmés
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Non confirmé'
    ELSE '✅ Confirmé'
  END as statut
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;

-- =====================================================
-- STATISTIQUES
-- =====================================================

-- Compter les utilisateurs confirmés vs non confirmés
SELECT 
  COUNT(*) as total_users,
  COUNT(email_confirmed_at) as confirmed_users,
  COUNT(*) - COUNT(email_confirmed_at) as unconfirmed_users,
  ROUND(100.0 * COUNT(email_confirmed_at) / COUNT(*), 2) as confirmation_rate
FROM auth.users;

-- =====================================================
-- NOTES IMPORTANTES
-- =====================================================

/*
⚠️ IMPORTANT:
- La colonne 'confirmed_at' est générée automatiquement par Supabase
- On ne peut mettre à jour que 'email_confirmed_at'
- 'confirmed_at' sera automatiquement mis à jour par Supabase

⚠️ SÉCURITÉ:
- Désactiver la confirmation email réduit la sécurité
- Recommandé uniquement pour le développement/test
- En production, gardez la confirmation email activée

✅ ALTERNATIVE RECOMMANDÉE:
- Désactiver la confirmation email dans les paramètres Supabase
- Authentication → Settings → Email confirmations → OFF

📝 WORKFLOW ACTUEL:
1. Utilisateur s'inscrit
2. Compte créé immédiatement (email auto-confirmé)
3. Profil prestataire créé
4. Redirigé vers page d'attente
5. Admin approuve le prestataire

🔒 SÉCURITÉ MAINTENUE:
- Les prestataires doivent être approuvés par l'admin
- Le champ 'verified' reste à false
- Accès limité jusqu'à l'approbation
*/

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM auth.users
  WHERE email_confirmed_at IS NOT NULL;
  
  RAISE NOTICE '✅ Script exécuté avec succès!';
  RAISE NOTICE '📊 Utilisateurs confirmés: %', updated_count;
  RAISE NOTICE '';
  RAISE NOTICE '📝 Prochaines étapes:';
  RAISE NOTICE '1. Vérifiez les utilisateurs dans Authentication → Users';
  RAISE NOTICE '2. Testez l''inscription d''un nouveau prestataire';
  RAISE NOTICE '3. Vérifiez que le profil est créé dans la table prestataires';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Note: La colonne confirmed_at est générée automatiquement';
END $$;
