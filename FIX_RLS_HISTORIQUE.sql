-- ═══════════════════════════════════════════════════════════════════
-- FIX RLS - HISTORIQUE CONFIG PAIEMENT
-- ═══════════════════════════════════════════════════════════════════
-- Ce script permet à tous les utilisateurs authentifiés d'insérer
-- dans l'historique (temporaire, pour le développement)
-- ═══════════════════════════════════════════════════════════════════

-- Supprimer l'ancienne policy restrictive
DROP POLICY IF EXISTS "Only admins can insert history" ON historique_config_paiement;

-- Créer une nouvelle policy plus permissive (pour le dev)
CREATE POLICY "Authenticated users can insert history" ON historique_config_paiement
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Policy RLS mise à jour pour historique_config_paiement';
  RAISE NOTICE '⚠️  NOTE: Cette policy est permissive pour le développement';
  RAISE NOTICE '⚠️  En production, restreindre aux vrais admins';
END $$;
