-- ============================================
-- FIX: Foreign Key Constraint sur paiements.devis_id
-- Problème: La contrainte pointe vers devis_pro uniquement
-- Solution: Supprimer la contrainte pour permettre les deux tables
-- ============================================

-- 1. Supprimer la contrainte foreign key existante
ALTER TABLE paiements 
DROP CONSTRAINT IF EXISTS paiements_devis_id_fkey;

-- 2. Rendre la colonne devis_id nullable (optionnelle)
--    Car certains paiements peuvent ne pas avoir de devis
ALTER TABLE paiements 
ALTER COLUMN devis_id DROP NOT NULL;

-- 3. Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Contrainte foreign key supprimée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Modifications appliquées:';
  RAISE NOTICE '   - Contrainte paiements_devis_id_fkey supprimée';
  RAISE NOTICE '   - Colonne devis_id maintenant nullable';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Les paiements peuvent maintenant référencer:';
  RAISE NOTICE '   - Des devis dans la table "devis" (ancienne)';
  RAISE NOTICE '   - Des devis dans la table "devis_pro" (nouvelle)';
  RAISE NOTICE '   - Aucun devis (NULL)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Le système de paiement est maintenant compatible avec les deux tables!';
END $$;
