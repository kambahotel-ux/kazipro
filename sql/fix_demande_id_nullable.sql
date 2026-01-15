-- ============================================
-- FIX: Rendre demande_id nullable
-- ============================================

-- Permettre les valeurs NULL pour demande_id
-- Cela permet de créer des devis sans demande associée
ALTER TABLE devis ALTER COLUMN demande_id DROP NOT NULL;

-- Message de succès
-- ✅ La colonne demande_id accepte maintenant les valeurs NULL
-- Vous pouvez créer des devis sans demande associée
