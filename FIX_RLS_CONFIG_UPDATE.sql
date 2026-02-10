-- ═══════════════════════════════════════════════════════════════════
-- FIX RLS - PERMETTRE UPDATE DE LA CONFIGURATION
-- ═══════════════════════════════════════════════════════════════════

-- Supprimer l'ancienne policy restrictive
DROP POLICY IF EXISTS "Only admins can update config" ON configuration_paiement_globale;

-- Créer une nouvelle policy permissive (pour le dev)
CREATE POLICY "Authenticated users can update config" ON configuration_paiement_globale
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Policy RLS mise à jour pour configuration_paiement_globale';
  RAISE NOTICE '✅ Les utilisateurs authentifiés peuvent maintenant modifier la config';
END $$;
