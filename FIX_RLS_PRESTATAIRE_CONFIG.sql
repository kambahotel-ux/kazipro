-- ═══════════════════════════════════════════════════════════════════
-- FIX RLS - CONFIGURATION PRESTATAIRE
-- ═══════════════════════════════════════════════════════════════════
-- Permet aux prestataires d'insérer et modifier leur configuration
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: configuration_paiement_prestataire
-- ═══════════════════════════════════════════════════════════════════

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Prestataires can view own config" ON configuration_paiement_prestataire;
DROP POLICY IF EXISTS "Prestataires can insert own config" ON configuration_paiement_prestataire;
DROP POLICY IF EXISTS "Prestataires can update own config" ON configuration_paiement_prestataire;

-- Policy SELECT: Le prestataire peut voir sa propre config
CREATE POLICY "allow_prestataire_select_own_config" ON configuration_paiement_prestataire
  FOR SELECT
  USING (
    prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
  );

-- Policy INSERT: Le prestataire peut créer sa config
CREATE POLICY "allow_prestataire_insert_own_config" ON configuration_paiement_prestataire
  FOR INSERT
  WITH CHECK (
    prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
  );

-- Policy UPDATE: Le prestataire peut modifier sa config
CREATE POLICY "allow_prestataire_update_own_config" ON configuration_paiement_prestataire
  FOR UPDATE
  USING (
    prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
  );

RAISE NOTICE '✅ Policies RLS créées pour configuration_paiement_prestataire';

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: frais_deplacement_config
-- ═══════════════════════════════════════════════════════════════════

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Prestataires can view own frais" ON frais_deplacement_config;
DROP POLICY IF EXISTS "Prestataires can insert own frais" ON frais_deplacement_config;
DROP POLICY IF EXISTS "Prestataires can update own frais" ON frais_deplacement_config;

-- Policy SELECT: Le prestataire peut voir ses frais
CREATE POLICY "allow_prestataire_select_own_frais" ON frais_deplacement_config
  FOR SELECT
  USING (
    prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
  );

-- Policy INSERT: Le prestataire peut créer ses frais
CREATE POLICY "allow_prestataire_insert_own_frais" ON frais_deplacement_config
  FOR INSERT
  WITH CHECK (
    prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
  );

-- Policy UPDATE: Le prestataire peut modifier ses frais
CREATE POLICY "allow_prestataire_update_own_frais" ON frais_deplacement_config
  FOR UPDATE
  USING (
    prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
  );

RAISE NOTICE '✅ Policies RLS créées pour frais_deplacement_config';

-- ═══════════════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ POLICIES RLS ACTIVES';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  
  RAISE NOTICE '';
  RAISE NOTICE '📋 configuration_paiement_prestataire:';
  FOR policy_record IN 
    SELECT policyname, cmd
    FROM pg_policies 
    WHERE tablename = 'configuration_paiement_prestataire'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  ✓ % (%)', policy_record.policyname, policy_record.cmd;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '📋 frais_deplacement_config:';
  FOR policy_record IN 
    SELECT policyname, cmd
    FROM pg_policies 
    WHERE tablename = 'frais_deplacement_config'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  ✓ % (%)', policy_record.policyname, policy_record.cmd;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ TOUT EST PRÊT!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
END $$;

COMMIT;
