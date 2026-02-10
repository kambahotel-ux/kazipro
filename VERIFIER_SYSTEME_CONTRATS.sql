-- ═══════════════════════════════════════════════════════════════════
-- VÉRIFIER QUE LE SYSTÈME DE CONTRATS FONCTIONNE
-- ═══════════════════════════════════════════════════════════════════

-- 1. Vérifier que le trigger existe
SELECT 
  '🔧 TRIGGER' as type,
  tgname as nom,
  CASE tgenabled 
    WHEN 'O' THEN '✅ Activé'
    WHEN 'D' THEN '❌ Désactivé'
    ELSE '⚠️ Inconnu'
  END as statut
FROM pg_trigger
WHERE tgname = 'trigger_generate_contrat';

-- 2. Vérifier les policies RLS sur contrats
SELECT 
  '🔒 POLICIES CONTRATS' as type,
  policyname as nom,
  cmd as operation,
  '✅' as statut
FROM pg_policies 
WHERE tablename = 'contrats'
ORDER BY policyname;

-- 3. Vérifier les policies RLS sur devis_pro
SELECT 
  '🔒 POLICIES DEVIS' as type,
  policyname as nom,
  cmd as operation,
  '✅' as statut
FROM pg_policies 
WHERE tablename = 'devis_pro'
  AND policyname LIKE '%Client%'
ORDER BY policyname;

-- 4. Vérifier vos devis acceptés
SELECT 
  '📋 VOS DEVIS ACCEPTÉS' as type,
  d.numero as devis_numero,
  d.titre,
  d.montant_ttc,
  d.date_acceptation,
  CASE 
    WHEN EXISTS (SELECT 1 FROM contrats WHERE devis_id = d.id) 
    THEN '✅ Contrat créé'
    ELSE '❌ Pas de contrat'
  END as contrat_status
FROM devis_pro d
WHERE d.client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  AND d.statut = 'accepte'
ORDER BY d.date_acceptation DESC;

-- 5. Vérifier vos contrats
SELECT 
  '📄 VOS CONTRATS' as type,
  c.numero as contrat_numero,
  c.statut,
  c.created_at,
  d.numero as devis_numero
FROM contrats c
JOIN devis_pro d ON c.devis_id = d.id
WHERE c.client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
ORDER BY c.created_at DESC;

-- 6. Résumé
SELECT 
  '📊 RÉSUMÉ' as type,
  COUNT(DISTINCT d.id) as total_devis_acceptes,
  COUNT(DISTINCT c.id) as total_contrats,
  CASE 
    WHEN COUNT(DISTINCT d.id) = COUNT(DISTINCT c.id) 
    THEN '✅ Tous les devis ont un contrat'
    ELSE '⚠️ Certains devis n''ont pas de contrat'
  END as statut
FROM devis_pro d
LEFT JOIN contrats c ON c.devis_id = d.id
WHERE d.client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  AND d.statut = 'accepte';

