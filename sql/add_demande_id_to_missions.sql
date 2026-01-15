-- ============================================
-- AJOUTER demande_id À LA TABLE MISSIONS
-- Pour créer une relation directe missions → demandes
-- ============================================

-- PARTIE 1: Ajouter la colonne demande_id
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'missions' AND column_name = 'demande_id') THEN
    ALTER TABLE missions ADD COLUMN demande_id UUID;
    RAISE NOTICE 'Colonne demande_id ajoutée à missions';
  END IF;
END $$;

-- PARTIE 2: Remplir demande_id depuis devis
-- ============================================

UPDATE missions m
SET demande_id = d.demande_id
FROM devis d
WHERE m.devis_id = d.id
  AND m.demande_id IS NULL;

-- PARTIE 3: Ajouter la foreign key
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'missions_demande_id_fkey' AND table_name = 'missions'
  ) THEN
    ALTER TABLE missions ADD CONSTRAINT missions_demande_id_fkey 
      FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE SET NULL;
    RAISE NOTICE 'Foreign key missions_demande_id_fkey ajoutée';
  END IF;
END $$;

-- PARTIE 4: Créer un index
-- ============================================

CREATE INDEX IF NOT EXISTS idx_missions_demande ON missions(demande_id);

-- PARTIE 5: Créer un trigger pour maintenir demande_id à jour
-- ============================================

CREATE OR REPLACE FUNCTION sync_mission_demande_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Si devis_id est défini, récupérer demande_id depuis devis
  IF NEW.devis_id IS NOT NULL THEN
    SELECT demande_id INTO NEW.demande_id
    FROM devis
    WHERE id = NEW.devis_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe
DROP TRIGGER IF EXISTS trigger_sync_mission_demande_id ON missions;

-- Créer le trigger
CREATE TRIGGER trigger_sync_mission_demande_id
BEFORE INSERT OR UPDATE OF devis_id ON missions
FOR EACH ROW
EXECUTE FUNCTION sync_mission_demande_id();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Colonne demande_id ajoutée à missions!';
  RAISE NOTICE '1. Colonne demande_id créée';
  RAISE NOTICE '2. Données existantes migrées';
  RAISE NOTICE '3. Foreign key ajoutée';
  RAISE NOTICE '4. Index créé';
  RAISE NOTICE '5. Trigger de synchronisation créé';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Maintenant missions a une relation directe avec demandes';
  RAISE NOTICE '   Vous pouvez faire: .select("*, demandes(*)")';
END $$;
