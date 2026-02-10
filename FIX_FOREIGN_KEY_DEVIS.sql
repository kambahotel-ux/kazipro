-- ═══════════════════════════════════════════════════════════════════
-- FIX CONTRAINTE FOREIGN KEY - DEVIS_ID
-- ═══════════════════════════════════════════════════════════════════

-- Problème: La contrainte foreign key exige que devis_id existe dans devis_pro
-- Mais votre devis est dans l'ancienne table `devis`

-- Solution: Supprimer la contrainte foreign key

-- ═══════════════════════════════════════════════════════════════════
-- SUPPRIMER LA CONTRAINTE
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE contrats 
DROP CONSTRAINT IF EXISTS contrats_devis_id_fkey;

SELECT '✅ Contrainte foreign key supprimée!' as status;

-- ═══════════════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════

-- Afficher les contraintes restantes sur la table contrats
SELECT 
  '📋 CONTRAINTES SUR CONTRATS' as info,
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'contrats'::regclass
ORDER BY conname;

SELECT '═══════════════════════════════════════════════════════════════════' as separator;
SELECT '✅ CONTRAINTE SUPPRIMÉE!' as resultat;
SELECT '' as separator2;
SELECT '👉 Rafraîchissez l''application (F5) et réessayez' as action;
SELECT '═══════════════════════════════════════════════════════════════════' as separator3;

