-- ============================================
-- MISE À JOUR TABLE DEMANDES - Colonnes Manquantes
-- Phase 1, Tâche 1.1
-- ============================================

-- PARTIE 1: Ajouter les colonnes manquantes
-- ============================================

DO $$
BEGIN
  -- Ajouter profession (au lieu de service)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandes' AND column_name = 'profession') THEN
    ALTER TABLE demandes ADD COLUMN profession TEXT;
    RAISE NOTICE 'Colonne profession ajoutée';
  END IF;

  -- Ajouter localisation (au lieu de location)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandes' AND column_name = 'localisation') THEN
    ALTER TABLE demandes ADD COLUMN localisation TEXT;
    RAISE NOTICE 'Colonne localisation ajoutée';
  END IF;

  -- Ajouter urgence
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandes' AND column_name = 'urgence') THEN
    ALTER TABLE demandes ADD COLUMN urgence TEXT DEFAULT 'normal' CHECK (urgence IN ('normal', 'urgent', 'tres_urgent'));
    RAISE NOTICE 'Colonne urgence ajoutée';
  END IF;

  -- Ajouter statut (nouveau système de statuts)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandes' AND column_name = 'statut') THEN
    ALTER TABLE demandes ADD COLUMN statut TEXT DEFAULT 'en_attente';
    RAISE NOTICE 'Colonne statut ajoutée';
  END IF;

  -- Ajouter devis_accepte_id (référence au devis accepté)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandes' AND column_name = 'devis_accepte_id') THEN
    ALTER TABLE demandes ADD COLUMN devis_accepte_id UUID REFERENCES devis(id) ON DELETE SET NULL;
    RAISE NOTICE 'Colonne devis_accepte_id ajoutée';
  END IF;

  -- Ajouter deadline (date limite)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandes' AND column_name = 'deadline') THEN
    ALTER TABLE demandes ADD COLUMN deadline DATE;
    RAISE NOTICE 'Colonne deadline ajoutée';
  END IF;

  -- Ajouter images (array de URLs)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demandes' AND column_name = 'images') THEN
    ALTER TABLE demandes ADD COLUMN images TEXT[];
    RAISE NOTICE 'Colonne images ajoutée';
  END IF;
END $$;

-- PARTIE 2: Mettre à jour les constraints
-- ============================================

DO $$
BEGIN
  -- Supprimer l'ancien constraint status s'il existe
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'demandes_status_check') THEN
    ALTER TABLE demandes DROP CONSTRAINT demandes_status_check;
    RAISE NOTICE 'Ancien constraint status supprimé';
  END IF;

  -- Ajouter le nouveau constraint pour statut
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'demandes_statut_check') THEN
    ALTER TABLE demandes ADD CONSTRAINT demandes_statut_check 
      CHECK (statut IN (
        'en_attente',           -- Publiée, attend devis
        'attribuee',            -- Devis accepté, attend paiement
        'en_cours',             -- Travaux en cours
        'en_validation',        -- Attend validation client
        'corrections_demandees',-- Corrections à faire
        'terminee',             -- Validée par client
        'completee',            -- Payée et clôturée
        'annulee',              -- Annulée
        'litige',               -- En litige
        'archivee',             -- Archivée
        'active',               -- Ancien statut (compatibilité)
        'completed',            -- Ancien statut (compatibilité)
        'cancelled'             -- Ancien statut (compatibilité)
      ));
    RAISE NOTICE 'Nouveau constraint statut ajouté';
  END IF;
END $$;

-- PARTIE 3: Migrer les données existantes
-- ============================================

