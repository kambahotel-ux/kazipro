-- ============================================
-- MISE À JOUR TABLE DEVIS - Colonnes Manquantes
-- Phase 1, Tâche 1.2
-- ============================================

-- PARTIE 1: Ajouter les colonnes manquantes
-- ============================================

DO $$
BEGIN
  -- Ajouter frais_deplacement
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'frais_deplacement') THEN
    ALTER TABLE devis ADD COLUMN frais_deplacement DECIMAL(10,2) DEFAULT 0;
    RAISE NOTICE 'Colonne frais_deplacement ajoutée';
  END IF;

  -- Ajouter delai_execution (durée des travaux)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'delai_execution') THEN
    ALTER TABLE devis ADD COLUMN delai_execution TEXT;
    RAISE NOTICE 'Colonne delai_execution ajoutée';
  END IF;

  -- Ajouter delai_intervention (quand peut commencer)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'delai_intervention') THEN
    ALTER TABLE devis ADD COLUMN delai_intervention TEXT;
    RAISE NOTICE 'Colonne delai_intervention ajoutée';
  END IF;

  -- Ajouter validite_devis (date d'expiration)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'validite_devis') THEN
    ALTER TABLE devis ADD COLUMN validite_devis DATE;
    RAISE NOTICE 'Colonne validite_devis ajoutée';
  END IF;

  -- Ajouter garantie (durée de garantie)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'garantie') THEN
    ALTER TABLE devis ADD COLUMN garantie TEXT;
    RAISE NOTICE 'Colonne garantie ajoutée';
  END IF;

  -- Ajouter conditions_paiement (JSONB pour flexibilité)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'conditions_paiement') THEN
    ALTER TABLE devis ADD COLUMN conditions_paiement JSONB;
    RAISE NOTICE 'Colonne conditions_paiement ajoutée';
  END IF;

  -- Ajouter visite_terrain_requise
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'visite_terrain_requise') THEN
    ALTER TABLE devis ADD COLUMN visite_terrain_requise BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Colonne visite_terrain_requise ajoutée';
  END IF;

  -- Ajouter frais_visite_terrain
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'frais_visite_terrain') THEN
    ALTER TABLE devis ADD COLUMN frais_visite_terrain DECIMAL(10,2) DEFAULT 0;
    RAISE NOTICE 'Colonne frais_visite_terrain ajoutée';
  END IF;

  -- Ajouter materiaux_details (JSONB pour liste des matériaux)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'materiaux_details') THEN
    ALTER TABLE devis ADD COLUMN materiaux_details JSONB;
    RAISE NOTICE 'Colonne materiaux_details ajoutée';
  END IF;

  -- Ajouter photos_references (array de URLs)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'photos_references') THEN
    ALTER TABLE devis ADD COLUMN photos_references TEXT[];
    RAISE NOTICE 'Colonne photos_references ajoutée';
  END IF;

  -- Ajouter devise (pour multi-devises)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'devise') THEN
    ALTER TABLE devis ADD COLUMN devise TEXT DEFAULT 'CDF' CHECK (devise IN ('CDF', 'USD', 'EUR'));
    RAISE NOTICE 'Colonne devise ajoutée';
  END IF;

  -- Ajouter nombre_revisions (pour négociation)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'nombre_revisions') THEN
    ALTER TABLE devis ADD COLUMN nombre_revisions INTEGER DEFAULT 0;
    RAISE NOTICE 'Colonne nombre_revisions ajoutée';
  END IF;

  -- Ajouter devis_parent_id (pour révisions)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'devis_parent_id') THEN
    ALTER TABLE devis ADD COLUMN devis_parent_id UUID REFERENCES devis(id) ON DELETE SET NULL;
    RAISE NOTICE 'Colonne devis_parent_id ajoutée';
  END IF;
END $$;

-- PARTIE 2: Créer des indexes pour performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_devis_validite ON devis(validite_devis);
CREATE INDEX IF NOT EXISTS idx_devis_devise ON devis(devise);
CREATE INDEX IF NOT EXISTS idx_devis_parent ON devis(devis_parent_id);
CREATE INDEX IF NOT EXISTS idx_devis_visite_terrain ON devis(visite_terrain_requise);

-- PARTIE 3: Fonction pour créer un devis avec conditions de paiement
-- ============================================

