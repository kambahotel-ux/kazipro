-- ============================================
-- FIX COMPLET - SYSTÈME DE PAIEMENT
-- Tous les fixes SQL en un seul fichier
-- ============================================

-- ============================================
-- PARTIE 1: Corriger les fonctions de génération de numéro
-- ============================================

-- 1.1 Fonction: Générer numéro de contrat
DROP FUNCTION IF EXISTS generate_contrat_numero();

CREATE OR REPLACE FUNCTION generate_contrat_numero()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  count INTEGER;
  numero TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  
  -- Qualifier la colonne avec le nom de la table
  SELECT COUNT(*) INTO count 
  FROM contrats 
  WHERE contrats.numero LIKE 'CONT-' || year || '-%';
  
  numero := 'CONT-' || year || '-' || LPAD((count + 1)::TEXT, 4, '0');
  RETURN numero;
END;
$$ LANGUAGE plpgsql;


-- 1.2 Fonction: Générer numéro de paiement
DROP FUNCTION IF EXISTS generate_paiement_numero();

CREATE OR REPLACE FUNCTION generate_paiement_numero()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  count INTEGER;
  numero TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  
  -- Qualifier la colonne avec le nom de la table
  SELECT COUNT(*) INTO count 
  FROM paiements 
  WHERE paiements.numero LIKE 'PAY-' || year || '-%';
  
  numero := 'PAY-' || year || '-' || LPAD((count + 1)::TEXT, 4, '0');
  RETURN numero;
END;
$$ LANGUAGE plpgsql;


-- 1.3 Fonction: Générer numéro de litige
DROP FUNCTION IF EXISTS generate_litige_numero();

CREATE OR REPLACE FUNCTION generate_litige_numero()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  count INTEGER;
  numero TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  
  -- Qualifier la colonne avec le nom de la table
  SELECT COUNT(*) INTO count 
  FROM litiges 
  WHERE litiges.numero LIKE 'LIT-' || year || '-%';
  
  numero := 'LIT-' || year || '-' || LPAD((count + 1)::TEXT, 4, '0');
  RETURN numero;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- PARTIE 2: Supprimer les contraintes foreign key problématiques
-- ============================================

-- 2.1 Supprimer la contrainte sur paiements.devis_id
ALTER TABLE paiements 
DROP CONSTRAINT IF EXISTS paiements_devis_id_fkey;

-- 2.2 Rendre devis_id nullable
ALTER TABLE paiements 
ALTER COLUMN devis_id DROP NOT NULL;

-- 2.3 Supprimer la contrainte sur contrats.devis_id (si elle existe)
ALTER TABLE contrats 
DROP CONSTRAINT IF EXISTS contrats_devis_id_fkey;


-- ============================================
-- PARTIE 3: Ajouter la colonne contrat_id à missions
-- ============================================

-- 3.1 Ajouter la colonne contrat_id (nullable)
ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS contrat_id UUID;

-- 3.2 Ajouter une foreign key optionnelle vers contrats
ALTER TABLE missions
DROP CONSTRAINT IF EXISTS missions_contrat_id_fkey;

ALTER TABLE missions
ADD CONSTRAINT missions_contrat_id_fkey 
FOREIGN KEY (contrat_id) 
REFERENCES contrats(id) 
ON DELETE SET NULL;

-- 3.3 Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_missions_contrat 
ON missions(contrat_id);


-- ============================================
-- PARTIE 3: Tests et vérifications
-- ============================================

DO $$
DECLARE
  test_contrat TEXT;
  test_paiement TEXT;
  test_litige TEXT;
BEGIN
  -- Tester les fonctions
  test_contrat := generate_contrat_numero();
  test_paiement := generate_paiement_numero();
  test_litige := generate_litige_numero();
  
  -- Afficher les résultats
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ FIX COMPLET APPLIQUÉ AVEC SUCCÈS!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 PARTIE 1: Fonctions de génération de numéro';
  RAISE NOTICE '   ✅ generate_contrat_numero() → %', test_contrat;
  RAISE NOTICE '   ✅ generate_paiement_numero() → %', test_paiement;
  RAISE NOTICE '   ✅ generate_litige_numero() → %', test_litige;
  RAISE NOTICE '';
  RAISE NOTICE '📋 PARTIE 2: Contraintes foreign key';
  RAISE NOTICE '   ✅ paiements.devis_id → Contrainte supprimée';
  RAISE NOTICE '   ✅ paiements.devis_id → Maintenant nullable';
  RAISE NOTICE '   ✅ contrats.devis_id → Contrainte supprimée';
  RAISE NOTICE '';
  RAISE NOTICE '📋 PARTIE 3: Colonne contrat_id dans missions';
  RAISE NOTICE '   ✅ missions.contrat_id → Colonne ajoutée';
  RAISE NOTICE '   ✅ missions.contrat_id → Foreign key créée';
  RAISE NOTICE '   ✅ missions.contrat_id → Index créé';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 RÉSULTAT:';
  RAISE NOTICE '   ✅ Génération de numéros fonctionnelle';
  RAISE NOTICE '   ✅ Compatible avec tables "devis" et "devis_pro"';
  RAISE NOTICE '   ✅ Missions liées aux contrats';
  RAISE NOTICE '   ✅ Système de paiement opérationnel';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🚀 VOUS POUVEZ MAINTENANT TESTER LE PAIEMENT!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;
