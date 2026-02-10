-- ═══════════════════════════════════════════════════════════════════
-- FIX RLS - VERSION ULTRA PERMISSIVE (DEV SEULEMENT!)
-- ═══════════════════════════════════════════════════════════════════
-- ⚠️  ATTENTION: À utiliser uniquement en développement!
-- ⚠️  En production, utiliser des policies plus restrictives
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: configuration_paiement_prestataire
-- ═══════════════════════════════════════════════════════════════════

-- Supprimer TOUTES les policies existantes
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'configuration_paiement_prestataire'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON configuration_paiement_prestataire', policy_record.policyname);
    RAISE NOTICE 'Supprimé: %', policy_record.policyname;
  END LOOP;
END $$;

-- Créer des policies ultra-permissives
CREATE POLICY "allow_all_select_config" ON configuration_paiement_prestataire
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "allow_all_insert_config" ON configuration_paiement_prestataire
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "allow_all_update_config" ON configuration_paiement_prestataire
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "allow_all_delete_config" ON configuration_paiement_prestataire
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

RAISE NOTICE '✅ Policies ultra-permissives créées pour configuration_paiement_prestataire';

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: frais_deplacement_config
-- ═══════════════════════════════════════════════════════════════════

-- Supprimer TOUTES les policies existantes
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'frais_deplacement_config'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON frais_deplacement_config', policy_record.policyname);
    RAISE NOTICE 'Supprimé: %', policy_record.policyname;
  END LOOP;
END $$;

-- Créer des policies ultra-permissives
CREATE POLICY "allow_all_select_frais" ON frais_deplacement_config
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "allow_all_insert_frais" ON frais_deplacement_config
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "allow_all_update_frais" ON frais_deplacement_config
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "allow_all_delete_frais" ON frais_deplacement_config
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

RAISE NOTICE '✅ Policies ultra-permissives créées pour frais_deplacement_config';

-- ═══════════════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ POLICIES RLS ULTRA-PERMISSIVES ACTIVES';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  ATTENTION: Ces policies permettent à TOUS les utilisateurs authentifiés';
  RAISE NOTICE '⚠️  de lire/écrire dans ces tables. À utiliser uniquement en DEV!';
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
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Maintenant tu peux:';
  RAISE NOTICE '   1. Tester l''insertion dans les tables';
  RAISE NOTICE '   2. Vérifier que ça fonctionne';
  RAISE NOTICE '   3. Plus tard, restreindre les policies pour la production';
  RAISE NOTICE '';
END $$;

COMMIT;