DO $$
BEGIN
  -- Copier service vers profession
  UPDATE demandes 
  SET profession = service 
  WHERE profession IS NULL AND service IS NOT NULL;
  
  -- Copier location vers localisation
  UPDATE demandes 
  SET localisation = location 
  WHERE localisation IS NULL AND location IS NOT NULL;
  
  -- Migrer les anciens statuts vers les nouveaux
  UPDATE demandes 
  SET statut = CASE 
    WHEN status = 'active' THEN 'en_attente'
    WHEN status = 'completed' THEN 'completee'
    WHEN status = 'cancelled' THEN 'annulee'
    ELSE 'en_attente'
  END
  WHERE statut IS NULL OR statut IN ('active', 'completed', 'cancelled');
  
  RAISE NOTICE 'Données existantes migrées';
END $$;

-- PARTIE 4: Créer les indexes pour performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_demandes_profession ON demandes(profession);
CREATE INDEX IF NOT EXISTS idx_demandes_localisation ON demandes(localisation);
CREATE INDEX IF NOT EXISTS idx_demandes_urgence ON demandes(urgence);
CREATE INDEX IF NOT EXISTS idx_demandes_statut ON demandes(statut);
CREATE INDEX IF NOT EXISTS idx_demandes_deadline ON demandes(deadline);
CREATE INDEX IF NOT EXISTS idx_demandes_devis_accepte ON demandes(devis_accepte_id);

-- PARTIE 5: Fonction pour calculer le nombre de devis
-- ============================================

CREATE OR REPLACE FUNCTION get_demande_devis_count(demande_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count FROM devis WHERE demande_id = demande_uuid;
  RETURN count;
END;
$$ LANGUAGE plpgsql;

-- PARTIE 6: Vue pour les opportunités (prestataires)
-- ============================================

CREATE OR REPLACE VIEW opportunites_prestataires AS
SELECT 
  d.id,
  d.client_id,
  d.title,
  d.titre,
  d.description,
  d.profession,
  d.service,
  d.localisation,
  d.location,
  d.budget_min,
  d.budget_max,
  d.urgence,
  d.statut,
  d.deadline,
  d.images,
  d.created_at,
  c.full_name as client_name,
  c.city as client_city,
  (SELECT COUNT(*) FROM devis WHERE demande_id = d.id) as nombre_devis
FROM demandes d
JOIN clients c ON d.client_id = c.id
WHERE d.statut = 'en_attente';

-- PARTIE 7: Fonction pour accepter un devis
-- ============================================

CREATE OR REPLACE FUNCTION accepter_devis(
  demande_uuid UUID,
  devis_uuid UUID
)
RETURNS VOID AS $$
BEGIN
  -- Mettre à jour la demande
  UPDATE demandes 
  SET statut = 'attribuee',
      devis_accepte_id = devis_uuid
  WHERE id = demande_uuid;
  
  -- Mettre à jour le devis accepté
  UPDATE devis 
  SET status = 'accepted',
      statut = 'accepte',
      date_acceptation = NOW()
  WHERE id = devis_uuid;
  
  -- Refuser les autres devis
  UPDATE devis 
  SET status = 'rejected',
      statut = 'refuse',
      date_refus = NOW()
  WHERE demande_id = demande_uuid 
    AND id != devis_uuid
    AND status = 'pending';
    
  RAISE NOTICE 'Devis accepté et autres devis refusés';
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Table demandes mise à jour!';
  RAISE NOTICE '1. Colonnes ajoutées: profession, localisation, urgence, statut, devis_accepte_id, deadline, images';
  RAISE NOTICE '2. Constraints mis à jour avec nouveaux statuts';
  RAISE NOTICE '3. Données existantes migrées (service→profession, location→localisation, status→statut)';
  RAISE NOTICE '4. Indexes créés pour performance';
  RAISE NOTICE '5. Fonctions utilitaires créées';
  RAISE NOTICE '6. Vue opportunites_prestataires créée';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Note: Les anciennes colonnes (service, location, status) sont préservées';
  RAISE NOTICE '    Utilisez les nouvelles colonnes (profession, localisation, statut)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Prochaine étape: Exécuter sql/upgrade_devis_complete.sql';
END $$;
