-- ============================================
-- AJOUTER LA COLONNE contrat_id À LA TABLE missions
-- ============================================

-- Ajouter la colonne contrat_id (nullable)
ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS contrat_id UUID;

-- Ajouter une foreign key optionnelle vers contrats
ALTER TABLE missions
ADD CONSTRAINT missions_contrat_id_fkey 
FOREIGN KEY (contrat_id) 
REFERENCES contrats(id) 
ON DELETE SET NULL;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_missions_contrat 
ON missions(contrat_id);

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Colonne contrat_id ajoutée à la table missions!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Modifications appliquées:';
  RAISE NOTICE '   - Colonne contrat_id (UUID, nullable)';
  RAISE NOTICE '   - Foreign key vers contrats (optionnelle)';
  RAISE NOTICE '   - Index créé pour les performances';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Les missions peuvent maintenant être liées aux contrats!';
END $$;
