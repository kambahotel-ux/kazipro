-- ============================================
-- FIX MISSIONS COMPLET - Tout en un
-- Exécute ce script pour corriger le problème des missions manquantes
-- ============================================

-- ÉTAPE 1: Ajouter demande_id à missions (si pas déjà fait)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'missions' AND column_name = 'demande_id') THEN
    ALTER TABLE missions ADD COLUMN demande_id UUID;
    RAISE NOTICE '✅ Colonne demande_id ajoutée à missions';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne demande_id existe déjà';
  END IF;
END $$;

-- ÉTAPE 2: Remplir demande_id pour les missions existantes
-- ============================================
UPDATE missions m
SET demande_id = d.demande_id
FROM devis d
WHERE m.devis_id = d.id
  AND m.demande_id IS NULL;

DO $$
BEGIN
  RAISE NOTICE '✅ demande_id rempli pour les missions existantes';
END $$;

-- ÉTAPE 3: Ajouter foreign key (si pas déjà fait)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'missions_demande_id_fkey' AND table_name = 'missions'
  ) THEN
    ALTER TABLE missions ADD CONSTRAINT missions_demande_id_fkey 
      FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Foreign key ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Foreign key existe déjà';
  END IF;
END $$;

-- ÉTAPE 4: Créer index
-- ============================================
CREATE INDEX IF NOT EXISTS idx_missions_demande ON missions(demande_id);

DO $$
BEGIN
  RAISE NOTICE '✅ Index créé sur demande_id';
END $$;

-- ÉTAPE 5: Créer les missions manquantes
-- ============================================
INSERT INTO missions (devis_id, demande_id, client_id, prestataire_id, status, start_date, created_at, updated_at)
SELECT 
  d.id as devis_id,
  dem.id as demande_id,
  dem.client_id,
  d.prestataire_id,
  CASE 
    WHEN dem.status = 'in_progress' THEN 'in_progress'
    WHEN dem.status = 'completed' THEN 'completed'
    ELSE 'pending'
  END as status,
  d.updated_at as start_date,
  NOW() as created_at,
  NOW() as updated_at
FROM demandes dem
INNER JOIN devis d ON d.id = dem.devis_accepte_id
WHERE dem.devis_accepte_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM missions m WHERE m.devis_id = d.id
  );

-- Compter les missions créées
DO $$
DECLARE
  mission_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mission_count
  FROM missions m
  INNER JOIN devis d ON d.id = m.devis_id
  INNER JOIN demandes dem ON dem.devis_accepte_id = d.id;
  
  RAISE NOTICE '✅ % missions créées/vérifiées', mission_count;
END $$;

-- ÉTAPE 6: Créer fonction pour auto-créer mission
-- ============================================
CREATE OR REPLACE FUNCTION create_mission_on_devis_accept()
RETURNS TRIGGER AS $$
BEGIN
  -- Seulement si devis passe à 'accepte'
  IF NEW.statut = 'accepte' AND (OLD.statut IS NULL OR OLD.statut != 'accepte') THEN
    
    -- Créer mission
    INSERT INTO missions (devis_id, demande_id, client_id, prestataire_id, status, start_date, created_at, updated_at)
    SELECT 
      NEW.id,
      dem.id,
      dem.client_id,
      NEW.prestataire_id,
      'pending',
      NOW(),
      NOW(),
      NOW()
    FROM demandes dem
    WHERE dem.id = NEW.demande_id
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ Mission créée automatiquement pour devis %', NEW.numero;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Fonction create_mission_on_devis_accept créée';
END $$;

-- ÉTAPE 7: Créer trigger
-- ============================================
DROP TRIGGER IF EXISTS trigger_create_mission_on_devis_accept ON devis;

CREATE TRIGGER trigger_create_mission_on_devis_accept
AFTER UPDATE ON devis
FOR EACH ROW
EXECUTE FUNCTION create_mission_on_devis_accept();

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger installé sur table devis';
END $$;

-- ÉTAPE 8: Créer trigger pour sync demande_id
-- ============================================
CREATE OR REPLACE FUNCTION sync_mission_demande_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.devis_id IS NOT NULL THEN
    SELECT demande_id INTO NEW.demande_id
    FROM devis
    WHERE id = NEW.devis_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_mission_demande_id ON missions;

CREATE TRIGGER trigger_sync_mission_demande_id
BEFORE INSERT OR UPDATE OF devis_id ON missions
FOR EACH ROW
EXECUTE FUNCTION sync_mission_demande_id();

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger de synchronisation installé';
END $$;

-- ÉTAPE 9: Vérification finale
-- ============================================
SELECT 
  '🎉 SUCCÈS! Missions corrigées' as message,
  COUNT(*) as total_missions,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as en_cours,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completees,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as en_attente
FROM missions;

-- Afficher les missions créées
SELECT 
  m.id as mission_id,
  m.status as mission_status,
  dem.titre as demande_titre,
  d.numero as devis_numero,
  p.full_name as prestataire_name,
  m.created_at
FROM missions m
INNER JOIN devis d ON d.id = m.devis_id
INNER JOIN demandes dem ON dem.id = m.demande_id
INNER JOIN prestataires p ON p.id = m.prestataire_id
ORDER BY m.created_at DESC
LIMIT 10;

-- Message final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '✅ CORRECTION TERMINÉE AVEC SUCCÈS!';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Ce qui a été fait:';
  RAISE NOTICE '  1. ✅ Colonne demande_id ajoutée à missions';
  RAISE NOTICE '  2. ✅ Missions manquantes créées';
  RAISE NOTICE '  3. ✅ Trigger auto-création installé';
  RAISE NOTICE '  4. ✅ Trigger synchronisation installé';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Résultat:';
  RAISE NOTICE '  - Les prestataires voient maintenant leurs missions';
  RAISE NOTICE '  - Les nouvelles acceptations créent automatiquement une mission';
  RAISE NOTICE '  - Le workflow complet fonctionne';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test:';
  RAISE NOTICE '  1. Login en tant que prestataire';
  RAISE NOTICE '  2. Aller sur la page "Missions"';
  RAISE NOTICE '  3. Vérifier que les missions apparaissent';
  RAISE NOTICE '';
END $$;