CREATE OR REPLACE FUNCTION creer_devis_avec_conditions(
  p_demande_id UUID,
  p_prestataire_id UUID,
  p_montant_service DECIMAL,
  p_frais_deplacement DECIMAL DEFAULT 0,
  p_tva DECIMAL DEFAULT 16,
  p_acompte_requis BOOLEAN DEFAULT FALSE,
  p_pourcentage_acompte DECIMAL DEFAULT 0,
  p_modalites TEXT DEFAULT NULL,
  p_methodes_acceptees TEXT[] DEFAULT ARRAY['Mobile Money', 'Virement', 'Espèces']
)
RETURNS UUID AS $$
DECLARE
  devis_id UUID;
  montant_total DECIMAL;
  montant_acompte DECIMAL;
  montant_solde DECIMAL;
  conditions JSONB;
BEGIN
  -- Calculer les montants
  montant_total := (p_montant_service + p_frais_deplacement) * (1 + p_tva / 100);
  
  IF p_acompte_requis THEN
    montant_acompte := montant_total * (p_pourcentage_acompte / 100);
    montant_solde := montant_total - montant_acompte;
  ELSE
    montant_acompte := 0;
    montant_solde := montant_total;
  END IF;
  
  -- Créer l'objet conditions_paiement
  conditions := jsonb_build_object(
    'acompte_requis', p_acompte_requis,
    'pourcentage_acompte', p_pourcentage_acompte,
    'montant_acompte', montant_acompte,
    'montant_solde', montant_solde,
    'modalites', p_modalites,
    'methodes_acceptees', p_methodes_acceptees
  );
  
  -- Créer le devis
  INSERT INTO devis (
    demande_id,
    prestataire_id,
    amount,
    montant_ttc,
    montant_ht,
    tva,
    frais_deplacement,
    conditions_paiement,
    status,
    statut
  ) VALUES (
    p_demande_id,
    p_prestataire_id,
    montant_total,
    montant_total,
    p_montant_service + p_frais_deplacement,
    p_tva,
    p_frais_deplacement,
    conditions,
    'pending',
    'en_attente'
  )
  RETURNING id INTO devis_id;
  
  RETURN devis_id;
END;
$$ LANGUAGE plpgsql;

-- PARTIE 4: Fonction pour réviser un devis (négociation)
-- ============================================

