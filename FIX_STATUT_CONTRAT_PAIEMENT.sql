-- ============================================
-- FIX: STATUT CONTRAT ET SUIVI DES PAIEMENTS
-- ============================================

-- ============================================
-- PARTIE 1: Ajouter colonne statut_paiement au contrat
-- ============================================

-- Ajouter la colonne si elle n'existe pas
ALTER TABLE contrats 
ADD COLUMN IF NOT EXISTS statut_paiement TEXT DEFAULT 'non_paye';

-- Ajouter une contrainte pour les valeurs valides
ALTER TABLE contrats
DROP CONSTRAINT IF EXISTS contrats_statut_paiement_check;

ALTER TABLE contrats
ADD CONSTRAINT contrats_statut_paiement_check 
CHECK (statut_paiement IN ('non_paye', 'acompte_paye', 'totalement_paye'));

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_contrats_statut_paiement 
ON contrats(statut_paiement);


-- ============================================
-- PARTIE 2: Fonction pour mettre à jour le statut du contrat
-- ============================================

CREATE OR REPLACE FUNCTION update_contrat_statut_paiement()
RETURNS TRIGGER AS $$
DECLARE
  total_paye NUMERIC;
  montant_contrat NUMERIC;
  contrat_devis_id UUID;
BEGIN
  -- Récupérer le devis_id du contrat
  SELECT devis_id INTO contrat_devis_id
  FROM contrats
  WHERE id = NEW.contrat_id;

  -- Calculer le total payé pour ce contrat
  SELECT COALESCE(SUM(montant_total), 0) INTO total_paye
  FROM paiements
  WHERE contrat_id = NEW.contrat_id
    AND statut = 'valide';

  -- Récupérer le montant total du contrat depuis le devis
  -- Essayer d'abord dans devis_pro
  SELECT montant_ttc INTO montant_contrat
  FROM devis_pro
  WHERE id = contrat_devis_id;

  -- Si pas trouvé, essayer dans devis (ancienne table)
  IF montant_contrat IS NULL THEN
    SELECT montant_ttc INTO montant_contrat
    FROM devis
    WHERE id = contrat_devis_id;
  END IF;

  -- Mettre à jour le statut du contrat selon le montant payé
  IF total_paye = 0 THEN
    UPDATE contrats
    SET statut_paiement = 'non_paye'
    WHERE id = NEW.contrat_id;
  ELSIF total_paye >= montant_contrat THEN
    UPDATE contrats
    SET statut_paiement = 'totalement_paye'
    WHERE id = NEW.contrat_id;
  ELSE
    UPDATE contrats
    SET statut_paiement = 'acompte_paye'
    WHERE id = NEW.contrat_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- PARTIE 3: Créer le trigger
-- ============================================

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trigger_update_contrat_statut_paiement ON paiements;

-- Créer le trigger qui se déclenche après insertion ou mise à jour d'un paiement
CREATE TRIGGER trigger_update_contrat_statut_paiement
AFTER INSERT OR UPDATE OF statut ON paiements
FOR EACH ROW
WHEN (NEW.statut = 'valide')
EXECUTE FUNCTION update_contrat_statut_paiement();


-- ============================================
-- PARTIE 4: Mettre à jour les contrats existants
-- ============================================

-- Mettre à jour le statut de tous les contrats existants
DO $$
DECLARE
  contrat_record RECORD;
  total_paye NUMERIC;
  montant_contrat NUMERIC;
BEGIN
  FOR contrat_record IN SELECT id, devis_id FROM contrats LOOP
    -- Calculer le total payé
    SELECT COALESCE(SUM(montant_total), 0) INTO total_paye
    FROM paiements
    WHERE contrat_id = contrat_record.id
      AND statut = 'valide';

    -- Récupérer le montant du contrat
    SELECT montant_ttc INTO montant_contrat
    FROM devis_pro
    WHERE id = contrat_record.devis_id;

    IF montant_contrat IS NULL THEN
      SELECT montant_ttc INTO montant_contrat
      FROM devis
      WHERE id = contrat_record.devis_id;
    END IF;

    -- Mettre à jour le statut
    IF total_paye = 0 THEN
      UPDATE contrats SET statut_paiement = 'non_paye' WHERE id = contrat_record.id;
    ELSIF total_paye >= montant_contrat THEN
      UPDATE contrats SET statut_paiement = 'totalement_paye' WHERE id = contrat_record.id;
    ELSE
      UPDATE contrats SET statut_paiement = 'acompte_paye' WHERE id = contrat_record.id;
    END IF;
  END LOOP;
END $$;


-- ============================================
-- PARTIE 5: Tests et vérifications
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ SYSTÈME DE SUIVI DES PAIEMENTS INSTALLÉ!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 MODIFICATIONS APPLIQUÉES:';
  RAISE NOTICE '   ✅ Colonne statut_paiement ajoutée à contrats';
  RAISE NOTICE '   ✅ Contrainte de validation créée';
  RAISE NOTICE '   ✅ Index créé pour les performances';
  RAISE NOTICE '   ✅ Fonction update_contrat_statut_paiement() créée';
  RAISE NOTICE '   ✅ Trigger automatique créé';
  RAISE NOTICE '   ✅ Contrats existants mis à jour';
  RAISE NOTICE '';
  RAISE NOTICE '📊 STATUTS DISPONIBLES:';
  RAISE NOTICE '   • non_paye: Aucun paiement reçu';
  RAISE NOTICE '   • acompte_paye: Acompte payé (paiement partiel)';
  RAISE NOTICE '   • totalement_paye: Montant total payé';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 FONCTIONNEMENT:';
  RAISE NOTICE '   Le statut du contrat se met à jour automatiquement';
  RAISE NOTICE '   quand un paiement passe au statut "valide"';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🚀 PRÊT À UTILISER!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;
