-- ============================================
-- FIX: Corriger toutes les contraintes de devis
-- ============================================

-- 1. Rendre demande_id nullable
ALTER TABLE devis ALTER COLUMN demande_id DROP NOT NULL;

-- 2. Rendre amount nullable (pour les nouveaux devis avec montant_ttc)
ALTER TABLE devis ALTER COLUMN amount DROP NOT NULL;

-- 3. Rendre status nullable (pour les nouveaux devis avec statut)
ALTER TABLE devis ALTER COLUMN status DROP NOT NULL;

-- 4. Rendre description nullable (optionnel pour les devis)
ALTER TABLE devis ALTER COLUMN description DROP NOT NULL;

-- Message de succès
-- ✅ Toutes les contraintes NOT NULL ont été corrigées!
-- Vous pouvez maintenant créer des devis sans problème.