CREATE OR REPLACE FUNCTION reviser_devis(
  p_devis_parent_id UUID,
  p_nouveau_montant DECIMAL,
  p_nouvelle_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  nouveau_devis_id UUID;
  parent_devis RECORD;
  nouveau_nombre_revisions INTEGER;
BEGIN
  -- Récupérer le devis parent
  SELECT * INTO parent_devis FROM devis WHERE id = p_devis_parent_id;
  
  -- Vérifier la limite de révisions (max 3)
  IF parent_devis.nombre_revisions >= 3 THEN
    RAISE EXCEPTION 'Limite de révisions atteinte (maximum 3)';
  END IF;
  
  nouveau_nombre_revisions := parent_devis.nombre_revisions + 1;
  
  -- Créer le nouveau devis (révision)
  INSERT INTO devis (
    demande_id,
    prestataire_id,
    amount,
    montant_ttc,
    montant_ht,
    tva,
    frais_deplacement,
    description,
    delai_execution,
    delai_intervention,
    validite_devis,
    garantie,
    conditions_paiement,
    materiaux_details,
    photos_references,
    devise,
    status,
    statut,
    devis_parent_id,
    nombre_revisions
  ) VALUES (
    parent_devis.demande_id,
    parent_devis.prestataire_id,
    p_nouveau_montant,
    p_nouveau_montant,
    p_nouveau_montant / (1 + parent_devis.tva / 100),
    parent_devis.tva,
    parent_devis.frais_deplacement,
    COALESCE(p_nouvelle_description, parent_devis.description),
    parent_devis.delai_execution,
    parent_devis.delai_intervention,
    parent_devis.validite_devis,
    parent_devis.garantie,
    parent_devis.conditions_paiement,
    parent_devis.materiaux_details,
    parent_devis.photos_references,
    parent_devis.devise,
    'pending',
    'en_negociation',
    p_devis_parent_id,
    nouveau_nombre_revisions
  )
  RETURNING id INTO nouveau_devis_id;
  
  -- Marquer l'ancien devis comme retiré
  UPDATE devis 
  SET status = 'rejected',
      statut = 'retire'
  WHERE id = p_devis_parent_id;
  
  RETURN nouveau_devis_id;
END;
$$ LANGUAGE plpgsql;

-- PARTIE 5: Vue pour comparaison de devis
-- ============================================

CREATE OR REPLACE VIEW comparaison_devis AS
SELECT 
  d.id,
  d.demande_id,
  d.prestataire_id,
  p.full_name as prestataire_nom,
  p.profession,
  p.rating as prestataire_note,
  (SELECT COUNT(*) FROM missions WHERE prestataire_id = p.id AND status = 'completed') as nombre_missions,
  d.amount as prix_total,
  d.montant_ttc,
  d.frais_deplacement,
  d.delai_execution,
  d.delai_intervention,
  d.garantie,
  d.conditions_paiement,
  d.validite_devis,
  d.statut,
  d.created_at,
  d.nombre_revisions,
  d.devis_parent_id
FROM devis d
JOIN prestataires p ON d.prestataire_id = p.id
WHERE d.statut IN ('en_attente', 'en_negociation');

-- PARTIE 6: Fonction pour vérifier expiration des devis
-- ============================================

CREATE OR REPLACE FUNCTION verifier_devis_expires()
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  UPDATE devis 
  SET statut = 'expire',
      status = 'rejected'
  WHERE validite_devis < CURRENT_DATE
    AND statut IN ('en_attente', 'en_negociation')
    AND validite_devis IS NOT NULL;
  
  GET DIAGNOSTICS count = ROW_COUNT;
  RETURN count;
END;
$$ LANGUAGE plpgsql;

-- PARTIE 7: Trigger pour vérifier expiration automatiquement
-- ============================================

CREATE OR REPLACE FUNCTION trigger_check_devis_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.validite_devis IS NOT NULL AND NEW.validite_devis < CURRENT_DATE THEN
    NEW.statut := 'expire';
    NEW.status := 'rejected';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_devis_expiration ON devis;
CREATE TRIGGER check_devis_expiration
BEFORE INSERT OR UPDATE ON devis
FOR EACH ROW
EXECUTE FUNCTION trigger_check_devis_expiration();

-- PARTIE 8: Exemple de structure conditions_paiement
-- ============================================

COMMENT ON COLUMN devis.conditions_paiement IS 
'Structure JSONB:
{
  "acompte_requis": true,
  "pourcentage_acompte": 30,
  "montant_acompte": 31500,
  "montant_solde": 73500,
  "modalites": "30% avant début des travaux, 70% après validation",
  "methodes_acceptees": ["Mobile Money", "Virement", "Espèces"]
}';

-- PARTIE 9: Exemple de structure materiaux_details
-- ============================================

COMMENT ON COLUMN devis.materiaux_details IS 
'Structure JSONB:
[
  {
    "nom": "Ciment",
    "marque": "Cimco",
    "quantite": "10 sacs",
    "prix_unitaire": 15000
  },
  {
    "nom": "Sable",
    "quantite": "2 m³",
    "prix_unitaire": 25000
  }
]';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Table devis mise à jour!';
  RAISE NOTICE '1. Colonnes ajoutées:';
  RAISE NOTICE '   - frais_deplacement, delai_execution, delai_intervention';
  RAISE NOTICE '   - validite_devis, garantie, conditions_paiement (JSONB)';
  RAISE NOTICE '   - visite_terrain_requise, frais_visite_terrain';
  RAISE NOTICE '   - materiaux_details (JSONB), photos_references';
  RAISE NOTICE '   - devise, nombre_revisions, devis_parent_id';
  RAISE NOTICE '2. Indexes créés pour performance';
  RAISE NOTICE '3. Fonctions créées:';
  RAISE NOTICE '   - creer_devis_avec_conditions()';
  RAISE NOTICE '   - reviser_devis() (pour négociation)';
  RAISE NOTICE '   - verifier_devis_expires()';
  RAISE NOTICE '4. Vue comparaison_devis créée';
  RAISE NOTICE '5. Trigger expiration automatique créé';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Exemple conditions_paiement:';
  RAISE NOTICE '   {"acompte_requis": true, "pourcentage_acompte": 30, ...}';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Prochaine étape: Exécuter sql/create_missing_tables.sql';
END $$;
